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

## v0.1.43 — 2026-06-24

### Fixed
- **The mobile preview's bottom menu is no longer cut off.** The device frame is
  now sized to the body height **minus its own bezel chrome**, so the full phone —
  including the bottom navigation tab bar — fits without the bottom being clipped.
  The framed device is also centred vertically in its column.

### Changed
- **The mobile preview device bezel is back.** The v0.1.42 flat web-style card is
  replaced again by the dark, rounded phone/tablet bezel (drop shadow + matching
  corner radii) so the preview reads as a real device, like the standalone mobile
  web image. The header device/orientation controls and instant (no-reload)
  device switching are unchanged.

## v0.1.42 — 2026-06-24

### Changed
- **The Live Preview controls are reorganised into the top header.** The device
  (phone / tablet), orientation (portrait / landscape), and the mobile-only
  reload now sit on the **right** of the header; the **Mobile** and **Draft**
  toggles, **Refresh both**, and **open in new tab** moved to the **left**, next
  to the page keyword and dev/version badges. The device controls show only while
  the mobile pane is on and available.
- **The mobile preview now uses the same clean frame as the web pane.** The
  v0.1.41 dark device bezel is replaced with a card that matches the inline web
  pane exactly — same 1px border, rounded corners, body background and clipped
  overflow — and the framed iframe fills the full body height beside it, so the
  two panes read as a consistent pair.

## v0.1.41 — 2026-06-24

### Added
- **The Live Preview remembers your device-frame controls.** The chosen device
  (phone / tablet), orientation (portrait / landscape), and whether the mobile
  pane is shown now persist across a reload of the preview tab instead of
  resetting to phone / portrait / shown every time.

