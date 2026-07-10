/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
/**
 * Cross-client contract: frontend SSR path builder, frontend browser client,
 * and the shared full URL used by mobile must encode path/language/preview
 * identically (only the `/cms-api/v1` prefix differs for mobile).
 */
import { describe, expect, it } from 'vitest';
import {
    API_VERSION_PREFIX,
    buildPagesResolvePath,
    buildPagesResolveUrl,
    ENDPOINTS,
} from '@selfhelp/shared';
import { SHARED_ROUTE_ALIGNMENT } from '../api.config';

describe('pages resolve shared contract (FE alignment)', () => {
    it('aligns PAGES_RESOLVE_ROUTE with shared ENDPOINTS.PAGES.RESOLVE_ROUTE', () => {
        expect(SHARED_ROUTE_ALIGNMENT.PAGES_RESOLVE_ROUTE).toBe(
            ENDPOINTS.PAGES.RESOLVE_ROUTE.slice(API_VERSION_PREFIX.length),
        );
        expect(SHARED_ROUTE_ALIGNMENT.PAGES_RESOLVE_ROUTE).toBe('/pages/resolve');
    });

    it('builds the same query for SSR/browser path and mobile full URL', () => {
        const params = { path: '/team-members/5', languageId: 2, preview: true };
        const bff = buildPagesResolvePath(params);
        const full = buildPagesResolveUrl(params);
        expect(bff).toBe(
            '/pages/resolve?path=%2Fteam-members%2F5&language_id=2&preview=true',
        );
        expect(full).toBe(`${API_VERSION_PREFIX}${bff}`);
    });
});
