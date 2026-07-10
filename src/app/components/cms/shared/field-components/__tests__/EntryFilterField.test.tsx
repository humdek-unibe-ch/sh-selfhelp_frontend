/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '../../../../../../test-utils/renderWithProviders';
import { EntryFilterField } from '../EntryFilterField';
import { useSectionFormStore } from '../../../../../store/sectionFormStore';

describe('EntryFilterField', () => {
    it('prompts for a data table before the SQL builder can load columns', () => {
        useSectionFormStore.getState().reset();
        renderWithProviders(
            <EntryFilterField
                value=""
                onChange={() => undefined}
                dataVariables={{ 'route.record_id': 'Record id' }}
            />,
        );

        expect(screen.getByText(/select a data table first/i)).toBeInTheDocument();
    });

    it('renders the filter builder when a data table is selected', () => {
        useSectionFormStore.getState().setFormValues({
            sectionName: 'detail',
            properties: { data_table: '12' },
            fields: {},
            globalFields: {
                condition: '',
                data_config: '',
                css: '',
                css_mobile: '',
                debug: false,
            },
        });

        renderWithProviders(
            <EntryFilterField
                value="AND record_id = {{route.record_id}}"
                onChange={() => undefined}
            />,
        );

        expect(screen.queryByText(/select a data table first/i)).not.toBeInTheDocument();
    });
});
