/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
# Changelog

All user-visible changes to the SelfHelp frontend are tracked here.

Format: each release gets a `## vX.Y.Z` heading followed by grouped
bullets under **Added**, **Changed**, **Fixed**, and **Removed**.
No engineering diary, no implementation detail — that belongs in
`dev_log.md`. Architectural rationale belongs in
`docs/architecture/ssr-bff-architecture.md`.

---

## v0.0.6 — 2026-06-08

### Added
- **System Maintenance admin screen** (`/admin/system`): view this instance's
  SelfHelp / backend / frontend / plugin-API / DB-migration versions and
  installed-plugin compatibility, and see aggregated system health.
- **Connected update flow**: run an update compatibility preflight for a target
  version and request a signed update for this instance (the SelfHelp Manager
  performs the Docker work). A blocked preflight disables the request; a
  destructive database migration requires an explicit risk acknowledgement plus a
  typed confirmation. Live operation status with a progress bar and per-step
  detail.
- **Maintenance mode** toggle and a read-only **safe mode** indicator, with
  on-screen `sh-manager` guidance for server-side backups and support bundles.
- The screen honours the `admin.system.read`, `admin.system.update`, and
  `admin.system.maintenance` permissions; the browser never sends an instance id
  (the backend derives it), and env-forced maintenance is shown read-only.

See [docs/developer/system-maintenance-admin.md](docs/developer/system-maintenance-admin.md).

---

## v0.0.5 — 2026-05-28

### Fixed
- `isDevelopmentRuntimeUrl()` no longer flags same-origin plugin
  runtime URLs as development installs. The previous check only
  inspected `protocol === 'http:'` and a localhost hostname, so a
  regular registry / archive / connected install whose
  `frontendRuntimeUrl` was a relative path like
  `/plugin-artifacts/<id>-<ver>/plugin.esm.js` resolved against
  `window.location.href` to `http://localhost:3000/plugin-artifacts/…`
  on any localhost dev host — which matched the localhost hostname
  rule and tripped every downstream dev branch (`openDevelopmentReloadSources`
  opened a 404 SSE connection to
  `/plugin-artifacts/<id>-<ver>/__selfhelp_plugin_reload`,
  `resolvePluginAssetUrl()` enabled the legacy `dist/` rewrite path,
  the registerOne error hint told the user to start a dev runtime
  server that does not exist). The fix adds an origin equality
  check: when the resolved URL's origin matches
  `window.location.origin`, the runtime is served by the host
  itself and is treated as a regular install. Only cross-origin
  localhost URLs (i.e. an actual external Vite dev server on a
  different port like `http://localhost:5174/...`) are now
  recognised as development runtimes.

- `cacheBustUrl()` no longer absolutizes pure-relative plugin asset
  URLs against `window.location.href`. The previous implementation
  ran `new URL(rawUrl, window.location.href)` for every input, which
  converts `dist/plugin.css` (an archive-relative URL some plugin
  manifests still carry on the dev fast-path) into
  `http://localhost:3000/admin/plugins-host/<id>/dist/plugin.css` and
  short-circuits the downstream `resolvePluginAssetUrl()` check
  (which only resolves URLs that are still relative). Pure relative
  URLs are now preserved as relative, with the `_shDevReload` token
  appended via `URLSearchParams` so that `resolvePluginAssetUrl()`
  can subsequently anchor them against the plugin's runtime URL.
  Absolute (`http://…`) and host-relative (`/plugin-artifacts/…`)
  URLs continue to be parsed through `new URL()` as before. This
  fixes the dev-mode live-reload symptom where the stylesheet
  `<link>` 404s on every reboot, leaving the page apparently
  un-updated until a hard reload — provided the user is still
  running a plugin install whose manifest leaks a relative
  `dist/plugin.css` (the matching backend fix in `v8.0.0`
  `PluginInstaller` / `PluginUpdater` removes the leak at the
  source; this client-side fix is defence-in-depth for legacy DB
  rows persisted before the backend fix shipped).

