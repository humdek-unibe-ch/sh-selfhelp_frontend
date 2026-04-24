# SSR + BFF Architecture

This document explains **why** the SelfHelp frontend is structured the
way it is after the v0.1.0 refactor, and **where to put new code** so it
fits the pattern. It is meant to be read once, from top to bottom, by
any developer touching this repo.

If you only want the "what changed" summary, see `CHANGELOG.md`.
If you want the step-by-step history with every bug we chased, see
`dev_log.md`.

---

## 1. Executive summary

1. **The browser never sees a JWT.** Access & refresh tokens live in
   httpOnly cookies rotated by a Next.js **BFF proxy**. Every Symfony
   call on the client goes to `/api/*` on Next.js, which forwards it.
2. **Public pages are Server Components.** The server resolves the
   language, fetches the page, and streams HTML with the real title and
   real content on the first paint. The client only hydrates.
3. **TanStack Query is the client cache.** Server-prefetched data is
   dehydrated into React Query so hydration is zero-network. A small,
   tiered set of cache keys holds everything.
4. **Refine wraps auth + admin routing.** Its `authProvider` reads
   from the BFF (never from `localStorage`) and shares the
   `['user-data']` query slot with the rest of the app.
5. **Pages are identified by keyword, not id.** The URL segment is the
   cache key, the prefetch key, and the Symfony endpoint parameter.
   Ids never leave the server.

---

## 2. Why Server Components + SSR?

Before v0.1.0 the public site was a client-only SPA. Every page load:

1. Rendered an empty shell with the default `<title>SelfHelp V2</title>`.
2. Kicked off the nav request.
3. Kicked off the page-content request only *after* nav resolved the id.
4. Replaced the title, rendered the real DOM, ran hydration.

Result: 2–3 visible flickers on every navigation, a "false-home" 404 for
authenticated users whose access token had just expired, SEO metadata
resolved one tick too late, and a large client bundle doing work the
server already had the data to do.

The refactor flips this on its head:

- `src/app/layout.tsx` and `src/app/[[...slug]]/layout.tsx` are **Server
  Components** (no `'use client'`).
- They call `src/app/_lib/server-fetch.ts` to resolve the language and
  prefetch the navigation + page payload **in parallel**, directly
  against Symfony (no `/api/*` hop — we are already in the trusted Node
  process).
- The result is dehydrated with `dehydrate(queryClient)` and handed to
  the client through `<HydrationBoundary>`.
- `generateMetadata()` on the slug page uses the same React `cache()`'d
  fetch, so the browser tab has the correct title before React mounts.

Benefits:
- **No waterfall**: nav and page content fly in parallel.
- **No title flicker**: `generateMetadata` wins the race.
- **SEO**: crawlers see the real HTML.
- **First Contentful Paint** is measured in 10s of ms on warm caches.
- **404 UX**: the server decides; the client never renders a shell just
  to discover the page doesn't exist.

### 2.1 When should a component be a Server Component?

Default to **Server Component**. Add `'use client'` only when you need
one of:

- React state (`useState`, `useReducer`).
- React effects (`useEffect`, `useLayoutEffect`).
- Browser APIs (`window`, `document`, `localStorage`, `navigator`).
- Event handlers on DOM nodes (`onClick`, `onChange`, etc. — *not* on
  links, see note).
- Third-party client-only libraries (Mantine interactive components,
  Refine hooks, TipTap, DnD-kit, recharts, etc.).
- `useContext`, `useQuery`, or any hook.

If none of those apply, the file stays on the server. The rule is
"smallest client surface possible" — isolate the interactive slice and
keep the wrapper server-side.

> Note: `<Link>` works in Server Components. Only DOM event handlers
> require a client boundary.

### 2.2 Good patterns

- **Async server wrapper → client island.** `src/app/not-found.tsx`
  reads the `sh_auth` cookie and hands a plain boolean to
  `NotFoundClient.tsx`, which renders the Mantine button (Mantine
  components are client). Don't try to pass functions (like
  `component={Link}`) across the boundary — React 19 forbids it.
