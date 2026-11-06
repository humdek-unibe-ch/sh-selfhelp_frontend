/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { type ReactNode } from 'react';
import { act, renderHook } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { createTestQueryClient } from '../../../test-utils/renderWithProviders';

/** L2: page toasts name the page by its keyword, never by its database id. */
const { updatePage, deletePage, show } = vi.hoisted(() => ({
    updatePage: vi.fn(),
    deletePage: vi.fn(),
    show: vi.fn(),
}));

vi.mock('../../../api/admin', () => ({ AdminApi: { updatePage, deletePage } }));
vi.mock('@mantine/notifications', () => ({ notifications: { show } }));
vi.mock('../../useAdminPages', () => ({
    useAdminPages: () => ({ pages: [{ id_pages: 477, keyword: 'qa-about', is_system: false }] }),
}));

import { useUpdatePageMutation } from '../useUpdatePageMutation';
import { useDeletePageMutation } from '../useDeletePageMutation';

function wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={createTestQueryClient()}>{children}</QueryClientProvider>;
}

const lastMessage = () => (show.mock.calls.at(-1)?.[0] as { message: string }).message;

describe('page mutation messages', () => {
    beforeEach(() => show.mockReset());

    it('names the saved page by its keyword', async () => {
        updatePage.mockResolvedValue({ page: { id: 477, keyword: 'qa-about' }, fields: [] });
        const { result } = renderHook(() => useUpdatePageMutation(), { wrapper });

        await act(() => result.current.mutateAsync({ pageId: 477, updateData: { pageData: {}, fields: [] } }));

        expect(lastMessage()).toContain('Page "qa-about"');
        expect(lastMessage()).not.toContain('477');
    });

    it('names the deleted page by its keyword', async () => {
        deletePage.mockResolvedValue({ success: true });
        const { result } = renderHook(() => useDeletePageMutation(), { wrapper });

        await act(() => result.current.mutateAsync(477));

        expect(lastMessage()).toContain('Page "qa-about"');
        expect(lastMessage()).not.toContain('477');
    });
});
