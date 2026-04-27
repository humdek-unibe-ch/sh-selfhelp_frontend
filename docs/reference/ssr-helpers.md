# SSR / BFF helpers — reference

A flat reference of the new helpers introduced by the v0.1.0 refactor.
For the architectural rationale read
[`docs/architecture/ssr-bff-architecture.md`](../architecture/ssr-bff-architecture.md);
this page is the index of "what file does what" so you can find the right
helper without grepping the whole tree.

## Server-side request resolvers

All resolvers live in `src/app/_lib/server-fetch.ts`. They are wrapped in
React's `cache()` so the same helper called from the layout, the page,
and `generateMetadata` hits Symfony exactly once per request. **Never
import them from a Client Component** — the file is server-only.

| Helper                                    | Returns                                                         | Notes                                                                                                     |
|-------------------------------------------|-----------------------------------------------------------------|-----------------------------------------------------------------------------------------------------------|
| `resolveLanguageSSR()`                    | `{ id, locale, htmlLang, languages }`                           | Priority chain: `sh_lang` cookie → `sh_accept_locale` hint → first language from `/languages`. Never returns a hardcoded id. |
| `resolvePreviewSSR()`                     | `boolean`                                                        | Reads `sh_preview` cookie; gated on the user actually being an admin (cookie alone is not enough).        |
| `resolveColorSchemeSSR()`                 | `'light' \| 'dark' \| 'auto'`                                    | Reads `sh_color_scheme` cookie; falls back to `'auto'`.                                                   |
| `getAuthMeSSR()`                          | `IAuthMeResponse \| null`                                       | Calls Symfony `/auth/me` on behalf of the request. Caller decides what `null` means (anonymous vs error). |
| `getPublicLanguagesSSR()`                 | `ILanguage[] \| null`                                            | Public — used to seed `['public-languages']`.                                                             |
| `getFrontendPagesSSR(languageId)`         | `IPageItem[]`                                                    | The full nav tree for one language. Seeds `['frontend-pages', languageId]`.                              |
| `getMenuPagesSSR(languageId)`             | `IPageItem[]` (top-level menu only)                              | Wraps `getFrontendPagesSSR` + `selectMenuPages` so SSR header HTML matches the post-hydration client.    |
| `getProfilePagesSSR(languageId)`          | `IPageItem[]` (`is_system`, keyword `profile-link`)              | Same shape as the client `useAppNavigation().profilePages`.                                              |
| `getPageByKeywordSSRCached(keyword, languageId, preview)` | Page payload                                          | The single hot path used by both the slug layout prefetch and `generateMetadata`.                         |
| `getAdminLookupsSSR()`                    | Lookups envelope                                                 | Seeds `['lookups']` for the admin layout.                                                                |

## Provider stack

| File                                                       | Runtime           | Responsibility                                                                                                                                                                       |
|------------------------------------------------------------|-------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `src/providers/server-providers.tsx`                       | Server Component  | Resolves SSR-scoped state in parallel (`resolveLanguageSSR`, `getAuthMeSSR`, `resolvePreviewSSR`, `resolveColorSchemeSSR`), seeds the request `QueryClient`, dehydrates, and forwards to `ClientProviders`. |
| `src/providers/providers.tsx`                              | `'use client'`    | Wraps the tree with `<QueryClientProvider>`, `<MantineProvider>`, `<LanguageProvider>`, `<PreviewModeProvider>`, and Refine. Mounts `useAclVersionWatcher` and `useAclEventStream` once.       |
| `src/providers/auth.provider.ts`                           | Client + edge     | Refine `authProvider`. Cookie-driven; shares the `['user-data']` slot via `getQueryClient().fetchQuery`. **Never** reads tokens from `localStorage`.                                            |
| `src/providers/query-client.ts`                            | Both              | `getQueryClient()` factory. Returns a fresh client per request on the server, a singleton on the browser. Use it from any code path that needs a QC outside the React tree (e.g. the `authProvider`). |

## Contexts

| Context                                                                         | Source of truth      | When to use                                                                                                                                                                              |
|---------------------------------------------------------------------------------|----------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `LanguageContext` (`src/app/components/contexts/LanguageContext.tsx`)            | `sh_lang` cookie     | Read the current language id (`useLanguageContext()`). Switching language calls `setCurrentLanguageId` which writes the cookie via `writeBrowserCookie` and invalidates language-scoped query keys. |
| `PreviewModeContext` (`src/app/components/contexts/PreviewModeContext.tsx`)      | `sh_preview` cookie  | Read / toggle admin preview mode (`usePreviewMode()`). Initial value comes from `resolvePreviewSSR()` so SSR and client agree on first paint — **do not** use Zustand for this.            |

## Hooks

