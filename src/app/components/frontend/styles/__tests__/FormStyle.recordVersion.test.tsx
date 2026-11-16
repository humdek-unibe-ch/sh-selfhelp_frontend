/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import type { ComponentProps } from 'react';
import { renderWithProviders } from '../../../../../test-utils/renderWithProviders';

/**
 * A record form on a page (`form-record`, `entry-record-form`) learns the version of its record
 * from the page: every prefilled row carries `_version`. The server refuses an update that names no
 * version and one that names an old version (409, nothing written), so the form sends the version
 * it was built with, keeps the person's input when the answer is a conflict, and never writes the
 * version back as a field.
 */
const { updateFormMock, submitFormMock } = vi.hoisted(() => ({ updateFormMock: vi.fn(), submitFormMock: vi.fn() }));

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
    FormSubmissionApi: { submitForm: submitFormMock, updateForm: updateFormMock },
}));

import FormStyle from '../FormStyle';

type TFormStyle = ComponentProps<typeof FormStyle>['style'];

function recordForm(rows: unknown[]): TFormStyle {
    return {
        id: 10,
        style_name: 'form-record',
        btn_save_label: { content: 'Save' },
        btn_update_label: { content: 'Update' },
        section_data: rows,
        children: [
            { id: 11, style_name: 'text-input', name: { content: 'name' }, label: { content: 'Name' } },
            { id: 12, style_name: 'file-input', name: { content: 'portrait' }, label: { content: 'Portrait' } },
        ],
    } as unknown as TFormStyle;
}

const OFFERED = [{ record_id: 12, id_languages: 1, _version: 4, name: 'Ada' }];

const submit = () => fireEvent.submit(document.querySelector('form') as HTMLFormElement);

function staleVersion() {
    return {
        response: {
            status: 409,
            data: { status: 409, data: { reason: 'stale_version', record_id: 12, expected_version: 4, current_version: 5 } },
        },
    };
}

beforeEach(() => {
    updateFormMock.mockReset().mockResolvedValue({ data: { record_id: 12, version: 5 } });
    submitFormMock.mockReset().mockResolvedValue({ data: { record_id: 12, version: 1 } });
});

