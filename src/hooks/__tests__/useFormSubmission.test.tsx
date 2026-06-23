/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { type ReactNode } from 'react';
import { renderHook, act } from '@testing-library/react';
import { QueryClientProvider, type QueryClient } from '@tanstack/react-query';
import { createTestQueryClient } from '../../test-utils/renderWithProviders';
import { REACT_QUERY_CONFIG } from '../../config/react-query.config';

/**
 * Regression guard for the form-submission cache cleanup.
 *
 * The backend submit/update responses carry NO `success`/`message` fields, so
 * the old `if (response.data?.success && response.data?.message)` toast never
 * fired (dead code). Success feedback (redirect / inline confirmation) is owned
 * by the FormUserInput renderer. This locks in the intended behaviour:
 *   - success shows NO notification, and
 *   - the three caches the submission can affect are still invalidated.
 */
const { submitForm, updateForm, showNotification } = vi.hoisted(() => ({
    submitForm: vi.fn(),
    updateForm: vi.fn(),
    showNotification: vi.fn(),
}));

vi.mock('../../api/frontend/form-submission.api', () => ({
    FormSubmissionApi: { submitForm, updateForm, deleteForm: vi.fn() },
}));
vi.mock('@mantine/notifications', () => ({
    notifications: { show: showNotification },
}));

import { useSubmitFormMutation, useUpdateFormMutation } from '../useFormSubmission';

let queryClient: QueryClient;

function wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

const EXPECTED_INVALIDATIONS = [
    REACT_QUERY_CONFIG.QUERY_KEYS.PAGE_BY_KEYWORD_ALL,
    ['userInputEntries'],
    REACT_QUERY_CONFIG.QUERY_KEYS.USER_DATA,
];

beforeEach(() => {
    queryClient = createTestQueryClient();
    submitForm.mockReset().mockResolvedValue({ data: null });
    updateForm.mockReset().mockResolvedValue({ data: null });
    showNotification.mockReset();
});

describe('useSubmitFormMutation', () => {
    it('invalidates the affected caches and shows no success toast', async () => {
        const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');
        const { result } = renderHook(() => useSubmitFormMutation(), { wrapper });

        await act(async () => {
            await result.current.mutateAsync({ section_id: 1, page_id: 2 } as never);
        });

        for (const queryKey of EXPECTED_INVALIDATIONS) {
            expect(invalidateSpy).toHaveBeenCalledWith({ queryKey });
        }
        expect(showNotification).not.toHaveBeenCalled();
    });
});

describe('useUpdateFormMutation', () => {
    it('invalidates the affected caches and shows no success toast', async () => {
        const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');
        const { result } = renderHook(() => useUpdateFormMutation(), { wrapper });

        await act(async () => {
            await result.current.mutateAsync({ section_id: 1, page_id: 2, record_id: 3 } as never);
        });

        for (const queryKey of EXPECTED_INVALIDATIONS) {
            expect(invalidateSpy).toHaveBeenCalledWith({ queryKey });
        }
        expect(showNotification).not.toHaveBeenCalled();
    });
});
