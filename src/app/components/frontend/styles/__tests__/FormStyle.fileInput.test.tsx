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
        await screen.findAllByText('pic.svg');
        submit();

        await waitFor(() => expect(submitFormMock).toHaveBeenCalledTimes(1));
        expect(screen.queryByText(/required fields/)).not.toBeInTheDocument();
        const sent = submitFormMock.mock.calls[0][0] as FormData;
        expect(sent).toBeInstanceOf(FormData);
        expect((sent.getAll('attachment[]').concat(sent.getAll('attachment')) as File[]).map((f) => f.name)).toContain('pic.svg');
    });
});

/**
 * Regression: a file input left empty was sent as `"portrait": {}` in the JSON body (an empty `File`
 * serializes to `{}`). The server accepts that shape only for field names that happen to contain
 * "file", so editing a record of a form with an optional file input named `portrait` failed with
 * "Field 'portrait' must contain a scalar value". An empty file input means "no file chosen": it sends
 * nothing, and the stored file stays as it is.
 */
describe('FormStyle with an optional file input left empty', () => {
    const optionalFileStyle = {
        id: 20,
        style_name: 'form-log',
        btn_save_label: { content: 'Submit' },
        children: [
            { id: 21, style_name: 'text-input', name: { content: 'name' }, label: { content: 'Name' } },
            { id: 22, style_name: 'file-input', name: { content: 'portrait' }, label: { content: 'Portrait' } },
        ],
    } as unknown as TFormStyle;

    beforeEach(() => {
        submitFormMock.mockReset();
        submitFormMock.mockResolvedValue({ data: {} });
    });

    it('sends the other fields and no value for the empty file input', async () => {
        const { container } = renderWithProviders(<FormStyle style={optionalFileStyle} styleProps={{}} cssClass="" />);
        const name = container.querySelector('input[name="name"]') as HTMLInputElement;

        fireEvent.change(name, { target: { value: 'Ada' } });
        submit();

        await waitFor(() => expect(submitFormMock).toHaveBeenCalledTimes(1));
        const sent = submitFormMock.mock.calls[0][0] as { form_data: Record<string, unknown> };
        expect(sent.form_data).toEqual({ name: 'Ada' });
    });
});

/**
 * A save the server refuses (a validation error, an expired session) leaves the form as the person
 * left it: the typed text and the picked file are still there, and the next try sends them again.
 */
describe('FormStyle when the server refuses the save', () => {
    const refusedStyle = {
        id: 30,
        style_name: 'form-log',
        btn_save_label: { content: 'Submit' },
        children: [
            { id: 31, style_name: 'text-input', name: { content: 'name' }, label: { content: 'Name' } },
            { id: 32, style_name: 'file-input', name: { content: 'portrait' }, label: { content: 'Portrait' } },
        ],
    } as unknown as TFormStyle;

    beforeEach(() => {
        submitFormMock.mockReset();
    });

    it('keeps what was typed and the picked file, and the next try sends them again', async () => {
        submitFormMock.mockRejectedValueOnce({ response: { data: { error: 'The name is not allowed.' } } });
        submitFormMock.mockResolvedValueOnce({ data: {} });
        const { container } = renderWithProviders(<FormStyle style={refusedStyle} styleProps={{}} cssClass="" />);
        const file = new File(['<svg/>'], 'pic.svg', { type: 'image/svg+xml' });

        fireEvent.change(container.querySelector('input[name="name"]') as HTMLInputElement, { target: { value: 'Ada' } });
        fireEvent.change(container.querySelector('input[type="file"]') as HTMLInputElement, { target: { files: [file] } });
        await screen.findAllByText('pic.svg');
        submit();

        expect(await screen.findByText('The name is not allowed.')).toBeInTheDocument();
        expect((container.querySelector('input[name="name"]') as HTMLInputElement).value).toBe('Ada');
        expect(screen.getAllByText('pic.svg').length).toBeGreaterThan(0);

        submit();

        await waitFor(() => expect(submitFormMock).toHaveBeenCalledTimes(2));
        const second = submitFormMock.mock.calls[1][0] as FormData;
        expect((second.getAll('portrait') as File[]).map((f) => f.name)).toEqual(['pic.svg']);
        expect(second.get('name')).toBe('Ada');
    });
});
