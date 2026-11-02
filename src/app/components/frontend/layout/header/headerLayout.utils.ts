/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/

import { resolveBrandingPresentation, type INavigationBranding } from '@selfhelp/shared';

/** Vertical padding inside the single-row header (top + bottom). */
export const WEB_HEADER_VERTICAL_PADDING = 16;

/** Minimum single-row header height (medium branding baseline). */
export const WEB_HEADER_MIN_HEIGHT = 60;

/**
 * Two-row height for double header presets. Covers the slim utility row, the
 * main navigation row, and the breathing space either side of the divider.
 */
export const WEB_DOUBLE_HEADER_HEIGHT = 116;

/**
 * Single-row AppShell header height from branding logo size.
 * Grows with xl/lg logos so the configured height is not clipped.
 */
export function resolveSingleRowHeaderHeight(branding?: INavigationBranding | null): number {
    const presentation = resolveBrandingPresentation(branding);
    return Math.max(WEB_HEADER_MIN_HEIGHT, presentation.logoHeight + WEB_HEADER_VERTICAL_PADDING);
}

export function resolveWebHeaderHeight(
    isDouble: boolean,
    branding?: INavigationBranding | null,
): number {
    if (isDouble) {
        return WEB_DOUBLE_HEADER_HEIGHT;
    }
    return resolveSingleRowHeaderHeight(branding);
}
