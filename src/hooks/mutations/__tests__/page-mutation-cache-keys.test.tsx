/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
/**
 * Regression guard (canonical Testing Rule 2) for the React Query key drift
 * the audit flagged: the page mutations invalidated camelCase `['adminPages']`
 * and a non-existent `['pages']` key, neither of which matches the kebab-case
 * `['admin-pages']` / `['frontend-pages', …]` keys the read hooks subscribe to.
 * The list/nav therefore never refreshed after a create/update.
 *
 * These tests pin that the page mutations now invalidate exactly the registry
 * keys the read hooks use, and never the dead literals again.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { type ReactNode } from 'react';
import { renderHook } from '@testing-library/react';
import { QueryClientProvider, type QueryClient } from '@tanstack/react-query';
import { createTestQueryClient } from '../../../test-utils/renderWithProviders';
import { REACT_QUERY_CONFIG } from '../../../config/react-query.config';
import { type ICreatePageRequest } from '../../../types/requests/admin/create-page.types';
import { type IUpdatePageRequest } from '../../../types/requests/admin/update-page.types';

const { createPage, updatePage, deletePage } = vi.hoisted(() => ({
    createPage: vi.fn(),
    updatePage: vi.fn(),
    deletePage: vi.fn(),
}));

vi.mock('../../../api/admin', () => ({
    AdminApi: { createPage, updatePage, deletePage },
}));

vi.mock('../../useAdminPages', () => ({
    useAdminPages: () => ({ pages: [] }),
}));

import { useCreatePageMutation } from '../useCreatePageMutation';
import { useDeletePageMutation } from '../useDeletePageMutation';
import { useUpdatePageMutation } from '../useUpdatePageMutation';

const QK = REACT_QUERY_CONFIG.QUERY_KEYS;

/** Collect every queryKey passed to `invalidateQueries`, JSON-encoded for set comparison. */
function invalidatedKeys(calls: unknown[][]): string[] {
    return calls.map((call) => {
        const arg = call[0] as { queryKey?: unknown } | undefined;
        return JSON.stringify(arg?.queryKey);
    });
}

function makeWrapper(queryClient: QueryClient) {
    return function Wrapper({ children }: { children: ReactNode }) {
        return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
    };
}

