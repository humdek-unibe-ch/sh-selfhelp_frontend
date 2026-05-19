/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
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
/**
 * Preview mode flag. Present (`1`) = admin is previewing unpublished content,
 * absent = published view. `PreviewModeProvider` writes it and Server
 * Components read it before prefetching page content, so preview mode has a
 * single request-scoped source of truth.
 */
export const PREVIEW_COOKIE = 'sh_preview';

/**
 * Color scheme choice (`light` | `dark` | `auto`). Mirrored from
 * `useMantineColorScheme` so the Server Component root layout can render
 * `<html data-mantine-color-scheme="...">` on the *initial* SSR response
 * (rather than relying on the pre-hydration bootstrap script to patch the
 * attribute after the browser has already started painting). Eliminates the
 * bright-white flash on dark-mode reloads.
 *
 * Value semantics:
 *   - `light` / `dark`: the server sets the resolved attribute directly.
 *   - `auto`: the server leaves the attribute off and the bootstrap script
 *     (`/mantine-color-scheme.js`) computes it from `prefers-color-scheme`.
 */
export const COLOR_SCHEME_COOKIE = 'sh_color_scheme';

/** One year — used for non-auth cookies (CSRF, locale hint, `sh_lang`). */
export const LONG_LIVED_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

// ──────────────────────────────────────────────────────────────────────────
// Impersonation cookies
// ──────────────────────────────────────────────────────────────────────────
//
// Two cookies, both short-lived. The split lets us follow the project's
// "tokens never reach the browser" rule while still giving the browser
// just enough information to render an impersonation banner.
//
//   - `sh_impersonate`              httpOnly  -> the JWT itself.
//                                              The browser CANNOT read it;
//                                              only the BFF /api/* proxy
//                                              forwards it to Symfony as
//                                              the Authorization header.
//
//   - `sh_impersonate_target_email` non-httpOnly -> just the target email.
//                                              Pure UI hint so the
//                                              ImpersonationBanner can
//                                              show "You are impersonating
//                                              alice@example.com" without
//                                              calling the API. Contains
//                                              no secret material.

export const IMPERSONATE_COOKIE = 'sh_impersonate';
export const IMPERSONATE_TARGET_EMAIL_COOKIE = 'sh_impersonate_target_email';
