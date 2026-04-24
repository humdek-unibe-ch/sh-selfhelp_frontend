/**
 * Next.js **proxy** (formerly `middleware.ts`, renamed in Next 16.0) —
 * runs on every matching request before the page renders. Responsibilities:
 *
 *   1. **Preemptive silent refresh of the access token (SSR path)**. If the
 *      `sh_auth` JWT is past its `exp` (or within a short safety window)
 *      *and* a `sh_refresh` cookie is present, we POST to Symfony
 *      `/auth/refresh-token`, rotate both cookies on the outgoing response,
 *      and — crucially — rewrite `req.cookies` so Server Components that
 *      run for this very request read the *new* access token. Without this
 *      step every navigation made after the access-token TTL elapsed would
 *      land on a 404 (the Server Component's direct Symfony call would 401,
 *      `server-fetch.ts` returns `null`, the page calls `notFound()`).
 *      If the refresh itself fails, both cookies are wiped so the admin
 *      gate / login flow kicks in. This mirrors the silent-refresh retry
 *      loop in the `/api/*` BFF catch-all, but moved one level earlier so
 *      SSR page renders benefit from the same guarantee.
 *
 *   2. **Admin cookie gate (fast path only)**: redirect to `/auth/login` if
 *      `/admin/*` is requested without an `sh_auth` cookie. The cookie is
 *      httpOnly so the proxy can read it even though the browser JS
 *      cannot. *This is NOT a full auth check*; a forged cookie would still
 *      reach Symfony which then rejects the request. It only avoids rendering
 *      the admin shell for obviously-unauthenticated users.
 *
 *   3. **`sh_accept_locale` bootstrap**: capture the browser's preferred
 *      locale tag (e.g. `en-GB`, `de-CH`) as a *hint*. The actual locale →
 *      language-id resolution happens in the root Server Component via
 *      `resolveLanguageSSR`, which consults the live `/languages` list (the
 *      `languages` table is user-editable, so a hardcoded map here would
 *      drift the moment an admin renames / deletes / adds a language).
 *      We deliberately do NOT initialise `sh_lang` (the numeric id cookie)
 *      here — only the app writes that, once it has verified the id
 *      against the authoritative list.
 *
 *   4. **`sh_csrf` bootstrap**: set a random token once per browser so the
 *      double-submit pattern used by `/api/*` POST/PUT/PATCH/DELETE works.
 *
 * ## File location (important)
 * Next 16 requires this file to live in the **`src/` folder** when the app
 * uses `src/app/` (which we do). Keeping it at the project root silently
 * disables it — no error, just no execution. That is exactly what bit us:
 * a stale `middleware.ts` at the repo root was being ignored, so `sh_csrf`
 * was never bootstrapped and every browser-initiated mutation returned
 * `403 CSRF validation failed` on a fresh session.
 *
 * ## File name (important)
 * Next 16 also renamed the file convention from `middleware.ts` to
 * `proxy.ts`, and the exported function from `middleware` to `proxy`. The
 * old name is deprecated and no longer guaranteed to execute.
 */

import { NextRequest, NextResponse } from 'next/server';
import {
    ACCESS_COOKIE_MAX_AGE,
    AUTH_COOKIE,
    CSRF_COOKIE,
    LOCALE_HINT_COOKIE,
    LONG_LIVED_COOKIE_MAX_AGE,
    REFRESH_COOKIE,
    REFRESH_COOKIE_MAX_AGE,
    REFRESH_SAFETY_WINDOW_SECONDS,
    callSymfonyRefreshToken,
    randomHexToken,
    type IRefreshedTokens,
} from './config/server.config';

/**
 * Parse `Accept-Language` and return the caller's highest-priority locale
 * tag, unchanged (e.g. `en-GB`). Returns `null` when no usable tag exists.
 *
 * We do *not* coerce to a language id: the id mapping is DB-driven and
 * resolved on the server side by `resolveLanguageSSR`.
 */
function pickAcceptLocale(header: string | null): string | null {
    if (!header) return null;
    const entries = header
        .split(',')
        .map((part) => {
            const [tag, qPart] = part.trim().split(';');
            const q = qPart ? parseFloat(qPart.replace('q=', '')) : 1;
            return { tag: tag.toLowerCase(), q: isNaN(q) ? 0 : q };
        })
        .filter((e) => e.tag && e.q > 0)
        .sort((a, b) => b.q - a.q);

    return entries[0]?.tag ?? null;
}

/**
 * Decode a JWT's payload without verifying its signature. Safe here because
 * we produced the cookie ourselves and only need to read the `exp` claim to
 * decide whether to refresh. Returns `null` on any malformed input.
 */
function decodeJwtPayload(token: string): { exp?: number } | null {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    try {
        const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
        const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
        const json = atob(padded);
        return JSON.parse(json);
    } catch {
        return null;
    }
}

/** True when the JWT is past (or within the safety window of) its `exp`. */
function isAccessTokenExpired(token: string): boolean {
    const payload = decodeJwtPayload(token);
    if (!payload || typeof payload.exp !== 'number') {
        // Malformed / unexpected shape → treat as expired. The refresh step
        // will either succeed (issuing a new valid token) or clear cookies.
        return true;
    }
    const nowSec = Math.floor(Date.now() / 1000);
    return payload.exp <= nowSec + REFRESH_SAFETY_WINDOW_SECONDS;
}

