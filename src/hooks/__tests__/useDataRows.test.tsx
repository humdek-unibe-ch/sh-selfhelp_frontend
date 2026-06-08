/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { type ReactNode } from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { createTestQueryClient } from '../../test-utils/renderWithProviders';

/**
 * Regression guard (canonical Testing Rule 2) for the "show deleted rows"
 * crash: when the filters change, the rows query key changes too. Without
 * `placeholderData: keepPreviousData`, React Query dropped `data` to undefined
 * mid-transition, so `rows` became [] while the table still held columns from
 * the old shape — TanStack Table then crashed. This test pins that the hook
 * KEEPS the previous rows visible while the new (differently-shaped) result is
 * in flight, so the table never sees an empty/mismatched frame.
 */
const { getDataRows } = vi.hoisted(() => ({ getDataRows: vi.fn() }));

vi.mock('../../api/admin/data.api', () => ({
    AdminDataApi: { getDataRows },
}));

import { useDataRows } from '../useData';

function wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={createTestQueryClient()}>{children}</QueryClientProvider>;
}

describe('useDataRows — keepPreviousData on filter change', () => {
    beforeEach(() => {
        getDataRows.mockReset();
    });

    it('retains the previous rows while a filter-changed refetch is in flight', async () => {
        const firstRows = { rows: [{ record_id: 1, a: 'x' }] };
        const secondRows = { rows: [{ record_id: 2, b: 'y', deleted: true }] };

        // First call (exclude_deleted = true) resolves immediately.
        // Second call (exclude_deleted = false) is held pending so we can observe
        // the transition frame.
        let resolveSecond: (v: typeof secondRows) => void = () => {};
        getDataRows
            .mockResolvedValueOnce(firstRows)
            .mockImplementationOnce(() => new Promise((res) => { resolveSecond = res; }));

        const { result, rerender } = renderHook(
            ({ excludeDeleted }) => useDataRows({ table_name: '218', exclude_deleted: excludeDeleted }),
            { wrapper, initialProps: { excludeDeleted: true } },
        );

        await waitFor(() => expect(result.current.isSuccess).toBe(true));
        expect(result.current.data).toEqual(firstRows);

        // Change the filter → new query key → refetch starts.
        rerender({ excludeDeleted: false });

        // The crux: during the pending refetch the hook must still expose the
        // OLD rows (not undefined), and report fetching.
        await waitFor(() => expect(result.current.isFetching).toBe(true));
        expect(result.current.data).toEqual(firstRows);

        // Resolve the second request; data swaps to the new shape cleanly.
        resolveSecond(secondRows);
        await waitFor(() => expect(result.current.data).toEqual(secondRows));
    });

    it('does not fetch until a table name is provided', () => {
        renderHook(() => useDataRows({ table_name: '' }), { wrapper });
        expect(getDataRows).not.toHaveBeenCalled();
    });
});