- **`generateMetadata` shares `cache()` with the page.** Look at
  `getPageByKeywordSSRCached` in `src/app/_lib/server-fetch.ts` — the
  same call is made from the layout prefetch, from
  `generateMetadata`, and from the page itself, but Symfony is only
  hit once per request.
- **Seed the client cache, don't re-fetch.** Use
  `queryClient.prefetchQuery` on the server and wrap the subtree in
  `<HydrationBoundary>`. Do not write the same data again inside a
  client `useEffect`.

### 2.3 Anti-patterns

- `'use client'` at the root of a page or layout — it taints the whole
  subtree and defeats SSR prefetches.
- Reading `cookies()` or fetching data inside a Client Component on
  mount when the Server Component could have done it.
- Calling `fetch('/api/...')` from a Server Component (it adds a
  needless hop back into Next.js). Use the SSR helpers in
  `src/app/_lib/server-fetch.ts` which hit Symfony directly.

---

## 3. Why Backend-For-Frontend (BFF)?

A Backend-For-Frontend is a thin proxy that lives next to the UI and
exposes a UI-shaped API to the browser while talking to the real
backend on behalf of the user. In this repo the BFF is
`src/app/api/[...path]/route.ts` plus `src/app/api/_lib/proxy.ts`.

The motivation is **security** and **simplicity**:

- **No JWT in JavaScript.** Access and refresh tokens are set by the
  BFF as `httpOnly`, `SameSite=Lax`, `Secure` cookies (`sh_auth`,
  `sh_refresh`). JavaScript can not read them, XSS can not steal them.
- **Silent refresh is transparent.** The proxy buffers every request,
  forwards it to Symfony with the current bearer, and if Symfony
  replies 401 with `logged_in: true`, refreshes the tokens and replays
  the exact same request. The client sees a single successful response.
- **Same-origin.** `/api/*` is on `localhost:3000` (or the production
  host), so cookies just work — no CORS, no cross-site cookie quirks.
- **CSRF double-submit.** Unsafe methods carry an `X-CSRF-Token` header
  matched against the `sh_csrf` cookie. The proxy rejects anything
  that doesn't match.
- **Preemptive refresh for SSR.** Server Components can *read* cookies
  but cannot *write* them — so `src/proxy.ts` rotates tokens at the
  edge, before the request hits a Server Component, and mutates
  `req.cookies` so `cookies()` sees the fresh values.

### 3.1 Request lifecycle (client mutation)

```
Browser                Next.js                 Symfony
   │   POST /api/x         │                       │
   ├──────────────────────>│  X-CSRF match         │
   │                       │  attach sh_auth       │
   │                       ├──────────────────────>│
   │                       │          200 OR 401   │
   │                       │<──────────────────────┤
   │                       │  if 401 → refresh     │
   │                       │  then replay          │
   │                       ├──────────────────────>│
   │                       │<──────── 200 ─────────┤
   │                       │  Set-Cookie rotated   │
   │<──────── 200 ─────────┤                       │
```

### 3.2 Request lifecycle (SSR navigation)

```
Browser                Edge proxy            Next.js RSC              Symfony
   │   GET /test3          │                       │                     │
   ├──────────────────────>│                       │                     │
   │                       │  decode sh_auth JWT   │                     │
   │                       │  exp soon? refresh:   │                     │
   │                       ├───────────────────────────────────────────> │
   │                       │  rotate req.cookies   │                     │
   │                       │  render layout + page │                     │
   │                       ├─────────────────────> │                     │
   │                       │                       │  server-fetch.ts    │
   │                       │                       ├───────────────────> │
   │                       │                       │<──── page + nav ────┤
   │                       │  stream HTML + JSON   │                     │
   │<──── 200 ────────────┤                       │                     │
```

### 3.3 Extending the BFF

Need a new endpoint? You don't — every Symfony route is already reachable
via `/api/*`. Exceptions:

- **`/api/auth/login`** is a dedicated route so the proxy can sanitize
  the response body and set cookies atomically.
- **`/api/auth/logout`** explicitly clears cookies even if Symfony fails.
- **`/api/csrf`** is a one-shot token dispenser for API-only callers.

