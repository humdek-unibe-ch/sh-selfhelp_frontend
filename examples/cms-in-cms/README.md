<!--
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
-->

# CMS-in-CMS example bundles

Audience: developers / operators importing Host Admin templates  
Status: active  
Applies to: frontend `examples/cms-in-cms` + backend `tests/fixtures/examples` mirrors  
Last verified: 2026-11-17  
Source of truth: runtime `PageExportImportService` + `/admin/cms-apps` APIs

These bundles are **first-class CMS app** templates. There is **no dual format** and
**no backward compatibility** with pre-`cms_app` page-only “CMS app” exports. The six
templates share one design: **one dataset, defined once**, managed in a CMS list and read
on the public site.

## What a template contains

| Page | Role | What it is |
|------|------|------------|
| `/cms/<slug>` | `cms_list` | One **`entry-form-list`** (“Entry List with Form”). Its inline `form-record` (`<slug>-form`) is the only place the inputs are defined and **owns the data table**. The list adds, edits, deletes and restores records (modal form, history on). |
| `/<slug>` | `public_list` | What visitors read: a composition (`entry-list`) or a read-only **`data-view`** of the same table. |
| `/<slug>/{record_id}` | `public_detail` | One record (`entry-record`); only for templates that have a detail page. |

There is no separate form page and no separate CMS detail page. The roles `form`
and `cms_detail` stay valid for hand-built apps; the bundles here do not use them.

| Bundle | Public surface | What it demonstrates |
|--------|----------------|----------------------|
| `team-members.bundle.json` | Card grid with portraits + profile page (`entry-list` + `entry-record`) | Flagship: portrait upload (`file-input`, `files_public=1`), role select with translated labels, translatable bio, a role filter, history. |
| `news.bundle.json` | Article cards + article page (`entry-list` + `entry-record`) | Category (single select) and tags (multi select) with translated labels, date picker, translatable title/summary/body. |
| `faq.bundle.json` | Accordion, one item per question (`entry-list`) | Category label per language, translatable question and answer, list-only public surface. |
| `events.bundle.json` | Event cards (`data-view`, layout `custom`: date and status badges, title, place, teaser, *View details*) + event page | A **record template**, server-side filters (location, date range), **quick actions** Cancel / Reopen with confirmation, status label per language. |
| `contact-directory.bundle.json` | Contact cards (`data-view`, layout `custom`: initials, name, department badge, phone and mail links), no detail page | A record template, search and sort on the server, a department filter, translatable department text. |
| `testimonials.bundle.json` | Quote wall (`data-view`, layout `custom`: quote, avatar, author, role) | A record template and **moderation**: the public view has a fixed filter `status = Approved`; the CMS list has Approve / Hide quick actions. Pending quotes are never sent to visitors. |

Imports never open pages to guests: every page keeps the private default (`open_access` false) until
an editor opens it on purpose. Tokens such as `@section:<slug>-form` relink to the fresh section ids on
import, so a template imports on any installation, any number of times, with a keyword/route prefix.

## Required envelope

Every CMS-in-CMS bundle must include:

1. Tag `"cms-in-cms"` in `tags` (gallery / classifier).
2. Top-level `cms_app` metadata:

```json
"cms_app": {
  "name": "Team members",
  "slug": "team-members",
  "description": "Modern public team directory with profiles and portraits, managed in a list."
}
```

3. On **every** page in `pages[]`, a strict `cms_app_role`:

| Role | Meaning |
|------|---------|
| `cms_list` | CMS surface list (`entry-form-list`) — at most one per app |
| `public_list` | Public list — at most one per app |
| `public_detail` | Public detail — at most one per app |
| `form` | Separate create/edit form page (hand-built apps; the templates do not use it) |
| `cms_detail` | Separate CMS edit page (hand-built apps; the templates do not use it) |
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
4. Rebuilds hub FKs only through `CmsAppHubSyncService` (the form section of the app is the form
   inside its `cms_list` entry list).
5. Validates every list configuration (`FormListConfigValidator`) and relinks its field keys and form
   references to the new ids.
6. If the resolved slug already has pages, import returns **409** — delete the
   app shell under CMS Apps (pages/records kept) or change the keyword prefix.

