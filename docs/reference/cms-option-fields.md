<!--
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
-->

# CMS Option Fields Reference

Audience: Developers and technical operators.  
Status: active.  
Applies to: Option-based CMS styles.  
Last verified: 2026-07-09.  
Source of truth: `@selfhelp/shared/src/content/optionLabels.ts`, backend `OptionLabelHydrator`, and section-inspector validation.

## Field contract

- Catalog (`display=0`): `options`, `radio_options`, `combobox_options`, or `segmented_control_data`, depending on style.
- `option_labels` (`display=1`): JSON object map `{ "code": "label" }` for the active language.

Example:

```json
{
  "options": [
    { "value": "release", "sort": 1 },
    { "value": "feature", "sort": 2, "disabled": true }
  ],
  "option_labels": {
    "release": "Release",
    "feature": "Feature"
  }
}
```

## Generated runtime fields

- `_{field}_label`
- `_{field}_labels`

Generated fields are runtime-only projection values for interpolation (`{{_category_label}}`) and must not be persisted as user data.

Single styles generate `_label`. Multi select and multi combobox generate `_labels`, even when the current row contains only one code. The backend rejects submitted data keys matching either reserved pattern.

## Validation

- Codes are required and unique within a catalog.
- Codes may contain letters, digits, `.`, `_`, and `-`, and must start with a letter or digit.
- Every configured public language needs a non-empty label for every code.
- `sort`, when present, must be numeric.
- `disabled`, when true, keeps the option visible but prevents selection on web and mobile.
- Invalid catalog JSON or label-map JSON blocks section save.

Legacy `text` and `label` members remain readable but are not emitted by the canonical editor.
Legacy radio-card `description` values are normalized to `meta.description`; metadata is preserved when the grid saves the catalog.