## v0.0.4 — 2026-05-28

### Added
- `PluginRuntime` now emits two new `logger.debug` events on the
  development hot-reload path:
  - `Plugin development reload stream open` when an EventSource
    successfully connects to the plugin dev runtime's
    `__selfhelp_plugin_reload` endpoint, and
  - `Plugin development reload event received` whenever an SSE
    `reload` event arrives (including the payload data).

  Both are silent in production (logger defaults to `info`+); flip
  the host logger to `debug` to watch the SSE → re-import chain
  end-to-end in the browser console. The plugin-side
  `dev-runtime.mjs` already logs SSE client connect / reload
  broadcast unconditionally, so combining the two gives a full
  edit-to-reload trace without bisecting either codebase.

## v0.0.3 — 2026-05-28

### Changed
- Plugin runtime shim now consumes the canonical singleton contract
  from `@selfhelp/shared/plugin-sdk` instead of duplicating the list
  across three files. `runtime-globals.ts`, `runtime-globals.client.ts`,
  and the `/api/plugins/runtime-shim/[...moduleName]/route.ts`
  allowlist all read from `PLUGIN_RUNTIME_SHIM_SPECIFIERS` /
  `PLUGIN_RUNTIME_IMPORT_MAP` / `PLUGIN_RUNTIME_GLOBAL_KEY` exported
  by the shared package. Adding a new singleton is now a single edit
  to the shared list plus one matching `import * as` in
  `runtime-globals.client.ts`; TypeScript flags any drift at compile
  time.
- Bumped `@selfhelp/shared` peer dep from `^1.1.0` to `^1.2.0` to
  pick up the new runtime-shim contract export.

### Added
- Host now stashes and shims `@mantine/notifications` and
  `react/jsx-dev-runtime` so plugin dev-runtime servers (Vite
  middleware mode, which injects the JSX dev runtime automatically)
  can resolve them through the host instead of bundling a second
  Mantine or a second React copy. Fixes plugin dev live reload for
  plugins that consume notifications or run under a Vite dev server.

### Fixed
- Plugin manager API client now matches the backend route table. The
  previous routes (`/admin/plugins/install`, `/admin/plugins/{id}` for
  DELETE, `/admin/plugins/{id}/update`, …) returned 405/404 because
  the canonical routes are `POST /admin/plugins`,
  `POST /admin/plugins/{id}/uninstall`,
  `POST /admin/plugins/{id}/request-update`,
  `POST /admin/plugins/{id}/finalize-install`, and
  `POST /admin/plugins/{id}/finalize-update`. `api.config.ts`,
  `plugins.api.ts`, the React Query hooks, and the install/update
  callers have all been updated to use the canonical routes.
- `PluginsProvider` no longer calls `/cms-api/v1/plugins/manifest`
  directly from the browser (which 404s because Next.js doesn't
  route the upstream prefix client-side). The default `apiBaseUrl` is
  now `/api` so the call flows through the BFF proxy. SSR / server
  components can still pass an explicit `/cms-api/v1` override.

### Added
- Plugins page tabs (`Installed` / `Available` / `Sources`) are now
  persisted to the URL via `?tab=` so refresh / bookmark / share
  open on the selected tab. The default tab (`installed`) keeps the
  URL clean.
- Install plugin modal: Monaco JSON editor with inline validation
  replaces the plain JSON textarea, and a Mantine `Dropzone` plus a
  **Choose file…** button accept a drag-and-dropped or picked
  `plugin.json`. The loaded manifest is auto-formatted into the
  editor so reviewers can scan it before submitting.
- Add/Edit source modal: every field now has a descriptive helper
  text, plus an inline alert explaining that auth fields are only
  needed for private registries and that the token value is never
  stored in the database (only the env-var name is). Modal height
  bumped so the Name field is visible without scrolling.
