/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
# AI-Generated Sections — Prompt Flow & Authoring Guide

Audience: Developers and integrators.
Status: active.
Applies to: SelfHelp2 Next.js frontend.
Last verified: 2026-06-03.
Source of truth: Controllers, JSON schemas, route definitions, and exported types in this repository.

This folder is the **frontend-side companion** to the LLM workflow that
produces importable section JSON for SH-SelfHelp pages. The actual prompt
template lives on the backend; this README explains how the pieces fit
together, where the source of truth is, and how to keep generated content
mobile-friendly **and** portable across the planned native (react-expo)
renderer.

## Where the prompt actually lives

| Artefact                                              | Path                                                                       | Editable?            |
| ----------------------------------------------------- | -------------------------------------------------------------------------- | -------------------- |
| Hand-maintained prompt base                           | `sh-selfhelp_backend/docs/ai/prompt_template_base.md`                      | **Yes**              |
| Auto-rendered prompt (base + live style/field schema) | `sh-selfhelp_backend/docs/ai/ai_section_generation_prompt.md`              | No (regenerated)     |
| Live API endpoint serving the same prompt             | `GET /cms-api/v1/admin/ai/section-prompt-template`                         | n/a                  |
| Frontend examples (this folder)                       | `sh-selfhelp_frontend/docs/AI Prompts/generated examples/*.json`           | Yes (manual curation) |

The auto-rendered prompt is built from `prompt_template_base.md` plus the
live `StyleSchemaService` catalogue. Editing the base file and hitting the
endpoint (or running `bin/console app:prompt-template:build`) is enough —
no rebuild, no migrations.

## What the LLM produces

A single JSON **array of sections** that the admin UI's
**Import Sections** flow accepts at:

```text
POST /cms-api/v1/admin/pages/{page_id}/sections/import
```

The importer pre-validates the entire tree before writing anything and
returns HTTP 422 with a `{path, type, detail}` error list on failures —
unknown styles, unknown fields, invalid field-for-style combos, unknown
locales, missing required keys.

## Three render targets, one JSON

The same JSON has to render in three places:

| Target          | Renderer                                  | Tailwind classes | Mantine props      |
| --------------- | ----------------------------------------- | ---------------- | ------------------ |
| Desktop web     | This repo (Next.js + Mantine v9)          | applied          | applied            |
| Mobile web      | Same renderer, narrow viewport            | applied          | applied            |
| Native mobile   | `sh-selfhelp_native_app` (react-expo)     | **ignored**      | mapped to RN-equiv |

Practical implications for prompt authors and editors:

1. **Carry semantics in Mantine props first, Tailwind second.** Color,
   size, variant, radius, layout direction, gap, alignment, columns and
   spans should be set via `mantine_*` fields. The native renderer maps
   those 1:1; Tailwind classes do not exist on native.
2. **Use Tailwind for visual polish**, not for structure: gradients,
   shadows, decorative borders, focus rings — fine. Building a flex
   container out of `flex flex-col items-center gap-4` instead of using
   `stack` is not — the native renderer would just see an empty `box`.
3. **Prefer semantic styles over `box` + `html-tag` assemblies.** `card`,
   `alert`, `notification`, `badge`, `button`, `accordion`, `tabs`,
   `timeline`, `list` all encode their semantics for every renderer.
4. **`css_mobile` is portable.** The web renderer auto-prefixes its
   tokens with `max-md:` so they apply only below the `md` breakpoint
   (typically <768px). The native renderer can read the raw field and
   apply its own platform-specific overrides.

## Mobile-first guardrails the prompt enforces

Every section the LLM generates should follow these rules; the showcase
files in `generated examples/` exemplify each one.

