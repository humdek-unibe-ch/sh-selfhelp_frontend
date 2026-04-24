/**
 * Cookie name constants.
 *
 * This module contains *only* string constants — no runtime code, no
 * Node/Edge-only imports — so it is safe to import from the Edge proxy, the
 * BFF route handlers, Server Components, and the client bundle alike.
 *
 * The server runtime re-exports these from `server.config.ts` so existing
 * server-side imports do not change; client utilities import directly from
 * here to avoid pulling in `SYMFONY_INTERNAL_URL` or `callSymfonyRefreshToken`
 * (which reference `process.env` server secrets).
 */

export const AUTH_COOKIE = 'sh_auth';
export const REFRESH_COOKIE = 'sh_refresh';
export const CSRF_COOKIE = 'sh_csrf';
export const LANG_COOKIE = 'sh_lang';
export const LOCALE_HINT_COOKIE = 'sh_accept_locale';

/** One year — used for non-auth cookies (CSRF, locale hint, `sh_lang`). */
export const LONG_LIVED_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;
