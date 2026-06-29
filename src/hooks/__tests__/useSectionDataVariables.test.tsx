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
 * The interpolation variable picker is fetched by its own hook (issue #56) so a
 * data column added by a later form submission shows up immediately, instead of
 * riding along in the cached section payload. These guards pin that contract:
 * the hook stays disabled without a section id, and otherwise returns the
 * backend's token => label map verbatim for the editor's mention picker.
 */
const { getSectionDataVariables } = vi.hoisted(() => ({ getSectionDataVariables: vi.fn() }));

vi.mock('../../api/admin/section.api', () => ({
    AdminSectionApi: { getSectionDataVariables },
}));

import { useSectionDataVariables } from '../useSectionDataVariables';

function wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={createTestQueryClient()}>{children}</QueryClientProvider>;
}

describe('useSectionDataVariables — on-demand fresh picker fetch', () => {
    beforeEach(() => {
        getSectionDataVariables.mockReset();
    });

    it('does not fetch until a section id is provided', () => {
        renderHook(() => useSectionDataVariables(null), { wrapper });
        expect(getSectionDataVariables).not.toHaveBeenCalled();
    });

    it('does not fetch when explicitly disabled even with a section id', () => {
        renderHook(() => useSectionDataVariables(230, false), { wrapper });
        expect(getSectionDataVariables).not.toHaveBeenCalled();
    });

    it('returns the backend token => label map for the picker', async () => {
        const variables = { 'd.changed': 'd.Changed label', 'system.user_name': 'system.user_name' };
        getSectionDataVariables.mockResolvedValueOnce(variables);

        const { result } = renderHook(() => useSectionDataVariables(230), { wrapper });

        await waitFor(() => expect(result.current.isSuccess).toBe(true));
        expect(getSectionDataVariables).toHaveBeenCalledWith(230);
        expect(result.current.data).toEqual(variables);
    });
});
