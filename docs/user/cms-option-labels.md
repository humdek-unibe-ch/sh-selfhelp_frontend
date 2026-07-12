<!--
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
-->

# CMS Option Labels

Audience: CMS administrators and editors.  
Status: active.  
Applies to: CMS app form fields with options.  
Last verified: 2026-07-09.  
Source of truth: CMS section inspector and public rendering.

## Authoring rules

- Open the option-based field in the section inspector. One grid shows the stable code and a label column for every public language.
- Keep codes short and permanent (for example `release`, `feature`). Changing a code breaks the meaning of rows that already store it.
- Enter a label in every language column. Sort controls display order; Disabled keeps a code configured without offering it for new selections.
- Do not store translated labels in records; records keep only codes.

The inspector reports the exact row and language for empty labels, duplicate/invalid codes, and invalid sort values. The example panel includes copy buttons for both internal JSON shapes.

Use **Disabled** to keep an option visible without allowing new selections. This is useful when retiring a code that may still exist in older records.

## Template usage

Use generated tokens when you want the readable label:

- `{{_category_label}}` for single selects
- `{{_tags_labels}}` for multi selects

These generated fields are read-only and come from runtime hydration.

If a translation is missing in older content, SelfHelp tries the instance's default language, then a legacy `text`/`label`, then shows the code. Open and save old options in the grid to migrate them to the current two-field format.
