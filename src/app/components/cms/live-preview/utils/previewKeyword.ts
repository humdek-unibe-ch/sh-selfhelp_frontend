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
 * Matching order (when a page/route list is provided):
 *   1. Exact `url` match (canonical static path)
 *   2. Parameterized `url` patterns (`/team/{record_id}`)
 *   3. Last-segment keyword fallback (legacy nested URLs without a route list)
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

export type TPreviewRouteEntry = { keyword: string; url: string | null };

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

function normalizePreviewPath(rawPath: string): string {
    const pathOnly = rawPath.split('#')[0].split('?')[0];
    return pathOnly.replace(/\/+$/, '') || '/';
}

function matchPreviewRoute(
    normalized: string,
    routes: TPreviewRouteEntry[],
): IPreviewRouteMatch | null {
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

    // Prefer longer (more specific) parameterized patterns when several match.
    let best: IPreviewRouteMatch | null = null;
    let bestPatternLength = -1;
    for (const route of routes) {
        const pattern = route.url ?? '';
        const regex = routePatternToRegex(pattern);
        if (!regex) {
            continue;
        }
        const match = normalized.match(regex);
        if (!match?.groups) {
            continue;
        }
        if (pattern.length < bestPatternLength) {
            continue;
        }
        const routeParams: Record<string, string> = {};
        for (const [key, value] of Object.entries(match.groups)) {
            if (typeof value === 'string') {
                routeParams[key] = value;
            }
        }
        best = {
            keyword: route.keyword,
            path: normalized,
            routeParams,
        };
        bestPatternLength = pattern.length;
    }
    return best;
}

/**
 * Last-resort keyword guess when no route list (or no pattern) matches:
 * nested static pages historically end with their own keyword segment.
 * Never prefer this over an exact or parameterized `url` match.
 */
function lastSegmentKeyword(normalized: string): string | null {
    if (normalized === '/') {
        return null;
    }
    const cleaned = normalized.replace(/^\/+/, '');
    const segments = cleaned.split('/');
    return segments[segments.length - 1] || null;
}

/**
 * Normalise an (origin-stripped) preview path to a CMS keyword (`null` → home).
 *
 * Prefer exact / parameterized route `url` matches from the page list. Only
 * fall back to the last path segment when no route list is available or no
 * pattern matches (so `/team-members/5` does not become keyword `"5"` when
 * `/team-members/{record_id}` is known).
 */
export function keywordFromPreviewPath(
    path: string,
    routes?: TPreviewRouteEntry[],
): string | null {
    return resolvePreviewRoute(path, routes).keyword;
}

/**
 * Match an in-preview navigation path to a CMS page keyword and optional route
 * params. Exact URL matches win; parameterized routes (`/team/{record_id}`) are
 * matched next; otherwise falls back to the last path segment.
 */
export function resolvePreviewRoute(
    rawPath: string,
    routes?: TPreviewRouteEntry[],
): IPreviewRouteMatch {
    const normalized = normalizePreviewPath(rawPath);

    if (routes?.length) {
        const matched = matchPreviewRoute(normalized, routes);
        if (matched) {
            return matched;
        }
    }

    return {
        keyword: lastSegmentKeyword(normalized),
        path: normalized,
        routeParams: {},
    };
}
