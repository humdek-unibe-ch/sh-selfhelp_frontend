/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/

/**
 * Slug routing helpers for the public `[[...slug]]` catch-all.
 *
 * After the DB-driven routing cutover (issue #30) the public site no longer
 * maps slugs to CMS keywords on the client. Instead the slug segments are
 * joined back into a URL path and resolved by the backend `page_routes`
 * contract via `GET /pages/resolve`. The only client-side mapping that
 * remains is the **static fallback** — a resilience net that redirects to the
 * hardcoded `/auth/*` Next.js pages when the CMS payload for a system page is
 * genuinely missing, so operators are never locked out of their own install.
 */

/**
 * Static fallback Next.js routes, keyed by the page keyword the backend
 * resolver returns. Used only when the resolved CMS page is missing its
 * functional section (`should_fallback`).
 *
 * Keys are the live (kebab-case) CMS keywords — `reset-password`, `no-access`,
 * etc. — matching what `GET /pages/resolve` returns after the keyword
 * alignment migrations.
 */
const STATIC_FALLBACK_BY_KEYWORD: Record<string, string> = {
    login: '/auth/login',
    'two-factor-authentication': '/auth/two-factor-authentication',
    profile: '/auth/profile',
    register: '/auth/register',
    'reset-password': '/auth/reset-password',
    'no-access': '/auth/no-access',
    'no-access-guest': '/auth/no-access-guest',
    missing: '/auth/missing',
};

/**
 * Build the public URL path from the `[[...slug]]` catch-all segments. The
 * backend resolver normalizes the root (`/`) to the home page, so an empty
 * slug maps to `/`.
 */
export function pathFromSlug(slug: string[] | undefined): string {
    if (!slug || slug.length === 0) return '/';
    return '/' + slug.map(encodeURIComponent).join('/');
}

/**
 * Compute the static fallback route for a resolved page, or `null` when none
 * applies. Driven by the backend-resolved keyword + `route_params` (snake_case)
 * rather than re-parsing the URL, so it stays correct regardless of the public
 * path shape. For the password-reset link the `user_id`/`token` params are
 * appended so the static page can complete the reset.
 */
export function buildStaticFallbackPath(
    keyword: string,
    routeParams?: Record<string, string> | null
): string | null {
    const basePath = STATIC_FALLBACK_BY_KEYWORD[keyword];
    if (!basePath) {
        return null;
    }

    if (keyword === 'reset-password' && routeParams?.user_id && routeParams?.token) {
        const suffix = [routeParams.user_id, routeParams.token].map(encodeURIComponent).join('/');
        return `${basePath}/${suffix}`;
    }

    return basePath;
}
