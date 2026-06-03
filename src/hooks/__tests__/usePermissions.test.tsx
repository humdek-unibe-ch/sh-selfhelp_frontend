/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { describe, it, expect, vi } from 'vitest';
import { type ReactNode } from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { createTestQueryClient } from '../../test-utils/renderWithProviders';

/**
 * Higher-risk subject (Slice 6): the permissions hook drives the admin
 * authorization UI. The API boundary is mocked (canonical Testing Rule 11/30 —
 * no real outbound) so the test pins the React Query wiring: data on success,
 * error state on rejection.
 */
const { getAllPermissions } = vi.hoisted(() => ({ getAllPermissions: vi.fn() }));

vi.mock('../../api/admin/permission.api', () => ({
    AdminPermissionApi: { getAllPermissions },
}));

import { usePermissions } from '../usePermissions';

function renderUsePermissions() {
    const queryClient = createTestQueryClient();
    const wrapper = ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
    return renderHook(() => usePermissions(), { wrapper });
}

describe('usePermissions', () => {
    it('returns the permissions payload on success', async () => {
        getAllPermissions.mockResolvedValue({ permissions: [{ id: 1, name: 'admin.access' }] });

        const { result } = renderUsePermissions();

        await waitFor(() => expect(result.current.isSuccess).toBe(true));
        expect(result.current.data).toEqual({ permissions: [{ id: 1, name: 'admin.access' }] });
        expect(getAllPermissions).toHaveBeenCalledTimes(1);
    });

    it('surfaces an error state when the API rejects', async () => {
        getAllPermissions.mockRejectedValue(new Error('boom'));

        const { result } = renderUsePermissions();

        await waitFor(() => expect(result.current.isError).toBe(true));
    });
});
