/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import type { ComponentProps } from 'react';
import { renderWithProviders } from '../../../../../test-utils/renderWithProviders';

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
    alert_error: { content: 'Please check your answers and try again.' },
    children: [{ id: 31, style_name: 'text-input', name: { content: 'name' }, label: { content: 'Name' } }],
} as unknown as TFormStyle;

const submit = () => fireEvent.submit(document.querySelector('form') as HTMLFormElement);

describe('FormStyle public API error text', () => {
    beforeEach(() => {
        submitFormMock.mockReset();
    });

    it('shows the style alertError when the envelope has only an HTTP message', async () => {
        submitFormMock.mockRejectedValueOnce({
            response: { status: 400, data: { error: null, message: 'Bad Request' } },
        });

        const { container } = renderWithProviders(<FormStyle style={formStyle} styleProps={{}} cssClass="" />);
        fireEvent.change(container.querySelector('input[name="name"]') as HTMLInputElement, {
            target: { value: 'Ada' },
        });
        submit();

        await waitFor(() => {
            expect(screen.getByText('Please check your answers and try again.')).toBeInTheDocument();
        });
        expect(screen.queryByText('Bad Request')).not.toBeInTheDocument();
    });

    it('shows data.error when the envelope carries an intended error text', async () => {
        submitFormMock.mockRejectedValueOnce({
            response: { status: 400, data: { error: 'Field x is required', message: 'Bad Request' } },
        });

        const { container } = renderWithProviders(<FormStyle style={formStyle} styleProps={{}} cssClass="" />);
        fireEvent.change(container.querySelector('input[name="name"]') as HTMLInputElement, {
            target: { value: 'Ada' },
        });
        submit();

        await waitFor(() => {
            expect(screen.getByText('Field x is required')).toBeInTheDocument();
        });
        expect(screen.queryByText('Bad Request')).not.toBeInTheDocument();
    });
});
