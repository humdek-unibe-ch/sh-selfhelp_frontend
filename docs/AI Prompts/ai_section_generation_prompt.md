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

- `<LOCALES>` — one or more locales, comma-separated. Examples: `en-GB`
  or `en-GB,de-CH`. If only one locale is provided, emit one translation
  entry per translatable field under that locale. If multiple, provide
  one entry per locale.
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
   locale; each locale has `{ "content": "...", "meta": "..." }`. Omit `meta`
   when null/empty.
5. `global_fields` holds `condition`, `data_config`, `css`, `css_mobile`,
   `debug`. Omit any key that's null/empty. `debug` only appears when `true`.
   Omit `global_fields` entirely when all keys would be omitted.
6. `children` is an array; **omit it when empty**.
7. Booleans are ALWAYS strings (`"0"` / `"1"`) when stored in a translation
   field. Real JSON booleans are only allowed inside `global_fields.debug`.
8. CSS uses **Tailwind utility classes**. Every visual element that can be
   themed MUST include `dark:` variants. Mobile overrides go into
   `global_fields.css_mobile`.
9. Image fields use `img_src`. For placeholder/illustrative images, use the
   canonical URL `/assets/image-holder.png` (relative path; the backend serves
   the placeholder).
10. Do NOT include `id`, `position`, `timestamp`, or any ID-like key — the
    backend assigns those.

---

## JSON shape — minimal round-trip example

Single locale (`<LOCALES>` = `en-GB`), hero container with one heading:

```json
[
  {
    "section_name": "hero",
    "style_name": "container",
    "fields": {
      "mantine_size": {
        "en-GB": { "content": "md" }
      }
    },
    "global_fields": {
      "css": "py-16 px-4 bg-white dark:bg-gray-900"
    },
    "children": [
      {
        "style_name": "heading",
        "fields": {
          "title": {
            "en-GB": { "content": "Welcome" }
          },
          "level": {
            "en-GB": { "content": "1" }
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
    "style_name": "heading",
    "fields": {
      "title": {
        "en-GB": { "content": "Welcome" },
        "de-CH": { "content": "Willkommen" }
      },
      "level": {
        "en-GB": { "content": "1" }
      }
    }
  }
]
```

Notice how a non-translatable property field (`level`) only needs one locale
entry — the importer doesn't replicate it across locales. When in doubt,
emit only `en-GB` for property/technical fields and all locales for
user-visible text fields. The style/field catalog below tells you which is
which (`display=1` = translatable, `display=0` = internal/property).

---

## Form composition rules

- `text-input` and `select` render the control **without** a label. Always
  precede them with a separate `text` or `heading` sibling that provides the
  visual label.
- `textarea` ships with its own built-in label when
  `use_mantine_style` is `"1"` (the default).
- A `formUserInput` (or `formUserInputRecord`/`formUserInputLog`) style is
  required as the parent when collecting data; the individual input styles
  must be placed inside its `children`.

---

## Dark / light theme compatibility

- Use a neutral light base (`bg-white`, `text-gray-900`) and pair each
  color-bearing class with a `dark:` variant. Example:
  `bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100`.
- For images that rely on contrast (logos, icons) prefer SVG; otherwise pick
  images that read on both themes.

---

## Language policy (replacing `<LOCALES>`)

- Replace `<LOCALES>` with the list you want translations for.
- If a single locale is given, treat every translatable field as present only
  in that locale; the importer won't try to fan-out across other languages.
- If multiple locales are given, emit one entry per locale for translatable
  fields. Untranslatable/technical fields (`display=0` in the catalog) still
  only need the primary locale.
- Locales must be valid (e.g. `en-GB`, `de-CH`). Unknown locales are rejected
  with an HTTP 422 at import time.

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
> Catalog regenerated: 2026-04-24T17:15:17+02:00

### accordion (mantine) — can_have_children

Mantine Accordion component for collapsible content

Fields:
- mantine_accordion_chevron_position (segment, default="right", property)
- mantine_accordion_chevron_size (select, default="16", property)
- mantine_accordion_default_value (text, default=null, property)
- mantine_accordion_disable_chevron_rotation (checkbox, default="0", property)
- mantine_accordion_loop (checkbox, default="1", property)
- mantine_accordion_multiple (checkbox, default="0", property)
- mantine_accordion_transition_duration (select, default="200", property)
- mantine_accordion_variant (select, default="default", property)
- mantine_radius (slider, default="sm", property)
- mantine_spacing_margin_padding (mantine_spacing_margin_padding, default="", property)
- use_mantine_style (checkbox, default="1", property, hidden)

Allowed children: (any)

### accordion-item (mantine) — can_have_children

Mantine Accordion.Item component for individual accordion items (accepts all children, panels handled in frontend)

Fields:
- disabled (checkbox, default="0", property)
- label (markdown-inline, default=null, translatable)
- mantine_accordion_item_icon (select-icon, default=null, property)
- mantine_accordion_item_value (text, default=null, property)
- mantine_spacing_margin_padding (mantine_spacing_margin_padding, default="", property)
- use_mantine_style (checkbox, default="1", property, hidden)

Allowed children: (any)
Allowed parents: accordion

### action-icon (mantine)

Mantine ActionIcon component for interactive icons

Fields:
- disabled (checkbox, default="0", property)
- is_link (checkbox, default="0", property)
- mantine_action_icon_loading (checkbox, default="0", property)
- mantine_color (color-picker, default="blue", property)
- mantine_left_icon (select-icon, default=null, property)
- mantine_radius (slider, default="sm", property)
- mantine_size (slider, default="sm", property)
- mantine_spacing_margin (mantine_spacing_margin, default="", property)
- mantine_variant (select, default="subtle", property)
- open_in_new_tab (checkbox, default="0", property)
- page_keyword (select-page-keyword, default="#", property)
- use_mantine_style (checkbox, default="1", property, hidden)

### alert (mantine) — can_have_children

Mantine Alert component for displaying important messages and notifications

Fields:
- content (textarea, default=null, translatable)
- mantine_alert_title (text, default=null, translatable)
- mantine_alert_with_close_button (checkbox, default="0", property)
- mantine_color (color-picker, default="blue", property)
- mantine_left_icon (select-icon, default=null, property)
- mantine_radius (slider, default="sm", property)
- mantine_size (slider, default="md", property)
- mantine_spacing_margin_padding (mantine_spacing_margin_padding, default="", property)
- mantine_variant (select, default="light", property)
- mantine_with_close_button (checkbox, default="0", property)
- use_mantine_style (checkbox, default="1", property, hidden)
- value (text, default=null, property)

Allowed children: (any)

### aspect-ratio (mantine) — can_have_children

Mantine AspectRatio component for maintaining aspect ratios

Fields:
- mantine_aspect_ratio (select, default="16/9", property)
- mantine_spacing_margin (mantine_spacing_margin, default="", property)
- use_mantine_style (checkbox, default="1", property, hidden)

Allowed children: (any)

### audio (Media)

allows to load and replay an audio source on a page.

Fields:
- alt (text, default=null, translatable)
- mantine_spacing_margin (mantine_spacing_margin, default="", property)
- sources (json, default=null, translatable)

### avatar (mantine)

Mantine Avatar component for user profile images

Fields:
- alt (text, default="Avatar", translatable)
- img_src (select-image, default=null, translatable)
- mantine_avatar_initials (text, default="U", property)
- mantine_color (color-picker, default="blue", property)
- mantine_left_icon (select-icon, default=null, property)
- mantine_radius (slider, default="50%", property)
- mantine_size (slider, default="sm", property)
- mantine_spacing_margin (mantine_spacing_margin, default="", property)
- mantine_variant (select, default="light", property)
- use_mantine_style (checkbox, default="1", property, hidden)

### background-image (mantine) — can_have_children

Mantine background-image component for background images

