/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
/**
 * Shared helpers for the Next.js BFF proxy.
 *
 * All state-changing requests from the browser go through `/api/*`. This
 * file centralises cookie handling, CSRF validation, Symfony forwarding,
 * impersonation token routing and the silent-refresh retry loop so
 * individual route handlers stay small.
 *
 * Cookie names, TTLs, Symfony URL, token generation, and the Symfony
 * refresh-token call are imported from `src/config/server.config.ts` so the
 * BFF, the edge proxy, and the RSC server-fetch helper all agree.
 *
 * Impersonation rules (single source of truth):
 *
 *   1. `sh_impersonate` is httpOnly. JS cannot read it — preventing XSS
 *      from stealing the token.
 *   2. The catch-all proxy uses it as the Authorization header for every
 *      request that goes upstream EXCEPT the auth flow (`/auth/*`).
 *      Auth/refresh/logout always run as the *original admin* so the
 *      admin can stop impersonating cleanly even if the impersonation
 *      JWT is already expired or blacklisted.
 *   3. The matching `sh_impersonate_target_email` cookie is non-httpOnly
 *      and contains nothing but the target user's email. The browser
 *      reads it to draw the "You are impersonating ..." banner.
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
import {
    IMPERSONATE_COOKIE,
    IMPERSONATE_TARGET_EMAIL_COOKIE,
} from '../../../config/cookie-names';

export {
    AUTH_COOKIE,
    REFRESH_COOKIE,
    CSRF_COOKIE,
    SYMFONY_API_PREFIX,
    SYMFONY_INTERNAL_URL,
    IMPERSONATE_COOKIE,
    IMPERSONATE_TARGET_EMAIL_COOKIE,
};

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

/**
 * Persist a freshly minted impersonation session.
 *
 *   - The JWT lands in `sh_impersonate` as **httpOnly**. JavaScript cannot
 *     read it; only this BFF or Symfony ever sees the value.
 *   - `target_email` lands in `sh_impersonate_target_email` (NOT httpOnly)
 *     so the React banner can show who is being impersonated. This cookie
 *     intentionally contains no secret material.
 *
 * `ttlSeconds` is the value Symfony returned in `expires_in`; the cookie
 * lifetime always tracks the JWT lifetime exactly so the banner cannot
 * survive a token that has already expired.
 */
export function setImpersonationCookies(
    res: NextResponse,
    token: string,
    targetEmail: string,
    ttlSeconds: number
): void {
    res.cookies.set(IMPERSONATE_COOKIE, token, {
        ...COOKIE_COMMON,
        httpOnly: true,
        maxAge: ttlSeconds,
    });
    res.cookies.set(IMPERSONATE_TARGET_EMAIL_COOKIE, targetEmail, {
        ...COOKIE_COMMON,
        httpOnly: false,
        maxAge: ttlSeconds,
    });
}

/** Clear both impersonation cookies. */
export function clearImpersonationCookies(res: NextResponse): void {
    res.cookies.set(IMPERSONATE_COOKIE, '', { ...COOKIE_COMMON, httpOnly: true, maxAge: 0 });
    res.cookies.set(IMPERSONATE_TARGET_EMAIL_COOKIE, '', { ...COOKIE_COMMON, httpOnly: false, maxAge: 0 });
}

