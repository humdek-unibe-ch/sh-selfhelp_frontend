/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
/**
 * Browser-side cookie helpers.
 *
 * Authentication state lives in httpOnly cookies managed by the Next.js
 * `/api/auth/*` BFF routes — the browser never sees the access or refresh
 * token. The same is true of the impersonation token (`sh_impersonate`),
 * which is set by `/api/admin/users/{id}/impersonate` and is also httpOnly.
 *
 * This module exposes the small set of cookie helpers the browser still
 * needs: read `sh_csrf` for the double-submit header, read the
 * non-secret `sh_impersonate_target_email` hint to render the impersonation
 * banner, and write the long-lived preference cookies (lang, preview,
 * color scheme).
 *
 * Cookie names come from `@/config/cookie-names` — a browser-safe module
 * (no `process.env`, no Node/Edge-only imports) — so both client and server
 * runtimes reference identical constants.
 */

/**
 * Write a cookie from the browser. Pass `maxAge = 0` to delete; the helper
 * also stamps an `expires` in the past so a small number of legacy proxies
 * that ignore `Max-Age=0` still drop the cookie.
 *
 * Never use this helper for secrets — it cannot set httpOnly. Use a BFF
 * route instead (see `src/app/api/admin/users/[userId]/impersonate`).
 */
export function writeBrowserCookie(name: string, value: string, maxAge: number): void {
    if (typeof document === 'undefined') return;
    const secure =
        typeof window !== 'undefined' && window.location.protocol === 'https:'
            ? '; Secure'
            : '';
    const expires = maxAge <= 0 ? '; expires=Thu, 01 Jan 1970 00:00:00 GMT' : '';
    document.cookie = `${name}=${value}; path=/; max-age=${maxAge}${expires}; SameSite=Lax${secure}`;
}

/**
 * Read a cookie from the browser. Returns `null` when the cookie is
 * absent OR when called from the server (no `document`). Used for
 * non-httpOnly cookies only — by definition the browser cannot read
 * httpOnly cookies even with this helper.
 */
export function readCookieValue(name: string): string | null {
    if (typeof document === 'undefined') return null;
    const prefix = `${name}=`;
    const match = document.cookie.split('; ').find((c) => c.startsWith(prefix));
    return match ? decodeURIComponent(match.slice(prefix.length)) : null;
}
