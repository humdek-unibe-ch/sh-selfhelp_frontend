/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { describe, it, expect, vi } from 'vitest';
import type { ComponentProps } from 'react';
import { renderWithProviders } from '../../../../../test-utils/renderWithProviders';
import { typeLikeAPerson } from '../../../../../test-utils/trusted-input';

/**
 * Live sync swaps a page's content when the server pushes a change, and keeps what the person
 * typed (decision "Swap, keep typed input", P4-A7). A record form on that page gets the newer
 * stored values: the fields the person did not touch follow them, the field they typed into
 * keeps their text.
 */
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
    FormSubmissionApi: { submitForm: vi.fn(), updateForm: vi.fn() },
}));

import FormStyle from '../FormStyle';

type TFormStyle = ComponentProps<typeof FormStyle>['style'];

function recordForm(row: Record<string, unknown>): TFormStyle {
    return {
        id: 10,
        style_name: 'form-record',
        btn_save_label: { content: 'Save' },
        btn_update_label: { content: 'Update' },
        section_data: [{ record_id: 12, id_languages: 1, _version: 4, ...row }],
        children: [
            { id: 11, style_name: 'text-input', name: { content: 'name' }, label: { content: 'Name' } },
            { id: 12, style_name: 'text-input', name: { content: 'city' }, label: { content: 'City' } },
        ],
    } as unknown as TFormStyle;
}

const field = (container: HTMLElement, name: string) =>
    container.querySelector(`input[name="${name}"]`) as HTMLInputElement;

describe('a record form when the page refetches after a pushed change (P4-A7)', () => {
    it('keeps the text typed into a field and follows the new value of a field left alone', () => {
        const { container, rerender } = renderWithProviders(
            <FormStyle style={recordForm({ name: 'Ada', city: 'Bern' })} styleProps={{}} cssClass="" />,
        );
        expect(field(container, 'name').value).toBe('Ada');

        typeLikeAPerson(field(container, 'name'), 'Grace');
        expect(field(container, 'name').value).toBe('Grace');

        // The refetch brings a newer stored row for the same section.
        rerender(<FormStyle style={recordForm({ name: 'Ada L.', city: 'Zurich' })} styleProps={{}} cssClass="" />);

        expect(field(container, 'name').value).toBe('Grace');
        expect(field(container, 'city').value).toBe('Zurich');
    });

    it('a field nobody typed into follows the stored value, also when the refetch repeats it', () => {
        const { container, rerender } = renderWithProviders(
            <FormStyle style={recordForm({ name: 'Ada', city: 'Bern' })} styleProps={{}} cssClass="" />,
        );

        rerender(<FormStyle style={recordForm({ name: 'Ada', city: 'Bern' })} styleProps={{}} cssClass="" />);
        expect(field(container, 'name').value).toBe('Ada');
        expect(field(container, 'city').value).toBe('Bern');

        rerender(<FormStyle style={recordForm({ name: 'Ada L.', city: 'Bern' })} styleProps={{}} cssClass="" />);
        expect(field(container, 'name').value).toBe('Ada L.');
    });
});