Do *not* add a new `/api/*` route just to transform the Symfony
response. Do the transform client-side in the hook.

---

## 4. How Axios is used now

`src/api/base.api.ts` is the single Axios instance used by every domain
client (`AuthApi`, `PageApi`, `AdminApi`, etc.). Its config is simple:

```
baseURL: '/api',           // always the BFF, never Symfony directly
withCredentials: true,     // send the httpOnly cookies
headers:                   // constant baseline; no Authorization!
  Content-Type, Accept, X-Client-Type: 'web'
```

Three interceptors do the entire heavy lift:

1. **Request**: on POST / PUT / PATCH / DELETE, read `sh_csrf` from
   `document.cookie` and attach it as `X-CSRF-Token`.
2. **Response success**: pass through.
3. **Response error**:
   - `401 logged_in: true` → the proxy just rotated cookies mid-flight;
     retry the request exactly once (`_retry` flag guards against loops).
   - `401 logged_in: false` on an `/admin/*` page → genuine session
     expiry, redirect to `/auth/login?redirect=<current>`.
   - `403 permission_denied` on an admin *non-data* operation → redirect
     to `/no-access` (data operations surface the error to the caller).

### Why not `fetch`?

The client surface across 40+ API files relies on `AxiosResponse<T>`,
`InternalAxiosRequestConfig`, `axios.isAxiosError`, and the error-first
`.catch` pattern. Rewriting every one of them for a behavioural
zero-win is pure churn. The new `base.api.ts` docstring spells this out.

### Auth is *not* in Axios

Axios never attaches `Authorization: Bearer`. The BFF reads the cookie
and attaches the bearer server-side. This means you can call the
Symfony backend directly from a Server Component (via
`src/app/_lib/server-fetch.ts`) using a different code path without any
shared state.

---

## 5. Why by-keyword instead of by-id?

Before v0.1.0 a page navigation was:

1. Fetch the full navigation list.
2. Find the clicked link's numeric id by keyword.
3. Fetch the page by id.

This is a waterfall that blocks rendering on two serial requests, and
it means every URL depends on a numeric id that clients can not know
without calling the nav endpoint first.

The fix is a new Symfony route
`GET /cms-api/v1/pages/by-keyword/{keyword}` that returns the same
payload the old id-based route did. Consequences:

- **No waterfall**: the Server Component kicks off the page fetch
  immediately, in parallel with the nav fetch.
- **Cache key === URL segment**: `['page-by-keyword', keyword,
  languageId, 'published']`. The slug layout's prefetch and the
  client's `usePageContentByKeyword` share this exact key, so the
  SSR-warmed cache satisfies the first client render with zero XHR.
- **Hover prefetch works**: `createHoverPrefetch(keyword)` in
  `usePagePrefetch` writes to the same key. Mousing over a link
  warms the next navigation's cache.
- **URL stability**: if the backend renumbers a page (e.g. restore from
  backup), client caches / links don't break.
- **SEO-friendlier**: readable URLs and readable cache entries.

The admin area still uses `by-id` routes where ids are the canonical
handle (inspectors, version history, scheduled jobs). That's
intentional — admin is id-driven by nature.

---

## 6. TanStack Query as the client cache

### 6.1 What is *actually* cached?

On any given page the DevTools panel typically shows only a handful of
keys. That is deliberate — we keep the key space small and rely on
React Query's structural sharing + `keepPreviousData` to make it feel
larger.

| Key | Set by | TTL (stale / gc) | Notes |
|-----|--------|------------------|-------|
| `['public-languages']` | `ServerProviders` → dehydrate | ∞ / ∞ | Rarely changes; admin mutations manually invalidate. |
| `['user-data']` | `authProvider.fetchMeOrNull` | 30 s / 5 m + focus refetch | Shared by Refine, `useAuthUser`, and the admin layout prefetch. |
| `['frontend-pages', languageId]` | Slug layout SSR prefetch | 10 m / 30 m | Entire public nav tree for a language. Invalidated on `acl_version` bump. |
| `['page-by-keyword', keyword, languageId, 'published' \| 'preview']` | Slug layout SSR prefetch + `usePageContentByKeyword` | 1 s / 1 m | One entry per visited page. Short gc so old entries do not pile up. |
| `['admin-pages']` | `useAdminPages` (admin only) | 5 m / 30 m | The admin tree. |
| `['lookups']` | `useLookups` + admin layout SSR prefetch | 30 m / 1 h | Dropdown data. |
| `['page-details', keyword]`, `['section-details', ...]` | Admin hooks | Per-tier | Only appear when the admin is open. |

