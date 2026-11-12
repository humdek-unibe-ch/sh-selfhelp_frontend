/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { describe, it, expect, vi } from 'vitest';
import { type ReactNode } from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClientProvider, useQuery } from '@tanstack/react-query';
import { createTestQueryClient } from '../../test-utils/renderWithProviders';

/**
 * L1: updating a role invalidated the `['roles']` prefix and then the role's
 * detail key again, so the open role was fetched twice.
 */
vi.mock('../../api/admin/role.api', () => ({
    AdminRoleApi: { updateRole: vi.fn().mockResolvedValue({ id: 4 }) },
}));
vi.mock('@mantine/notifications', () => ({ notifications: { show: vi.fn() } }));

import { useUpdateRole } from '../useRoles';

describe('useUpdateRole', () => {
    it('fetches the updated role once', async () => {
        const queryClient = createTestQueryClient();
        const wrapper = ({ children }: { children: ReactNode }) => (
            <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
        );
        let fetches = 0;
        renderHook(
            () => useQuery({ queryKey: ['roles', 'detail', 4], queryFn: () => { fetches += 1; return {}; } }),
            { wrapper },
        );
        await waitFor(() => expect(fetches).toBe(1));
        fetches = 0;

        const { result } = renderHook(() => useUpdateRole(), { wrapper });
        await result.current.mutateAsync({ roleId: 4, data: {} as never });

        await waitFor(() => expect(fetches).toBeGreaterThan(0));
        await waitFor(() => expect(queryClient.isFetching()).toBe(0));
        expect(fetches).toBe(1);
    });
});