- `@mantine/dropzone/styles.css` registered globally in `layout.tsx`
  so the new Dropzone renders correctly out of the box.

### Changed
- Install plugin, Purge plugin, and Add/Edit source modals now use the
  shared `ModalWrapper` from
  `src/app/components/shared/common/CustomModal/CustomModal.tsx` per
  the new modal rule in `AGENTS.md`. No more raw `Mantine.Modal` for
  these flows; standard header/footer/actions are consistent across
  the plugin admin.
- `IAdminPluginSource` gains `isSystem`, `trustLevel`, and
  `lastSyncedAt` fields, and the kind enum now mirrors the backend
  (`public-registry`, `private-registry`, `git`, `local`).
- The Sources panel marks host-managed rows with a lock icon, disables
  the delete button, and only allows toggling `Enabled` on system
  sources. The default `humdek-public` registry pointing to
  https://humdek-unibe-ch.github.io/sh2-plugin-registry/ ships with
  every install and is rendered exactly this way.

### Added
- New **Available** tab on `Admin → Plugins` (`PluginsPage` + new
  `AvailablePluginsPanel`). Lists every plugin advertised by the
  enabled `PluginSource`s and exposes a one-click **Install** button
  that runs the staged-install + finalize-install + enable flow with
  one tap. No additional restart or rebuild needed on the host —
  Symfony picks up the new bundle on the next request and Next.js
  HMR picks up the npm package on the next render.
- New API client helpers + React Query hook: `AdminPluginApi.listAvailable()`,
  `useAdminPluginsAvailable()`. Bound to the new
  `/cms-api/v1/admin/plugins/available` backend endpoint and the
  existing `admin.plugins.manage` permission.
- Two new BFF routes for the user impersonation feature:
  `POST /api/admin/users/[userId]/impersonate` (start) and
  `POST /api/admin/users/stop-impersonate` (stop). Both routes match the
  existing `sh_auth` / `sh_refresh` pattern: the impersonation JWT is
  stripped from the upstream JSON envelope and stored in an **httpOnly**
  cookie (`sh_impersonate`); the matching non-secret hint cookie
  (`sh_impersonate_target_email`) is the only thing JavaScript can read
  about the session. Stop blacklists the JWT upstream and clears both
  cookies regardless of upstream outcome so the admin is never trapped.
- Reactive impersonation store at `src/app/store/impersonation.store.ts`
  (Zustand). Boots once via `bootImpersonationStore()` and reads from
  three independent push channels — direct mutation calls
  (`setActive`/`clear`), Mercure `impersonation-status` events on the
  per-user topic, and a local `setTimeout(expires_in)` safety-net — so
  the banner is always consistent without polling.
- `useAclEventStream` now also handles `impersonation-status` events
  pushed over the same Mercure SSE connection: clicking **Stop** in
  one tab clears the banner in every other tab and on every other
  device of the same user within milliseconds. Wire contract is
  documented in `docs/architecture/ssr-bff-architecture.md` and at the
  top of `useAclEventStream.ts`.
- `useStopImpersonate` mutation hook (in `src/hooks/useUsers.ts`) that
  the impersonation banner now uses for the **Stop** button. The hook
  hits the new BFF route, refreshes the store, and reloads the page
  so the React tree rebuilds against the original admin's session.

### Changed
- The impersonation banner is now mounted **once at the root client
  boundary** (`ClientProviders`) instead of inside the admin shell or
  the website footer. The banner self-hides outside an active session,
  so the cost is one Zustand subscription per page; the upside is that
  it renders on the public website too — exactly where impersonation
  is most useful (debugging user-facing bugs without admin chrome
  hiding the page). Previously it was either invisible on the public
  pages (after the recent cleanup) or duplicated when both
  `AdminShell` and `WebsiteFooter` mounted it.
