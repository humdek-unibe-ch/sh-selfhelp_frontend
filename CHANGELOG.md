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
- Server Components render public pages (`src/app/[[...slug]]`), admin
  shell (`src/app/admin`), root layout and `/privacy`. Page title is
  final on first paint (no "SelfHelp V2" flicker).
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
- `usePreviewMode` and sidebar-collapsed state moved to a persisted
  Zustand store (`ui.store.ts`) so SSR hydration is flicker-free.
- `GET /cms-api/v1/pages/by-keyword/{keyword}` on the backend so the
  frontend never has to chain `nav → id → content`.
- Dark/light color-scheme bootstrap streamed via `useServerInsertedHTML`
  (`ColorSchemeInjector`) — no FOUC, no React 19 `<script>` warning.
- Language-aware 404 page (`src/app/not-found.tsx` + `NotFoundClient`).
- Page content payload now carries translated `title` and `description`
  per language (returned by `/pages/by-keyword/{keyword}` and by the nav
  list endpoint). `<title>` and `<meta name="description">` are populated
  from the payload directly; the nav list is used only as a safety net.

### Changed
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

### Removed
- Every browser-side JWT / `localStorage` token helper and related
  `jwt-decode` dependency.
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
