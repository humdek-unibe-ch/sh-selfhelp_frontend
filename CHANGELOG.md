# Changelog

All user-visible changes to the SelfHelp frontend are tracked here.

Format: each release gets a `## vX.Y.Z` heading followed by grouped
bullets under **Added**, **Changed**, **Fixed**, and **Removed**.
No engineering diary, no implementation detail — that belongs in
`dev_log.md`. Architectural rationale belongs in
`docs/architecture/ssr-bff-architecture.md`.

---

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
