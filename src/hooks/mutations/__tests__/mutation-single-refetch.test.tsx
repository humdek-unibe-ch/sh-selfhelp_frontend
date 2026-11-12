/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { describe, it, expect, vi } from 'vitest';
import { type ReactNode } from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClientProvider, useQuery, type QueryClient } from '@tanstack/react-query';
import { createTestQueryClient } from '../../../test-utils/renderWithProviders';
import { REACT_QUERY_CONFIG } from '../../../config/react-query.config';

/**
 * L1: mutations stacked `invalidateQueries` + `refetchQueries` on the same key,
 * so each mutation fetched pages, sections, versions and languages twice, and
 * section-only changes also refetched the whole admin page list. One
 * invalidation per key already refetches active observers (AGENTS.md).
 */
const api = vi.hoisted(() => ({
    createSectionInPage: vi.fn().mockResolvedValue({ id: 1 }),
    removeSectionFromSection: vi.fn().mockResolvedValue({}),
    publishNewVersion: vi.fn().mockResolvedValue({ id: 1 }),
    createLanguage: vi.fn().mockResolvedValue({ id: 3, locale: 'fr' }),
}));

vi.mock('../../../api/admin', () => ({
    AdminApi: { createSectionInPage: api.createSectionInPage, removeSectionFromSection: api.removeSectionFromSection },
}));
vi.mock('../../../api/admin/page-version.api', () => ({ PageVersionApi: { publishNewVersion: api.publishNewVersion } }));
vi.mock('../../../api/admin/language.api', () => ({ AdminLanguageApi: { createLanguage: api.createLanguage } }));
vi.mock('@mantine/notifications', () => ({ notifications: { show: vi.fn() } }));

import { useCreateSectionInPageMutation } from '../sections/useCreateSectionInPageMutation';
import { useRemoveSectionFromSectionMutation } from '../sections/useRemoveSectionFromSectionMutation';
import { usePublishVersionMutation } from '../usePageVersionMutations';
import { useCreateLanguageMutation } from '../useLanguageMutations';

const QK = REACT_QUERY_CONFIG.QUERY_KEYS;

/** Mounts an active observer per key and counts how often each is fetched. */
async function setup(keys: (readonly unknown[])[]) {
    const queryClient: QueryClient = createTestQueryClient();
    const fetches = new Map<string, number>();
    const wrapper = ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
    for (const key of keys) {
        const id = JSON.stringify(key);
        renderHook(
            () => useQuery({ queryKey: key, queryFn: () => { fetches.set(id, (fetches.get(id) ?? 0) + 1); return {}; } }),
            { wrapper },
        );
        await waitFor(() => expect(fetches.get(id)).toBe(1));
        fetches.set(id, 0);
    }
    const fetched = (key: readonly unknown[]) => fetches.get(JSON.stringify(key)) ?? 0;
    return { wrapper, fetched };
}

describe('mutations refetch each key once', () => {
    it('creating a section in a page', async () => {
        const { wrapper, fetched } = await setup([QK.PAGE_SECTIONS(7)]);
        const { result } = renderHook(() => useCreateSectionInPageMutation({ showNotifications: false }), { wrapper });

        await result.current.mutateAsync({ pageId: 7, sections: [] } as never);

        expect(fetched(QK.PAGE_SECTIONS(7))).toBe(1);
    });

    it('removing a child section, without refetching the page list', async () => {
        const { wrapper, fetched } = await setup([QK.PAGE_SECTIONS(7), QK.ADMIN_PAGES]);
        const { result } = renderHook(() => useRemoveSectionFromSectionMutation({ showNotifications: false, pageId: 7 }), { wrapper });

        await result.current.mutateAsync({ pageId: 7, parentSectionId: 1, childSectionId: 2 });

        expect(fetched(QK.PAGE_SECTIONS(7))).toBe(1);
        expect(fetched(QK.ADMIN_PAGES)).toBe(0);
    });

    it('publishing a version', async () => {
        const { wrapper, fetched } = await setup([QK.PAGE_VERSIONS(7)]);
        const { result } = renderHook(() => usePublishVersionMutation(), { wrapper });

        await result.current.mutateAsync({ pageId: 7 });

        expect(fetched(QK.PAGE_VERSIONS(7))).toBe(1);
    });

    it('creating a language', async () => {
        const { wrapper, fetched } = await setup([QK.LANGUAGES, QK.PUBLIC_LANGUAGES]);
        const { result } = renderHook(() => useCreateLanguageMutation({ showNotifications: false }), { wrapper });

        await result.current.mutateAsync({ locale: 'fr', language: 'French' } as never);

        expect(fetched(QK.LANGUAGES)).toBe(1);
        expect(fetched(QK.PUBLIC_LANGUAGES)).toBe(1);
    });
});