| Rule                                              | Why                                                                  |
| ------------------------------------------------- | -------------------------------------------------------------------- |
| `simple-grid.mantine_cols` is a JSON object       | `"3"` is fixed at every viewport and squashes content on phones.    |
| Cards in grids carry `min-w-0 overflow-hidden`    | Long text would otherwise push the column wider than the viewport.   |
| Text in narrow contexts carries `break-words`     | Long unbroken words/URLs overflow without it.                        |
| Padding is responsive (`p-4 sm:p-6 lg:p-8`)       | Fixed `mantine_card_padding="lg"` wastes 24-32px on tiny screens.    |
| Display text is responsive (`text-3xl sm:text-4xl lg:text-5xl`) | Hero titles are unreadable when they wrap awkwardly.        |
| Buttons stay `mantine_size="md"` or larger        | Mobile tap targets need 36-44px minimum; `xs` is unreachable.       |
| `carousel.mantine_carousel_slide_size = "100%"`   | The default `100` (px) creates a horizontal-scroll trap on phones.   |
| `mantine_wrap = "1"` on `group`                   | A `group` of badges/buttons overflows without wrapping permission.   |

## How responsive layouts are encoded

### `simple-grid` columns

The frontend (`SimpleGridStyle.tsx`) accepts three formats for
`mantine_cols`:

```jsonc
// Fixed (every viewport — only safe for <=2 cols of short content)
"mantine_cols": { "all": { "content": "2" } }

// Responsive — JSON object, the recommended default
"mantine_cols": { "all": { "content": "{\"base\":1,\"sm\":2,\"lg\":3}" } }

// Legacy CSV — kept for backward compatibility, do not use in new content
"mantine_cols": { "all": { "content": "xs:1,sm:2,md:3" } }
```

### `grid-column` spans

`GridColumnStyle.tsx` accepts the matching set for `mantine_grid_span`:

```jsonc
"mantine_grid_span": { "all": { "content": "auto" } }                   // Mantine keyword
"mantine_grid_span": { "all": { "content": "6" } }                      // Fixed span
"mantine_grid_span": { "all": { "content": "{\"base\":12,\"md\":4}" } } // Responsive
```

### `css_mobile`

Tokens in `global_fields.css_mobile` are auto-prefixed with `max-md:` by
`getCssClass()` in `BasicStyle.tsx`. So a value of:

```jsonc
"css_mobile": "flex-col items-stretch gap-3 px-4"
```

renders on web as the additional class string:

```text
max-md:flex-col max-md:items-stretch max-md:gap-3 max-md:px-4
```

…appended **after** the regular `css` classes so the mobile values win
on viewports below the `md` breakpoint. Tokens that already start with a
viewport prefix (`md:`, `sm:`, `max-md:`, …) are kept verbatim.

For one-off responsive tweaks, prefer the inline syntax inside `css`
(`py-16 sm:py-12`); reach for `css_mobile` when the mobile rules are
several tokens long or when you want to keep mobile-specific intent
explicit for the native renderer.

#### `css_mobile` allow-list (matters for native)

The web renderer is permissive — it will happily render any Tailwind
class you put in `css_mobile`. The **native** renderer (Uniwind on
react-expo) cannot. To keep the JSON portable across both, the picker
in the CMS editor for `css_mobile` is filtered to a curated allow-list
defined in `@selfhelp/shared/cms-classes/allow-list.ts`.

The list is intentionally narrow: spacing, sizing, typography,
background, border, flex/grid layout, and a small set of atomic
literals. It excludes hover / focus / cursor classes (no-ops on
native), arbitrary brackets (`w-[120px]` — pass through, but only
opt-in), and anything backed by Tailwind plugins the native renderer
does not ship.

When an editor types a class outside the list, the picker offers it
as a "create custom value" option but does not promote it to a quick
pick. If they pick a class that's been **remapped** by
`@selfhelp/shared/cms-classes/remap.ts` (e.g. `mantine-fw` → `w-full`),
the renderer rewrites it transparently for both targets and the picker
shows the new value with a `(mobile alias of …)` label.

### Field-name landmines

The backend rejects an import with a `422` listing every offending
node, and the LLM is good at producing two specific mistakes:

| Wrong (will 422)                              | Correct                                                              |
| --------------------------------------------- | -------------------------------------------------------------------- |
| `group.fields.mantine_wrap = "wrap"`          | `group.fields.mantine_group_wrap = "1"` (`"0"` for nowrap)           |
| `simple-grid.fields.mantine_spacing = "md"`   | drop the field — only `mantine_vertical_spacing` is registered        |
| `card.fields.mantine_card_padding = "lg"`     | child `card-segment` with `global_fields.css = "p-4 sm:p-6"`         |
| `audio.fields.alt = "..."`                    | the catalog field (likely `mantine_audio_*`) — read the catalog       |

If you maintain a hand-curated example JSON, run
`node scripts/fix-ai-examples.mjs` after editing — it patches these two
patterns idempotently across every file in `generated examples/`.

## Frontend code that backs the prompt's promises

| File                                                                                       | What it does                                                                |
| ------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------- |
| `src/app/components/frontend/styles/BasicStyle.tsx`                                        | `getCssClass` composes `css` + auto-prefixed `css_mobile`.                  |
| `src/app/components/frontend/styles/mantine/SimpleGridStyle.tsx`                           | `parseResponsiveCols` accepts JSON object / number / CSV for `mantine_cols`. |
| `src/app/components/frontend/styles/mantine/GridColumnStyle.tsx`                           | `parseResponsiveSpan` accepts JSON object / number / `"auto"` for span.    |
| `src/hooks/useCssClasses.ts`                                                               | `useCssClasses` (full set) + `useMobileCssClasses` (allow-list filtered).   |
| `src/app/components/cms/shared/field-components/CreatableSelectField/GlobalCreatableSelectField.tsx` | `target="mobile"` switches the picker to the curated mobile catalogue.      |
| `src/app/components/cms/shared/field-renderer/FieldRenderer.tsx`                            | Wires the `css_mobile` field to `target="mobile"`; `css` to `target="web"`. |
| `scripts/fix-ai-examples.mjs`                                                              | Idempotent patcher for the two recurring import-time mistakes.              |

These parsers fall back to safe defaults (`1` col, `'auto'` span) on bad
input so a bad prompt never crashes the page.

## Generated examples in this folder

Every JSON file under `generated examples/` is importable as-is into a
fresh page:

| File                              | What it demonstrates                                                              |
| --------------------------------- | --------------------------------------------------------------------------------- |
| `all-styles-showcase.json`        | One example of every visual style, organised by category (typography, layout, …). |
| `developer-profile-card.json`     | A single profile card with avatar, badges, stats and CTA.                         |
| `modern-team-list.json`           | Vertical list of team members using the `list` style.                             |
| `modern-team-ui-mantine.json`     | Team grid built with Mantine `simple-grid` + `card` (recommended pattern).       |
| `modern-team-ui-tailwind.json`    | Same team grid built with `html-tag` + Tailwind grid (web-only fallback).         |
| `sample-travel-blog.json`         | Marketing-style blog grid with images, badges and CTAs.                           |

If you replace any of them, run a quick syntax check:

```bash
node -e "JSON.parse(require('fs').readFileSync('docs/AI Prompts/generated examples/<file>.json','utf8'))"
```

…and import into a non-production page to verify the layout before
committing.

## Improving the prompt

When a generation goes wrong:

1. Reproduce the issue with a focused snippet of the produced JSON.
2. Identify the structural root cause (wrong field shape, missing
   guardrail, ambiguous wording).
3. Edit `sh-selfhelp_backend/docs/ai/prompt_template_base.md` to add a
   rule, a recipe or a worked example.
4. Hit `GET /cms-api/v1/admin/ai/section-prompt-template` to confirm
   the appended catalogue still resolves.
5. (Optional) regenerate the snapshot file with
   `bin/console app:prompt-template:build`.
6. Re-run the prompt with the same brief and confirm the issue is gone.

Keep the prompt **declarative** (rules + worked examples) instead of
imperative (don't / never instructions); LLMs follow examples better
than negations.
