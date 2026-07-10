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
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
    API_VERSION_PREFIX,
    buildPagesResolvePath,
    buildPagesResolveQuery,
    buildPagesResolveUrl,
    ENDPOINTS,
    normalizePagesResolvePath,
} from '@selfhelp/shared';
import { SHARED_ROUTE_ALIGNMENT } from '../api.config';

describe('pages resolve shared contract (FE alignment)', () => {
    it('aligns PAGES_RESOLVE_ROUTE with shared ENDPOINTS.PAGES.RESOLVE_ROUTE', () => {
        expect(SHARED_ROUTE_ALIGNMENT.PAGES_RESOLVE_ROUTE).toBe(
            ENDPOINTS.PAGES.RESOLVE_ROUTE.slice(API_VERSION_PREFIX.length),
        );
        expect(SHARED_ROUTE_ALIGNMENT.PAGES_RESOLVE_ROUTE).toBe('/pages/resolve');
    });

    it.each([
        {
            name: 'static path',
            params: { path: '/home', languageId: 1 },
            query: 'path=%2Fhome&language_id=1',
        },
        {
            name: 'parameterized path',
            params: { path: '/team-members/5', languageId: 2, preview: true },
            query: 'path=%2Fteam-members%2F5&language_id=2&preview=true',
        },
        {
            name: 'encoded path',
            params: { path: '/docs/a b', languageId: 1 },
            query: 'path=%2Fdocs%2Fa+b&language_id=1',
        },
        {
            name: 'preview flag only when true',
            params: { path: '/', preview: true },
            query: 'path=%2F&preview=true',
        },
    ])('builds equivalent SSR/browser/mobile URLs for $name', ({ params, query }) => {
        expect(buildPagesResolveQuery(params)).toBe(query);
        const bff = buildPagesResolvePath(params);
        const full = buildPagesResolveUrl(params);
        expect(bff).toBe(`/pages/resolve?${query}`);
        expect(full).toBe(`${API_VERSION_PREFIX}${bff}`);
    });

    it('PageApi, SSR, prefetch, and Live Preview use shared path builders', () => {
        const pageApi = readFileSync(join(process.cwd(), 'src/api/page.api.ts'), 'utf8');
        const serverFetch = readFileSync(join(process.cwd(), 'src/app/_lib/server-fetch.ts'), 'utf8');
        const prefetch = readFileSync(join(process.cwd(), 'src/hooks/usePagePrefetch.ts'), 'utf8');
        const previewPath = readFileSync(
            join(process.cwd(), 'src/app/components/cms/live-preview/utils/previewPath.ts'),
            'utf8',
        );
        expect(pageApi).toContain('buildPagesResolvePath');
        expect(pageApi).toContain('resolvePageByPath');
        expect(serverFetch).toContain('buildPagesResolvePath');
        expect(prefetch).toContain('normalizePagesResolvePath');
        expect(previewPath).toContain('normalizePagesResolvePath');
        expect(normalizePagesResolvePath('/team/5?x=1#y')).toBe('/team/5');
        expect(normalizePagesResolvePath('/team/5/')).toBe('/team/5');
        expect(normalizePagesResolvePath('https://x.test/a/b?c=1')).toBe('/a/b');
    });
});