Fields:
- img_src (select-image, default=null, translatable)
- mantine_radius (slider, default="sm", property)
- mantine_spacing_margin_padding (mantine_spacing_margin_padding, default="", property)
- use_mantine_style (checkbox, default="1", property, hidden)

Allowed children: (any)

### badge (mantine)

Mantine Badge component for status indicators and labels

Fields:
- label (markdown-inline, default=null, translatable)
- mantine_auto_contrast (checkbox, default="0", property)
- mantine_color (color-picker, default="blue", property)
- mantine_left_icon (select-icon, default=null, property)
- mantine_radius (slider, default="xl", property)
- mantine_right_icon (select-icon, default=null, property)
- mantine_size (slider, default="sm", property)
- mantine_spacing_margin (mantine_spacing_margin, default="", property)
- mantine_variant (select, default="filled", property)
- use_mantine_style (checkbox, default="1", property, hidden)

### blockquote (mantine)

Mantine Blockquote component for quoted text

Fields:
- cite (text, default=null, translatable)
- content (textarea, default=null, translatable)
- mantine_color (color-picker, default="gray", property)
- mantine_icon_size (select, default="20", property)
- mantine_left_icon (select-icon, default=null, property)
- mantine_spacing_margin_padding (mantine_spacing_margin_padding, default="", property)
- use_mantine_style (checkbox, default="1", property, hidden)

### box (mantine) — can_have_children

Mantine Box component as a base for all Mantine components with style props support

Fields:
- content (textarea, default="", translatable)
- mantine_spacing_margin_padding (mantine_spacing_margin_padding, default="", property)
- use_mantine_style (checkbox, default="1", property, hidden)

Allowed children: (any)

### button (Link)

renders a button-style link with several predefined colour schemes.

Fields:
- confirmation_continue (text, default="OK", translatable)
- confirmation_message (textarea, default="Do you want to continue?", translatable)
- confirmation_title (text, default="", translatable)
- disabled (checkbox, default="0", property)
- is_link (checkbox, default="0", property)
- label (markdown-inline, default=null, translatable)
- label_cancel (text, default="", translatable)
- mantine_auto_contrast (checkbox, default="0", property)
- mantine_color (color-picker, default="blue", property)
- mantine_compact (checkbox, default="0", property)
- mantine_fullwidth (checkbox, default="0", property)
- mantine_left_icon (select-icon, default=null, property)
- mantine_radius (slider, default="sm", property)
- mantine_right_icon (select-icon, default=null, property)
- mantine_size (slider, default="sm", property)
- mantine_spacing_margin (mantine_spacing_margin, default="", property)
- mantine_variant (select, default="filled", property)
- open_in_new_tab (checkbox, default="0", property)
- page_keyword (select-page-keyword, default="#", property)
- use_mantine_style (checkbox, default="1", property, hidden)

### card (mantine) — can_have_children

Card container component with Mantine styling

Fields:
- mantine_border (checkbox, default="0", property)
- mantine_card_padding (slider, default="sm", property)
- mantine_card_shadow (slider, default="sm", property)
- mantine_radius (slider, default="sm", property)
- mantine_spacing_margin_padding (mantine_spacing_margin_padding, default="", property)
- use_mantine_style (checkbox, default="1", property, hidden)

Allowed children: (any)

### card-segment (mantine) — can_have_children

Card segment component for organizing card content

Fields:
- mantine_spacing_margin_padding (mantine_spacing_margin_padding, default="", property)

Allowed children: (any)
Allowed parents: card

### carousel (mantine) — can_have_children

Mantine Carousel component for displaying content in a slideshow format

Fields:
- drag_free (checkbox, default="0", property)
- has_controls (checkbox, default="1", property)
- has_indicators (checkbox, default="1", property)
- mantine_carousel_align (segment, default="start", property)
- mantine_carousel_contain_scroll (segment, default="trimSnaps", property)
- mantine_carousel_controls_offset (slider, default="sm", property)
- mantine_carousel_duration (select, default="25", property)
- mantine_carousel_embla_options (json, default=null, property)
- mantine_carousel_in_view_threshold (slider, default="0", property)
- mantine_carousel_next_control_icon (select-icon, default=null, property)
- mantine_carousel_previous_control_icon (select-icon, default=null, property)
- mantine_carousel_slide_gap (slider, default="sm", property)
- mantine_carousel_slide_size (slider, default="100", property)
- mantine_control_size (select, default="26", property)
- mantine_height (select, default=null, property)
- mantine_loop (checkbox, default="0", property)
- mantine_orientation (segment, default="horizontal", property)
- mantine_spacing_margin_padding (mantine_spacing_margin_padding, default="", property)
- skip_snaps (checkbox, default="0", property)
- use_mantine_style (checkbox, default="1", property, hidden)

Allowed children: (any)

### center (mantine) — can_have_children

Mantine Center component for centering content

Fields:
- mantine_center_inline (checkbox, default="0", property)
- mantine_height (select, default=null, property)
- mantine_mah (select, default=null, property)
- mantine_maw (select, default=null, property)
- mantine_mih (select, default=null, property)
- mantine_miw (select, default=null, property)
- mantine_spacing_margin_padding (mantine_spacing_margin_padding, default="", property)
- mantine_width (select, default=null, property)

Allowed children: (any)

### checkbox (mantine)

Mantine Checkbox component for boolean input with customizable styling

Fields:
- checkbox_value (text, default="1", property)
- description (textarea, default=null, translatable)
- disabled (checkbox, default="0", property)
- is_required (checkbox, default="0", property)
- label (markdown-inline, default=null, translatable)
- locked_after_submit (checkbox, default="0", property)
- mantine_checkbox_checked (checkbox, default="0", property)
- mantine_checkbox_icon (select-icon, default=null, property)
- mantine_checkbox_indeterminate (checkbox, default="0", property)
- mantine_checkbox_labelPosition (segment, default="right", property)
- mantine_color (color-picker, default=null, property)
- mantine_radius (slider, default="sm", property)
- mantine_size (slider, default="sm", property)
- mantine_spacing_margin (mantine_spacing_margin, default="", property)
- mantine_use_input_wrapper (checkbox, default="0", property)
- name (text, default=null, property)
- toggle_switch (checkbox, default="0", property)
- use_mantine_style (checkbox, default="1", property, hidden)
- value (text, default=null, property)

### chip (mantine)

Mantine Chip component for selectable tags

Fields:
- chip_checked (checkbox, default="0", property)
- chip_off_value (text, default="0", property)
- chip_on_value (text, default="1", property)
- disabled (checkbox, default="0", property)
- is_required (checkbox, default="0", property)
- label (markdown-inline, default=null, translatable)
- mantine_chip_variant (select, default="filled", property)
- mantine_color (color-picker, default="blue", property)
- mantine_icon_size (select, default="16", property)
- mantine_left_icon (select-icon, default=null, property)
- mantine_radius (slider, default="sm", property)
- mantine_size (slider, default="sm", property)
- mantine_spacing_margin (mantine_spacing_margin, default="", property)
- mantine_tooltip_position (select, default="top", property)
- name (text, default=null, property)
- use_mantine_style (checkbox, default="1", property, hidden)
- value (text, default=null, property)

### code (mantine)

Mantine Code component for inline code display

Fields:
- content (textarea, default=null, translatable)
- mantine_code_block (checkbox, default="0", property)
- mantine_color (color-picker, default="gray", property)
- mantine_spacing_margin_padding (mantine_spacing_margin_padding, default="", property)
- use_mantine_style (checkbox, default="1", property, hidden)

### color-input (mantine)

Mantine color-input component for color selection