- `src/app/api/_lib/proxy.ts` impersonation handling rewritten:
  - New helpers `setImpersonationCookies`, `clearImpersonationCookies`,
    and `stripImpersonationFromBody` keep cookie/JSON handling in one
    place.
  - The catch-all proxy now picks the upstream `Authorization` header
    via `pickUpstreamToken`, which **deliberately ignores the
    impersonation cookie for `/auth/*` routes** so logout, refresh and
    user-data always run as the original admin (regression fix: the
    silent-refresh loop used to refresh the wrong user's session
    while impersonating).
- `useAuth` no longer mints its own non-reactive `useMemo` for
  `isImpersonating` and no longer runs a 10-second per-component
  interval. It subscribes to the new Zustand store, so every banner
  in the UI updates instantly when the cookie is set or cleared.
- The 5-second `setInterval` poll inside `impersonation.store.ts` is
  gone. The store now relies on the Mercure SSE push for cross-tab
  stop events, on the local `setTimeout(expires_in)` for TTL expiry,
  and on `visibilitychange` only for the cookie re-hydration after
  sleep — strictly event-driven and free of timer churn.
- **SSR + BFF now follow a single effective-identity rule for
  impersonation.** Both `src/app/_lib/server-fetch.ts::authHeaders` and
  `src/app/api/_lib/proxy.ts::pickUpstreamToken` use the impersonation
  cookie for every upstream call except a small admin-session-lifecycle
  list (`/auth/login`, `/auth/logout`, `/auth/refresh-token`,
  `/auth/two-factor-*`, `/auth/set-language`). `/auth/user-data` and
  `/auth/events` now follow impersonation, so the impersonated session's
  identity, ACL and Mercure topics all reflect the *target user* —
  before this fix, SSR rendered as the admin and the client refetched
  as the target, producing a Frankenstein UI on the first paint of
  every public page during an impersonation session.
- The lookups endpoint moved from `/admin/lookups` to `/lookups` and
  the matching constant was renamed `ADMIN_LOOKUPS` →
  `SYSTEM_LOOKUPS` in `src/config/api.config.ts`. The SSR helper
  `getAdminLookupsSSR` was renamed `getSystemLookupsSSR` and its
  single caller (`src/app/admin/layout.tsx`) updated. No
  user-visible change — the data, response schema and React Query
  key are unchanged — but the URL no longer claims to be admin-only,
  which matches the actual access policy and unblocks impersonation
  on any page that uses `ProfileStyle`.

### Fixed
- **Critical security regression.** The impersonation JWT used to be
  written from the browser via `document.cookie`, which made it readable
  by any JavaScript on the page (XSS-vulnerable). The JWT now lives in
  an httpOnly cookie set by the new BFF route — JS cannot read or write
  it. The non-secret hint cookie (just the target email) is the only
  thing the React layer ever sees.
- The dead `X-Impersonation-Token` header that the axios interceptor
  attached to every request was removed — Symfony never read it and it
  inflated network logs.
- `console.warn(hasAdminAccess)` shipped in `AdminShellWrapper` was
  removed (debug noise on every admin render).
- "You don't have permission to view users" apostrophe restored in
  `UsersPage.tsx`.
- Removed leftover commented import in `AuthButton.tsx`.

### Removed
- `IMPERSONATE_COOKIE_MAX_AGE` constant (we now use the server-supplied
  `expires_in` so cookie lifetime always matches the JWT lifetime).
- `stopImpersonation` helper in `useAuth` — replaced by the
  `useStopImpersonate` mutation, which actually invalidates the JWT
  upstream instead of just deleting cookies client-side.

---
## Unreleased — 2026-05

### Added
- `simple-grid` and `grid-column` now accept their responsive Mantine v9
  shapes natively — `mantine_cols` and `mantine_grid_span` parse a
  stringified JSON object such as `{"base":1,"sm":2,"lg":3}` /
  `{"base":12,"md":4}` and pass it straight to `<SimpleGrid cols={…} />`
  / `<Grid.Col span={…} />`. The legacy CSV format
  (`xs:1,sm:2,md:3,lg:4`) and the plain integer string still work; bad
  input falls back to one column / `auto` so pages never crash.