### 6.2 Why so few keys?

- **Pages are stored whole, not per-section.** `['page-by-keyword', ...]`
  holds the entire page payload (sections tree, headless flag,
  everything). A form style that needs a specific field reads it via
  `usePageContentValue`, which runs `useQuery` against the same key —
  no extra network hit, no extra cache entry.
- **SSR seeds the cache.** You will often land on a page and see only
  three entries: `public-languages`, `user-data`, `frontend-pages`. The
  current page's `page-by-keyword` entry was seeded by the server and
  has a `gcTime` of 1 minute; if you leave the DevTools panel open and
  the observer unmounts (e.g. navigation away and back), the entry
  disappears. That is by design — the page payload is small and
  re-fetching is cheap compared to holding stale copies.
- **We do not cache sections, fields or ACLs independently.** There is
  no `['sections', pageId]` or `['section', sectionId]` key on the
  public side. One fetch per page is enough.

If you think you need a new key, first ask: can you derive it with a
`select` on an existing entry? Most of the time the answer is yes.

### 6.3 Zustand vs TanStack — what lives where?

| Kind of state | Home |
|---------------|------|
| **Server data** (page content, nav, lookups, user profile) | TanStack Query |
| **URL-driven state** (filters, tabs, pagination) | `nuqs` (URL) |
| **UI state that must persist across reloads** (preview mode, sidebar collapsed) | Zustand with `persist` (`ui.store.ts`) |
| **Admin selection state** (`selectedKeyword`) | Zustand (`admin.store.ts`) |
| **Ephemeral widget state** (dropdown open, form dirty) | `useState` |

Rule of thumb: **data you can refetch → TanStack. UI flags → Zustand
or local state.** Never duplicate server data into Zustand.

### 6.4 Invalidation strategy

- Language change → `['frontend-pages']` + `['page-by-keyword']` only.
- ACL change (`user.aclVersion` bumps) → same two keys, via
  `useAclVersionWatcher`.
- Admin page / section mutation → `['admin-pages']` + any relevant
  `['page-details', ...]` / `['section-details', ...]`.
- Login / logout → evict `['user-data']`.

Do not write a global `queryClient.invalidateQueries()` — it is almost
always wrong and it will defeat the tiered caches.

---

## 7. Refine + Next.js

Refine is used **narrowly and on purpose**:

- **`authProvider` only**: `src/providers/auth.provider.ts`. It calls
  the BFF and is the single entry point for `login`, `logout`, `check`,
  `getIdentity`, and `getPermissions`.
- **`RefineWrapper`** (`src/providers/providers.tsx`) lives inside
  `ClientProviders`. It wires the auth provider, the simple REST
  `dataProvider` pointed at `/api`, and supplies admin resources
  derived from the nav tree via `useAppNavigation`.
- **`routerProvider: @refinedev/nextjs-router`** — Refine never
  reaches for `history`; it goes through the Next.js router so
  navigation plays nicely with the App Router.

### What we do not use from Refine

- `<Authenticated>` / `<CanAccess>` components on public pages — gating
  is done server-side (admin layout cookie check + Symfony ACLs) so
  Refine's client gates would only add jitter.
- Refine's own resource CRUD UI — admin pages are hand-authored to fit
  SelfHelp's section editor.
- `useList`, `useOne`, etc. on the public side — we use TanStack Query
  directly for full control over keys and cache tiers.

### Why keep Refine at all?