Fields:
- description (textarea, default="", translatable)
- disabled (checkbox, default="0", property)
- is_required (checkbox, default="0", property)
- label (markdown-inline, default="", translatable)
- mantine_color_format (segment, default="hex", property)
- mantine_radius (slider, default="sm", property)
- mantine_size (slider, default="sm", property)
- mantine_spacing_margin (mantine_spacing_margin, default="", property)
- name (text, default="", property)
- placeholder (text, default="Pick a color", translatable)
- use_mantine_style (checkbox, default="1", property, hidden)
- value (text, default="", property)

### color-picker (mantine)

Mantine color-picker component for color selection

Fields:
- description (textarea, default="", translatable)
- is_required (checkbox, default="0", property)
- label (markdown-inline, default="", translatable)
- mantine_color_format (segment, default="hex", property)
- mantine_color_picker_alpha_label (text, default="Alpha", translatable)
- mantine_color_picker_hue_label (text, default="Hue", translatable)
- mantine_color_picker_saturation_label (text, default="Saturation", translatable)
- mantine_color_picker_swatches (textarea, default="[\"#2e2e2e\", \"#868e96\", \"#fa5252\", \"#e64980\", \"#be4bdb\", \"#7950f2\", \"#4c6ef5\", \"#228be6\"]", property)
- mantine_color_picker_swatches_per_row (slider, default="7", property)
- mantine_fullwidth (checkbox, default="0", property)
- mantine_size (slider, default="sm", property)
- mantine_spacing_margin (mantine_spacing_margin, default="", property)
- name (text, default="", property)
- use_mantine_style (checkbox, default="1", property, hidden)
- value (text, default="", property)

### combobox (mantine)

Mantine Combobox component for advanced select inputs

Fields:
- description (textarea, default="", translatable)
- disabled (checkbox, default="0", property)
- is_required (checkbox, default="0", property)
- label (markdown-inline, default="", translatable)
- mantine_combobox_clearable (checkbox, default="0", property)
- mantine_combobox_creatable (checkbox, default="0", property)
- mantine_combobox_multi_select (checkbox, default="0", property)
- mantine_combobox_options (json, default="[{\"value\":\"option1\",\"text\":\"Option 1\"},{\"value\":\"option2\",\"text\":\"Option 2\"}]", translatable)
- mantine_combobox_searchable (checkbox, default="1", property)
- mantine_combobox_separator (text, default=" ", property)
- mantine_multi_select_max_values (select, default=null, property)
- mantine_spacing_margin (mantine_spacing_margin, default="", property)
- name (text, default="", property)
- placeholder (text, default="Select option", translatable)
- use_mantine_style (checkbox, default="1", property, hidden)
- value (text, default="", property)

### container (mantine) — can_have_children

Mantine Container component for responsive layout containers

Fields:
- mantine_fluid (checkbox, default="0", property)
- mantine_px (slider, default=null, property)
- mantine_py (slider, default=null, property)
- mantine_size (slider, default=null, property)
- mantine_spacing_margin_padding (mantine_spacing_margin_padding, default="", property)
- use_mantine_style (checkbox, default="1", property, hidden)

Allowed children: (any)

### dataContainer (Wrapper) — can_have_children

Data container style which propagate all loaded data to its children.

Fields:
- scope (text, default="", property)

Allowed children: (any)

### datepicker (mantine)

Mantine DatePicker component for date, time, and datetime input with comprehensive formatting options

Fields:
- description (textarea, default=null, translatable)
- disabled (checkbox, default="0", property)
- is_required (checkbox, default="0", property)
- label (markdown-inline, default=null, translatable)
- mantine_datepicker_allow_deseselect (checkbox, default="0", property)
- mantine_datepicker_clearable (checkbox, default="0", property)
- mantine_datepicker_consistent_weeks (checkbox, default="0", property)
- mantine_datepicker_date_format (select, default="YYYY-MM-DD", property)
- mantine_datepicker_first_day_of_week (segment, default="1", property)
- mantine_datepicker_format (select, default=null, property)
- mantine_datepicker_hide_outside_dates (checkbox, default="0", property)
- mantine_datepicker_hide_weekends (checkbox, default="0", property)
- mantine_datepicker_locale (text, default="en", property)
- mantine_datepicker_max_date (text, default=null, property)
- mantine_datepicker_min_date (text, default=null, property)
- mantine_datepicker_placeholder (text, default=null, translatable)
- mantine_datepicker_readonly (checkbox, default="0", property)
- mantine_datepicker_time_format (segment, default="24", property)
- mantine_datepicker_time_grid_config (textarea, default=null, property)
- mantine_datepicker_time_step (segment, default="15", property)
- mantine_datepicker_type (segment, default="date", property)
- mantine_datepicker_weekend_days (text, default="[0,6]", property)
- mantine_datepicker_with_seconds (checkbox, default="0", property)
- mantine_datepicker_with_time_grid (checkbox, default="0", property)
- mantine_spacing_margin (mantine_spacing_margin, default="", property)
- name (text, default=null, property)
- value (text, default=null, property)

### divider (mantine)

Mantine Divider component for visual separation

Fields:
- mantine_color (color-picker, default="gray", property)
- mantine_divider_label (text, default=null, translatable)
- mantine_divider_label_position (select, default="center", property)
- mantine_divider_variant (select, default="solid", property)
- mantine_orientation (segment, default="horizontal", property)
- mantine_size (slider, default="sm", property)
- mantine_spacing_margin (mantine_spacing_margin, default="", property)
- use_mantine_style (checkbox, default="1", property, hidden)

### entryList (Wrapper) — can_have_children

Wrap other styles that later visualize list of entries (inserted via `formUserInput`).

Fields:
- data_table (select-data_table, default="", property)
- filter (code, default=null, property)
- load_as_table (checkbox, default="0", property)
- own_entries_only (checkbox, default="1", property)
- scope (text, default="", property)

Allowed children: (any)

### entryRecord (Wrapper) — can_have_children

Wrap other styles that later visualize a record from the entry list

Fields:
- data_table (select-data_table, default="", property)
- filter (code, default=null, property)
- own_entries_only (checkbox, default="1", property)
- scope (text, default="", property)
- url_param (text, default="record_id", property)

Allowed children: (any)

### entryRecordDelete (Wrapper)

Style that allows the user to delete entry record

Fields:
- confirmation_cancel (markdown-inline, default="", translatable)
- confirmation_continue (text, default="OK", translatable)
- confirmation_message (textarea, default="Do you want to continue?", translatable)
- confirmation_title (text, default="", translatable)
- label_delete (text, default="Delete", translatable)
- own_entries_only (checkbox, default="1", property)
- type (style-bootstrap, default="danger", property)

### fieldset (mantine) — can_have_children

Mantine Fieldset component for grouping form elements

Fields:
- disabled (checkbox, default="0", property)
- label (markdown-inline, default=null, translatable)
- mantine_fieldset_variant (select, default="default", property)
- mantine_radius (slider, default="sm", property)
- mantine_spacing_margin_padding (mantine_spacing_margin_padding, default="", property)
- use_mantine_style (checkbox, default="1", property, hidden)

Allowed children: (any)

### figure (Media) — can_have_children

allows to attach a caption to media elements. A figure expects a media style as its immediate child.

Fields:
- caption (markdown-inline, default=null, translatable)
- caption_title (text, default=null, translatable)
- mantine_spacing_margin (mantine_spacing_margin, default="", property)

Allowed children: (any)

### file-input (mantine)

Mantine FileInput component for file uploads

Fields:
- description (textarea, default=null, translatable)
- disabled (checkbox, default="0", property)
- is_required (checkbox, default="0", property)
- label (markdown-inline, default=null, translatable)
- mantine_file_input_accept (select, default=null, property)
- mantine_file_input_clearable (checkbox, default="1", property)
- mantine_file_input_drag_drop (checkbox, default="0", property)
- mantine_file_input_max_files (select, default=null, property)
- mantine_file_input_max_size (select, default=null, property)
- mantine_file_input_multiple (checkbox, default="0", property)
- mantine_left_icon (select-icon, default=null, property)
- mantine_radius (slider, default="sm", property)
- mantine_right_icon (select-icon, default=null, property)
- mantine_size (slider, default="sm", property)
- mantine_spacing_margin (mantine_spacing_margin, default="", property)
- name (text, default=null, property)
- placeholder (text, default="Select files", translatable)
- use_mantine_style (checkbox, default="1", property, hidden)