describe('a record form on a page', () => {
    it('sends the version of the record its page offered, and never writes the version back as a field', async () => {
        const { container } = renderWithProviders(<FormStyle style={recordForm(OFFERED)} styleProps={{}} cssClass="" />);
        const name = container.querySelector('input[name="name"]') as HTMLInputElement;
        expect(name.value).toBe('Ada');

        fireEvent.change(name, { target: { value: 'Grace' } });
        submit();

        await waitFor(() => expect(updateFormMock).toHaveBeenCalledTimes(1));
        const sent = updateFormMock.mock.calls[0]?.[0] as Record<string, unknown>;
        expect(sent).toMatchObject({
            page_id: 1,
            section_id: 10,
            update_based_on: { record_id: 12 },
            expected_version: 4,
            form_data: { name: 'Grace' },
        });
        expect(Object.keys(sent.form_data as object)).not.toContain('_version');
        expect(sent).not.toHaveProperty('preview');
    });

    it('sends the version with a multipart save too', async () => {
        const { container } = renderWithProviders(<FormStyle style={recordForm(OFFERED)} styleProps={{}} cssClass="" />);
        const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
        fireEvent.change(fileInput, { target: { files: [new File(['x'], 'pic.png', { type: 'image/png' })] } });
        await screen.findAllByText('pic.png');

        submit();

        await waitFor(() => expect(updateFormMock).toHaveBeenCalledTimes(1));
        const sent = updateFormMock.mock.calls[0]?.[0] as FormData;
        expect(sent).toBeInstanceOf(FormData);
        expect(sent.get('expected_version')).toBe('4');
        expect(sent.get('update_based_on')).toBe(JSON.stringify({ record_id: 12 }));
        expect(sent.has('_version')).toBe(false);
    });

    it('bases a second save on the version the first one returned, before the page has been read again', async () => {
        const { container } = renderWithProviders(<FormStyle style={recordForm(OFFERED)} styleProps={{}} cssClass="" />);
        const name = container.querySelector('input[name="name"]') as HTMLInputElement;

        fireEvent.change(name, { target: { value: 'first' } });
        submit();
        await waitFor(() => expect(updateFormMock).toHaveBeenCalledTimes(1));
        await waitFor(() => expect(screen.getByRole('button', { name: 'Update' })).not.toBeDisabled());
        fireEvent.change(name, { target: { value: 'second' } });
        submit();
        await waitFor(() => expect(updateFormMock).toHaveBeenCalledTimes(2));

        expect((updateFormMock.mock.calls[0]?.[0] as { expected_version: number }).expected_version).toBe(4);
        expect((updateFormMock.mock.calls[1]?.[0] as { expected_version: number }).expected_version).toBe(5);
    });

    it('does not send an update when the page offered no version, and says why', async () => {
        renderWithProviders(<FormStyle style={recordForm([{ record_id: 12, id_languages: 1, name: 'Ada' }])} styleProps={{}} cssClass="" />);

        submit();

        expect(await screen.findByText(/did not say which version/)).toBeInTheDocument();
        expect(updateFormMock).not.toHaveBeenCalled();
    });

    it('keeps what was typed and explains the conflict when somebody else saved first', async () => {
        updateFormMock.mockRejectedValueOnce(staleVersion());
        const { container } = renderWithProviders(<FormStyle style={recordForm(OFFERED)} styleProps={{}} cssClass="" />);
        const name = container.querySelector('input[name="name"]') as HTMLInputElement;

        fireEvent.change(name, { target: { value: 'my change' } });
        submit();

        const alert = await screen.findByTestId('form-stale-conflict');
        expect(alert).toHaveTextContent(/changed this entry after you opened it/);
        expect(screen.getByRole('button', { name: 'Reload the page' })).toBeInTheDocument();
        expect((container.querySelector('input[name="name"]') as HTMLInputElement).value).toBe('my change');
        expect(screen.queryByText(/Failed to submit/)).not.toBeInTheDocument();
    });

    it('names every value that breaks the rules of the form', async () => {
        updateFormMock.mockRejectedValueOnce({
            response: {
                status: 422,
                data: {
                    status: 422,
                    data: {
                        reason: 'invalid_form_data',
                        errors: [
                            { field: 'name', key: 'section_11', rule: 'max_length', message: 'Name is too long.' },
                            { field: 'portrait', key: 'section_12', rule: 'file_type', message: 'Portrait must be an image.' },
                        ],
                    },
                },
            },
        });
        renderWithProviders(<FormStyle style={recordForm(OFFERED)} styleProps={{}} cssClass="" />);

        submit();

        expect(await screen.findByText('Name is too long. Portrait must be an image.')).toBeInTheDocument();
    });

    it('acts on the draft when the person looks at the draft', async () => {
        renderWithProviders(<FormStyle style={recordForm(OFFERED)} styleProps={{}} cssClass="" />, { previewMode: true });

        submit();

        await waitFor(() => expect(updateFormMock).toHaveBeenCalledTimes(1));
        expect(updateFormMock.mock.calls[0]?.[0]).toMatchObject({ expected_version: 4, preview: true });
    });

    it('creates a record without any version when the page has none yet', async () => {
        const { container } = renderWithProviders(<FormStyle style={recordForm([])} styleProps={{}} cssClass="" />);
        fireEvent.change(container.querySelector('input[name="name"]') as HTMLInputElement, { target: { value: 'New' } });

        submit();

        await waitFor(() => expect(submitFormMock).toHaveBeenCalledTimes(1));
        expect(submitFormMock.mock.calls[0]?.[0]).toMatchObject({ page_id: 1, section_id: 10, form_data: { name: 'New' } });
        expect(submitFormMock.mock.calls[0]?.[0]).not.toHaveProperty('expected_version');
        expect(updateFormMock).not.toHaveBeenCalled();
    });
});
