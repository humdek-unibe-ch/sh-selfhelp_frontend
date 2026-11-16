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
import { PreviewModeProvider } from '../../app/components/contexts/PreviewModeContext';

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
const { submitForm, updateForm, deleteForm, showNotification } = vi.hoisted(() => ({
    submitForm: vi.fn(),
    updateForm: vi.fn(),
    deleteForm: vi.fn(),
    showNotification: vi.fn(),
}));

vi.mock('../../api/frontend/form-submission.api', () => ({
    FormSubmissionApi: { submitForm, updateForm, deleteForm },
}));
vi.mock('@mantine/notifications', () => ({
    notifications: { show: showNotification },
}));

import { useDeleteFormMutation, useSubmitFormMutation, useUpdateFormMutation } from '../useFormSubmission';

let queryClient: QueryClient;
let previewMode = false;

function wrapper({ children }: { children: ReactNode }) {
    return (
        <QueryClientProvider client={queryClient}>
            <PreviewModeProvider initialPreviewMode={previewMode}>{children}</PreviewModeProvider>
        </QueryClientProvider>
    );
}

/** What the server answers when a value breaks the rules of the form (422 `invalid_form_data`). */
function invalidDataError() {
    return {
        response: {
            status: 422,
            data: {
                status: 422,
                data: {
                    reason: 'invalid_form_data',
                    errors: [{ field: 'email', key: 'section_7', rule: 'format', message: 'Enter a valid email address.' }],
                },
            },
        },
    };
}

/** What the server answers when the record changed since the page was read (409 `stale_version`). */
function staleVersionError() {
    return {
        response: {
            status: 409,
            data: {
                status: 409,
                data: { reason: 'stale_version', record_id: 3, expected_version: 1, current_version: 2 },
            },
        },
    };
}

const EXPECTED_INVALIDATIONS = [
    REACT_QUERY_CONFIG.QUERY_KEYS.PAGE_BY_KEYWORD_ALL,
    ['userInputEntries'],
    REACT_QUERY_CONFIG.QUERY_KEYS.USER_DATA,
];

beforeEach(() => {
    queryClient = createTestQueryClient();
    previewMode = false;
    submitForm.mockReset().mockResolvedValue({ data: null });
    updateForm.mockReset().mockResolvedValue({ data: null });
    deleteForm.mockReset().mockResolvedValue({ data: { record_id: 3, version: 4 } });
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

describe('the page version a write acts on', () => {
    it('names no preview when the person looks at the published page', async () => {
        const { result } = renderHook(() => useUpdateFormMutation(), { wrapper });

        await act(async () => {
            await result.current.mutateAsync({ section_id: 1, page_id: 2, form_data: { a: 'b' }, update_based_on: { record_id: 3 }, expected_version: 2 });
        });

        expect(updateForm).toHaveBeenCalledWith({ section_id: 1, page_id: 2, form_data: { a: 'b' }, update_based_on: { record_id: 3 }, expected_version: 2 });
    });

    it('names the draft in a JSON save, a multipart save, a submit and a delete when the person looks at the draft', async () => {
        previewMode = true;
        const update = renderHook(() => useUpdateFormMutation(), { wrapper });
        const submit = renderHook(() => useSubmitFormMutation(), { wrapper });
        const remove = renderHook(() => useDeleteFormMutation(), { wrapper });

        await act(async () => {
            await update.result.current.mutateAsync({ section_id: 1, page_id: 2, form_data: {}, update_based_on: { record_id: 3 }, expected_version: 2 });
            const multipart = new FormData();
            multipart.append('page_id', '2');
            multipart.append('qa_file', new File(['x'], 'a.txt'));
            await update.result.current.mutateAsync(multipart);
            await submit.result.current.mutateAsync({ section_id: 1, page_id: 2, form_data: { a: 'b' } });
            await remove.result.current.mutateAsync({ record_id: 3, page_id: 2, section_id: 1, expected_version: 4 });
        });

        expect(updateForm.mock.calls[0]?.[0]).toMatchObject({ expected_version: 2, preview: true });
        const sent = updateForm.mock.calls[1]?.[0] as FormData;
        expect(sent).toBeInstanceOf(FormData);
        expect(sent.get('preview')).toBe('1');
        expect(sent.get('page_id')).toBe('2');
        expect((sent.get('qa_file') as File).name).toBe('a.txt');
        expect(submitForm.mock.calls[0]?.[0]).toMatchObject({ form_data: { a: 'b' }, preview: true });
        expect(deleteForm).toHaveBeenCalledWith({ record_id: 3, page_id: 2, section_id: 1, expected_version: 4, preview: true });
    });

    it('does not change the form data the caller keeps', async () => {
        previewMode = true;
        const { result } = renderHook(() => useUpdateFormMutation(), { wrapper });
        const multipart = new FormData();
        multipart.append('page_id', '2');

        await act(async () => {
            await result.current.mutateAsync(multipart);
        });

        expect(multipart.has('preview')).toBe(false);
    });
});

describe('what a refused write tells the person', () => {
    it('says which values break the rules of the form', async () => {
        submitForm.mockRejectedValueOnce(invalidDataError());
        const { result } = renderHook(() => useSubmitFormMutation(), { wrapper });

        await act(async () => {
            await result.current.mutateAsync({ section_id: 1, page_id: 2, form_data: { email: 'x' } }).catch(() => undefined);
        });

        expect(showNotification).toHaveBeenCalledWith(expect.objectContaining({ title: 'Check your input', message: 'Enter a valid email address.' }));
    });

    it('keeps the record and reads the page again when a delete was based on an old version', async () => {
        deleteForm.mockRejectedValueOnce(staleVersionError());
        const invalidate = vi.spyOn(queryClient, 'invalidateQueries');
        const { result } = renderHook(() => useDeleteFormMutation(), { wrapper });

        await act(async () => {
            await result.current.mutateAsync({ record_id: 3, page_id: 2, section_id: 1, expected_version: 1 }).catch(() => undefined);
        });

        expect(invalidate).toHaveBeenCalledWith({ queryKey: REACT_QUERY_CONFIG.QUERY_KEYS.PAGE_BY_KEYWORD_ALL });
        expect(showNotification).toHaveBeenCalledWith(expect.objectContaining({ title: 'Record changed', color: 'yellow' }));
        expect(showNotification).not.toHaveBeenCalledWith(expect.objectContaining({ title: 'Deletion Failed' }));
    });

    it('still reports any other failed delete as failed', async () => {
        deleteForm.mockRejectedValueOnce({ response: { status: 500, data: {} } });
        const { result } = renderHook(() => useDeleteFormMutation(), { wrapper });

        await act(async () => {
            await result.current.mutateAsync({ record_id: 3, page_id: 2, section_id: 1, expected_version: 1 }).catch(() => undefined);
        });

        expect(showNotification).toHaveBeenCalledWith(expect.objectContaining({ title: 'Deletion Failed', color: 'red' }));
    });
});
