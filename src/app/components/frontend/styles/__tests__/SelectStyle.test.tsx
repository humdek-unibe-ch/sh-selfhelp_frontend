/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
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
});
