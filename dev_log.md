# Developer Log

This file is an append-only engineering narrative: step-by-step notes from
every major refactor, the reasoning behind individual decisions, bug
post-mortems, and dead ends. It is intentionally verbose and is written
for contributors who need to understand *why* a change was made, not just
*what* changed.

For a short, user-facing list of features / fixes / removals per release
see `CHANGELOG.md`.

High-level architectural explanations (SSR + BFF, Axios, TanStack layout,
Refine integration, the keyword-vs-id switch, when to use Server vs Client
Components) live in `docs/architecture/ssr-bff-architecture.md`.

---

## v0.1.0 — SSR + BFF refactor (2026-04)

### SEO title + description returned by the backend (2026-04-23)

**Problem.** `http://localhost:3000/test3` rendered the fallback
`<title>SelfHelp</title>` even though the nav endpoint
(`/api/pages/language/2`) carried per-language titles for other pages.
Two separate gaps were responsible:

1. **The list endpoint only returned `title`.** `PageService::getAllAccessiblePagesForUser`
   read every `display=1` field from `pages_fields_translation` but only copied `title`
   onto each node and discarded everything else — including the `description` column
   (field id `106`). The frontend therefore had no way to build a
   `<meta name="description">` without a second request.
2. **The per-page endpoint didn't return translated SEO fields at all.**
   `/pages/by-keyword/{keyword}` returned `{ id, keyword, url, parent_page_id,
   is_headless, nav_position, footer_position, sections }`. No title, no description.
   `generateMetadata` was falling back to the nav list, which returns `title: null`
   for any page that isn't translated in the requested language (e.g. `test3`).

**Backend fix (`sh-selfhelp_backend`).**
- `PageService::getAllAccessiblePagesForUser` now copies both `title` *and*
  `description` onto each nav node (from the same
  `fetchTitleTranslationsWithFallback` result — no extra query).
- Added `resolvePageSeoFields(int $pageId, int $languageId): array` — a small
  helper that fetches `{title, description}` for a single page with default-language
  fallback. Reused by both `serveDraftVersion` (injects the two fields into the
  payload before caching) and `servePublishedVersion` (injects them *after*
  `hydratePublishedPage` so version JSON doesn't have to carry them — SEO fields
  should track the current translation, not whatever was frozen at publish time).
- Response schemas updated so contract validation passes:
  `responses/common/_acl_page_definition.json` (adds `description` as a required,
  nullable sibling of `title`) and `responses/frontend/get_page.json` (adds
  `title` + `description` as required, nullable siblings of `sections`).

**Frontend fix (`sh-selfhelp_frontend`).**
- `IPageContent` and `IPageItem` now declare `title?: string | null` /
  `description?: string | null` so TypeScript mirrors the backend contract.
- `getFrontendPageTitleSSR` has been generalised to `getFrontendPageSeoSSR` which
  returns `{ title, description }` from the SSR-cached nav list. The old title-only
  function is kept as a thin wrapper for backward compatibility.
- `generateMetadata` in `src/app/[[...slug]]/page.tsx` now prefers the payload's
  `page.title` / `page.description` and only falls back to the nav list when the
  payload is missing those fields (defence in depth for brief backend outages or
  missing translations). The previous implementation treated the nav list as the
  only source of truth, which is why untranslated pages flashed the default
  template.

**Why both endpoints.** Keeping SEO fields on the nav list (cheap list data that
ships with every page load) *and* on the per-page payload costs us one join at
request time and gives two independent resolution paths. Either one can satisfy
`generateMetadata`, which is a nice property for an endpoint that runs on every
SSR render.

### Audit follow-ups (2026-04-23)

- **Deleted pre-existing parallel server API.** `src/api/server.api.ts`
  (172 lines) shipped from before the BFF refactor and relied on
  middleware-injected `x-access-token` / `x-auth` / `x-admin-check`
  headers that the new proxy (`src/proxy.ts`) no longer sets. It was
  also referenced by no callers. Every function it exposed is covered
  by SSR helpers in `src/app/_lib/server-fetch.ts`.
- **Trimmed dead `PageApi` methods.** `PageApi.getPageContent`,
  `PageApi.updatePageContent` and `PageApi.getPublicLanguages` were all
  replaced by `getPageByKeyword` + SSR helpers + `usePublicLanguages`.
  The orphaned `API_CONFIG.ENDPOINTS.PAGES_GET_ONE` was removed with
  them. `permission-aware-client` example comment already references
  `ADMIN_PAGES_GET_ONE`, so no client-side update was needed.
- **Cookie-name duplication removed.** `src/app/admin/layout.tsx` no
  longer redeclares `const AUTH_COOKIE = 'sh_auth'`, and
  `src/app/not-found.tsx` no longer uses the bare `'sh_auth'` literal —
  both import `AUTH_COOKIE` from `src/config/server.config.ts`, which
  was already the single source of truth for every other server-side
  cookie read.
- **Collapsed `/api/auth/me` into the catch-all.** The dedicated
  handler duplicated the silent-refresh loop already present in
  `src/app/api/[...path]/route.ts`. Refine's `authProvider` now calls
  `/api/auth/user-data` through the catch-all, which handles
  refresh-on-401 + token rotation for GET identically to the deleted
  route. Stale comments in `useAdminPages`, `AuthButton` and
  `base.api.ts` updated to match.
