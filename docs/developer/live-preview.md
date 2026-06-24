# CMS Live Preview (full-screen)

Audience: Frontend developers and technical operators.
Status: active.
Applies to: SelfHelp2 Next.js frontend `>=0.1.41` (core `>=0.1.21`, `@selfhelp/shared >=1.15.3`, mobile image `>=0.1.20`).
Last verified: 2026-06-24.
Source of truth: `src/app/admin/preview/[[...slug]]/page.tsx`, `src/app/components/cms/live-preview/LivePreview.tsx`, `src/app/components/cms/live-preview/LivePreviewWebPane.tsx`, `src/app/components/cms/live-preview/PreviewNavigationContext.tsx`, `src/app/components/cms/live-preview/livePreviewLayout.ts`, `src/app/store/livePreview.store.ts`, `src/app/[[...slug]]/DynamicPageClient.tsx`, `src/app/components/cms/pages/mobile-preview/mobilePreviewUrl.ts`, `src/app/components/cms/pages/page-inspector/PageInspector.tsx`, and the shared bridge contract `@selfhelp/shared` `types/preview-bridge.ts`.

The **Live Preview** is a dedicated, full-screen surface for **testing the real
flow** of a CMS page on **web and mobile side-by-side** — as opposed to the page
editor's inline [Mobile preview panel](./mobile-preview-panel.md), which is a
quick-snippet view of a single page. It opens in a **new tab** from the editor,
renders the **real public website inline** on the left (header menu, page
content, footer) and a chosen mobile **device frame** on the right (phone /
tablet × portrait / landscape, using the real `selfhelp-mobile-preview` image),
and lets the admin **navigate freely** through the app like a real user — with
the two panes kept **synchronized** on the same page (see
[Synchronized navigation](#synchronized-navigation)).

The **web pane is built directly into the frontend (no iframe).** Only the
**mobile** pane is an iframe. The web pane reuses the admin shell's providers +
React Query cache, so it is cheap in dev (no second app instance), always
available (independent of the mobile preview), and its navigation is plain React
state — no `postMessage` needed.

The **top control bar** holds only the shared controls (panes below): a
**Mobile** toggle, a **Draft/Published** switch, **Refresh** (both), and **open
in new tab**. The mobile-specific controls (device phone/tablet,
portrait/landscape, and a **mobile-only reload**) sit on a **compact floating
pill over the mobile pane**, directly above the phone frame, so it is visually
clear they belong to the mobile preview. There is no web-size selector and no toolbar
language picker. The web pane's header `LanguageSelector` is the canonical
preview-language control: it keeps the web pane live and cleanly remounts the
mobile frame with a fresh language-scoped session. Theme changes remain live in
both directions.

> Embed contract + the off-menu modal: [`sh-selfhelp_mobile` → developer/mobile-preview.md](../../../sh-selfhelp_mobile/docs/developer/mobile-preview.md).
> Mint/exchange + the `admin.mobile_preview.view` permission: [`sh-selfhelp_backend` → reference/api/20-admin-system-maintenance.md](../../../sh-selfhelp_backend/docs/reference/api/20-admin-system-maintenance.md) and the migration `Version20260623193630`.
> Version contract: [`sh-selfhelp_backend` → developer/cross-repo-compatibility-matrix.md](../../../sh-selfhelp_backend/docs/developer/cross-repo-compatibility-matrix.md).

## Design goals

1. **Test the real flow, not snippets.** Full-screen panes with free navigation,
   opened in its own tab — you click through the app, you don't peek at one page
   in the editor.
2. **Web and mobile stay in sync.** The shell owns the canonical page; navigating
   in one pane drives the other to the same keyword, so the two never drift apart.
3. **See published *and* draft, visibly.** A shared draft toggle renders published
   vs unpublished-draft content on demand, and **both** panes show a clear orange
   "PREVIEW MODE" banner while draft (web `PreviewModeIndicator`, mobile
   `PreviewDraftBanner`).
4. **Resize by device, no reload.** Choosing phone/tablet and portrait/landscape
   grows or shrinks the mobile column live (default **phone portrait**) without
   reloading the frame. The chosen device, orientation, and **Mobile** pane
   visibility are **remembered across a reload** of the preview tab
   (`livePreview.store`, the same `persist` pattern as `ui.store`).
5. **CMS-only, never public.** The surface only exists for admins holding the
   dedicated `admin.mobile_preview.view` permission; it can never appear on a
   normal public page.
6. **Off-menu pages are reachable.** A page with no menu entry opens as a modal
   over home in the mobile pane (handled mobile-side — see below).

## The surface

| Piece | Where | Notes |
|-------|-------|-------|
| Route | `/admin/preview/[[...slug]]` | Server Component. Optional catch-all carries the keyword (`/admin/preview/<keyword>`); no slug → `home`. **No `AdminShell`** — chrome-free. |
| Gate (server) | `requireAdminPermission(PERMISSIONS.ADMIN_MOBILE_PREVIEW_VIEW)` | Authoritative — an unauthorized user is redirected to no-access before the client renders. |
| Gate (client) | `useCanViewMobilePreview()` | Hides the editor entry point for users without the permission. |
| Entry point | `PageInspector` header → **"Live preview"** | `target="_blank"` to `/admin/preview/<keyword>`; shown only for a real (non-configuration) page and only when `useCanViewMobilePreview()` is true. |
| Component | `LivePreview.tsx` | The client split-view + single top control bar; owns the canonical page, draft (via `PreviewModeContext`), visibility, the mobile viewport + reload key, and the mobile bridge listener. |
| Web pane | `LivePreviewWebPane.tsx` | **Inline** (no iframe). Renders the real public renderer (`DynamicPageClient`) + client-composed website chrome (header menu, in-app theme/language/profile controls, footer) wrapped in `PreviewNavigationProvider`. |
| Nav interception | `PreviewNavigationContext.tsx` | Lets the navigating styles drive the preview instead of the admin app (see below). |
| Layout math | `livePreviewLayout.ts` | Pure, unit-tested device-frame sizing for the mobile pane. |
| Mobile bridge contract | `@selfhelp/shared` `types/preview-bridge.ts` | Single source of truth for the `postMessage` types, the `previewShell`/`parentOrigin` param names, and the `isPreviewBridgeMessage` guard. |

## How it works

1. **Availability probe (mobile only).** Reuses `previewOriginCandidates()` from
   the panel (explicit `NEXT_PUBLIC_MOBILE_PREVIEW_ORIGIN` → installed
   `/mobile-preview` → in dev only, the Expo dev server). When none answers, the
   **mobile column** shows a graceful "unavailable" card (the web pane keeps
   working).
2. **Web pane (inline).** `LivePreviewWebPane` renders the page with the real
   `DynamicPageClient` for the canonical keyword, plus the real website chrome
   composed from the existing client components (`WebsiteHeaderMenu`,
   `AuthButton`, `ThemeToggle`, `LanguageSelector`, `BurgerMenuClient`,
   `FooterLinks`). It reads draft/published from the shared `PreviewModeContext`
   and the active language from `LanguageContext` — the same providers the public
   site uses — so the toolbar Draft switch and the in-pane language selector drive
   it directly. No iframe, no second app instance, no mint.
3. **Mint (free navigation, mobile).** Mints a one-time code via the protected BFF
   route (`AdminMobilePreviewApi.createSession`) **without a keyword/page scope**,
   so the exchanged token is not pinned to one page and the mobile pane can
   navigate the whole app (still GET-only, still the read-only render allowlist
   enforced by the backend `MobilePreviewAccessGuard`).
4. **Mobile pane.** Builds the iframe `src` with `buildMobilePreviewUrl()`
   (`frame=0`, `banner=0`, the one-time `previewSession`, the initial `keyword`,
   `language`, the draft flag, and the `previewShell`/`parentOrigin` bridge
   params). The iframe is sized to the device's **native logical dimensions** and
   **CSS-scaled** to fit, so choosing a device/orientation resizes the column
   **without reloading** the app (navigation state is preserved). The mobile pane
   re-mints when **draft** or **language** changes or on a mobile reload — but
   **not** on device/orientation change.
5. **Draft.** Owned by the shared `PreviewModeContext`. The toolbar **Draft**
   switch toggles it (which also writes the `sh_preview` cookie), the inline web
   reads it live, and the mobile pane re-mints with it. It is defaulted **on** the
   **first** time the surface is ever opened in a browser (a one-time
   localStorage flag); after that the saved `sh_preview` choice wins, so a
   deliberate "Published" preview is **not reset to draft on every reload**.
6. **Mobile idle unloading.** The mobile iframe is its own dev client; to keep the
   Expo dev server responsive it is **unloaded while the tab is hidden** and
   remounted (with a fresh code) on return. Losing window focus (DevTools, the
   IDE) does **not** unload it. The inline web pane is always rendered (no separate
   dev client, nothing to unload).
7. **Mobile reload is remount-on-fresh-code.** A mobile reload (the pill reload,
   "Refresh both", or returning to a hidden tab) **unmounts** the frame, re-mints a
   new one-time code, and remounts **only once that fresh code is ready**. Bringing
   the frame back on the old (already-consumed) code — or swapping `src` in place —
   wedges the cross-origin Expo dev frame on a perpetual spinner that only cleared
   after hiding+showing the tab; waiting for the new code means a single clean mount.

The admin JWT **never** reaches the mobile iframe — only the opaque one-time code
is involved. The inline web pane runs in the admin's own session.

## Synchronized navigation

The shell (`LivePreview`) owns the **canonical preview page** (a CMS keyword).
`currentKeyword` follows the user's navigation in **either** pane; changing it
re-renders the web pane, drives the mobile frame, and mirrors the master URL.

- **Web → shell (interception).** Inside `LivePreviewWebPane` the styles that
  navigate — `InternalLink`, `ButtonStyle`, `LinkStyle` — plus the header
  avatar/profile menu (`AuthButton`, which navigates programmatically via the
  router) read `usePreviewNavigation()`. When it is present (i.e. they are rendered
  inside the pane) an **internal CMS-page** click calls `navigate(path)` on the
  shell instead of routing the admin app — so e.g. choosing **Profile** shows the
  profile page in **both** panes rather than navigating the admin app away and
  dropping the mobile frame. The shell maps the path to a keyword, sets
  `currentKeyword`, and pushes a soft navigate to the mobile frame. `/admin/...`
  routes, external links, new-tab links and modifier-clicks are left to behave
  normally. Outside the preview the context is `null`, so these components keep
  their exact existing behaviour — the change is purely additive.
- **Mobile → shell (bridge).** The mobile frame runs the `@selfhelp/shared`
  preview bridge (`previewShell=1` + `parentOrigin`). On each in-app navigation it
  posts `selfhelp-preview:navigated { keyword }`; the shell sets `currentKeyword`
  (which re-renders the inline web pane). On (re)load the mobile frame posts
  `selfhelp-preview:ready` and the shell pushes the canonical keyword back, so a
  re-mint / HMR reload re-syncs.
- **Command down (mobile).** The shell posts `selfhelp-preview:navigate { keyword }`;
  the mobile frame performs a **soft** `router.replace` — no reload, so app state
  and the scoped preview session survive. A keyword missing on mobile shows the
  mobile "page not found" state.
- **Loop guard.** When the shell drives the mobile frame it records the **expected**
  keyword and ignores the echo, so the sync never ping-pongs.
- **URL mirror (both directions).** Any `currentKeyword` change — from the web
  pane OR the mobile frame — updates the shell's own address bar to
  `/admin/preview/<keyword>` via the history API only (no Next navigation), so the
  current page is **shareable** and a manual reload reopens both panes on it.
- **Origin safety.** Mobile messages are only accepted/sent for the resolved mobile
  origin (never `'*'`). The mobile iframe is sandboxed
  (`allow-scripts allow-same-origin allow-forms allow-popups`, no top-navigation).

## Theme and language synchronization

Theme and language deliberately use different synchronization paths:

- **Theme is live and two-way.** The shell and mobile frame exchange
  `selfhelp-preview:set-preferences` /
  `selfhelp-preview:preferences-changed`, but the live payload is normalized to
  `{ colorScheme, locale: null }`. Switching light/dark/auto in either pane
  updates the other without a reload.
- **Language is URL-bound and web-driven.** The web pane's
  `LanguageSelector` updates `LanguageContext`. `LivePreview` then re-mints and
  remounts the mobile frame with the matching `language=<locale>` URL and scoped
  preview session. The mobile app boots directly into that locale before its
  page queries run.
- **Why it is split.** Applying language through the live bridge called the
  mobile `setLanguage()` flow, which rotates the scoped token and invalidates all
  queries. Under two-way preference echo this became a request/invalidation
  loop, leaving the frame on "Starting up..." and the drawer/tabs empty. The
  theme-only helper in `livePreviewLayout.ts` prevents locale from entering the
  live bridge again.

The mobile half (bridge + the in-frame draft banner) lives in the mobile repo —
see [§3b/§3c](../../../sh-selfhelp_mobile/docs/developer/mobile-preview.md).
`PreviewShellBridge.tsx` (mounted dormant in `SlugShell`) is the legacy web half
of the bridge; the inline web pane no longer uses it (navigation is now in-process
via `PreviewNavigationContext`), but it stays in place for standalone
`previewShell=1` use of the public site.

## Device-frame math (`livePreviewLayout.ts`)

`computeFrameLayout({ device, orientation, availableWidth, availableHeight, maxWidthRatio })`
returns the native `width`/`height`, a `scale`, and the on-screen
`displayWidth`/`displayHeight`. It preserves the device aspect ratio, fits the
available body area (from a `ResizeObserver`), caps the column by `maxWidthRatio`
(the inline web pane always shares the row, so the cap is ~0.5), and falls back to
the native size before the first measure. Native sizes: phone `390×844`, tablet
`834×1112` (swapped in landscape).

`LivePreview` passes an `availableHeight` that already **subtracts the
device-controls pill** (measured live with `useElementSize`) **+ the column gap
+ the device bezel padding**, so the framed iframe is sized to **fit** the column
and is never clipped by the body's `overflow: hidden` — the controls pill above
the frame no longer cuts off its bottom.

The mobile column is wrapped in a **device bezel** — a dark, rounded
phone/tablet shell around the scaled iframe (a slightly larger corner radius for
phone than tablet) — so the pane reads as a real device rather than a bare
rectangle. The bezel mirrors the standalone mobile web image's frame
(`PhoneFrame`); it is purely presentational and does not change the
`displayWidth`/`displayHeight` math above.

## Refreshing the preview

The toolbar's **Refresh both previews** rebuilds both panes for the current
page. The mobile frame clean-remounts with a fresh mint. The **web pane renders
cached page content**, so remounting it alone just replays the cache —
`handleRefresh` therefore first calls
`queryClient.invalidateQueries({ queryKey: PAGE_BY_KEYWORD_ALL })` (the same
cache key the editor's save mutations invalidate) and then bumps the web reload
key, so the remounted pane refetches the live page. **Reload mobile preview**
(in the device toolbar) only remounts the mobile frame.

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

- `live-preview/__tests__/PreviewNavigationContext.test.tsx` — the interception
  helpers (`isPreviewInternalPath`, `previewPathFromHref`) and that `LinkStyle` /
  `ButtonStyle` drive the preview `navigate` for internal links/buttons while
  leaving external / new-tab links — and all navigation outside the provider —
  untouched.
- `live-preview/__tests__/livePreviewLayout.test.ts` — the pure device-frame
  layout helpers (native sizing, scale-to-fit, `maxWidthRatio` cap) and the
  theme-only preference boundary (`locale` can never be sent live).
- `mobile-preview/__tests__/mobilePreviewUrl.test.ts` — the builder, the `modal`
  override (emitted for `on`/`off`, omitted for `auto`), and the
  `previewShell`/`parentOrigin` bridge params (gated on `previewShell`).
- `@selfhelp/shared` `types/__tests__/preview-bridge.test.ts` — the shared
  contract: the `isPreviewBridgeMessage` guard and `previewKeywordFromPath`.
