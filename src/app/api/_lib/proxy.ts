/**
 * Shared helpers for the Next.js BFF proxy.
 *
 * All state-changing requests from the browser go through `/api/*`. This file
 * centralises cookie handling, CSRF validation, Symfony forwarding, and the
 * silent-refresh retry loop so individual route handlers stay small.
 *
 * Cookie names, TTLs, Symfony URL, token generation, and the Symfony
 * refresh-token call are imported from `src/config/server.config.ts` so the
 * BFF, the edge proxy, and the RSC server-fetch helper all agree.
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import {
    ACCESS_COOKIE_MAX_AGE,
    AUTH_COOKIE,
    CSRF_COOKIE,
    REFRESH_COOKIE,
    REFRESH_COOKIE_MAX_AGE,
    SYMFONY_API_PREFIX,
    SYMFONY_INTERNAL_URL,
    callSymfonyRefreshToken,
} from '../../../config/server.config';

export { AUTH_COOKIE, REFRESH_COOKIE, CSRF_COOKIE, SYMFONY_API_PREFIX, SYMFONY_INTERNAL_URL };

const COOKIE_COMMON = {
    path: '/',
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
} as const;

/** HTTP methods that never mutate state and have empty request bodies. */
export const SAFE_METHODS: ReadonlySet<string> = new Set(['GET', 'HEAD', 'OPTIONS']);

/** Headers the proxy must never leak upstream or back downstream. */
const HOP_BY_HOP_HEADERS = new Set([
    'connection',
    'keep-alive',
    'proxy-authenticate',
    'proxy-authorization',
    'te',
    'trailers',
    'transfer-encoding',
    'upgrade',
    'content-length',
    'host',
]);

const UPSTREAM_HEADERS_TO_DROP = new Set([
    'server',
    'x-powered-by',
    'set-cookie',
]);

/**
 * Validates the CSRF double-submit pattern: the `X-CSRF-Token` header must
 * match the `sh_csrf` cookie. GET/HEAD requests skip validation.
 *
 * Returns `null` on success, or a pre-built 403 response on failure.
 */
export function validateCsrf(req: NextRequest): NextResponse | null {
    if (SAFE_METHODS.has(req.method)) {
        return null;
    }

    const cookieToken = req.cookies.get(CSRF_COOKIE)?.value;
    const headerToken = req.headers.get('x-csrf-token');

    if (!cookieToken || !headerToken || cookieToken !== headerToken) {
        if (process.env.NODE_ENV !== 'production') {
            // Help developers diagnose the most common cause (missing
            // proxy cookie or a raw `curl`/Postman call without the
            // header). Never logged in production.
            // eslint-disable-next-line no-console
            console.warn(
                '[BFF CSRF] validation failed',
                {
                    path: req.nextUrl.pathname,
                    method: req.method,
                    hasCookie: Boolean(cookieToken),
                    hasHeader: Boolean(headerToken),
                    cookieMatchesHeader: cookieToken && headerToken ? cookieToken === headerToken : false,
                },
            );
        }
        return NextResponse.json(
            { error: 'CSRF validation failed', logged_in: false, status: 403, message: 'CSRF validation failed', meta: {}, data: null },
            { status: 403 }
        );
    }
    return null;
}

/**
 * Set the access/refresh cookies on the response. Both are httpOnly.
 */
export function setAuthCookies(res: NextResponse, tokens: { access_token?: string | null; refresh_token?: string | null }): void {
    if (tokens.access_token) {
        res.cookies.set(AUTH_COOKIE, tokens.access_token, {
            ...COOKIE_COMMON,
            httpOnly: true,
            maxAge: ACCESS_COOKIE_MAX_AGE,
        });
    }
    if (tokens.refresh_token) {
        res.cookies.set(REFRESH_COOKIE, tokens.refresh_token, {
            ...COOKIE_COMMON,
            httpOnly: true,
            maxAge: REFRESH_COOKIE_MAX_AGE,
        });
    }
}

export function clearAuthCookies(res: NextResponse): void {
    res.cookies.set(AUTH_COOKIE, '', { ...COOKIE_COMMON, httpOnly: true, maxAge: 0 });
    res.cookies.set(REFRESH_COOKIE, '', { ...COOKIE_COMMON, httpOnly: true, maxAge: 0 });
}

/**
 * Builds the absolute upstream Symfony URL for a given incoming path.
 * Accepts an array segment list (from a catch-all) or a raw path string.
 */
export function buildUpstreamUrl(pathOrSegments: string | string[], search: string = ''): string {
    const path = Array.isArray(pathOrSegments) ? pathOrSegments.join('/') : pathOrSegments.replace(/^\/+/, '');
    return `${SYMFONY_INTERNAL_URL}${SYMFONY_API_PREFIX}/${path}${search}`;
}

/**
 * Fully-materialised view of an incoming request so the catch-all proxy
 * can replay it verbatim after a silent refresh. The body is buffered as
 * an `ArrayBuffer` (or `null` for GET/HEAD) — `fetch` accepts both on Node.
 */