export function clearAuthCookies(res: NextResponse): void {
    res.cookies.set(AUTH_COOKIE, '', { ...COOKIE_COMMON, httpOnly: true, maxAge: 0 });
    res.cookies.set(REFRESH_COOKIE, '', { ...COOKIE_COMMON, httpOnly: true, maxAge: 0 });
    clearImpersonationCookies(res);
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
 * Routes that operate on the admin's *session itself* — minting,
 * refreshing or invalidating the original `sh_auth` cookie. These
 * ALWAYS run with the admin token even during an impersonation session,
 * so the admin can:
 *   - keep their own session alive while impersonating (refresh),
 *   - log out cleanly (logout never accidentally targets the impersonated
 *     user's session),
 *   - finish a 2FA challenge that started before impersonation,
 *   - change their own preferred language without affecting the target.
 *
 * Everything else — `/auth/user-data`, `/auth/events`, the entire
 * `/admin/*` and `/pages/*` surfaces — must follow the impersonation
 * token, otherwise the SSR + client renders disagree about who the
 * "current user" is and the UI shows a Frankenstein mix of admin
 * identity / target ACL.
 */
const ADMIN_SESSION_ROUTE_PREFIXES = [
    '/auth/login',
    '/auth/logout',
    '/auth/refresh-token',
    '/auth/two-factor',
    '/auth/set-language',
];

function isAdminSessionRoute(upstreamPath: string): boolean {
    // `upstreamPath` is the full URL that includes the `/cms-api/v1`
    // prefix (e.g. `http://symfony/cms-api/v1/auth/refresh-token`), so
    // we match by `endsWith(prefix.length)`-style substring against
    // `${API_PREFIX}${prefix}` to keep the comparison anchored.
    return ADMIN_SESSION_ROUTE_PREFIXES.some((prefix) =>
        upstreamPath.includes(`${SYMFONY_API_PREFIX}${prefix}`)
    );
}

/**
 * Choose which JWT to send upstream.
 *
 *   - If `overrideAccessToken` is supplied (silent refresh just rotated
 *     the admin token) we always use it — silent refresh runs as the
 *     admin.
 *   - For admin-session-lifecycle routes (login/logout/refresh/2FA/
 *     set-language) we DELIBERATELY ignore the impersonation cookie.
 *     See {@link ADMIN_SESSION_ROUTE_PREFIXES} for the rationale.
 *   - For everything else (including `/auth/user-data`, `/auth/events`
 *     and the entire `/admin/*` + `/pages/*` surfaces) we prefer
 *     `sh_impersonate` and fall back to `sh_auth`.
 *
 * Returns `null` when no token is available — the caller decides
 * whether to drop the Authorization header or proxy the request as
 * anonymous.
 */
function pickUpstreamToken(
    upstreamPath: string,
    impersonationToken: string | undefined,
    authToken: string | undefined,
    overrideAccessToken: string | null | undefined
): string | null {
    if (overrideAccessToken) return overrideAccessToken;

    if (isAdminSessionRoute(upstreamPath)) {
        return authToken ?? null;
    }

    if (impersonationToken) return impersonationToken;
    if (authToken) return authToken;
    return null;
}

/**
 * Replay a buffered request to Symfony with the given (optional) access
 * token overriding whatever is in the cookie jar. Pass no token to use
 * the current `sh_auth` cookie; pass the new token after a silent
 * refresh so the retry uses the fresh credentials immediately.
 *
 * Impersonation: when an `sh_impersonate` cookie is present and we are
 * NOT proxying to `/auth/*`, the impersonation token wins over the admin
 * cookie. See `pickUpstreamToken`.
 */
export async function forwardBufferedToSymfony(
    buffered: BufferedRequest,
    upstreamUrl: string,
    overrideAccessToken?: string | null,
): Promise<Response> {
    const headers = new Headers(buffered.headers);

    const jar = await cookies();
    const impersonationToken = jar.get(IMPERSONATE_COOKIE)?.value;
    const authToken = jar.get(AUTH_COOKIE)?.value;

    const token = pickUpstreamToken(upstreamUrl, impersonationToken, authToken, overrideAccessToken);

    if (token) {
        headers.set('Authorization', `Bearer ${token}`);
    } else {
        headers.delete('authorization');
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
 * Strip the impersonation token from a Symfony envelope. Mirrors
 * `stripTokensFromBody` but is specific to the impersonation start
 * endpoint, where `data.impersonation_token` is the only secret we
 * need to hoist into an httpOnly cookie.
 */
export function stripImpersonationFromBody(payload: unknown): {
    body: unknown;
    impersonation: { token: string; targetEmail: string; expiresIn: number } | null;
} {
    if (!payload || typeof payload !== 'object') {
        return { body: payload, impersonation: null };
    }
    const data = (payload as { data?: unknown }).data;
    if (!data || typeof data !== 'object') {
        return { body: payload, impersonation: null };
    }

    const {
        impersonation_token,
        target_email,
        expires_in,
        ...rest
    } = data as {
        impersonation_token?: string;
        target_email?: string;
        expires_in?: number;
        [key: string]: unknown;
    };

    if (!impersonation_token || !target_email || !expires_in) {
        return { body: payload, impersonation: null };
    }

    return {
        body: {
            ...(payload as Record<string, unknown>),
            data: { ...rest, target_email, expires_in },
        },
        impersonation: {
            token: impersonation_token,
            targetEmail: target_email,
            expiresIn: expires_in,
        },
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
