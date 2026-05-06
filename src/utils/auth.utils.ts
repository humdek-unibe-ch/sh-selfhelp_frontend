/**
 * Browser-side auth / preference cookie helpers.
 *
 * Authentication state lives in httpOnly cookies managed by the Next.js
 * `/api/auth/*` BFF routes — the browser never sees the access or refresh
 * token. This module exposes the two pieces the client still needs:
 *
 *   - `readCsrfToken()` to read the non-httpOnly `sh_csrf` cookie for the
 *     double-submit header,
 *   - `writeBrowserCookie()` for the long-lived preference cookies (lang,
 *     preview, color scheme) that Server Components also read on the next
 *     SSR request.
 *
 * Cookie names come from `@/config/cookie-names` — a browser-safe module
 * (no `process.env`, no Node/Edge-only imports) — so both client and server
 * runtimes reference identical constants.
 */


/**
 * Write a cookie from the browser. Pass `maxAge = 0` to delete; the helper
 * also stamps an `expires` in the past so a small number of legacy proxies
 * that ignore `Max-Age=0` still drop the cookie.
 */
export function writeBrowserCookie(name: string, value: string, maxAge: number): void {
    if (typeof document === 'undefined') return;
    const secure =
        typeof window !== 'undefined' && window.location.protocol === 'https:'
            ? '; Secure'
            : '';
    const expires =
        maxAge <= 0 ? '; expires=Thu, 01 Jan 1970 00:00:00 GMT' : '';
    document.cookie = `${name}=${value}; path=/; max-age=${maxAge}${expires}; SameSite=Lax${secure}`;
}

/**
 * Reusable read cookie value
 */
export function readCookieValue(name: string): string | null {
    if (typeof document === 'undefined') return null;
    const prefix = `${name}=`;
    const match = document.cookie.split('; ').find((c) => c.startsWith(prefix));
    return match ? decodeURIComponent(match.slice(prefix.length)) : null;
}