### flex (mantine) — can_have_children

Mantine Flex component for flexible layouts

Fields:
- mantine_align (select, default=null, property)
- mantine_direction (segment, default="row", property)
- mantine_gap (slider, default="sm", property)
- mantine_height (select, default=null, property)
- mantine_justify (select, default=null, property)
- mantine_spacing_margin_padding (mantine_spacing_margin_padding, default="", property)
- mantine_width (select, default=null, property)
- mantine_wrap (segment, default="nowrap", property)
- use_mantine_style (checkbox, default="1", property, hidden)

Allowed children: (any)

### form-log (Form) — can_have_children

Log form component that clears data after successful submission. Supports multiple entries and form validation.

Fields:
- alert_error (textarea, default="An error occurred while submitting the form", translatable)
- alert_success (text, default="", translatable)
- btn_cancel_label (text, default="Cancel", translatable)
- btn_cancel_url (select-page-keyword, default=null, property)
- btn_save_label (text, default="Save", translatable)
- is_log (checkbox, default="1", property, hidden)
- mantine_btn_cancel_color (color-picker, default="gray", property)
- mantine_btn_save_color (color-picker, default="blue", property)
- mantine_buttons_order (segment, default="save-cancel", property)
- mantine_buttons_position (select, default="space-between", property)
- mantine_buttons_radius (slider, default="sm", property)
- mantine_buttons_size (slider, default="sm", property)
- mantine_buttons_variant (select, default="filled", property)
- mantine_spacing_margin_padding (mantine_spacing_margin_padding, default="", property)
- name (text, default=null, property)
- redirect_at_end (select-page-keyword, default=null, property)
- use_mantine_style (checkbox, default="1", property, hidden)

Allowed children: (any)

### form-record (Form) — can_have_children

Record form component that preserves data and updates existing records. Pre-populates fields with existing data.

Fields:
- alert_error (textarea, default="An error occurred while saving the record", translatable)
- alert_success (text, default="", translatable)
- btn_cancel_label (text, default="Cancel", translatable)
- btn_cancel_url (select-page-keyword, default=null, property)
- btn_save_label (text, default="Save", translatable)
- btn_update_label (text, default="Update", translatable)
- is_log (checkbox, default="0", property, hidden)
- mantine_btn_cancel_color (color-picker, default="gray", property)
- mantine_btn_save_color (color-picker, default="blue", property)
- mantine_btn_update_color (color-picker, default="orange", property)
- mantine_buttons_order (segment, default="save-cancel", property)
- mantine_buttons_position (select, default="space-between", property)
- mantine_buttons_radius (slider, default="sm", property)
- mantine_buttons_size (slider, default="sm", property)
- mantine_buttons_variant (select, default="filled", property)
- mantine_spacing_margin_padding (mantine_spacing_margin_padding, default="", property)
- name (text, default=null, property)
- redirect_at_end (select-page-keyword, default=null, property)
- use_mantine_style (checkbox, default="1", property)

Allowed children: (any)

### grid (mantine)

Mantine Grid component for responsive 12 columns grid system

Fields:
- mantine_align (select, default=null, property)
- mantine_cols (slider, default="12", property)
- mantine_gap (slider, default="sm", property)
- mantine_grid_overflow (segment, default="visible", property)
- mantine_height (select, default=null, property)
- mantine_justify (select, default=null, property)
- mantine_spacing_margin_padding (mantine_spacing_margin_padding, default="", property)
- mantine_width (select, default=null, property)
- use_mantine_style (checkbox, default="1", property, hidden)

Allowed children: grid-column

### grid-column (mantine) — can_have_children

Mantine Grid.Col component for grid column with span, offset, and order controls

Fields:
- mantine_grid_grow (checkbox, default="0", property)
- mantine_grid_offset (slider, default="0", property)
- mantine_grid_order (slider, default=null, property)
- mantine_grid_span (slider, default="1", property)
- mantine_height (select, default=null, property)
- mantine_spacing_margin_padding (mantine_spacing_margin_padding, default="", property)
- mantine_width (select, default=null, property)
- use_mantine_style (checkbox, default="1", property, hidden)

Allowed children: (any)
Allowed parents: grid

### group (mantine) — can_have_children

Mantine Group component for horizontal layouts

Fields:
- mantine_align (select, default=null, property)
- mantine_gap (slider, default="sm", property)
- mantine_group_grow (checkbox, default="0", property)
- mantine_group_wrap (segment, default="0", property)
- mantine_height (select, default=null, property)
- mantine_justify (select, default=null, property)
- mantine_spacing_margin_padding (mantine_spacing_margin_padding, default="", property)
- mantine_width (select, default=null, property)
- use_mantine_style (checkbox, default="1", property, hidden)

Allowed children: (any)

### highlight (mantine)

Mantine Highlight component for text highlighting

Fields:
- mantine_color (color-picker, default="yellow", property)
- mantine_highlight_highlight (text, default="highlight", translatable)
- mantine_spacing_margin_padding (mantine_spacing_margin_padding, default="", property)
- text (textarea, default="Highlight some text in this content", translatable)
- use_mantine_style (checkbox, default="1", property, hidden)

### html-tag (Wrapper) — can_have_children

Raw HTML tag component for custom flexible UI designs - allows rendering any HTML element with children

Fields:
- html_tag (select, default="div", property)
- html_tag_content (textarea, default=null, translatable)

Allowed children: (any)

### image (Media)

allows to render an image on a page.

Fields:
- alt (text, default=null, translatable)
- img_src (select-image, default=null, translatable)
- is_fluid (checkbox, default="1", property)
- mantine_height (select, default=null, property)
- mantine_image_alt (text, default=null, translatable)
- mantine_image_fit (select, default="contain", property)
- mantine_image_src (text, default=null, translatable)
- mantine_radius (slider, default="0", property)
- mantine_spacing_margin (mantine_spacing_margin, default="", property)
- mantine_width (select, default=null, property)
- title (markdown-inline, default=null, translatable)
- use_mantine_style (checkbox, default="1", property)

### indicator (mantine) — can_have_children

Mantine Indicator component for status indicators

Fields:
- label (markdown-inline, default="", translatable)
- mantine_border (checkbox, default="0", property)
- mantine_color (color-picker, default="red", property)
- mantine_indicator_disabled (checkbox, default="0", property)
- mantine_indicator_inline (checkbox, default="0", property)
- mantine_indicator_offset (select, default="0", property)
- mantine_indicator_position (select, default="top-end", property)
- mantine_indicator_processing (checkbox, default="0", property)
- mantine_indicator_size (slider, default="10", property)
- mantine_radius (slider, default="xl", property)
- mantine_spacing_margin (mantine_spacing_margin, default="", property)
- use_mantine_style (checkbox, default="1", property, hidden)

Allowed children: (any)

### input (Input)

HTML input component for various input types (text, email, password, etc.). Renders as standard HTML input tag.

Fields:
- disabled (checkbox, default="0", property)
- is_required (checkbox, default="0", property)
- label (markdown-inline, default=null, translatable)
- locked_after_submit (checkbox, default="0", property)
- mantine_left_icon (select-icon, default=null, property)
- mantine_radius (slider, default="sm", property)
- mantine_right_icon (select-icon, default=null, property)
- mantine_size (slider, default="sm", property)
- mantine_variant (select, default="default", property)
- max (number, default=null, property)
- min (number, default=null, property)
- name (text, default=null, property)
- placeholder (text, default=null, translatable)
- translatable (checkbox, default="0", property)
- type_input (select, default="text", property)
- use_mantine_style (checkbox, default="1", property)
- value (text, default=null, property)

