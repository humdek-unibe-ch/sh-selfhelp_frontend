# AI Generation Prompt — REPLACED

This file has been replaced by the new hybrid template.

## Where to find the current prompt

- **For end users (admins):** click **Copy AI prompt** in the *Import Section*
  tab of the `Add Section` modal. The admin UI fetches the latest template
  from `GET /cms-api/v1/admin/ai/section-prompt-template` and writes it to
  your clipboard. Paste it into ChatGPT / Gemini / Claude together with a
  natural-language description of the page you want, and the LLM will
  return a JSON array you can upload via the same modal.

- **For maintainers:** the committed template lives at
  [`ai_section_generation_prompt.md`](./ai_section_generation_prompt.md). It
  is generated from:
  - [`prompt_template_base.md`](./prompt_template_base.md) — hand-maintained
    base with fixed rules, JSON shape examples, placeholders (`<LOCALES>`,
    `<DESCRIBE_WHAT_YOU_WANT>`), image-holder URL, form-composition rules,
    dark/light Tailwind rules.
  - An auto-generated catalog appendix listing every style, its fields,
    defaults, and allowed relationships — produced directly from the DB
    through the style-schema endpoint.

  Regenerate the committed file with:
  ```bash
  bin/console app:prompt-template:build
  ```
  (from the backend repo). See
  [`docs/developer/style-schema-endpoint.md`](../../../sh-selfhelp_backend/docs/developer/style-schema-endpoint.md)
  for the full wiring.

## Why it changed

The previous monolithic prompt was hand-edited and drifted out of sync with
the actual DB schema — new styles or fields weren't reflected without a
corresponding manual update. The new workflow guarantees the catalog the
LLM sees matches the CMS exactly, while still letting us tune the rules
and examples by hand.

## Related

- [`prompt_template_base.md`](./prompt_template_base.md) — the editable rules.
- [`ai_section_generation_prompt.md`](./ai_section_generation_prompt.md) — the generated prompt.
- [`generated examples/`](./generated%20examples/) — reference JSON files
  that round-trip through the import validator.
