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
 * The unified `{{ }}` picker hook (issue #56 v2) backs every CMS editor surface
 * through one context-aware endpoint. These guards pin the enabling contract:
 *   - id-targeted contexts (`section`, `page`) wait for an id;
 *   - non-targeted contexts (`global`, and `action` with no chosen data table)
 *     fetch immediately so recipient/system/globals are always offered;
 *   - the backend's token => label map is returned verbatim.
 */
const { getVariables } = vi.hoisted(() => ({ getVariables: vi.fn() }));

vi.mock('../../api/admin/interpolation.api', () => ({
    AdminInterpolationApi: { getVariables },
}));

import { useInterpolationVariables } from '../useInterpolationVariables';

function wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={createTestQueryClient()}>{children}</QueryClientProvider>;
}

describe('useInterpolationVariables — context-aware picker fetch', () => {
    beforeEach(() => {
        getVariables.mockReset();
    });

    it('waits for an id in the page context', () => {
        renderHook(() => useInterpolationVariables('page', null), { wrapper });
        expect(getVariables).not.toHaveBeenCalled();
    });

    it('fetches the global context without an id', async () => {
        getVariables.mockResolvedValueOnce({ 'system.user_name': 'system.user_name' });
        const { result } = renderHook(() => useInterpolationVariables('global'), { wrapper });
        await waitFor(() => expect(result.current.isSuccess).toBe(true));
        expect(getVariables).toHaveBeenCalledWith('global', null);
    });

    it('fetches the action context even without a data table id', async () => {
        getVariables.mockResolvedValueOnce({ 'recipient.email': 'recipient.email' });
        const { result } = renderHook(() => useInterpolationVariables('action', null), { wrapper });
        await waitFor(() => expect(result.current.isSuccess).toBe(true));
        expect(getVariables).toHaveBeenCalledWith('action', null);
    });

    it('passes the action data table id when chosen', async () => {
        const variables = { 'record.section_230': 'record.Age', 'recipient.email': 'recipient.email' };
        getVariables.mockResolvedValueOnce(variables);
        const { result } = renderHook(() => useInterpolationVariables('action', 42), { wrapper });
        await waitFor(() => expect(result.current.isSuccess).toBe(true));
        expect(getVariables).toHaveBeenCalledWith('action', 42);
        expect(result.current.data).toEqual(variables);
    });

    it('does not fetch when explicitly disabled', () => {
        renderHook(() => useInterpolationVariables('page', 5, false), { wrapper });
        expect(getVariables).not.toHaveBeenCalled();
    });
});