### kbd (mantine)

Mantine Kbd component for keyboard key display

Fields:
- label (markdown-inline, default="", translatable)
- mantine_size (slider, default="sm", property)
- mantine_spacing_margin (mantine_spacing_margin, default="", property)
- use_mantine_style (checkbox, default="1", property, hidden)

### link (Link) — can_have_children

renders a standard link but allows to open the target in a new tab.

Fields:
- label (markdown-inline, default=null, translatable)
- mantine_spacing_margin (mantine_spacing_margin, default="", property)
- open_in_new_tab (checkbox, default=null, property)
- url (text, default=null, property)

Allowed children: (any)

### list (mantine)

Mantine List component for displaying ordered or unordered lists

Fields:
- mantine_list_center (checkbox, default="0", property)
- mantine_list_icon (select-icon, default=null, property)
- mantine_list_list_style_type (select, default="disc", property)
- mantine_list_spacing (select, default="md", property)
- mantine_list_type (segment, default="unordered", property)
- mantine_list_with_padding (checkbox, default="0", property)
- mantine_size (slider, default="sm", property)
- mantine_spacing_margin_padding (mantine_spacing_margin_padding, default="", property)
- use_mantine_style (checkbox, default="1", property, hidden)

Allowed children: list-item

### list-item (mantine) — can_have_children

Mantine List.Item component for individual list items

Fields:
- mantine_list_item_content (textarea, default=null, translatable)
- mantine_list_item_icon (select-icon, default=null, property)
- mantine_spacing_margin_padding (mantine_spacing_margin_padding, default="", property)
- use_mantine_style (checkbox, default="1", property, hidden)

Allowed children: (any)
Allowed parents: list

### login (Admin)

provides a small form where the user can enter his or her email and password to access the WebApp. It also includes a link to reset a password.

Fields:
- alert_fail (text, default=null, translatable)
- label_login (text, default=null, translatable)
- label_pw (text, default=null, translatable)
- label_pw_reset (text, default=null, translatable)
- label_user (text, default=null, translatable)
- login_title (text, default=null, translatable)
- mantine_spacing_margin (mantine_spacing_margin, default="", property)
- type (style-bootstrap, default="dark", property)

### loop (Wrapper) — can_have_children

A style which takes an array object and loop the rows and load its children passing the values of the rows

Fields:
- loop (json, default=null, property)
- scope (text, default="", property)

Allowed children: (any)

### notification (mantine)

Mantine Notification component for alerts and messages

Fields:
- content (textarea, default=null, translatable)
- mantine_border (checkbox, default="0", property)
- mantine_color (color-picker, default="blue", property)
- mantine_left_icon (select-icon, default=null, property)
- mantine_notification_loading (checkbox, default="0", property)
- mantine_notification_with_close_button (checkbox, default="1", property)
- mantine_radius (slider, default="sm", property)
- mantine_spacing_margin_padding (mantine_spacing_margin_padding, default="", property)
- title (markdown-inline, default=null, translatable)
- use_mantine_style (checkbox, default="1", property, hidden)

### number-input (mantine)

Mantine NumberInput component for numeric input

Fields:
- description (textarea, default="", translatable)
- disabled (checkbox, default="0", property)
- is_required (checkbox, default="0", property)
- label (markdown-inline, default="", translatable)
- mantine_number_input_clamp_behavior (segment, default="strict", property)
- mantine_number_input_decimal_scale (slider, default="2", property)
- mantine_numeric_max (select, default=null, property)
- mantine_numeric_min (select, default=null, property)
- mantine_numeric_step (select, default="1", property)
- mantine_radius (slider, default="sm", property)
- mantine_size (slider, default="sm", property)
- mantine_spacing_margin (mantine_spacing_margin, default="", property)
- name (text, default="", property)
- placeholder (text, default="Enter number", translatable)
- use_mantine_style (checkbox, default="1", property, hidden)
- value (text, default="", property)

### paper (mantine) — can_have_children

Mantine Paper component for elevated surfaces

Fields:
- mantine_border (checkbox, default="0", property)
- mantine_paper_shadow (slider, default="sm", property)
- mantine_px (slider, default=null, property)
- mantine_py (slider, default=null, property)
- mantine_radius (slider, default="sm", property)
- mantine_spacing_margin_padding (mantine_spacing_margin_padding, default="", property)
- use_mantine_style (checkbox, default="1", property, hidden)

Allowed children: (any)

### profile (Admin)

User profile management component with account settings, password reset, and account deletion

Fields:
- mantine_spacing_margin_padding (mantine_spacing_margin_padding, default="", property)
- profile_accordion_default_opened (select, default="user_info", property)
- profile_accordion_multiple (checkbox, default="1", property)
- profile_account_info_title (text, default="Account Information", translatable)
- profile_columns (select, default="2", property)
- profile_delete_alert_text (text, default="This action cannot be undone. All your data will be permanently deleted.", translatable)
- profile_delete_button (text, default="Delete Account", translatable)
- profile_delete_description (textarea, default="<p>Permanently delete your account and all associated data. This action cannot be undone.</p>", translatable)
- profile_delete_error_email_mismatch (text, default="Email does not match your account email", translatable)
- profile_delete_error_email_required (text, default="Email confirmation is required", translatable)
- profile_delete_error_general (text, default="Failed to delete account. Please try again.", translatable)
- profile_delete_label_email (text, default="Confirm Email", translatable)
- profile_delete_modal_warning (textarea, default="<p>Deleting your account will permanently remove all your data, including profile information, preferences, and any content you have created.</p>", translatable)
- profile_delete_placeholder_email (text, default="Enter your email to confirm", translatable)
- profile_delete_success (text, default="Account deleted successfully.", translatable)
- profile_delete_title (text, default="Delete Account", translatable)
- profile_gap (select, default="md", property)
- profile_label_created (text, default="Account Created", translatable)
- profile_label_email (text, default="Email", translatable)
- profile_label_last_login (text, default="Last Login", translatable)
- profile_label_name (text, default="Full Name", translatable)
- profile_label_timezone (text, default="Timezone", translatable)
- profile_label_username (text, default="Username", translatable)
- profile_name_change_button (text, default="Update Display Name", translatable)
- profile_name_change_description (textarea, default="<p>Update your display name. This will be visible to other users.</p>", translatable)
- profile_name_change_error_general (text, default="Failed to update display name. Please try again.", translatable)
- profile_name_change_error_invalid (text, default="Display name contains invalid characters", translatable)
- profile_name_change_error_required (text, default="Display name is required", translatable)
- profile_name_change_label (text, default="New Display Name", translatable)
- profile_name_change_placeholder (text, default="Enter new display name", translatable)
- profile_name_change_success (text, default="Display name updated successfully!", translatable)
- profile_name_change_title (text, default="Change Display Name", translatable)
- profile_password_reset_button (text, default="Update Password", translatable)
- profile_password_reset_description (textarea, default="<p>Set a new password for your account. Make sure it is strong and secure.</p>", translatable)
- profile_password_reset_error_confirm_required (text, default="Password confirmation is required", translatable)
- profile_password_reset_error_current_required (text, default="Current password is required", translatable)
- profile_password_reset_error_current_wrong (text, default="Current password is incorrect", translatable)
- profile_password_reset_error_general (text, default="Failed to update password. Please try again.", translatable)
- profile_password_reset_error_mismatch (text, default="New passwords do not match", translatable)
- profile_password_reset_error_new_required (text, default="New password is required", translatable)
- profile_password_reset_error_weak (text, default="Password is too weak. Please choose a stronger password.", translatable)
- profile_password_reset_label_confirm (text, default="Confirm New Password", translatable)
- profile_password_reset_label_current (text, default="Current Password", translatable)
- profile_password_reset_label_new (text, default="New Password", translatable)
- profile_password_reset_placeholder_confirm (text, default="Confirm new password", translatable)
- profile_password_reset_placeholder_current (text, default="Enter current password", translatable)
- profile_password_reset_placeholder_new (text, default="Enter new password", translatable)
- profile_password_reset_success (text, default="Password updated successfully!", translatable)
- profile_password_reset_title (text, default="Change Password", translatable)
- profile_radius (slider, default="sm", property)
- profile_shadow (slider, default="sm", property)
- profile_title (text, default="My Profile", translatable)
- profile_use_accordion (checkbox, default="0", property)
- profile_variant (select, default="default", property)
- use_mantine_style (checkbox, default="1", property, hidden)

