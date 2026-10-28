/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import type { ComponentProps } from 'react';
import { renderWithProviders } from '../../../../../test-utils/renderWithProviders';

/**
 * Regression: a form with a REQUIRED file-input could never be submitted. The
 * form's required check read `.value` of every `[required]` element, and
 * Mantine's FileInput renders a required `<button>` whose value is always "",
 * so it reported "Please fill in the following required fields: Field" even
 * after a file was picked.
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
    id: 10,
    style_name: 'form-log',
    btn_save_label: { content: 'Submit' },
    children: [
        {
            id: 11,
            style_name: 'file-input',
            name: { content: 'attachment' },
            label: { content: 'Datei' },
            is_required: { content: '1' },
        },
    ],
} as unknown as TFormStyle;

const submit = () => fireEvent.submit(document.querySelector('form') as HTMLFormElement);

describe('FormStyle with a required file input', () => {
    beforeEach(() => {
        submitFormMock.mockReset();
        submitFormMock.mockResolvedValue({ data: {} });
    });

    it('blocks submit and names the field by its label when no file is picked', async () => {
        renderWithProviders(<FormStyle style={formStyle} styleProps={{}} cssClass="" />);

        submit();

        expect(await screen.findByText(/required fields: Datei/)).toBeInTheDocument();
        expect(screen.queryByText(/required fields: Field/)).not.toBeInTheDocument();
        expect(submitFormMock).not.toHaveBeenCalled();
    });

    it('submits the picked file instead of reporting the field as missing', async () => {
        const { container } = renderWithProviders(<FormStyle style={formStyle} styleProps={{}} cssClass="" />);
        const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
        const file = new File(['<svg/>'], 'pic.svg', { type: 'image/svg+xml' });

        fireEvent.change(fileInput, { target: { files: [file] } });
        await screen.findByText('pic.svg');
        submit();

        await waitFor(() => expect(submitFormMock).toHaveBeenCalledTimes(1));
        expect(screen.queryByText(/required fields/)).not.toBeInTheDocument();
        const sent = submitFormMock.mock.calls[0][0] as FormData;
        expect(sent).toBeInstanceOf(FormData);
        expect((sent.getAll('attachment[]').concat(sent.getAll('attachment')) as File[]).map((f) => f.name)).toContain('pic.svg');
    });
});
