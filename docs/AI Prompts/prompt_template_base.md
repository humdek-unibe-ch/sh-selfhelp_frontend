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
<!-- CATALOG:END -->