### progress (mantine)

Mantine Progress component for basic progress bars

Fields:
- mantine_color (color-picker, default="blue", property)
- mantine_progress_animated (checkbox, default="0", property)
- mantine_progress_striped (checkbox, default="0", property)
- mantine_progress_transition_duration (select, default="200", property)
- mantine_radius (slider, default="sm", property)
- mantine_size (slider, default="sm", property)
- mantine_spacing_margin (mantine_spacing_margin, default="", property)
- use_mantine_style (checkbox, default="1", property, hidden)
- value (text, default="0", property)

### progress-root (mantine)

Mantine Progress.Root component for compound progress bars with multiple sections

Fields:
- mantine_progress_auto_contrast (checkbox, default="0", property)
- mantine_size (slider, default="sm", property)
- mantine_spacing_margin (mantine_spacing_margin, default="", property)
- use_mantine_style (checkbox, default="1", property, hidden)

Allowed children: progress-section

### progress-section (mantine)

Mantine Progress.Section component for individual progress sections

Fields:
- label (markdown-inline, default=null, translatable)
- mantine_color (color-picker, default="blue", property)
- mantine_progress_animated (checkbox, default="0", property)
- mantine_progress_striped (checkbox, default="0", property)
- mantine_spacing_margin (mantine_spacing_margin, default="", property)
- mantine_tooltip_label (text, default=null, translatable)
- mantine_tooltip_position (select, default="top", property)
- use_mantine_style (checkbox, default="1", property, hidden)
- value (text, default="0", property)
Allowed parents: progress-root

### radio (mantine) — can_have_children

Unified Radio component that can render as single radio or radio group based on options

Fields:
- description (textarea, default=null, translatable)
- disabled (checkbox, default="0", property)
- is_required (checkbox, default="0", property)
- label (markdown-inline, default=null, translatable)
- locked_after_submit (checkbox, default="0", property)
- mantine_color (color-picker, default="blue", property)
- mantine_orientation (segment, default="vertical", property)
- mantine_radio_card (checkbox, default="0", property)
- mantine_radio_label_position (select, default="right", property)
- mantine_radio_options (json, default="[{\"value\":\"option1\",\"text\":\"Option 1\",\"description\":\"First choice description\"},{\"value\":\"option2\",\"text\":\"Option 2\",\"description\":\"Second choice description\"},{\"value\":\"option3\",\"text\":\"Option 3\",\"description\":\"Third choice description\"}]", translatable)
- mantine_radio_variant (select, default="default", property)
- mantine_size (slider, default="sm", property)
- mantine_spacing_margin (mantine_spacing_margin, default="", property)
- mantine_tooltip_label (text, default=null, translatable)
- mantine_tooltip_position (select, default="top", property)
- mantine_use_input_wrapper (checkbox, default="1", property)
- name (text, default=null, property)
- use_mantine_style (checkbox, default="1", property, hidden)
- value (text, default=null, property)

Allowed children: (any)

### range-slider (mantine)

Mantine range-slider component for range selection

Fields:
- description (textarea, default="", translatable)
- disabled (checkbox, default="0", property)
- label (markdown-inline, default="", translatable)
- mantine_color (color-picker, default="blue", property)
- mantine_numeric_max (select, default="100", property)
- mantine_numeric_min (select, default="0", property)
- mantine_numeric_step (select, default="1", property)
- mantine_radius (slider, default="sm", property)
- mantine_range_slider_inverted (checkbox, default="0", property)
- mantine_range_slider_labels_always_on (checkbox, default="0", property)
- mantine_range_slider_marks_values (textarea, default="", translatable)
- mantine_range_slider_show_label (checkbox, default="1", property)
- mantine_size (slider, default="sm", property)
- mantine_spacing_margin (mantine_spacing_margin, default="", property)
- name (text, default="", property)
- use_mantine_style (checkbox, default="1", property, hidden)
- value (text, default="", property)

### rating (mantine)

Mantine Rating component for star ratings

Fields:
- description (textarea, default=null, translatable)
- disabled (checkbox, default="0", property)
- label (markdown-inline, default=null, translatable)
- mantine_color (color-picker, default="yellow", property)
- mantine_rating_count (slider, default="5", property)
- mantine_rating_empty_icon (select-icon, default=null, property)
- mantine_rating_fractions (slider, default="1", property)
- mantine_rating_full_icon (select-icon, default=null, property)
- mantine_rating_highlight_selected_only (checkbox, default="0", property)
- mantine_rating_use_smiles (checkbox, default="0", property)
- mantine_size (slider, default="sm", property)
- mantine_spacing_margin (mantine_spacing_margin, default="", property)
- name (text, default=null, property)
- readonly (checkbox, default="0", property)
- use_mantine_style (checkbox, default="1", property, hidden)
- value (text, default=null, property)

### refContainer (Wrapper) — can_have_children

Wrap other styles that later can be used in different place. It can be used for creating resusable blocks.

Allowed children: (any)

### register (Admin)

provides a small form to allow a user to register for the WebApp. In order to register a user must provide a valid email and activation code. Activation codes can be generated in the admin section of the WebApp. The list of available codes can be exported.

Fields:
- alert_fail (text, default=null, translatable)
- alert_success (text, default=null, translatable)
- anonymous_users_registration (markdown, default="Please describe the process to the user", translatable)
- group (select-group, default="3", property)
- label_pw (text, default=null, translatable)
- label_security_question_1 (text, default="Select security question 1", translatable)
- label_security_question_2 (text, default="Select security question 2", translatable)
- label_submit (text, default=null, translatable)
- label_user (text, default=null, translatable)
- mantine_spacing_margin_padding (mantine_spacing_margin_padding, default="", property)
- open_registration (checkbox, default="0", property)
- success (text, default=null, translatable)
- title (markdown-inline, default=null, translatable)
- type (style-bootstrap, default="success", property)

### resetPassword (intern)

Fields:
- alert_success (text, default=null, translatable)
- email_user (email, default=null, translatable)
- is_html (checkbox, default="0", property)
- label_pw_reset (text, default=null, translatable)
- mantine_spacing_margin_padding (mantine_spacing_margin_padding, default="", property)
- placeholder (text, default=null, translatable)
- subject_user (text, default=null, translatable)
- text_md (markdown, default=null, translatable)
- type (style-bootstrap, default=null, property)

### rich-text-editor (mantine)

Rich text editor component based on Tiptap with toolbar controls for formatting. It supports controlled input for form submission.

Fields:
- description (textarea, default=null, translatable)
- disabled (checkbox, default="0", property)
- is_required (checkbox, default="0", property)
- label (markdown-inline, default=null, translatable)
- mantine_rich_text_editor_bubble_menu (checkbox, default="0", property)
- mantine_rich_text_editor_placeholder (text, default="Start writing...", translatable)
- mantine_rich_text_editor_task_list (checkbox, default="0", property)
- mantine_rich_text_editor_text_color (checkbox, default="0", property)
- mantine_rich_text_editor_variant (segment, default="default", property)
- mantine_spacing_margin (mantine_spacing_margin, default="", property)
- name (text, default=null, property)
- translatable (checkbox, default="0", property)
- use_mantine_style (checkbox, default="1", property, hidden)
- value (text, default=null, property)

