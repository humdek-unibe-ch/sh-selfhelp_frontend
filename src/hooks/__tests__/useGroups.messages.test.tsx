/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { describe, it, expect, vi } from 'vitest';
import { type ReactNode } from 'react';
import { act, renderHook } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { createTestQueryClient } from '../../test-utils/renderWithProviders';

/** L2: a duplicate group name says so, instead of "Conflict". */
const { createGroup, show } = vi.hoisted(() => ({ createGroup: vi.fn(), show: vi.fn() }));

vi.mock('../../api/admin/group.api', () => ({ AdminGroupApi: { createGroup } }));
vi.mock('@mantine/notifications', () => ({ notifications: { show } }));

import { useCreateGroup } from '../useGroups';

function wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={createTestQueryClient()}>{children}</QueryClientProvider>;
}

describe('useCreateGroup messages', () => {
    it("shows the backend's reason when the name is taken", async () => {
        createGroup.mockRejectedValue({
            response: { status: 409, data: { status: 409, message: 'Conflict', error: 'Group name already exists' } },
        });
        const { result } = renderHook(() => useCreateGroup(), { wrapper });

        await act(async () => {
            await result.current.mutateAsync({ name: 'qa-dup' }).catch(() => undefined);
        });

        expect(show).toHaveBeenCalledTimes(1);
        expect(show).toHaveBeenCalledWith(expect.objectContaining({ message: 'Group name already exists', color: 'red' }));
    });
});
