# Mobile preview panel

Audience: Frontend developers and technical operators.
Status: active.
Applies to: SelfHelp2 Next.js frontend `>=0.1.31`.
Last verified: 2026-06-23.
Source of truth: `src/app/components/cms/pages/mobile-preview/MobilePreviewPanel.tsx`, `src/app/components/cms/pages/mobile-preview/mobilePreviewUrl.ts`, `src/app/api/mobile-preview/session/route.ts`, `src/api/admin/mobile-preview.api.ts`.

The **Mobile preview** panel lets a CMS admin see the current page rendered by
the real mobile renderer (the `selfhelp-mobile-preview` web image) directly in
the page editor. It is the frontend half of the cross-repo **Mobile Preview
Service** (core `>=0.1.19`, `@selfhelp/shared >=1.15.0`, manager `>=1.7.0`,
mobile image `>=0.2.0`).

> Embed contract + image internals:
> [`sh-selfhelp_mobile` → developer/mobile-preview.md](../../../sh-selfhelp_mobile/docs/developer/mobile-preview.md).
> Routing/update: [`sh-manager` → operator/update.md](../../../sh-manager/docs/operator/update.md).
> Version contract: [`sh-selfhelp_backend` → developer/cross-repo-compatibility-matrix.md](../../../sh-selfhelp_backend/docs/developer/cross-repo-compatibility-matrix.md).

## Where it lives

`PageInspector` renders the panel as a collapsible **"Mobile preview"** section,
only when the page has a `keyword` (a real, routable page). It receives the
`keyword`, `pageId`, the languages list, and the default language id.

## How it works

1. **Resolve the preview origin** from `NEXT_PUBLIC_MOBILE_PREVIEW_ORIGIN`
   (default `/mobile-preview` — the same-origin path Traefik routes to the image
   in a manager deployment).
2. **Probe availability** by fetching `<origin>/version.json` (a React Query):
   - a **same-origin** path that `404`s ⇒ the service is not deployed ⇒ graceful
     "unavailable" state (with setup hint);
   - an **absolute** (cross-origin) dev origin is assumed available even without
     `version.json` (the Expo dev server does not serve it).
   When present, `version.json` surfaces the image version, `mobileRendererVersion`,
   and bundled-plugin count as badges.
3. **Mint a one-time code** via a React Query **mutation** against the protected
   BFF route (below), then build the iframe URL with `buildMobilePreviewUrl()`.
4. **Re-mint on every (re)load** and whenever a control changes (device /
   orientation / language / draft), because each iframe load **consumes** one
   code on exchange.

The admin JWT **never** reaches the iframe — only the opaque one-time code does.

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

Point the panel at a running Expo web dev server for fast refresh:

1. In the mobile repo: `APP_WEB_PREVIEW=1 npx expo start --web` (defaults to
   `http://localhost:8081`).
2. In the frontend env: set
   `NEXT_PUBLIC_MOBILE_PREVIEW_ORIGIN=http://localhost:8081` and restart
   `next dev`.

The panel then loads the dev server in the iframe, so editing a mobile
renderer/component hot-reloads in place. With the default `/mobile-preview`
(no dev server running) the panel shows the graceful "unavailable" state with a
hint to set the env var — it never blocks the editor.

| Env var | Default | Meaning |
|---------|---------|---------|
| `NEXT_PUBLIC_MOBILE_PREVIEW_ORIGIN` | `/mobile-preview` | Origin the preview iframe loads. Same-origin path in a manager deployment; an absolute Expo dev-server origin (e.g. `http://localhost:8081`) for live-reload. |

## Tests

- `mobile-preview/__tests__/mobilePreviewUrl.test.ts` — the pure URL builder
  (origin normalization, flags, optional params).
- `mobile-preview/__tests__/MobilePreviewPanel.test.tsx` — RTL component tests
  (mint → iframe `src`/badges, re-mint on control change, graceful unavailable
  fallback, inline mint-error, absolute dev-origin behavior), mocking
  `AdminMobilePreviewApi.createSession` and stubbing `fetch` for `version.json`.