- `global_fields.css_mobile` is finally honoured by the web renderer.
  `getCssClass` (`BasicStyle.tsx`) auto-prefixes every utility token in
  `css_mobile` with `max-md:` and appends them after the regular `css`
  classes, so the mobile values win below the `md` breakpoint while
  remaining a portable, platform-agnostic field for the planned native
  (react-expo) renderer.
- `docs/AI Prompts/README.md` documents the prompt-flow, multi-target
  rendering rules, mobile-first guardrails and how the responsive grid
  parsers behave — the canonical onboarding doc for anyone editing the
  generated examples or the backend prompt template.

### Changed
- All curated AI prompt example JSONs in
  `docs/AI Prompts/generated examples/` were rewritten to the
  mobile-first guardrails: responsive `mantine_cols` objects, `min-w-0`
  / `overflow-hidden` / `break-words` on cards in grids, responsive
  paddings (`p-4 sm:p-6 lg:p-8`) and display text (`text-3xl sm:text-4xl
  lg:text-5xl`), removal of `hover:-translate-y-*` (workspace rule), and
  `mantine_carousel_slide_size` switched from `100` (px, scroll trap) to
  `100%` so carousels fit the viewport on phones.
- The CMS editor's **Mobile CSS** picker (`css_mobile` field) is now
  filtered through the curated `@selfhelp/shared/cms-classes` allow-list
  so editors only see classes the planned native renderer can compile.
  The **Custom CSS** picker (`css` field) keeps the full Tailwind set.

### Fixed
- Importing the showcase JSON failed with HTTP 422 because two field
  names did not match the backend schema. `mantine_wrap` on `group` is
  rewritten to `mantine_group_wrap` (`'wrap'` → `'1'`, `'nowrap'` →
  `'0'`) and `mantine_spacing` on `simple-grid` is removed (only
  `mantine_vertical_spacing` is registered). A new idempotent script,
  `scripts/fix-ai-examples.mjs`, patches both patterns across every
  curated example.

## v0.1.0 — 2026-04

Major refactor: server-rendered public pages, httpOnly-cookie auth via a
Next.js Backend-For-Frontend proxy, and a clean tiered cache policy in
TanStack Query.

### Added
- GDPR-compliant `/privacy` notice is now a CMS-managed page (seeded by
  Symfony migration `Version20260425090000` on the backend), translatable
  in en-GB and de-CH out of the box. The page is marked `is_system = 1`
  so admins can extend / edit / translate it but never delete it; the
  static Next.js `/privacy` route was removed and the slug catch-all
  renders the CMS page like any other public page. The hardcoded footer
  link was also removed — the privacy link is now driven by
  `pages.footer_position` like impressum / agb / disclaimer, so all
  footer links share a single source of truth. Migration
  `Version20260425100100` follows up with a non-destructive cosmetic
  polish (Tailwind utility classes via the `css` field) so the page
  reads as a real GDPR notice rather than a wall of unspaced text.
- Every other system page now ships pre-populated from the CMS, courtesy
  of migration `Version20260425100000`: `login`, `two-factor-authentication`,
  `reset_password`, `validate` use their dedicated styled components
  (`login`, `twoFactorAuth`, `resetPassword`, `validate`); `profile` uses
  the `profile` style with translated labels for every section
  (account, name change, password reset, timezone, account deletion);
  `home`, `missing`, `no_access`, `no_access_guest`, `agb`, `impressum`,
  `disclaimer` use generic content components (`paper`, `theme-icon`,
  `title`, `text`, `button`, `list`, `list-item`, `card`, `alert`)
  arranged into a hero + body + CTA layout. All twelve pages are
  translated in en-GB and de-CH, marked `is_system = 1`, and editable
  end-to-end from the admin.
