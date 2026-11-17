/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
/**
 * F173: news CMS Add/Edit with a file was storing an empty `status` even when
 * the select showed Draft, so Publish never appeared. The create/update must
 * send the select's value together with the file(s).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ComponentProps } from 'react';
import { renderWithProviders } from '../../../../../test-utils/renderWithProviders';

const { submitFormMock, updateFormMock } = vi.hoisted(() => ({
    submitFormMock: vi.fn(),
    updateFormMock: vi.fn(),
}));

vi.mock('next/navigation', () => ({
    useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn(), prefetch: vi.fn() }),
}));
vi.mock('@mantine/notifications', () => ({
    notifications: { show: vi.fn() },
}));
vi.mock('../../../../../hooks/usePageContentValue', () => ({
    usePageContentValue: () => ({ id: 42 }),
}));
vi.mock('../../../../../api/frontend/form-submission.api', () => ({
    FormSubmissionApi: { submitForm: submitFormMock, updateForm: updateFormMock },
}));

import FormStyle from '../FormStyle';
import { FormListFormProvider, type IFormListFormContext } from '../form-list/FormListFormContext';

type TFormStyle = ComponentProps<typeof FormStyle>['style'];

/** Shape of the news CMS form: selects around single + multiple file inputs, then status. */
const newsLikeForm = {
    id: 100,
    style_name: 'form-record',
    btn_save_label: { content: 'Save' },
    children: [
        {
            id: 101,
            style_name: 'text-input',
            name: { content: 'title' },
            label: { content: 'Title' },
        },
        {
            id: 102,
            style_name: 'select',
            name: { content: 'category' },
            label: { content: 'Category' },
            options: { content: '[{"value":"Release","sort":1},{"value":"Notice","sort":2}]' },
            option_labels: { content: '{"Release":"Release","Notice":"Notice"}' },
            value: { content: 'Release' },
        },
        {
            id: 103,
            style_name: 'file-input',
            name: { content: 'image' },
            label: { content: 'Image' },
            web_file_input_max_files: { content: '1' },
        },
        {
            id: 104,
            style_name: 'file-input',
            name: { content: 'attachments' },
            label: { content: 'Downloads' },
            web_file_input_multiple: { content: '1' },
            web_file_input_max_files: { content: '10' },
        },
        {
            id: 105,
            style_name: 'select',
            name: { content: 'status' },
            label: { content: 'Status' },
            options: { content: '[{"value":"draft","sort":1},{"value":"published","sort":2}]' },
            option_labels: { content: '{"draft":"Draft","published":"Published"}' },
            value: { content: 'draft' },
        },
    ],
} as unknown as TFormStyle;

const png = new File(
    [Uint8Array.from(atob('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='), (c) => c.charCodeAt(0))],
    'cover.png',
    { type: 'image/png' },
);
const pdf = new File([new Uint8Array([37, 80, 68, 70])], 'note.pdf', { type: 'application/pdf' });

function statusFromSent(sent: FormData | { form_data?: Record<string, unknown> }): string | null {
    if (sent instanceof FormData) {
        const all = sent.getAll('status').map(String);
        return all.length ? all[all.length - 1]! : null;
    }
    const value = sent.form_data?.status;
    return value == null ? null : String(value);
}

describe('FormStyle status with file inputs (F173)', () => {
    beforeEach(() => {
        submitFormMock.mockReset().mockResolvedValue({ data: { record_id: 1, version: 1 } });
        updateFormMock.mockReset().mockResolvedValue({ data: { record_id: 1, version: 2 } });
    });

    it('create: sends status=draft together with a single image and multiple attachments', async () => {
        const user = userEvent.setup();
        const { container } = renderWithProviders(<FormStyle style={newsLikeForm} styleProps={{}} cssClass="" />);

        const title = container.querySelector('input:not([type="hidden"]):not([type="file"])') as HTMLInputElement;
        fireEvent.change(title, { target: { value: 'Hello' } });

        const fileInputs = container.querySelectorAll('input[type="file"]');
        expect(fileInputs.length).toBeGreaterThanOrEqual(2);
        await user.upload(fileInputs[0] as HTMLInputElement, png);
        await user.upload(fileInputs[1] as HTMLInputElement, pdf);
        await screen.findAllByText('cover.png');

        const hiddenStatuses = Array.from(
            container.querySelectorAll('input[type="hidden"][name="status"]'),
        ) as HTMLInputElement[];
        expect(hiddenStatuses.map((el) => el.value), 'hidden status before submit').toEqual(['draft']);

        // Dump every named control so a failure shows what FormData would see.
        const named = Array.from(container.querySelectorAll('input[name], select[name], textarea[name]')).map(
            (el) => {
                const input = el as HTMLInputElement;
                return { name: input.name, type: input.type, value: input.value?.slice(0, 40) };
            },
        );

        fireEvent.submit(container.querySelector('form') as HTMLFormElement);

        await waitFor(() => expect(submitFormMock).toHaveBeenCalledTimes(1));
        const sent = submitFormMock.mock.calls[0]![0] as FormData;
        expect(sent).toBeInstanceOf(FormData);
        expect(statusFromSent(sent), `status missing; named controls=${JSON.stringify(named)}; keys=${[...sent.keys()].join(',')}`).toBe(
            'draft',
        );
        expect((sent.getAll('image') as File[]).map((f) => f.name)).toContain('cover.png');
        expect(
            (sent.getAll('attachments').concat(sent.getAll('attachments[]')) as File[]).map((f) => f.name),
        ).toContain('note.pdf');
    });

    it('update: sends status together with a replacement image', async () => {
        const user = userEvent.setup();
        const listForm: IFormListFormContext = {
            recordId: 7,
            prefill: { title: 'Hello', status: 'draft' },
            expectedVersion: 3,
            onSaved: vi.fn(),
            onStale: vi.fn(),
            onCancel: vi.fn(),
            registerDirtyCheck: vi.fn(),
        };
        const { container } = renderWithProviders(
            <FormListFormProvider value={listForm}>
                <FormStyle style={newsLikeForm} styleProps={{}} cssClass="" />
            </FormListFormProvider>,
        );

        const fileInputs = container.querySelectorAll('input[type="file"]');
        await user.upload(fileInputs[0] as HTMLInputElement, png);
        await screen.findAllByText('cover.png');

        const hiddenStatuses = Array.from(
            container.querySelectorAll('input[type="hidden"][name="status"]'),
        ) as HTMLInputElement[];
        expect(hiddenStatuses.map((el) => el.value)).toEqual(['draft']);

        fireEvent.submit(container.querySelector('form') as HTMLFormElement);

        await waitFor(() => expect(updateFormMock).toHaveBeenCalledTimes(1));
        const sent = updateFormMock.mock.calls[0]![0] as FormData;
        expect(sent).toBeInstanceOf(FormData);
        expect(statusFromSent(sent)).toBe('draft');
        expect((sent.getAll('image') as File[]).map((f) => f.name)).toContain('cover.png');
        expect(JSON.parse(String(sent.get('update_based_on')))).toEqual({ record_id: 7 });
        expect(String(sent.get('expected_version'))).toBe('3');
    });
});
