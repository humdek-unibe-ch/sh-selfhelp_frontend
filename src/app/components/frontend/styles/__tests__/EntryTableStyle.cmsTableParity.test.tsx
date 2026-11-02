/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { describe, it, expect, vi } from 'vitest';
import { fireEvent, screen, within } from '@testing-library/react';
import type { ComponentProps } from 'react';
import { renderWithProviders } from '../../../../../test-utils/renderWithProviders';

/**
 * entry-table must present the same chrome as the shared CMS list tables
 * (`src/app/components/cms/shared/admin-table`): a sort control that is a real
 * labelled button rather than a clickable `<th>`, and the shared footer summary
 * / pager instead of an ad-hoc one. The `web_table_*` fields keep customizing
 * the table itself and are not asserted here.
 */
vi.mock('../../../../hooks/usePageContentValue', () => ({
    usePageContentValue: () => ({ id: 1 }),
}));
vi.mock('../../../../hooks/useFormSubmission', () => ({
    useDeleteFormMutation: () => ({ mutate: vi.fn(), isPending: false }),
}));
vi.mock('next/navigation', () => ({
    useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
}));
vi.mock('../../../contexts/LanguageContext', () => ({
    useLanguageContext: () => ({
        currentLanguageId: 2,
        languages: [{ id: 2, locale: 'en-GB', language: 'English', csvSeparator: ',' }],
        setCurrentLanguageId: vi.fn(),
    }),
}));

import EntryTableStyle from '../EntryTableStyle';

type EntryTableStyleField = ComponentProps<typeof EntryTableStyle>['style'];

function makeStyle(overrides: Record<string, unknown> = {}): EntryTableStyleField {
    return { id: 1, style_name: 'entry-table', ...overrides } as unknown as EntryTableStyleField;
}

const rows = Array.from({ length: 12 }, (_, i) => ({
    record_id: i + 1,
    id_users: 5,
    section_230: `Person ${String(i + 1).padStart(2, '0')}`,
}));

const fieldLabels = { section_230: 'Full name' };

describe('EntryTableStyle matches the shared CMS table chrome', () => {
    it('exposes sorting as a labelled button and reflects direction with aria-sort', () => {
        renderWithProviders(
            <EntryTableStyle
                style={makeStyle({ entries: rows, field_labels: fieldLabels, dt_sortable: { content: '1' } })}
                styleProps={{}}
                cssClass=""
            />,
        );

        const header = screen.getByRole('columnheader', { name: /full name/i });
        expect(header).not.toHaveAttribute('aria-sort');

        const sortButton = within(header).getByRole('button', { name: 'Sort by Full name' });
        fireEvent.click(sortButton);
        expect(header).toHaveAttribute('aria-sort', 'ascending');

        fireEvent.click(sortButton);
        expect(header).toHaveAttribute('aria-sort', 'descending');
    });

    it('renders no sort button when the style is not sortable', () => {
        renderWithProviders(
            <EntryTableStyle
                style={makeStyle({ entries: rows, field_labels: fieldLabels })}
                styleProps={{}}
                cssClass=""
            />,
        );

        expect(screen.queryByRole('button', { name: /^sort by/i })).toBeNull();
    });

    it('uses the shared footer range summary and pager wording', () => {
        renderWithProviders(
            <EntryTableStyle
                style={makeStyle({
                    entries: rows,
                    field_labels: fieldLabels,
                    dt_info: { content: '1' },
                    dt_paginate: { content: '1' },
                })}
                styleProps={{}}
                cssClass=""
            />,
        );

        // AdminTableFooter phrasing: "Showing 1–10 of 12 entries" (split across
        // <Text span> nodes, so match on the container's text content).
        const footer = screen.getByText(/Showing/).closest('div');
        expect(footer?.textContent?.replace(/\s+/g, ' ')).toContain('Showing 1–10 of 12 entries');

        expect(screen.getByRole('button', { name: '2' })).toBeInTheDocument();
    });

    it('shows the plain total in the footer when pagination is off', () => {
        renderWithProviders(
            <EntryTableStyle
                style={makeStyle({ entries: rows, field_labels: fieldLabels, dt_info: { content: '1' } })}
                styleProps={{}}
                cssClass=""
            />,
        );

        const footer = screen.getByText(/Showing/).closest('div');
        expect(footer?.textContent?.replace(/\s+/g, ' ')).toContain('Showing 12 entries');
        expect(screen.queryByRole('button', { name: '2' })).toBeNull();
    });
});