- Auth-critical fallback in the slug catch-all
  (`src/app/[[...slug]]/page.tsx`): when the CMS payload for `login` or
  `two-factor-authentication` is missing or empty, the request is
  redirected to the static React route (`/auth/login` /
  `/auth/two-factor-authentication`) instead of showing a 404 or empty
  page. The static routes are kept in the codebase as the runtime
  escape hatch — operators can never lock themselves out by deleting
  every section on the login screen or forgetting to apply the seeding
  migration.
- `SLUG_TO_KEYWORD` alias map in the slug catch-all so URLs that use
  kebab-case (`/no-access`, `/no-access-guest`, `/reset`) resolve to
  the canonical CMS keywords (`no_access`, `no_access_guest`,
  `reset_password`). The catch-all also special-cases the
  `/validate/[i:uid]/[a:token]` URL pattern that registration emails
  use, so account-activation links from existing campaigns keep
  working.
- Backend migration `Version20260425110000` publishes the auth and
  status pages by setting `is_open_access = 1`, marks
  `missing` / `no_access` / `no_access_guest` as `is_headless = 1`,
  deletes the content-less `profile-link` and `logout` page rows
  (they were navigation labels with no body), and writes Tailwind
  utility classes onto every system page's `sections.css` column so
  the rendered layout is centred, padded and visually grouped.
- Server Components render public pages (`src/app/[[...slug]]`), admin
  shell (`src/app/admin`), root layout and the seeded `/privacy` notice.
  Page title is final on first paint (no "SelfHelp V2" flicker).
- BFF: all Symfony calls go through `/api/*` on Next.js. Access & refresh
  tokens live in httpOnly `sh_auth` / `sh_refresh` cookies. Silent-refresh
  happens server-side on 401 and also preemptively in `src/proxy.ts`.
- CSRF double-submit: `sh_csrf` cookie + `X-CSRF-Token` header on unsafe
  methods. A `GET /api/csrf` endpoint is exposed for API-only clients
  (Postman, curl).
- Accept-Language-aware locale bootstrap via `sh_accept_locale` cookie;
  resolved against the live `/languages` list on the server — no hardcoded
  `locale → id` map anywhere.
- Hover-prefetch on navigation links (`usePagePrefetch`): moving the
  mouse over a menu item warms the next page's `page-by-keyword` cache.
- ACL-versioned navigation refresh: `useAclVersionWatcher` invalidates
  `frontend-pages` and `page-by-keyword` only when the backend rotates
  `user.acl_version`, instead of on every route change.
- Preview mode is cookie-backed and SSR-resolved via `PreviewModeProvider`;
  sidebar-collapsed state remains in the persisted Zustand UI store.
- `GET /cms-api/v1/pages/by-keyword/{keyword}` on the backend so the
  frontend never has to chain `nav → id → content`.
- Dark/light color-scheme bootstrap streamed via `useServerInsertedHTML`
  (`ColorSchemeInjector`) — no FOUC, no React 19 `<script>` warning.
- Language-aware 404 page (`src/app/not-found.tsx` + `NotFoundClient`).
- Page content payload now carries translated `title` and `description`
  per language (returned by `/pages/by-keyword/{keyword}` and by the nav
  list endpoint). `<title>` and `<meta name="description">` are populated
  from the payload directly; the nav list is used only as a safety net.
- Public website header is now a Server Component
  (`WebsiteHeader.tsx`). The menu items are fetched via
  `getMenuPagesSSR` and rendered into the SSR HTML, so the navigation
  appears at the same instant as the language selector / theme toggle /
  auth button — no more "menu builds in front of your eyes" flash.
  `WebsiteHeaderMenu` is a thin client wrapper that takes
  `initialMenuPages` and falls back to `useAppNavigation` once the
  client query is live.