export interface BufferedRequest {
    method: string;
    headers: Headers;
    body: ArrayBuffer | null;
}

/**
 * Read the request once and freeze the relevant parts. We strip hop-by-hop
 * headers here so individual handlers stay agnostic. The body is only
 * consumed for unsafe methods; GET/HEAD/OPTIONS get `null`.
 */
export async function bufferRequest(req: NextRequest): Promise<BufferedRequest> {
    const headers = new Headers();
    req.headers.forEach((value, key) => {
        if (!HOP_BY_HOP_HEADERS.has(key.toLowerCase())) {
            headers.set(key, value);
        }
    });
    headers.set('X-Client-Type', 'web');
    headers.set('Accept', 'application/json');

    let body: ArrayBuffer | null = null;
    if (!SAFE_METHODS.has(req.method)) {
        const ab = await req.arrayBuffer();
        body = ab.byteLength > 0 ? ab : null;
    }

    return { method: req.method, headers, body };
}

/**
 * Replay a buffered request to Symfony with the given (optional) access
 * token overriding whatever is in the cookie jar. Pass no token to use
 * the current `sh_auth` cookie; pass the new token after a silent
 * refresh so the retry uses the fresh credentials immediately.
 */
export async function forwardBufferedToSymfony(
    buffered: BufferedRequest,
    upstreamUrl: string,
    overrideAccessToken?: string | null,
): Promise<Response> {
    const headers = new Headers(buffered.headers);

    if (overrideAccessToken) {
        headers.set('Authorization', `Bearer ${overrideAccessToken}`);
    } else {
        const jar = await cookies();
        const auth = jar.get(AUTH_COOKIE)?.value;
        if (auth) {
            headers.set('Authorization', `Bearer ${auth}`);
        } else {
            headers.delete('authorization');
        }
    }

    const init: RequestInit = {
        method: buffered.method,
        headers,
        redirect: 'manual',
    };
    if (buffered.body) {
        init.body = buffered.body;
    }

    return fetch(upstreamUrl, init);
}

/**
 * Attempt an internal refresh using the sh_refresh cookie. Returns the new
 * tokens on success, or null on failure (in which case the caller should
 * respond 401 and clear cookies). Thin wrapper around
 * `callSymfonyRefreshToken` that pulls the refresh token from the Node
 * request cookie jar.
 */
export async function refreshInternal(): Promise<{ access_token: string; refresh_token: string } | null> {
    const jar = await cookies();
    const refresh = jar.get(REFRESH_COOKIE)?.value;
    if (!refresh) return null;
    return callSymfonyRefreshToken(refresh);
}

/**
 * Split a Symfony JSON envelope into (tokens, body-without-tokens).
 *
 * Symfony sometimes folds rotated JWTs into `data.access_token` /
 * `data.refresh_token` — for example on `/auth/login`, `/auth/refresh-token`,
 * or `/auth/set-language`. The BFF must hoist those tokens into httpOnly
 * cookies and scrub them from the JSON before handing the envelope back
 * to the browser, so the access/refresh tokens never touch the DOM or
 * the React Query cache.
 *
 * Returns:
 *  - `tokens`: `null` when the envelope carries no rotation, or a partial
 *    `{access_token?, refresh_token?}` pair otherwise.
 *  - `body`: the same envelope with those two keys removed from `data`.
 *    Non-object payloads are returned unchanged.
 */
export function stripTokensFromBody(payload: unknown): {
    body: unknown;
    tokens: { access_token?: string; refresh_token?: string } | null;
} {
    if (!payload || typeof payload !== 'object') {
        return { body: payload, tokens: null };
    }
    const data = (payload as { data?: unknown }).data;
    if (!data || typeof data !== 'object') {
        return { body: payload, tokens: null };
    }

    const {
        access_token,
        refresh_token,
        ...rest
    } = data as { access_token?: string; refresh_token?: string; [key: string]: unknown };

    if (!access_token && !refresh_token) {
        return { body: payload, tokens: null };
    }

    const tokens: { access_token?: string; refresh_token?: string } = {};
    if (access_token) tokens.access_token = access_token;
    if (refresh_token) tokens.refresh_token = refresh_token;

    return {
        body: { ...(payload as Record<string, unknown>), data: rest },
        tokens,
    };
}

/**
 * Clone an upstream response into a NextResponse, stripping hop-by-hop and
 * sensitive headers. The body is passed through as a stream.
 */
export function cloneUpstreamResponse(upstream: Response): NextResponse {
    const headers = new Headers();
    upstream.headers.forEach((value, key) => {
        const k = key.toLowerCase();
        if (HOP_BY_HOP_HEADERS.has(k) || UPSTREAM_HEADERS_TO_DROP.has(k)) return;
        headers.set(key, value);
    });
    return new NextResponse(upstream.body, {
        status: upstream.status,
        headers,
    });
}
