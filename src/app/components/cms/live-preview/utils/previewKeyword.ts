/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
/**
 * Pure keyword helpers for the CMS **Live Preview** surface.
 *
 * Kept free of React/Next imports so the normalisation is unit-testable in
 * isolation and shared by the shell's navigation sync + address-bar mirror.
 *
 * @module components/cms/live-preview/utils/previewKeyword
 */

/** Normalise an (origin-stripped) preview path to a CMS keyword (`null` → home). */
export function keywordFromPreviewPath(path: string): string | null {
    const cleaned = path.split('#')[0].split('?')[0].replace(/^\/+/, '').replace(/\/+$/, '');
    return cleaned === '' ? null : cleaned;
}
