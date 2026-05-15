# AGENTS.md

Before returning anything print in chat `AGENTS.md` so that we know the rules are used

## Project Overview
SelfHelp Frontend is a Next.js App Router application for the SelfHelp CMS. It renders public CMS pages and provides an admin CMS for pages, sections, users, roles, groups, assets, actions, cache, audit, data, languages, scheduled jobs, and page versions.

Read `docs/architecture/ssr-bff-architecture.md` first for current architecture. `architecture.md` is useful but partly historical.

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
- Default to Server Components. Add `'use client'` only for state, effects, browser APIs, events, Mantine interactive UI, Refine, React Query, or other client-only hooks.
- Browser API traffic must go through `/api/*`; do not call Symfony directly from browser code.
- Server Components use helpers in `src/app/_lib/server-fetch.ts` to call Symfony directly.
- JWTs are stored only in httpOnly cookies managed by the BFF.
- Public pages are fetched by keyword, not by id.
- Admin page/section editing is id-driven where backend contracts require ids.
- React Query owns server data. Zustand owns client-only UI state. nuqs owns URL state. Cookies own SSR-visible preferences such as language, preview mode, and color scheme.
- Refine is used for auth provider, router provider, and admin resources; do not replace admin UI with generic Refine CRUD without a clear reason.

## Coding Style
- Add the two-line MPL-2.0 SPDX header to TS/TSX/JS files.
- Use TypeScript. Prefer precise types and interfaces; avoid adding new `any`.
- Existing convention: interfaces start with `I`, types start with `T`.
- Components are usually PascalCase files inside kebab-case feature folders, with `index.ts` exports where already used.
- Use functional React components and hooks.
- Use Mantine components first, Tailwind for layout/utilities/dynamic CMS classes, and CSS modules for component-specific custom CSS.
- Keep imports consistent with nearby files. The code mostly uses relative imports; confirm aliases before introducing `@/...`.
- Use `@tabler/icons-react` for icons because that is the installed icon set.

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
- Do not store tokens in localStorage/sessionStorage
- Do not bypass the BFF from browser code.
- Do not import server-only config into client files.
- Do not add broad `queryClient.invalidateQueries()` calls.
- Do not add duplicate components or nearly identical types.
- Do not rely on stale docs when current source disagrees.
- Do not add a new `/api/*` route just to transform a Symfony response unless it needs BFF-only behavior such as cookies, CSRF, or streaming.
