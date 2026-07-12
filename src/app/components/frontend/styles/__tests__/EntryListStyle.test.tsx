/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import type { ComponentProps } from 'react';
import { renderWithProviders } from '../../../../../test-utils/renderWithProviders';
import EntryListStyle from '../EntryListStyle';

type TEntryListStyle = ComponentProps<typeof EntryListStyle>['style'];

const makeStyle = (overrides: Record<string, unknown>): TEntryListStyle =>
    ({ id: 1, style_name: 'entry-list', children: [], ...overrides }) as unknown as TEntryListStyle;

describe('EntryListStyle', () => {
    it('renders hydrated children in a div by default', () => {
        renderWithProviders(
            <EntryListStyle
                style={makeStyle({
                    children: [
                        { id: 2, style_name: 'text', text: { content: 'Row A' } },
                        { id: 3, style_name: 'text', text: { content: 'Row B' } },
                    ],
                })}
                cssClass="entry-list-root"
            />,
        );

        expect(screen.getByText('Row A')).toBeInTheDocument();
        expect(screen.getByText('Row B')).toBeInTheDocument();
        expect(document.querySelector('.entry-list-root table')).toBeNull();
    });

    it('wraps hydrated children in a table when load_as_table is enabled', () => {
        renderWithProviders(
            <EntryListStyle
                style={makeStyle({
                    load_as_table: { content: '1' },
                    children: [
                        { id: 2, style_name: 'text', text: { content: 'Tabular row' } },
                    ],
                })}
                cssClass="entry-list-table"
            />,
        );

        const table = document.querySelector('.entry-list-table table');
        expect(table).not.toBeNull();
        expect(table?.querySelector('tbody tr td')).not.toBeNull();
        expect(screen.getByText('Tabular row')).toBeInTheDocument();
    });
});