- `authProvider` is a clean contract that standardizes how we shape
  login / logout / check across the codebase, and it shares the
  `['user-data']` React Query slot (`authProvider.fetchMeOrNull` uses
  `queryClient.fetchQuery(['user-data'])`), so no duplicate /me calls.
- The admin menu is generated from `resources`, which Refine consumes
  to build breadcrumbs, page titles, and routing helpers.
- Replacing it is a bigger refactor than it is worth. Its surface area
  in this repo is small enough that it is never in the way.

---

## 8. File map — which files run where

```
src/
├── app/
│   ├── layout.tsx                  # RSC: <html>, resolve language, inject theme
│   ├── not-found.tsx               # RSC wrapper
│   ├── NotFoundClient.tsx          # 'use client' Mantine UI
│   ├── [[...slug]]/
│   │   ├── layout.tsx              # RSC: prefetch nav + page, dehydrate
│   │   ├── page.tsx                # RSC: generateMetadata + minimal shell
│   │   └── DynamicPageClient.tsx   # 'use client' section renderer
│   ├── admin/
│   │   ├── layout.tsx              # RSC: cookie gate + admin prefetches
│   │   └── ...
│   ├── auth/login/page.tsx         # 'use client' form
│   ├── privacy/page.tsx            # RSC: static
│   ├── api/
│   │   ├── [...path]/route.ts      # BFF catch-all
│   │   ├── _lib/proxy.ts           # forwardBufferedToSymfony, refreshInternal
│   │   ├── auth/login/route.ts     # set cookies on login
│   │   ├── auth/logout/route.ts    # clear cookies
│   │   └── csrf/route.ts           # bootstrap sh_csrf for API-only callers
│   └── _lib/server-fetch.ts        # RSC helpers that hit Symfony directly
├── proxy.ts                        # Edge middleware: silent refresh, csrf bootstrap
├── providers/
│   ├── server-providers.tsx        # RSC wrapper
│   ├── providers.tsx               # 'use client' ClientProviders
│   ├── auth.provider.ts            # Refine authProvider
│   └── query-client.ts             # shared QueryClient singleton
├── config/
│   ├── api.config.ts               # client-side endpoints (BFF paths)
│   ├── server.config.ts            # server-only: cookie names, Symfony URL
│   ├── cookie-names.ts             # isomorphic cookie-name constants
│   └── react-query.config.ts       # CACHE_TIERS, QUERY_KEYS
├── api/
│   ├── base.api.ts                 # Axios instance (browser only)
│   └── *.api.ts                    # per-domain clients
└── hooks/
    ├── usePageContentByKeyword.ts  # main page read hook
    ├── usePageContentValue.ts      # selector for child components
    ├── usePagePrefetch.ts          # hover prefetch
    └── useAclVersionWatcher.ts     # ACL-change cache eviction
```

---

## 9. When in doubt, read this checklist

Adding a new public page?
- Put it under `src/app/`.
- Default to Server Component.
- Use `getPageByKeywordSSRCached` to prefetch.
- Export `generateMetadata` that shares the same cache.

Adding a new admin mutation?
- Call the Symfony route via the existing domain client (e.g.
  `AdminApi`).
- Invalidate only the key(s) you actually touched.
- Never bump `acl_version` from the frontend — that is the backend's
  job on ACL changes.

Adding a new read hook?
- Pick a cache tier from `CACHE_TIERS`. Never set `staleTime` / `gcTime`
  by hand.
- Add the query key to `REACT_QUERY_CONFIG.QUERY_KEYS`. No ad-hoc
  string arrays.
- If the data is small and rarely changes, prefetch it on the server
  and dehydrate.

Adding a new cookie?
- Add its name to `src/config/cookie-names.ts`.
- Write it from either the BFF proxy or a dedicated `/api/*` route.
- Never read auth cookies from JavaScript — they are `httpOnly` on
  purpose. The only browser-readable cookies are `sh_csrf` (for the
  double-submit header) and `sh_accept_locale` (hint only).

Need to share a widget between two admin screens?
- Write it as a Server Component if it does no client work.
- If it needs state, mark it `'use client'` and keep it in
  `src/app/components/cms/shared/`.
