# SelfHelp examples

Audience: Editors, developers, and AI tooling
Status: Active
Applies to: sh-selfhelp_frontend (consumes), sh-selfhelp_backend import API
Last verified: 2026-07-01
Source of truth: the backend import endpoints + the live style schema snapshot

This is the **single, consolidated home** for every curated SelfHelp example —
section snippets, full page bundles, and CMS-in-CMS apps. They are grouped by
what you can do with them.

## Groups

| Folder | What it contains | How to use it |
| --- | --- | --- |
| [`sections/`](./sections/) | Single-section / page-content JSON samples (one tree of sections). | Paste into the page editor's **Add section → Import** tab, or feed to AI tooling as reference. Validated in CI against the live style schema. |
| [`cms-in-cms/`](./cms-in-cms/) | Importable **page bundles** (pages + routes + sections + optional data). | Admin → Pages → **Export / Import** → *Import*, upload the `*.bundle.json`. |
| [`pages/`](./pages/) | Curated landing/onboarding page bundles (`hero-home`, `mobile-onboarding`). | Same import flow as `cms-in-cms/`. |

## sections/

These are the curated AI section examples. Each file is a JSON array of
sections, importable as-is, and is validated in CI by
`scripts/validate-ai-examples.mjs` (the
`src/app/components/frontend/styles/__tests__/aiExamples.validation.test.ts`
drift guard) against
[`docs/reference/ai-prompts/style-schema.snapshot.json`](../docs/reference/ai-prompts/style-schema.snapshot.json).
See [`docs/reference/ai-prompts/index.md`](../docs/reference/ai-prompts/index.md)
for the per-file catalog and the prompt contract.

## pages/

| Bundle | Purpose |
| --- | --- |
| [`hero-home.bundle.json`](./pages/hero-home.bundle.json) | Polished responsive hero home (also seeded on fresh installs when `home` is untouched). |
| [`mobile-onboarding.bundle.json`](./pages/mobile-onboarding.bundle.json) | Mobile-first onboarding/landing screen. Import via **Export / Import**, then set as **Mobile guest start page** under **Admin → Navigation → Start & search** if you want it as the app entry screen. Not auto-seeded — avoids overwriting customer content. |

## cms-in-cms/

Full **page bundles** that scaffold a working CMS-in-CMS application:

| Bundle | Demonstrates |
| --- | --- |
| `team-members.bundle.json` | A list + detail "Team members" app: a public list page (`/team`), a detail page (`/team/{record_id}`) bound to a data table, with DB-driven routes and `{{route.*}}` interpolation. |

To import: **Admin → Pages**, open the **Export / Import** dialog (the transfer
icon next to the page search), switch to **Import**, upload the bundle, optionally
set a keyword/route prefix to avoid clashing with existing pages, then confirm.

Adding a new example? Drop the file in the matching folder and add a row to the
relevant table above so it stays discoverable.