- **Eliminated language-change double-invalidation.**
  `setCurrentLanguageId` (LanguageContext) remains the sole owner of
  `['frontend-pages']` + `['page-by-keyword']` invalidations.
  `useUpdateLanguagePreferenceMutation.onSuccess` now only invalidates
  `['user-data']` (the one key it actually owns), and
  `LanguageSelector.handleLanguageChange` no longer re-invalidates the
  page caches for anonymous users. Net effect: one invalidation per key
  per language switch instead of two.
- **`sh_accept_locale` documented.** Added the locale-hint cookie the
  proxy sets on first visit to the cookies list on `/privacy` for GDPR
  completeness.
- **Clarified slug-layout prefetch comment.** The misleading "match the
  transform applied by `useAppNavigation`" comment was replaced with an
  accurate note: SSR stores the raw pages list and the client `select`
  runs `transformPageData` on both hydrated and fresh data.
- **CHANGELOG accuracy.** The stale "Post-audit fixes" paragraph now
  reflects that `setCurrentLanguageId` invalidates exactly the two live
  keys (`frontend-pages`, `page-by-keyword`), matching the code. The
  "Auth hardening" bullet referencing `/api/auth/me` is now explicit
  about its subsequent collapse into the catch-all.
- **Shared cookie-name module.** `src/config/cookie-names.ts` exposes
  just the cookie-name constants, letting both the server runtime
  (`server.config.ts`) and browser utilities (`auth.utils.ts`) stop
  hardcoding `'sh_lang'` / `'sh_csrf'` string literals.
- **`useSelectedAdminPage` delegates to `useAdminPages`.** Both hooks
  previously registered independent `useQuery` calls against the
  `['admin-pages']` key, which React Query dedupes at fetch time but
  whose `enabled` gates could drift. The selector variant now calls the
  authoritative hook and narrows with `useMemo`, so there is a single
  query instance per admin session.
