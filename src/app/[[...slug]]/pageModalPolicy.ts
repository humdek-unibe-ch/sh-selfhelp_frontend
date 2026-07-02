/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/

/**
 * Web modal policy for public slug pages.
 *
 * On web, only pages that explicitly opt in via the `open_in_modal` page property
 * render inside {@link PageModal}. Off-menu pages are normal full pages on web;
 * the off-menu-as-modal rule applies on mobile only.
 */
export function shouldOpenPageInWebModal(
    page: { open_in_modal?: boolean | null } | null | undefined,
): boolean {
    return Boolean(page?.open_in_modal);
}