### Fixed
- **"Refresh both previews" now actually refreshes the web pane.** The web pane
  renders cached page content, so remounting it on its own just replayed the
  cache and recent edits never appeared. Refresh now invalidates the
  page-content cache (the same key the editor's own save mutations use) before
  remounting, so the web pane refetches the live page. The mobile frame still
  clean-remounts at the current page. No contract change.
- **The mobile device frame is no longer cut off.** It is now sized to fit the
  space below its (now compact) controls, so the controls no longer push the
  bottom of the frame past where the surrounding body clipped it.
- **Draft is no longer re-forced on every open.** The preview still defaults to
  draft the first time it is ever opened, but afterwards your saved choice is
  kept — a deliberate "Published" preview is no longer flipped back to draft on
  reload.

### Changed
- **The mobile preview now sits in a device bezel.** The right-hand pane is
  wrapped in a dark, rounded phone/tablet frame (matching the standalone mobile
  web image's device frame) instead of a thin 1px border, so the preview reads
  as a real device. Phone and tablet use a slightly different corner radius.
  Visual only — no behaviour change.

## v0.1.40 — 2026-06-24

### Fixed
- **The Live Preview no longer freezes (or empties the mobile menu) when the
  language changes.** Pushing the language to the embedded mobile frame over the
  bridge made the frame rotate its token and refetch everything; under the two-way
  echo this looped into a request storm that hung the preview on "Starting up…",
  flooded the console (the browser logged a navigation-throttle warning) and left
  the mobile drawer/tab menu empty. The preview now drives the mobile **language**
  one way — by reloading the mobile frame at the chosen language — instead of
  syncing it live, so there is nothing to loop on. **Theme (light / dark / auto)
  still syncs live both ways with no reload.** No contract change.

### Changed
- **Switching the preview language now reloads the mobile pane** (a brief
  "Starting up…") instead of updating it in place. The web pane still updates
  instantly; the mobile frame remounts at the new language. Switching the colour
  scheme still updates both panes live with no reload.

## v0.1.39 — 2026-06-24

### Added
- **Theme and language are now shared between the two preview panes.** Switching
  the colour scheme (light / dark / auto) or the language in the web pane updates
  the mobile frame, and switching them in the mobile profile updates the web pane —
  both ways, with no reload, so the previews always match. Requires
  `@selfhelp/shared >= 1.15.3` and mobile `>= 0.1.17`.

## v0.1.38 — 2026-06-24

### Changed
- **The mobile device controls now sit on a floating pill over the mobile pane.**
  The phone/tablet and portrait/landscape switches plus a mobile-only reload moved
  off the top toolbar onto a small rounded bar directly above the phone frame, so
  it is clear they belong to the mobile preview. The top toolbar keeps only the
  shared controls (Mobile toggle, Draft, Refresh both, open-in-new-tab).
- **The avatar / profile menu now navigates inside the preview.** Choosing
  "Profile" (or any profile-link page) from the header avatar drives the preview —
  the profile page appears in **both** the web pane and the mobile frame — instead
  of navigating the whole admin app away and dropping the mobile frame.
- **Clearer first-load message for the mobile preview in development.** While the
  Expo dev bundle compiles on the first open, the mobile frame now says so under
  the spinner instead of showing an unexplained, seemingly stuck loader.

### Fixed
- **Reloading only the mobile preview no longer sticks on a perpetual spinner.**
  The mobile frame now remounts only once a fresh preview code has been minted
  (after a mobile reload, a "Refresh both", or returning to a hidden tab), instead
  of briefly remounting onto the already-consumed code and wedging the cross-origin
  Expo dev frame until the tab was hidden and shown again.

## v0.1.37 — 2026-06-24

### Changed
- **The Live Preview web pane is now built directly into the page — it is no
  longer an iframe.** The desktop preview renders the real website (header menu,
  page content and footer) inline next to the mobile frame, so it loads faster (no
  second app instance), always works even when the mobile preview is offline, and
  feels like browsing the live site.
- **Navigation stays in sync both ways, with no reload.** Clicking a link or button
  in the web pane navigates the preview and moves the mobile frame to the same
  page; a navigation on mobile moves the web pane too. The master
  `/admin/preview/<keyword>` URL updates in **both** directions, so the current
  page stays shareable and survives a reload.
- **Cleaner toolbar.** Removed the web size selector and the toolbar language
  picker — the web pane fills the space and language is changed from each pane's
  own controls (web header selector / mobile profile). The toolbar now has the
  Mobile toggle, the Draft switch, Refresh, and open-in-new-tab. The mobile pane
  keeps its phone/tablet × portrait/landscape device frame (its device controls
  moved onto a floating pill over the mobile pane in v0.1.38).

### Removed
- The separate web-preview iframe and its responsive-width control, plus the
  manual Stop control (the web pane is always live; the mobile frame auto-pauses
  only while the tab is hidden).

These are floor-neutral Live Preview changes (no new backend dependency — the web
pane reuses the existing public content API and the mobile pane the existing mint
endpoint + bridge), so `supports.core` stays `>= 0.1.21`. Pairs with the
`selfhelp-mobile-preview` image `>= 0.1.15`.

---

## v0.1.36 — 2026-06-24

### Fixed
- **Opening DevTools (or losing window focus) no longer pauses the preview.** The
  preview frames now unload **only when the browser tab is actually hidden** (or
  you press **Stop**) — not when the window merely loses focus — so opening
  developer tools, or clicking another window, keeps both frames live.
- **"Refresh mobile" no longer sticks on an endless loading spinner.** Refreshing
  the mobile frame on its own now does a clean **unmount → remount** with a fresh
  preview session (the same recovery the tab-visibility resume does), instead of
  an in-place reload that could wedge the cross-origin Expo dev frame.
- **Minting the mobile preview session no longer hangs silently.** A failed or
  timed-out mint (e.g. a cold dev route-compile or a backend mid-restart) now
  **auto-retries** and, if it still fails, shows an inline **error + Retry** in the
  device frame instead of a spinner that never resolves — what previously read as
  "`/api/mobile-preview/session` never returns" on refresh / toggling mobile.
- **"Back to editor" is fast again.** Returning now lands on the page you are
  **currently** viewing (not the launch page). In production the editor route's
  RSC payload is **prefetched** while you preview, so the return is near-instant;
  in development the editor's **Turbopack compile is warmed in the background**, so
  you no longer pay the ~10 s cold-compile stall on the first return.

### Changed
- **The synced page is mirrored into the address bar.** As you navigate inside the
  preview, the master URL updates to `/admin/preview/<keyword>`, so the current
  page is **shareable** and **survives a reload** (both frames reopen on it).
- **A frame that (re)loads re-syncs to the canonical page.** When either frame
  finishes (re)loading it announces itself and the shell pushes the current
  keyword to it, so "navigate in the web frame → see it on mobile too" now holds
  even across a mobile re-mint / HMR reload (no more drifting apart).
- **Mobile in-frame debug FAB shown in the preview.** The floating "D" debug
  button is available inside the embedded mobile frame again (logs / queries /
  auth / server / info); the shell top bar still owns the device chrome.

These are floor-neutral Live Preview fixes (no new backend dependency), so
`supports.core` stays `>= 0.1.21`. Pairs with the `selfhelp-mobile-preview` image
`>= 0.1.15` (in-frame debug FAB + app-wide off-menu modals + status-aware page
errors).

---

## v0.1.35 — 2026-06-24

### Changed
- **CMS Live Preview — synchronized web ↔ mobile navigation.** The shell now owns
  the **canonical preview page**: clicking a link in either frame reports the new
  page up to the shell, which drives the **other** frame to the same CMS keyword,
  so web and mobile never drift apart — a clean QA flow. Sync uses a small
  `postMessage` **preview bridge** (the new `@selfhelp/shared` `1.15.2` contract):
  a `PreviewShellBridge` mounted in the public website shell reports navigations
  and accepts soft "navigate to keyword" commands (no reload), with a per-frame
  loop guard so the two frames never ping-pong. A keyword that doesn't exist on
  the other platform shows that platform's normal "page not found" state.
- **Live Preview toolbar redesign — one control bar, frames-only canvas.** All
  controls live in the top bar: shared **Show Web** / **Show Mobile**,
  **Draft/Published**, **Reload both**, and **Stop / Live reload**; a **Web** group
  (responsive width Full / Desktop / Tablet / Mobile, **open in new tab**, and
  **refresh web only**) and a **Mobile** group (device, orientation, **language**,
  and **refresh mobile only**). Below the bar there is nothing but the preview
  frames; when only one frame is shown it takes the full width.
- **Independent refresh + non-reloading resize.** Separate **web** and **mobile**
  reload keys mean *Refresh web* / *Refresh mobile* / *Reload both* act
  independently, while changing a device size or orientation only **resizes** the
  frame (no reload). The **Draft** toggle updates both frames.
- **Per-frame language handling.** The **mobile** frame gets a language selector in
  the toolbar (it has no in-frame picker); the **web** frame keeps its own in-page
  language control and reports its active locale back to the toolbar as a
  **read-only badge**, so it's always clear which language each frame is showing.
- **Iframe sandboxing.** Both preview iframes run sandboxed
  (`allow-scripts allow-same-origin allow-forms allow-popups`, no top-navigation).

This release adopts `@selfhelp/shared` `^1.15.2` and pairs with the
`selfhelp-mobile-preview` image `>= 0.1.14` (which renders the matching mobile
bridge + draft banner). It adds **no** new backend dependency, so `supports.core`
stays `>= 0.1.21`.

---

## v0.1.34 — 2026-06-24

### Changed
- **CMS Live Preview — one shared control bar, frames-only canvas.** The top bar
  (with the back button) now hosts every control: shared **Show Web** / **Show
  Mobile** toggles, the **Draft** (vs published) switch, **Reload**, and a
  **Stop / Load** button, with the per-platform groups (Web: responsive width +
  open-in-new-tab; Mobile: device / orientation / language) directly beneath. The
  area below the bar holds nothing but the preview frames. The **Draft** toggle
  is now shared: it re-mints the mobile pane **and** writes the `sh_preview`
  cookie so the same-origin web pane (which resolves preview at SSR) matches.
- **Live Preview no longer freezes dev — iframes are unloaded when idle.**
  Embedding two live apps in iframes makes each one its own live-reload client,
  which in development could starve the Next/Expo dev server and block recompiles
  while the preview tab was open. The frames are now **automatically unloaded
  when the tab is hidden** and, in development, while the browser is unfocused
  during IDE work (then remounted on return). They can also be unloaded on
  demand with **Stop** — both free the dev servers immediately. Combined with the
  mobile image's reload-resilient session cache, reloads and HMR no longer brick
  the preview or make the UI unresponsive, in dev **and** production.
- **"Live preview" moved to the page-sections toolbar; "Preview Page" → "Open web
  page".** The **Live preview** button now sits in the sections toolbar next to
  **Add Section** / **Edit Page**, and the old **Preview Page** button is renamed
  **Open web page** (with an external-link icon) to make the split clear: *Open
  web page* is a plain link to the live public page (web only), while *Live
  preview* is the full web + mobile studio.

### Fixed
- **Login submit button & links are readable in dark mode.** The seeded neutral
  **`dark`** accent (which renders near-black) made the submit button and the
  reset/register links blend into a dark-mode background. The renderer now treats
  a `dark`/`black` accent **adaptively**, so the button keeps body/contrast
  colours and the links fall back to the theme link colour — light mode is
  unchanged. (No backend change: the seeded `color` default stays `dark`.)

### Removed
- **Mobile Preview panel removed from the page inspector.** The right-side
  inspector no longer embeds the quick-snippet Mobile Preview panel; the
  full-screen **Live preview** (now in the sections toolbar) is the single place
  to preview web + mobile.

---

## v0.1.33 — 2026-06-23

### Added
- **Full-screen CMS Live Preview (test the real flow in a device frame).** A new
  **"Live preview"** button in the page editor header opens a dedicated,
  chrome-free preview surface (`/admin/preview/<keyword>`) in a **new tab**.
  Unlike the inspector's quick-snippet panel, this is for walking the **real
  flow**: the one-time preview code is minted **without a page scope**, so the
  mobile pane allows **free navigation** through the app (still GET-only, still
  the read-only render allowlist), starting on the page you launched from. Pick
  the device (**phone / tablet**) and **orientation** (portrait / landscape) —
  the mobile column **grows/shrinks** to the device frame **without reloading**
  (so in-app navigation state is preserved), defaulting to **phone portrait**. A
  **Draft** toggle re-mints to render published vs unpublished-draft content, and
  an optional side-by-side **Web (desktop)** pane embeds the same page in the web
  frontend for comparison. Gated by the new **`admin.mobile_preview.view`**
  permission (server-checked on the route, client-checked on the editor entry),
  so the surface only exists for CMS preview — never on normal public pages
  (core `>=0.1.21`).

### Changed
- **Page-editor Mobile Preview panel — tidier toolbar, unchanged behaviour.** The
  inspector's Mobile Preview panel (still collapsed by default) groups its
  device / orientation / language / draft controls into a clean bordered toolbar.
  Its quick-snippet behaviour is unchanged; the new full-screen Live Preview is
  the place to test the real flow.

---

## v0.1.32 — 2026-06-23

### Added
- **Mobile preview in System Maintenance — see, install/enable, and update.** The
  *Current instance* table now shows the installed **Mobile preview** image
  version (from the core's `mobile_preview_version`), or a **"Not installed"**
  badge for instances without it. A new **"Update / enable mobile preview"**
  section mirrors the frontend-only update lane: a registry-fed target picker,
  **Check mobile preview compatibility** (preflight), and a request that
  **installs/enables** the optional `selfhelp-mobile-preview` image on instances
  that predate default provisioning, or **updates** it to a newer compatible
  version. A `mobile_preview_compatibility` preflight error blocks a preview the
  running core cannot satisfy; the request reuses `admin.system.update`, never
  sends an `instance_id`, and is locked while any other update is in flight. Adds
  the `useMobilePreviewUpdateReleases` / `useMobilePreviewUpdatePreflight` /
  `useRequestMobilePreviewUpdateMutation` hooks (core `>=0.1.20`).

### Changed
- **Mobile preview panel auto-resolves its origin (zero-config live-reload).** The
  page-editor Mobile Preview panel no longer needs `NEXT_PUBLIC_MOBILE_PREVIEW_ORIGIN`
  to be set: it probes, in order, an explicit env override → the installed image
  at `/mobile-preview` → (in `next dev` only) the Expo dev server at
  `http://localhost:8081`, and shows the first available one (with a "live-reload
  dev" badge for the dev server). Set the env var only to **override** the
  auto-resolution. When neither an image nor a dev server answers, the panel shows
  the graceful "unavailable" card pointing at System Maintenance to enable the
  service — it never blocks the editor.

### Fixed
- **Page-editor mobile preview now actually loads.** The preview iframe stayed
  blank with a *"Permission metadata missing for API call:
  /api/mobile-preview/session"* error because the session mint called the raw
  `apiClient`, which the permission-aware request guard rejects. The mint now goes
  through `permissionAwareApiClient` using the new `ADMIN_MOBILE_PREVIEW_SESSION`
  endpoint (gated by `admin.mobile_preview.create`), so it carries the required
  permission metadata and the one-time code is minted on load and on every reload.

## v0.1.31 — 2026-06-23

### Added
- **Mobile preview in the page editor.** A new **Mobile preview** section in the
  page inspector (`MobilePreviewPanel`) embeds the `selfhelp-mobile-preview` web
  image in an iframe so editors see the current page rendered as the mobile app,
  with device (phone/tablet), orientation, language, and draft toggles. It mints
  a short-lived, single-use preview code through a new protected BFF route
  (`POST /api/mobile-preview/session`) that forwards to the core admin mint
  endpoint with the admin's server-side JWT — the admin token never reaches the
  iframe; only the opaque one-time code does. The preview origin is configurable
  via `NEXT_PUBLIC_MOBILE_PREVIEW_ORIGIN` (default `/mobile-preview`; point it at
  a running Expo dev server such as `http://localhost:8081` for live-reload
  development). When no preview is deployed (the `<origin>/version.json` probe
  404s) the panel shows a graceful "unavailable" state instead of an error.
  Requires core ≥ 0.1.19 (the mobile-preview session endpoints) and
  `@selfhelp/shared` ≥ 1.14.25 (the preview-session contract types).

### Changed
- Bumped `@selfhelp/shared` to `^1.14.25` for the mobile preview-session types
  (`IMobilePreviewSessionRequest` / `IMobilePreviewSessionData`).
- Raised the `release-manifest.json` `supports.core` floor `>=0.1.17` → `>=0.1.19`
  (the page-editor preview depends on the core mobile-preview mint endpoint).

---

## v0.1.30 — 2026-06-23

### Fixed
- **Anonymous preview no longer 401-loops the public site.** The backend
  (core ≥ 0.1.18) now rejects an anonymous `preview=true` with `401`. The
  long-lived, admin-set `sh_preview` cookie can outlive a session (an admin
  enables preview, then logs out or the session expires), which left every
  anonymous SSR render requesting the unpublished draft and failing. Preview is
  now gated on a live session: `resolvePreviewSSR` only reports preview when an
  auth/refresh cookie is present, and `clearAuthCookies` (logout + session
  expiry) clears `sh_preview`. Anonymous visitors always get the published view.
  Mirrors the mobile client's preview-policy gate. Requires core ≥ 0.1.18.

### Removed
- **Dead form-submit success toast.** `useFormSubmission` read
  `response.data.success`/`message`, which the backend submit/update responses
  never send, so the toast never fired. Removed the dead branch; success
  feedback (redirect / inline confirmation) remains owned by the FormUserInput
  renderer, and the affected caches are still invalidated on success.

---

## v0.1.29 — 2026-06-22

### Fixed
- **`select` now shows its label.** The `select` style has always had a `label`
  field in the CMS, but `SelectStyle` never passed it to Mantine, so the field
  rendered with no caption (unlike `combobox`). The label now renders for both
  single and multi-select. Requires `@selfhelp/shared` ≥ 1.14.19 (which adds
  `ISelectStyle.label`).

---

## v0.1.28 — 2026-06-22

### Added
- **Form / interactive style fields render (capability pass).** `number-input`
  honours `prefix` / `suffix` / `thousand_separator` / `allow_negative` /
  `hide_controls`; `color-input` honours `with_eye_dropper` / `disallow_input` /
  `with_preview`; `tabs` honours `grow` / `justify` (on the tab list) +
  `keep_mounted` / `placement`; `switch` honours `with_thumb_indicator` +
  `thumb_icon` (icon picker); `text-input` + `textarea` honour `shared_max_length`
  (HTML `maxLength`); `progress-root` honours `shared_radius`. Requires
  `@selfhelp/shared` ≥ 1.14.17.
- **Inline rich-text in CMS content now renders on the frontend.** The `text`,
  `blockquote`, and `list-item` styles preserve the author's inline formatting
  (bold / italic / underline / link) from `markdown-inline` fields instead of
  stripping it. They render via the shared `renderRichInline` helper (XSS-stripped,
  stray markdown block tags flattened to inline, hydration-safe), so **Ctrl+B bold
  authored in the CMS shows on the page** and a stray `<p>` wrapper no longer
  prints as literal tags.
- **CMS authoring affordance + gating.** The section inspector enables the
  rich-text shortcuts (Ctrl/⌘ + B/I/U) **only** for `markdown-inline` fields and
  shows a compact `Rich text:` hint (`Kbd`) with the shortcut keys, so authors
  see exactly where formatting is allowed. Plain `text` fields disable the
  shortcuts so no `<strong>` is ever saved into a slot meant to stay plain.
- **New media / interactive style fields render.** `image` honours `fallback_src`
  (shown when the main source fails to load), `figure` can carry a built-in
  `img_src`/`alt`, `link` supports `shared_color` + `web_link_underline` +
  left/right icons, `action-icon` exposes `aria_label`, `spoiler` takes a
  `shared_color` control colour, and `audio`/`video` honour the `has_controls` /
  `media_loop` / `media_autoplay` (+ `media_muted` / `poster_src` for video)
  playback toggles.

### Changed
- `TextStyle`, `BlockquoteStyle`, and `ListItemStyle` render the safe inline subset
  via the shared `renderRichInline` helper instead of `DOMPurify`-stripping all tags.

### Fixed
- **`carousel` arrows did nothing and slides showed as tiny thumbnails.** The
  `web_carousel_slide_size` percentage slider is saved as a bare number (e.g.
  `100` meaning 100%), but Mantine reads a unit-less `slideSize` as pixels, so
  every slide collapsed to ~100px, all slides fit the viewport, and the controls
  had nothing to scroll. The renderer now expresses a bare number as a percentage
  (values that already carry a unit are untouched) and constrains slide media to
  the carousel height when one is set, so the arrows page through full-size,
  non-clipped slides.
- **`slider` / `range-slider` ignored `css` / `css_mobile` and spacing when they
  had no label.** The section class + spacing were only applied to the
  `Input.Wrapper`, which is skipped when there is no label/description, so a
  label-less slider silently dropped the custom-styling escape hatch. The control
  itself now carries the section class + spacing in that case (matching
  `rating` / `progress` / `segmented-control`).
- **`file-input` drag-and-drop zone was unreadable in dark mode.** The dropzone
  border, hover background, and upload icon were hard-coded light hexes
  (`#ced4da` / `#f8f9fa` / `#868e96`) that washed out on a dark background. They
  now resolve through theme-aware Mantine CSS variables so the dropzone is legible
  in both colour schemes.
- **`html-tag` style rendered an empty element.** In content-only mode the text was
  passed as a React prop (so it landed as a bogus `content="…"` DOM attribute on
  e.g. `<mark>`) instead of as the element's children — the tag rendered empty. It
  now renders the sanitized text as children.
- **Rich-inline content no longer triggers a React hydration mismatch.**
  `renderRichInline` now renders the sanitized HTML via a hydration-safe
  `dangerouslySetInnerHTML` span instead of `html-react-parser`, which mismatched
  server/client markup for content containing links.
- **`image` fallback now triggers under SSR.** A fast 404 could fire the `<img>`
  `error` on the server-rendered markup before hydration attached Mantine's
  `onError`, so the broken image stuck. The renderer now also detects an
  already-broken image on mount and swaps to `fallback_src` explicitly.

## v0.1.27 — 2026-06-22

### Changed
- **Layout styles are now cross-platform configurable (web + mobile).** The layout
  renderers read the promoted `shared_*` fields instead of the old `web_*` ones so a
  single authored value drives both platforms: `flex`, `group`, `stack`, `grid`,
  `grid-column`, `center`, `simple-grid` read `shared_width`/`shared_height`;
  `scroll-area` reads `shared_height`; `grid`/`simple-grid` read `shared_cols`;
  `grid-column` reads `shared_grid_span`/`shared_grid_offset`/`shared_grid_order`/
  `shared_grid_grow`; `center` reads `shared_miw`/`shared_mih`/`shared_maw`/`shared_mah`;
  `space` reads `shared_orientation`; `divider` reads `shared_divider_variant`/
  `shared_divider_label_position`; `paper` reads `shared_border`. Platform-only
  richness stays web-only (`grid.web_grid_overflow`, `center.web_center_inline`,
  `scroll-area` scrollbar props, `paper.web_paper_shadow`). Pairs with
  `@selfhelp/shared` `1.14.12` and backend migration `Version20260622063129`.

### Added
- **`paper` gained an optional auto-styled `title`.** When empty the surface renders
  exactly as before (a plain `Paper`); when filled, the renderer draws a styled
  heading above the content (HTML-stripped to plain text). It never creates a child
  section — it only changes how this one section is drawn. (`PaperStyle.tsx`)
- **`simple-grid` gained responsive web column overrides + a horizontal gap.** The
  base column count is the cross-platform `shared_cols`; the new web-only
  `web_cols_sm`/`web_cols_md`/`web_cols_lg` (clearable selects = inherit base) build a
  Mantine responsive `cols` object, and `shared_gap` now drives horizontal spacing
  while `shared_vertical_spacing` drives row spacing. Replaces the old
  `web_breakpoints`/`web_spacing` handling. (`SimpleGridStyle.tsx`)

### Removed
- **`container` and `paper` dropped `web_px`/`web_py`.** Padding now comes from the
  portable `shared_spacing` control (renders on web + mobile); the renderers keep a
  fixed inner `padding="md"` default. (`ContainerStyle.tsx`, `PaperStyle.tsx`)

---

## v0.1.26 — 2026-06-19

### Fixed
- **CMS `css` escape hatch now actually overrides Mantine on Card/Paper-based
  styles (and every other core component).** The root layout and the slug shell
  imported the **unlayered** `@mantine/core/styles.css` on top of the *layered*
  `@mantine/core/styles.layer.css` already loaded by `globals.css`. Unlayered
  rules beat every `@layer utilities` rule, so author-picked Tailwind classes in
  the section `css` field (e.g. `bg-blue-500 rounded-xl shadow-md text-white p-4`
  on a `card`) were silently ignored — Mantine's own background/radius/padding
  always won. Removed the redundant unlayered core import in both
  `src/app/layout.tsx` and `src/app/[[...slug]]/SlugLayout/SlugShell.tsx`;
  Mantine core stays fully styled via the layered copy, now in `@layer mantine`
  where the `css` field's `@layer utilities` classes can override it. Verified
  live on desktop + small-screen web in light and dark.

### Removed
- **`card` dropped the redundant `web_card_padding` field.** It duplicated the
  portable `shared_spacing` padding (which renders on web + mobile), so the
  renderer now keeps a fixed Mantine `padding="md"` inner default (also the
  `Card.Section` image-bleed reference) and authors tune padding through the
  shared **Spacing** control. Pairs with `@selfhelp/shared` `1.14.11` and backend
  migration `Version20260619205908`. (`CardStyle.tsx`)

---

## v0.1.25 — 2026-06-19

### Changed
- **`card`, `card-segment`, `checkbox`, `chip`, `code`, `title` renderers follow
  the backend style polish wave** (requires core `>= 0.1.15` + `@selfhelp/shared`
  `1.14.9`):
  - **card** — optional auto-styled `title` (heading, HTML-stripped) and
    `img_src` (top image via the asset picker) render only when filled; border is
    the cross-platform `shared_border` (was `web_border`) and the card now honours
    `web_card_padding`.
  - **card-segment** — reads `shared_border` (Mantine `withBorder`) and
    `web_segment_inherit_padding` (Mantine `inheritPadding`).
  - **checkbox** — label side reads `shared_label_position` (was
    `web_checkbox_label_position`).
  - **chip** — reads `shared_chip_variant` (was `web_chip_variant`) and sanitizes
    the `label` plain-text slot with `stripHtmlTags`.
  - **code** — block toggle reads `code_block` (was `web_code_block`) and applies
    the new `shared_radius` to the block corners.
  - **title** — reads `title_order` (was `web_title_order`), `shared_line_clamp`
    (was `web_title_line_clamp`) and the new `shared_color`.

---

## v0.1.24 — 2026-06-19

### Changed
- **`accordion` / `accordion-item` renderers follow the backend accordion polish
  wave** (requires core `>= 0.1.15` + `@selfhelp/shared` `1.14.8`):
  - `AccordionStyle` reads the promoted cross-platform `shared_accordion_variant`
    (was the web-only `web_accordion_variant`) for the Mantine `variant`.
  - `AccordionItemStyle` renders the new optional `description` content field as a
    dimmed subtitle under the item label (empty = unchanged), and sanitizes the
    `label` + `description` plain-text slots with `stripHtmlTags`.

---

## v0.1.23 — 2026-06-19

### Changed
- **`alert`, `badge`, `avatar`, `button` and `login` renderers follow the
  backend style polish wave** (requires core `>= 0.1.15` + `@selfhelp/shared`
  `1.14.7`):
  - **button** — reads the cross-platform `shared_variant` instead of the removed
    `web_variant`, and now falls back to the external `url` field when no internal
    `page_keyword` is set.
  - **badge** — reads `shared_variant` (with the optional web-only `web_variant`
    override taking precedence) and renders a circle when the new `circle` toggle
    is on.
  - **avatar** — reads `web_variant` (was the stale `web_avatar_variant`) and
    derives initials + an auto colour from the new `name` field when no image is
    set.
  - **alert** — reads the cross-platform `closable` toggle (was the web-only
    `web_with_close_button`).
  - **login** — renders the optional `subtitle` under the title and takes the
    submit-button colour from `shared_color`; the dead `type` field read was
    removed. The "Forgot password?" and "Create account" links now also use the
    authored `shared_color` so the button and its links stay visually consistent.
- New focused renderer tests cover each of the above (`ButtonStyle`,
  `BadgeStyle`, `AvatarStyle`, `AlertStyle`, `LoginStyle`).

### Fixed
- **Section inspector property/override selects are always clearable.** A select
  for a property or `shared_*`/`web_*`/`mobile_*` override (e.g. badge
  `web_variant`) could be seeded with `config.clearable: false`, which hid the
  clear (×) button and stranded an overridden value with no way to revert it.
  `SectionPropertyField` now forces `clearable: true`, so clearing an override
  falls back to the inherited/shared value and clearing a shared field reverts to
  the style default. Covered by a focused `section-field-connectors` test.

## v0.1.22 — 2026-06-18

### Added
- **Web renderers for the last five established catalog styles** that were
  previously falling through to `UnknownStyle`: `entry-list`, `entry-record`,
  `loop` (backend-hydrated children wrappers), `entry-record-delete` (a
  destructive button with a confirmation modal wired to the shared
  `useDeleteFormMutation`), and `version` (a no-op diagnostic surface that
  mirrors the mobile renderer). Every `web`/`both` style in the shared registry
  now has a real core renderer.
- **Exhaustive web renderer parity test** (`BasicStyle.test.tsx`): any
  `web`/`both` style in `@selfhelp/shared` that lacks a `STYLE_IMPLS` entry now
  fails CI instead of silently rendering `UnknownStyle`, mirroring the mobile
  `registry-parity` guard.

### Changed
- **Compatibility floor raised to core `>=0.1.15`** (`release-manifest.json`):
  this frontend now depends on the backend mobile-rendering style-schema
  contract (style `renderTarget`, the required per-field `scope` that drives
  inspector grouping, and the `shared_`/`web_` field taxonomy with the duplicate
  `pages.id_platform` removed).

---

## v0.1.21 — 2026-06-18

### Added
- **Blocking lint & test CI gates.** A type-aware ESLint flat config
  (typescript-eslint) is now enforced: ESLint (`--max-warnings=0`) and the Vitest
  suite must pass on every PR/push and again before any tagged Docker
  publish/GitHub release.

### Changed
- **React Query keys for the page list, public page content, page
  sections/fields, page versions, unpublished changes, the admin section
  utilities and the cache stats/health views now come from one registry**
  (`REACT_QUERY_CONFIG.QUERY_KEYS`), so a writer's invalidation can no longer
  drift from a reader's key. As part of this, clearing the API-routes cache now
  refreshes the cache stats/health cards (it previously invalidated a key no
  view subscribed to, so the cards stayed stale until reload).
- Centralized permission-aware API request building, single-sourced the
  admin-session route prefixes, and renamed the permission CRUD helpers /
  extracted the permission bit constants — no behavior change.
- **Condition builder is easier to read and use.** Scoped, theme-aware styling
  gives the rule rows consistent alignment and spacing and wraps each AND/OR
  group in a subtle card outline in both light and dark mode (the builder
  previously shipped only structural CSS and looked cramped/misaligned inside the
  admin modal).
- **CMS style names are now kebab-case (cross-repo rename).** The camelCase CMS
  style names were renamed to kebab-case in lockstep with `@selfhelp/shared`
  1.8.0 (which moved the `style_name` discriminator) and the backend `styles`
  rows: `resetPassword`→`reset-password`, `twoFactorAuth`→`two-factor-auth`,
  `noAccess`→`no-access`, `notFound`→`not-found`, `entryList`→`entry-list`,
  `entryRecord`→`entry-record`, `entryRecordDelete`→`entry-record-delete`,
  `showUserInput`→`show-user-input`, `refContainer`→`ref-container`,
  `dataContainer`→`data-container`, `multiSelect`→`multi-select`. The
  `BasicStyle` dispatcher keys, the local `TStyleName` union and the
  `MANTINE_COMPONENT_MAP` lookup were updated to match; camelCase JS identifiers
  (`AuthApi.resetPassword()`, the `multiSelect` field-config flag, the
  `RefContainerStyle` component) are intentionally unchanged. Sections reference
  styles by FK id, so the DB side is a metadata rename, not a content migration.
- Bumped the `@selfhelp/shared` dependency to `^1.8.0` to pick up the kebab-case
  style contract.
- **CMS identifier naming conventions are documented in `AGENTS.md`** as a
  cross-repo contract so backend seeds/DB, `@selfhelp/shared`, the frontend
  `BasicStyle`/`FieldRenderer`, and the mobile renderers stay in lockstep:
  **style names → `kebab-case`**, **field names → `snake_case`**, **field types →
  `kebab-case`**.

### Fixed
- **Editing a page or its sections now refreshes the screen reliably.** Page and
  section mutations (create / update / move / remove / delete, add-section) now
  invalidate the same centralized query keys the read hooks subscribe to, so the
  editor, the section tree and the public page reflect a change immediately
  instead of occasionally showing stale content until a manual reload.
- **"Too many re-renders" crash in the condition builder is gone.** The
  `ConditionBuilderModal` (reached from a section field and from the Actions page
  "New Action" flow) and the `MenuPositionEditor` synced state from props during
  render keyed on objects that were rebuilt every render, which looped forever.
  They now use React's guarded "adjust state while rendering" pattern keyed on
  stable values only.
- **`/no-access` is no longer redirected to `/auth/no-access`.** The static
  fallback keyword map used snake_case keys while the CMS keywords are
  kebab-case, so the lookup 404'd and bounced to the auth route; the canonical
  `/no-access` (and `/no-access-guest`) URLs now resolve and render directly.
- **No more light flash on reload in auto dark mode.** The Mantine color-scheme
  bootstrap is now inlined into `<head>` (it ran from an external script that
  executed after first paint), and is emitted once per page instead of once per
  SSR stream flush, so an `auto` + OS-dark visitor paints dark on the first frame.
  The bootstrap now also defaults to `auto` (resolving the OS preference) rather
  than `light` when no choice is saved, and the resolved choice is persisted to
  the `sh_color_scheme` cookie on the first visit — so a brand-new OS-dark
  visitor no longer flashes light-then-dark, and the preference is initialised
  instead of being re-derived on every reload.
- **Adding a section now selects it and flags the page as publishable.** The
  create endpoint returns the new section(s) as an array; the extractor now reads
  that shape (selecting the first when several are added), and every section
  mutation invalidates the unpublished-changes query so "Publish Changes" lights
  up immediately instead of after the 30s poll.
- **Reopening an action in edit now repopulates the form.** The Action edit
  modal synced its fields off a `prevDetails !== details` guard that never fired
  when the action-details query was already cached (i.e. reopening an action),
  leaving every field blank. It now keys the one-time populate on a stable
  open/mode/action/loaded signature, so a cached action fills the form
  immediately and a later background refetch no longer clobbers in-progress edits.
- **Actions can no longer be saved without a subject and body.** The Action
  form's required-field check now treats the notification subject and body (the
  per-language translation content) as mandatory for every notification job,
  alongside the existing recipient check, so Save stays disabled until they are
  filled.

### Removed
- **Duplicate HeroUI-named style folder.** Deleted
  `src/app/components/frontend/styles/mantine/heroui/` (13 renderers + a local
  `intentColor.ts`). The frontend renders Mantine only; those styles (`dialog`,
  `popover`, `menu`, `menu-item`, `toast`, `skeleton`, `skeleton-group`,
  `spinner`, `tag`, `tag-group`, `search-field`, `input-group`, `input-otp`) are
  plain Mantine renderers under `mantine/`, and intent→color mapping now comes
  solely from the shared `mapIntentToMantine` (`@selfhelp/shared`) instead of the
  removed local duplicate.
- Dead code: the unreachable 401 branch in the Refine auth `onError`, the unused
  `endpointKey` API argument, the stale `registered.ts` reference in the
  plugins-sync CI check, and two unused section-sibling mutation hooks
  (`useCreateSiblingAbove/BelowMutation`) that duplicated the create-section flow
  and invalidated keys no reader subscribed to (the add-sibling UI uses the
  Add-Section modal, not these hooks).

### Security
- **Patched five dependency vulnerabilities flagged by Dependabot.** Upgraded
  `dompurify` to 3.4.11 (fixes the `IN_PLACE` DOM-clobbering XSS bypass plus five
  other alerts) and forced patched versions of the transitive `qs` (6.15.2),
  `js-yaml` (4.2.0), `form-data` (4.0.6), and `tsx`'s `esbuild` (0.28.1) through
  npm `overrides`. Vite's own `esbuild` (0.25.12) is outside the advisory range
  and left untouched. `npm audit` now reports 0 vulnerabilities.
- **Removed deprecated/unsupported transitive dependencies.** Consolidated every
  `glob` (was `7.2.3` + `10.5.0`, both flagged as unsupported) onto the latest
  `13.0.6` via an npm `override`, which also drops the deprecated, memory-leaking
  `inflight@1.0.6` (only pulled in by the old `glob@7`). A clean `npm install` no
  longer prints deprecation warnings.

## v0.1.20 — 2026-06-17

### Fixed
- **Installing a plugin no longer bounces you to the login page.** The
  v0.1.19 fix covered the Refine `check()`, but two other layers still read a
  brief backend restart (while the manager applies a plugin / system
  operation) as "logged out": the server-side admin guard (`/auth/user-data`
  returning a transient 5xx / network error made it `redirect('/login')`,
  which the plugin SSE hook triggered via `router.refresh()`), and the client
  `AdminShell` (which redirected on any `isAuthenticated === false`). Both now
  distinguish a transient outage (`unreachable`) from a genuine `401`: the SSR
  guard fails open and renders the shell, and the admin shell stays put while
  the transient-aware `user-data` retry rides out the restart. Your session
  cookies were always intact — now the UI knows it, so a plugin install no
  longer makes you think you have to sign in again.

## v0.1.19 — 2026-06-17

### Fixed
- **No more forced logout when the backend restarts.** Applying a plugin or
  system operation restarts the instance's Symfony services for a few seconds,
  during which `/api/auth/user-data` answers with a transient network error or
  5xx. The Refine auth `check()` read that as "not authenticated" and bounced
  the operator to `/auth/login` mid-operation. It now distinguishes a transient
  backend outage (session kept — the BFF already preserves the httpOnly cookies
  and answers an in-flight refresh with `503 logged_in:true`) from a genuine
  `401 logged_in:false` expiry, so a restart is ridden out in place and only a
  real session expiry signs you out.

## v0.1.18 — 2026-06-16

### Added
- **Styled system error pages.** The 404 (`notFound`), 403 (`noAccess` /
  no-access-guest) and generic "missing" pages now render through dedicated
  CMS-driven styles (`NotFoundStyle`, `NoAccessStyle`, `MissingStyle`) instead
  of bare/hardcoded screens, with a configurable title, message and action
  button, an optional login link, an optional icon, and Mantine
  color/radius/shadow/variant presentation. The `/auth/*` static fallbacks and
  the global `NotFoundClient` were rewired onto the new styles, and the styles
  are covered by component tests.
- **`refContainer` style.** A new transparent, structural style that renders
  its referenced children inline with no wrapper, so a single section subtree
  can be reused across multiple pages.
- **`showUserInput` style.** Renders a form's collected entries as a Mantine
  table with optional sorting, search, pagination, an info line, CSV export and
  per-row delete (behind a confirmation modal). Columns can be remapped via
  `fields_map`, a leading date or `#` column is shown, and the per-row trash
  icon only appears for rows the backend marks as deletable (`_can_delete`).

### Changed
- **Deleting a section now permanently destroys it everywhere, independent of
  any page.** `deleteSection` calls the new `DELETE /admin/sections/{id}`
  endpoint (no page id) and invalidates the page-sections, ref-container and
  unused-section caches; the section inspector first lists which pages a section
  belongs to (via the new `useSectionPages` hook) so you can see the impact, and
  the page-sections panel gained a manual refresh button.
- **Publishing warns about shared refContainers.** The publish-version modal now
  lists other already-published pages that share a `refContainer` being
  published — resolved through the new batch `GET /admin/sections/pages?ids[]=`
  endpoint with support for multiple section ids — so you don't unknowingly
  alter other live pages.
- **System page URLs are kebab-case.** Reset-password moved from `/reset` to
  `/reset-password` and the underscore→hyphen alias map was dropped now that CMS
  keywords match URL segments directly.
- **Notification / email action editor** shows localized placeholder hints
  (`{{user_name}}`, `{{user_email}}`, `{{user_code}}`, `{{id_users}}`) inside the
  empty subject/body fields, demonstrating the placeholders the backend expands
  at send time. The hints are display-only and disappear as soon as you type.
- **`showUserInput` types come from `@selfhelp/shared`.** `IShowUserInputStyle`
  and `IShowUserInputEntry` are now imported from the shared package and the
  local duplicate definitions were deleted, matching the error-style imports and
  removing the drift risk of two diverging copies of the same contract.

### Fixed
- The select field placeholder now renders correctly.
- The publishing panel reads correctly in dark mode (inline styles replace the
  theme-blind ones).
- Page content authored as HTML is sanitized and rendered as HTML instead of
  showing escaped markup.

### Removed
- **The orphaned client-side `forceDeleteSection` stack.** The
  `ADMIN_SECTIONS_FORCE_DELETE` endpoint entry, the `forceDeleteSection` API
  client method, the `useForceDeleteSectionMutation` hook and the
  never-rendered `ForceDeleteSectionModal` were deleted. They targeted a backend
  `/sections/{id}/force-delete` route that no longer exists (it returned 404);
  permanently destroying a section now goes solely through the new
  `DELETE /admin/sections/{id}` endpoint.

## v0.1.17 — 2026-06-16

### Added
- **The System Maintenance page now tells you at a glance whether an update is
  available and what the newest version is.** Previously the page showed the
  current versions and a manual target-version picker, but never answered the
  first question an operator asks — "am I behind, and what is the latest I can
  move to?". A new **Updates** panel summarizes core and frontend separately,
  showing the current version, the newest installable version published in the
  official registry, and an **Update available** / **Up to date** badge. When a
  newer version exists, a one-click **Use latest** button seeds the target-version
  picker with it and runs the compatibility preflight, so the (still
  preflight-gated) request is one step away. The newest version ignores blocked
  releases, never claims an update when the current version is unknown, and
  degrades to "Could not check" when the registry is unreachable. Backed by a new
  tested `version.utils` comparator and `SystemMaintenancePage` tests.

## v0.1.16 — 2026-06-16

### Changed
- **The System Maintenance update view now shows the planned steps up front and
  ticks them live.** While an update ran, the SelfHelp Manager only wrote back
  its detailed per-step report at the very end, so the page showed just a status
  badge and a progress bar mid-update and then revealed every step at once when
  it finished ("after the end we see all the actions, but not while they're
  happening"). The active-operation panel now renders a planned checklist
  derived from the update kind — core (resolve → backup → pull → recreate →
  migrate → health) or frontend-only (resolve → pull → recreate → health) — and
  advances it from the live lifecycle status over the existing `system-update`
  SSE stream, mirroring the SelfHelp Manager's own console. Once the manager
  reports its detailed steps, those (with per-step detail) take over. Covered by
  `SystemMaintenancePage` tests for the in-flight plan, the frontend-only plan,
  and the detailed-steps takeover.

## v0.1.15 — 2026-06-16

### Fixed
- **The maintenance message renders its formatting instead of showing raw
  `<p>` tags.** The system maintenance alert is authored as HTML (the
  operator's note, surfaced through `{{system.maintenance_message}}`), but the
  alert style printed it as plain text, so visitors saw literal `<p>…</p>`
  markup during an outage. The alert content is now sanitized and parsed to
  safe HTML (`sanitizeHtmlForParsing` + `html-react-parser`), so paragraphs,
  line breaks and basic formatting render while scripts and event-handler
  attributes are stripped. Covered by an `AlertStyle` test (plain text,
  formatted HTML, and an XSS payload that must be dropped).

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