### scroll-area (mantine) — can_have_children

Mantine scroll-area component for custom scrollbars

Fields:
- mantine_height (select, default=null, property)
- mantine_scroll_area_offset_scrollbars (checkbox, default="0", property)
- mantine_scroll_area_scrollbar_size (select, default="8", property)
- mantine_scroll_area_scroll_hide_delay (select, default="1000", property)
- mantine_scroll_area_type (segment, default="hover", property)
- mantine_spacing_margin_padding (mantine_spacing_margin_padding, default="", property)
- use_mantine_style (checkbox, default="1", property, hidden)

Allowed children: (any)

### segmented-control (mantine)

Mantine segmented-control component for segmented controls

Fields:
- description (textarea, default=null, translatable)
- disabled (checkbox, default="0", property)
- is_required (checkbox, default="0", property)
- label (markdown-inline, default=null, translatable)
- mantine_color (color-picker, default="blue", property)
- mantine_orientation (segment, default="horizontal", property)
- mantine_radius (slider, default="sm", property)
- mantine_segmented_control_data (textarea, default="[{\"value\":\"option1\",\"label\":\"Option 1\"},{\"value\":\"option2\",\"label\":\"Option 2\"},{\"value\":\"option3\",\"label\":\"Option 3\"}]", translatable)
- mantine_segmented_control_item_border (checkbox, default="0", property)
- mantine_size (slider, default="sm", property)
- mantine_spacing_margin (mantine_spacing_margin, default="", property)
- name (text, default=null, property)
- readonly (checkbox, default="0", property)
- use_mantine_style (checkbox, default="1", property, hidden)
- value (text, default=null, property)

### select (Input)

HTML select component for dropdown selections. Supports single and multiple selections.

Fields:
- disabled (checkbox, default="0", property)
- is_multiple (checkbox, default="0", property)
- is_required (checkbox, default="0", property)
- label (markdown-inline, default=null, translatable)
- locked_after_submit (checkbox, default="0", property)
- mantine_multi_select_data (textarea, default=null, translatable)
- mantine_radius (slider, default="sm", property)
- mantine_select_clearable (checkbox, default="0", property)
- mantine_select_searchable (checkbox, default="0", property)
- mantine_size (slider, default="sm", property)
- max (number, default=null, property)
- name (text, default=null, property)
- options (json, default="[{\"value\":\"option1\",\"label\":\"Option 1\"}, {\"value\":\"option2\",\"label\":\"Option 2\"}]", translatable)
- placeholder (text, default="Select an option", translatable)
- use_mantine_style (checkbox, default="1", property)
- value (text, default=null, property)

### simple-grid (mantine) — can_have_children

Mantine simple-grid component for responsive grid layouts

Fields:
- mantine_breakpoints (slider, default=null, property)
- mantine_cols (slider, default="3", property)
- mantine_height (select, default=null, property)
- mantine_spacing_margin_padding (mantine_spacing_margin_padding, default="", property)
- mantine_vertical_spacing (slider, default=null, property)
- mantine_width (select, default=null, property)
- use_mantine_style (checkbox, default="1", property, hidden)

Allowed children: (any)

### slider (mantine)

Mantine slider component for single value selection

Fields:
- description (textarea, default="", translatable)
- disabled (checkbox, default="0", property)
- is_required (checkbox, default="0", property)
- label (markdown-inline, default="", translatable)
- locked_after_submit (checkbox, default="0", property)
- mantine_color (color-picker, default="blue", property)
- mantine_numeric_max (select, default="100", property)
- mantine_numeric_min (select, default="0", property)
- mantine_numeric_step (select, default="1", property)
- mantine_radius (slider, default="sm", property)
- mantine_size (slider, default="sm", property)
- mantine_slider_inverted (checkbox, default="0", property)
- mantine_slider_labels_always_on (checkbox, default="0", property)
- mantine_slider_marks_values (textarea, default="", translatable)
- mantine_slider_required (checkbox, default="0", property)
- mantine_slider_show_label (checkbox, default="1", property)
- mantine_spacing_margin (mantine_spacing_margin, default="", property)
- name (text, default="", property)
- use_mantine_style (checkbox, default="1", property, hidden)
- value (text, default="", property)

### space (mantine)

Mantine Space component for adding spacing

Fields:
- mantine_size (slider, default="sm", property)
- mantine_space_direction (segment, default="vertical", property)
- mantine_spacing_margin_padding (mantine_spacing_margin_padding, default="", property)
- use_mantine_style (checkbox, default="1", property, hidden)

### spoiler (mantine) — can_have_children

Mantine Spoiler component for collapsible text

Fields:
- mantine_height (select, default="200", property)
- mantine_spacing_margin_padding (mantine_spacing_margin_padding, default="", property)
- mantine_spoiler_hide_label (text, default="Hide", translatable)
- mantine_spoiler_show_label (text, default="Show more", translatable)
- use_mantine_style (checkbox, default="1", property, hidden)

Allowed children: (any)

### stack (mantine) — can_have_children

Mantine Stack component for vertical layouts

Fields:
- mantine_align (select, default=null, property)
- mantine_gap (slider, default="sm", property)
- mantine_height (select, default=null, property)
- mantine_justify (select, default=null, property)
- mantine_spacing_margin_padding (mantine_spacing_margin_padding, default="", property)
- mantine_width (select, default=null, property)
- use_mantine_style (checkbox, default="1", property, hidden)

Allowed children: (any)

### switch (mantine)

Mantine Switch component for toggle switches

Fields:
- description (textarea, default=null, translatable)
- disabled (checkbox, default="0", property)
- is_required (checkbox, default="0", property)
- label (markdown-inline, default=null, translatable)
- mantine_color (color-picker, default="blue", property)
- mantine_label_position (segment, default="left", property)
- mantine_radius (slider, default="sm", property)
- mantine_size (slider, default="sm", property)
- mantine_spacing_margin (mantine_spacing_margin, default="", property)
- mantine_switch_off_label (text, default="Off", translatable)
- mantine_switch_on_label (text, default="On", translatable)
- mantine_switch_on_value (text, default="1", property)
- mantine_use_input_wrapper (checkbox, default="0", property)
- name (text, default=null, property)
- use_mantine_style (checkbox, default="1", property, hidden)
- value (text, default=null, property)

### tab (mantine) — can_have_children

Mantine Tabs.Tab component for individual tab items within a tabs component. Can contain child components for tab panel content.

Fields:
- label (markdown-inline, default=null, translatable)
- mantine_height (select, default=null, property)
- mantine_left_icon (select-icon, default=null, property)
- mantine_right_icon (select-icon, default=null, property)
- mantine_spacing_margin (mantine_spacing_margin, default="", property)
- mantine_tab_disabled (checkbox, default="0", property)
- mantine_width (select, default=null, property)
- use_mantine_style (checkbox, default="1", property, hidden)

Allowed children: (any)
Allowed parents: tabs

### tabs (mantine)

Mantine Tabs component for switching between different views

Fields:
- mantine_color (color-picker, default="blue", property)
- mantine_height (select, default=null, property)
- mantine_orientation (segment, default="horizontal", property)
- mantine_radius (slider, default="sm", property)
- mantine_spacing_margin (mantine_spacing_margin, default="", property)
- mantine_tabs_variant (select, default="default", property)
- mantine_width (select, default=null, property)
- use_mantine_style (checkbox, default="1", property, hidden)

Allowed children: tab

### text (mantine)

Mantine Text component for displaying text with various styling options

