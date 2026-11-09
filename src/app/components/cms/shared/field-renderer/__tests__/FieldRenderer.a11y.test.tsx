/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '../../../../../../test-utils/renderWithProviders';
import { FieldRenderer } from '../FieldRenderer';

vi.mock('../../../../../../hooks/useLanguages', () => ({
    usePublicLanguages: () => ({ languages: [{ id: 2, language: 'Deutsch' }], isLoading: false }),
}));
vi.mock('../../../../../../hooks/useLookups', () => ({
    useLookupsByType: () => [],
}));

const field = (type: string) => ({
    id: 1,
    name: `qa_${type}`,
    title: `QA ${type} field`,
    type,
    default_value: null,
    help: null,
    translations: [{ language_id: 1, content: '' }],
});

/**
 * A2: the label FieldRenderer shows above a field names the field's control,
 * so screen readers no longer announce an unnamed text box or select.
 */
describe('FieldRenderer accessible names', () => {
    it.each([
        ['text', 'textbox'],
        ['textarea', 'textbox'],
        ['number', 'spinbutton'],
        ['select-language', 'combobox'],
        ['select-icon', 'combobox'],
        ['unknown-type', 'textbox'],
    ])('names a %s field by its label', (type, role) => {
        renderWithProviders(<FieldRenderer field={field(type)} languageId={1} onChange={() => {}} />);

        expect(screen.getByRole(role, { name: `QA ${type} field` })).toBeInTheDocument();
    });

    it('names the creatable select trigger and makes it keyboard reachable', () => {
        renderWithProviders(<FieldRenderer field={field('select-modal-size')} languageId={1} onChange={() => {}} />);

        const trigger = screen.getByRole('combobox', { name: 'QA select-modal-size field' });
        expect(trigger).toHaveAttribute('tabindex', '0');
    });
});
