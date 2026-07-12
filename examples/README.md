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
| [`navigation/`](./navigation/) | Importable **navigation bundles** (`selfhelp/navigation-bundle` v1.0) with optional embedded pages. | Admin → Navigation → **Export / Import**, or `POST /admin/navigation/import`. |
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

## navigation/

| Bundle | Purpose |
| --- | --- |
| [`menu-demo.bundle.json`](./navigation/menu-demo.bundle.json) | 22-page realistic mini-site with all four menus wired (dropdown header with mega-menu descriptions and a three-level Services > Training branch, grouped footer, mobile drawer, bottom tabs). Pages ship namespaced `demo-*` keywords (no prefix needed); routes default under `/demo`. |

## cms-in-cms/

Full **page bundles** that scaffold a working CMS-in-CMS application. All six
are surfaced in the admin UI as the **"Start from template" gallery** (Pages →
Import dialog) for one-click prefixed import, ship translated de-CH/en-GB
content plus sample rows (`options.importData=true`), and share the same
portable pattern: the public pages bind data through `@section:<form>` tokens,
the admin page is an `entry-table` CRUD grid (search/sort/pagination/CSV,
built-in delete), and one modal form page carries two routes — `.../form`
(create) and `.../{record_id}` (edit via `load_record_from`).

| Bundle | Demonstrates |
| --- | --- |
| `team-members.bundle.json` | **Flagship.** Public card grid with avatar initials, role badges and contact links (`/team-members`), a shareable profile detail page (`/team-members/{record_id}`), an admin CRUD grid, and a translatable bio field. |
| `news.bundle.json` | News/blog: category select input, date, summary + translatable body; public list/detail pair with category badges. |
| `faq.bundle.json` | FAQ: public accordion with **one accordion item per data row** (entry-list hydration inside a Mantine accordion); list-only public surface. |
| `events.bundle.json` | Events: date badges with icons, location line, teaser clamp; public list/detail pair. |
| `contact-directory.bundle.json` | Contact directory (compact 3-page variant, no public detail): tap-to-call `tel:` and `mailto:` links per card. |
| `testimonials.bundle.json` | Testimonials wall (3-page variant): blockquote cards with avatar + author line, translatable quote. |

Every bundle is import-guarded in backend CI
(`tests/Golden/CmsInCmsTemplateBundlesImportTest.php` imports each one with
keyword + route prefixes and asserts the hydrated public render), with fixture
copies under `sh-selfhelp_backend/tests/fixtures/examples/`. If you edit a
bundle here, sync the fixture copy.

To import: **Admin → Pages**, open the **Export / Import** dialog (the transfer
icon next to the page search), switch to **Import**, pick a template from the
gallery (or upload a bundle file), optionally set a keyword/route prefix to
avoid clashing with existing pages, then confirm.

Adding a new example? Drop the file in the matching folder and add a row to the
relevant table above so it stays discoverable.
