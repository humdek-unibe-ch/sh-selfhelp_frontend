/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { describe, it, expect } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ComponentProps } from 'react';
import { renderWithProviders } from '../../../../../test-utils/renderWithProviders';
import SelectStyle from '../SelectStyle';

/**
 * SelectStyle renders a Mantine Select (single) or MultiSelect (is_multiple),
 * parsing its options from a JSON string. These tests pin the placeholder for
 * both modes; malformed/empty options must not throw.
 */
type SelectStyleField = ComponentProps<typeof SelectStyle>['style'];

const makeStyle = (overrides: Record<string, unknown>): SelectStyleField =>
    ({ id: 1, style_name: 'select', ...overrides }) as unknown as SelectStyleField;

describe('SelectStyle', () => {
    it('renders a single select with the configured placeholder', () => {
        renderWithProviders(
            <SelectStyle
                style={makeStyle({
                    placeholder: { content: 'Choose a fruit' },
                    options: { content: JSON.stringify([{ value: 'a', label: 'Apple' }]) },
                })}
                cssClass="section-1"
            />,
        );
        expect(screen.getByPlaceholderText('Choose a fruit')).toBeInTheDocument();
    });

    it('uses translatable option_labels and emits hidden form field', () => {
        renderWithProviders(
            <SelectStyle
                style={makeStyle({
                    name: { content: 'category' },
                    value: { content: 'release' },
                    placeholder: { content: 'Choose category' },
                    options: { content: JSON.stringify([{ value: 'release' }]) },
                    option_labels: { content: JSON.stringify({ release: 'Freigabe' }) },
                })}
                cssClass="section-1"
            />,
        );
        expect(screen.getByText('Freigabe')).toBeInTheDocument();
        const hidden = document.querySelector('input[name="category"]');
        expect(hidden).not.toBeNull();
        expect((hidden as HTMLInputElement).value).toBe('release');
    });

    it('renders a multi-select with the configured placeholder', () => {
        renderWithProviders(
            <SelectStyle
                style={makeStyle({
                    is_multiple: { content: '1' },
                    placeholder: { content: 'Choose many' },
                    options: { content: '[]' },
                })}
                cssClass="section-1"
            />,
        );
        expect(screen.getByPlaceholderText('Choose many')).toBeInTheDocument();
    });

    it('keeps a non-clearable default in the hidden field (F173)', () => {
        renderWithProviders(
            <SelectStyle
                style={makeStyle({
                    name: { content: 'status' },
                    label: { content: 'Status' },
                    value: { content: 'draft' },
                    clearable: { content: '0' },
                    options: {
                        content: JSON.stringify([
                            { value: 'draft', sort: 1 },
                            { value: 'published', sort: 2 },
                        ]),
                    },
                    option_labels: {
                        content: JSON.stringify({ draft: 'Draft', published: 'Published' }),
                    },
                })}
                cssClass="section-1"
            />,
        );

        const hidden = document.querySelector('input[name="status"]') as HTMLInputElement;
        expect(hidden.value).toBe('draft');
        // clearable=0 also sets allowDeselect=false on the Mantine Select so
        // re-choosing Draft cannot empty the hidden value while the label stays.
        expect(screen.queryByRole('button', { name: /clear/i })).not.toBeInTheDocument();
    });

    it('re-clicking the already selected Draft option keeps status=draft (F173)', async () => {
        // Fails before the fix when allowDeselect stays at Mantine's default
        // (true): clicking Draft again clears the value while the label still
        // reads "Draft", so the multipart body posts an empty status.
        const user = userEvent.setup();
        renderWithProviders(
            <SelectStyle
                style={makeStyle({
                    name: { content: 'status' },
                    label: { content: 'Status' },
                    value: { content: 'draft' },
                    clearable: { content: '0' },
                    searchable: { content: '0' },
                    options: {
                        content: JSON.stringify([
                            { value: 'draft', sort: 1 },
                            { value: 'published', sort: 2 },
                        ]),
                    },
                    option_labels: {
                        content: JSON.stringify({ draft: 'Draft', published: 'Published' }),
                    },
                })}
                cssClass="section-1"
            />,
        );

        const hidden = document.querySelector('input[name="status"]') as HTMLInputElement;
        expect(hidden.value).toBe('draft');

        // Mantine schedules scrollIntoView on the option list; jsdom has none.
        Element.prototype.scrollIntoView = () => {};

        await user.click(screen.getByRole('combobox', { name: 'Status' }));
        // Mantine portals options; wait for the Draft option node then re-click it
        // (the bug path: allowDeselect clears the already-selected value).
        await waitFor(() => {
            expect(
                Array.from(document.querySelectorAll('[role="option"]')).some((el) =>
                    (el.textContent ?? '').includes('Draft'),
                ),
            ).toBe(true);
        });
        const draftOption = Array.from(document.querySelectorAll('[role="option"]')).find((el) =>
            (el.textContent ?? '').includes('Draft'),
        ) as HTMLElement;
        await user.click(draftOption);

        expect(hidden.value).toBe('draft');
    });

    it('maps an empty string value to null so Mantine shows the placeholder', () => {
        // value={selectedValue || null}: Mantine treats "" as a selected empty
        // option; null shows the placeholder instead.
        renderWithProviders(
            <SelectStyle
                style={makeStyle({
                    name: { content: 'category' },
                    placeholder: { content: 'Choose category' },
                    value: { content: '' },
                    options: {
                        content: JSON.stringify([{ value: 'a', label: 'Apple' }]),
                    },
                })}
                cssClass="section-1"
            />,
        );
        expect(screen.getByPlaceholderText('Choose category')).toBeInTheDocument();
        const hidden = document.querySelector('input[name="category"]') as HTMLInputElement;
        expect(hidden.value).toBe('');
    });
});
