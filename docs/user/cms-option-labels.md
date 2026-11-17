<!--
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
-->

# CMS Option Labels

Audience: CMS administrators and editors.  
Status: active.  
Applies to: CMS app form fields with options.  
Last verified: 2026-11-13.  
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

When the list or record holder has a **Scope**, put the scope in front of the generated token, as for any other field: with scope `team_member`, write `{{team_member._role_label}}`. The shipped CMS-in-CMS templates do this (a team member shows *Leitende Entwicklung* in German and *Lead Engineer* in English from one stored code `Lead`).

The generated tokens belong to `entry-list` and `entry-record` compositions. A **data view** and the cells of a list draw the stored value as it is, so keep the codes readable (`Approved`, `Scheduled`) wherever a data view shows them, and use a composition when a translated label is needed.

If a translation is missing in older content, SelfHelp tries the instance's default language, then a legacy `text`/`label`, then shows the code. Open and save old options in the grid to migrate them to the current two-field format.
