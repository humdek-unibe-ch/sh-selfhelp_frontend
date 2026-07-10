<!--
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
-->

# CMS Apps (Host Admin)

Audience: CMS administrators and content editors (non-technical).  
Status: active.  
Applies to: SelfHelp2 frontend Host Admin.  
Last verified: 2026-07-09.  
Source of truth: `/admin/cms-apps` UI behaviour.

## Quick start: Team Members demo

1. Sidebar **CMS Apps** → **Import template**.
2. Pick **Team members**.
3. Keep the suggested keyword/route prefixes (they avoid clashing with real URLs).
4. Leave **Import sample records** on so demo people appear (bios and other
   translatable fields are seeded in **de-CH** and **en-GB** when your install
   carries both locales).
5. **Validate**, then **Import**.
6. Open the app → **Manage content** (edit people) → **Live preview** (CMS view) →
   open the public list URL (visitor view).

## Managing records

On **Manage content** you get a table like Users/Groups:

- **Add new** opens the form in a modal over the list (no full page reload).
- The pencil edits a row in the same modal.
- **Cancel** in the modal closes it and keeps you on the list.
- **Delete** marks the row as deleted (soft delete). It is hidden from the public
  site but not permanently erased; administrators can restore it from the data
  tools if needed.

### Language preview (optional)

On the **entry-table** section (page editor → CMS list page), enable **Show
language preview**. A language dropdown appears above the grid so you can check
how translatable columns (for example **Bio**) read in each locale. The toggle
is off by default.

## Delete an app

Trash icon on the CMS Apps list, or **Delete shell** on the app page. Only the
app listing is removed; pages and records stay. If import says the slug already
has pages, delete that shell (or change the keyword prefix) and try again.

## Create / scaffold

**Create app** → name + lowercase slug → open the app → **Scaffold**, or import
a template instead.

## Roles in two words

- Host Admin **CMS Apps** = structure (pages, form fields, publish, preview).
- `/cms/...` = day-to-day records for editors.
- Public URLs = what visitors see.

## Live preview links

Buttons and internal links on public app pages stay inside live preview when you
click them (for example **View profile** on a team card). On the real public
site they navigate normally.
