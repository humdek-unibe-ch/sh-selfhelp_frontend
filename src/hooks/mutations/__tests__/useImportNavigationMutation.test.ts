/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement, type ReactNode } from 'react';

const { importNavigation, invalidateAdminNavigationQueries } = vi.hoisted(() => ({
    importNavigation: vi.fn(),
    invalidateAdminNavigationQueries: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../../../api/admin/navigation.api', () => ({
    AdminNavigationApi: {
        importNavigation,
    },
}));

vi.mock('../../../utils/admin-navigation-cache.utils', () => ({
    invalidateAdminNavigationQueries,
}));

import { useImportNavigationMutation } from '../useImportNavigationMutation';

function wrapper(queryClient: QueryClient) {
    return function Wrapper({ children }: { children: ReactNode }) {
        return createElement(QueryClientProvider, { client: queryClient }, children);
    };
}

describe('useImportNavigationMutation', () => {
    beforeEach(() => {
        importNavigation.mockReset();
        invalidateAdminNavigationQueries.mockClear();
        importNavigation.mockResolvedValue({
            imported_menus: ['web_header'],
            created_items: 2,
            skipped_items: 0,
            imported_pages: [],
        });
    });

    it('invalidates navigation queries after successful import', async () => {
        const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } });

        const { result } = renderHook(() => useImportNavigationMutation({ showNotifications: false }), {
            wrapper: wrapper(queryClient),
        });

        result.current.mutate({
            bundle: {
                format: 'selfhelp/navigation-bundle',
                version: '2.0',
                menus: { web_header: { items: [] } },
            },
            options: { missingPagesMode: 'strict' },
        });

        await waitFor(() => expect(result.current.isSuccess).toBe(true));
        expect(invalidateAdminNavigationQueries).toHaveBeenCalledWith(queryClient);
    });
});