Import from **Admin → CMS Apps → Import template** (examples gallery) or
**Admin → Pages → Import / export**. Turn on **Import sample records** for demos: the sample rows
carry every language of a translatable cell (a locale map), so an export of an installed template
re-imports with its translations.

## Data binding in bundles

The CMS list and the public data view bind a table through **property fields**:

```json
"fields": {
  "list_key":   { "all": { "content": "events" } },
  "data_table": { "all": { "content": "@section:events-cms-list" } },
  "detail_url": { "all": { "content": "/events/{record_id}" } }
}
```

A CMS list needs no `data_table`: it **is** the form (inputs sit directly inside it) and owns the table.
`@section:<slug>-cms-list` names that owner; the importer replaces it by the id of the imported list.

`entry-list` and `entry-record` compositions bind rows the same way (`data_table`, `own_entries_only`,
`scope`, `load_record_from`; `entry-list` keeps an optional `filter`). A `data_config` block with `table`
on an entry holder is **not** a row-binding mechanism at runtime. Authoritative style references:
`sh-selfhelp_backend/docs/reference/styles/composite.md` and `docs/developer/form-lists.md`.

### Option codes and labels

A select stores a **code** (`Lead`, `Approved`, `Scheduled`) — never the translated text. The input carries
`option_labels` per language, and a composition reads the label of the visitor's language through the
hydrated token `{{scope._field_label}}` (`{{team_member._role_label}}`, `{{event._status_label}}`).
A `data-view` or list cell shows the stored value as it is, so the templates keep shown fields that
visitors read as free text (a translatable text input) and use codes for fields that filters and quick
actions act on (`status`).

## Row templates (the `custom` layout of a data view)

Events, Contact directory and Testimonials draw each record from sections placed **inside** the
`data-view`. The sections are the layout of one record; the server draws them once per record and sends
them in the list state (`rows[].sections`), so search, filters and paging stay the visitor's:

```json
{
  "section_name": "events-view",
  "style_name": "data-view",
  "fields": {
    "list_layout":  { "all": { "content": "custom" } },
    "list_row_css": { "all": { "content": "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6" } },
    "list_columns": { "all": { "content": "[{\"field\":\"title\"},{\"field\":\"event_date\"},{\"field\":\"location\"},{\"field\":\"status\"},{\"field\":\"description\"}]" } }
  },
  "children": [
    { "section_name": "events-view-card", "style_name": "card", "children": [
      { "section_name": "events-view-card-title", "style_name": "title", "fields": { "content": { "de-CH": { "content": "{{title}}" } } } },
      { "section_name": "events-view-card-open", "style_name": "button", "fields": { "url": { "all": { "content": "/events/{{record_id}}" } } } }
    ] }
  ]
}
```