| Hook                                                       | Lives in                                  | Job                                                                                                                                                                                                                                                |
|------------------------------------------------------------|-------------------------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `useAclEventStream()`                                      | `src/hooks/useAclEventStream.ts`          | Opens an `EventSource` to `/api/auth/events`. On `acl-changed` events it invalidates `['user-data']`, which `useAclVersionWatcher` then cascades into the navigation / admin / page-content caches. Mounted once in `ClientProviders`.            |
| `useAclVersionWatcher()`                                   | `src/hooks/useAclVersionWatcher.ts`       | Watches `user.aclVersion` in the `['user-data']` cache; on bump it invalidates `['frontend-pages']`, `['admin-pages']`, and `['page-by-keyword']`. The two ACL hooks are designed to work together — never mount one without the other.            |
| `useAuthUser()` / `useAuthStatus()`                        | `src/hooks/useUserData.ts`                | Read the SSR-seeded `['user-data']` cache. `useAuthStatus()` exposes `{ isAuthenticated, isLoading }` derived from the same cache; prefer it over Refine's `useIsAuthenticated` when you need first-paint correctness.                              |
| `usePageContentByKeyword(keyword)`                         | `src/hooks/usePageContentByKeyword.ts`    | Fetches a public page by keyword. Replaces the legacy id-based `usePageContent` hook. Pulls language id + preview flag from context so callers stay simple.                                                                                       |
| `useAppNavigation()`                                       | `src/hooks/useAppNavigation.ts`           | Client mirror of the SSR navigation helpers. Uses the shared `transformNavigationPages` / `selectMenuPages` / `selectFooterPages` / `selectProfilePages` from `src/utils/navigation.utils.ts` so SSR and client produce byte-identical output.    |

## Utilities

| Helper                                                                                  | Lives in                                  | Job                                                                                                                                                                                                                  |
|-----------------------------------------------------------------------------------------|-------------------------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `transformNavigationPages(rawPages)`                                                    | `src/utils/navigation.utils.ts`           | Applies `transformPageData` + the historical "child URL → `/{keyword}`" rewrite. Used by both `getMenuPagesSSR` and the client `select` so hydration is a no-op.                                                     |
| `selectMenuPages` / `selectFooterPages` / `selectProfilePages`                          | `src/utils/navigation.utils.ts`           | Predicates / sorts that derive the three nav slices from a transformed tree. Single source of truth for SSR + CC.                                                                                                    |
| `getPageTitle(page)`                                                                    | `src/utils/navigation.utils.ts`           | Resolves the user-visible label for any nav entry: translated `title` if present, otherwise the keyword formatted as a sentence. Replaces three identical copies that used to live next to the call sites.          |
| `writeBrowserCookie(name, value, maxAge)`                                               | `src/utils/auth.utils.ts`                 | The only sanctioned way to write a preference cookie from the browser. Used by `LanguageContext`, `PreviewModeContext`, and `cookieColorSchemeManager`. Stamps `path=/`, `SameSite=Lax`, and `Secure` on HTTPS.       |
| `readCsrfToken()`                                                                       | `src/utils/auth.utils.ts`                 | Reads the non-`httpOnly` `sh_csrf` cookie for the Axios CSRF interceptor.                                                                                                                                            |
| `cookieColorSchemeManager()`                                                            | `src/utils/cookie-color-scheme-manager.ts`| Custom Mantine `ColorSchemeManager` whose `get` / `set` go through the `sh_color_scheme` cookie instead of `localStorage`. Eliminates the SSR/client first-paint flicker on the theme toggle.                       |

## BFF routes

| Route                                                | Method        | Purpose                                                                                                                                                                                                                                              |
|------------------------------------------------------|---------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `/api/[...path]`                                     | any           | Catch-all. Forwards every Symfony call from the browser, attaches `Authorization`, validates `X-CSRF-Token`, handles silent refresh + replay.                                                                                                       |
| `/api/auth/login` / `/api/auth/logout` / `/api/auth/refresh` | POST  | Dedicated routes that own cookie writes — keep token rotation and cookie clearing atomic.                                                                                                                                                              |
| `/api/auth/events`                                   | GET (SSE)     | Mercure subscription proxy. Reads `sh_auth`, asks Symfony for the discovery payload (`hubUrl`, `topic`, `token`), pipes the upstream `text/event-stream` to the browser. Source for `useAclEventStream`.                                              |
| `/api/csrf`                                          | GET           | One-shot bootstrap for non-browser clients. Returns `{ csrf_token, cookie_name, header_name }` and sets `sh_csrf` if missing. The only mutation-exempt endpoint.                                                                                      |

## Cookies

See `architecture.md` §15.9 for the canonical inventory; the constants
themselves live in `src/config/cookie-names.ts` and re-exports from
`src/config/server.config.ts` for server-only callers.

| Constant                       | Cookie name        | Source                                                                                          |
|--------------------------------|--------------------|-------------------------------------------------------------------------------------------------|
| `AUTH_COOKIE`                  | `sh_auth`          | BFF — httpOnly                                                                                  |
| `REFRESH_COOKIE`               | `sh_refresh`       | BFF — httpOnly                                                                                  |
| `CSRF_COOKIE`                  | `sh_csrf`          | `src/proxy.ts` (Edge)                                                                           |
| `LANG_COOKIE`                  | `sh_lang`          | `LanguageContext` via `writeBrowserCookie`                                                      |
| `ACCEPT_LOCALE_COOKIE`         | `sh_accept_locale` | `src/proxy.ts` (hint, not user-controlled)                                                      |
| `PREVIEW_COOKIE`               | `sh_preview`       | `PreviewModeContext` via `writeBrowserCookie`                                                   |
| `COLOR_SCHEME_COOKIE`          | `sh_color_scheme`  | `cookieColorSchemeManager` via `writeBrowserCookie`                                             |

## See also

- [SSR + BFF Architecture](../architecture/ssr-bff-architecture.md) — full rationale and request lifecycle diagrams.
- [`architecture.md`](../../architecture.md) §15 — historical reference, current cookies / state-management tables.
- [API Endpoints Reference](api-endpoints.md) — every BFF route in one table.
