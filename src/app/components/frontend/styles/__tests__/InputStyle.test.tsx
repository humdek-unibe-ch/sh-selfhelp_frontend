/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import type { ComponentProps } from 'react';
import { renderWithProviders } from '../../../../../test-utils/renderWithProviders';

/**
 * InputStyle renders form inputs through LanguageTabsWrapper. For non-translatable
 * fields it renders the input directly. The public-languages hook is stubbed so
 * the test stays offline and deterministic (canonical Testing Rule 14).
 */
vi.mock('../../../../../hooks/useLanguages', () => ({
    usePublicLanguages: () => ({ languages: [], isLoading: false }),
}));

import InputStyle from '../InputStyle';

type InputStyleField = ComponentProps<typeof InputStyle>['style'];

const makeStyle = (overrides: Record<string, unknown>): InputStyleField =>
    ({ id: 1, style_name: 'input', ...overrides }) as unknown as InputStyleField;

describe('InputStyle', () => {
    it('renders an input with the configured type, name, placeholder and required flag', () => {
        renderWithProviders(
            <InputStyle
                style={makeStyle({
                    type_input: { content: 'email' },
                    name: { content: 'user_email' },
                    placeholder: { content: 'you@example.com' },
                    is_required: { content: '1' },
                })}
                cssClass="section-1"
            />,
        );
        const input = screen.getByPlaceholderText('you@example.com');
        expect(input).toHaveAttribute('type', 'email');
        expect(input).toHaveAttribute('name', 'user_email');
        expect(input).toBeRequired();
    });

    it('renders a checkbox input for the checkbox type', () => {
        renderWithProviders(
            <InputStyle
                style={makeStyle({ type_input: { content: 'checkbox' }, name: { content: 'agree' } })}
                cssClass="section-1"
            />,
        );
        expect(screen.getByRole('checkbox')).toBeInTheDocument();
    });
});