- A token is the **input name** of the form (`{{title}}`, `{{event_date}}`), `{{record_id}}`, `{{entry_date}}`, or
  `{{_status_label}}` (the label of a select in the visitor's language). Only columns listed in `list_columns`
  can be used, so a template can never show a column the view does not project. A test reads every token of
  every template against its columns (`src/config/__tests__/cms-app-template-forms.test.ts`).
- `list_row_css` is the element that holds the records on the web (a responsive grid); the phone stacks the
  records and uses `css_mobile` only.
- A form, an entry list or another data view inside the template is left out; a condition cannot read a value
  of the row; keep `page_size` at 6 to 12, because every record carries its drawn sections.
- The card of one record is written once in `scripts/build-cms-example-bundles.mjs` (`eventCard`,
  `contactCard`, `testimonialCard`).

## Public design variants

Each public page wraps its content in a `container` (`*-page`) with `size: lg` and portable `spacing` so
an imported template is readable on web and native. The web designs differ on purpose: a gradient hero
with eyebrow, title and subtitle; card grids with hover lift (team), article cards (news), a quiet
accordion (faq), event cards with date and status badges, contact cards with initials and call/mail links,
a testimonial wall with quotes and avatars. All classes come from the CMS class catalogue
(`npm run audit:cms-css` fails on any class outside it); `css_mobile` carries Uniwind tokens for the native
app.

### Class presets: compact and spacious

There is no variant picker. A template has two documented sets of classes besides its default, **compact**
(tighter, more records per row; the card loses its hover lift) and **spacious** (fewer, larger cards;
the card stays as it is). To switch, copy the classes of a column into the named section: in the CMS
(page editor → the section → *Record container classes* / *CSS classes*) or in the bundle before the
import. Nothing else changes: the content, the columns and the data stay as they are.
`npm run audit:cms-css` checks every class in this table: it must be in the CMS class catalogue or
already used by a bundle (both give it CSS in the web build), so a copied class always has CSS.

<!-- class-presets:start -->
| Template | Where (section, in the CMS or in the bundle) | Default | Compact | Spacious |
|----------|-----------------------------------------------|---------|---------|----------|
| Events | Record container classes of `events-view` | `grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6` | `grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3` | `grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-10` |
| Events | CSS classes of `events-view-card` | `h-full flex flex-col transition duration-300 ease-out hover:-translate-y-1 hover:shadow-xl bg-white/90 dark:bg-slate-900/80 backdrop-blur-sm border-t-4 border-t-violet-400` | `h-full flex flex-col bg-white/90 dark:bg-slate-900/80 border-t-4 border-t-violet-400` | as default |
| Contact directory | Record container classes of `contacts-view` | `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4` | `grid grid-cols-1 gap-2` | `grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8` |
| Contact directory | CSS classes of `contacts-view-card` | `h-full flex flex-col transition duration-300 ease-out hover:-translate-y-1 hover:shadow-xl bg-white/90 dark:bg-slate-900/80 backdrop-blur-sm border-t-4 border-t-cyan-400` | `h-full flex flex-col bg-white/90 dark:bg-slate-900/80 border-t-4 border-t-cyan-400` | as default |
| Testimonials | Record container classes of `testimonials-view` | `grid grid-cols-1 md:grid-cols-2 gap-6` | `grid grid-cols-1 md:grid-cols-3 gap-3` | `grid grid-cols-1 gap-8` |
| Testimonials | CSS classes of `testimonials-view-card` | `h-full flex flex-col transition duration-300 ease-out hover:-translate-y-1 hover:shadow-xl bg-white/90 dark:bg-slate-900/80 backdrop-blur-sm bg-gradient-to-br from-amber-50 to-white dark:from-slate-900 dark:to-slate-950 border-amber-100 dark:border-slate-800` | `h-full flex flex-col bg-gradient-to-br from-amber-50 to-white dark:from-slate-900 dark:to-slate-950 border-amber-100 dark:border-slate-800` | as default |
| News & updates | CSS classes of `news-list` | `grid grid-cols-1 md:grid-cols-2 gap-6` | `grid grid-cols-1 md:grid-cols-3 gap-3` | `grid grid-cols-1 gap-8` |
| Team members | CSS classes of `team-members-list` | `grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 md:gap-8` | `grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3` | `grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-10` |
| FAQ accordion | CSS classes of `faq-accordion` | (none) | `max-w-2xl mx-auto` | `max-w-4xl mx-auto` |
<!-- class-presets:end -->

## Regenerating the bundles

The six files are written by one script; edit the script, not the JSON:

```bash
node scripts/build-cms-example-bundles.mjs            # rewrite the six bundles
node scripts/build-cms-example-bundles.mjs --check    # fail when a file differs from the script
node scripts/build-cms-example-bundles.mjs --backend  # also copy to ../sh-selfhelp_backend/tests/fixtures/examples/
```

Backend mirrors live under `sh-selfhelp_backend/tests/fixtures/examples/` and are byte-identical copies.
Backend CI imports every template (`tests/Golden/CmsInCmsTemplateBundlesImportTest.php`), round-trips it
through export and import on fresh ids (`tests/Integration/CMS/Admin/FormListTemplatePortabilityTest.php`),
and drives each one through manager add/edit/delete and the public page
(`tests/Golden/CmsInCmsTemplateWorkflowTest.php`).

## Tailwind CSS in bundles

Section `global_fields.css` values use **web Tailwind** utilities (e.g. `grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 md:gap-8`). `css_mobile` uses **Uniwind** spacing tokens (`px-md`, `gap-sm`, …) for the native app — not raw Tailwind.

The frontend registers these classes in `src/globals.css`:

- `@source "../examples/**/*.json"` scans this folder at build time.
- `@source inline(...)` brace patterns cover author-typed CMS classes.

After changing Tailwind classes in any example bundle, run `npm run audit:cms-css` from the frontend repo root.
