<!--
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
-->

# CMS Option Label Contract

Audience: Frontend and backend engineers.  
Status: active.  
Applies to: SelfHelp2 CMS option-based styles (`select`, `radio`, `combobox`, `segmented-control`).  
Last verified: 2026-07-09.  
Source of truth: `@selfhelp/shared` option helpers, backend `OptionLabelHydrator`, style renderers, and `OptionCatalogEditor`.

Option catalogs use a two-field architecture:

- the style's catalog field (non-translatable, language-neutral): stable option codes, ordering, and optional metadata.
- `option_labels` (translatable): `code -> label` map per `language_id`.

Catalog field names are `options` (select), `radio_options`, `combobox_options`, and `segmented_control_data`. They all use the same shared parser and resolver.

Submitted user rows store only the option code. During entry-list hydration, backend adds system fields:

- `_{field}_label` for single choice
- `_{field}_labels` for multi choice

These generated fields are read-only and reserved.

## Reserved keys

Keys matching `_{field}_label` and `_{field}_labels` are system namespace. User-authored data columns cannot use them.

## Fallback chain

Label resolution follows:

1. current language `option_labels`
2. CMS default/public fallback language `option_labels`
3. legacy catalog `label` or `text` (compatibility reader only)
4. option code itself

## Renderer alignment

- Web renderers (`SelectStyle`, `RadioStyle`, `ComboboxStyle`, `SegmentedControlStyle`) and mobile renderers use the same shared resolver from `@selfhelp/shared`.
- Hidden input form submission remains unchanged: the selected code is posted, not the label.
- Backend multiplicity comes from the owning style (`is_multiple` or `web_combobox_multi_select`), not from the number of selected codes.

## Admin editor

The section inspector combines the catalog and every public language's label map into one grid. Each row has code, one label column per language, optional sort order, and disabled state. Save is blocked for empty/duplicate/malformed codes, invalid JSON, non-numeric sort values, or missing labels.

## Legacy bundles

Imports still accept `{ "value": "...", "text": "..." }` and `{ "value": "...", "label": "..." }`. Renderers keep those labels until an editor saves the row through the multilingual grid, which writes the canonical two-field shape.
