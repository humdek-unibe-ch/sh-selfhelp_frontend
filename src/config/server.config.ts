/**
 * Shared server-side configuration.
 *
 * Importable from:
 *   - `src/proxy.ts` (Edge runtime — Next.js proxy/middleware)
 *   - `src/app/api/**` (Node runtime — BFF route handlers)
 *   - `src/app/_lib/server-fetch.ts` (Node runtime — Server Components)
 *
 * Browser code must NOT import from here (names like `SYMFONY_INTERNAL_URL`
 * would leak internal hostnames into the client bundle). This file uses only
 * Web-platform APIs (`crypto.getRandomValues`, `fetch`), so it is safe for
 * both Edge and Node runtimes.
 */
// ──────────────────────────────────────────────────────────────────────────
// Cookie names (re-exported from the isomorphic `cookie-names` module so
// client-side utilities can import the constants without dragging in any of
// the server-only helpers below).
// ──────────────────────────────────────────────────────────────────────────

export {
    AUTH_COOKIE,
    REFRESH_COOKIE,
    CSRF_COOKIE,
    LANG_COOKIE,
    LOCALE_HINT_COOKIE,
    LONG_LIVED_COOKIE_MAX_AGE,
} from './cookie-names';

// ──────────────────────────────────────────────────────────────────────────
// Cookie lifetimes (seconds)
// ──────────────────────────────────────────────────────────────────────────

/** 1 hour — tuned to match the default Symfony `JWT_TOKEN_TTL`. */
export const ACCESS_COOKIE_MAX_AGE = 60 * 60;

/** 30 days — matches the default Symfony `JWT_REFRESH_TOKEN_TTL`. */
export const REFRESH_COOKIE_MAX_AGE = 60 * 60 * 24 * 30;

/**
 * Safety window in seconds: refresh when the access token is this close to
 * (or past) its `exp`. A few seconds of slack absorbs small clock skews and
 * stops a concurrent Symfony call from receiving a JWT that's valid at
 * proxy-time but expired by the time the upstream hit lands.
 */
export const REFRESH_SAFETY_WINDOW_SECONDS = 10;

// ──────────────────────────────────────────────────────────────────────────
// Symfony internal URL (server-to-server, never exposed to the browser)
// ──────────────────────────────────────────────────────────────────────────

export const SYMFONY_INTERNAL_URL =
    process.env.SYMFONY_INTERNAL_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    'http://localhost/symfony';

export const SYMFONY_API_PREFIX = process.env.SYMFONY_API_PREFIX || '/cms-api/v1';

// ──────────────────────────────────────────────────────────────────────────
// Token generation (shared by proxy + CSRF route)
// ──────────────────────────────────────────────────────────────────────────

/**
 * Generate a hex-encoded random token using Web Crypto (available on Edge
 * and Node runtimes). Default 32 bytes → 64 hex chars → 256 bits of entropy.
 */
export function randomHexToken(byteLength: number = 32): string {
    const bytes = new Uint8Array(byteLength);
    crypto.getRandomValues(bytes);
    return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

// ──────────────────────────────────────────────────────────────────────────
// Symfony `/auth/refresh-token` helper
// ──────────────────────────────────────────────────────────────────────────

export interface IRefreshedTokens {
    access_token: string;
    refresh_token: string;
}

/**
 * POST to Symfony `/auth/refresh-token` with the given refresh token. Returns
 * a new `{ access_token, refresh_token }` pair on success or `null` on any
 * failure (network error, non-2xx response, missing access token in the
 * payload). Every successful call **rotates** the refresh token on the
 * backend, so callers must persist the new value before any other code path
 * can use the old one.
 *
 * Shared between `src/proxy.ts` (Edge) and the BFF routes (Node) to keep the
 * upstream contract in a single place.
 */
export async function callSymfonyRefreshToken(
    refreshToken: string
): Promise<IRefreshedTokens | null> {
    try {
        const res = await fetch(
            `${SYMFONY_INTERNAL_URL}${SYMFONY_API_PREFIX}/auth/refresh-token`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Client-Type': 'web',
                    Accept: 'application/json',
                },
                body: JSON.stringify({ refresh_token: refreshToken }),
                cache: 'no-store',
            }
        );
        if (!res.ok) return null;
        const payload = await res.json();
        const access = payload?.data?.access_token;
        const newRefresh = payload?.data?.refresh_token ?? refreshToken;
        if (!access) return null;
        return { access_token: access, refresh_token: newRefresh };
    } catch {
        return null;
    }
}