Fields:
- mantine_color (color-picker, default="", property)
- mantine_size (slider, default="sm", property)
- mantine_spacing_margin_padding (mantine_spacing_margin_padding, default="", property)
- mantine_text_align (segment, default="left", property)
- mantine_text_font_style (segment, default="normal", property)
- mantine_text_font_weight (select, default=null, property)
- mantine_text_gradient (json, default=null, property)
- mantine_text_inherit (checkbox, default="0", property)
- mantine_text_line_clamp (select, default=null, property)
- mantine_text_span (checkbox, default="0", property)
- mantine_text_text_decoration (segment, default="none", property)
- mantine_text_text_transform (segment, default="none", property)
- mantine_text_truncate (segment, default=null, property)
- mantine_text_variant (segment, default="default", property)
- text (textarea, default=null, translatable)
- use_mantine_style (checkbox, default="1", property, hidden)

### text-input (mantine)

Mantine TextInput component for controlled text input with validation and sections

Fields:
- description (textarea, default=null, translatable)
- disabled (checkbox, default="0", property)
- is_required (checkbox, default="0", property)
- label (markdown-inline, default=null, translatable)
- mantine_left_icon (select-icon, default=null, property)
- mantine_radius (slider, default="sm", property)
- mantine_right_icon (select-icon, default=null, property)
- mantine_size (slider, default="sm", property)
- mantine_spacing_margin (mantine_spacing_margin, default="", property)
- mantine_text_input_variant (segment, default="default", property)
- name (text, default=null, property)
- placeholder (text, default=null, translatable)
- translatable (checkbox, default="0", property)
- use_mantine_style (checkbox, default="1", property, hidden)
- value (text, default=null, property)

### textarea (Input)

Textarea component for multi-line text input with autosize and resize options. It supports Mantine styling.

Fields:
- description (textarea, default=null, translatable)
- disabled (checkbox, default="0", property)
- is_required (checkbox, default="0", property)
- label (markdown-inline, default=null, translatable)
- locked_after_submit (checkbox, default="0", property)
- mantine_left_icon (select-icon, default=null, property)
- mantine_radius (slider, default="sm", property)
- mantine_right_icon (select-icon, default=null, property)
- mantine_size (slider, default="sm", property)
- mantine_spacing_margin (mantine_spacing_margin, default="", property)
- mantine_textarea_autosize (checkbox, default="1", property)
- mantine_textarea_max_rows (select, default="8", property)
- mantine_textarea_min_rows (select, default="3", property)
- mantine_textarea_resize (segment, default="none", property)
- mantine_textarea_rows (select, default="4", property)
- mantine_textarea_variant (segment, default="default", property)
- mantine_variant (select, default="default", property)
- name (text, default=null, property)
- placeholder (text, default=null, translatable)
- translatable (checkbox, default="0", property)
- use_mantine_style (checkbox, default="1", property)
- value (text, default=null, property)

### theme-icon (mantine)

Mantine ThemeIcon component for themed icon containers

Fields:
- mantine_color (color-picker, default="blue", property)
- mantine_left_icon (select-icon, default=null, property)
- mantine_radius (slider, default="sm", property)
- mantine_size (slider, default="sm", property)
- mantine_spacing_margin (mantine_spacing_margin, default="", property)
- mantine_variant (select, default="filled", property)
- use_mantine_style (checkbox, default="1", property, hidden)

### timeline (mantine)

Mantine Timeline component for chronological displays

Fields:
- mantine_color (color-picker, default="blue", property)
- mantine_spacing_margin (mantine_spacing_margin, default="", property)
- mantine_timeline_active (select, default="0", property)
- mantine_timeline_align (segment, default="left", property)
- mantine_timeline_bullet_size (select, default="24", property)
- mantine_timeline_line_width (select, default="2", property)
- use_mantine_style (checkbox, default="1", property, hidden)

Allowed children: timeline-item

### timeline-item (mantine) — can_have_children

Mantine Timeline.Item component for individual timeline entries

Fields:
- mantine_color (color-picker, default="gray", property)
- mantine_timeline_item_bullet (select-icon, default=null, property)
- mantine_timeline_item_line_variant (select, default="solid", property)
- title (markdown-inline, default=null, translatable)
- use_mantine_style (checkbox, default="1", property, hidden)

Allowed children: (any)
Allowed parents: timeline

### title (mantine)

Mantine Title component for headings and titles

Fields:
- content (textarea, default=null, translatable)
- mantine_size (slider, default="lg", property)
- mantine_spacing_margin (mantine_spacing_margin, default="", property)
- mantine_title_line_clamp (select, default=null, property)
- mantine_title_order (segment, default="1", property)
- mantine_title_text_wrap (segment, default="wrap", property)
- use_mantine_style (checkbox, default="1", property, hidden)

### twoFactorAuth (Admin)

Provides a form for two-factor authentication where users can enter their verification code.

Fields:
- alert_fail (text, default="Invalid verification code. Please try again.", translatable)
- label (markdown-inline, default="Two-Factor Authentication", translatable)
- label_expiration_2fa (markdown-inline, default="Code expires in", translatable)
- mantine_spacing_margin_padding (mantine_spacing_margin_padding, default="", property)
- text_md (markdown, default="Please enter the 6-digit code sent to your email", translatable)

### typography (mantine) — can_have_children

Mantine Typography component for consistent typography styles

Fields:
- mantine_spacing_margin_padding (mantine_spacing_margin_padding, default="", property)
- use_mantine_style (checkbox, default="1", property, hidden)

Allowed children: (any)

### validate (Admin) — can_have_children

User account validation form that accepts user ID and token from URL, validates and activates account. Can have children for additional form fields.

Fields:
- alert_fail (text, default="Validation failed. Please check your information and try again.", translatable)
- alert_success (text, default="Account validated successfully! Welcome to our platform.", translatable)
- anonymous_user_name_description (markdown, default="This name will be visible to other users", translatable)
- btn_cancel_url (select-page-keyword, default=null, property)
- label_activate (text, default="Activate Account", translatable)
- label_cancel (text, default="Cancel", translatable)
- label_name (text, default="Name", translatable)
- label_pw (text, default="Password", translatable)
- label_pw_confirm (text, default="Confirm Password", translatable)
- label_save (text, default="Save", translatable)
- label_timezone (text, default="Timezone", translatable)
- label_update (text, default="Update", translatable)
- mantine_border (checkbox, default="1", property)
- mantine_btn_cancel_color (color-picker, default="gray", property)
- mantine_btn_save_color (color-picker, default="blue", property)
- mantine_buttons_order (segment, default="save-cancel", property)
- mantine_buttons_position (select, default="space-between", property)
- mantine_buttons_radius (slider, default="sm", property)
- mantine_buttons_size (slider, default="sm", property)
- mantine_buttons_variant (select, default="filled", property)
- mantine_card_padding (slider, default="lg", property)
- mantine_card_shadow (slider, default="sm", property)
- mantine_radius (slider, default="sm", property)
- mantine_spacing_margin_padding (mantine_spacing_margin_padding, default="", property)
- name (text, default="validate_form", property)
- name_description (markdown-inline, default=null, translatable)
- name_placeholder (text, default="Enter your full name", translatable)
- pw_placeholder (text, default="Enter your password", translatable)
- redirect_at_end (select-page-keyword, default="login", property)
- subtitle (text, default="Please complete your account setup to activate your account", translatable)
- title (markdown-inline, default="Account Validation", translatable)
- use_mantine_style (checkbox, default="1", property, hidden)

Allowed children: (any)

### version (Admin)

Add information about the DB version and for the git version of Selfhelp

### video (Media)

allows to load and display a video on a page.

Fields:
- alt (text, default=null, translatable)
- is_fluid (checkbox, default="1", property)
- mantine_spacing_margin (mantine_spacing_margin, default="", property)
- video_src (select-video, default=null, property)

<!-- CATALOG:END -->
