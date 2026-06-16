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

## v0.1.14 — 2026-06-16

### Fixed
- **You are no longer logged out when an instance restarts.** A plugin
  install / uninstall / update or a system update restarts the backend, which
  made a burst of API calls all `401` at once. Each one POSTed the *same*
  single-use refresh token: the first rotated it, every other call then sent a
  now-consumed token, got classified as a dead session, and the BFF/edge wiped
  a perfectly good login — so you were bounced to the sign-in page and had to
  log back in to see the result. Refreshes are now **coalesced server-side**
  (one upstream `/auth/refresh-token` per token, with a brief result replay for
  the concurrent burst), so the restart no longer kills the session.
- **Plugin info refreshes itself after install / uninstall — no manual reload.**
  The plugin list and detail used to need a full page refresh to show the new
  state once a background operation finished; the views now reconcile from the
  event stream (and on stream re-connect) so the installed/removed result
  appears on its own.

### Changed
- **Live updates are event-driven; polling is only a disconnected fallback.**
  Plugin-operation and system-update views no longer poll on a fixed timer.
  They refresh from the authenticated Mercure/SSE stream and fall back to a
  short poll **only** while the stream is disconnected **and** an operation is
  in flight, stopping on reconnect. On reconnect the views invalidate once to
  pick up anything missed while the stream was down. (New `auth-sse-status` and
  `plugin-sse-status` connection stores.)
- **Reads ride out a backend restart instead of erroring.** System and
  plugin-admin read queries (and safe BFF reads) now retry transient `5xx` /
  network failures with backoff during the manager's restart window — a genuine
  `4xx` still fails fast and a `401` still means "signed out".