- **Deleted orphaned `useInvalidateUserData` helper.** After
  `LanguageSelector` stopped calling it (see "Eliminated
  language-change double-invalidation" above), the exported hook had
  zero consumers. Removed along with the now-unused `useQueryClient`
  import from `useUserData.ts`.
- **Deleted unused `/api/auth/refresh` BFF route.** The 32-line handler
  at `src/app/api/auth/refresh/route.ts` had no frontend caller —
  silent refresh is transparently handled by the catch-all's 401
  retry, and no explicit-refresh flow is planned. Removed the route
  file and its now-empty parent directory.
- **`authProvider` shares the `['user-data']` React Query cache.** The
  module-level `QueryClient` singleton moved out of `providers.tsx`
  into `src/providers/query-client.ts` so non-React callers can import
  it. `authProvider.fetchMeOrNull` now resolves the user envelope via
  `queryClient.fetchQuery(['user-data'])`, dedupe-sharing the slot
  with every `useAuthUser` consumer: warm SSR-hydrated caches satisfy
  Refine's first `check()` with zero XHR, and `getIdentity()` reuses
  the same hydrated data instead of firing a second network round-trip.
  `authProvider.login` and `authProvider.logout` evict the cache so
  subsequent guard calls reflect the new session state immediately.
- **Single `stripTokensFromBody` helper.** The duplicated token-
  stripping logic in `src/app/api/auth/login/route.ts` and
  `src/app/api/[...path]/route.ts::buildResponseWithCookieRotation`
  was extracted into `stripTokensFromBody(payload)` in
  `src/app/api/_lib/proxy.ts`. Both routes now call the same helper
  and receive a `{ body, tokens }` pair, so future endpoints that
  rotate tokens get the behaviour for free.

### Follow-up fixes (2026-04-23)

- **LanguageSelector spinner on form pages.** The selector tied its
  `isUpdating` indicator to `useIsFetching({ queryKey: ['page-by-keyword'] })`,
  so any page navigation that refetched content flashed a spinner next to
  the language dropdown even when the user hadn't changed the language.
  Spinner is now driven solely by `updateLanguageMutation.isPending`, which
  is the only signal actually caused by the component's own action.
- **AdminNavbar hydration mismatch (`LinksGroup` / `NestedLinksGroup`).**
  Both components initialised `useState` by reading `localStorage` inside a
  `typeof window !== 'undefined'` branch. SSR hit the false branch and
  returned the deterministic default, while the first client render hit
  the true branch and returned the persisted value — React flagged the
  attribute drift (`className`, `style`, `aria-hidden`, `inert`) as a
  hydration error. Both now initialise deterministically with
  `initiallyOpened || hasActiveChild`, hydrate the persisted value in a
  post-mount `useEffect`, and gate the persistence effect on a
  `hasHydratedFromStorage` ref so it cannot overwrite the stored choice
  with the deterministic default on mount.
- **Dead `['page-content']` cache-key purge.** After the previous audit
  migrated `usePageContentValue` / `usePagePrefetch` to
  `['page-by-keyword', ...]`, several callers were still invalidating the
  now-orphaned `['page-content']` key — meaning form submissions, page
  edits, section-utility force-deletes, and unauthenticated language
  switches were silently not invalidating the displayed page content.
  Updated to invalidate `['page-by-keyword']` in:
  - `useFormSubmission.ts` (submit / update / delete form)
  - `useSectionUtility.ts` (force delete section)
  - `useUpdatePageMutation.ts`
  - `useUpdateLanguagePreferenceMutation.ts`
  - `PageInspector.tsx`, `SectionInspector.tsx`,
    `ConfigurationPageEditor.tsx`
  - `LanguageContext.tsx` (unauthenticated language change) and the
    anonymous branch of `LanguageSelector.tsx`
  - `DebugMenu.tsx` `useIsFetching` probe
  Docstrings in `LanguageContext.tsx` and
  `useUpdateLanguagePreferenceMutation.ts` were updated to reflect the
  single-key model. Verified via a repo-wide sweep that only the
  historical note in `usePagePrefetch.ts` still mentions the old key.

### Audit cleanup pass (2026-04-23)
Post-audit sweep to remove dead code, eliminate duplication, and align
cache keys with the SSR prefetch story documented above.

- **Critical — page content cache-key mismatch.** `FormStyle` and
  `ValidateStyle` were reading via `usePageContentValue`, which queried
  `['page-content', pageId, ...]` while the SSR layout prefetched
  `['page-by-keyword', keyword, ...]`. The two keys never aligned, so the
  first client render on any page with a form triggered a redundant
  refetch (exactly what the SSR prefetch was designed to avoid).
  - `PageContext` now carries `keyword` alongside `languageId` and
    `pageId`. `DynamicPageClient` passes the keyword it already has.
  - `usePageContentValue` reads from
    `REACT_QUERY_CONFIG.QUERY_KEYS.PAGE_BY_KEYWORD` — the same key
    `usePageContentByKeyword` and the layout prefetch use.
  - `useAclVersionWatcher` also invalidates `['page-by-keyword']` so an
    ACL change surfaces the new page content without a manual refresh.
- **Critical — ineffective hover prefetch.** `usePagePrefetch` was
  writing the same now-orphaned `['page-content', pageId, ...]` key the
  page renderer never read. Rewritten to prefetch the exact
  `PAGE_BY_KEYWORD` entry a subsequent navigation will render.
  `WebsiteHeaderMenu` / `WebsiteFooter` now call
  `createHoverPrefetch(item.keyword)`.
- **Shared server config module.** Extracted `cookie names`, TTLs,
  Symfony internal URL + API prefix, `randomHexToken`, and
  `callSymfonyRefreshToken` into `src/config/server.config.ts`. Used
  by:
  - `src/proxy.ts` (Edge) — removes the duplicated JWT refresh code.
  - `src/app/api/_lib/proxy.ts` (Node) — `refreshInternal` becomes a
    thin wrapper around `callSymfonyRefreshToken`.
  - `src/app/api/csrf/route.ts` — uses the shared
    `randomHexToken` helper.
  - `src/app/_lib/server-fetch.ts` — reads the shared cookie names
    and Symfony URL.
- **BFF token-rotation ordering bug (fix).** On a silent-refresh replay
  where the upstream body *also* carried tokens (e.g. `/auth/set-language`
  after a forced refresh), the refresh-pair cookies were written *after*
  the body-pair, overwriting the newer rotation with the older one.
  `/api/[...path]/route.ts` now applies the refresh-pair first so any
  body-sourced rotation takes precedence.
- **Dead code removed.**
  - Hook: `src/hooks/usePageContent.ts` — no callers after the
    `by-keyword` refactor.
  - Config: `REACT_QUERY_CONFIG.QUERY_KEYS.PAGE_CONTENT` — no
    callers; every consumer goes through `PAGE_BY_KEYWORD` now.
  - API: `AuthApi.refreshToken()` (and its
    `TRefreshTokenSuccessResponse` type, `AUTH_REFRESH_TOKEN` endpoint
    entry) — the `/api/auth/refresh` BFF route stays for API-only
    clients but has zero in-repo callers. `API_CONFIG.TOKEN_REFRESH_INTERVAL`
    and `TOKEN_EXPIRY_THRESHOLD` (stale client-side refresh constants).
  - BFF helper: `forwardToSymfony` (only ever an alias for
    `forwardBufferedToSymfony` with no override).
  - SSR fetch: `TAG_LANGUAGES` and the `next: { tags: [...] }` option —
    admin language mutations already invalidate the client React Query
    cache and the 5-min SSR TTL is acceptable for a rarely-edited list,
    so the never-called `revalidateTag` wiring was pure dead
    configuration.
  - Store: `useClearSelectedKeyword` / `clearSelectedKeyword` — no
    callers (`setSelectedKeyword(null)` covers the same case).
  - Provider export: `verifyTwoFactor` (the exported wrapper in
    `auth.provider.ts`); the two-factor page calls
    `AuthApi.verifyTwoFactor` directly.
- **Module-private demotion.** `getPageByKeywordSSR` is no longer
  exported — every caller already goes through the per-request cached
  `getPageByKeywordSSRCached` wrapper, which is the only supported
  entry point.
- **Stale comment fix.** The catch-all route's inline comment referred
  to `buffered.body` as `Uint8Array`; it's actually `ArrayBuffer`
  (matching the declared type on `BufferedRequest`).

### SSR silent refresh in the proxy (2026-04-21)
- **Bug fixed.** Navigating to a new page *after the access-token JWT had
  expired* was kicking users out to a 404. Root cause: Server Components
  (notably `src/app/[[...slug]]/page.tsx` via
  `src/app/_lib/server-fetch.ts`) hit Symfony **directly** — they do not
  go through the `/api/*` BFF catch-all, so the silent-refresh retry loop
  that already works for client XHRs never ran for SSR page fetches.
  Symfony returned 401, `fetchJson()` returned `null`, the page called
  `notFound()`, hence the 404.
- **Why we can't "just retry inside `fetchJson`".** Server Components can
  *read* cookies but cannot *write* them in Next.js. Since Symfony's
  `processRefreshToken()` rotates the `refreshTokens` row on every call
  (see backend docs), an SSR-side refresh would issue new tokens that the
  browser could never receive — the next navigation would then fail because
  the refresh cookie in the browser was already invalidated in the DB.
- **Fix.** `src/proxy.ts` now performs a **preemptive silent refresh**
  before the admin gate runs:
    1. Read the `sh_auth` cookie, base64-decode the JWT payload (no
       signature verification — we wrote the cookie ourselves, we only
       need the `exp` claim).
    2. If `exp` is past or within a 10 s safety window, POST to Symfony
       `/cms-api/v1/auth/refresh-token` with the `sh_refresh` value.
    3. On success: mutate `req.cookies` (so Server Components reading
       `cookies()` for this request see the *fresh* access token) **and**
       set rotated `sh_auth` / `sh_refresh` cookies on the outgoing
       response via `NextResponse.next({ request: { headers } })`.
    4. On failure: wipe both cookies. The admin gate below redirects to
       `/auth/login`; public paths just proceed anonymously.
- **Result.** With `JWT_TOKEN_TTL=10` in `.env.dev.local`, waiting > 10 s
  and clicking a new page now re-mints both tokens transparently and
  renders the page with no flicker. Only when the refresh token itself
  is expired/invalid does the user land on the login page — exactly the
  "state-of-the-art" interceptor behaviour requested.
- **Compatibility.** The existing `/api/*` catch-all silent-refresh loop
  is retained for client-side XHRs. Both paths are now covered.

### Architecture
- **Full BFF proxy**: All Symfony calls now go through a Next.js `/api/*`
  catch-all route (`src/app/api/[...path]/route.ts`). The browser never sees
  the JWT; access/refresh tokens live in httpOnly `sh_auth` / `sh_refresh`
  cookies managed by the proxy. Silent refresh on 401 is retried server-side.
- **CSRF double-submit**: New `sh_csrf` cookie bootstrapped by
  `src/proxy.ts` (Next 16's new name for `middleware.ts`); unsafe requests
  attach `X-CSRF-Token` automatically in `src/api/base.api.ts`.
- **Axios**: `baseURL` switched to `/api`, all `localStorage` token handling
  removed.
- **Server Components everywhere sensible**:
  - `src/app/layout.tsx` reads `sh_lang` cookie and sets `<html lang>`.
  - `src/app/[[...slug]]/layout.tsx` and `page.tsx` prefetch navigation +
    page content (new `/pages/by-keyword/{keyword}` endpoint) and export
    `generateMetadata` so titles are correct on the very first paint — no
    more "SelfHelp V2 → real title" flicker.
  - `src/app/admin/layout.tsx` gates admin by cookie and prefetches the
    admin tree + authenticated user profile.
  - New `src/app/privacy/page.tsx` static server component linked from the
    footer (strictly necessary cookies — no consent banner needed).

### Caching & invalidation
- `src/config/react-query.config.ts` rewritten with tiered defaults:
  `PAGE_CONTENT` (1s / 1m), `FRONTEND_PAGES` (10m / 30m),
  `ADMIN_PAGES` (5m / 30m), `LOOKUPS` (30m / 1h), `LANGUAGES` (Infinity),
  `USER_DATA` (30s / 5m, refetch on focus).
- **ACL-versioned nav invalidation**: Backend `User.acl_version` field +
  new `bumpAclVersion()` call whenever ACLs change. Frontend
  `useAclVersionWatcher` invalidates `['frontend-pages']` the moment
  `user.aclVersion` changes — no more refetching on every navigation.
- Deleted `useNavigationRefresh` and `PageContentContext`; both were
  triggering large unnecessary re-renders on each route change.

### State management
- New `src/app/store/ui.store.ts` (Zustand, persisted) owns `isPreviewMode`.
  `usePreviewMode` now reads from it so all consumers share one truth and
  SSR hydration is flicker-free.
- `src/app/store/admin.store.ts` now stores only `selectedKeyword` instead
  of the whole page object; leaf components use the new
  `useSelectedAdminPage(keyword)` selector hook which subscribes to a single
  row of the admin-pages cache via `select`, eliminating tree-wide
  re-renders while editing inspector fields.

### Language
- **No more hardcoded locale → id map.** The `languages` table is
  user-editable (admins can rename, add, delete locales), so a hardcoded
  map drifted the moment any language changed. The proxy (`src/proxy.ts`)
  now records only a `sh_accept_locale` *hint* cookie (the raw `Accept-Language`
  tag). The authoritative resolution happens server-side in
  `resolveLanguageSSR()` which consults the live `/languages` list and
  matches against `language.locale` (exact, then prefix), falling back to
  the first language in the list.
- `src/app/_lib/server-fetch.ts` gains `getPublicLanguagesSSR()`,
  `resolveLanguageSSR()` and `getPageByKeywordSSRCached()` — all wrapped
  in React `cache()` so each request hits Symfony at most once per
  endpoint even though the same data is consumed by root layout, slug
  layout, slug page and `generateMetadata`.
- `LanguageContext` seeded with the server-resolved `initialLanguageId`
  (no more hardcoded id `2` fallback).
- `<html lang>` now uses the primary subtag of the actual resolved
  locale (e.g. `de` from `de-CH`) instead of a lookup table.

### Backend additions (required by the frontend)
- `User.acl_version` column + Doctrine migration
  `Version20260421000000`.
- New `GET /cms-api/v1/pages/by-keyword/{keyword}` endpoint with regex
  constraint (`page_id` now `\d+`) to avoid route collisions. **Route
  registered** in both `db/update_scripts/api_routes.sql` (base install)
  and the `Version20260421000000` migration (existing installs) under the
  route name `pages_get_by_keyword`.
- `UserDataService::getUserData` returns `acl_version`.

### Post-audit fixes (plan gaps closed)
- **LanguageContext invalidation**: `setCurrentLanguageId` now issues
  **scoped** `queryClient.invalidateQueries` calls for
  `['frontend-pages']` and `['page-by-keyword']` on every change (the
  legacy `['page-content']` key was removed earlier with
  `usePageContent`; that entry is historical only and the code tracks
  the two live keys). The previous version wrote the cookie + changed
  state only, which meant clicking a language option did not refresh
  the visible page content until the next hard reload (plan §9
  requirement).
- **Admin SSR prefetches lookups**: `src/app/admin/layout.tsx` now
  prefetches `/admin/lookups` into the `LOOKUPS` cache tier alongside
  admin pages and user data, so inspector/form dropdowns no longer round-
  trip on first admin paint (plan §12 requirement).
- **Architecture diagrams**: `architecture.md` §15 rewritten with
  mermaid flow diagrams for request lifecycle, BFF proxy, ACL-versioned
  nav invalidation, language change, and a server/client file map, plus
  an explicit table of deliberate deviations from the plan with rationale.

### Auth hardening (runtime fixes, 2026-04-21)
- **BFF silent refresh now covers every HTTP method.** The catch-all
  `src/app/api/[...path]/route.ts` buffers the incoming request body via
  the new `bufferRequest()` helper *before* forwarding; on a 401 it
  refreshes tokens and replays the exact same request (GET/POST/PUT/
  PATCH/DELETE) with the new Bearer. Previously, mutations surfaced a
  `logged_in: true` 401 and the client had to retry — that dance is
  gone.
- **Silent refresh covers `/auth/user-data` too.** A user with an
  expired access token but a valid refresh token now lands on an
  authenticated screen without seeing the login page. (The dedicated
  `/api/auth/me` handler has since been collapsed into the catch-all —
  Refine's `authProvider` calls `/api/auth/user-data` directly, which
  goes through the same refresh-on-401 loop as every other GET.)
- **Axios interceptor end-game.**
  `src/api/base.api.ts` response interceptor now:
  1. Retries once (sets `_retry`) when the proxy surfaces a
     `401 logged_in: true` (race on cookie rotation).
  2. Redirects to `/auth/login?redirect=<current>` on
     `401 logged_in: false` but **only when the current path is under
     `/admin/*`**. Public pages still see the 401 and continue as
     anonymous — no spurious bounces from `/auth/me` returning null on
     `/`.
  3. Keeps the existing `/no-access` redirect for admin permission
     denials on non-data operations.
  The comment referencing `/auth/me` has been updated to
  `/auth/user-data` now that the dedicated route is gone.
- **Dead flag removed.** `_loggedInRetry` was declared on
  `InternalAxiosRequestConfig` but never read; dropped.
- **Axios stays, explicitly.** Docstring in `base.api.ts` now documents
  why axios is kept (interceptor surface + `AxiosResponse<T>` coverage
  across 40+ clients).
- **CSRF diagnostics.** `validateCsrf()` logs a non-secret diagnostic
  in development when the cookie/header mismatch (path, method,
  `hasCookie`, `hasHeader`, `cookieMatchesHeader`). Never logged in
  production.

### Dependency updates (2026-04-21)
- **Safe wave (same major)** applied to 50+ packages: all `@mantine/*`
  9.0.1 → 9.0.2, all `@tiptap/*` 3.10 → 3.22, `next` 16.0.3 → 16.2.4,
  `@tanstack/react-query` 5.90 → 5.99, `axios` 1.13 → 1.15,
  `eslint-config-next` 16.0 → 16.2, plus `@tabler/icons-react`,
  `@types/react`, `@typescript-eslint/*`, `dompurify`, `knip`, `nuqs`,
  `postcss`, `react-querybuilder`, `tailwindcss`, `zustand`, etc.
- **Safe majors**: `@types/node` 24 → 25 (types only),
  `html-react-parser` 5 → 6 (es2016 build target, no runtime impact),
  `react-dropzone` 14 → 15 (breaking change is only `isDragReject`
  post-drop reset — not used in the codebase),
  `knip` 5 → 6 (dev tool, config schema compatible).
- **Deferred majors** (waiting on upstream):
  - `eslint` 9 → 10: `eslint-config-next` 16.2.4 does not yet support
    ESLint 10 — tracked in `vercel/next.js#91702`. `eslint-plugin-react`
    is also blocking. Stay on 9.39.4 until the ecosystem catches up.
  - `typescript` 5.9 → 6.0: bridge release toward TS 7 that flips nine
    tsconfig defaults (`strict`, `types: []`, `module` / `target` /
    `moduleResolution`, `rootDir`, etc.). Requires a dedicated tsconfig
    migration pass; not a drop-in bump.
- **Bonus cleanup**: removed the explicit `@typescript-eslint/eslint-plugin`
  devDep — it was never imported anywhere and is already provided
  transitively by `eslint-config-next` via `typescript-eslint`. Fixes
  the peer-range conflict that blocked the install.
- **Type fix**: `src/app/api/_lib/proxy.ts` `BufferedRequest.body`
  narrowed from `Uint8Array | null` to `ArrayBuffer | null` because
  `@types/node` 24.12 tightened `Uint8Array<ArrayBufferLike>` and it no
  longer satisfies `BodyInit`. `ArrayBuffer` is a cleaner shape anyway
  and `fetch()` accepts it directly.

### CSRF bootstrap for API-only clients
- New `GET /api/csrf` endpoint (`src/app/api/csrf/route.ts`). Returns the
  `sh_csrf` token and sets the cookie when missing. The browser flow
  gets the cookie via `src/proxy.ts` on any page visit, so the UI
  never needs this endpoint. It exists so API-only callers (curl,
  Postman, integration tests) can acquire the double-submit token in
  one call before hitting any mutating `/api/*` route.
  *Browser unaffected — no app code change required.*

### Auth-aware 404 page
- `src/app/not-found.tsx` is a thin Server Component that reads the
  httpOnly `sh_auth` cookie and passes a plain `isAuthenticated: boolean`
  to a new `src/app/NotFoundClient.tsx` which owns the Mantine UI. The
  "Sign in" button only renders for unauthenticated users; signed-in
  visitors see "Back to home" (filled variant) — a second "sign in"
  CTA would be confusing noise for them.
  *Why the split:* Mantine `Button component={Link}` passes a function
  (`LinkComponent`) as a prop, which React 19 forbids across the
  RSC → Client Component boundary ("Functions cannot be passed
  directly to Client Components"). Keeping the Mantine JSX inside the
  client file resolves the error cleanly.

### Next 16 `middleware.ts` → `src/proxy.ts` rename (CRITICAL BUG FIX)
- Next 16.0 deprecated `middleware.ts` and renamed the file convention
  to `proxy.ts` (with the exported function renamed from `middleware` to
  `proxy`). Additionally, when the project uses a `src/` folder the file
  must live at `src/proxy.ts`, not at the repo root.
- Our project had `middleware.ts` at the repo root. In Next 16 dev this
  silently does nothing — no error, no warning, just zero executions.
  Consequences we hit:
  - `sh_csrf` was **never** bootstrapped, so every browser-initiated
    `POST /api/auth/login` returned `403 CSRF validation failed` on a
    fresh session (proxy log showed `hasCookie: false, hasHeader: false`).
  - `sh_accept_locale` hint was never recorded, so the language
    resolver always fell back to the first `languages` row.
  - `/admin/*` cookie-gate redirect never fired, leaking the admin
    shell on unauthenticated direct visits (Symfony still refused the
    data calls, but the shell rendered).
- Fixed by creating `src/proxy.ts` with `export function proxy(...)` and
  deleting the dead root-level `middleware.ts`. Dev logs now show a
  `proxy.ts: Xms` column on every request, confirming execution.

### Mantine color-scheme bootstrap — final approach
- Progression of attempts:
  1. `<ColorSchemeScript />` from `@mantine/core` — warned because the
     component is `'use client'` (CC → RSC `<script>` boundary).
  2. Inline `<script dangerouslySetInnerHTML>` in RSC — warned because
     React 19 validates **every** `<script>` node in the tree.
  3. `<Script strategy="beforeInteractive">` from `next/script` — *still*
     warned because Next renders a React `<script>` element during SSR.
  4. `<script src="/mantine-color-scheme.js" />` directly in `<head>` —
     *still* warned; React 19's tree-level validator fires on any
     `React.createElement('script', ...)` regardless of `src` vs inline.
- **Final fix**: new `ColorSchemeInjector` client component
  (`src/app/components/shared/common/ColorSchemeInjector.tsx`) that uses
  `useServerInsertedHTML` from `next/navigation` to stream a
  `<script src="/mantine-color-scheme.js" />` tag into the document head
  *outside* React's render tree. `useServerInsertedHTML` runs only during
  SSR streaming, and the HTML it returns is injected directly — React's
  script validator never sees it, so no warning is emitted. On the client
  the hook is a no-op. The bootstrap file lives in
  `public/mantine-color-scheme.js` and is served blocking (no
  `async`/`defer`) so it runs before hydration, preserving the no-FOUC
  guarantee that Mantine's helper provided.

### ThemeToggle hydration mismatch
- `src/app/components/shared/common/ThemeToggle.tsx` rendered a different
  SVG icon on server (`IconDeviceDesktop` — Mantine's `'auto'` default)
  vs. client (e.g. `IconSun` after reading localStorage), producing a
  hydration error with mismatched `<path d=...>` children.
- The mismatch is intrinsic: the stored color scheme lives in
  `localStorage`, which the server cannot read. Added a `mounted` flag so
  the trigger renders the `auto` icon on SSR + first client paint (match),
  then swaps to the real icon after mount. Markup is identical across
  SSR/hydration, and the one-frame icon swap is imperceptible.

### Runtime bug fixes
- **`window is not defined` during SSR.**
  `src/app/components/shared/common/debug/DebugMenu.tsx` assigned
  `(window as any).captureDebug = ...` at module top-level; even with
  `'use client'`, Next.js evaluates the module on the server when it
  appears in an RSC-imported subtree. Wrapped in
  `if (typeof window !== 'undefined')`.
- **404 page circular redirect.** `src/app/not-found.tsx` linked back
  to `/home` which does not exist, so the "Take me back home" button
  looped to another 404. Rewritten to offer "Back to home" (`/`) and
  "Sign in" (`/auth/login`) side by side. Also split into a thin
  `async` server-component wrapper (`not-found.tsx`) that reads
  `sh_auth` and a `NotFoundClient` client component that renders the
  Mantine UI — React 19 disallows function-valued props (like
  `component={Link}`) from crossing the RSC → CC boundary.
- **`DOMPurify.sanitize is not a function` on SSR.**
  `dompurify@3.x` returns a stub (no `.sanitize`) when loaded outside
  a browser, because its constructor calls `getGlobal()` which yields
  `null`. The error surfaced the moment any Client Component using
  DOMPurify was rendered during the server pass (e.g. `ButtonStyle`
  computing `confirmation_message` at the top of its body).
  - Replaced every `import DOMPurify from 'dompurify'` with
    `import DOMPurify from 'isomorphic-dompurify'` across 13 files
    (`html-sanitizer.utils.ts`, `ButtonStyle`, `HtmlTagStyle`,
    `InputStyle`, mantine `BoxStyle` / `TextStyle` / `TitleStyle` /
    `ChipStyle` / `TextInputStyle` / `TextareaStyle`, and two admin
    page-version / scheduled-job modals).
  - `isomorphic-dompurify` wraps DOMPurify with `jsdom` on the server,
    so the API is identical in both environments. `jsdom` only affects
    the Next.js server process — the client bundle is untouched.
  - Removed `dompurify` from `package.json` (it remains a transitive
    dependency of `isomorphic-dompurify`); direct imports are now
    disallowed — importing `dompurify` in a Client Component will
    break SSR again.
- **Hydration mismatch on Mantine input labels/descriptions.**
  `sanitizeHtmlForInline` (in `src/utils/html-sanitizer.utils.ts`) used
  `document.createElement` and recursive `Node` walking, so it only
  worked in a browser; on the server it short-circuited to the raw
  HTML. When the Tiptap-authored label arrived as
  `<p class="single-line-paragraph">first name</p>`, the server
  emitted the `<p>` wrapper while the client stripped it, triggering
  "Hydration failed" on every form field. Rewrote the function as a
  pure-string regex pipeline (no DOM access) so server and client
  produce byte-identical output, with the same transformation rules
  as before (`<h1..6>` → `<strong>`, `<p>`/`<div>` unwrapped, lists
  collapsed to bullets, other block tags stripped).
- **`Maximum update depth exceeded` in `LanguageTabsWrapper`.**
  Two compounding causes:
  - `usePublicLanguages` / `useAdminLanguages` returned `data || []`,
    and the `[]` fallback was a fresh array every render — any
    `useMemo`/`useEffect` depending on `languages` re-computed
    endlessly while the request was in flight. Fixed with a frozen
    `EMPTY_LANGUAGES = Object.freeze([])` module constant.
  - `LanguageTabsWrapper` mirrored the `value` prop into
    `languageValues` local state inside a `useEffect`, but
    `parseValue()` allocated a new array on every call → the effect
    re-ran, set state, re-rendered, and the cycle repeated. Removed
    the local state entirely; `languageValues` is now a `useMemo`
    derivation of `value` + `publicLanguages`. Only `activeTab`
    (genuine UI state) remains as `useState`.
- **Developer noise removed.**
  Deleted the `console.log('📤 PermissionAwareApiClient: Making POST
  request', ...)` block from `src/api/permission-aware-client.api.ts`
  — it spammed the devtools console on every mutation and its payload
  diagnostics are already available via the Network tab.
- **Password-manager hydration mismatch on `/auth/login`.**
  Autofill extensions (SharkID / Bitwarden / Dashlane / 1Password,
  etc.) mutate login inputs *before* React hydrates: they add custom
  attributes (`data-sharkid`, `data-sharklabel`) and even inject
  sibling elements like `<shark-icon-container>`. The resulting DOM
  no longer matches the SSR HTML, so every login visit threw
  "Hydration failed". Added `suppressHydrationWarning` on
  `src/app/auth/login/page.tsx`'s `<form>`, `TextInput`, and
  `PasswordInput` — tightly scoped to the login form, matching
  React's documented escape-hatch for extension-driven mutations.
  Also set proper `autoComplete` values (`username`,
  `current-password`) so well-behaved managers use the standard
  signal instead of guessing from placeholders.
- **Same mismatch across all dynamic CMS forms.**
  The exact same autofill-extension problem surfaced on every
  `form-record` / `form-log` page rendered by the CMS — the
  `<input name="first_name">` / email / phone / textarea fields are
  prime autofill targets. Applied `suppressHydrationWarning` in four
  places, tightly scoped so strict hydration is still enforced
  everywhere else:
    - `src/app/components/frontend/styles/FormStyle.tsx` — on the
      generated `<form>` element so any sibling node the extension
      injects *inside* the form is tolerated.
    - `src/app/components/frontend/styles/mantine/inputs/TextInputStyle.tsx`
      — on the `<TextInput>` (Mantine forwards the prop to the
      underlying `<input>` so the `data-sharkid` / `data-sharklabel`
      attribute diffs are suppressed at the correct DOM node).
    - `src/app/components/frontend/styles/mantine/inputs/TextareaStyle.tsx`
      — on both the Mantine `<Textarea>` and the fallback bare
      `<textarea>` (the non-Mantine render path).
    - `src/app/components/frontend/styles/mantine/inputs/NumberInputStyle.tsx`
      — on the `<NumberInput>` (extensions also decorate
      numeric fields like postal code / phone / age).
  Verified via the Cursor browser MCP on `/form` after login: the
  console shows **zero `shark-*` diffs**. The only residual
  "hydration" *debug* messages (not errors) are `data-cursor-ref`
  attributes the MCP tool itself injects for its ref-tracking, so
  they never appear in production.

### Known backend-side issue (not a frontend bug)
- **`/api/auth/me` sometimes returns 500 with `rename(... __CG__AppEntityGroup.php) Access is denied (code: 5)`.**
  This is Symfony + Doctrine ORM + Windows file-locking on the dev
  proxy cache — the frontend proxy simply forwards whatever the
  Symfony API returns. Doctrine writes proxies as
  `<name>.<hash>.php` then atomically `rename()`s them into place;
  on Windows, that `rename()` fails with `EACCES (5)` whenever any
  other process still has the target file open:
    - PHP OPcache holding the file descriptor from the previous request.
    - A parallel request inside the same PHP-FPM worker pool.
    - Anti-virus briefly scanning the file.
  It is not specific to any one endpoint; *any* code path that hits
  the lazy-loaded `App\Entity\Group` (and by extension most auth /
  user endpoints) can trip it once after a code change.

  **Fix on the backend side (run in `sh-selfhelp_backend`):**
  ```bash
  php bin/console cache:clear --env=dev
  # or, if PHP still has handles open, delete manually after stopping PHP-FPM / Apache:
  rmdir /s /q var\cache\dev\doctrine\orm\Proxies
  ```
  **Permanent mitigation (backend):** add to `php.ini` / `.user.ini`:
  ```ini
  opcache.validate_timestamps=1
  opcache.revalidate_freq=0
  opcache.file_cache_only=0
  ```
  or set `doctrine.orm.auto_generate_proxy_classes: false` and
  pre-generate proxies once with `doctrine:cache:clear-metadata`.

### Post-audit polish (follow-ups)
- **`isUpdatingLanguage` removed from `LanguageContext`**: consumers
  (`DynamicPageClient`, `LanguageSelector`, `DebugMenu`) now derive the
  "language change in flight" signal from
  `useIsFetching({ queryKey: ['page-content'] })` +
  `useIsFetching({ queryKey: ['page-by-keyword'] })`. Single source of
  truth, no redundant `setTimeout`/rAF flag, matches plan §9's original
  intent.
- **`useSelectedAdminPage` split out**: moved from `useAdminPages.ts`
  into its own `src/hooks/useSelectedAdminPage.ts` so leaf components
  (inspectors/editors) don't pull the full hierarchy-transform closure
  through the import graph.
- **`REACT_QUERY_CONFIG.CACHE` and `SPECIAL_CONFIGS` aliases removed**:
  every query now reads directly from `CACHE_TIERS.<TIER>`. Three new
  tiers added to cover prior callsites: `DEFAULT` (60s / 5m, was the
  old `CACHE`), `STATIC` (30m / 1h, was `SPECIAL_CONFIGS.STATIC_DATA`),
  `REAL_TIME` (0 / 30s, was `SPECIAL_CONFIGS.REAL_TIME`). 23 hook files
  migrated; no backward-compat shims retained.

### Removed / deprecated
- `useNavigationRefresh`, `PageContentContext`,
  `EnhancedLanguageProvider`, `SlugLayout` (client-side), stale
  `metadata.ts`, `document.title` effect in `WebsiteHeaderMenu`.
- All `localStorage` token helpers (`storeTokens`, `removeTokens`,
  `removeAccessToken`, `getAccessToken`, `getRefreshToken`,
  `getCurrentUser`, `getUserPayload`, `TOKEN_KEYS`) **hard-deleted**;
  auth lives in httpOnly cookies now.
- `jwt-decode` dependency removed from `package.json` (no longer used
  anywhere in the browser bundle).
- `IJwtPayload` type dropped — the browser no longer sees raw JWTs.
- `AuthApi.clearAuthData`, `checkFrontendAuth`, `forceTokenRefresh`
  helpers deleted — logout / refresh go through the BFF routes
  exclusively.
- `Providers` alias in `providers.tsx` removed.
- Hardcoded `LOCALE_TO_LANGUAGE_ID` map (in the old middleware file) and
  `LANGUAGE_ID_TO_HTML_LANG` in `layout.tsx` deleted.
- `readLangCookie`, `hasAuthSession` utility helpers deleted — no
  consumers remained.
- `dompurify` direct dependency removed from `package.json` — every
  import now resolves to `isomorphic-dompurify`.

---

v0.0.2
 - replace `MUI` with `Mantine`
 - Mantine v8
 - add `tailwind` css
 - add `refine`
 - rework authentication to be `refine` based
 - add `zustand` state management
 - add dark, light, auto theme toggle support
 - add `2fa` support

v0.0.1
- Initial commit
- MUI v5
- React v18
- nextJs v14
