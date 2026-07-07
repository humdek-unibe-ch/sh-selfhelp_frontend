/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import type { ComponentProps } from 'react';
import { renderWithProviders } from '../../../../../test-utils/renderWithProviders';

/**
 * Issue #56 v2 — entry-table (ex show-user-input) headers.
 *
 * Rows now arrive keyed by the immutable data-column `field_key`, and the style
 * receives a `field_labels` map (`field_key => display_name`). Headers must
 * default to the human `display_name` (so renaming a column relabels the header
 * automatically), while `fields_map` stays an explicit override that resolves to
 * a real column by `field_key` first and by `display_name` second.
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

import EntryTableStyle from '../EntryTableStyle';

type EntryTableStyleField = ComponentProps<typeof EntryTableStyle>['style'];

function makeStyle(overrides: Record<string, unknown> = {}): EntryTableStyleField {
    return { id: 1, style_name: 'entry-table', ...overrides } as unknown as EntryTableStyleField;
}

const rows = [
    { record_id: 1, id_users: 5, section_230: 'Ada', section_231: 'ada@example.test' },
];

describe('EntryTableStyle headers (issue #56 v2)', () => {
    it('labels headers with the column display_name from field_labels, not the field_key', () => {
        renderWithProviders(
            <EntryTableStyle
                style={makeStyle({
                    entries: rows,
                    field_labels: { section_230: 'Full name', section_231: 'Email' },
                })}
                styleProps={{}}
                cssClass=""
            />,
        );

        expect(screen.getByText('Full name')).toBeInTheDocument();
        expect(screen.getByText('Email')).toBeInTheDocument();
        expect(screen.queryByText('section_230')).not.toBeInTheDocument();
        expect(screen.getByText('Ada')).toBeInTheDocument();
    });

    it('lets fields_map override a header, matched by the stable field_key', () => {
        renderWithProviders(
            <EntryTableStyle
                style={makeStyle({
                    entries: rows,
                    field_labels: { section_230: 'Full name', section_231: 'Email' },
                    fields_map: { content: JSON.stringify([{ field_name: 'section_230', field_new_name: 'Name' }]) },
                })}
                styleProps={{}}
                cssClass=""
            />,
        );

        expect(screen.getByText('Name')).toBeInTheDocument();
        // fields_map selects columns, so the unmapped Email column is hidden.
        expect(screen.queryByText('Email')).not.toBeInTheDocument();
        expect(screen.getByText('Ada')).toBeInTheDocument();
    });

    it('still resolves a fields_map entry written against the display_name after a rename', () => {
        renderWithProviders(
            <EntryTableStyle
                style={makeStyle({
                    entries: rows,
                    field_labels: { section_230: 'Full name' },
                    fields_map: { content: JSON.stringify([{ field_name: 'Full name', field_new_name: 'Name' }]) },
                })}
                styleProps={{}}
                cssClass=""
            />,
        );

        expect(screen.getByText('Name')).toBeInTheDocument();
        expect(screen.getByText('Ada')).toBeInTheDocument();
    });
});
