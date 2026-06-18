/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
/**
 * Regression guard (canonical Testing Rule 2) for the second wave of the React
 * Query key-drift cleanup: the section and page-version mutations used to
 * invalidate ad-hoc string literals (`['pageSections', …]`,
 * `['admin','sections','unused']`, `['page-versions', …]`,
 * `['unpublished-changes', …]`, …) that had to stay byte-for-byte in sync with
 * the literals in the read hooks. They now invalidate the shared
 * `REACT_QUERY_CONFIG.QUERY_KEYS` entries, so a reader/writer pair can no longer
 * drift. These tests pin that the writers invalidate exactly those registry
 * keys, and that the dead `['sectionDetails', id]` `removeQueries` (no reader
 * ever subscribed to it) is gone.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { type ReactNode } from 'react';
import { renderHook } from '@testing-library/react';
import { QueryClientProvider, type QueryClient } from '@tanstack/react-query';
import type * as MantineNotifications from '@mantine/notifications';
import { createTestQueryClient } from '../../../test-utils/renderWithProviders';
import { REACT_QUERY_CONFIG } from '../../../config/react-query.config';

const { deleteSection, publishNewVersion } = vi.hoisted(() => ({
    deleteSection: vi.fn(),
    publishNewVersion: vi.fn(),
}));

vi.mock('../../../api/admin/section.api', () => ({
    AdminSectionApi: { deleteSection },
}));
vi.mock('../../../api/admin/page-version.api', () => ({
    PageVersionApi: { publishNewVersion },
}));
vi.mock('../../../api/admin/page.api', () => ({
    AdminPageApi: {},
}));
vi.mock('@mantine/notifications', async (importOriginal) => {
    const actual = await importOriginal<typeof MantineNotifications>();
    return { ...actual, notifications: { ...actual.notifications, show: vi.fn() } };
});

import { useDeleteSectionMutation } from '../sections/useDeleteSectionMutation';
import { usePublishVersionMutation } from '../usePageVersionMutations';

const QK = REACT_QUERY_CONFIG.QUERY_KEYS;

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

describe('section / version mutation cache keys', () => {
    beforeEach(() => {
        deleteSection.mockReset();
        publishNewVersion.mockReset();
    });

    it('delete section invalidates the shared section registry keys and no longer removes the orphan sectionDetails key', async () => {
        deleteSection.mockResolvedValue({ success: true });
        const queryClient = createTestQueryClient();
        const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');
        const removeSpy = vi.spyOn(queryClient, 'removeQueries');

        const { result } = renderHook(() => useDeleteSectionMutation({ showNotifications: false }), {
            wrapper: makeWrapper(queryClient),
        });

        await result.current.mutateAsync({ sectionId: 9 });

        const keys = invalidatedKeys(invalidateSpy.mock.calls);
        expect(keys).toContain(JSON.stringify(QK.PAGE_SECTIONS_ALL));
        expect(keys).toContain(JSON.stringify(QK.ADMIN_SECTIONS_REF_CONTAINERS));
        expect(keys).toContain(JSON.stringify(QK.ADMIN_SECTIONS_UNUSED));
        // The dead `removeQueries({ queryKey: ['sectionDetails', id] })` (no
        // reader used that key shape) must not come back.
        expect(removeSpy).not.toHaveBeenCalled();
    });

    it('publish version invalidates the page-versions / unpublished-changes / page-details / admin-pages registry keys', async () => {
        publishNewVersion.mockResolvedValue({});
        const queryClient = createTestQueryClient();
        const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

        const { result } = renderHook(() => usePublishVersionMutation(), {
            wrapper: makeWrapper(queryClient),
        });

        await result.current.mutateAsync({ pageId: 4 });

        const keys = invalidatedKeys(invalidateSpy.mock.calls);
        expect(keys).toContain(JSON.stringify(QK.PAGE_VERSIONS(4)));
        expect(keys).toContain(JSON.stringify(QK.UNPUBLISHED_CHANGES(4)));
        expect(keys).toContain(JSON.stringify(QK.PAGE_DETAILS(4)));
        expect(keys).toContain(JSON.stringify(QK.ADMIN_PAGES));
    });
});
