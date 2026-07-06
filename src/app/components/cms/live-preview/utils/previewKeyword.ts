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

/**
 * Normalise an (origin-stripped) preview path to a CMS keyword (`null` → home).
 *
 * Nested pages have URLs like `/demo/legal/imprint` while their CMS keyword is
 * just `imprint` — both panes address pages BY KEYWORD, so the path must be
 * mapped back. When the page list is provided the exact page-url match wins;
 * otherwise the last path segment is used (keywords are unique and nested
 * page URLs end with their own keyword).
 */
export function keywordFromPreviewPath(
    path: string,
    routes?: Array<{ keyword: string; url: string | null }>,
): string | null {
    const cleaned = path.split('#')[0].split('?')[0].replace(/^\/+/, '').replace(/\/+$/, '');
    if (cleaned === '') {
        return null;
    }
    if (routes?.length) {
        const target = `/${cleaned}`;
        const match = routes.find((route) => (route.url ?? '').replace(/\/+$/, '') === target);
        if (match?.keyword) {
            return match.keyword;
        }
    }
    const segments = cleaned.split('/');
    return segments[segments.length - 1];
}
