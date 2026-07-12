/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AdminCmsAppApi } from '../../../../../api/admin/cms-app.api';
import {
    useAssignCmsAppPageMutation,
    useChangeCmsAppPageRoleMutation,
    useScaffoldCmsAppMutation,
    useUnassignCmsAppPageMutation,
    useUpdateCmsAppMutation,
} from '../../../../../hooks/useCmsApps';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';

vi.mock('../../../../../api/admin/cms-app.api', () => ({
    AdminCmsAppApi: {
        update: vi.fn(async () => ({ id: 42, slug: 'team-members', pages: [] })),
        assignPage: vi.fn(async () => ({ id: 42, slug: 'team-members', pages: [] })),
        changePageRole: vi.fn(async () => ({ id: 42, slug: 'team-members', pages: [] })),
        unassignPage: vi.fn(async () => ({ id: 42, slug: 'team-members', pages: [] })),
        scaffold: vi.fn(async () => ({ app_id: 42, created: [] })),
        list: vi.fn(),
        getBySlug: vi.fn(),
        create: vi.fn(),
        getById: vi.fn(),
        remove: vi.fn(),
    },
}));

vi.mock('@mantine/notifications', () => ({
    notifications: { show: vi.fn() },
}));

function wrapper({ children }: { children: ReactNode }) {
    const client = new QueryClient({
        defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

/**
 * Slug UI resolves the app once (by-slug); mutations must always pass numeric id
 * into AdminCmsAppApi — never a slug string.
 */
describe('CMS app mutations use numeric app id', () => {
    const appId = 42;

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('update / assign / changeRole / unassign / scaffold call AdminCmsAppApi with the numeric id', async () => {
        const { result: update } = renderHook(() => useUpdateCmsAppMutation(appId), { wrapper });
        const { result: assign } = renderHook(() => useAssignCmsAppPageMutation(appId), { wrapper });
        const { result: changeRole } = renderHook(() => useChangeCmsAppPageRoleMutation(appId), {
            wrapper,
        });
        const { result: unassign } = renderHook(() => useUnassignCmsAppPageMutation(appId), {
            wrapper,
        });
        const { result: scaffold } = renderHook(() => useScaffoldCmsAppMutation(appId), { wrapper });

        update.current.mutate({ name: 'Team' });
        assign.current.mutate({ page_id: 7, role: 'other' });
        changeRole.current.mutate({ pageId: 7, role: 'cms_list' });
        unassign.current.mutate(7);
        scaffold.current.mutate({ base_name: 'team', create_form: true });

        await waitFor(() => {
            expect(AdminCmsAppApi.update).toHaveBeenCalledWith(42, { name: 'Team' });
            expect(AdminCmsAppApi.assignPage).toHaveBeenCalledWith(42, {
                page_id: 7,
                role: 'other',
            });
            expect(AdminCmsAppApi.changePageRole).toHaveBeenCalledWith(42, 7, { role: 'cms_list' });
            expect(AdminCmsAppApi.unassignPage).toHaveBeenCalledWith(42, 7);
            expect(AdminCmsAppApi.scaffold).toHaveBeenCalledWith(42, {
                base_name: 'team',
                create_form: true,
            });
        });

        for (const mock of [
            AdminCmsAppApi.update,
            AdminCmsAppApi.assignPage,
            AdminCmsAppApi.changePageRole,
            AdminCmsAppApi.unassignPage,
            AdminCmsAppApi.scaffold,
        ]) {
            const firstArg = vi.mocked(mock).mock.calls[0]?.[0];
            expect(typeof firstArg).toBe('number');
            expect(firstArg).not.toBe('team-members');
        }
    });
});
