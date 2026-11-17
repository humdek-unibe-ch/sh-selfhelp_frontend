/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act, fireEvent, waitFor } from '@testing-library/react';
import type { ComponentProps } from 'react';
import { renderWithProviders } from '../../../../../test-utils/renderWithProviders';

/**
 * A save that is on its way is one interaction: a double click, or Enter held down on a
 * field, must not write the record twice. The form decides this itself, at once, because
 * the `isSubmitting` state only shows up in the next render.
 */
const { submitFormMock } = vi.hoisted(() => ({ submitFormMock: vi.fn() }));

vi.mock('next/navigation', () => ({
    useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn(), prefetch: vi.fn() }),
}));
vi.mock('@mantine/notifications', () => ({
    notifications: { show: vi.fn() },
}));
vi.mock('../../../../../hooks/usePageContentValue', () => ({
    usePageContentValue: () => ({ id: 1 }),
}));
vi.mock('../../../../../api/frontend/form-submission.api', () => ({
    FormSubmissionApi: { submitForm: submitFormMock, updateForm: vi.fn() },
}));

import FormStyle from '../FormStyle';

type TFormStyle = ComponentProps<typeof FormStyle>['style'];

const formStyle = {
    id: 30,
    style_name: 'form-log',
    btn_save_label: { content: 'Submit' },
    children: [{ id: 31, style_name: 'text-input', name: { content: 'name' }, label: { content: 'Name' } }],
} as unknown as TFormStyle;

const submit = () => fireEvent.submit(document.querySelector('form') as HTMLFormElement);

describe('FormStyle while a save is on its way', () => {
    beforeEach(() => {
        submitFormMock.mockReset();
    });

    it('sends one request for a double click and is free again when the answer is in', async () => {
        let answer: (value: unknown) => void = () => undefined;
        submitFormMock.mockReturnValueOnce(new Promise((resolve) => { answer = resolve; }));
        submitFormMock.mockResolvedValue({ data: {} });

        const { container } = renderWithProviders(<FormStyle style={formStyle} styleProps={{}} cssClass="" />);
        const name = () => container.querySelector('input[name="name"]') as HTMLInputElement;

        fireEvent.change(name(), { target: { value: 'Ada' } });
        submit();
        submit();
        submit();

        await waitFor(() => expect(submitFormMock).toHaveBeenCalledTimes(1));
        expect(submitFormMock).toHaveBeenCalledTimes(1);

        await act(async () => {
            answer({ data: {} });
        });

        // The answer is in: the next, deliberate save goes through.
        fireEvent.change(name(), { target: { value: 'Grace' } });
        submit();
        await waitFor(() => expect(submitFormMock).toHaveBeenCalledTimes(2));
    });
});
