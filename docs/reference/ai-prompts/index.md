/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
# AI-Generated Sections — Prompt Flow & Authoring Guide

Audience: Developers and integrators.
Status: active.
Applies to: SelfHelp2 Next.js frontend (cross-platform with the react-expo native renderer).
Last verified: 2026-06-22.
Source of truth: Runtime renderers in this repo, the live backend style schema, and the committed `style-schema.snapshot.json` in this folder.

This folder is the **frontend-side companion** to the LLM workflow that
produces importable section JSON for SelfHelp pages. The prompt itself is
generated on the backend from the live style/field schema; this guide
explains how the pieces fit together, the **current** field-naming and
field-scope contract, and how the curated examples here are kept valid.

> Naming contract (2026-06-22 prefix drop): portable cross-platform fields
> are **unprefixed**. `web_*` is web-only, `mobile_*` is native-only. The
> only reserved `shared_*` names left are **`shared_width`**,
> **`shared_height`**, **`shared_icon`**. Anything else with a `shared_` or
> `mantine_` prefix is obsolete and will not exist in the catalog.

## Where the prompt actually lives

| Artefact | Path | Editable? |
| --- | --- | --- |
| Hand-maintained prompt base (stable rules) | `sh-selfhelp_backend/docs/ai/prompt_template_base.md` | **Yes** |
| Live API endpoint (base + dynamic catalog) | `GET /cms-api/v1/admin/ai/section-prompt-template` | n/a (runtime) |
| Machine-readable catalog | same endpoint with `?format=json` | n/a |
| Task-filtered catalog | same endpoint with `?styles=card,simple-grid,…` | n/a |
| Offline snapshot of the rendered prompt | `sh-selfhelp_backend/docs/ai/ai_section_generation_prompt.md` | No (regenerated, **not** the runtime source) |
| Curated example JSON (this folder) | `generated-examples/*.json` | Yes (manual curation, validated) |
| DB-free schema snapshot used by validation | `style-schema.snapshot.json` (this folder) | No (regenerated from the live schema) |

The endpoint composes `prompt_template_base.md` with a **dynamically
generated catalog** built from the backend `StyleSchemaService`. Each style
in the catalog now exposes its `renderTarget` (`web` / `mobile` / `both`),
and each field exposes its backend **scope** (`content` / `common` / `web`
/ `mobile`), type, default, options, and help/placeholder. Editing the base
file and re-hitting the endpoint is enough — no rebuild, no migrations.

## What the LLM produces

A single JSON **array of sections** that the admin UI's **Import Sections**
flow accepts at:

```text
POST /cms-api/v1/admin/pages/{page_id}/sections/import
```

The importer pre-validates the entire tree before writing anything and
returns an error list (`{path, type, detail}`) on failures — unknown
styles, unknown fields, invalid field-for-style combos, unknown locales,
missing required keys.

## The field-scope ⇄ locale contract

Every field carries a backend-assigned **scope**. The scope decides both
what the field means *and* which locale key it must use. Never re-derive
scope on the consumer side — read it from the catalog.

| Scope | Meaning | Locale key | Example |
| --- | --- | --- | --- |
| `content` | Translatable, user-visible text | a **real** locale (`en-GB`, `de-CH`) | `"text": { "en-GB": { "content": "Hello" } }` |
| `common` | Cross-platform behaviour/presentation | `"all"` | `"cols": { "all": { "content": "2" } }` |
| `web` | Web-only enhancement | `"all"` | `"web_cols_lg": { "all": { "content": "3" } }` |
| `mobile` | Native-only override | `"all"` | `"mobile_size": { "all": { "content": "lg" } }` |

`global_fields` (`condition`, `data_config`, `css`, `css_mobile`, `debug`)
are not locale-keyed — they are a flat object on the node.

Omit any field whose value equals the database default — the catalog lists
the default for every field, and compact JSON is the goal.

## Three render targets, one JSON

The same JSON renders in three places, so authoring is **semantic-first**:

| Target | Renderer | `css` (Tailwind) | `css_mobile` |
| --- | --- | --- | --- |
| Desktop web | this repo (Next.js + Mantine v9) | applied | applied below `md` |
| Mobile web | same renderer, narrow viewport | applied | applied below `md` |
| Native mobile | react-expo (HeroUI Native + Uniwind) | **ignored** | applied through the allow-list/remap pipeline |

Practical rules the prompt enforces:

1. **Prefer semantic styles and unprefixed common fields** for structure
   and meaning (`card`, `stack`, `simple-grid`, `alert`, `badge`,
   `accordion`, `tabs`, `timeline`, `list`, …). A flex container hand-built
   from `<div class="flex flex-col">` is invisible to native — use `stack`.
2. **`css` is web Tailwind.** Responsive, `dark:`, `hover:`, `focus:`
   variants are fine here; they never reach native.
3. **`css_mobile` is the cross-platform layer.** It must contain only
   classes the shared Uniwind allow-list supports. On web its tokens are
   auto-prefixed with `max-md:` (apply <768px); on native they go through
   the classifier. Tokens outside the allow-list are **dropped on native**
   (they silently vanish) — keep those in `css` instead.
4. **Native theme** comes from semantic fields / HeroUI theme tokens, not
   from web `dark:` classes.
5. **Accessibility**: meaningful heading order (`title_order`), real
   `alt`/labels, readable contrast, and ≥36–44px mobile tap targets
   (`button` size `md`+).

