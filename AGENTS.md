# AGENTS.md

Before returning anything print in chat `❤️AGENTS.md` so that we know the rules are used

## Project Overview
SelfHelp Frontend is a Next.js App Router application for the SelfHelp CMS. It renders public CMS pages and provides an admin CMS for pages, sections, users, roles, groups, assets, actions, cache, audit, data, languages, scheduled jobs, and page versions.

Read `docs/architecture/ssr-bff-architecture.md` first for current architecture. `architecture.md` is useful but partly historical.

## Architecture Snapshot
- Next.js App Router SSR/BFF frontend for a Symfony backend.
- JWT auth is managed through httpOnly cookies.
- React Query cache is seeded by SSR prefetch and hydrated on the client.
- Public pages use CMS-driven recursive section rendering.
- Dynamic style components are dispatched through `BasicStyle.tsx`.
- UI uses Mantine plus Tailwind dynamic CMS classes.
- Admin CMS is permission-aware and backed by endpoint permission metadata.
- Shared contracts are gradually moving through `@selfhelp/shared`.

## Source of Truth Priority
When sources conflict, use this priority order:
- Actual source code behavior.
- Current architecture docs, especially `docs/architecture/ssr-bff-architecture.md`.
- Existing hooks, services, components, and providers.
- Type definitions and available checks.

If docs conflict with implementation, flag the conflict instead of assuming the docs are correct.

## Engineering Principles
### Think Before Coding
- State assumptions explicitly.
- If multiple interpretations exist, present them briefly.
- Ask questions only when ambiguity materially affects implementation.
- Prefer the simplest explanation and simplest solution.
- Push back on unnecessary complexity.

### Simplicity First
- Implement only what was requested.
- Avoid premature abstractions.
- Prefer inline code over single-use helpers.
- Add configurability only when required.
- Add defensive handling only for realistic failure modes.
- Minimize moving parts.
- Ask: "Can this be simpler without losing correctness?"

### Surgical Changes
- Change only what is necessary.
- Match the surrounding style.
- Do not refactor unrelated code.
- Remove only code made unused by your changes.
- Mention unrelated issues separately instead of fixing them opportunistically.
- Every modified line should directly support the task.

### Goal-Driven Execution
- Establish clear verification criteria before changing code.
- For bug fixes: reproduce the issue, identify the minimal cause, implement the smallest reasonable fix, verify the fix, and stop.
- For features: define success criteria, implement minimally, verify behavior, and stop.
- Prefer concrete verification over assumptions.

## Release and Compatibility Rules
- Current package version is pre-1.0.0. Until version 1.0.0 is released, backward compatibility is not required by default.
- Pre-1.0.0 breaking changes are allowed when they simplify the architecture, remove stale contracts, or align frontend behavior with backend/shared contracts.
- Even before 1.0.0, document contract impact and coordinate changes that affect Symfony APIs, `@selfhelp/shared`, mobile clients, persisted CMS content, or public URLs.
- After version 1.0.0, preserve backward compatibility unless explicitly told otherwise.
- Post-1.0.0 breaking changes require explicit approval and migration notes.

## Tech Stack
- Next.js 16 App Router, React 19, TypeScript strict mode.
- Mantine 9 is the primary UI library.
- Tailwind CSS 4 is used for utility styling and dynamic CMS classes.
- TanStack React Query 5 handles server state and SSR hydration.
- Zustand handles small client-only state.
- Refine is used narrowly for auth/routing/admin resources.
- Axios talks to the Next.js BFF at `/api`.
- npm is the active package manager (`package-lock.json`, `packageManager: npm@11.12.1`).

## Repository Structure
- `src/app`: App Router routes, layouts, BFF routes, public slug route, admin routes.
- `src/app/api`: Next.js BFF routes. Catch-all proxy is `src/app/api/[...path]/route.ts`.
- `src/app/components/cms`: Admin CMS components by feature.
- `src/app/components/frontend`: Public rendering components, layout, and dynamic style components.
- `src/app/components/shared`: Shared auth, common UI, mentions, and links.
- `src/api`: Browser API clients. Use domain files and `permissionAwareApiClient`.
- `src/hooks`: React Query hooks and mutation hooks.
- `src/config`: API, routes, cookies, React Query, server-only config, debug config.
- `src/providers`: Server/client providers, QueryClient factory, Refine auth provider.
- `src/types`: Request/response/style/auth/navigation types.
- `src/utils`: Sanitization, auth cookies, permissions, navigation, debug, mutation errors.
- `src/shared`: Bridge re-exports from `@selfhelp/shared`.