- Real-time ACL push (Mercure): BFF route at `/api/auth/events` is now a
  thin Mercure-subscription proxy. It calls Symfony for a short-lived
  subscriber JWT, opens an upstream subscription against the Mercure hub
  (`{ hubUrl, topic, token }` discovery payload), and pipes the upstream
  `text/event-stream` body straight back to the browser as same-origin
  SSE. `useAclEventStream` listens for `acl-changed` events and
  invalidates `['user-data']`, which — combined with
  `useAclVersionWatcher` — refreshes the public navigation, the admin
  sidebar, and any per-page content within ~1 RTT, without requiring the
  user to click. Async backend jobs that grant new permissions surface
  in the menu immediately. The previous PHP-FPM-blocking polling
  implementation has been removed; PHP no longer holds long-lived SSE
  connections. Backend setup (Mercure hub Docker compose, JWT secret
  coordination) is documented in `sh-selfhelp_backend/README.md`.
- Shared navigation transform helpers in `src/utils/navigation.utils.ts`
  (`transformNavigationPages`, `selectMenuPages`, `selectFooterPages`,
  `selectProfilePages`) used by both the SSR menu / profile fetch and
  the client `useAppNavigation` hook so SSR and client renders produce
  identical DOM.
- The auth button's profile label is now part of the SSR HTML too
  (`getProfilePagesSSR` + `AuthButton.initialProfilePages`). German
  users no longer see "Profile" flash into "Profil"; the translated
  text is in the very first painted frame.

### Changed
- The login button (and any unauthenticated visit to `/admin/...`)
  now lands on the CMS-managed `/login` page. The static
  `/auth/login` route is reserved for the documented runtime
  fallback when the CMS payload is empty or unreachable.
- `src/config/routes.config.ts` now publishes the canonical
  CMS-managed URLs for every system page (`/login`,
  `/two-factor-authentication`, `/reset`, `/validate`, `/profile`,
  `/no-access`, `/missing`, `/agb`, `/impressum`, `/disclaimer`).
- The CMS admin sidebar's "Footer Pages" group now shows system
  pages with a `footer_position` (privacy, agb, impressum,
  disclaimer) so admins can find and edit them. The same pages
  also still appear under "System Pages → Legal" for the
  browse-by-purpose mental model.
- The avatar dropdown in the public header gracefully falls back to
  `Profile` + `Logout` items when the CMS catalogue contains no
  profile-related pages (the default after the `profile-link`
  page was deleted in `Version20260425110000`).
- `axios` base URL is now `/api` (the BFF). All `localStorage` token
  handling is gone; cookies are the single source of truth. Axios stays
  because of interceptors and the `AxiosResponse<T>` surface used across
  40+ clients — see `src/api/base.api.ts` for the full rationale.
- React Query tiered caching: `PAGE_CONTENT`, `FRONTEND_PAGES`,
  `ADMIN_PAGES`, `LOOKUPS`, `LANGUAGES`, `USER_DATA`, `STATIC`,
  `REAL_TIME`, `DEFAULT`. Every `useQuery` picks one tier; no legacy
  alias remains.
- Pages are fetched by **keyword** instead of by numeric id. Rationale
  in `docs/architecture/ssr-bff-architecture.md` §5.
- Admin store keeps `selectedKeyword` (a string) instead of a deep page
  object, so inspector edits no longer re-render the tree.
- Language selection writes `sh_lang` cookie and scopes invalidation to
  `frontend-pages` + `page-by-keyword` only.
- Next.js `middleware.ts` renamed and relocated to `src/proxy.ts` for
  Next 16 compatibility.

### Fixed
- The login button no longer dead-ends on the static
  `/auth/login` fallback when the CMS-managed `/login` page is
  available. Migration `Version20260425110000` flips
  `is_open_access = 1` on the auth pages so the BFF returns the
  payload to anonymous users; clearing the Redis cache
  (`redis-cli FLUSHALL`) is required after the migration since the
  Symfony `cache:pool:clear` command only releases in-memory locks.
