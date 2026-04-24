# SH-SelfHelp — AI Section Generation Prompt (BASE)

> This is the **hand-maintained base** of the prompt template. The final
> user-facing prompt is produced by concatenating this file with an
> auto-generated **style/field catalog** appendix. Run
> `bin/console app:prompt-template:build` on the backend to refresh
> `docs/AI Prompts/ai_section_generation_prompt.md` after DB changes.

---

## Your task

You generate **CMS content for SH-SelfHelp** as a single JSON **array of sections**.
The JSON you produce will be imported as-is via the admin UI's **Import Sections**
flow (`POST /cms-api/v1/admin/pages/{page_id}/sections/import`).

Replace the two placeholders below and return **only valid JSON** (no prose, no
Markdown fences):

- `<LOCALES>` — one or more **real** locales (never `all`), comma-separated.
  Examples: `en-GB` or `en-GB,de-CH`. These are the languages **translatable**
  fields (`locale=en-GB|de-CH|...` in the catalog) will be rendered in.
  Property fields are **separate** and always use the locale `all`
  regardless of what you pass here.
- `<DESCRIBE_WHAT_YOU_WANT>` — freeform English description of what to build
  (e.g. "a hero section with a title, subtitle, and a primary CTA, followed
  by a 3-column team grid with 6 members, then a contact form").

---

## Output contract (STRICT)

1. The top-level value MUST be a JSON **array** of section objects.
2. Every section object MUST include a `style_name` that exists in the style
   catalog below. `section_name` is **optional** — the backend auto-names
   sections from the style when omitted.
3. Omit any field that would equal the DB default. The importer
   restores defaults automatically. **Smaller is better.**
4. `fields` is an object keyed by the CMS field name. Each field is keyed by
   **locale**; each locale has `{ "content": "...", "meta": "..." }`. Omit
   `meta` when null/empty.
5. Locale keys follow the `languages` table. The system ships three locales:
   - `all` (id 1, "Independent") — **MUST** be the only locale used for
     non-translatable **property** fields (catalog tag `locale=all`). These
     are technical/configuration values.
   - `en-GB` (id 3) and `de-CH` (id 2) — real human languages used only for
     **translatable** fields (catalog tag `locale=en-GB|de-CH|...`).
   - Mixing is illegal: never put a property field under `en-GB`; never put
     a translatable field under `all`. Pre-validation rejects unknown locales
     but silently accepts the wrong locale for a field — the resulting page
     will render incorrectly.
6. `global_fields` holds `condition`, `data_config`, `css`, `css_mobile`,
   `debug`. Omit any key that's null/empty. `debug` only appears when `true`.
   Omit `global_fields` entirely when all keys would be omitted.
7. `children` is an array; **omit it when empty**.
8. Booleans are ALWAYS strings (`"0"` / `"1"`) when stored in a translation
   field. Real JSON booleans are only allowed inside `global_fields.debug`.
9. CSS uses **Tailwind utility classes**. Every visual element that can be
   themed MUST include `dark:` variants. Mobile overrides go into
   `global_fields.css_mobile`.
10. Image fields use `img_src`. For placeholder/illustrative images, use the
    canonical URL `/assets/image-holder.png` (relative path; the backend
    serves the placeholder).
11. **Enum options are pre-validated implicitly.** When a field advertises
    `options: "a" | "b" | "c"` in the catalog, the rendered page will only
    behave correctly if you write one of those exact `value` strings. Do not
    invent new values. Free-form fields (`text`, `textarea`, `markdown-inline`,
    `json`) have no options list — write what makes sense.
12. **Mantine spacing fields are JSON objects, NOT Tailwind strings.** Any
    field whose catalog type is `mantine_spacing_margin`,
    `mantine_spacing_padding`, or `mantine_spacing_margin_padding` expects a
    JSON-encoded object keyed by Mantine spacing keys with Mantine size
    tokens as values. Tailwind utility classes belong in
    `global_fields.css` / `global_fields.css_mobile`, never inside these
    fields. The keys are (margin first, then padding):
    - `mt` — margin-top
    - `mb` — margin-bottom
    - `ms` — margin-inline-start (left in LTR)
    - `me` — margin-inline-end   (right in LTR)
    - `pt` — padding-top
    - `pb` — padding-bottom
    - `ps` — padding-inline-start
    - `pe` — padding-inline-end

    Valid values: the Mantine size tokens `"none"`, `"xs"`, `"sm"`, `"md"`,
    `"lg"`, `"xl"`, or a numeric pixel string (e.g. `"0"`, `"8"`, `"24"`).
    `mantine_spacing_padding` only accepts the four `p*` keys;
    `mantine_spacing_margin` only accepts the four `m*` keys;
    `mantine_spacing_margin_padding` accepts all eight. Omit keys you do
    not set rather than writing empty strings.

    Correct shape (stringified JSON stored under the `all` locale — always
    a property field):

    ```json
    "mantine_spacing_margin_padding": {
      "all": {
        "content": "{\"mt\":\"md\",\"mb\":\"md\",\"pt\":\"lg\",\"pb\":\"lg\"}"
      }
    }
    ```

    WRONG — do NOT put Tailwind classes here (they will crash the frontend):

    ```json
    "mantine_spacing_margin_padding": {
      "all": { "content": "pt-10" }
    }
    "mantine_spacing_margin_padding": {
      "all": { "content": "mx-auto max-w-sm" }
    }
    ```

    Rule of thumb: if the value you want is a Mantine size token use the
    spacing field, otherwise omit it entirely and express the spacing with
    Tailwind classes inside `global_fields.css`.
13. Do NOT include `id`, `position`, `timestamp`, or any ID-like key — the
    backend assigns those.

---

## JSON shape — minimal round-trip example

Single locale (`<LOCALES>` = `en-GB`), hero container with one title:

```json
[
  {
    "section_name": "hero",
    "style_name": "container",
    "fields": {
      "mantine_size": {
        "all": { "content": "md" }
      }
    },
    "global_fields": {
      "css": "py-16 px-4 bg-white dark:bg-gray-900"
    },
    "children": [
      {
        "style_name": "title",
        "fields": {
          "content": {
            "en-GB": { "content": "Welcome" }
          },
          "mantine_title_order": {
            "all": { "content": "1" }
          }
        }
      }
    ]
  }
]
```

Multi-locale (`<LOCALES>` = `en-GB,de-CH`):

```json
[
  {
    "style_name": "title",
    "fields": {
      "content": {
        "en-GB": { "content": "Welcome" },
        "de-CH": { "content": "Willkommen" }
      },
      "mantine_title_order": {
        "all": { "content": "1" }
      }
    }
  }
]
```

Notice how the translatable `content` field is replicated across every real
locale while the property `mantine_title_order` uses the `all` locale exactly
once. The style/field catalog below tells you which is which (`locale=all` for
property, `locale=en-GB|de-CH|...` for translatable).

---

## Structural rules (HARD constraints — pre-validation will reject otherwise)

### Container-only styles

These styles may **only** appear as direct children of the listed parent.
Do not use them as top-level sections or under any other parent:

| Style            | Required parent   |
|------------------|-------------------|
| `accordion-item` | `accordion`       |
| `tab`            | `tabs`            |
| `card-segment`   | `card`            |
| `grid-column`    | `grid`            |
| `list-item`      | `list`            |
| `progress-section` | `progress-root` |
| `timeline-item`  | `timeline`        |

### Parent styles that require their slot children

When you use any of the following parents, their `children` array must be
composed of the matching slot style (you may still nest other styles inside
each slot):

| Parent          | Child slot style |
|-----------------|------------------|
| `accordion`     | `accordion-item` |
| `tabs`          | `tab`            |
| `card`          | `card-segment`   |
| `grid`          | `grid-column`    |
| `list`          | `list-item`      |
| `progress-root` | `progress-section` |
| `timeline`      | `timeline-item`  |

### Form composition

- `form-log` (append-only submissions) and `form-record` (upsert a single
  record per user) are the canonical wrappers for data collection. Place
  every input control (`text-input`, `textarea`, `select`, `checkbox`,
  `radio`, `switch`, `chip`, `combobox`, `number-input`, `slider`,
  `range-slider`, `rating`, `color-input`, `color-picker`, `datepicker`,
  `file-input`, `rich-text-editor`) inside their `children`.
- Group logically-related fields inside a `fieldset` (itself a child of the
  form) for visual grouping.
- `text-input` and `select` render the control **without** a label. Always
  precede them with a separate `text` or `title` sibling that acts as a
  visual label, or rely on the control's `label` field when present.
- `textarea` ships with its own built-in label when
  `use_mantine_style` is `"1"` (the default).

### Reading the style catalog's relationship lines

Every style in the catalog below ends with:

- `Allowed children: (any)` — you may place any style inside (structural
  rules above still apply).
- `Allowed children: accordion-item` (etc.) — only the listed styles are
  valid children.
- `Allowed parents: card` — this style is a container-only slot and may
  only appear under the listed parent(s).

If these lines are missing, there are no relationship constraints.

---

## Tailwind design system (use these first, extend only when needed)

Every `css`/`css_mobile` string is just a space-separated Tailwind utility
list. Pair color classes with `dark:` variants on every visual element that
sits on a themed surface. Pick from the curated palette below before
inventing new combinations — it keeps pages consistent.

### Layout

- Section frame: `py-16 px-4` (desktop) with `py-10 px-4` in `css_mobile`.
- Content width: `max-w-7xl mx-auto` (marketing), `max-w-5xl mx-auto`
  (article), `max-w-3xl mx-auto` (prose/form), `max-w-xl mx-auto` (auth).
- Horizontal flow: `flex items-center justify-between gap-4`.
- Vertical rhythm: `space-y-6` (default), `space-y-10` (between major
  blocks). For Mantine `stack` use `mantine_gap`.
- Responsive grid of cards:
  `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6`.

### Surfaces & borders

- Page background: `bg-white dark:bg-gray-950` or
  `bg-gray-50 dark:bg-gray-950`.
- Card surface:
  `bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800
   rounded-xl shadow-sm hover:shadow-lg transition-shadow`.
- Subtle panel: `bg-gray-50 dark:bg-gray-900 rounded-lg p-6`.
- Radii: `rounded-md` (inputs), `rounded-lg` (cards), `rounded-2xl` (hero),
  `rounded-full` (avatars, chips).

### Typography

- Display title: `text-4xl md:text-5xl font-bold tracking-tight
   text-gray-900 dark:text-gray-50`.
- Section title: `text-2xl md:text-3xl font-semibold text-gray-900
   dark:text-gray-100`.
- Card title: `text-lg font-semibold text-gray-900 dark:text-gray-100`.
- Body: `text-base text-gray-700 dark:text-gray-300 leading-relaxed`.
- Caption / meta: `text-sm text-gray-500 dark:text-gray-400`.
- Gradient accent (sparingly):
  `bg-gradient-to-r from-blue-600 to-violet-600 dark:from-blue-400
   dark:to-violet-400 bg-clip-text text-transparent`.

### Color pairs (always both sides)

- Neutral: `text-gray-900 dark:text-gray-100`,
  `text-gray-600 dark:text-gray-400`.
- Primary action: `bg-blue-600 hover:bg-blue-700 text-white
   dark:bg-blue-500 dark:hover:bg-blue-400`.
- Success: `text-emerald-700 dark:text-emerald-400`.
- Warning: `text-amber-700 dark:text-amber-400`.
- Danger: `text-rose-700 dark:text-rose-400`.
- Muted accent strip: `bg-indigo-50 dark:bg-indigo-950/40
   text-indigo-700 dark:text-indigo-300`.

### Motion & interaction

- `transition-colors duration-200`,
  `transition-transform duration-300 hover:-translate-y-0.5`,
  `hover:shadow-lg`, `focus-visible:ring-2 focus-visible:ring-blue-500`.
- Keep animations subtle — avoid `animate-bounce`/`animate-pulse` for
  everyday content.

### Dark-mode rules of thumb

- Use `dark:` with **every** background, text, border, and shadow-on-tint
  class you write. A style that reads well in light mode but vanishes in
  dark mode will fail design review.
- Prefer `bg-gray-900`/`bg-gray-950` for dark surfaces over pure black.
- Mute saturated colors in dark mode by one shade (e.g. `text-blue-700` →
  `dark:text-blue-400`).

### Mobile overrides (`global_fields.css_mobile`)

Use `css_mobile` only when a class needs to be different on small screens,
not to repeat what Tailwind responsive prefixes already solve. Good uses:

- Tighter padding: `py-10 px-4` in `css_mobile` vs. `py-16 px-6` in `css`.
- Smaller display text: `text-3xl` in `css_mobile` vs.
  `text-4xl md:text-5xl` in `css`.
- Stack instead of flex-row: `flex-col items-start` in `css_mobile`.

---

## Recipe hints (pick one as a starting point)

- **Hero**: `container` → `stack` → [`title` (gradient display), `text`
  (body), `group` with two `button`s].
- **Feature grid**: `container` → `simple-grid` with `mantine_cols="3"` →
  three `card` entries, each with one `card-segment` holding a `title`,
  `text`, and a trailing `button`.
- **Form**: `form-record` (or `form-log`) → `fieldset` → input controls in
  a `stack`. Follow with a submit-labelled `button` or rely on the form's
  built-in submit.
- **FAQ**: `accordion` → several `accordion-item`s, each with `text`
  children.
- **Marketing list**: `list` with type `unordered` → `list-item` children
  each holding a short `text`.

---

## Dark / light theme compatibility

- Use a neutral light base (`bg-white`, `text-gray-900`) and pair each
  color-bearing class with a `dark:` variant (see the palette above).
- For images that rely on contrast (logos, icons) prefer SVG; otherwise
  pick images that read on both themes.

---

## Language policy (replacing `<LOCALES>`)

- Replace `<LOCALES>` with the real-language locales you want translations
  for — never include `all` here.
- Translatable fields (catalog tag `translatable, locale=en-GB|de-CH|...`)
  must have exactly one entry per chosen locale.
- Property fields (catalog tag `property, locale=all`) must always use the
  literal locale key `"all"`, regardless of how many real locales you listed.
- Locales must be valid DB entries (see `languages.locale`). The three
  currently registered values are `all`, `en-GB`, `de-CH`. Unknown locales
  are rejected with HTTP 422 at import time.

---

## Validation you can anticipate

The importer pre-validates the whole tree before writing anything. It returns
HTTP **422** with a list of `{path, type, detail}` errors if any of these are
violated:

- `unknown_style` — `style_name` isn't registered.
- `unknown_field` — field name isn't in the `fields` table.
- `invalid_field_for_style` — field isn't part of that style's schema.
- `unknown_locale` — locale isn't registered in `languages.locale`.
- `missing_style` / `missing_content` — required keys missing.

If you receive one of these, fix the offending node(s) and try again.

---

## Style & field catalog (auto-generated)

Everything below this line is regenerated by
`bin/console app:prompt-template:build` from the live DB schema
(`GET /cms-api/v1/admin/styles/schema`). Do not edit by hand.

<!-- CATALOG:BEGIN -->
> Catalog regenerated: 2026-04-24T18:41:43+02:00

### accordion (mantine) — can_have_children

Mantine Accordion component for collapsible content

Fields:
- mantine_accordion_chevron_position (segment, default="right", property, locale=all) — options: "left" | "right"
- mantine_accordion_chevron_size (select, default="16", property, locale=all) — options: "14" | "16" | "18" | "20" | "24" | "32"
- mantine_accordion_default_value (text, default=null, property, locale=all)
- mantine_accordion_disable_chevron_rotation (checkbox, default="0", property, locale=all)
- mantine_accordion_loop (checkbox, default="1", property, locale=all)
- mantine_accordion_multiple (checkbox, default="0", property, locale=all)
- mantine_accordion_transition_duration (select, default="200", property, locale=all) — options: "0" | "150" | "200" | "300" | "400" | "500"
- mantine_accordion_variant (select, default="default", property, locale=all) — options: "default" | "contained" | "filled" | "separated"
- mantine_radius (slider, default="sm", property, locale=all) — options: "none" | "xs" | "sm" | "md" | "lg" | "xl"
- mantine_spacing_margin_padding (mantine_spacing_margin_padding, default="", property, locale=all)
- use_mantine_style (checkbox, default="1", property, locale=all, hidden)

Allowed children: (any)

### accordion-item (mantine) — can_have_children

Mantine Accordion.Item component for individual accordion items (accepts all children, panels handled in frontend)

Fields:
- disabled (checkbox, default="0", property, locale=all)
- label (markdown-inline, default=null, translatable, locale=en-GB|de-CH|...)
- mantine_accordion_item_icon (select-icon, default=null, property, locale=all)
- mantine_accordion_item_value (text, default=null, property, locale=all)
- mantine_spacing_margin_padding (mantine_spacing_margin_padding, default="", property, locale=all)
- use_mantine_style (checkbox, default="1", property, locale=all, hidden)

Allowed children: (any)
Allowed parents: accordion

### action-icon (mantine)

Mantine ActionIcon component for interactive icons

Fields:
- disabled (checkbox, default="0", property, locale=all)
- is_link (checkbox, default="0", property, locale=all)
- mantine_action_icon_loading (checkbox, default="0", property, locale=all)
- mantine_color (color-picker, default="blue", property, locale=all) — options: "gray" | "red" | "grape" | "violet" | "blue" | "cyan" | "green" | "lime" | "yellow" | "orange"
- mantine_left_icon (select-icon, default=null, property, locale=all)
- mantine_radius (slider, default="sm", property, locale=all) — options: "none" | "xs" | "sm" | "md" | "lg" | "xl"
- mantine_size (slider, default="sm", property, locale=all) — options: "xs" | "sm" | "md" | "lg" | "xl"
- mantine_spacing_margin (mantine_spacing_margin, default="", property, locale=all)
- mantine_variant (select, default="subtle", property, locale=all) — options: "filled" | "light" | "outline" | "subtle" | "default" | "transparent" | "white"
- open_in_new_tab (checkbox, default="0", property, locale=all)
- page_keyword (select-page-keyword, default="#", property, locale=all)
- use_mantine_style (checkbox, default="1", property, locale=all, hidden)

### alert (mantine) — can_have_children

Mantine Alert component for displaying important messages and notifications

Fields:
- content (textarea, default=null, translatable, locale=en-GB|de-CH|...)
- mantine_alert_title (text, default=null, translatable, locale=en-GB|de-CH|...)
- mantine_alert_with_close_button (checkbox, default="0", property, locale=all)
- mantine_color (color-picker, default="blue", property, locale=all) — options: "gray" | "red" | "grape" | "violet" | "blue" | "cyan" | "green" | "lime" | "yellow" | "orange"
- mantine_left_icon (select-icon, default=null, property, locale=all)
- mantine_radius (slider, default="sm", property, locale=all) — options: "none" | "xs" | "sm" | "md" | "lg" | "xl"
- mantine_size (slider, default="md", property, locale=all) — options: "xs" | "sm" | "md" | "lg" | "xl"
- mantine_spacing_margin_padding (mantine_spacing_margin_padding, default="", property, locale=all)
- mantine_variant (select, default="light", property, locale=all) — options: "filled" | "light" | "outline" | "subtle" | "default" | "transparent" | "white"
- mantine_with_close_button (checkbox, default="0", property, locale=all)
- use_mantine_style (checkbox, default="1", property, locale=all, hidden)
- value (text, default=null, property, locale=all)

Allowed children: (any)

### aspect-ratio (mantine) — can_have_children

Mantine AspectRatio component for maintaining aspect ratios

Fields:
- mantine_aspect_ratio (select, default="16/9", property, locale=all) — options: "16/9" | "4/3" | "1/1" | "21/9" | "3/2" | "9/16"
- mantine_spacing_margin (mantine_spacing_margin, default="", property, locale=all)
- use_mantine_style (checkbox, default="1", property, locale=all, hidden)

Allowed children: (any)

### audio (Media)

allows to load and replay an audio source on a page.

Fields:
- alt (text, default=null, translatable, locale=en-GB|de-CH|...)
- mantine_spacing_margin (mantine_spacing_margin, default="", property, locale=all)
- sources (json, default=null, translatable, locale=en-GB|de-CH|...)

### avatar (mantine)

Mantine Avatar component for user profile images

Fields:
- alt (text, default="Avatar", translatable, locale=en-GB|de-CH|...)
- img_src (select-image, default=null, translatable, locale=en-GB|de-CH|...)
- mantine_avatar_initials (text, default="U", property, locale=all)
- mantine_color (color-picker, default="blue", property, locale=all) — options: "gray" | "red" | "grape" | "violet" | "blue" | "cyan" | "green" | "lime" | "yellow" | "orange"
- mantine_left_icon (select-icon, default=null, property, locale=all)
- mantine_radius (slider, default="50%", property, locale=all) — options: "none" | "xs" | "sm" | "md" | "lg" | "xl"
- mantine_size (slider, default="sm", property, locale=all) — options: "xs" | "sm" | "md" | "lg" | "xl"
- mantine_spacing_margin (mantine_spacing_margin, default="", property, locale=all)
- mantine_variant (select, default="light", property, locale=all) — options: "filled" | "light" | "outline" | "subtle" | "default" | "transparent" | "white"
- use_mantine_style (checkbox, default="1", property, locale=all, hidden)

### background-image (mantine) — can_have_children

Mantine background-image component for background images

Fields:
- img_src (select-image, default=null, translatable, locale=en-GB|de-CH|...)
- mantine_radius (slider, default="sm", property, locale=all) — options: "none" | "xs" | "sm" | "md" | "lg" | "xl"
- mantine_spacing_margin_padding (mantine_spacing_margin_padding, default="", property, locale=all)
- use_mantine_style (checkbox, default="1", property, locale=all, hidden)

Allowed children: (any)

### badge (mantine)

Mantine Badge component for status indicators and labels

Fields:
- label (markdown-inline, default=null, translatable, locale=en-GB|de-CH|...)
- mantine_auto_contrast (checkbox, default="0", property, locale=all)
- mantine_color (color-picker, default="blue", property, locale=all) — options: "gray" | "red" | "grape" | "violet" | "blue" | "cyan" | "green" | "lime" | "yellow" | "orange"
- mantine_left_icon (select-icon, default=null, property, locale=all)
- mantine_radius (slider, default="xl", property, locale=all) — options: "none" | "xs" | "sm" | "md" | "lg" | "xl"
- mantine_right_icon (select-icon, default=null, property, locale=all)
- mantine_size (slider, default="sm", property, locale=all) — options: "xs" | "sm" | "md" | "lg" | "xl"
- mantine_spacing_margin (mantine_spacing_margin, default="", property, locale=all)
- mantine_variant (select, default="filled", property, locale=all) — options: "filled" | "light" | "outline" | "subtle" | "default" | "transparent" | "white"
- use_mantine_style (checkbox, default="1", property, locale=all, hidden)

### blockquote (mantine)

Mantine Blockquote component for quoted text

Fields:
- cite (text, default=null, translatable, locale=en-GB|de-CH|...)
- content (textarea, default=null, translatable, locale=en-GB|de-CH|...)
- mantine_color (color-picker, default="gray", property, locale=all) — options: "gray" | "red" | "grape" | "violet" | "blue" | "cyan" | "green" | "lime" | "yellow" | "orange"
- mantine_icon_size (select, default="20", property, locale=all) — options: "14" | "16" | "18" | "20" | "24" | "32"
- mantine_left_icon (select-icon, default=null, property, locale=all)
- mantine_spacing_margin_padding (mantine_spacing_margin_padding, default="", property, locale=all)
- use_mantine_style (checkbox, default="1", property, locale=all, hidden)

### box (mantine) — can_have_children

Mantine Box component as a base for all Mantine components with style props support

Fields:
- content (textarea, default="", translatable, locale=en-GB|de-CH|...)
- mantine_spacing_margin_padding (mantine_spacing_margin_padding, default="", property, locale=all)
- use_mantine_style (checkbox, default="1", property, locale=all, hidden)

Allowed children: (any)

### button (Link)

renders a button-style link with several predefined colour schemes.

Fields:
- confirmation_continue (text, default="OK", translatable, locale=en-GB|de-CH|...)
- confirmation_message (textarea, default="Do you want to continue?", translatable, locale=en-GB|de-CH|...)
- confirmation_title (text, default="", translatable, locale=en-GB|de-CH|...)
- disabled (checkbox, default="0", property, locale=all)
- is_link (checkbox, default="0", property, locale=all)
- label (markdown-inline, default=null, translatable, locale=en-GB|de-CH|...)
- label_cancel (text, default="", translatable, locale=en-GB|de-CH|...)
- mantine_auto_contrast (checkbox, default="0", property, locale=all)
- mantine_color (color-picker, default="blue", property, locale=all) — options: "gray" | "red" | "grape" | "violet" | "blue" | "cyan" | "green" | "lime" | "yellow" | "orange"
- mantine_compact (checkbox, default="0", property, locale=all)
- mantine_fullwidth (checkbox, default="0", property, locale=all)
- mantine_left_icon (select-icon, default=null, property, locale=all)
- mantine_radius (slider, default="sm", property, locale=all) — options: "none" | "xs" | "sm" | "md" | "lg" | "xl"
- mantine_right_icon (select-icon, default=null, property, locale=all)
- mantine_size (slider, default="sm", property, locale=all) — options: "xs" | "sm" | "md" | "lg" | "xl"
- mantine_spacing_margin (mantine_spacing_margin, default="", property, locale=all)
- mantine_variant (select, default="filled", property, locale=all) — options: "filled" | "light" | "outline" | "subtle" | "default" | "transparent" | "white"
- open_in_new_tab (checkbox, default="0", property, locale=all)
- page_keyword (select-page-keyword, default="#", property, locale=all)
- use_mantine_style (checkbox, default="1", property, locale=all, hidden)

### card (mantine) — can_have_children

Card container component with Mantine styling

Fields:
- mantine_border (checkbox, default="0", property, locale=all)
- mantine_card_padding (slider, default="sm", property, locale=all) — options: "none" | "xs" | "sm" | "md" | "lg" | "xl"
- mantine_card_shadow (slider, default="sm", property, locale=all) — options: "none" | "xs" | "sm" | "md" | "lg" | "xl"
- mantine_radius (slider, default="sm", property, locale=all) — options: "none" | "xs" | "sm" | "md" | "lg" | "xl"
- mantine_spacing_margin_padding (mantine_spacing_margin_padding, default="", property, locale=all)
- use_mantine_style (checkbox, default="1", property, locale=all, hidden)

Allowed children: (any)

### card-segment (mantine) — can_have_children

Card segment component for organizing card content

Fields:
- mantine_spacing_margin_padding (mantine_spacing_margin_padding, default="", property, locale=all)

Allowed children: (any)
Allowed parents: card

### carousel (mantine) — can_have_children

Mantine Carousel component for displaying content in a slideshow format

Fields:
- drag_free (checkbox, default="0", property, locale=all)
- has_controls (checkbox, default="1", property, locale=all)
- has_indicators (checkbox, default="1", property, locale=all)
- mantine_carousel_align (segment, default="start", property, locale=all) — options: "start" | "center" | "end"
- mantine_carousel_contain_scroll (segment, default="trimSnaps", property, locale=all) — options: "auto" | "trimSnaps" | "keepSnaps"
- mantine_carousel_controls_offset (slider, default="sm", property, locale=all) — options: "xs" | "sm" | "md" | "lg" | "xl"
- mantine_carousel_duration (select, default="25", property, locale=all) — options: "10" | "25" | "50" | "100" | "150" | "200" | "0"
- mantine_carousel_embla_options (json, default=null, property, locale=all)
- mantine_carousel_in_view_threshold (slider, default="0", property, locale=all)
- mantine_carousel_next_control_icon (select-icon, default=null, property, locale=all)
- mantine_carousel_previous_control_icon (select-icon, default=null, property, locale=all)
- mantine_carousel_slide_gap (slider, default="sm", property, locale=all) — options: "xs" | "sm" | "md" | "lg" | "xl"
- mantine_carousel_slide_size (slider, default="100", property, locale=all)
- mantine_control_size (select, default="26", property, locale=all) — options: "14" | "16" | "18" | "20" | "24" | "32"
- mantine_height (select, default=null, property, locale=all) — options: "25%" | "50%" | "75%" | "100%" | "auto" | "fit-content" | "max-content" | "min-content"
- mantine_loop (checkbox, default="0", property, locale=all)
- mantine_orientation (segment, default="horizontal", property, locale=all) — options: "horizontal" | "vertical"
- mantine_spacing_margin_padding (mantine_spacing_margin_padding, default="", property, locale=all)
- skip_snaps (checkbox, default="0", property, locale=all)
- use_mantine_style (checkbox, default="1", property, locale=all, hidden)

Allowed children: (any)

### center (mantine) — can_have_children

Mantine Center component for centering content

Fields:
- mantine_center_inline (checkbox, default="0", property, locale=all)
- mantine_height (select, default=null, property, locale=all) — options: "25%" | "50%" | "75%" | "100%" | "auto" | "fit-content" | "max-content" | "min-content"
- mantine_mah (select, default=null, property, locale=all) — options: "25%" | "50%" | "75%" | "100%" | "200px" | "300px" | "400px" | "500px" | "600px" | "800px" | "1000px"
- mantine_maw (select, default=null, property, locale=all) — options: "25%" | "50%" | "75%" | "100%" | "200px" | "300px" | "400px" | "500px" | "600px" | "800px" | "1000px"
- mantine_mih (select, default=null, property, locale=all) — options: "0" | "25%" | "50%" | "100%" | "200px" | "300px" | "400px" | "500px"
- mantine_miw (select, default=null, property, locale=all) — options: "0" | "25%" | "50%" | "100%" | "200px" | "300px" | "400px" | "500px"
- mantine_spacing_margin_padding (mantine_spacing_margin_padding, default="", property, locale=all)
- mantine_width (select, default=null, property, locale=all) — options: "25%" | "50%" | "75%" | "100%" | "auto" | "fit-content" | "max-content" | "min-content"

Allowed children: (any)

### checkbox (mantine)

Mantine Checkbox component for boolean input with customizable styling

Fields:
- checkbox_value (text, default="1", property, locale=all)
- description (textarea, default=null, translatable, locale=en-GB|de-CH|...)
- disabled (checkbox, default="0", property, locale=all)
- is_required (checkbox, default="0", property, locale=all)
- label (markdown-inline, default=null, translatable, locale=en-GB|de-CH|...)
- locked_after_submit (checkbox, default="0", property, locale=all)
- mantine_checkbox_checked (checkbox, default="0", property, locale=all)
- mantine_checkbox_icon (select-icon, default=null, property, locale=all)
- mantine_checkbox_indeterminate (checkbox, default="0", property, locale=all)
- mantine_checkbox_labelPosition (segment, default="right", property, locale=all) — options: "right" | "left"
- mantine_color (color-picker, default=null, property, locale=all) — options: "gray" | "red" | "grape" | "violet" | "blue" | "cyan" | "green" | "lime" | "yellow" | "orange"
- mantine_radius (slider, default="sm", property, locale=all) — options: "none" | "xs" | "sm" | "md" | "lg" | "xl"
- mantine_size (slider, default="sm", property, locale=all) — options: "xs" | "sm" | "md" | "lg" | "xl"
- mantine_spacing_margin (mantine_spacing_margin, default="", property, locale=all)
- mantine_use_input_wrapper (checkbox, default="0", property, locale=all)
- name (text, default=null, property, locale=all)
- toggle_switch (checkbox, default="0", property, locale=all)
- use_mantine_style (checkbox, default="1", property, locale=all, hidden)
- value (text, default=null, property, locale=all)

### chip (mantine)

Mantine Chip component for selectable tags

Fields:
- chip_checked (checkbox, default="0", property, locale=all)
- chip_off_value (text, default="0", property, locale=all)
- chip_on_value (text, default="1", property, locale=all)
- disabled (checkbox, default="0", property, locale=all)
- is_required (checkbox, default="0", property, locale=all)
- label (markdown-inline, default=null, translatable, locale=en-GB|de-CH|...)
- mantine_chip_variant (select, default="filled", property, locale=all) — options: "filled" | "outline" | "light"
- mantine_color (color-picker, default="blue", property, locale=all) — options: "gray" | "red" | "grape" | "violet" | "blue" | "cyan" | "green" | "lime" | "yellow" | "orange"
- mantine_icon_size (select, default="16", property, locale=all) — options: "14" | "16" | "18" | "20" | "24" | "32"
- mantine_left_icon (select-icon, default=null, property, locale=all)
- mantine_radius (slider, default="sm", property, locale=all) — options: "none" | "xs" | "sm" | "md" | "lg" | "xl"
- mantine_size (slider, default="sm", property, locale=all) — options: "xs" | "sm" | "md" | "lg" | "xl"
- mantine_spacing_margin (mantine_spacing_margin, default="", property, locale=all)
- mantine_tooltip_position (select, default="top", property, locale=all) — options: "top" | "bottom" | "left" | "right" | "top-start" | "top-end" | "bottom-start" | "bottom-end" | "left-start" | "left-end" | "right-start" | "right-end"
- name (text, default=null, property, locale=all)
- use_mantine_style (checkbox, default="1", property, locale=all, hidden)
- value (text, default=null, property, locale=all)

### code (mantine)

Mantine Code component for inline code display

Fields:
- content (textarea, default=null, translatable, locale=en-GB|de-CH|...)
- mantine_code_block (checkbox, default="0", property, locale=all)
- mantine_color (color-picker, default="gray", property, locale=all) — options: "gray" | "red" | "grape" | "violet" | "blue" | "cyan" | "green" | "lime" | "yellow" | "orange"
- mantine_spacing_margin_padding (mantine_spacing_margin_padding, default="", property, locale=all)
- use_mantine_style (checkbox, default="1", property, locale=all, hidden)

### color-input (mantine)

Mantine color-input component for color selection

Fields:
- description (textarea, default="", translatable, locale=en-GB|de-CH|...)
- disabled (checkbox, default="0", property, locale=all)
- is_required (checkbox, default="0", property, locale=all)
- label (markdown-inline, default="", translatable, locale=en-GB|de-CH|...)
- mantine_color_format (segment, default="hex", property, locale=all) — options: "hex" | "rgba" | "hsla"
- mantine_radius (slider, default="sm", property, locale=all) — options: "none" | "xs" | "sm" | "md" | "lg" | "xl"
- mantine_size (slider, default="sm", property, locale=all) — options: "xs" | "sm" | "md" | "lg" | "xl"
- mantine_spacing_margin (mantine_spacing_margin, default="", property, locale=all)
- name (text, default="", property, locale=all)
- placeholder (text, default="Pick a color", translatable, locale=en-GB|de-CH|...)
- use_mantine_style (checkbox, default="1", property, locale=all, hidden)
- value (text, default="", property, locale=all)

### color-picker (mantine)

Mantine color-picker component for color selection

Fields:
- description (textarea, default="", translatable, locale=en-GB|de-CH|...)
- is_required (checkbox, default="0", property, locale=all)
- label (markdown-inline, default="", translatable, locale=en-GB|de-CH|...)
- mantine_color_format (segment, default="hex", property, locale=all) — options: "hex" | "rgba" | "hsla"
- mantine_color_picker_alpha_label (text, default="Alpha", translatable, locale=en-GB|de-CH|...)
- mantine_color_picker_hue_label (text, default="Hue", translatable, locale=en-GB|de-CH|...)
- mantine_color_picker_saturation_label (text, default="Saturation", translatable, locale=en-GB|de-CH|...)
- mantine_color_picker_swatches (textarea, default="[\"#2e2e2e\", \"#868e96\", \"#fa5252\", \"#e64980\", \"#be4bdb\", \"#7950f2\", \"#4c6ef5\", \"#228be6\"]", property, locale=all)
- mantine_color_picker_swatches_per_row (slider, default="7", property, locale=all) — options: "3" | "4" | "5" | "6" | "7" | "8"
- mantine_fullwidth (checkbox, default="0", property, locale=all)
- mantine_size (slider, default="sm", property, locale=all) — options: "xs" | "sm" | "md" | "lg" | "xl"
- mantine_spacing_margin (mantine_spacing_margin, default="", property, locale=all)
- name (text, default="", property, locale=all)
- use_mantine_style (checkbox, default="1", property, locale=all, hidden)
- value (text, default="", property, locale=all)

### combobox (mantine)

Mantine Combobox component for advanced select inputs

Fields:
- description (textarea, default="", translatable, locale=en-GB|de-CH|...)
- disabled (checkbox, default="0", property, locale=all)
- is_required (checkbox, default="0", property, locale=all)
- label (markdown-inline, default="", translatable, locale=en-GB|de-CH|...)
- mantine_combobox_clearable (checkbox, default="0", property, locale=all)
- mantine_combobox_creatable (checkbox, default="0", property, locale=all)
- mantine_combobox_multi_select (checkbox, default="0", property, locale=all)
- mantine_combobox_options (json, default="[{\"value\":\"option1\",\"text\":\"Option 1\"},{\"value\":\"option2\",\"text\":\"Option 2\"}]", translatable, locale=en-GB|de-CH|...)
- mantine_combobox_searchable (checkbox, default="1", property, locale=all)
- mantine_combobox_separator (text, default=" ", property, locale=all)
- mantine_multi_select_max_values (select, default=null, property, locale=all) — options: "3" | "5" | "10" | "25"
- mantine_spacing_margin (mantine_spacing_margin, default="", property, locale=all)
- name (text, default="", property, locale=all)
- placeholder (text, default="Select option", translatable, locale=en-GB|de-CH|...)
- use_mantine_style (checkbox, default="1", property, locale=all, hidden)
- value (text, default="", property, locale=all)

### container (mantine) — can_have_children

Mantine Container component for responsive layout containers

Fields:
- mantine_fluid (checkbox, default="0", property, locale=all)
- mantine_px (slider, default=null, property, locale=all) — options: "none" | "xs" | "sm" | "md" | "lg" | "xl"
- mantine_py (slider, default=null, property, locale=all) — options: "none" | "xs" | "sm" | "md" | "lg" | "xl"
- mantine_size (slider, default=null, property, locale=all) — options: "xs" | "sm" | "md" | "lg" | "xl"
- mantine_spacing_margin_padding (mantine_spacing_margin_padding, default="", property, locale=all)
- use_mantine_style (checkbox, default="1", property, locale=all, hidden)

Allowed children: (any)

### dataContainer (Wrapper) — can_have_children

Data container style which propagate all loaded data to its children.

Fields:
- scope (text, default="", property, locale=all)

Allowed children: (any)

### datepicker (mantine)

Mantine DatePicker component for date, time, and datetime input with comprehensive formatting options

Fields:
- description (textarea, default=null, translatable, locale=en-GB|de-CH|...)
- disabled (checkbox, default="0", property, locale=all)
- is_required (checkbox, default="0", property, locale=all)
- label (markdown-inline, default=null, translatable, locale=en-GB|de-CH|...)
- mantine_datepicker_allow_deseselect (checkbox, default="0", property, locale=all)
- mantine_datepicker_clearable (checkbox, default="0", property, locale=all)
- mantine_datepicker_consistent_weeks (checkbox, default="0", property, locale=all)
- mantine_datepicker_date_format (select, default="YYYY-MM-DD", property, locale=all) — options: "YYYY-MM-DD" | "MM/DD/YYYY" | "DD/MM/YYYY" | "DD.MM.YYYY" | "MMM DD, YYYY" | "DD MMM YYYY"
- mantine_datepicker_first_day_of_week (segment, default="1", property, locale=all) — options: "0" | "1" | "2" | "3" | "4" | "5" | "6"
- mantine_datepicker_format (select, default=null, property, locale=all) — options: "YYYY-MM-DD" | "MM/DD/YYYY" | "DD/MM/YYYY" | "DD.MM.YYYY" | "MMM DD, YYYY" | "DD MMM YYYY"
- mantine_datepicker_hide_outside_dates (checkbox, default="0", property, locale=all)
- mantine_datepicker_hide_weekends (checkbox, default="0", property, locale=all)
- mantine_datepicker_locale (text, default="en", property, locale=all)
- mantine_datepicker_max_date (text, default=null, property, locale=all)
- mantine_datepicker_min_date (text, default=null, property, locale=all)
- mantine_datepicker_placeholder (text, default=null, translatable, locale=en-GB|de-CH|...)
- mantine_datepicker_readonly (checkbox, default="0", property, locale=all)
- mantine_datepicker_time_format (segment, default="24", property, locale=all) — options: "12" | "24"
- mantine_datepicker_time_grid_config (textarea, default=null, property, locale=all)
- mantine_datepicker_time_step (segment, default="15", property, locale=all) — options: "1" | "5" | "10" | "15" | "30" | "60"
- mantine_datepicker_type (segment, default="date", property, locale=all) — options: "date" | "time" | "datetime"
- mantine_datepicker_weekend_days (text, default="[0,6]", property, locale=all)
- mantine_datepicker_with_seconds (checkbox, default="0", property, locale=all)
- mantine_datepicker_with_time_grid (checkbox, default="0", property, locale=all)
- mantine_spacing_margin (mantine_spacing_margin, default="", property, locale=all)
- name (text, default=null, property, locale=all)
- value (text, default=null, property, locale=all)

### divider (mantine)

Mantine Divider component for visual separation

Fields:
- mantine_color (color-picker, default="gray", property, locale=all) — options: "gray" | "red" | "grape" | "violet" | "blue" | "cyan" | "green" | "lime" | "yellow" | "orange"
- mantine_divider_label (text, default=null, translatable, locale=en-GB|de-CH|...)
- mantine_divider_label_position (select, default="center", property, locale=all) — options: "left" | "center" | "right"
- mantine_divider_variant (select, default="solid", property, locale=all) — options: "solid" | "dashed" | "dotted"
- mantine_orientation (segment, default="horizontal", property, locale=all) — options: "horizontal" | "vertical"
- mantine_size (slider, default="sm", property, locale=all) — options: "xs" | "sm" | "md" | "lg" | "xl"
- mantine_spacing_margin (mantine_spacing_margin, default="", property, locale=all)
- use_mantine_style (checkbox, default="1", property, locale=all, hidden)

### entryList (Wrapper) — can_have_children

Wrap other styles that later visualize list of entries (inserted via `formUserInput`).

Fields:
- data_table (select-data_table, default="", property, locale=all)
- filter (code, default=null, property, locale=all)
- load_as_table (checkbox, default="0", property, locale=all)
- own_entries_only (checkbox, default="1", property, locale=all)
- scope (text, default="", property, locale=all)

Allowed children: (any)

### entryRecord (Wrapper) — can_have_children

Wrap other styles that later visualize a record from the entry list

Fields:
- data_table (select-data_table, default="", property, locale=all)
- filter (code, default=null, property, locale=all)
- own_entries_only (checkbox, default="1", property, locale=all)
- scope (text, default="", property, locale=all)
- url_param (text, default="record_id", property, locale=all)

Allowed children: (any)

### entryRecordDelete (Wrapper)

Style that allows the user to delete entry record

Fields:
- confirmation_cancel (markdown-inline, default="", translatable, locale=en-GB|de-CH|...)
- confirmation_continue (text, default="OK", translatable, locale=en-GB|de-CH|...)
- confirmation_message (textarea, default="Do you want to continue?", translatable, locale=en-GB|de-CH|...)
- confirmation_title (text, default="", translatable, locale=en-GB|de-CH|...)
- label_delete (text, default="Delete", translatable, locale=en-GB|de-CH|...)
- own_entries_only (checkbox, default="1", property, locale=all)
- type (style-bootstrap, default="danger", property, locale=all)

### fieldset (mantine) — can_have_children

Mantine Fieldset component for grouping form elements

Fields:
- disabled (checkbox, default="0", property, locale=all)
- label (markdown-inline, default=null, translatable, locale=en-GB|de-CH|...)
- mantine_fieldset_variant (select, default="default", property, locale=all) — options: "default" | "filled" | "unstyled"
- mantine_radius (slider, default="sm", property, locale=all) — options: "none" | "xs" | "sm" | "md" | "lg" | "xl"
- mantine_spacing_margin_padding (mantine_spacing_margin_padding, default="", property, locale=all)
- use_mantine_style (checkbox, default="1", property, locale=all, hidden)

Allowed children: (any)

### figure (Media) — can_have_children

allows to attach a caption to media elements. A figure expects a media style as its immediate child.

Fields:
- caption (markdown-inline, default=null, translatable, locale=en-GB|de-CH|...)
- caption_title (text, default=null, translatable, locale=en-GB|de-CH|...)
- mantine_spacing_margin (mantine_spacing_margin, default="", property, locale=all)

Allowed children: (any)

### file-input (mantine)

Mantine FileInput component for file uploads

Fields:
- description (textarea, default=null, translatable, locale=en-GB|de-CH|...)
- disabled (checkbox, default="0", property, locale=all)
- is_required (checkbox, default="0", property, locale=all)
- label (markdown-inline, default=null, translatable, locale=en-GB|de-CH|...)
- mantine_file_input_accept (select, default=null, property, locale=all) — options: "image/*" | "image/png,image/jpeg,image/gif" | "image/png" | "image/jpeg" | "image/webp" | "audio/*" | "video/*" | ".pdf" | ".doc,.docx" | ".xls,.xlsx" | ".ppt,.pptx" | ".txt" | ".zip,.rar" | "application/json" | "text/csv"
- mantine_file_input_clearable (checkbox, default="1", property, locale=all)
- mantine_file_input_drag_drop (checkbox, default="0", property, locale=all)
- mantine_file_input_max_files (select, default=null, property, locale=all) — options: "1" | "3" | "5" | "10" | "20" | "50" | "100"
- mantine_file_input_max_size (select, default=null, property, locale=all) — options: "1024" | "10240" | "102400" | "524288" | "1048576" | "2097152" | "5242880" | "10485760" | "20971520" | "52428800" | "104857600"
- mantine_file_input_multiple (checkbox, default="0", property, locale=all)
- mantine_left_icon (select-icon, default=null, property, locale=all)
- mantine_radius (slider, default="sm", property, locale=all) — options: "none" | "xs" | "sm" | "md" | "lg" | "xl"
- mantine_right_icon (select-icon, default=null, property, locale=all)
- mantine_size (slider, default="sm", property, locale=all) — options: "xs" | "sm" | "md" | "lg" | "xl"
- mantine_spacing_margin (mantine_spacing_margin, default="", property, locale=all)
- name (text, default=null, property, locale=all)
- placeholder (text, default="Select files", translatable, locale=en-GB|de-CH|...)
- use_mantine_style (checkbox, default="1", property, locale=all, hidden)

### flex (mantine) — can_have_children

Mantine Flex component for flexible layouts

Fields:
- mantine_align (select, default=null, property, locale=all) — options: "flex-start" | "center" | "flex-end" | "stretch" | "baseline"
- mantine_direction (segment, default="row", property, locale=all) — options: "row" | "column" | "row-reverse" | "column-reverse"
- mantine_gap (slider, default="sm", property, locale=all) — options: "0" | "xs" | "sm" | "md" | "lg" | "xl"
- mantine_height (select, default=null, property, locale=all) — options: "25%" | "50%" | "75%" | "100%" | "auto" | "fit-content" | "max-content" | "min-content"
- mantine_justify (select, default=null, property, locale=all) — options: "flex-start" | "center" | "flex-end" | "space-between" | "space-around" | "space-evenly"
- mantine_spacing_margin_padding (mantine_spacing_margin_padding, default="", property, locale=all)
- mantine_width (select, default=null, property, locale=all) — options: "25%" | "50%" | "75%" | "100%" | "auto" | "fit-content" | "max-content" | "min-content"
- mantine_wrap (segment, default="nowrap", property, locale=all) — options: "wrap" | "nowrap" | "wrap-reverse"
- use_mantine_style (checkbox, default="1", property, locale=all, hidden)

Allowed children: (any)

### form-log (Form) — can_have_children

Log form component that clears data after successful submission. Supports multiple entries and form validation.

Fields:
- alert_error (textarea, default="An error occurred while submitting the form", translatable, locale=en-GB|de-CH|...)
- alert_success (text, default="", translatable, locale=en-GB|de-CH|...)
- btn_cancel_label (text, default="Cancel", translatable, locale=en-GB|de-CH|...)
- btn_cancel_url (select-page-keyword, default=null, property, locale=all)
- btn_save_label (text, default="Save", translatable, locale=en-GB|de-CH|...)
- is_log (checkbox, default="1", property, locale=all, hidden)
- mantine_btn_cancel_color (color-picker, default="gray", property, locale=all) — options: "gray" | "red" | "grape" | "violet" | "blue" | "cyan" | "green" | "lime" | "yellow" | "orange"
- mantine_btn_save_color (color-picker, default="blue", property, locale=all) — options: "gray" | "red" | "grape" | "violet" | "blue" | "cyan" | "green" | "lime" | "yellow" | "orange"
- mantine_buttons_order (segment, default="save-cancel", property, locale=all) — options: "save-cancel" | "cancel-save"
- mantine_buttons_position (select, default="space-between", property, locale=all) — options: "space-between" | "center" | "flex-end" | "flex-start"
- mantine_buttons_radius (slider, default="sm", property, locale=all) — options: "none" | "xs" | "sm" | "md" | "lg" | "xl"
- mantine_buttons_size (slider, default="sm", property, locale=all) — options: "xs" | "sm" | "md" | "lg" | "xl"
- mantine_buttons_variant (select, default="filled", property, locale=all) — options: "filled" | "light" | "outline" | "transparent" | "white" | "subtle" | "gradient"
- mantine_spacing_margin_padding (mantine_spacing_margin_padding, default="", property, locale=all)
- name (text, default=null, property, locale=all)
- redirect_at_end (select-page-keyword, default=null, property, locale=all)
- use_mantine_style (checkbox, default="1", property, locale=all, hidden)

Allowed children: (any)

### form-record (Form) — can_have_children

Record form component that preserves data and updates existing records. Pre-populates fields with existing data.

Fields:
- alert_error (textarea, default="An error occurred while saving the record", translatable, locale=en-GB|de-CH|...)
- alert_success (text, default="", translatable, locale=en-GB|de-CH|...)
- btn_cancel_label (text, default="Cancel", translatable, locale=en-GB|de-CH|...)
- btn_cancel_url (select-page-keyword, default=null, property, locale=all)
- btn_save_label (text, default="Save", translatable, locale=en-GB|de-CH|...)
- btn_update_label (text, default="Update", translatable, locale=en-GB|de-CH|...)
- is_log (checkbox, default="0", property, locale=all, hidden)
- mantine_btn_cancel_color (color-picker, default="gray", property, locale=all) — options: "gray" | "red" | "grape" | "violet" | "blue" | "cyan" | "green" | "lime" | "yellow" | "orange"
- mantine_btn_save_color (color-picker, default="blue", property, locale=all) — options: "gray" | "red" | "grape" | "violet" | "blue" | "cyan" | "green" | "lime" | "yellow" | "orange"
- mantine_btn_update_color (color-picker, default="orange", property, locale=all) — options: "gray" | "red" | "grape" | "violet" | "blue" | "cyan" | "green" | "lime" | "yellow" | "orange"
- mantine_buttons_order (segment, default="save-cancel", property, locale=all) — options: "save-cancel" | "cancel-save"
- mantine_buttons_position (select, default="space-between", property, locale=all) — options: "space-between" | "center" | "flex-end" | "flex-start"
- mantine_buttons_radius (slider, default="sm", property, locale=all) — options: "none" | "xs" | "sm" | "md" | "lg" | "xl"
- mantine_buttons_size (slider, default="sm", property, locale=all) — options: "xs" | "sm" | "md" | "lg" | "xl"
- mantine_buttons_variant (select, default="filled", property, locale=all) — options: "filled" | "light" | "outline" | "transparent" | "white" | "subtle" | "gradient"
- mantine_spacing_margin_padding (mantine_spacing_margin_padding, default="", property, locale=all)
- name (text, default=null, property, locale=all)
- redirect_at_end (select-page-keyword, default=null, property, locale=all)
- use_mantine_style (checkbox, default="1", property, locale=all)

Allowed children: (any)

### grid (mantine)

Mantine Grid component for responsive 12 columns grid system

Fields:
- mantine_align (select, default=null, property, locale=all) — options: "flex-start" | "center" | "flex-end" | "stretch" | "baseline"
- mantine_cols (slider, default="12", property, locale=all) — options: "1" | "2" | "3" | "4" | "5" | "6"
- mantine_gap (slider, default="sm", property, locale=all) — options: "0" | "xs" | "sm" | "md" | "lg" | "xl"
- mantine_grid_overflow (segment, default="visible", property, locale=all) — options: "visible" | "hidden"
- mantine_height (select, default=null, property, locale=all) — options: "25%" | "50%" | "75%" | "100%" | "auto" | "fit-content" | "max-content" | "min-content"
- mantine_justify (select, default=null, property, locale=all) — options: "flex-start" | "center" | "flex-end" | "space-between" | "space-around" | "space-evenly"
- mantine_spacing_margin_padding (mantine_spacing_margin_padding, default="", property, locale=all)
- mantine_width (select, default=null, property, locale=all) — options: "25%" | "50%" | "75%" | "100%" | "auto" | "fit-content" | "max-content" | "min-content"
- use_mantine_style (checkbox, default="1", property, locale=all, hidden)

Allowed children: grid-column

### grid-column (mantine) — can_have_children

Mantine Grid.Col component for grid column with span, offset, and order controls

Fields:
- mantine_grid_grow (checkbox, default="0", property, locale=all)
- mantine_grid_offset (slider, default="0", property, locale=all) — options: "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "10" | "11"
- mantine_grid_order (slider, default=null, property, locale=all) — options: "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "10" | "11" | "12"
- mantine_grid_span (slider, default="1", property, locale=all) — options: "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "10" | "11" | "12" | "auto" | "content"
- mantine_height (select, default=null, property, locale=all) — options: "25%" | "50%" | "75%" | "100%" | "auto" | "fit-content" | "max-content" | "min-content"
- mantine_spacing_margin_padding (mantine_spacing_margin_padding, default="", property, locale=all)
- mantine_width (select, default=null, property, locale=all) — options: "25%" | "50%" | "75%" | "100%" | "auto" | "fit-content" | "max-content" | "min-content"
- use_mantine_style (checkbox, default="1", property, locale=all, hidden)

Allowed children: (any)
Allowed parents: grid

### group (mantine) — can_have_children

Mantine Group component for horizontal layouts

Fields:
- mantine_align (select, default=null, property, locale=all) — options: "flex-start" | "center" | "flex-end" | "stretch" | "baseline"
- mantine_gap (slider, default="sm", property, locale=all) — options: "0" | "xs" | "sm" | "md" | "lg" | "xl"
- mantine_group_grow (checkbox, default="0", property, locale=all)
- mantine_group_wrap (segment, default="0", property, locale=all) — options: "0" | "1"
- mantine_height (select, default=null, property, locale=all) — options: "25%" | "50%" | "75%" | "100%" | "auto" | "fit-content" | "max-content" | "min-content"
- mantine_justify (select, default=null, property, locale=all) — options: "flex-start" | "center" | "flex-end" | "space-between" | "space-around" | "space-evenly"
- mantine_spacing_margin_padding (mantine_spacing_margin_padding, default="", property, locale=all)
- mantine_width (select, default=null, property, locale=all) — options: "25%" | "50%" | "75%" | "100%" | "auto" | "fit-content" | "max-content" | "min-content"
- use_mantine_style (checkbox, default="1", property, locale=all, hidden)

Allowed children: (any)

### highlight (mantine)

Mantine Highlight component for text highlighting

Fields:
- mantine_color (color-picker, default="yellow", property, locale=all) — options: "gray" | "red" | "grape" | "violet" | "blue" | "cyan" | "green" | "lime" | "yellow" | "orange"
- mantine_highlight_highlight (text, default="highlight", translatable, locale=en-GB|de-CH|...)
- mantine_spacing_margin_padding (mantine_spacing_margin_padding, default="", property, locale=all)
- text (textarea, default="Highlight some text in this content", translatable, locale=en-GB|de-CH|...)
- use_mantine_style (checkbox, default="1", property, locale=all, hidden)

### html-tag (Wrapper) — can_have_children

Raw HTML tag component for custom flexible UI designs - allows rendering any HTML element with children

Fields:
- html_tag (select, default="div", property, locale=all) — options: "div" | "span" | "p" | "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "section" | "article" | "aside" | "header" | "footer" | "nav" | "main" | "ul" | "ol" | "li" | "dl" | "dt" | "dd" | "blockquote" | "pre" | "code" | "em" | "strong" | "b" | "i" | "u" | "mark" | "small" | "sup" | "sub" | "cite" | "q" | "abbr" | "dfn" | "time" | "var" | "samp" | "kbd" | "address" | "del" | "ins" | "s" | "figure" | "figcaption" | "table" | "thead" | "tbody" | "tfoot" | "tr" | "th" | "td" | "caption" | "colgroup" | "col" | "fieldset" | "legend" | "label" | "button" | "output" | "meter" | "details" | "summary" | "dialog" | "canvas" | "svg" | "picture" | "img" | "a"
- html_tag_content (textarea, default=null, translatable, locale=en-GB|de-CH|...)

Allowed children: (any)

### image (Media)

allows to render an image on a page.

Fields:
- alt (text, default=null, translatable, locale=en-GB|de-CH|...)
- img_src (select-image, default=null, translatable, locale=en-GB|de-CH|...)
- is_fluid (checkbox, default="1", property, locale=all)
- mantine_height (select, default=null, property, locale=all) — options: "25%" | "50%" | "75%" | "100%" | "auto" | "fit-content" | "max-content" | "min-content"
- mantine_image_alt (text, default=null, translatable, locale=en-GB|de-CH|...)
- mantine_image_fit (select, default="contain", property, locale=all) — options: "contain" | "cover" | "fill" | "none" | "scale-down"
- mantine_image_src (text, default=null, translatable, locale=en-GB|de-CH|...)
- mantine_radius (slider, default="0", property, locale=all) — options: "none" | "xs" | "sm" | "md" | "lg" | "xl"
- mantine_spacing_margin (mantine_spacing_margin, default="", property, locale=all)
- mantine_width (select, default=null, property, locale=all) — options: "25%" | "50%" | "75%" | "100%" | "auto" | "fit-content" | "max-content" | "min-content"
- title (markdown-inline, default=null, translatable, locale=en-GB|de-CH|...)
- use_mantine_style (checkbox, default="1", property, locale=all)

### indicator (mantine) — can_have_children

Mantine Indicator component for status indicators

Fields:
- label (markdown-inline, default="", translatable, locale=en-GB|de-CH|...)
- mantine_border (checkbox, default="0", property, locale=all)
- mantine_color (color-picker, default="red", property, locale=all) — options: "gray" | "red" | "grape" | "violet" | "blue" | "cyan" | "green" | "lime" | "yellow" | "orange"
- mantine_indicator_disabled (checkbox, default="0", property, locale=all)
- mantine_indicator_inline (checkbox, default="0", property, locale=all)
- mantine_indicator_offset (select, default="0", property, locale=all) — options: "0" | "2" | "4" | "6" | "8" | "10" | "12"
- mantine_indicator_position (select, default="top-end", property, locale=all) — options: "top-start" | "top-center" | "top-end" | "middle-start" | "middle-center" | "middle-end" | "bottom-start" | "bottom-center" | "bottom-end"
- mantine_indicator_processing (checkbox, default="0", property, locale=all)
- mantine_indicator_size (slider, default="10", property, locale=all) — options: "6" | "7" | "8" | "9" | "10" | "11" | "12" | "13" | "14" | "15" | "16" | "17" | "18" | "19" | "20" | "21" | "22" | "23" | "24" | "25" | "26" | "27" | "28" | "29" | "30" | "31" | "32" | "33" | "34" | "35" | "36" | "37" | "38" | "39" | "40"
- mantine_radius (slider, default="xl", property, locale=all) — options: "none" | "xs" | "sm" | "md" | "lg" | "xl"
- mantine_spacing_margin (mantine_spacing_margin, default="", property, locale=all)
- use_mantine_style (checkbox, default="1", property, locale=all, hidden)

Allowed children: (any)

### input (Input)

HTML input component for various input types (text, email, password, etc.). Renders as standard HTML input tag.

Fields:
- disabled (checkbox, default="0", property, locale=all)
- is_required (checkbox, default="0", property, locale=all)
- label (markdown-inline, default=null, translatable, locale=en-GB|de-CH|...)
- locked_after_submit (checkbox, default="0", property, locale=all)
- mantine_left_icon (select-icon, default=null, property, locale=all)
- mantine_radius (slider, default="sm", property, locale=all) — options: "none" | "xs" | "sm" | "md" | "lg" | "xl"
- mantine_right_icon (select-icon, default=null, property, locale=all)
- mantine_size (slider, default="sm", property, locale=all) — options: "xs" | "sm" | "md" | "lg" | "xl"
- mantine_variant (select, default="default", property, locale=all) — options: "filled" | "light" | "outline" | "subtle" | "default" | "transparent" | "white"
- max (number, default=null, property, locale=all)
- min (number, default=null, property, locale=all)
- name (text, default=null, property, locale=all)
- placeholder (text, default=null, translatable, locale=en-GB|de-CH|...)
- translatable (checkbox, default="0", property, locale=all)
- type_input (select, default="text", property, locale=all) — options: "text" | "email" | "password" | "number" | "checkbox" | "color" | "date" | "time" | "tel" | "url"
- use_mantine_style (checkbox, default="1", property, locale=all)
- value (text, default=null, property, locale=all)

### kbd (mantine)

Mantine Kbd component for keyboard key display

Fields:
- label (markdown-inline, default="", translatable, locale=en-GB|de-CH|...)
- mantine_size (slider, default="sm", property, locale=all) — options: "xs" | "sm" | "md" | "lg" | "xl"
- mantine_spacing_margin (mantine_spacing_margin, default="", property, locale=all)
- use_mantine_style (checkbox, default="1", property, locale=all, hidden)

### link (Link) — can_have_children

renders a standard link but allows to open the target in a new tab.

Fields:
- label (markdown-inline, default=null, translatable, locale=en-GB|de-CH|...)
- mantine_spacing_margin (mantine_spacing_margin, default="", property, locale=all)
- open_in_new_tab (checkbox, default=null, property, locale=all)
- url (text, default=null, property, locale=all)

Allowed children: (any)

### list (mantine)

Mantine List component for displaying ordered or unordered lists

Fields:
- mantine_list_center (checkbox, default="0", property, locale=all)
- mantine_list_icon (select-icon, default=null, property, locale=all)
- mantine_list_list_style_type (select, default="disc", property, locale=all) — options: "disc" | "circle" | "square" | "decimal" | "decimal-leading-zero" | "lower-alpha" | "upper-alpha" | "lower-roman" | "upper-roman" | "none"
- mantine_list_spacing (select, default="md", property, locale=all) — options: "xs" | "sm" | "md" | "lg" | "xl"
- mantine_list_type (segment, default="unordered", property, locale=all) — options: "unordered" | "ordered"
- mantine_list_with_padding (checkbox, default="0", property, locale=all)
- mantine_size (slider, default="sm", property, locale=all) — options: "xs" | "sm" | "md" | "lg" | "xl"
- mantine_spacing_margin_padding (mantine_spacing_margin_padding, default="", property, locale=all)
- use_mantine_style (checkbox, default="1", property, locale=all, hidden)

Allowed children: list-item

### list-item (mantine) — can_have_children

Mantine List.Item component for individual list items

Fields:
- mantine_list_item_content (textarea, default=null, translatable, locale=en-GB|de-CH|...)
- mantine_list_item_icon (select-icon, default=null, property, locale=all)
- mantine_spacing_margin_padding (mantine_spacing_margin_padding, default="", property, locale=all)
- use_mantine_style (checkbox, default="1", property, locale=all, hidden)

Allowed children: (any)
Allowed parents: list

### login (Admin)

provides a small form where the user can enter his or her email and password to access the WebApp. It also includes a link to reset a password.

Fields:
- alert_fail (text, default=null, translatable, locale=en-GB|de-CH|...)
- label_login (text, default=null, translatable, locale=en-GB|de-CH|...)
- label_pw (text, default=null, translatable, locale=en-GB|de-CH|...)
- label_pw_reset (text, default=null, translatable, locale=en-GB|de-CH|...)
- label_user (text, default=null, translatable, locale=en-GB|de-CH|...)
- login_title (text, default=null, translatable, locale=en-GB|de-CH|...)
- mantine_spacing_margin (mantine_spacing_margin, default="", property, locale=all)
- type (style-bootstrap, default="dark", property, locale=all)

### loop (Wrapper) — can_have_children

A style which takes an array object and loop the rows and load its children passing the values of the rows

Fields:
- loop (json, default=null, property, locale=all)
- scope (text, default="", property, locale=all)

Allowed children: (any)

### notification (mantine)

Mantine Notification component for alerts and messages

Fields:
- content (textarea, default=null, translatable, locale=en-GB|de-CH|...)
- mantine_border (checkbox, default="0", property, locale=all)
- mantine_color (color-picker, default="blue", property, locale=all) — options: "gray" | "red" | "grape" | "violet" | "blue" | "cyan" | "green" | "lime" | "yellow" | "orange"
- mantine_left_icon (select-icon, default=null, property, locale=all)
- mantine_notification_loading (checkbox, default="0", property, locale=all)
- mantine_notification_with_close_button (checkbox, default="1", property, locale=all)
- mantine_radius (slider, default="sm", property, locale=all) — options: "none" | "xs" | "sm" | "md" | "lg" | "xl"
- mantine_spacing_margin_padding (mantine_spacing_margin_padding, default="", property, locale=all)
- title (markdown-inline, default=null, translatable, locale=en-GB|de-CH|...)
- use_mantine_style (checkbox, default="1", property, locale=all, hidden)

### number-input (mantine)

Mantine NumberInput component for numeric input

Fields:
- description (textarea, default="", translatable, locale=en-GB|de-CH|...)
- disabled (checkbox, default="0", property, locale=all)
- is_required (checkbox, default="0", property, locale=all)
- label (markdown-inline, default="", translatable, locale=en-GB|de-CH|...)
- mantine_number_input_clamp_behavior (segment, default="strict", property, locale=all) — options: "strict" | "blur"
- mantine_number_input_decimal_scale (slider, default="2", property, locale=all) — options: "0" | "1" | "2" | "3" | "4" | "5"
- mantine_numeric_max (select, default=null, property, locale=all) — options: "10" | "100" | "1000" | "10000"
- mantine_numeric_min (select, default=null, property, locale=all) — options: "0" | "1" | "10" | "100"
- mantine_numeric_step (select, default="1", property, locale=all) — options: "0.1" | "0.5" | "1" | "5" | "10"
- mantine_radius (slider, default="sm", property, locale=all) — options: "none" | "xs" | "sm" | "md" | "lg" | "xl"
- mantine_size (slider, default="sm", property, locale=all) — options: "xs" | "sm" | "md" | "lg" | "xl"
- mantine_spacing_margin (mantine_spacing_margin, default="", property, locale=all)
- name (text, default="", property, locale=all)
- placeholder (text, default="Enter number", translatable, locale=en-GB|de-CH|...)
- use_mantine_style (checkbox, default="1", property, locale=all, hidden)
- value (text, default="", property, locale=all)

### paper (mantine) — can_have_children

Mantine Paper component for elevated surfaces

Fields:
- mantine_border (checkbox, default="0", property, locale=all)
- mantine_paper_shadow (slider, default="sm", property, locale=all) — options: "none" | "xs" | "sm" | "md" | "lg" | "xl"
- mantine_px (slider, default=null, property, locale=all) — options: "none" | "xs" | "sm" | "md" | "lg" | "xl"
- mantine_py (slider, default=null, property, locale=all) — options: "none" | "xs" | "sm" | "md" | "lg" | "xl"
- mantine_radius (slider, default="sm", property, locale=all) — options: "none" | "xs" | "sm" | "md" | "lg" | "xl"
- mantine_spacing_margin_padding (mantine_spacing_margin_padding, default="", property, locale=all)
- use_mantine_style (checkbox, default="1", property, locale=all, hidden)

Allowed children: (any)

### profile (Admin)

User profile management component with account settings, password reset, and account deletion

Fields:
- mantine_spacing_margin_padding (mantine_spacing_margin_padding, default="", property, locale=all)
- profile_accordion_default_opened (select, default="user_info", property, locale=all) — options: "user_info" | "username_change" | "password_reset" | "account_delete"
- profile_accordion_multiple (checkbox, default="1", property, locale=all)
- profile_account_info_title (text, default="Account Information", translatable, locale=en-GB|de-CH|...)
- profile_columns (select, default="2", property, locale=all) — options: "1" | "2" | "3" | "4"
- profile_delete_alert_text (text, default="This action cannot be undone. All your data will be permanently deleted.", translatable, locale=en-GB|de-CH|...)
- profile_delete_button (text, default="Delete Account", translatable, locale=en-GB|de-CH|...)
- profile_delete_description (textarea, default="<p>Permanently delete your account and all associated data. This action cannot be undone.</p>", translatable, locale=en-GB|de-CH|...)
- profile_delete_error_email_mismatch (text, default="Email does not match your account email", translatable, locale=en-GB|de-CH|...)
- profile_delete_error_email_required (text, default="Email confirmation is required", translatable, locale=en-GB|de-CH|...)
- profile_delete_error_general (text, default="Failed to delete account. Please try again.", translatable, locale=en-GB|de-CH|...)
- profile_delete_label_email (text, default="Confirm Email", translatable, locale=en-GB|de-CH|...)
- profile_delete_modal_warning (textarea, default="<p>Deleting your account will permanently remove all your data, including profile information, preferences, and any content you have created.</p>", translatable, locale=en-GB|de-CH|...)
- profile_delete_placeholder_email (text, default="Enter your email to confirm", translatable, locale=en-GB|de-CH|...)
- profile_delete_success (text, default="Account deleted successfully.", translatable, locale=en-GB|de-CH|...)
- profile_delete_title (text, default="Delete Account", translatable, locale=en-GB|de-CH|...)
- profile_gap (select, default="md", property, locale=all) — options: "xs" | "sm" | "md" | "lg" | "xl"
- profile_label_created (text, default="Account Created", translatable, locale=en-GB|de-CH|...)
- profile_label_email (text, default="Email", translatable, locale=en-GB|de-CH|...)
- profile_label_last_login (text, default="Last Login", translatable, locale=en-GB|de-CH|...)
- profile_label_name (text, default="Full Name", translatable, locale=en-GB|de-CH|...)
- profile_label_timezone (text, default="Timezone", translatable, locale=en-GB|de-CH|...)
- profile_label_username (text, default="Username", translatable, locale=en-GB|de-CH|...)
- profile_name_change_button (text, default="Update Display Name", translatable, locale=en-GB|de-CH|...)
- profile_name_change_description (textarea, default="<p>Update your display name. This will be visible to other users.</p>", translatable, locale=en-GB|de-CH|...)
- profile_name_change_error_general (text, default="Failed to update display name. Please try again.", translatable, locale=en-GB|de-CH|...)
- profile_name_change_error_invalid (text, default="Display name contains invalid characters", translatable, locale=en-GB|de-CH|...)
- profile_name_change_error_required (text, default="Display name is required", translatable, locale=en-GB|de-CH|...)
- profile_name_change_label (text, default="New Display Name", translatable, locale=en-GB|de-CH|...)
- profile_name_change_placeholder (text, default="Enter new display name", translatable, locale=en-GB|de-CH|...)
- profile_name_change_success (text, default="Display name updated successfully!", translatable, locale=en-GB|de-CH|...)
- profile_name_change_title (text, default="Change Display Name", translatable, locale=en-GB|de-CH|...)
- profile_password_reset_button (text, default="Update Password", translatable, locale=en-GB|de-CH|...)
- profile_password_reset_description (textarea, default="<p>Set a new password for your account. Make sure it is strong and secure.</p>", translatable, locale=en-GB|de-CH|...)
- profile_password_reset_error_confirm_required (text, default="Password confirmation is required", translatable, locale=en-GB|de-CH|...)
- profile_password_reset_error_current_required (text, default="Current password is required", translatable, locale=en-GB|de-CH|...)
- profile_password_reset_error_current_wrong (text, default="Current password is incorrect", translatable, locale=en-GB|de-CH|...)
- profile_password_reset_error_general (text, default="Failed to update password. Please try again.", translatable, locale=en-GB|de-CH|...)
- profile_password_reset_error_mismatch (text, default="New passwords do not match", translatable, locale=en-GB|de-CH|...)
- profile_password_reset_error_new_required (text, default="New password is required", translatable, locale=en-GB|de-CH|...)
- profile_password_reset_error_weak (text, default="Password is too weak. Please choose a stronger password.", translatable, locale=en-GB|de-CH|...)
- profile_password_reset_label_confirm (text, default="Confirm New Password", translatable, locale=en-GB|de-CH|...)
- profile_password_reset_label_current (text, default="Current Password", translatable, locale=en-GB|de-CH|...)
- profile_password_reset_label_new (text, default="New Password", translatable, locale=en-GB|de-CH|...)
- profile_password_reset_placeholder_confirm (text, default="Confirm new password", translatable, locale=en-GB|de-CH|...)
- profile_password_reset_placeholder_current (text, default="Enter current password", translatable, locale=en-GB|de-CH|...)
- profile_password_reset_placeholder_new (text, default="Enter new password", translatable, locale=en-GB|de-CH|...)
- profile_password_reset_success (text, default="Password updated successfully!", translatable, locale=en-GB|de-CH|...)
- profile_password_reset_title (text, default="Change Password", translatable, locale=en-GB|de-CH|...)
- profile_radius (slider, default="sm", property, locale=all) — options: "xs" | "sm" | "md" | "lg" | "xl"
- profile_shadow (slider, default="sm", property, locale=all) — options: "none" | "xs" | "sm" | "md" | "lg" | "xl"
- profile_title (text, default="My Profile", translatable, locale=en-GB|de-CH|...)
- profile_use_accordion (checkbox, default="0", property, locale=all)
- profile_variant (select, default="default", property, locale=all) — options: "default" | "filled" | "outline" | "light" | "subtle"
- use_mantine_style (checkbox, default="1", property, locale=all, hidden)

### progress (mantine)

Mantine Progress component for basic progress bars

Fields:
- mantine_color (color-picker, default="blue", property, locale=all) — options: "gray" | "red" | "grape" | "violet" | "blue" | "cyan" | "green" | "lime" | "yellow" | "orange"
- mantine_progress_animated (checkbox, default="0", property, locale=all)
- mantine_progress_striped (checkbox, default="0", property, locale=all)
- mantine_progress_transition_duration (select, default="200", property, locale=all) — options: "150" | "200" | "300" | "400" | "0"
- mantine_radius (slider, default="sm", property, locale=all) — options: "none" | "xs" | "sm" | "md" | "lg" | "xl"
- mantine_size (slider, default="sm", property, locale=all) — options: "xs" | "sm" | "md" | "lg" | "xl"
- mantine_spacing_margin (mantine_spacing_margin, default="", property, locale=all)
- use_mantine_style (checkbox, default="1", property, locale=all, hidden)
- value (text, default="0", property, locale=all)

### progress-root (mantine)

Mantine Progress.Root component for compound progress bars with multiple sections

Fields:
- mantine_progress_auto_contrast (checkbox, default="0", property, locale=all)
- mantine_size (slider, default="sm", property, locale=all) — options: "xs" | "sm" | "md" | "lg" | "xl"
- mantine_spacing_margin (mantine_spacing_margin, default="", property, locale=all)
- use_mantine_style (checkbox, default="1", property, locale=all, hidden)

Allowed children: progress-section

### progress-section (mantine)

Mantine Progress.Section component for individual progress sections

Fields:
- label (markdown-inline, default=null, translatable, locale=en-GB|de-CH|...)
- mantine_color (color-picker, default="blue", property, locale=all) — options: "gray" | "red" | "grape" | "violet" | "blue" | "cyan" | "green" | "lime" | "yellow" | "orange"
- mantine_progress_animated (checkbox, default="0", property, locale=all)
- mantine_progress_striped (checkbox, default="0", property, locale=all)
- mantine_spacing_margin (mantine_spacing_margin, default="", property, locale=all)
- mantine_tooltip_label (text, default=null, translatable, locale=en-GB|de-CH|...)
- mantine_tooltip_position (select, default="top", property, locale=all) — options: "top" | "bottom" | "left" | "right" | "top-start" | "top-end" | "bottom-start" | "bottom-end" | "left-start" | "left-end" | "right-start" | "right-end"
- use_mantine_style (checkbox, default="1", property, locale=all, hidden)
- value (text, default="0", property, locale=all)
Allowed parents: progress-root

### radio (mantine) — can_have_children

Unified Radio component that can render as single radio or radio group based on options

Fields:
- description (textarea, default=null, translatable, locale=en-GB|de-CH|...)
- disabled (checkbox, default="0", property, locale=all)
- is_required (checkbox, default="0", property, locale=all)
- label (markdown-inline, default=null, translatable, locale=en-GB|de-CH|...)
- locked_after_submit (checkbox, default="0", property, locale=all)
- mantine_color (color-picker, default="blue", property, locale=all) — options: "gray" | "red" | "grape" | "violet" | "blue" | "cyan" | "green" | "lime" | "yellow" | "orange"
- mantine_orientation (segment, default="vertical", property, locale=all) — options: "horizontal" | "vertical"
- mantine_radio_card (checkbox, default="0", property, locale=all)
- mantine_radio_label_position (select, default="right", property, locale=all) — options: "right" | "left"
- mantine_radio_options (json, default="[{\"value\":\"option1\",\"text\":\"Option 1\",\"description\":\"First choice description\"},{\"value\":\"option2\",\"text\":\"Option 2\",\"description\":\"Second choice description\"},{\"value\":\"option3\",\"text\":\"Option 3\",\"description\":\"Third choice description\"}]", translatable, locale=en-GB|de-CH|...)
- mantine_radio_variant (select, default="default", property, locale=all) — options: "default" | "outline"
- mantine_size (slider, default="sm", property, locale=all) — options: "xs" | "sm" | "md" | "lg" | "xl"
- mantine_spacing_margin (mantine_spacing_margin, default="", property, locale=all)
- mantine_tooltip_label (text, default=null, translatable, locale=en-GB|de-CH|...)
- mantine_tooltip_position (select, default="top", property, locale=all) — options: "top" | "bottom" | "left" | "right" | "top-start" | "top-end" | "bottom-start" | "bottom-end" | "left-start" | "left-end" | "right-start" | "right-end"
- mantine_use_input_wrapper (checkbox, default="1", property, locale=all)
- name (text, default=null, property, locale=all)
- use_mantine_style (checkbox, default="1", property, locale=all, hidden)
- value (text, default=null, property, locale=all)

Allowed children: (any)

### range-slider (mantine)

Mantine range-slider component for range selection

Fields:
- description (textarea, default="", translatable, locale=en-GB|de-CH|...)
- disabled (checkbox, default="0", property, locale=all)
- label (markdown-inline, default="", translatable, locale=en-GB|de-CH|...)
- mantine_color (color-picker, default="blue", property, locale=all) — options: "gray" | "red" | "grape" | "violet" | "blue" | "cyan" | "green" | "lime" | "yellow" | "orange"
- mantine_numeric_max (select, default="100", property, locale=all) — options: "10" | "100" | "1000" | "10000"
- mantine_numeric_min (select, default="0", property, locale=all) — options: "0" | "1" | "10" | "100"
- mantine_numeric_step (select, default="1", property, locale=all) — options: "0.1" | "0.5" | "1" | "5" | "10"
- mantine_radius (slider, default="sm", property, locale=all) — options: "none" | "xs" | "sm" | "md" | "lg" | "xl"
- mantine_range_slider_inverted (checkbox, default="0", property, locale=all)
- mantine_range_slider_labels_always_on (checkbox, default="0", property, locale=all)
- mantine_range_slider_marks_values (textarea, default="", translatable, locale=en-GB|de-CH|...)
- mantine_range_slider_show_label (checkbox, default="1", property, locale=all)
- mantine_size (slider, default="sm", property, locale=all) — options: "xs" | "sm" | "md" | "lg" | "xl"
- mantine_spacing_margin (mantine_spacing_margin, default="", property, locale=all)
- name (text, default="", property, locale=all)
- use_mantine_style (checkbox, default="1", property, locale=all, hidden)
- value (text, default="", property, locale=all)

### rating (mantine)

Mantine Rating component for star ratings

Fields:
- description (textarea, default=null, translatable, locale=en-GB|de-CH|...)
- disabled (checkbox, default="0", property, locale=all)
- label (markdown-inline, default=null, translatable, locale=en-GB|de-CH|...)
- mantine_color (color-picker, default="yellow", property, locale=all) — options: "gray" | "red" | "grape" | "violet" | "blue" | "cyan" | "green" | "lime" | "yellow" | "orange"
- mantine_rating_count (slider, default="5", property, locale=all) — options: "3" | "4" | "5" | "6" | "7" | "8" | "9" | "10"
- mantine_rating_empty_icon (select-icon, default=null, property, locale=all)
- mantine_rating_fractions (slider, default="1", property, locale=all) — options: "1" | "2" | "3" | "4" | "5"
- mantine_rating_full_icon (select-icon, default=null, property, locale=all)
- mantine_rating_highlight_selected_only (checkbox, default="0", property, locale=all)
- mantine_rating_use_smiles (checkbox, default="0", property, locale=all)
- mantine_size (slider, default="sm", property, locale=all) — options: "xs" | "sm" | "md" | "lg" | "xl"
- mantine_spacing_margin (mantine_spacing_margin, default="", property, locale=all)
- name (text, default=null, property, locale=all)
- readonly (checkbox, default="0", property, locale=all)
- use_mantine_style (checkbox, default="1", property, locale=all, hidden)
- value (text, default=null, property, locale=all)

### refContainer (Wrapper) — can_have_children

Wrap other styles that later can be used in different place. It can be used for creating resusable blocks.

Allowed children: (any)

### register (Admin)

provides a small form to allow a user to register for the WebApp. In order to register a user must provide a valid email and activation code. Activation codes can be generated in the admin section of the WebApp. The list of available codes can be exported.

Fields:
- alert_fail (text, default=null, translatable, locale=en-GB|de-CH|...)
- alert_success (text, default=null, translatable, locale=en-GB|de-CH|...)
- anonymous_users_registration (markdown, default="Please describe the process to the user", translatable, locale=en-GB|de-CH|...)
- group (select-group, default="3", property, locale=all)
- label_pw (text, default=null, translatable, locale=en-GB|de-CH|...)
- label_security_question_1 (text, default="Select security question 1", translatable, locale=en-GB|de-CH|...)
- label_security_question_2 (text, default="Select security question 2", translatable, locale=en-GB|de-CH|...)
- label_submit (text, default=null, translatable, locale=en-GB|de-CH|...)
- label_user (text, default=null, translatable, locale=en-GB|de-CH|...)
- mantine_spacing_margin_padding (mantine_spacing_margin_padding, default="", property, locale=all)
- open_registration (checkbox, default="0", property, locale=all)
- success (text, default=null, translatable, locale=en-GB|de-CH|...)
- title (markdown-inline, default=null, translatable, locale=en-GB|de-CH|...)
- type (style-bootstrap, default="success", property, locale=all)

### resetPassword (intern)

Fields:
- alert_success (text, default=null, translatable, locale=en-GB|de-CH|...)
- email_user (email, default=null, translatable, locale=en-GB|de-CH|...)
- is_html (checkbox, default="0", property, locale=all)
- label_pw_reset (text, default=null, translatable, locale=en-GB|de-CH|...)
- mantine_spacing_margin_padding (mantine_spacing_margin_padding, default="", property, locale=all)
- placeholder (text, default=null, translatable, locale=en-GB|de-CH|...)
- subject_user (text, default=null, translatable, locale=en-GB|de-CH|...)
- text_md (markdown, default=null, translatable, locale=en-GB|de-CH|...)
- type (style-bootstrap, default=null, property, locale=all)

### rich-text-editor (mantine)

Rich text editor component based on Tiptap with toolbar controls for formatting. It supports controlled input for form submission.

Fields:
- description (textarea, default=null, translatable, locale=en-GB|de-CH|...)
- disabled (checkbox, default="0", property, locale=all)
- is_required (checkbox, default="0", property, locale=all)
- label (markdown-inline, default=null, translatable, locale=en-GB|de-CH|...)
- mantine_rich_text_editor_bubble_menu (checkbox, default="0", property, locale=all)
- mantine_rich_text_editor_placeholder (text, default="Start writing...", translatable, locale=en-GB|de-CH|...)
- mantine_rich_text_editor_task_list (checkbox, default="0", property, locale=all)
- mantine_rich_text_editor_text_color (checkbox, default="0", property, locale=all)
- mantine_rich_text_editor_variant (segment, default="default", property, locale=all) — options: "default" | "subtle"
- mantine_spacing_margin (mantine_spacing_margin, default="", property, locale=all)
- name (text, default=null, property, locale=all)
- translatable (checkbox, default="0", property, locale=all)
- use_mantine_style (checkbox, default="1", property, locale=all, hidden)
- value (text, default=null, property, locale=all)

### scroll-area (mantine) — can_have_children

Mantine scroll-area component for custom scrollbars

Fields:
- mantine_height (select, default=null, property, locale=all) — options: "25%" | "50%" | "75%" | "100%" | "auto" | "fit-content" | "max-content" | "min-content"
- mantine_scroll_area_offset_scrollbars (checkbox, default="0", property, locale=all)
- mantine_scroll_area_scrollbar_size (select, default="8", property, locale=all) — options: "6" | "8" | "10" | "12" | "16"
- mantine_scroll_area_scroll_hide_delay (select, default="1000", property, locale=all) — options: "0" | "300" | "500" | "1000" | "1500" | "2000" | "3000"
- mantine_scroll_area_type (segment, default="hover", property, locale=all) — options: "hover" | "always" | "never"
- mantine_spacing_margin_padding (mantine_spacing_margin_padding, default="", property, locale=all)
- use_mantine_style (checkbox, default="1", property, locale=all, hidden)

Allowed children: (any)

### segmented-control (mantine)

Mantine segmented-control component for segmented controls

Fields:
- description (textarea, default=null, translatable, locale=en-GB|de-CH|...)
- disabled (checkbox, default="0", property, locale=all)
- is_required (checkbox, default="0", property, locale=all)
- label (markdown-inline, default=null, translatable, locale=en-GB|de-CH|...)
- mantine_color (color-picker, default="blue", property, locale=all) — options: "gray" | "red" | "grape" | "violet" | "blue" | "cyan" | "green" | "lime" | "yellow" | "orange"
- mantine_orientation (segment, default="horizontal", property, locale=all) — options: "horizontal" | "vertical"
- mantine_radius (slider, default="sm", property, locale=all) — options: "none" | "xs" | "sm" | "md" | "lg" | "xl"
- mantine_segmented_control_data (textarea, default="[{\"value\":\"option1\",\"label\":\"Option 1\"},{\"value\":\"option2\",\"label\":\"Option 2\"},{\"value\":\"option3\",\"label\":\"Option 3\"}]", translatable, locale=en-GB|de-CH|...)
- mantine_segmented_control_item_border (checkbox, default="0", property, locale=all)
- mantine_size (slider, default="sm", property, locale=all) — options: "xs" | "sm" | "md" | "lg" | "xl"
- mantine_spacing_margin (mantine_spacing_margin, default="", property, locale=all)
- name (text, default=null, property, locale=all)
- readonly (checkbox, default="0", property, locale=all)
- use_mantine_style (checkbox, default="1", property, locale=all, hidden)
- value (text, default=null, property, locale=all)

### select (Input)

HTML select component for dropdown selections. Supports single and multiple selections.

Fields:
- disabled (checkbox, default="0", property, locale=all)
- is_multiple (checkbox, default="0", property, locale=all)
- is_required (checkbox, default="0", property, locale=all)
- label (markdown-inline, default=null, translatable, locale=en-GB|de-CH|...)
- locked_after_submit (checkbox, default="0", property, locale=all)
- mantine_multi_select_data (textarea, default=null, translatable, locale=en-GB|de-CH|...)
- mantine_radius (slider, default="sm", property, locale=all) — options: "none" | "xs" | "sm" | "md" | "lg" | "xl"
- mantine_select_clearable (checkbox, default="0", property, locale=all)
- mantine_select_searchable (checkbox, default="0", property, locale=all)
- mantine_size (slider, default="sm", property, locale=all) — options: "xs" | "sm" | "md" | "lg" | "xl"
- max (number, default=null, property, locale=all)
- name (text, default=null, property, locale=all)
- options (json, default="[{\"value\":\"option1\",\"label\":\"Option 1\"}, {\"value\":\"option2\",\"label\":\"Option 2\"}]", translatable, locale=en-GB|de-CH|...)
- placeholder (text, default="Select an option", translatable, locale=en-GB|de-CH|...)
- use_mantine_style (checkbox, default="1", property, locale=all)
- value (text, default=null, property, locale=all)

### simple-grid (mantine) — can_have_children

Mantine simple-grid component for responsive grid layouts

Fields:
- mantine_breakpoints (slider, default=null, property, locale=all) — options: "xs" | "sm" | "md" | "lg" | "xl"
- mantine_cols (slider, default="3", property, locale=all) — options: "1" | "2" | "3" | "4" | "5" | "6"
- mantine_height (select, default=null, property, locale=all) — options: "25%" | "50%" | "75%" | "100%" | "auto" | "fit-content" | "max-content" | "min-content"
- mantine_spacing_margin_padding (mantine_spacing_margin_padding, default="", property, locale=all)
- mantine_vertical_spacing (slider, default=null, property, locale=all) — options: "0" | "xs" | "sm" | "md" | "lg" | "xl"
- mantine_width (select, default=null, property, locale=all) — options: "25%" | "50%" | "75%" | "100%" | "auto" | "fit-content" | "max-content" | "min-content"
- use_mantine_style (checkbox, default="1", property, locale=all, hidden)

Allowed children: (any)

### slider (mantine)

Mantine slider component for single value selection

Fields:
- description (textarea, default="", translatable, locale=en-GB|de-CH|...)
- disabled (checkbox, default="0", property, locale=all)
- is_required (checkbox, default="0", property, locale=all)
- label (markdown-inline, default="", translatable, locale=en-GB|de-CH|...)
- locked_after_submit (checkbox, default="0", property, locale=all)
- mantine_color (color-picker, default="blue", property, locale=all) — options: "gray" | "red" | "grape" | "violet" | "blue" | "cyan" | "green" | "lime" | "yellow" | "orange"
- mantine_numeric_max (select, default="100", property, locale=all) — options: "10" | "100" | "1000" | "10000"
- mantine_numeric_min (select, default="0", property, locale=all) — options: "0" | "1" | "10" | "100"
- mantine_numeric_step (select, default="1", property, locale=all) — options: "0.1" | "0.5" | "1" | "5" | "10"
- mantine_radius (slider, default="sm", property, locale=all) — options: "none" | "xs" | "sm" | "md" | "lg" | "xl"
- mantine_size (slider, default="sm", property, locale=all) — options: "xs" | "sm" | "md" | "lg" | "xl"
- mantine_slider_inverted (checkbox, default="0", property, locale=all)
- mantine_slider_labels_always_on (checkbox, default="0", property, locale=all)
- mantine_slider_marks_values (textarea, default="", translatable, locale=en-GB|de-CH|...)
- mantine_slider_required (checkbox, default="0", property, locale=all)
- mantine_slider_show_label (checkbox, default="1", property, locale=all)
- mantine_spacing_margin (mantine_spacing_margin, default="", property, locale=all)
- name (text, default="", property, locale=all)
- use_mantine_style (checkbox, default="1", property, locale=all, hidden)
- value (text, default="", property, locale=all)

### space (mantine)

Mantine Space component for adding spacing

Fields:
- mantine_size (slider, default="sm", property, locale=all) — options: "xs" | "sm" | "md" | "lg" | "xl"
- mantine_space_direction (segment, default="vertical", property, locale=all) — options: "horizontal" | "vertical"
- mantine_spacing_margin_padding (mantine_spacing_margin_padding, default="", property, locale=all)
- use_mantine_style (checkbox, default="1", property, locale=all, hidden)

### spoiler (mantine) — can_have_children

Mantine Spoiler component for collapsible text

Fields:
- mantine_height (select, default="200", property, locale=all) — options: "25%" | "50%" | "75%" | "100%" | "auto" | "fit-content" | "max-content" | "min-content"
- mantine_spacing_margin_padding (mantine_spacing_margin_padding, default="", property, locale=all)
- mantine_spoiler_hide_label (text, default="Hide", translatable, locale=en-GB|de-CH|...)
- mantine_spoiler_show_label (text, default="Show more", translatable, locale=en-GB|de-CH|...)
- use_mantine_style (checkbox, default="1", property, locale=all, hidden)

Allowed children: (any)

### stack (mantine) — can_have_children

Mantine Stack component for vertical layouts

Fields:
- mantine_align (select, default=null, property, locale=all) — options: "flex-start" | "center" | "flex-end" | "stretch" | "baseline"
- mantine_gap (slider, default="sm", property, locale=all) — options: "0" | "xs" | "sm" | "md" | "lg" | "xl"
- mantine_height (select, default=null, property, locale=all) — options: "25%" | "50%" | "75%" | "100%" | "auto" | "fit-content" | "max-content" | "min-content"
- mantine_justify (select, default=null, property, locale=all) — options: "flex-start" | "center" | "flex-end" | "space-between" | "space-around" | "space-evenly"
- mantine_spacing_margin_padding (mantine_spacing_margin_padding, default="", property, locale=all)
- mantine_width (select, default=null, property, locale=all) — options: "25%" | "50%" | "75%" | "100%" | "auto" | "fit-content" | "max-content" | "min-content"
- use_mantine_style (checkbox, default="1", property, locale=all, hidden)

Allowed children: (any)

### switch (mantine)

Mantine Switch component for toggle switches

Fields:
- description (textarea, default=null, translatable, locale=en-GB|de-CH|...)
- disabled (checkbox, default="0", property, locale=all)
- is_required (checkbox, default="0", property, locale=all)
- label (markdown-inline, default=null, translatable, locale=en-GB|de-CH|...)
- mantine_color (color-picker, default="blue", property, locale=all) — options: "gray" | "red" | "grape" | "violet" | "blue" | "cyan" | "green" | "lime" | "yellow" | "orange"
- mantine_label_position (segment, default="left", property, locale=all) — options: "left" | "right"
- mantine_radius (slider, default="sm", property, locale=all) — options: "none" | "xs" | "sm" | "md" | "lg" | "xl"
- mantine_size (slider, default="sm", property, locale=all) — options: "xs" | "sm" | "md" | "lg" | "xl"
- mantine_spacing_margin (mantine_spacing_margin, default="", property, locale=all)
- mantine_switch_off_label (text, default="Off", translatable, locale=en-GB|de-CH|...)
- mantine_switch_on_label (text, default="On", translatable, locale=en-GB|de-CH|...)
- mantine_switch_on_value (text, default="1", property, locale=all)
- mantine_use_input_wrapper (checkbox, default="0", property, locale=all)
- name (text, default=null, property, locale=all)
- use_mantine_style (checkbox, default="1", property, locale=all, hidden)
- value (text, default=null, property, locale=all)

### tab (mantine) — can_have_children

Mantine Tabs.Tab component for individual tab items within a tabs component. Can contain child components for tab panel content.

Fields:
- label (markdown-inline, default=null, translatable, locale=en-GB|de-CH|...)
- mantine_height (select, default=null, property, locale=all) — options: "25%" | "50%" | "75%" | "100%" | "auto" | "fit-content" | "max-content" | "min-content"
- mantine_left_icon (select-icon, default=null, property, locale=all)
- mantine_right_icon (select-icon, default=null, property, locale=all)
- mantine_spacing_margin (mantine_spacing_margin, default="", property, locale=all)
- mantine_tab_disabled (checkbox, default="0", property, locale=all)
- mantine_width (select, default=null, property, locale=all) — options: "25%" | "50%" | "75%" | "100%" | "auto" | "fit-content" | "max-content" | "min-content"
- use_mantine_style (checkbox, default="1", property, locale=all, hidden)

Allowed children: (any)
Allowed parents: tabs

### tabs (mantine)

Mantine Tabs component for switching between different views

Fields:
- mantine_color (color-picker, default="blue", property, locale=all) — options: "gray" | "red" | "grape" | "violet" | "blue" | "cyan" | "green" | "lime" | "yellow" | "orange"
- mantine_height (select, default=null, property, locale=all) — options: "25%" | "50%" | "75%" | "100%" | "auto" | "fit-content" | "max-content" | "min-content"
- mantine_orientation (segment, default="horizontal", property, locale=all) — options: "horizontal" | "vertical"
- mantine_radius (slider, default="sm", property, locale=all) — options: "none" | "xs" | "sm" | "md" | "lg" | "xl"
- mantine_spacing_margin (mantine_spacing_margin, default="", property, locale=all)
- mantine_tabs_variant (select, default="default", property, locale=all) — options: "default" | "outline" | "pills"
- mantine_width (select, default=null, property, locale=all) — options: "25%" | "50%" | "75%" | "100%" | "auto" | "fit-content" | "max-content" | "min-content"
- use_mantine_style (checkbox, default="1", property, locale=all, hidden)

Allowed children: tab

### text (mantine)

Mantine Text component for displaying text with various styling options

Fields:
- mantine_color (color-picker, default="", property, locale=all) — options: "gray" | "red" | "grape" | "violet" | "blue" | "cyan" | "green" | "lime" | "yellow" | "orange"
- mantine_size (slider, default="sm", property, locale=all) — options: "xs" | "sm" | "md" | "lg" | "xl"
- mantine_spacing_margin_padding (mantine_spacing_margin_padding, default="", property, locale=all)
- mantine_text_align (segment, default="left", property, locale=all) — options: "left" | "center" | "right" | "justify"
- mantine_text_font_style (segment, default="normal", property, locale=all) — options: "normal" | "italic"
- mantine_text_font_weight (select, default=null, property, locale=all) — options: "100" | "200" | "300" | "400" | "500" | "600" | "700" | "800" | "900"
- mantine_text_gradient (json, default=null, property, locale=all)
- mantine_text_inherit (checkbox, default="0", property, locale=all)
- mantine_text_line_clamp (select, default=null, property, locale=all) — options: "2" | "3" | "4" | "5"
- mantine_text_span (checkbox, default="0", property, locale=all)
- mantine_text_text_decoration (segment, default="none", property, locale=all) — options: "none" | "underline" | "line-through"
- mantine_text_text_transform (segment, default="none", property, locale=all) — options: "none" | "uppercase" | "capitalize" | "lowercase"
- mantine_text_truncate (segment, default=null, property, locale=all) — options: "none" | "end" | "start"
- mantine_text_variant (segment, default="default", property, locale=all) — options: "default" | "gradient"
- text (textarea, default=null, translatable, locale=en-GB|de-CH|...)
- use_mantine_style (checkbox, default="1", property, locale=all, hidden)

### text-input (mantine)

Mantine TextInput component for controlled text input with validation and sections

Fields:
- description (textarea, default=null, translatable, locale=en-GB|de-CH|...)
- disabled (checkbox, default="0", property, locale=all)
- is_required (checkbox, default="0", property, locale=all)
- label (markdown-inline, default=null, translatable, locale=en-GB|de-CH|...)
- mantine_left_icon (select-icon, default=null, property, locale=all)
- mantine_radius (slider, default="sm", property, locale=all) — options: "none" | "xs" | "sm" | "md" | "lg" | "xl"
- mantine_right_icon (select-icon, default=null, property, locale=all)
- mantine_size (slider, default="sm", property, locale=all) — options: "xs" | "sm" | "md" | "lg" | "xl"
- mantine_spacing_margin (mantine_spacing_margin, default="", property, locale=all)
- mantine_text_input_variant (segment, default="default", property, locale=all) — options: "default" | "filled" | "unstyled"
- name (text, default=null, property, locale=all)
- placeholder (text, default=null, translatable, locale=en-GB|de-CH|...)
- translatable (checkbox, default="0", property, locale=all)
- use_mantine_style (checkbox, default="1", property, locale=all, hidden)
- value (text, default=null, property, locale=all)

### textarea (Input)

Textarea component for multi-line text input with autosize and resize options. It supports Mantine styling.

Fields:
- description (textarea, default=null, translatable, locale=en-GB|de-CH|...)
- disabled (checkbox, default="0", property, locale=all)
- is_required (checkbox, default="0", property, locale=all)
- label (markdown-inline, default=null, translatable, locale=en-GB|de-CH|...)
- locked_after_submit (checkbox, default="0", property, locale=all)
- mantine_left_icon (select-icon, default=null, property, locale=all)
- mantine_radius (slider, default="sm", property, locale=all) — options: "none" | "xs" | "sm" | "md" | "lg" | "xl"
- mantine_right_icon (select-icon, default=null, property, locale=all)
- mantine_size (slider, default="sm", property, locale=all) — options: "xs" | "sm" | "md" | "lg" | "xl"
- mantine_spacing_margin (mantine_spacing_margin, default="", property, locale=all)
- mantine_textarea_autosize (checkbox, default="1", property, locale=all)
- mantine_textarea_max_rows (select, default="8", property, locale=all) — options: "5" | "8" | "10" | "15" | "20"
- mantine_textarea_min_rows (select, default="3", property, locale=all) — options: "1" | "2" | "3" | "4" | "5"
- mantine_textarea_resize (segment, default="none", property, locale=all) — options: "none" | "vertical" | "both"
- mantine_textarea_rows (select, default="4", property, locale=all) — options: "3" | "4" | "5" | "6" | "8" | "10"
- mantine_textarea_variant (segment, default="default", property, locale=all) — options: "default" | "filled" | "unstyled"
- mantine_variant (select, default="default", property, locale=all) — options: "filled" | "light" | "outline" | "subtle" | "default" | "transparent" | "white"
- name (text, default=null, property, locale=all)
- placeholder (text, default=null, translatable, locale=en-GB|de-CH|...)
- translatable (checkbox, default="0", property, locale=all)
- use_mantine_style (checkbox, default="1", property, locale=all)
- value (text, default=null, property, locale=all)

### theme-icon (mantine)

Mantine ThemeIcon component for themed icon containers

Fields:
- mantine_color (color-picker, default="blue", property, locale=all) — options: "gray" | "red" | "grape" | "violet" | "blue" | "cyan" | "green" | "lime" | "yellow" | "orange"
- mantine_left_icon (select-icon, default=null, property, locale=all)
- mantine_radius (slider, default="sm", property, locale=all) — options: "none" | "xs" | "sm" | "md" | "lg" | "xl"
- mantine_size (slider, default="sm", property, locale=all) — options: "xs" | "sm" | "md" | "lg" | "xl"
- mantine_spacing_margin (mantine_spacing_margin, default="", property, locale=all)
- mantine_variant (select, default="filled", property, locale=all) — options: "filled" | "light" | "outline" | "subtle" | "default" | "transparent" | "white"
- use_mantine_style (checkbox, default="1", property, locale=all, hidden)

### timeline (mantine)

Mantine Timeline component for chronological displays

Fields:
- mantine_color (color-picker, default="blue", property, locale=all) — options: "gray" | "red" | "grape" | "violet" | "blue" | "cyan" | "green" | "lime" | "yellow" | "orange"
- mantine_spacing_margin (mantine_spacing_margin, default="", property, locale=all)
- mantine_timeline_active (select, default="0", property, locale=all) — options: "-1" | "0" | "1" | "3" | "4" | "5"
- mantine_timeline_align (segment, default="left", property, locale=all) — options: "left" | "right"
- mantine_timeline_bullet_size (select, default="24", property, locale=all) — options: "12" | "16" | "20" | "24" | "32"
- mantine_timeline_line_width (select, default="2", property, locale=all) — options: "1" | "2" | "3" | "4"
- use_mantine_style (checkbox, default="1", property, locale=all, hidden)

Allowed children: timeline-item

### timeline-item (mantine) — can_have_children

Mantine Timeline.Item component for individual timeline entries

Fields:
- mantine_color (color-picker, default="gray", property, locale=all) — options: "gray" | "red" | "grape" | "violet" | "blue" | "cyan" | "green" | "lime" | "yellow" | "orange"
- mantine_timeline_item_bullet (select-icon, default=null, property, locale=all)
- mantine_timeline_item_line_variant (select, default="solid", property, locale=all) — options: "solid" | "dashed" | "dotted"
- title (markdown-inline, default=null, translatable, locale=en-GB|de-CH|...)
- use_mantine_style (checkbox, default="1", property, locale=all, hidden)

Allowed children: (any)
Allowed parents: timeline

### title (mantine)

Mantine Title component for headings and titles

Fields:
- content (textarea, default=null, translatable, locale=en-GB|de-CH|...)
- mantine_size (slider, default="lg", property, locale=all) — options: "xs" | "sm" | "md" | "lg" | "xl"
- mantine_spacing_margin (mantine_spacing_margin, default="", property, locale=all)
- mantine_title_line_clamp (select, default=null, property, locale=all) — options: "1" | "2" | "3" | "4" | "5"
- mantine_title_order (segment, default="1", property, locale=all) — options: "1" | "2" | "3" | "4" | "5" | "6"
- mantine_title_text_wrap (segment, default="wrap", property, locale=all) — options: "wrap" | "balance" | "nowrap"
- use_mantine_style (checkbox, default="1", property, locale=all, hidden)

### twoFactorAuth (Admin)

Provides a form for two-factor authentication where users can enter their verification code.

Fields:
- alert_fail (text, default="Invalid verification code. Please try again.", translatable, locale=en-GB|de-CH|...)
- label (markdown-inline, default="Two-Factor Authentication", translatable, locale=en-GB|de-CH|...)
- label_expiration_2fa (markdown-inline, default="Code expires in", translatable, locale=en-GB|de-CH|...)
- mantine_spacing_margin_padding (mantine_spacing_margin_padding, default="", property, locale=all)
- text_md (markdown, default="Please enter the 6-digit code sent to your email", translatable, locale=en-GB|de-CH|...)

### typography (mantine) — can_have_children

Mantine Typography component for consistent typography styles

Fields:
- mantine_spacing_margin_padding (mantine_spacing_margin_padding, default="", property, locale=all)
- use_mantine_style (checkbox, default="1", property, locale=all, hidden)

Allowed children: (any)

### validate (Admin) — can_have_children

User account validation form that accepts user ID and token from URL, validates and activates account. Can have children for additional form fields.

Fields:
- alert_fail (text, default="Validation failed. Please check your information and try again.", translatable, locale=en-GB|de-CH|...)
- alert_success (text, default="Account validated successfully! Welcome to our platform.", translatable, locale=en-GB|de-CH|...)
- anonymous_user_name_description (markdown, default="This name will be visible to other users", translatable, locale=en-GB|de-CH|...)
- btn_cancel_url (select-page-keyword, default=null, property, locale=all)
- label_activate (text, default="Activate Account", translatable, locale=en-GB|de-CH|...)
- label_cancel (text, default="Cancel", translatable, locale=en-GB|de-CH|...)
- label_name (text, default="Name", translatable, locale=en-GB|de-CH|...)
- label_pw (text, default="Password", translatable, locale=en-GB|de-CH|...)
- label_pw_confirm (text, default="Confirm Password", translatable, locale=en-GB|de-CH|...)
- label_save (text, default="Save", translatable, locale=en-GB|de-CH|...)
- label_timezone (text, default="Timezone", translatable, locale=en-GB|de-CH|...)
- label_update (text, default="Update", translatable, locale=en-GB|de-CH|...)
- mantine_border (checkbox, default="1", property, locale=all)
- mantine_btn_cancel_color (color-picker, default="gray", property, locale=all) — options: "gray" | "red" | "grape" | "violet" | "blue" | "cyan" | "green" | "lime" | "yellow" | "orange"
- mantine_btn_save_color (color-picker, default="blue", property, locale=all) — options: "gray" | "red" | "grape" | "violet" | "blue" | "cyan" | "green" | "lime" | "yellow" | "orange"
- mantine_buttons_order (segment, default="save-cancel", property, locale=all) — options: "save-cancel" | "cancel-save"
- mantine_buttons_position (select, default="space-between", property, locale=all) — options: "space-between" | "center" | "flex-end" | "flex-start"
- mantine_buttons_radius (slider, default="sm", property, locale=all) — options: "none" | "xs" | "sm" | "md" | "lg" | "xl"
- mantine_buttons_size (slider, default="sm", property, locale=all) — options: "xs" | "sm" | "md" | "lg" | "xl"
- mantine_buttons_variant (select, default="filled", property, locale=all) — options: "filled" | "light" | "outline" | "transparent" | "white" | "subtle" | "gradient"
- mantine_card_padding (slider, default="lg", property, locale=all) — options: "none" | "xs" | "sm" | "md" | "lg" | "xl"
- mantine_card_shadow (slider, default="sm", property, locale=all) — options: "none" | "xs" | "sm" | "md" | "lg" | "xl"
- mantine_radius (slider, default="sm", property, locale=all) — options: "none" | "xs" | "sm" | "md" | "lg" | "xl"
- mantine_spacing_margin_padding (mantine_spacing_margin_padding, default="", property, locale=all)
- name (text, default="validate_form", property, locale=all)
- name_description (markdown-inline, default=null, translatable, locale=en-GB|de-CH|...)
- name_placeholder (text, default="Enter your full name", translatable, locale=en-GB|de-CH|...)
- pw_placeholder (text, default="Enter your password", translatable, locale=en-GB|de-CH|...)
- redirect_at_end (select-page-keyword, default="login", property, locale=all)
- subtitle (text, default="Please complete your account setup to activate your account", translatable, locale=en-GB|de-CH|...)
- title (markdown-inline, default="Account Validation", translatable, locale=en-GB|de-CH|...)
- use_mantine_style (checkbox, default="1", property, locale=all, hidden)

Allowed children: (any)

### version (Admin)

Add information about the DB version and for the git version of Selfhelp

### video (Media)

allows to load and display a video on a page.

Fields:
- alt (text, default=null, translatable, locale=en-GB|de-CH|...)
- is_fluid (checkbox, default="1", property, locale=all)
- mantine_spacing_margin (mantine_spacing_margin, default="", property, locale=all)
- video_src (select-video, default=null, property, locale=all)

<!-- CATALOG:END -->
