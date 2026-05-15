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

## Coding Style
- Add the two-line MPL-2.0 SPDX header to TS/TSX/JS files.
- Use TypeScript. Prefer precise types and interfaces; avoid adding new `any`.
- Existing convention: interfaces start with `I`, types start with `T`.
- Components are usually PascalCase files inside kebab-case feature folders, with `index.ts` exports where already used.
- Use functional React components and hooks.
- Use Mantine components first, Tailwind for layout/utilities/dynamic CMS classes, and CSS modules for component-specific custom CSS.
- Keep imports consistent with nearby files. The code mostly uses relative imports; confirm aliases before introducing `@/...`.
- Use `@tabler/icons-react` for icons because that is the installed icon set.

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

## AI Change Response Expectations
When making changes, mention the relevant impact on:
- Release compatibility, especially whether a change is pre-1.0.0 cleanup or post-1.0.0 breaking behavior.
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
- No test runner or test script is currently configured.
- Use available checks: `npm run tsc`, `npm run lint`, `npm run dead`, `npm run unused`, `npm run prune`, `npm run headers:check`.
- Do not claim tests passed unless you ran the relevant command.
- Add focused tests only if the project adds or already has a matching test setup.

## Build / Dev Commands
- `npm install`: install dependencies.
- `npm run dev`: start Next dev server with Turbo.
- `npm run dev:fast`: start dev server on port 3000.
- `npm run build`: production build.
- `npm run start`: start built app.
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
