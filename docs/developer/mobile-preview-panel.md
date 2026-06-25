# Mobile preview panel

Audience: Frontend developers and technical operators.
Status: active.
Applies to: SelfHelp2 Next.js frontend `>=0.1.31`.
Last verified: 2026-06-25.
Source of truth: `src/app/components/cms/pages/mobile-preview/MobilePreviewPanel.tsx`, `src/app/components/cms/pages/mobile-preview/mobilePreviewUrl.ts`, `src/app/api/mobile-preview/session/route.ts`, `src/api/admin/mobile-preview.api.ts`, `next.config.mjs`.

The **Mobile preview** panel lets a CMS admin see the current page rendered by
the real mobile renderer (the `selfhelp-mobile-preview` web image) directly in
the page editor. It is the frontend half of the cross-repo **Mobile Preview
Service** (core `>=0.1.19`, `@selfhelp/shared >=1.14.25`, manager `>=1.6.5`,
mobile image `>=0.1.11`).

> **Quick snippet vs. real flow.** This panel is the *quick-snippet* view of the
> single page being edited (collapsed by default). To **test the real flow** —
> a full-screen device frame, free navigation, draft toggle, opened in a new tab —
> use the [full-screen **Live Preview**](./live-preview.md) (the **"Live preview"**
> button in the editor header, gated by `admin.mobile_preview.view`). Its controls
> sit in a clean bordered toolbar; behaviour is otherwise as described below.

> Embed contract + image internals:
> [`sh-selfhelp_mobile` → developer/mobile-preview.md](../../../sh-selfhelp_mobile/docs/developer/mobile-preview.md).
> Routing/update: [`sh-manager` → operator/update.md](../../../sh-manager/docs/operator/update.md).
> Version contract: [`sh-selfhelp_backend` → developer/cross-repo-compatibility-matrix.md](../../../sh-selfhelp_backend/docs/developer/cross-repo-compatibility-matrix.md).

## Where it lives

`PageInspector` renders the panel as a collapsible **"Mobile preview"** section,
only when the page has a `keyword` (a real, routable page). It receives the
`keyword`, `pageId`, the languages list, and the default language id.

## How it works

1. **Auto-resolve the preview origin** (`previewOriginCandidates()` in
   `mobilePreviewUrl.ts`). The panel builds an **ordered candidate list** and
   probes each until one is available, so it works with zero configuration in
   both a deployment and local development:
   1. an explicit `NEXT_PUBLIC_MOBILE_PREVIEW_ORIGIN` always **wins outright**
      (single candidate — pin it and nothing else is tried);
   2. otherwise the **installed image** at the same-origin `/mobile-preview`
      (Traefik routes it in manager production mode; the Next.js server proxies
      it to `http://mobile-preview:8080` in manager local mode);
   3. otherwise, **in `next dev` only**, the **Expo dev server** at
      `http://localhost:8081` (live-reload);
   4. otherwise → graceful **"unavailable"** state.
2. **Probe availability** by fetching `<candidate>/version.json` (a React Query
   that walks the candidates in order):
   - a **same-origin / installed** candidate that `404`s ⇒ not deployed ⇒ try
     the next candidate;
   - an **absolute** (cross-origin) dev candidate is **optimistic** — assumed
     available even without `version.json` (the Expo dev server does not serve
     it), so live-reload works out of the box.
   When present, `version.json` surfaces the image version, `mobileRendererVersion`,
   and bundled-plugin count as badges; an optimistic dev candidate shows a
   **"live-reload dev"** badge instead.
3. **Mint a one-time code** via a React Query **mutation** against the protected
   BFF route (below), then build the iframe URL with `buildMobilePreviewUrl()`.
4. **Re-mint on every (re)load** and whenever a control changes (device /
   orientation / language / draft), because each iframe load **consumes** one
   code on exchange.

The admin JWT **never** reaches the iframe — only the opaque one-time code does.

> **Always visible, by design.** The panel is shown for every routable page.
> When neither an installed image nor a dev server answers, it renders the
> "unavailable" card (never an error) pointing at **System Maintenance → Update /
> enable mobile preview** to provision the image, or at the Expo dev server for
> live-reload — it never blocks the editor.

