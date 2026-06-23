# CMS Live Preview (full-screen)

Audience: Frontend developers and technical operators.
Status: active.
Applies to: SelfHelp2 Next.js frontend `>=0.1.33` (core `>=0.1.21`, mobile image `>=0.1.12`).
Last verified: 2026-06-23.
Source of truth: `src/app/admin/preview/[[...slug]]/page.tsx`, `src/app/components/cms/live-preview/LivePreview.tsx`, `src/app/components/cms/live-preview/livePreviewLayout.ts`, `src/app/components/cms/pages/mobile-preview/mobilePreviewUrl.ts`, `src/app/components/cms/pages/page-inspector/PageInspector.tsx`.

The **Live Preview** is a dedicated, full-screen surface for **testing the real
flow** of a CMS page on mobile — as opposed to the page editor's inline
[Mobile preview panel](./mobile-preview-panel.md), which is a quick-snippet view
of a single page. It opens in a **new tab** from the editor, renders the page in
a chosen **device frame** (phone / tablet × portrait / landscape) using the real
`selfhelp-mobile-preview` image, and lets the admin **navigate freely** through
the app like a real user.

> Embed contract + the off-menu modal: [`sh-selfhelp_mobile` → developer/mobile-preview.md](../../../sh-selfhelp_mobile/docs/developer/mobile-preview.md).
> Mint/exchange + the `admin.mobile_preview.view` permission: [`sh-selfhelp_backend` → reference/api/20-admin-system-maintenance.md](../../../sh-selfhelp_backend/docs/reference/api/20-admin-system-maintenance.md) and the migration `Version20260623193630`.
> Version contract: [`sh-selfhelp_backend` → developer/cross-repo-compatibility-matrix.md](../../../sh-selfhelp_backend/docs/developer/cross-repo-compatibility-matrix.md).

## Design goals

1. **Test the real flow, not snippets.** A full-screen device frame with free
   navigation, opened in its own tab — you click through the app, you don't peek
   at one page in the editor.
2. **See published *and* draft.** A draft toggle re-mints to render published vs
   unpublished-draft content on demand.
3. **Resize by device.** Choosing phone/tablet and portrait/landscape grows or
   shrinks the mobile column live — defaulting to **phone portrait**.
4. **CMS-only, never public.** The surface only exists for admins holding the
   dedicated `admin.mobile_preview.view` permission; it can never appear on a
   normal public page.
5. **Off-menu pages are reachable.** A page with no menu entry opens as a modal
   over home in the mobile pane (handled mobile-side — see below).

## The surface

| Piece | Where | Notes |
|-------|-------|-------|
| Route | `/admin/preview/[[...slug]]` | Server Component. Optional catch-all carries the keyword (`/admin/preview/<keyword>`); no slug → `home`. **No `AdminShell`** — chrome-free. |
| Gate (server) | `requireAdminPermission(PERMISSIONS.ADMIN_MOBILE_PREVIEW_VIEW)` | Authoritative — an unauthorized user is redirected to no-access before the client renders. |
| Gate (client) | `useCanViewMobilePreview()` | Hides the editor entry point for users without the permission. |
| Entry point | `PageInspector` header → **"Live preview"** | `target="_blank"` to `/admin/preview/<keyword>`; shown only for a real (non-configuration) page and only when `useCanViewMobilePreview()` is true. |
| Component | `LivePreview.tsx` | The client split-view + toolbar. |
| Layout math | `livePreviewLayout.ts` | Pure, unit-tested (device-frame sizing + web URL). |

## How it works

1. **Availability probe.** Reuses `previewOriginCandidates()` from the panel
   (explicit `NEXT_PUBLIC_MOBILE_PREVIEW_ORIGIN` → installed `/mobile-preview` →
   in dev only, the Expo dev server). When none answers, the surface shows a
   graceful "unavailable" card pointing at **System Maintenance → Update / enable
   mobile preview**.
2. **Mint (free navigation).** Mints a one-time code via the same protected BFF
   route as the panel (`AdminMobilePreviewApi.createSession`), but **without a
   keyword/page scope**, so the exchanged token is not pinned to one page and the
   mobile pane can navigate the whole app (still GET-only, still the read-only
   render allowlist enforced by the backend `MobilePreviewAccessGuard`).
3. **Mobile pane.** Builds the iframe `src` with `buildMobilePreviewUrl()`
   (`frame=0`, `banner=0`, `hideDebugPanel=1`, the one-time `previewSession`, the
   initial `keyword`, `language`, and the draft flag). The iframe element is sized
   to the device's **native logical dimensions** and **CSS-scaled** to fit, so
   choosing a device/orientation resizes the column **without reloading** the app
   (navigation state is preserved). `device`/`orientation` are therefore **not**
   in the iframe URL — they drive only the on-screen frame.
4. **Re-mint only when needed.** Each iframe load consumes one code on exchange,
   so the pane re-mints when the **draft** or **language** changes, or on manual
   reload — but **not** on device/orientation change (those don't reload).
5. **Web pane (optional).** A side-by-side desktop comparison iframe embedding the
   same page in the web frontend (`/<keyword>`). It reflects the session's own
   language/preview state (owned by the web app's `LanguageContext` /
   `PreviewModeContext`); the Live Preview never writes those cookies. Toggle it
   off to give the whole area to the mobile pane.

The admin JWT **never** reaches either iframe — only the opaque one-time code
(mobile pane) and same-origin session cookies (web pane) are involved.

## Device-frame math (`livePreviewLayout.ts`)

`computeFrameLayout({ device, orientation, availableWidth, availableHeight, maxWidthRatio })`
returns the native `width`/`height`, a `scale`, and the on-screen
`displayWidth`/`displayHeight`. It preserves the device aspect ratio, fits the
available body area (from a `ResizeObserver`), caps the column by `maxWidthRatio`
(narrower when the web pane is shown), and falls back to the native size before
the first measure. `displayWidth` is what makes the right column grow/shrink as
the device changes. Native sizes: phone `390×844`, tablet `834×1112` (swapped in
landscape).

## Off-menu pages → modal (mobile-side)

The user's requirement — *a page not on the menu opens in a modal* — is handled
entirely in the mobile app from its own navigation data, so the frontend needs no
nav logic: on preview boot the app opens an **off-menu** keyword as a modal over
home (`modal=auto`, the default). The builder also accepts an explicit override
(`modal=on`/`off`), surfaced through the route query
(`/admin/preview/<keyword>?modal=on`) and forwarded to the iframe URL. See the
[mobile doc §3a](../../../sh-selfhelp_mobile/docs/developer/mobile-preview.md).

## Permission

`admin.mobile_preview.view` is **separate** from `admin.mobile_preview.create`
(which gates minting a code): a role can be allowed to **open** the live preview
(`view`) and to **mint** sessions (`create`) independently. The permission is
seeded and granted to the `admin` role by the core migration
`Version20260623193630` (core `>=0.1.21`). On an older core the permission is
absent, so the route + entry degrade to no-access — the version contract tracks
this (`release-manifest.json#supports.core >=0.1.21`).

## Tests

- `live-preview/__tests__/livePreviewLayout.test.ts` — the pure layout helpers
  (native sizing, scale-to-fit, `maxWidthRatio` cap, web URL building).
- `mobile-preview/__tests__/mobilePreviewUrl.test.ts` — extends the builder test
  with the `modal` override (emitted for `on`/`off`, omitted for `auto`).