### Added
- **Step tracking for plugin operations.** Install / update / uninstall now show
  a step checklist (queued → running → propagate → done, or the failure step)
  driven by the live operation, with the action button staying disabled and
  showing the current step for the whole background run (survives a reload
  mid-operation, can't be double-fired).
- **Step tracking for system updates.** The System Maintenance page shows the
  update progressing through its phases live over SSE — requested → claimed →
  backing up → updating → migrating → health-check → done — instead of a bare
  spinner, and repaints the moment the manager advances it.

### Fixed (UI)
- **Status pills are no longer clipped.** A global Mantine `Badge` theme override
  lets every pill render its full label (no mid-word truncation) across the CMS
  tables.

## v0.1.13 — 2026-06-15

### Fixed
- **Every cookie is now namespaced per instance — no more cross-instance bleed.**
  v0.1.12 isolated only the httpOnly session cookies; the browser-readable ones
  (`sh_csrf`, `sh_lang`, `sh_accept_locale`, `sh_color_scheme`, `sh_preview`,
  `sh_impersonate_target_email`) were still shared across instances on the same
  host, so language, theme and preview state could leak between
  `localhost:9111` and `localhost:9100`. All cookies now carry the
  `…_<SELFHELP_INSTANCE_ID>` suffix. The server reads the id from its env; the
  browser reads it back from `<html data-sh-instance>` (mirrored by the root
  layout), so the SET name always matches the READ name on both sides. A plain
  dev checkout (no instance id) keeps the historical names.
- **Plugin install shows real, sticky progress.** The **Install** button used to
  pop back to a clickable "Install" the moment the request was *queued* (and a
  background poll could reset it), so it looked installable again while the worker
  was still running. The button is now driven by the backend operation: it stays
  disabled and shows the live step (**Installing… / Updating…**) for the whole
  background run, survives a page reload mid-install, and can't be triggered twice.

### Changed
- **System update buttons reflect the whole operation.** "Request update / Request
  frontend update" now stay in their loading state for the entire in-flight update
  (not just the brief request), matching the plugin install button — so an update
  in progress is obvious and the buttons can't be re-fired mid-operation.

## v0.1.12 — 2026-06-15

### Fixed
- **Logging into / updating one instance no longer logs you out of the others.**
  When several instances run on the same host separated only by port
  (`localhost:9111`, `localhost:9100`, …) the browser shared ONE cookie jar
  (cookies are scoped by host, not port), so the httpOnly `sh_auth` / `sh_refresh`
  session cookies collided: a token minted by one instance was rejected by the
  next, whose silent refresh then wiped the shared cookie and bounced every
  instance to the login screen. The session cookies (`sh_auth`, `sh_refresh`,
  `sh_impersonate`) are now namespaced per instance (`…_<SELFHELP_INSTANCE_ID>`),
  so each instance keeps its own session and a restart/update of one no longer
  disturbs the others. The double-submit CSRF cookie stays shared (harmless).
  After upgrading, each instance asks for a single fresh login as the old shared
  cookie is retired.

## v0.1.11 — 2026-06-15

### Added
- **Maintenance page.** While the instance is in maintenance the backend returns
  a clean `503` for normal page traffic; the slug route now detects that and
  renders the seeded, styled `maintenance` CMS page — including the operator's
  live note via `{{system.maintenance_message}}` — instead of the 404 page. A
  self-contained `MaintenanceClient` fallback (the maintenance counterpart of the
  404 page) is shown when the seeded page is missing or unreachable, so visitors
  always get a styled "we'll be right back" screen rather than a raw error.

### Changed
- **Adaptive plugin-operation status tracking.** The admin plugin manager now
  polls quickly (every 2s) only while an install / uninstall / disable / purge
  operation is actually in flight, and stops once every operation reaches a
  terminal state — so progress stays live during an action without relying solely
  on Mercure, and there is no constant background polling when idle. The
  operations query drives the plugin list, detail, and available-plugins views,
  and uninstall / purge now invalidate the operations cache so fast polling
  engages immediately when an action is triggered.

## v0.1.10 — 2026-06-15

### Fixed
- **The System Maintenance page locks both update requests while one runs.**
  While an update operation (core OR frontend) is in flight, the "Request update"
  and "Request frontend update" buttons are now disabled and a notice explains
  why — so an admin can no longer fire a second, conflicting update (for example
  a frontend swap mid core update) and corrupt the instance. The buttons
  re-enable when the operation reaches a terminal state.

## v0.1.9 — 2026-06-15

### Fixed
- **A backend restart no longer logs the operator out.** Installing or updating
  a plugin briefly restarts the backend; during that window a silent-refresh
  attempt that could not reach the backend (a network error or a `502`/`503`
  while it restarts) was treated the same as a *rejected* refresh token, so the
  BFF/edge cleared the session cookies and bounced the admin to the login page.
  Silent refresh now distinguishes **unreachable** (transient — keep the
  session and let the client retry) from **invalid** (the backend reached a
  verdict and rejected the token — the only case that logs you out). The
  catch-all proxy returns `503` (with the cookies intact) instead of a
  session-killing `401` when the backend is briefly unavailable.

## v0.1.8 — 2026-06-15

### Added
- **Frontend-only updates from the CMS.** The System Maintenance page gains an
  "Update frontend only" section: an admin can pick a registry-published
  frontend version (newest first, with manual entry as an offline fallback), run
  a lightweight compatibility preflight, and request a frontend-only update for
  the current instance. Because the frontend ships independently of the core, an
  instance already on the newest core can still move to a newer compatible
  frontend. The swap is stateless — no destructive-migration warning, no backup
  prompt, no typed confirmation — and, like every update request, the browser
  never sends an `instance_id` and needs `admin.system.update` to submit. The
  SelfHelp Manager re-resolves the signed frontend release and performs the
  authoritative compatibility check before swapping only the frontend container.

## v0.1.7 — 2026-06-15

### Fixed
- **Public pages no longer 500 with `Cannot find module 'jsdom-<hash>'`.**
  Server-side HTML sanitization (`isomorphic-dompurify`, which lazily loads
  `jsdom`) crashed every server-rendered page that sanitizes content — the
  public `[[...slug]]` route and admin styles — in the production image. Next
  16's Turbopack build externalizes those packages under a content-hashed
  specifier resolved via a symlink in `.next/node_modules`, but that symlink
  pointed one directory level too high once the standalone `build/` wrapper is
  flattened into the image, leaving it dangling. The packages are now declared
  as `serverExternalPackages` and the Docker build re-points the hashed
  external symlinks at the real packages it already ships, so sanitization
  resolves at runtime. (vercel/next.js#89037, #88844)
- **No more "logged out every few minutes" on production instances.** The
  admin auth guard re-validates by parsing `/api/auth/user-data` (a ~2 KB
  permission payload, above the proxy compression threshold). Before the
  v0.1.6 BFF encoding fix that response could arrive zstd-garbled, so the JSON
  parse threw, the guard treated it as "not authenticated", and the admin was
  bounced to the login page on the next focus/navigation — roughly every few
  minutes of active use even though the JWT was still valid for an hour. With
  the proxy encoding fix the payload now parses cleanly and the session lasts
  its full TTL.

## v0.1.6 — 2026-06-12

### Fixed
- **Creates no longer "succeed silently then 409" behind the BFF.** The
  catch-all proxy forwarded the browser's `Accept-Encoding` (Chrome includes
  `zstd`) to Symfony, whose web server compressed large responses with
  zstd — a coding Node's fetch does not decode. Successful create/update
  responses above the compression threshold reached the browser as binary
  garbage: the entity (user, page, …) WAS created server-side, but the UI
  showed no success, and retrying surfaced `409 already exists`. The proxy
  now lets Node negotiate codings it can decode and stops relaying
  `Content-Encoding` for bodies it already decoded.
- **Plugin runtime shims now work in the production image.** The
  `/api/plugins/runtime-shim/<specifier>` route enumerated module exports
  with a live `import()`, which the Next standalone image cannot satisfy
  (its pruned `node_modules` lacks `@selfhelp/shared`, `@mantine/*`, and
  `@tanstack/react-query`), so every plugin failed to load with a 500 on
  managed installs. The Docker build now emits a build-time export
  manifest (`runtime-shim-exports.json`) next to `server.js`, and the
  route serves shims from it, falling back to live import only in dev.
- **Mutations are no longer auto-retried** (`retry: 0` in the React Query
  defaults). A failed create (timeout, transient 5xx, deadlock) was silently
  re-POSTed after 1s; when the first attempt had already committed
  server-side, the retry surfaced as a confusing `409 Conflict`
  ("User/Page already exists") even though the user only clicked once.
  Errors now surface immediately and retrying stays an explicit user action.

---

## v0.1.5 — 2026-06-12

### Added
- **Manager-loop status on the System page**: the update status now renders
  the backend's `manager` block — a warning when a requested update sits
  unclaimed (the SelfHelp Manager is not picking it up), an explanation when
  no manager token is configured, and the `manager_loop` health component.
  All operator command snippets are wrapper-aware (`./shm.ps1` / `./shm.sh`).

### Changed
- **System/update types now come from `@selfhelp/shared@1.6.0`**: the
  in-tree mirror (`src/types/responses/admin/system.types.ts`) is deleted —
  it only existed while the published shared package predated the system
  contracts. `ISystemVersion`, `IUpdatePreflight`, `IUpdateStatus`,
  `IUpdateStatusManager`, … are imported from the shared bridge
  (`src/shared`), so the cross-repo contract has a single definition.

### Removed
- The hardcoded `v3.1.2` badge in the admin navbar (the real version is
  reported on the System page).

---

## v0.1.4 — 2026-06-10

### Added
- **Automatic registry release candidate**: tagging the frontend now sends the
  new version + built image digest to the unified registry's
  `auto-core-release` workflow, which checks compatibility against the latest
  published core and stages the signed frontend release as a reviewed PR
  (human merge still required before anything becomes installable).
- **`release-manifest.json`**: the single in-repo source for the supported
  core range (`supports.core`) and `requiredApiVersion` — read both by the
  release descriptor step and by the registry resolver at the released tag.

### Changed
- `release/frontend-release.template.json` now carries channel/build metadata
  only; the compatibility ranges moved to `release-manifest.json`.

## v0.1.3 — 2026-06-10

### Fixed
- **`frontend-release` tag pipeline no longer dies at the SARIF upload**: the
  workflow was missing the `security-events: write` permission, so
  `github/codeql-action/upload-sarif` failed with "Resource not accessible by
  integration" and killed the whole release after the image was already
  pushed (this is what broke the `v0.1.2` release — its image exists on GHCR
  but it has no GitHub Release/descriptor). The upload also moved to
  `upload-sarif@v4` (v3 is deprecated December 2026) and is now
  `continue-on-error` so an advisory code-scanning hiccup can never block a
  tagged release again.

### Changed
- `@selfhelp/shared` dependency raised to `^1.5.0` (deployment-kind + update
  releases contracts). This ships the dependency bump tagged as `v0.1.2`,
  whose release pipeline never completed.

## v0.1.1 — 2026-06-10

Version numbering note: the changelog jumps from `v0.0.6` to `v0.1.1` to align
with the `package.json` version line (already `0.1.0` for the platform 0.1.0
release), which the System Maintenance screen now self-reports.

### Added
- **Registry-fed update picker**: the System Maintenance "Target version" field
  is now an autocomplete fed by `GET /admin/system/update/releases` (core
  versions published in the official registry, newest first, current version
  excluded). When the registry is unreachable the field degrades to manual
  version entry — the flow never blocks.
- **Deployment kind row** on the System Maintenance screen: shows whether the
  backend runs as a managed **Docker image** or a **source checkout** (dev /
  composer setup), from the new `deployment` field in
  `GET /admin/system/version`.

### Changed
- When the backend reports `frontend_version: unknown` (no
  `SELFHELP_FRONTEND_VERSION` set — typical for dev), the screen now shows the
  frontend's own build-time package version labelled "self-reported" instead of
  the bare `unknown`.

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