## Security: the protected mint route

Minting goes through a dedicated BFF route, never a public `/cms-api` rewrite:

```
POST /api/mobile-preview/session  ->  Symfony POST /cms-api/v1/admin/mobile-preview/session
```

`src/app/api/mobile-preview/session/route.ts`:

- validates the **CSRF** double-submit (state-changing POST),
- forwards to the **private** backend with the admin's server-side JWT (read from
  the httpOnly `sh_auth` cookie, never the browser),
- on a `401`, silently **refreshes** the access token and **retries once**
  (persisting the rotated token), distinguishing a genuine logout from a
  transient backend outage (`503`, never destroys the session),
- returns only the `{ code, expires_at }` envelope to the panel.

The backend still enforces the `admin.mobile_preview.create` permission; this
route is just the authenticated choke point and grants nothing on its own.

## The iframe URL builder

`mobilePreviewUrl.ts` is a **pure, unit-tested** builder that mirrors the mobile
embed contract (`config/webPreviewContract.ts`) byte-for-byte. For the CMS panel
it always sets `embed=1`, `hideDebugPanel=true`, and `banner=0`, then adds the
one-time `previewSession`, the page `keyword`, and the chosen `device`,
`orientation`, `language`, and `preview` (draft) flags. It normalizes the origin
(same-origin path vs absolute dev origin) so the same builder serves both
deployment and live-reload.

## Local development & live-reload

Live-reload works **with no frontend config** thanks to auto-resolution
(candidate 3 above): if no image is installed at `/mobile-preview`, `next dev`
falls back to the Expo dev server automatically.

1. In the mobile repo: `APP_WEB_PREVIEW=1 npx expo start --web` (defaults to
   `http://localhost:8081`).
2. Run `next dev`. The panel auto-detects the dev server and loads it in the
   iframe, so editing a mobile renderer/component hot-reloads in place (shown
   with the **"live-reload dev"** badge).

You only need to set `NEXT_PUBLIC_MOBILE_PREVIEW_ORIGIN` to **override** the
auto-resolution — e.g. pin a non-default dev port, or force a specific installed
origin. With no dev server **and** no installed image, the panel shows the
graceful "unavailable" state — it never blocks the editor.

The server-only `MOBILE_PREVIEW_INTERNAL_URL` controls the upstream used by the
Next.js `/mobile-preview/*` rewrite and defaults to
`http://mobile-preview:8080`. Managed instances use that fixed Docker service
name; source development may override it to test against another preview server.

| Env var | Default | Meaning |
|---------|---------|---------|
| `NEXT_PUBLIC_MOBILE_PREVIEW_ORIGIN` | _(unset → auto-resolve)_ | **Override** for the preview origin. When set it wins outright. When unset, the panel auto-resolves: installed image `/mobile-preview` → (dev only) Expo dev server `http://localhost:8081` → unavailable. |

## Seeing & managing the installed version

The **installed** preview image (not the dev server) is an optional service that
ships independently of the core. Its version is shown in **System Maintenance**,
which is also where an admin **installs / enables** it on an instance that
predates default provisioning and **updates** it to a newer compatible version —
all preflight-gated, exactly like the frontend-only update. See
[system-maintenance-admin.md](./system-maintenance-admin.md#mobile-preview).

## Tests

- `mobile-preview/__tests__/mobilePreviewUrl.test.ts` — the pure URL builder
  (origin normalization, flags, optional params) **and `previewOriginCandidates`
  auto-resolution precedence** (explicit wins; installed-then-dev in `next dev`;
  installed-only in production).
- `mobile-preview/__tests__/MobilePreviewPanel.test.tsx` — RTL component tests
  (mint → iframe `src`/badges, re-mint on control change, graceful unavailable
  fallback, inline mint-error, absolute dev-origin behavior), mocking
  `AdminMobilePreviewApi.createSession` and stubbing `fetch` for `version.json`.
- `src/config/__tests__/next-config.test.ts` — same-origin `/mobile-preview/*`
  rewrite to the private preview service used by manager local mode.