## Architecture Rules
- Default to Server Components. Add `'use client'` only for state, effects, browser APIs, events, Mantine components requiring client-side interactivity, Refine, React Query, or other client-only hooks.
- Browser API traffic must go through `/api/*`; do not call Symfony directly from browser code.
- Server Components use helpers in `src/app/_lib/server-fetch.ts` to call Symfony directly.
- JWTs are stored only in httpOnly cookies managed by the BFF.
- Public pages are fetched by keyword, not by id.
- Admin page/section editing is id-driven where backend contracts require ids.
- React Query owns server data. Zustand owns client-only UI state. nuqs owns URL state. Cookies own SSR-visible preferences such as language, preview mode, and color scheme.
- Refine is used for auth provider, router provider, and admin resources; do not replace admin UI with generic Refine CRUD without a clear reason.

## Server vs Client Boundary Rules
- Prefer Server Components by default.
- Do not convert Server Components to Client Components unless required.
- Avoid moving data fetching into client components without a clear reason.
- Keep the SSR-first public page architecture intact.
- Do not introduce client-side fetching for data already available during SSR.
- Be careful with hydration mismatches from random values, `Date` usage, `window` or `document` access, locale-sensitive rendering, and other non-deterministic output.
- Keep server-only utilities, secrets, Symfony internal URLs, and `src/config/server.config.ts` out of client bundles.

## Rendering Verification Rules
- Verify both server-rendered first paint and hydrated client behavior when changing routes, layouts, providers, CMS rendering, data fetching, or auth gates.
- Server rendering should stay fast, visible, and useful before hydration; do not regress SSR prefetch, metadata, header/footer rendering, or public page visibility.
- Hydrated client behavior should remain highly responsive for language switching, preview mode, admin editing, forms, mutations, drag/drop, and navigation.
- Avoid duplicate SSR and client network requests; React Query hydration keys must match the client hooks that consume prefetched data.
- Check loading, empty, and error states on both initial server render and client-side transitions.
- Keep watching for hydration mismatches from client-only APIs, random values, dates, locale-sensitive formatting, or non-deterministic render output.
- For public rendering changes, verify page content appears on first paint and remains interactive after hydration.
- For admin rendering changes, verify SSR prefetch and permission gates do not create a blank shell, stale permissions, or sluggish editing flows.

## Rendering Strategy Rules
- SelfHelp uses a hybrid SSR-first rendering model, not pure SSR and not pure CSR.
- Public CMS routes must stay SSR-first: resolve language, preview mode, metadata, navigation, and page content on the server when possible.
- Keep `src/app/[[...slug]]/layout.tsx` and `src/app/[[...slug]]/page.tsx` as Server Components unless there is explicit approval to change the rendering model.
- Use Client Components for interactive islands: forms, auth widgets, language/theme controls, preview controls, drag/drop, rich editors, Refine, Zustand, React Query hooks, and browser APIs.
- Do not move SSR-prefetched data into client-only fetching unless there is a clear reason.
- Server Components should use `src/app/_lib/server-fetch.ts`; browser code should use `/api` through existing API clients.
- React Query query keys used by SSR prefetch and client hooks must match exactly.
- Public CMS style components with hooks or browser APIs must stay behind a client boundary.
- Admin screens may be client-heavy, but admin auth gating and shared prefetch should remain server-side.
- Treat interactive CMS/admin widgets as islands inside server-rendered shells; do not rewrite the app around a new islands framework.

## BFF Rules
- The Next.js BFF is the security boundary for browser API traffic.
- Browser API code must use `/api/*`; do not bypass the existing proxy/auth flows.
- Browser code may use the public backend base URL only for assets when existing utilities already do so.
- Cookie management, auth refresh, CSRF handling, proxying, token stripping, impersonation routing, and streaming auth events belong in the BFF layer.
- Keep auth logic centralized in the BFF routes, `src/proxy.ts`, `src/api/base.api.ts`, and `src/providers/auth.provider.ts`.

## React Query Rules
- Prefer SSR prefetch plus hydration for CMS/admin data where the existing architecture already does this.
- Avoid duplicate fetching between Server Components and client hooks.
- Reuse existing query keys and cache tiers from `REACT_QUERY_CONFIG`.
- Avoid `useEffect` data fetching when React Query or Server Components already own the data.
- Use optimistic updates only where existing flows already support them safely.
- Prefer targeted invalidation over refetch-all patterns.
- Check `staleTime` and `gcTime` implications before changing caching behavior.

## Performance Rules
- Be careful with recursive CMS rendering and deeply nested sections.
- Avoid unnecessary client boundaries in large render trees.
- Avoid creating new object/function props unnecessarily in heavily repeated CMS components.
- Prefer server rendering for expensive data preparation.
- Lazy-load heavy admin-only components where appropriate.
- Check bundle impact before adding dependencies.
- Preserve streaming, Suspense, SSR prefetch, and hydration behavior where already implemented.

## Admin vs Public Rules
- Keep public frontend rendering logic separate from admin CMS logic.
- Avoid importing heavy admin dependencies into public rendering paths.
- Public pages prioritize SSR/render performance and hydration stability.
- Admin pages prioritize editing workflows, permissions, and reliable mutation behavior.