- The `/validate/[i:uid]/[a:token]` URL pattern from registration
  emails now resolves correctly: the slug catch-all special-cases
  three-segment slugs starting with `validate` and `ValidateStyle`
  reads `uid` and `token` from `params.slug`.
- Access-token-expired SSR navigations no longer 404: `src/proxy.ts`
  rotates tokens *before* Server Components read cookies.
- Silent refresh now covers every HTTP method (GET / POST / PUT / PATCH
  / DELETE) via request buffering + replay in the BFF catch-all.
- Mantine input labels, CMS forms, login form and admin navbar no longer
  throw "Hydration failed" — fix set combines isomorphic DOMPurify,
  pure-string `sanitizeHtmlForInline`, and targeted
  `suppressHydrationWarning` on password-manager autofill targets.
- `LanguageTabsWrapper` "Maximum update depth" crash resolved by
  deriving state with `useMemo` and sharing a frozen empty-array constant.
- BFF cookie-rotation ordering: refresh-pair is now written before any
  body-carried pair, so the newest tokens win.
- Hover-prefetch and page-content caches now share the same key
  (`page-by-keyword`), so the prefetch actually warms the render path.
- `DebugMenu` no longer issues `/admin/pages` and a redundant
  `/pages/language/{id}` request on every public page load. Heavy
  data subscriptions moved into a panel that is only mounted while
  the menu is open.

### Removed
- Every browser-side JWT / `localStorage` token helper and related
  `jwt-decode` dependency.
- Static `src/app/privacy/{page,layout}.tsx` — the privacy notice is now
  seeded into the CMS by a backend Doctrine migration and rendered by
  the slug catch-all. The hardcoded `/privacy` link in
  `WebsiteFooter.tsx` was also removed.
- `src/app/no-access/page.tsx` and
  `src/app/two-factor-authentication/page.tsx` — both were static
  re-exports that took precedence over the slug catch-all and
  prevented the CMS-managed pages from rendering. The static
  `/auth/login` and `/auth/two-factor-authentication` routes are
  retained as the documented fallback target.
- `profile-link` and `logout` page rows on the backend (deleted by
  `Version20260425110000`). They were navigation labels with no body
  content; the avatar dropdown now synthesises `Profile` + `Logout`
  items from the route table when no profile-related CMS pages
  exist.
- `PageContentContext`, `EnhancedLanguageProvider`,
  `useNavigationRefresh`, the old `usePageContent` hook, the legacy
  `page-content` query key, and the `middleware.ts` file at the repo
  root.
- `CORS_CONFIG` block, `isRefreshing` dead code in `AuthButton`,
  `useInvalidateUserData`, the standalone `/api/auth/refresh` and
  `/api/auth/me` routes (folded into the catch-all), and the
  pre-existing `src/api/server.api.ts`.
- Direct `dompurify` import — every sanitizer now goes through
  `isomorphic-dompurify`.

### Dependencies
- Mass upgrade wave on same-majors: Mantine 9.0.1 → 9.0.2, Tiptap
  3.10 → 3.22, Next 16.0.3 → 16.2.4, TanStack Query 5.90 → 5.99,
  axios 1.13 → 1.15, plus 40+ minor bumps.
- Safe majors applied: `@types/node` 25, `html-react-parser` 6,
  `react-dropzone` 15, `knip` 6.
- Deferred: `eslint` 10 (waits on `eslint-config-next`), `typescript`
  6 (tsconfig migration).

---

## v0.0.2

- Replaced MUI with Mantine v8.
- Added Tailwind CSS.
- Adopted Refine for routing + auth orchestration.
- Zustand for state management.
- Dark / light / auto theme toggle.
- 2FA support.

---

## v0.0.1

- Initial commit.
- MUI v5, React v18, Next.js v14.
