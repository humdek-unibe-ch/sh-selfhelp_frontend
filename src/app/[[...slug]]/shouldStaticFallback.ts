/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
/**
 * Static `/auth/*` fallback decision for the public slug route.
 *
 * Core >=0.1.36 owns the decision via `page.should_fallback`. This helper only
 * reads that boolean — it must never infer fallback from empty sections,
 * missing fields, or known system keywords.
 */

import type { IPageContent } from '../../shared';

/**
 * Returns true only when the backend explicitly set `should_fallback: true`.
 * Missing / false / non-boolean values never trigger static fallback.
 */
export function shouldStaticFallback(
    page: Pick<IPageContent, 'should_fallback' | 'sections'> | null | undefined,
): boolean {
    if (!page) {
        // No resolved page at all — caller handles 404 / maintenance separately.
        return false;
    }
    return page.should_fallback === true;
}