## CMS Rendering Rules
- Preserve recursive section rendering behavior unless intentionally changing frontend rendering.
- Preserve field extraction, interpolation, condition, and localization behavior.
- Do not change dynamic style registration casually.
- Keep frontend style registration aligned with backend style definitions and `@selfhelp/shared` where applicable.
- Be careful with dynamic Tailwind class generation, mobile class prefixing, and HTML sanitization.
- Unknown or unsupported CMS styles should continue to render through the existing `UnknownStyle` path.

## Accessibility Rules
- Treat accessibility as a default requirement for all public and admin UI work, not as an optional follow-up.
- Prefer semantic HTML first; use the correct native element before adding ARIA roles or custom keyboard behavior.
- Every interactive control must have an accessible name through visible text, `aria-label`, `aria-labelledby`, or an equivalent native label.
- Inputs, selects, textareas, switches, radios, checkboxes, and comboboxes must have programmatic labels and associate validation/help text with `aria-describedby` when needed.
- Icon-only buttons and action-only controls must include explicit accessible labels.
- Preserve full keyboard support: logical tab order, visible focus states, no keyboard traps, and Enter/Space behavior that matches the control type.
- Do not use clickable `div` or `span` elements when a `button`, `a`, `input`, or other semantic element is appropriate.
- Use `a`/`Link` for navigation and `button` for in-place actions; do not mix their behavior.
- Keep headings hierarchical and meaningful so screen-reader navigation reflects the page structure.
- Images must use meaningful `alt` text when informative and empty `alt=""` when purely decorative.
- Audio, video, and animation features must avoid inaccessible autoplay behavior and must not hide essential content behind motion alone.
- Respect reduced-motion preferences for non-essential animation and avoid interactions that depend on drag-only, hover-only, color-only, or pointer-only input.
- Ensure status, loading, validation, and error messages are announced appropriately with semantic markup or ARIA live regions when the change is not otherwise obvious.
- Modals, drawers, menus, popovers, and drag/drop tooling must manage focus correctly when opened, used, and closed.
- Do not hide critical text in placeholders alone; placeholders are supplementary, not labels.
- Maintain sufficient color contrast and do not rely on color alone to communicate state, meaning, or validation.
- Keep touch targets reasonably large and spaced for users with limited precision.
- Sanitize and render CMS HTML in ways that preserve accessibility semantics instead of stripping necessary structure without a reason.
- When using Mantine, prefer its accessible primitives and preserve their labeling, focus, and keyboard patterns when customizing.
- For custom composite widgets, follow established WAI-ARIA authoring patterns only when native elements cannot satisfy the requirement.
- Verify accessibility on both SSR first paint and hydrated client behavior so labels, focus management, and announcements remain correct after hydration.

## Coding Style
- Add the two-line MPL-2.0 SPDX header to TS/TSX/JS files.
- Use TypeScript. Prefer precise types and interfaces; avoid adding new `any`.
- Existing convention: interfaces start with `I`, types start with `T`.
- Components are usually PascalCase files inside kebab-case feature folders, with `index.ts` exports where already used.
- Prefer small, focused components in separate files when practical.
- Extract reusable UI, hooks, and helpers when the same behavior is needed in more than one place, but keep one-off code local until reuse is real.
- Use functional React components and hooks.
- Use Mantine components first, Tailwind for layout/utilities/dynamic CMS classes, and CSS modules for component-specific custom CSS.
- Keep imports consistent with nearby files. The code mostly uses relative imports; confirm aliases before introducing `@/...`.
- Use `@tabler/icons-react` for icons because that is the installed icon set.

## Modal Rules
- **Always use the shared `ModalWrapper`** from
  `src/app/components/shared/common/CustomModal/CustomModal.tsx` for
  every modal in the admin UI. Do not build new modals on top of raw
  `Mantine.Modal` — `ModalWrapper` already wires the standard header,
  scrollable body, save/update/delete/cancel buttons, loading state,
  and styling.
- If you need a fully custom footer, pass a `customActions` slot to
  `ModalWrapper`; do not fall back to a raw Modal just because of one
  button.
- Confirmation/destructive dialogs (purge, force delete) use
  `ModalWrapper` with `onDelete` + the `deleteLabel` prop and a red
  alert in the body — see `PluginsPage` purge modal and
  `DeleteUserModal` for the canonical patterns.
- Form modals (Add/Edit) use `onSave`/`onUpdate` and pass
  `isLoading={mutation.isPending}` so the primary button shows the
  loader during submission.