### `css_mobile` runtime behaviour (verified)

`getCssClass()` in `BasicStyle.tsx` composes
`section-{id}` → `css` → mobile-prefixed `css_mobile`:

- Each `css_mobile` token without an existing viewport gate is prefixed
  `max-md:` so the mobile value wins below the `md` breakpoint.
- Tokens that already carry a viewport prefix (`sm:`, `md:`, `max-md:`, …)
  are kept verbatim.
- Stacked variants (`dark:`, `hover:`) are preserved.

The native renderer reads the raw `css_mobile` field and classifies each
token via `@selfhelp/shared` (`classifyClassString`): **allow** (kept),
**remap** (rewritten to a native-safe equivalent), or **drop** (removed).
The validator in this folder fails any example whose `css_mobile` contains
a dropped token, so non-portable tokens cannot land in a curated example.

## Canonical responsive recipes

| Need | Pattern |
| --- | --- |
| Responsive grid | `simple-grid` with `cols` (cross-platform base, e.g. `"1"`) + web overrides `web_cols_sm` / `web_cols_md` / `web_cols_lg` |
| Explicit column spans | `grid` + `grid-column` with the unprefixed `grid_span` |
| Wrapping button/badge row | `group` + `css_mobile: "flex-wrap"` |
| Card | `card` → `card-segment` (padding via `css`), `min-w-0 overflow-hidden` to protect narrow widths |
| Long text | `text` with `css: "break-words"` |
| Disclosure | `accordion` → `accordion-item`; `tabs` → `tab` |
| Form | `form-record` / `form-log` → inputs (`text-input`, `textarea`, `select`, `checkbox`) |

Per-field names, defaults, options, help and `renderTarget` always come
from the **live catalog** — this guide intentionally does not duplicate the
full field list (that is exactly how drift crept in before).

## Curated examples in this folder

Every file under `generated-examples/` is importable as-is and is validated
in CI (see below):

| File | Demonstrates |
| --- | --- |
| `all-styles-showcase.json` | A compact tour across categories (typography, layout, media, feedback, disclosure, lists/timeline, form). |
| `developer-profile-card.json` | A single profile card: avatar image, badges, title, text, CTA button. |
| `modern-team-list.json` | A vertical team list using `list` + `list-item`. |
| `modern-team-ui-mantine.json` | Responsive team grid with `simple-grid` (`cols` + `web_cols_*`) + `card`. |
| `modern-team-ui-tailwind.json` | The same semantic grid, enhanced with **web-only** `css` polish (gradient text, hover shadow) that degrades gracefully on native. |
| `sample-travel-blog.json` | Responsive blog-card grid with images, badges and CTAs. |

There is no `mantine_*`, no obsolete `shared_*`, and no `web_cols`/
`web_grid_span`/`web_vertical_spacing`/`web_title_order` anywhere — those
fields no longer exist.

## Automated validation (DB-free)

Drift can't silently return: examples are validated against the committed
`style-schema.snapshot.json` (a snapshot of the live backend catalog), so
no database is needed.

```bash
# one-shot CLI
npm run validate:ai-examples        # → node scripts/validate-ai-examples.mjs

# the same checks run in the test suite
npx vitest run src/app/components/frontend/styles/__tests__/aiExamples.validation.test.ts
```

`scripts/validate-ai-examples.mjs` checks, per example: JSON shape, known
style, valid-field-for-style, no obsolete naming (`mantine_*` / non-reserved
`shared_*`), scope→locale correctness, slot parent/child constraints,
`renderTarget` warnings, default-omission warnings, and `css_mobile`
classification (errors on dropped tokens) using `@selfhelp/shared`.

When the backend schema changes, refresh the snapshot from the live schema
(`GET /cms-api/v1/admin/ai/section-prompt-template?format=json`, or the
backend `docs/reference/styles/style-field-audit.generated.json`) and re-run
the validator.

## Frontend code that backs the prompt's promises

| File | What it does |
| --- | --- |
| `src/app/components/frontend/styles/BasicStyle.tsx` | `getCssClass` composes `css` + auto-prefixed (`max-md:`) `css_mobile`. |
| `src/app/components/frontend/styles/mantine/SimpleGridStyle.tsx` | Reads `cols` + `web_cols_sm/md/lg`. |
| `src/app/components/frontend/styles/mantine/GridColumnStyle.tsx` | Reads `grid_span`. |
| `style-schema.snapshot.json` (this folder) | DB-free snapshot of the live catalog used by validation. |
| `scripts/validate-ai-examples.mjs` | Schema-driven, DB-free example validator (replaces the old field-patching `fix-ai-examples.mjs`). |
| `src/app/components/frontend/styles/__tests__/aiExamples.validation.test.ts` | Runs the validator as a Vitest drift guard. |

## Improving the prompt

When a generation goes wrong:

1. Reproduce with a focused snippet of the produced JSON.
2. Identify the structural root cause (wrong scope/locale, missing rule,
   ambiguous wording).
3. Edit `sh-selfhelp_backend/docs/ai/prompt_template_base.md` (stable rules
   only — never hardcode per-style field names there).
4. Hit `GET /cms-api/v1/admin/ai/section-prompt-template` to confirm the
   catalog still resolves; optionally regenerate the offline snapshot.
5. If you touched the schema, refresh `style-schema.snapshot.json` and run
   `npm run validate:ai-examples`.

Keep the prompt **declarative** (rules + worked examples); LLMs follow
concrete examples better than negations.
