<!--
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
-->

# CMS Apps (Host Admin)

Audience: CMS administrators and content editors (non-technical).  
Status: active.  
Applies to: SelfHelp2 frontend Host Admin.  
Last verified: 2026-11-13.  
Source of truth: `/admin/cms-apps` UI behaviour.

## Quick start: Team Members demo

1. Sidebar **CMS Apps** → **Import template**.
2. Pick **Team members** (five more templates are there: **News**, **FAQ**, **Events**,
   **Contact directory**, **Testimonials** — each with its own public design and a
   feature of its own).
3. Keep the suggested keyword/route prefixes (they avoid clashing with real URLs).
4. Leave **Import sample records** on so demo people appear (bios and other
   translatable fields are seeded in **de-CH** and **en-GB** when your install
   carries both locales).
5. **Validate**, then **Import**.
6. Open the app → **Manage content** (edit people) → **Live preview** (the public
   list as visitors see it) → open the public list URL (visitor view).

Imported pages are private until you open them on purpose.

## Managing records

On **Manage content** you get **one list that holds the form**:

- **Add** opens the form in a modal over the list (no full page reload); a person
  can upload a portrait where the template has one.
- A row's **Edit** changes it in the same modal. **Cancel** closes the modal; if you
  typed something, you are asked before it is thrown away.
- **Delete** asks for confirmation and removes the record from the list and the
  public site. A deleted record cannot be restored from the list.
- Search, sort, the filters above the list and the page numbers run on the server;
  the address bar keeps them, so a filtered view can be bookmarked or shared.
- **History** (when switched on) lists the versions of a record, compares two and
  **restores** one (including images and downloads). A restore adds a new version
  and never erases history. If a colleague saved first you see a conflict and keep
  your input.
- Some templates add **quick actions** to a row (**Publish** / **Unpublish**,
  **Cancel event** / **Reopen**, **Approve** / **Hide**).

### Draft and publish

News, team members and a wizard with **with status** give each record a
**Draft** / **Published** status (default draft). Public pages show only
published records. Once published, later edits are public at once. Unpublish
hides the record (and its images / downloads) from visitors again. Images on
public cards use the page-scoped file URL; anyone who may open the page may open
those files.

### Language preview (optional)

Apps built before the entry list use an **entry-table** section (page editor → CMS
list page). Enable **Show language preview** there and a language dropdown appears
above the grid so you can check how translatable columns read in each locale. The
toggle is off by default. The entry list needs no such switch: translatable inputs
carry a value per language inside the form.

## Make a public page more compact or more spacious

Each template has a **default** look and two ready-made variants of the layout classes:
**compact** (tighter, more records per row) and **spacious** (fewer, larger cards). There
is no switch: copy the classes of the variant you want into the named section (page editor →
the section → **Record container classes** or **CSS classes**). Content, columns and data are
not touched.

| Template | Section | Compact | Spacious |
|----------|---------|---------|----------|
| Events | Record container classes of `events-view` | `grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3` | `grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-10` |
| Contact directory | Record container classes of `contacts-view` | `grid grid-cols-1 gap-2` | `grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8` |
| Testimonials | Record container classes of `testimonials-view` | `grid grid-cols-1 md:grid-cols-3 gap-3` | `grid grid-cols-1 gap-8` |
| News & updates | CSS classes of `news-list` | `grid grid-cols-1 md:grid-cols-3 gap-3` | `grid grid-cols-1 gap-8` |
| Team members | CSS classes of `team-members-list` | `grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3` | `grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-10` |
| FAQ accordion | CSS classes of `faq-accordion` | `max-w-2xl mx-auto` | `max-w-4xl mx-auto` |

For the cards of Events, Contact directory and Testimonials, *compact* also takes away the
hover lift of the card (the exact classes are in the template README,
`examples/cms-in-cms/README.md`); *spacious* keeps the card as it is. The CSS audit checks every
class of the README against the class catalogue.

## Delete an app

Trash icon on the CMS Apps list, or **Delete shell** on the app page. Only the
app listing is removed; pages and records stay. If import says the slug already
has pages, delete that shell (or change the keyword prefix) and try again.

## Create / scaffold

**Create app** → name + lowercase slug → open the app → **Scaffold**, or import
a template instead. The wizard previews the pages it creates:

- **CMS list** `/cms/<base>` — one entry list with its form (add, edit, delete,
  restore);
- **Public list** `/<base>` — a read-only list of the same records;
- **Public detail** `/<base>/{record_id}` — one record.

With **Create a new form + data table** the form is defined once, inside the CMS
list, and the public pages read its table. A new form always needs the CMS list.
Over an **existing data table** the CMS list shows and deletes records, but cannot
add or edit them.

## Roles in two words

- Host Admin **CMS Apps** = structure (pages, form fields, publish, preview).
- `/cms/...` = day-to-day records for editors.
- Public URLs = what visitors see.

## Live preview links

Buttons and internal links on public app pages stay inside live preview when you
click them (for example **View profile** on a team card). On the real public
site they navigate normally.
