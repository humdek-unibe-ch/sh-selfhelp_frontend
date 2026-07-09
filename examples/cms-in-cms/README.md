<!--
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
-->

# CMS-in-CMS example bundles

Audience: developers / operators importing Host Admin templates  
Status: active  
Applies to: frontend `examples/cms-in-cms` + backend `tests/fixtures/examples` mirrors  
Last verified: 2026-07-09  
Source of truth: runtime `PageExportImportService` + `/admin/cms-apps` APIs

These bundles are **first-class CMS app** templates. There is **no dual format** and
**no backward compatibility** with pre-`cms_app` page-only “CMS app” exports.

## Required envelope

Every CMS-in-CMS bundle must include:

1. Tag `"cms-in-cms"` in `tags` (gallery / classifier).
2. Top-level `cms_app` metadata:

```json
"cms_app": {
  "name": "Team members",
  "slug": "team-members",
  "description": null
}
```

3. On **every** page in `pages[]`, a strict `cms_app_role`:

| Role | Meaning |
|------|---------|
| `form` | Create/edit form (owns the data table via `form-record`) |
| `cms_list` | CMS surface list (`entry-table`) — at most one per app |
| `cms_detail` | CMS modal edit page — at most one per app |
| `public_list` | Public list — at most one per app |
| `public_detail` | Public detail — at most one per app |
| `other` | Extra related page; unlimited |

Import **fails** (HTTP 400) if:

- the bundle is tagged / looks like CMS-in-CMS but `cms_app` is missing,
- `cms_app.name` or `cms_app.slug` is empty,
- any page omits `cms_app_role`, or
- any `cms_app_role` is not in the enum above (invalid roles are **not** coerced to `other`).

## Import behaviour

1. Creates the `cms_apps` shell from `cms_app` (or **reuses an empty** shell with
   the same slug after prefix normalisation).
2. Keyword prefixes such as `demo_team_members_` are sanitised to a kebab-case
   app slug (`demo-team-members-team-members`) — underscores would fail the
   strict slug validator otherwise.
3. Creates each page, then assigns it with its `cms_app_role` via `CmsAppService::assignPage`.
4. Rebuilds hub FKs only through `CmsAppHubSyncService`.
5. If the resolved slug already has pages, import returns **409** — delete the
   app shell under CMS Apps (pages/records kept) or change the keyword prefix.

Import from **Admin → CMS Apps → Import template** (examples gallery) or
**Admin → Pages → Import / export**. Turn on **Import sample records** for demos.

## Entry style binding in bundles

`entry-list` and `entry-record` sections bind rows through **property fields** in
`fields` — not through `global_fields.data_config`:

```json
"fields": {
  "data_table": { "all": { "content": "@section:team-members-form" } },
  "own_entries_only": { "all": { "content": "0" } },
  "filter": { "all": { "content": "" } },
  "scope": { "all": { "content": "" } }
}
```

`entry-record` adds `url_param` (default `record_id`). A `data_config` block with
`table` on an entry holder is **not** a row-binding mechanism at runtime; bundles
must use `fields.data_table`. Authoritative style reference:
`sh-selfhelp_backend/docs/reference/styles/composite.md` (`entry-list` /
`entry-record` sections).

## Files

| Bundle | Notes |
|--------|--------|
| `team-members.bundle.json` | Flagship list + detail + admin grid |
| `news.bundle.json` | Blog-style public list/detail |
| `events.bundle.json` | Events list + detail |
| `faq.bundle.json` | Accordion list |
| `contact-directory.bundle.json` | Contact list |
| `testimonials.bundle.json` | Testimonials list |

Backend mirrors live under `sh-selfhelp_backend/tests/fixtures/examples/`.

## Tailwind CSS in bundles

Section `global_fields.css` values use **web Tailwind** utilities (e.g. `grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 md:gap-8`). `css_mobile` uses **Uniwind** spacing tokens (`px-md`, `gap-sm`, …) for the native app — not raw Tailwind.

The frontend registers these classes in `src/globals.css`:

- `@source "../examples/**/*.json"` scans this folder at build time.
- `@source inline(...)` brace patterns cover author-typed CMS classes.

After changing Tailwind classes in any example bundle, run `npm run audit:cms-css` from the frontend repo root.
