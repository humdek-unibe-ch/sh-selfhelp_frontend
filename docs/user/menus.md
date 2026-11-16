/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
# Menus

Audience: CMS administrators who edit site navigation.
Status: active.
Applies to: SelfHelp2 admin Menus builder.
Last verified: 2026-11-16.

The Menus builder configures the four system menus. It is not the page tree —
pages can exist without appearing in a menu, and menus can nest links under
groups without changing page parents.

## The four menus

| Tab | Where it shows | Default Max root items |
| --- | --- | --- |
| Web header | Desktop/tablet site header | 8 |
| Web footer | Site footer | Unlimited |
| Mobile drawer | Phone side drawer | Unlimited |
| Mobile tabs | Phone bottom tab bar | 5 |

## Max root items

Each menu has **Max root items** next to its layout controls.

- A positive number (1–50) caps how many **top-level** items that menu renders.
- Leave the field blank for unlimited.
- Nesting under an existing root does not count against the limit.
- Recommended starting points: header **8**, bottom tabs **5**; footer and drawer are fine unlimited.

## When the menu is full

If the root count already equals the limit, adding another root (Add existing /
Create page here) is blocked. Nest the new page under an existing item, remove
a root, or raise Max root items.

## Soft over-limit

Lowering Max root items below the current root count does **not** delete
items. Extra roots stay in the builder list; only the first ones up to the
limit appear on the public site. The builder shows an orange over-limit badge
until you raise the limit or remove roots.
