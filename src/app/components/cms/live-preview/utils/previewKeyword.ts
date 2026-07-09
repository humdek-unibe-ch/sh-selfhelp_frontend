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

export interface IPreviewRouteMatch {
    /** CMS keyword for the matched page (`null` → home). */
    keyword: string | null;
    /** Origin-stripped public path used for path-keyed page fetch. */
    path: string;
    /** Route params extracted from parameterized URLs (`record_id`, …). */
    routeParams: Record<string, string>;
}

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

/**
 * Turn a route URL template into a RegExp that captures `{param}` segments.
 * e.g. `/team-members/{record_id}` → `/team-members/(?<record_id>[^/]+)`
 */
function routePatternToRegex(pattern: string): RegExp | null {
    if (!pattern.includes('{')) {
        return null;
    }
    const escaped = pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const withGroups = escaped.replace(/\\\{([^}]+)\\\}/g, '(?<$1>[^/]+)');
    return new RegExp(`^${withGroups}$`);
}

/**
 * Match an in-preview navigation path to a CMS page keyword and optional route
 * params. Exact URL matches win; parameterized routes (`/team/{record_id}`) are
 * matched next; otherwise falls back to {@link keywordFromPreviewPath}.
 */
export function resolvePreviewRoute(
    rawPath: string,
    routes?: Array<{ keyword: string; url: string | null }>,
): IPreviewRouteMatch {
    const pathOnly = rawPath.split('#')[0].split('?')[0];
    const normalized = pathOnly.replace(/\/+$/, '') || '/';

    if (routes?.length) {
        for (const route of routes) {
            const routeUrl = (route.url ?? '').replace(/\/+$/, '');
            if (routeUrl !== '' && routeUrl === normalized) {
                return {
                    keyword: route.keyword,
                    path: normalized,
                    routeParams: {},
                };
            }
        }

        for (const route of routes) {
            const pattern = route.url ?? '';
            const regex = routePatternToRegex(pattern);
            if (!regex) {
                continue;
            }
            const match = normalized.match(regex);
            if (match?.groups) {
                const routeParams: Record<string, string> = {};
                for (const [key, value] of Object.entries(match.groups)) {
                    if (typeof value === 'string') {
                        routeParams[key] = value;
                    }
                }
                return {
                    keyword: route.keyword,
                    path: normalized,
                    routeParams,
                };
            }
        }
    }

    return {
        keyword: keywordFromPreviewPath(pathOnly, routes),
        path: normalized,
        routeParams: {},
    };
}
