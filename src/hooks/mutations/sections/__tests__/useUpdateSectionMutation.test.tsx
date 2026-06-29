/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { type ReactNode } from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { type IUpdateSectionRequest } from '../../../../types/requests/admin/update-section.types';

/**
 * Regression for issue #56 v2: a section save can change its `data_config` (the
 * data columns/variables the `{{ }}` picker offers), so the section-update
 * mutation MUST prefix-invalidate the interpolation catalog on success. Without
 * this the picker only refreshed after a full page reload — the exact bug
 * reported. The catalog key prefix is `['admin','interpolation','variables']`
 * (every context/id), matching `REACT_QUERY_CONFIG.QUERY_KEYS.INTERPOLATION_VARIABLES`.
 */
const { updateSection } = vi.hoisted(() => ({ updateSection: vi.fn() }));

vi.mock('../../../../api/admin/section.api', () => ({
    AdminSectionApi: { updateSection },
}));

import { useUpdateSectionMutation } from '../useUpdateSectionMutation';

const SECTION_DATA: IUpdateSectionRequest = {
    contentFields: [],
    propertyFields: [],
    globalFields: { data_config: '[{"scope":"qa","table":"qa_form"}]' },
};

describe('useUpdateSectionMutation — interpolation cache invalidation', () => {
    beforeEach(() => {
        updateSection.mockReset();
    });

    it('prefix-invalidates the interpolation variable catalog after a section save', async () => {
        updateSection.mockResolvedValueOnce({ id: 230 });

        const queryClient = new QueryClient({
            defaultOptions: { queries: { retry: false } },
        });
        const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

        function wrapper({ children }: { children: ReactNode }) {
            return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
        }

        const { result } = renderHook(
            () => useUpdateSectionMutation({ showNotifications: false }),
            { wrapper },
        );

        result.current.mutate({ pageId: 7, sectionId: 230, sectionData: SECTION_DATA });

        await waitFor(() => expect(result.current.isSuccess).toBe(true));

        expect(invalidateSpy).toHaveBeenCalledWith({
            queryKey: ['admin', 'interpolation', 'variables'],
        });
    });
});
