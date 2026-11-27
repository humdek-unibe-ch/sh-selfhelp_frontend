/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/

import { fireEvent, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { renderWithProviders } from '../../../../../../test-utils/renderWithProviders';
import { FieldsMapField } from '../FieldsMapField';

vi.mock('../useResolvedDataTableName', () => ({
    useResolvedDataTableName: () => ({ tableName: 'qa_table', isLoading: false, needsDataTable: false }),
}));

vi.mock('../../../../../../hooks/useData', () => ({
    useTableColumns: () => ({
        data: { columns: [{ fieldKey: 'first_name' }, { fieldKey: 'last_name' }] },
        isLoading: false,
    }),
}));

/**
 * Header labels belong to a real language from the list. The editor never
 * invents the language-independent id: without a language only the columns
 * are mapped.
 */
describe('FieldsMapField header label language', () => {
    it('maps columns without a label editor when there is no language', () => {
        const onLabelChange = vi.fn();
        const onCatalogChange = vi.fn();
        renderWithProviders(
            <FieldsMapField
                catalogValue={JSON.stringify(['first_name'])}
                labelValues={{}}
                languages={[]}
                onCatalogChange={onCatalogChange}
                onLabelChange={onLabelChange}
            />,
        );

        expect(screen.queryByLabelText('Header label')).toBeNull();
        fireEvent.click(screen.getByRole('button', { name: 'Add column' }));

        expect(onCatalogChange).toHaveBeenCalledWith(JSON.stringify(['first_name', 'last_name']));
        expect(onLabelChange).not.toHaveBeenCalled();
    });

    it('edits the label of the first real language', () => {
        const onLabelChange = vi.fn();
        renderWithProviders(
            <FieldsMapField
                catalogValue={JSON.stringify(['first_name'])}
                labelValues={{ 2: JSON.stringify({ first_name: 'Vorname' }) }}
                languages={[
                    { id: 2, language: 'German', locale: 'de-CH' },
                    { id: 3, language: 'English', locale: 'en-GB' },
                ]}
                onCatalogChange={vi.fn()}
                onLabelChange={onLabelChange}
            />,
        );

        const input = screen.getByLabelText('Header label');
        expect(input).toHaveValue('Vorname');
        fireEvent.change(input, { target: { value: 'Name' } });

        expect(onLabelChange).toHaveBeenCalledWith(2, JSON.stringify({ first_name: 'Name' }));
    });
});