describe('page mutation cache keys', () => {
    beforeEach(() => {
        createPage.mockReset();
        updatePage.mockReset();
        deletePage.mockReset();
    });

    it('registry keys match the keys the read hooks subscribe to', () => {
        expect(QK.ADMIN_PAGES).toEqual(['admin-pages']);
        expect(QK.FRONTEND_PAGES_ALL).toEqual(['frontend-pages']);
        expect(QK.FRONTEND_PAGES(2)).toEqual(['frontend-pages', 2]);
        expect(QK.PAGE_SECTIONS(7)).toEqual(['pageSections', 7]);
        expect(QK.PAGE_FIELDS(7)).toEqual(['pageFields', 7]);
        // The buggy literals must never equal the real keys.
        expect(QK.ADMIN_PAGES).not.toEqual(['adminPages']);
    });

    it('page editor / section / version registry keys reproduce the exact reader-hook shapes', () => {
        // Prefix bases used by writers + `useIsFetching`.
        expect(QK.PAGE_SECTIONS_ALL).toEqual(['pageSections']);
        expect(QK.PAGE_BY_KEYWORD_ALL).toEqual(['page-by-keyword']);
        // `usePageContentByKeyword` / SSR layout read this full shape.
        expect(QK.PAGE_BY_KEYWORD('kw', 2, false)).toEqual(['page-by-keyword', 'kw', 2, 'published']);
        expect(QK.PAGE_BY_KEYWORD('kw', 2, true)).toEqual(['page-by-keyword', 'kw', 2, 'preview']);
        // `usePageVersions` list reader appends params to the writer prefix.
        expect(QK.PAGE_VERSIONS(4)).toEqual(['page-versions', 4]);
        expect([...QK.PAGE_VERSIONS(4), undefined]).toEqual(['page-versions', 4, undefined]);
        expect(QK.PAGE_VERSION(4, 9, false)).toEqual(['page-version', 4, 9, false]);
        expect(QK.VERSION_COMPARISON(4, 9, 10, 'side_by_side')).toEqual(
            ['version-comparison', 4, 9, 10, 'side_by_side'],
        );
        // `useUnpublishedChanges` reader.
        expect(QK.UNPUBLISHED_CHANGES(4)).toEqual(['unpublished-changes', 4]);
        // `useSectionUtility` readers.
        expect(QK.ADMIN_SECTIONS_UNUSED).toEqual(['admin', 'sections', 'unused']);
        expect(QK.ADMIN_SECTIONS_REF_CONTAINERS).toEqual(['admin', 'sections', 'ref-containers']);
        expect(QK.ADMIN_SECTIONS_PAGES([7])).toEqual(['admin', 'sections', 'pages', [7]]);
        // `useSectionDetails` reader (must NOT be the old camelCase/`section-details` shape).
        expect(QK.SECTION_DETAILS(4, 9)).toEqual(['admin', 'sections', 'details', 4, 9]);
        expect(QK.SECTION_DETAILS(4, 9)).not.toEqual(['sectionDetails', 9]);
    });

    it('create invalidates the admin-pages + frontend-pages keys, never the dead literals', async () => {
        createPage.mockResolvedValue({ id: 1, keyword: 'qa-page' });
        const queryClient = createTestQueryClient();
        const spy = vi.spyOn(queryClient, 'invalidateQueries');

        const { result } = renderHook(() => useCreatePageMutation({ showNotifications: false }), {
            wrapper: makeWrapper(queryClient),
        });

        await result.current.mutateAsync({} as ICreatePageRequest);

        const keys = invalidatedKeys(spy.mock.calls);
        expect(keys).toContain(JSON.stringify(QK.ADMIN_PAGES));
        expect(keys).toContain(JSON.stringify(QK.FRONTEND_PAGES_ALL));
        expect(keys).not.toContain(JSON.stringify(['adminPages']));
        expect(keys).not.toContain(JSON.stringify(['pages']));
    });

    it('update invalidates the page-scoped + list keys, never the dead literals', async () => {
        updatePage.mockResolvedValue({ id: 4, keyword: 'qa-page' });
        const queryClient = createTestQueryClient();
        const spy = vi.spyOn(queryClient, 'invalidateQueries');

        const { result } = renderHook(() => useUpdatePageMutation({ showNotifications: false }), {
            wrapper: makeWrapper(queryClient),
        });

        await result.current.mutateAsync({ pageId: 4, updateData: {} as IUpdatePageRequest });

        const keys = invalidatedKeys(spy.mock.calls);
        expect(keys).toContain(JSON.stringify(QK.ADMIN_PAGES));
        expect(keys).toContain(JSON.stringify(QK.PAGE_FIELDS(4)));
        expect(keys).toContain(JSON.stringify(QK.PAGE_SECTIONS(4)));
        expect(keys).toContain(JSON.stringify(QK.FRONTEND_PAGES_ALL));
        expect(keys).not.toContain(JSON.stringify(['adminPages']));
        expect(keys).not.toContain(JSON.stringify(['pages']));
    });

    it('delete calls the success callback before shared cache invalidation so the route can leave first', async () => {
        deletePage.mockResolvedValue({ success: true });
        const queryClient = createTestQueryClient();
        const events: string[] = [];
        vi.spyOn(queryClient, 'invalidateQueries').mockImplementation(async (filters) => {
            events.push(`invalidate:${JSON.stringify(filters?.queryKey)}`);
            return undefined;
        });
        vi.spyOn(queryClient, 'cancelQueries').mockImplementation(async (filters) => {
            events.push(`cancel:${JSON.stringify(filters?.queryKey)}`);
            return undefined;
        });
        vi.spyOn(queryClient, 'removeQueries').mockImplementation((filters) => {
            events.push(`remove:${JSON.stringify(filters?.queryKey)}`);
        });

        const { result } = renderHook(
            () => useDeletePageMutation({
                showNotifications: false,
                onSuccess: () => {
                    events.push('callback:onSuccess');
                },
            }),
            { wrapper: makeWrapper(queryClient) },
        );

        await result.current.mutateAsync(9);

        expect(events[0]).toBe('callback:onSuccess');
        expect(events).toContain(`cancel:${JSON.stringify(QK.PAGE_FIELDS(9))}`);
        expect(events).toContain(`cancel:${JSON.stringify(QK.PAGE_SECTIONS(9))}`);
        expect(events).toContain(`remove:${JSON.stringify(QK.PAGE_FIELDS(9))}`);
        expect(events).toContain(`remove:${JSON.stringify(QK.PAGE_SECTIONS(9))}`);
        expect(events).toContain(`invalidate:${JSON.stringify(QK.ADMIN_PAGES)}`);
        expect(events).toContain(`invalidate:${JSON.stringify(QK.FRONTEND_PAGES_ALL)}`);
    });
});
