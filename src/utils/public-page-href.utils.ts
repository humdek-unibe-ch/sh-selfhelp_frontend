/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/

import type { IPageRouteItem } from '../types/common/pages.type';

/**
 * Public site href for an admin page.
 *
 * Public routes resolve by DB `page_routes` / `pages.url`, not by keyword.
 * Using `/${keyword}` sends users to a non-routed path (404 that looks like a
 * permission failure because ACL denials are also remapped to 404). Live Preview
 * still works because it loads by keyword via `/pages/by-keyword/{keyword}`.
 *
 * Preference order:
 * 1. canonical active route pattern
 * 2. first active route pattern
 * 3. `pages.url` (list / fields payload)
 * 4. keyword (last-resort fallback only)
 */
export function publicPageHref(
    url: string | null | undefined,
    keywordFallback?: string | null,
    routes?: readonly IPageRouteItem[] | null,
): string {
    const fromRoutes = canonicalRoutePath(routes);
    if (fromRoutes) {
        return fromRoutes;
    }

    const cleanedUrl = (url ?? '').trim();
    if (cleanedUrl !== '') {
        return cleanedUrl.startsWith('/') ? cleanedUrl : `/${cleanedUrl}`;
    }

    const keyword = (keywordFallback ?? '').trim().replace(/^\/+/, '');
    return keyword !== '' ? `/${keyword}` : '/';
}

function canonicalRoutePath(routes: readonly IPageRouteItem[] | null | undefined): string | null {
    if (!routes || routes.length === 0) {
        return null;
    }

    const active = routes.filter((route) => route.is_active && route.path_pattern.trim() !== '');
    const pool = active.length > 0 ? active : routes.filter((route) => route.path_pattern.trim() !== '');
    if (pool.length === 0) {
        return null;
    }

    const canonical = pool.find((route) => route.is_canonical) ?? pool[0];
    const pattern = canonical.path_pattern.trim();
    return pattern.startsWith('/') ? pattern : `/${pattern}`;
}