export async function proxy(req: NextRequest): Promise<NextResponse> {
    const { pathname } = req.nextUrl;
    const secure = req.nextUrl.protocol === 'https:';

    // ── (1) Preemptive silent refresh ───────────────────────────────────
    // Run this BEFORE the admin gate. A valid refresh token should *never*
    // bounce the user to /auth/login on a navigation — they should simply
    // receive fresh access credentials transparently.
    const authCookie = req.cookies.get(AUTH_COOKIE)?.value;
    const refreshCookie = req.cookies.get(REFRESH_COOKIE)?.value;

    let refreshed: IRefreshedTokens | null = null;
    let sessionCleared = false;

    if (authCookie && isAccessTokenExpired(authCookie)) {
        if (refreshCookie) {
            refreshed = await callSymfonyRefreshToken(refreshCookie);
            if (refreshed) {
                // Forward updated cookies to the downstream request so any
                // Server Component that calls `cookies()` during this render
                // sees the freshly rotated access token, not the expired one.
                req.cookies.set(AUTH_COOKIE, refreshed.access_token);
                req.cookies.set(REFRESH_COOKIE, refreshed.refresh_token);
                if (process.env.NODE_ENV !== 'production') {
                    // Helpful trace when exercising the flow with a short
                    // JWT_TOKEN_TTL. Silent in production.
                    // eslint-disable-next-line no-console
                    console.log(
                        '[proxy] silent refresh succeeded',
                        { pathname }
                    );
                }
            } else {
                // Refresh token itself was invalid/expired. Wipe both so the
                // downstream admin gate (and any client-side auth check)
                // treats this as logged-out.
                req.cookies.delete(AUTH_COOKIE);
                req.cookies.delete(REFRESH_COOKIE);
                sessionCleared = true;
                if (process.env.NODE_ENV !== 'production') {
                    // eslint-disable-next-line no-console
                    console.log(
                        '[proxy] silent refresh failed — clearing session',
                        { pathname }
                    );
                }
            }
        } else {
            // Access token expired and no refresh cookie: treat as logged out.
            req.cookies.delete(AUTH_COOKIE);
            sessionCleared = true;
        }
    }

    // ── (2) Admin fast-path gate ────────────────────────────────────────
    // Use the *updated* req.cookies (after any refresh above).
    if (pathname.startsWith('/admin')) {
        if (!req.cookies.get(AUTH_COOKIE)?.value) {
            const loginUrl = req.nextUrl.clone();
            loginUrl.pathname = '/auth/login';
            loginUrl.searchParams.set('redirect', pathname + req.nextUrl.search);
            const redirectResponse = NextResponse.redirect(loginUrl);
            if (sessionCleared) {
                redirectResponse.cookies.set(AUTH_COOKIE, '', {
                    path: '/',
                    httpOnly: true,
                    maxAge: 0,
                    sameSite: 'lax',
                    secure,
                });
                redirectResponse.cookies.set(REFRESH_COOKIE, '', {
                    path: '/',
                    httpOnly: true,
                    maxAge: 0,
                    sameSite: 'lax',
                    secure,
                });
            }
            return redirectResponse;
        }
    }

    // ── (3) Build the normal response, propagating any cookie mutations ──
    // `NextResponse.next({ request: { headers } })` re-exposes the updated
    // request cookies (req.cookies.set mutated req.headers under the hood)
    // to the downstream Server Component render, so `cookies()` there reads
    // the fresh access token we just obtained.
    const response = NextResponse.next({
        request: {
            headers: req.headers,
        },
    });

    // Persist the rotated (or cleared) auth cookies on the outgoing response
    // so the browser replaces what it had.
    if (refreshed) {
        response.cookies.set(AUTH_COOKIE, refreshed.access_token, {
            path: '/',
            httpOnly: true,
            sameSite: 'lax',
            secure,
            maxAge: ACCESS_COOKIE_MAX_AGE,
        });
        response.cookies.set(REFRESH_COOKIE, refreshed.refresh_token, {
            path: '/',
            httpOnly: true,
            sameSite: 'lax',
            secure,
            maxAge: REFRESH_COOKIE_MAX_AGE,
        });
    } else if (sessionCleared) {
        response.cookies.set(AUTH_COOKIE, '', {
            path: '/',
            httpOnly: true,
            maxAge: 0,
            sameSite: 'lax',
            secure,
        });
        response.cookies.set(REFRESH_COOKIE, '', {
            path: '/',
            httpOnly: true,
            maxAge: 0,
            sameSite: 'lax',
            secure,
        });
    }

    // ── (4) sh_accept_locale bootstrap — locale *hint* only ─────────────
    if (!req.cookies.get(LOCALE_HINT_COOKIE)) {
        const locale = pickAcceptLocale(req.headers.get('accept-language'));
        if (locale) {
            response.cookies.set(LOCALE_HINT_COOKIE, locale, {
                path: '/',
                sameSite: 'lax',
                secure,
                maxAge: LONG_LIVED_COOKIE_MAX_AGE,
            });
        }
    }

    // ── (5) sh_csrf bootstrap ───────────────────────────────────────────
    // Non-httpOnly so the browser can read it to build the X-CSRF-Token
    // header for mutating requests.
    if (!req.cookies.get(CSRF_COOKIE)) {
        response.cookies.set(CSRF_COOKIE, randomHexToken(), {
            path: '/',
            sameSite: 'lax',
            secure,
            maxAge: LONG_LIVED_COOKIE_MAX_AGE,
        });
    }

    return response;
}

export const config = {
    // Exclude Next internals, API routes (they handle their own cookies), and
    // static asset extensions. Everything else triggers the proxy.
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|api/|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico|css|js|map|woff|woff2|ttf)$).*)',
    ],
};