## Plugin Registry Rules
- The host ships with `humdek-public` (https://humdek-unibe-ch.github.io/sh2-plugin-registry/)
  as the seeded default plugin source. The UI marks it with a lock
  icon, hides destructive actions, and only allows toggling the
  `Enabled` switch.
- Treat `IAdminPluginSource.isSystem === true` as the only signal a
  source row is host-managed; never hard-code the `humdek-public`
  name in UI logic — additional system sources may be added later.
- When the user opens `Admin → Plugins → Available`, the host calls
  `/cms-api/v1/admin/plugins/available`. That endpoint walks every
  enabled `PluginSource` server-side, so no extra logic is needed
  client-side beyond rendering the `AvailablePluginsPanel`.

## Type Safety Rules
- Prefer narrowing and explicit typing over assertions.
- Avoid introducing `any`, double-casts, or unsafe non-null assertions.
- Reuse shared types from `@selfhelp/shared` where possible.
- Keep API response and request types aligned with backend schemas.
- Do not create nearly identical interfaces until existing types have been checked.

## Existing Patterns First
Before creating new hooks, API clients, providers, Zustand stores, utilities, query keys, layout wrappers, form abstractions, table abstractions, or CMS style systems, inspect whether the repository already has an established implementation pattern.

## Modernization Rules
- Do not rewrite existing patterns only for architectural purity.
- Do not replace working hooks, services, components, or providers with new abstractions without a clear reason.
- Prefer consistency with nearby code over introducing newer trends.
- Large refactors require explicit approval.

## AI Agent Rules
- Inspect current code before changing anything. Prefer source over stale docs.
- Keep changes small and focused.
- Check whether a component, hook, API method, type, or utility already exists before creating one.
- Do not duplicate logic across folders.
- Do not introduce new dependencies without a clear reason.
- Do not change public API contracts without documenting impact.
- Never commit, push, or stage changes unless explicitly asked.
- Do not run `npm run dev` if a dev server is already running.
- Do not expose `.env` values, tokens, cookies, or secrets.

## Multi-Repository Changes
- When implementing features that affect multiple repositories, read the `AGENTS.md` of every affected repository.
- Follow repository-specific rules even when they differ.
- Keep changes isolated to the repository being modified.
- Do not apply conventions from one repository to another unless explicitly documented.
## Multi-Repository Changes

- When implementing features that affect multiple repositories, read the `AGENTS.md` of every affected repository.
- Follow repository-specific rules even when they differ.
- Keep changes isolated to the repository being modified.
- Do not apply conventions from one repository to another unless explicitly documented.

### Repository roles

Plugin-related work may affect:

- This repository.
- Symfony backend repository: `sh-selfhelp_backend`.
- Shared package repository: `sh-selfhelp_shared`.
- Expo mobile app repository: `sh-selfhelp_mobile`.
- Affected plugin repositories, usually under a local `plugins/` workspace directory.

Repository locations are environment-specific.

Do not assume absolute paths such as `D:\...`.

Discover repositories from:

- the current workspace
- sibling directories
- explicitly provided user paths
- local developer configuration files

### Canonical multi-repo rule

The canonical Multi-Repository AGENTS.md Rule lives in the backend repository at:

```text
docs/plugins/multi-repo-agents-md.md
```

If the backend repository is available, read that document before making plugin-related multi-repository changes.

If it is not available, continue with the rules in this `AGENTS.md` and clearly state that the canonical multi-repo document was not found.

### Required-before-coding checklist

- [ ] Identify all repositories affected by role.
- [ ] Locate each repository in the current environment.
- [ ] Read `AGENTS.md` in each affected repository.
- [ ] Read the canonical multi-repo rule if available.
- [ ] Summarize relevant rules per repository.
- [ ] Confirm planned file changes per repository.
- [ ] Apply changes repo-by-repo.
- [ ] Run validation commands from the matching repository.
- [ ] Do not mix backend, frontend, shared, mobile, and plugin rules.

## Plugin Ecosystem Rules (frontend side)

This repo hosts the runtime + admin UI for the SelfHelp plugin ecosystem. Plugins ship their own npm package (`@<vendor>/<plugin-id>`); the frontend loads them through `PluginRuntime` at boot.

### Extension points only

The frontend dispatcher must remain extensible without being patched per plugin:

- The `STYLE_REGISTRY` in `@selfhelp/shared/registry` is the runtime-extensible style catalog. Adding a plugin style means the plugin calls `extendStyleRegistry(...)` from `@selfhelp/shared/plugin-sdk` at registration time, not by editing this repo.
- `src/app/components/frontend/styles/BasicStyle.tsx` is a dispatcher seeded with core styles and a `styleImpls` map populated by `PluginRuntime`. Do not hardcode plugin styles in the switch.
- Plugin admin pages mount under `/admin/plugins-host/{pluginId}/...` through a dynamic admin route shell. Do not introduce static admin pages for plugin features.
- The host's Plugins admin lives under `/admin/plugins` and `/admin/plugins/{pluginId}` and is part of this repo (not contributed by any plugin).

### No polling in plugin-related UI

Plugin operation progress, dashboards, chat, notifications, collaborative editing, file uploads, and job progress must subscribe to Mercure topics via the new `usePluginRealtime(pluginId, topic, topicParams)` hook exposed by `@selfhelp/shared/plugin-sdk`. Polling for these signals is forbidden. Polling is allowed only for:

- Initial bootstrap (one-shot manifest fetch + lookup fetch).
- Emergency compatibility mode when Mercure is explicitly disabled per-instance.

The `plugin-runtime-check.yml` GitHub Actions workflow flags new polling code paths.

### Plugin runtime files

- `src/app/components/frontend/plugin-runtime/PluginRuntime.ts` — runtime that imports each installed plugin's npm package and calls its `register(api)`. Records `versionWarnings` on the snapshot for every plugin it could not mount (api-version mismatch, npm-package version mismatch, import / register failure).
- `src/app/components/frontend/plugin-runtime/PluginsProvider.tsx` — context provider that exposes `IPluginApi` to plugin components and tracks feature flags + manifest. Also exposes `usePluginVersionWarnings()` for the banner.
- `src/app/components/cms/plugins/plugin-version-mismatch-banner/PluginVersionMismatchBanner.tsx` — admin-visible alert that surfaces the runtime warnings on `/admin/plugins`. The mobile counterpart lives at `components/plugin-runtime/PluginVersionMismatchBanner.tsx` in the mobile repo.
- `src/app/admin/plugins/page.tsx` and `src/app/admin/plugins/[pluginId]/page.tsx` — host Plugins admin (overview + detail tabs).
- `src/app/admin/plugins-host/[pluginId]/[slug]/page.tsx` — dynamic shell that mounts plugin-supplied admin React subtrees.
- `src/app/api/plugins/events/route.ts` — BFF SSE proxy that multiplexes the user's plugin Mercure topics over one same-origin connection.
- `scripts/plugins-sync.mjs` — reads `selfhelp.plugins.lock.json`, updates `package.json` dependencies, and runs `pnpm install --filter` per plugin. It does NOT emit a static `registered.ts`; the runtime uses `import(/* webpackIgnore: true */ packageName)` and discovers plugins purely from the live manifest (`GET /cms-api/v1/plugins/manifest`).

### Host singleton peerDependencies

Plugin npm packages must declare these as `peerDependencies`, never as `dependencies`:

- `react`
- `react-dom`
- `next`
- `@mantine/core`
- `@mantine/hooks`
- `@tanstack/react-query`
- `@selfhelp/shared`

CI runs `npm ls react`, `npm ls react-dom`, `npm ls @tanstack/react-query`, `npm ls @mantine/core` and fails if any returns more than one version. This prevents the "two React copies" plugin failure mode.

### Lookup-driven enums

All enum-like values consumed by frontend code (status badges, scope selectors, channel pickers, etc.) come from the lookups API. Do not hardcode enum string unions in plugin-related UI components; pull them through the existing lookup hook.

### Plugin version semantics (for UI badges)

- **patch** — code change only, no DB change.
- **minor** — always carries a DB change.
- **major** — breaking change.

The "Update available" badge and the "Update warnings" tooltip in `/admin/plugins` derive their copy from this rule plus the registry's `breaking` flag.

### Plugin SDK boundary

The only file plugins should import from the SelfHelp side is `@selfhelp/shared/plugin-sdk`. Do not export new frontend APIs to plugins through ad-hoc paths — extend the SDK in `sh-selfhelp_shared` and depend on it from this repo.

## AI Change Response Expectations
When making changes, mention the relevant impact on:
- Release compatibility, especially whether a change is pre-1.0.0 cleanup or post-1.0.0 breaking behavior.
- Accessibility, including semantic structure, keyboard support, focus management, labels, and screen-reader behavior for affected UI.
- SSR/client boundaries.
- Server-rendered first paint and hydrated client responsiveness.
- React Query keys, cache tiers, invalidation, or hydration.
- BFF, auth, cookies, CSRF, or permissions.
- Affected hooks, types, API contracts, and shared contracts.
- Required backend coordination, if any.

## Security Rules
- Browser code must never read or store JWTs.
- Auth cookies: `sh_auth`, `sh_refresh`, and `sh_impersonate` are httpOnly.
- Browser-readable cookies are limited to non-secret UI/support values such as `sh_csrf`, `sh_lang`, `sh_accept_locale`, color scheme, preview, and impersonation target email.
- Unsafe browser requests rely on CSRF double-submit: `sh_csrf` cookie plus `X-CSRF-Token` header from Axios.
- Do not import `src/config/server.config.ts` into client code.
- Do not add raw `Authorization` headers in browser API clients.
- Sanitize rendered HTML with `isomorphic-dompurify` utilities; do not import `dompurify` directly in components.
- Keep Symfony/internal URLs server-side except asset URL use.

## API Rules
- Add endpoints to `src/config/api.config.ts` as `{ route, permissions }`.
- For shared public endpoints, align with `@selfhelp/shared` first.
- Use `permissionAwareApiClient` in domain API clients.
- `apiClient` is the raw Axios instance and should only be used for special internal cases.
- Browser Axios base URL is `/api`.
- Standard API data is wrapped in the Symfony envelope: `status`, `message`, `error`, `logged_in`, `meta`, `data`.
- Non-JSON exceptions currently include the AI section prompt markdown endpoint and the `/api/auth/events` SSE route.
- Query hooks should use `REACT_QUERY_CONFIG.QUERY_KEYS` and `CACHE_TIERS`.
- Use React Query `select` for data transformations when practical.
- Invalidate specific keys after mutations; avoid global invalidation.

## Database Rules
- This frontend repo has no database migrations.
- Backend owns schema, migrations, style/field catalogs, permissions, and API contracts.
- Frontend changes must stay aligned with backend JSON schemas and `@selfhelp/shared`.
- Content fields are translatable; property/config fields are not and usually save with language id 1.
- For new CMS style components, update types, exports, and `BasicStyle.tsx` registration; coordinate backend field/style definitions separately.

## Testing Rules
- Vitest is configured (jsdom + Testing Library + MSW). Run `npm test` (single run), `npm run test:watch`, or `npm run test:changed` (fast loop on git-changed files). Tests live next to code under `__tests__/`; shared helpers under `src/test-utils/`.
- Also use: `npm run tsc`, `npm run lint`, `npm run dead`, `npm run unused`, `npm run prune`, `npm run headers:check`.
- Do not claim tests passed unless you ran the relevant command.
- Add focused tests only if the project adds or already has a matching test setup.

### Canonical Testing Rules (all SelfHelp repos)

These are the canonical SelfHelp testing policy, shared verbatim across the backend, frontend, shared package, mobile app, and every plugin repo. They describe the target conventions. The frontend Vitest toolchain (Vitest + Testing Library + MSW, Slice 6) and Playwright E2E (Slice 7, `npm run test:e2e` / `npm run test:golden`, specs under `e2e/`) are configured. A rule applies as soon as the tooling it references exists in this repo.

1. Every new feature ships with at least one automated test at the appropriate layer (unit / integration / contract / E2E).
2. Every bug fix ships with a regression test that fails before the fix and passes after.
3. Every new API endpoint ships with a JSON-schema contract test **and** a permission-matrix test (admin/editor/user/guest + at least one negative cross-scope case).
4. Every new CMS style, action type, scheduled-job type, plugin event subscriber, or plugin realtime topic ships with an integration test for registration → use → cleanup.
5. Every new business workflow extends a golden-workflow test in `tests/Golden/` (backend) and, where a UI is involved, `e2e/golden/` (frontend / mobile).
6. Before writing or changing a test, perform a short **test impact analysis**: which workflow can break, which services/controllers/screens/plugin contracts are touched, which existing tests should fail, which new regression test is needed. Tests existing only to inflate coverage are rejected.
7. Tests do not depend on developer credentials. Use the seeded `qa.admin/editor/user/guest@selfhelp.test` personas.
8. QA fixtures use the production permission model. Seed test users through the same `Lookup userStatus/userTypes`, `Group`, `Role`, and `rel_groups_users` entities that production `src/Command/CreateAdminUserCommand.php` uses. Special permissions go through normal admin/domain services, never raw SQL.
9. All test data writes use the `qa.` / `qa-` / `qa_` prefix. Tests never create/update/delete non-QA business records. Read-only access to system baselines (languages, permissions, styles, lookups, plugin metadata, role/group/page-type) is allowed.
10. Tests self-clean (DAMA transaction rollback or an explicit `afterEach`). Integration/golden tests pass the `QaCleanupVerifier` (or the per-repo equivalent).
11. Do not mock domain behaviour in integration/golden tests. Unit tests may use deterministic test doubles but must not hide real business logic. Mock external dependencies (network, time, filesystem) at the boundary only.
12. Date/time tests use `Symfony\Bridge\PhpUnit\ClockMock` (PHP), `vi.useFakeTimers()` (Vitest), or `page.clock.install()` (Playwright).
13. Mercure events are verified via `MercureTestRecorder` (backend) or `mockMercureHub` (shared); never by polling.
14. Anti-flakiness: no `sleep()`, no external internet, no random IDs in fixtures or assertions, no order-dependent tests, no developer-machine absolute paths.
15. The full suite passes in random order. `composer test:random` (or the per-repo equivalent) runs nightly.
16. Test names describe business behaviour, not the method under test (e.g. `testFinishedFormSubmissionSchedulesAndExecutesActionEmailJob`, not `testSubmit`).
17. Prefer asserting public/domain-visible effects (API response, admin API view of scheduled jobs, Mercure event, rendered page) before internal implementation details. DB/queue assertions are secondary or a fallback.
18. Snapshot updates (Vitest, Playwright screenshots, response fixtures) must be intentional: the change is expected, the PR explains why, and a reviewer can compare before/after. Never run `--update-snapshots` just to make CI green.
19. Performance: any test slower than 10s is `@group golden` under `tests/Golden/` (or the per-repo golden area). PR-tier suites complete in under 10 minutes per repo.
20. Coverage gates: ≥ 70% line on `src/Service/**` + `src/Controller/**` (backend); ≥ 60% on new files (other repos). PRs dropping coverage by > 1% on changed files are blocked.
21. Use the standard test commands defined in this repo's Build / Dev Commands section. Never invent new test command names.
22. Tests assert **meaningful behaviour**, not just status codes. At minimum: status + envelope shape + key returned fields + one public side effect.
23. **Do not change production logic to make tests pass.** If a test reveals a production issue, fix the production code and explain in the PR. If the test expectation is wrong, fix the test.
24. **Smallest runnable proof**: after every 1–3 file changes, run `test:changed` (or the single new test file). Do not extend a slice while its current state is red for an unknown reason.
25. **Contract tests for FE/mobile/plugin-consumed responses**: every API response field consumed by frontend, mobile, or plugin code must exist in a JSON Schema under `config/schemas/api/v1/` plus a TypeScript type in `@selfhelp/shared`. Schema drift fails CI. Consumers must not depend on undocumented response fields.
26. **Negative-permission tests are mandatory** for every permission-sensitive endpoint: allowed user → success; lower-privileged user → 403; unauthenticated user → 401; cross-scope/group user → 403 or 404 per the established access rule.
27. **Security regression tests** are required for any change to authentication, authorization, CSRF, JWT issuance/refresh/revocation, logout/session invalidation, plugin trust level or capabilities, or ACL cache invalidation. Security tests assert failure behaviour, not only success.
28. **API backward compatibility**: do not remove or rename a response field without (a) a schema version bump, (b) a shared TS type update, (c) frontend/mobile/plugin adaptation in the same PR, and (d) a changelog entry.
29. **Performance budgets** for critical APIs are asserted in smoke/golden tests: login < 500 ms, admin pages list < 1000 ms, form submit < 1000 ms in the test env. Regressions above 2× the budget block PRs; 1.5×–2× warns. The single source for these numbers is `e2e/utils/perf.ts` (`PERF_BUDGETS` + the `measure` wrapper) — kept under `e2e/utils/` alongside every other e2e helper (`a11y.ts`, `targets.ts`, `loginAs.ts`, `env.ts`), **not** the plan's suggested `e2e/support/perfBudget.ts`, so all e2e helpers stay in one directory. The backend mirror is `tests/Support/PerfBudget.php` (with `Timing` aliasing it); do not redefine the numbers anywhere else.
30. **No real outbound** in tests: tests never send real email/SMS/push/webhooks/external HTTP. Use `RecordingNotifier`, MSW, or a mocked HTTP client, and assert the content of the captured message.
31. **Environment isolation**: test reset commands refuse to run unless `APP_ENV=test`, the database name contains `_test`, the host is in the allow-list, and `--force` is provided. Reset prints the target database name before destroying it.
32. **Fixture version**: `QaBaselineFixture` exposes `QA_FIXTURE_VERSION`; smoke tests print and assert it. Stale fixtures fail fast with a clear message.
33. **CI failure artifacts**: CI uploads PHPUnit logs, coverage report, Playwright traces/videos/screenshots, docker container logs, and a sanitized test DB dump for failed golden tests.
34. **Accessibility checks** for Playwright golden specs use axe-core on the login page, admin page editor, public form page, and plugin admin page.

### Frontend-specific testing additions

- CMS style components: a Vitest render test under `src/app/components/frontend/styles/__tests__/`.
- Admin screens: a Playwright spec under `e2e/admin/`; if the screen drives a workflow, also extend `e2e/golden/`.
- React Query hooks: assert query keys, stale times, invalidation, and the BFF route via a Vitest test next to the hook. Mock the network with MSW only — never hit a real backend from a unit test.
- Test utilities live under `src/test-utils/` (`renderWithProviders`, `msw/createHandlers`, `msw/server`, `setup`). MSW handlers are **inline by design**: `createHandlers.ts` builds responses programmatically with `apiEnvelope<T>()`, which mirrors the backend `ApiResponseFormatter` shape (`status`/`message`/`error`/`logged_in`/`meta`/`data`). There is intentionally **no** `src/test-utils/snapshots/` directory of committed backend JSON — keeping the envelope in one typed builder avoids snapshot drift and a second source of truth. If a test needs a specific payload it passes a custom handler via `server.use(...)`; response **shape** is guarded by the schema-parity check (rule 25), not by stored fixtures.
- Accessibility (rule 34): `e2e/a11y/a11y.spec.ts` runs axe-core (`e2e/utils/a11y.ts`, fails on `serious`/`critical` WCAG A/AA) on the login page, public form page, admin page editor, and plugin admin page. Each surface is env-gated and skips cleanly when its part of the QA stack is absent.
- Visual regression (Slice 11): `e2e/visual/visual.spec.ts` screenshots 3 public + 3 admin pages + the SurveyJS runtime via `toHaveScreenshot` (targets in `e2e/utils/targets.ts`, env-overridable). Screenshot baselines are **Linux** (CI) and are refreshed ONLY through the labelled `visual-snapshots` workflow (PR label `update-snapshots`) or `workflow_dispatch mode=update` — never by committing `--update-snapshots` output from a Windows/macOS machine (rule 18).
- **Coverage gate state (rule 20):** frontend coverage is **advisory / non-blocking** today. `vitest.config.ts` declares an istanbul `coverage` block (reporters `text-summary`/`html`/`lcov`) with **no `thresholds`**, so `npm run test:coverage` never fails on a coverage number. Only `@selfhelp/shared` ships a **blocking** coverage gate; the frontend "≥ 60% on new files / no > 1% regression" target in rule 20 is intentionally **staged** — promote it to a blocking job (add `coverage.thresholds`) only in a dedicated reviewed PR once the baseline clears the target, so it ratchets up rather than blocking every merge. Until then, generate reports on demand and do not let changed-file coverage regress. (Mirrors the backend's staged stance — see the host `docs/developer/15-testing-guidelines.md` "Coverage gates".)
- Lighthouse (`lighthouserc.json` + `.github/workflows/lighthouse.yml`) is **warning-only**: every assertion is level `warn` and the step is `continue-on-error`. Promote a metric to a hard gate only in a dedicated reviewed PR once the baseline clears target.
- Standard frontend test commands: `npm test`, `npm run test:watch`, `npm run test:changed` (fast loop), `npm run test:e2e`, `npm run test:golden`, `npm run test:a11y`, `npm run test:visual`, `npm run test:visual:update` (regenerate visual baselines — CI/Linux only). Do not invent new names.

## Build / Dev Commands
- `npm install`: install dependencies.
- `npm run dev`: start Next dev server with Turbo.
- `npm run dev:fast`: start dev server on port 3000.
- `npm run build`: production build.
- `npm run start`: start built app.
- `npm test`: Vitest unit/component tests (single run).
- `npm run test:watch`: Vitest in watch mode.
- `npm run test:changed`: Vitest on git-changed files (fast loop).
- `npm run test:e2e`: Playwright E2E (specs under `e2e/`; needs a running stack + `BASE_URL`).
- `npm run test:golden`: Playwright golden workflow specs (`e2e/golden/`).
- `npm run test:a11y`: Playwright axe-core accessibility specs (`e2e/a11y/`; needs a running stack).
- `npm run test:visual`: Playwright visual-regression specs (`e2e/visual/`; diffs against committed Linux baselines).
- `npm run test:visual:update`: regenerate visual baselines (run in CI/Linux via the `visual-snapshots` workflow, not locally).
- `npm run tsc`: TypeScript check.
- `npm run lint`: ESLint.
- `npm run lint:fix`: ESLint autofix.
- `npm run dead`: Knip unused/dead code check.
- `npm run unused`: ts-unused-exports.
- `npm run prune`: ts-prune.
- `npm run headers:check|add|remove`: SPDX header tooling.

## Common Tasks
- Add an API feature: update `api.config.ts`, add/extend a domain API file under `src/api`, add request/response types, add a React Query hook, and invalidate precise keys after mutations.
- Add an admin screen: create route under `src/app/admin`, wrap with `AdminShell`, place UI under `src/app/components/cms/<feature>`, use existing hooks and permission helpers.
- Add a public CMS style: create the style component under `src/app/components/frontend/styles`, export it from `SelfHelpStyles.ts`, add its case to `BasicStyle.tsx`, update style types, and keep backend field definitions aligned.
- Add shared UI: place cross-context pieces under `src/app/components/shared`; place CMS-only shared pieces under `src/app/components/cms/shared`.
- Update docs: update the current architecture docs when changing SSR/BFF/cache/auth behavior.

## Do Not Do
- Do not store tokens in localStorage/sessionStorage.
- Do not bypass the BFF from browser code.
- Do not import server-only config into client files.
- Do not add broad `queryClient.invalidateQueries()` calls.
- Do not add duplicate components or nearly identical types.
- Do not rely on stale docs when current source disagrees.
- Do not add a new `/api/*` route just to transform a Symfony response unless it needs BFF-only behavior such as cookies, CSRF, or streaming.
