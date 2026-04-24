/**
 * Browser-side auth utilities.
 *
 * With the full BFF migration, tokens live only in httpOnly cookies managed
 * by the Next.js `/api/auth/*` routes. The browser never has direct access
 * to the access or refresh tokens, so the helpers below expose only the
 * two non-httpOnly signals the client still needs: the CSRF double-submit
 * token and the language preference cookie.
 *
 * Cookie names come from `@/config/cookie-names` — a browser-safe module
 * (no `process.env`, no Node/Edge-only imports) — so both the client and the
 * server runtime reference identical constants.
 */

import {
    CSRF_COOKIE,
    LANG_COOKIE,
    LONG_LIVED_COOKIE_MAX_AGE,
} from '../config/cookie-names';

/**
 * CSRF double-submit helper. Reads the non-httpOnly `sh_csrf` cookie and
 * returns its value so Axios can attach the `X-CSRF-Token` header.
 */
export function readCsrfToken(): string | null {
    if (typeof document === 'undefined') return null;
    const prefix = `${CSRF_COOKIE}=`;
    const match = document.cookie.split('; ').find((c) => c.startsWith(prefix));
    return match ? decodeURIComponent(match.slice(prefix.length)) : null;
}

/**
 * Write the `sh_lang` cookie with the long-lived max-age used by middleware.
 * The cookie always stores a numeric id that references the `languages`
 * table; the raw locale hint from `Accept-Language` lives in the separate
 * middleware-managed `sh_accept_locale` cookie.
 */
export function writeLangCookie(languageId: number): void {
    if (typeof document === 'undefined') return;
    const secure = typeof window !== 'undefined' && window.location.protocol === 'https:' ? '; Secure' : '';
    document.cookie = `${LANG_COOKIE}=${languageId}; path=/; max-age=${LONG_LIVED_COOKIE_MAX_AGE}; SameSite=Lax${secure}`;
}
