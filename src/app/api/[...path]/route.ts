/**
 * Catch-all BFF proxy.
 *
 * Forwards every `/api/*` request to Symfony, keeping the JWT out of the
 * browser. Silent refresh on 401 is handled here for *all* methods —
 * including mutations — by buffering the request body once so we can replay
 * it with the new access token. This is the single choke point for:
 *
 *   - CSRF double-submit validation.
 *   - Attaching `Authorization: Bearer <sh_auth>`.
 *   - Token rotation when the upstream body carries a new access token.
 *   - Silent refresh + transparent retry on 401.
 *
 * Downstream clients therefore see either a 2xx/4xx/5xx from Symfony (the
 * common case) or a clean 401 with cleared cookies (the session really is
 * dead). They never see the rotation handshake.
 */

import { NextRequest, NextResponse } from 'next/server';
import {
    buildUpstreamUrl,
    cloneUpstreamResponse,
    clearAuthCookies,
    refreshInternal,
    setAuthCookies,
    stripTokensFromBody,
    validateCsrf,
    SAFE_METHODS,
    forwardBufferedToSymfony,
    type BufferedRequest,
    bufferRequest,
} from '../_lib/proxy';

export const dynamic = 'force-dynamic';

interface IRefreshedTokenPair {
    access_token: string;
    refresh_token: string;
}

/**
 * Clone the upstream response, and if the JSON body carries a fresh token
 * pair (e.g. from `/auth/set-language`), move those tokens into httpOnly
 * cookies and scrub them from the body.
 *
 * The optional `fallbackTokens` argument is the token pair obtained from a
 * silent refresh that preceded the replayed upstream call. It's applied to
 * the response **first**, so that if the upstream body also carries tokens
 * (a second rotation, newer than the refresh pair), those body tokens take
 * precedence — the `res.cookies.set` call wins on duplicate names.
 */
async function buildResponseWithCookieRotation(
    upstream: Response,
    fallbackTokens: IRefreshedTokenPair | null
): Promise<NextResponse> {
    const contentType = upstream.headers.get('content-type') || '';

    if (!contentType.includes('application/json')) {
        const res = cloneUpstreamResponse(upstream);
        if (fallbackTokens) setAuthCookies(res, fallbackTokens);
        return res;
    }

    const text = await upstream.text();
    if (!text) {
        const res = new NextResponse(null, { status: upstream.status });
        upstream.headers.forEach((v, k) => {
            const key = k.toLowerCase();
            if (key === 'set-cookie' || key === 'transfer-encoding' || key === 'content-length') return;
            res.headers.set(k, v);
        });
        if (fallbackTokens) setAuthCookies(res, fallbackTokens);
        return res;
    }

    let payload: any = null;
    try {
        payload = JSON.parse(text);
    } catch {
        const res = new NextResponse(text, {
            status: upstream.status,
            headers: { 'Content-Type': contentType },
        });
        if (fallbackTokens) setAuthCookies(res, fallbackTokens);
        return res;
    }

    const { body: cleanBody, tokens } = stripTokensFromBody(payload);
    if (tokens) {
        const res = NextResponse.json(cleanBody, { status: upstream.status });
        // Set the refresh-pair first (if any), then overwrite with the body
        // tokens — those are the newest rotation the caller should keep.
        if (fallbackTokens) setAuthCookies(res, fallbackTokens);
        setAuthCookies(res, tokens);
        return res;
    }

    const res = new NextResponse(text, {
        status: upstream.status,
        headers: { 'Content-Type': 'application/json' },
    });
    if (fallbackTokens) setAuthCookies(res, fallbackTokens);
    return res;
}

async function handle(req: NextRequest, context: { params: Promise<{ path: string[] }> }): Promise<NextResponse> {
    const csrfFail = validateCsrf(req);
    if (csrfFail) return csrfFail;

    const { path } = await context.params;
    const search = req.nextUrl.search || '';
    const upstreamUrl = buildUpstreamUrl(path, search);

    // Buffer the incoming request once so that if a silent refresh
    // succeeds we can replay the exact same request with a fresh access
    // token. For GET/HEAD the body is empty, so this is effectively free.
    const buffered: BufferedRequest = await bufferRequest(req);

    let upstream = await forwardBufferedToSymfony(buffered, upstreamUrl);

    if (upstream.status === 401) {
        const refreshed = await refreshInternal();
        if (refreshed) {
            // Transparent retry with rotated token. Works for every HTTP
            // method because `buffered.body` is an `ArrayBuffer` we can
            // replay any number of times.
            upstream = await forwardBufferedToSymfony(buffered, upstreamUrl, refreshed.access_token);
            return buildResponseWithCookieRotation(upstream, refreshed);
        }

        // Refresh failed — session is genuinely dead. Clear cookies and
        // surface the original 401 payload so the client can react.
        const response = cloneUpstreamResponse(upstream);
        clearAuthCookies(response);
        return response;
    }

    // Keep a simple early-out for GET/HEAD so we don't parse the body
    // unnecessarily when Symfony has nothing to rotate.
    if (SAFE_METHODS.has(req.method)) {
        return cloneUpstreamResponse(upstream);
    }

    return buildResponseWithCookieRotation(upstream, null);
}

export const GET = handle;
export const POST = handle;
export const PUT = handle;
export const PATCH = handle;
export const DELETE = handle;
export const HEAD = handle;
export const OPTIONS = handle;
