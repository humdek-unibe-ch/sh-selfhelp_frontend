# Migration to `@selfhelp/shared` — COMPLETED 2026-05-06

The `@selfhelp/shared` package is installed via `file:../sh-selfhelp_shared` and re-exported from `src/shared`. Both apps (this frontend and the new `sh-selfhelp_mobile` Expo app) consume the same types and helpers.

## Status

| Step                                                              | Status      | Notes |
| ----------------------------------------------------------------- | ----------- | ----- |
| Install `@selfhelp/shared` via `file:` dep                        | DONE        | `package.json -> dependencies`. |
| Bridge `src/shared/index.ts` re-exports                            | DONE        | `STYLE_REGISTRY`, `ENDPOINTS`, theme tables, helpers all re-exported. |
| `IContentField` migrated to shared                                 | DONE        | `src/types/common/styles.types.ts` re-exports the shared shape. |
| **Mantine common types migrated to shared**                        | **DONE**    | `src/types/mantine/common.types.ts` is now a thin shim re-exporting `TMantine*` from shared. Local-only `IMantine*Data` interfaces and `*Alias` types stay in-tree. |
| **All ~80 per-style interfaces migrated to shared**                | **DONE**    | `IButtonStyle`, `IProfileStyle`, `IAccordionStyle`, … all re-exported from shared. Three frontend-only legacy styles (`IRefContainerStyle`, `IDataContainerStyle`, `IVersionStyle`) stay in-tree as they're admin-only and never reach mobile. |
| **`IBaseStyle` overrides `fields` as `Record<…, IContentField<any>>`** | **DONE** | Local override keeps legacy admin code (`style.fields.foo.content`) compiling without explicit casts. Mobile uses the strict shared `IBaseStyle` (`<unknown>`). |
| **`TStyle` discriminated union sourced from shared interfaces**    | **DONE**    | The local `TStyle` reflects the same union, plus the three legacy admin styles. |
| **`API_CONFIG.ENDPOINTS` route-string alignment**                  | **DONE**    | `SHARED_ROUTE_ALIGNMENT` exported alongside `API_CONFIG`. Public routes verified to match shared `ENDPOINTS` (modulo `/cms-api/v1` prefix that the BFF prepends). New public endpoints MUST be added to shared first. |
| `STYLE_REGISTRY` consumed by `BasicStyle`                          | OPEN        | Frontend dispatcher still uses a local `switch`. Mobile already enforces registry-vs-impl parity via `Record<TStyleRegistryKey, …>`. The frontend can adopt the same pattern in a follow-up; tracked here for visibility but not blocking — the type-drift loop is closed by the per-style interface migration above. |
| `replaceCalcedValues` / `evaluateCondition` / `resolveAssetUrl`    | AVAILABLE   | Importable today via `src/shared`; mobile is the only current consumer. |

## Why

- Type drift between web and mobile is the #1 risk for a CMS-driven app.
- One source of truth for the **style registry**, **per-style interfaces**, **JSON-Logic conditions**, **`{{field}}` interpolation**, **API endpoints**, and **Mantine token tables**.
- A new style is added in `sh-selfhelp_shared` once; both apps fail to compile until they implement it. Mobile already uses `Record<TStyleRegistryKey, TStyleComponent>` so the constraint is mechanically enforced.

## What is shared right now

| Area                       | Shared module                                    |
| -------------------------- | ------------------------------------------------ |
| Per-style interfaces       | `@selfhelp/shared` (`IButtonStyle`, …)           |
| `TStyleName` union         | `@selfhelp/shared`                               |
| `STYLE_REGISTRY`           | `@selfhelp/shared/registry`                      |
| `IPageContent` / sections  | `@selfhelp/shared`                               |
| API envelopes              | `@selfhelp/shared`                               |
| `/cms-api/v1/*` endpoints  | `@selfhelp/shared` (`ENDPOINTS`)                 |
| Mantine semantic types     | `@selfhelp/shared`                               |
| Token tables (px, scales)  | `@selfhelp/shared/theme`                         |
| Tailwind preset            | `@selfhelp/shared/tailwind`                      |
| `replaceCalcedValues`      | `@selfhelp/shared`                               |
| `evaluateCondition`        | `@selfhelp/shared`                               |
| CMS class allow-list       | `@selfhelp/shared` (mobile-only consumer for now) |
| `resolveAssetUrl`          | `@selfhelp/shared`                               |

## How to add a new shared type

1. Add the definition in `sh-selfhelp_shared/src/types/styles/<group>.ts` (or wherever it belongs).
2. If it's a new style, also add it to `sh-selfhelp_shared/src/registry/styles.registry.ts`.
3. Build the shared package: `cd sh-selfhelp_shared && npm run build`.
4. Re-export from `src/types/common/styles.types.ts` in this repo.
5. Implement it in `sh-selfhelp_mobile/components/styles/<group>/` AND in this frontend's `src/app/components/frontend/styles/`.

The mobile app's typecheck will fail until you implement the new style — that's the whole point of the registry.

## What stays in-tree (frontend)

- Admin/CMS-only types (page editor, role manager, audit log, …) — these don't render on mobile.
- Refine-specific types and adapters.
- Next.js BFF proxy types.
- The three legacy admin-only styles (`refContainer`, `dataContainer`, `version`).
- `*Alias` Mantine types — kept for back-compat with old imports; safe to delete when no consumer remains.

## Don't

- Don't fork shared types here; if a field is missing, add it to `sh-selfhelp_shared`, rebuild, and re-import.
- Don't import directly from `@selfhelp/shared` everywhere — go through the relative `src/shared` bridge so we can swap implementations later (e.g. for Vitest mocks).

## Verification

- `npm run tsc` reports **0 errors**.
- `npm run build` (production Next.js + Turbopack) completes successfully and emits 22 routes.
- `npm run dev` starts and serves pages; `/auth/login` returns 200; the `/api/pages/language/3` proxy works.
- The migration introduced **0 new errors**. Two transient migration errors (`RegisterStyle.tsx` and `DebugWrapper.tsx`) were fixed inline. The 13 pre-existing admin-only TypeScript errors (Mantine v9 `Grid` prop rename `gutter`→`gap`, `getStartOfWeek` signature change, `MenuType` enum widening, `usePublicLanguages.refetch`, `Primitive[]` type narrowing in `ActionConfigBuilder`) were also fixed as part of this verification pass.
- Mobile typecheck passes clean. Mobile registry-parity smoke tests pass (9/9).

### Turbopack resolution fix (Windows)

Two changes were required to make Turbopack resolve `@selfhelp/shared` through the junction `node_modules/@selfhelp/shared` -> `../sh-selfhelp_shared`:

1. **`next.config.mjs`** declares the package for transpilation, raises the project root to the parent of the frontend (so Turbopack walks into the sibling `sh-selfhelp_shared` directory), and pins the same root for the file-tracing output:
   ```js
   transpilePackages: ['@selfhelp/shared'],
   outputFileTracingRoot: path.join(__dirname, '..'),
   turbopack: { root: path.join(__dirname, '..') },
   ```
2. **`sh-selfhelp_shared/package.json`** builds with `--no-splitting` so each entry (`index`, `registry`, `theme`, `tailwind`) is self-contained — Turbopack on Windows could not enumerate exports across tsup's empty side-effect chunks.

Both changes are required; either one alone is insufficient.
