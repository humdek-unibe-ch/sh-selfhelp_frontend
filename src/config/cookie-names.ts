/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
/**
 * Cookie name constants.
 *
 * Safe to import from the Edge proxy, the BFF route handlers, Server
 * Components, and the client bundle alike. The only runtime code is the
 * per-instance suffix below, which reads a server-only env var behind a
 * `typeof process` guard so it collapses to an empty suffix in the browser
 * bundle (where the suffixed cookies are never read anyway).
 *
 * The server runtime re-exports these from `server.config.ts` so existing
 * server-side imports do not change; client utilities import directly from
 * here to avoid pulling in `SYMFONY_INTERNAL_URL` or `callSymfonyRefreshToken`
 * (which reference `process.env` server secrets).
 */

/**
 * Per-instance cookie suffix — applied to EVERY SelfHelp cookie.
 *
 * The manager runs many instances on the SAME host, separated only by port
 * (`localhost:9111`, `localhost:9100`, …). Cookies are scoped by host, NOT by
 * port (RFC 6265 §8.5), so without a suffix every instance would share ONE
 * cookie jar. For the session cookies this logged the operator out of EVERY
 * instance at once (each instance signs JWTs with its own keypair, so a token
 * minted by one is rejected by another and the BFF's silent refresh then
 * deletes the *shared* cookie). For the rest — locale (`sh_lang`,
 * `sh_accept_locale`), color scheme, preview, CSRF — sharing one jar silently
 * bled one instance's UI state into another. Suffixing *all* of them with the
 * instance id gives each instance a fully isolated jar even on a shared host.
 *
 * ## Where the id comes from (server vs. browser)
 * The id is `SELFHELP_INSTANCE_ID`, injected by the manager into every
 * instance's generated `.env` (and thus the frontend container's process env):
 *
 *   - **Server** (Edge proxy, BFF route handlers, RSC — all in the frontend
 *     container) read it straight from `process.env`.
 *   - **Browser** cannot see it: it is not a `NEXT_PUBLIC_*` var, and even if it
 *     were, `NEXT_PUBLIC_*` is inlined at *build* time while the id is a
 *     *runtime* value that differs per container started from the same image.
 *     So the server-rendered root layout mirrors it onto
 *     `<html data-sh-instance="…">`, and the browser reads it back from there.
 *     `document.documentElement` is the first node parsed, so the attribute is
 *     always present by the time any client module evaluates this file.
 *
 * Because both sides derive the identical suffix, the name used to SET a cookie
 * always matches the name used to READ it — on the server, in the browser, and
 * across the SSR→hydration boundary. In a plain dev checkout the variable is
 * unset, the attribute is absent, the suffix is empty, and the historical
 * single-instance cookie names are preserved.
 */
function readInstanceId(): string {
  // Server runtime (node / edge): the manager-injected env var.
  if (typeof process !== 'undefined' && process.env && process.env.SELFHELP_INSTANCE_ID) {
    return process.env.SELFHELP_INSTANCE_ID;
  }
  // Browser: mirrored onto <html data-sh-instance> by the root layout.
  if (typeof document !== 'undefined' && document.documentElement) {
    return document.documentElement.dataset.shInstance ?? '';
  }
  return '';
}

function instanceCookieSuffix(): string {
  const safe = readInstanceId().replace(/[^A-Za-z0-9_]/g, '');
  return safe ? `_${safe}` : '';
}

const INSTANCE_COOKIE_SUFFIX = instanceCookieSuffix();

export const AUTH_COOKIE = `sh_auth${INSTANCE_COOKIE_SUFFIX}`;
export const REFRESH_COOKIE = `sh_refresh${INSTANCE_COOKIE_SUFFIX}`;

/**
 * Pre-namespacing cookie names. Cleared (expired) alongside the suffixed
 * cookies on logout / session invalidation so the one shared cookie left over
 * from before this upgrade is flushed instead of lingering inert for 30 days.
 */
export const LEGACY_AUTH_COOKIE = 'sh_auth';
export const LEGACY_REFRESH_COOKIE = 'sh_refresh';

export const CSRF_COOKIE = `sh_csrf${INSTANCE_COOKIE_SUFFIX}`;
export const LANG_COOKIE = `sh_lang${INSTANCE_COOKIE_SUFFIX}`;
export const LOCALE_HINT_COOKIE = `sh_accept_locale${INSTANCE_COOKIE_SUFFIX}`;
/**
 * Preview mode flag. Present (`1`) = admin is previewing unpublished content,
 * absent = published view. `PreviewModeProvider` writes it and Server
 * Components read it before prefetching page content, so preview mode has a
 * single request-scoped source of truth.
 */
export const PREVIEW_COOKIE = `sh_preview${INSTANCE_COOKIE_SUFFIX}`;

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
export const COLOR_SCHEME_COOKIE = `sh_color_scheme${INSTANCE_COOKIE_SUFFIX}`;

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

export const IMPERSONATE_COOKIE = `sh_impersonate${INSTANCE_COOKIE_SUFFIX}`;
export const IMPERSONATE_TARGET_EMAIL_COOKIE = `sh_impersonate_target_email${INSTANCE_COOKIE_SUFFIX}`;
