/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
/**
 * The contract engine on synthetic input: each kind of mistake that
 * `api-route-contract.test.ts` must catch is reported, and a correct
 * declaration is not.
 */
import { describe, expect, it } from 'vitest';
import type { IBackendRoute } from './route-contract/backend-routes';
import type { THttpMethod } from './route-contract/call-sites';
import { checkRouteContract, webPathOf, type IContractOptions, type IEndpointEntry } from './route-contract/check-contract';

const route = (name: string, methods: string[], path: string, permissions: string[], is_public = false): IBackendRoute => ({
    name,
    methods,
    path,
    is_public,
    permissions,
});

const BACKEND: IBackendRoute[] = [
    route('pages_get', ['GET'], '/admin/pages/{page_id}', ['admin.page.read']),
    route('pages_delete', ['DELETE'], '/admin/pages/{page_id}', ['admin.page.delete']),
    route('login', ['POST'], '/auth/login', [], true),
    route('versions_delete', ['DELETE'], '/admin/pages/{page_id}/versions/{version_id}', ['admin.page_version.delete']),
    route('mint', ['POST'], '/admin/mobile-preview/session', ['admin.mobile_preview.create']),
];

const NONE: IContractOptions = { bffOnly: {}, unbuildable: {}, methodOverrides: {}, knownFailures: {} };

const run = (
    endpoints: Record<string, IEndpointEntry>,
    methods: Record<string, THttpMethod[]>,
    options: Partial<IContractOptions> = {},
) =>
    checkRouteContract(
        endpoints,
        new Map(Object.entries(methods).map(([key, list]) => [key, new Set(list)])),
        new Map(),
        BACKEND,
        { ...NONE, ...options },
    );

describe('route contract engine', () => {
    it('accepts a correct declaration, a public route with [] and a route with parameters', () => {
        const result = run(
            {
                PAGE_GET: { route: (id: number) => `/admin/pages/${id}`, permissions: ['admin.page.read'] },
                LOGIN: { route: '/auth/login', permissions: [] },
            },
            { PAGE_GET: ['GET'], LOGIN: ['POST'] },
        );
        expect(result.problems).toEqual([]);
        expect(result.stats.matchedByMethod).toBe(2);
    });

    it('reports a different right with the key and both values', () => {
        const result = run(
            { PAGE_DELETE: { route: (id: number) => `/admin/pages/${id}`, permissions: ['admin.section.delete'] } },
            { PAGE_DELETE: ['DELETE'] },
        );
        expect(result.problems).toEqual([
            'PAGE_DELETE: DELETE /admin/pages/{}: web [admin.section.delete] / backend [admin.page.delete] (route pages_delete)',
        ]);
    });

    it('reports an empty permission list on a write of a non-public route', () => {
        const result = run(
            {
                VERSION_DELETE: {
                    route: (pageId: number, versionId: number) => `/admin/pages/${pageId}/versions/${versionId}`,
                    permissions: [],
                },
            },
            { VERSION_DELETE: ['DELETE'] },
        );
        expect(result.problems).toHaveLength(1);
        expect(result.problems[0]).toContain('permissions [] on a write');
    });

    it('reports a path without a backend route and a method the backend route does not have', () => {
        const result = run(
            {
                GONE: { route: '/admin/gone', permissions: [] },
                PAGE_PUT: { route: (id: number) => `/admin/pages/${id}`, permissions: ['admin.page.read'] },
            },
            { PAGE_PUT: ['PUT'] },
        );
        expect(result.problems).toEqual([
            'GONE: web /admin/gone has no backend route (not in the bffOnly list)',
            'PAGE_PUT: web calls PUT /admin/pages/{}, backend has GET and DELETE there',
        ]);
    });

    it('reports an unknown method as ambiguous when the routes on the path need different rights', () => {
        const result = run({ PAGE: { route: (id: number) => `/admin/pages/${id}`, permissions: ['admin.page.read'] } }, {});
        expect(result.problems).toHaveLength(1);
        expect(result.problems[0]).toContain('no method known');
    });

    it('checks a BFF-only entry against the backend route it forwards to', () => {
        const options = {
            bffOnly: { MINT: { reason: 'BFF mint route', backendPath: '/admin/mobile-preview/session' } },
        };
        const entries = { MINT: { route: '/mobile-preview/session', permissions: ['admin.mobile_preview.create'] } };
        expect(run(entries, { MINT: ['POST'] }, options).problems).toEqual([]);
        expect(run({ MINT: { ...entries.MINT, permissions: ['admin.mobile_preview.read'] } }, { MINT: ['POST'] }, options).problems)
            .toHaveLength(1);
    });

    it('keeps the skip lists honest', () => {
        const result = run(
            { LOGIN: { route: '/auth/login', permissions: [] } },
            { LOGIN: ['POST'] },
            {
                knownFailures: { REMOVED_KEY: 'was listed' },
                bffOnly: { LOGIN: { reason: 'wrongly listed' } },
            },
        );
        expect(result.problems.join('\n')).toContain('knownFailures lists REMOVED_KEY, which is no longer in API_CONFIG.ENDPOINTS');
        expect(result.problems.join('\n')).toContain('LOGIN: listed as bffOnly but the backend has /auth/login');
    });

    it('tolerates a listed known failure and reports one that passes', () => {
        const failing = { PAGE_DELETE: { route: (id: number) => `/admin/pages/${id}`, permissions: ['admin.section.delete'] } };
        const options = { knownFailures: { PAGE_DELETE: 'proposed finding' } };
        const tolerated = run(failing, { PAGE_DELETE: ['DELETE'] }, options);
        expect(tolerated.problems).toEqual([]);
        expect(tolerated.stats.knownFailures).toBe(1);

        const fixed = run(
            { PAGE_DELETE: { ...failing.PAGE_DELETE, permissions: ['admin.page.delete'] } },
            { PAGE_DELETE: ['DELETE'] },
            options,
        );
        expect(fixed.problems).toEqual(['PAGE_DELETE: listed as a known failure but it now passes: remove it from knownFailures']);
    });

    it('builds the path of a route that needs lists and drops the query string', () => {
        expect(
            webPathOf({
                route: (table: string, ids: number[]) => `/admin/data/tables/${encodeURIComponent(table)}/files?ids=${ids.join(',')}`,
                permissions: [],
            }),
        ).toBe('/admin/data/tables/{}/files');
    });
});
