/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { describe, it, expect, vi } from 'vitest';
import { fireEvent, screen } from '@testing-library/react';
import { renderWithProviders } from '../../../../../../test-utils/renderWithProviders';
import LanguageTabsWrapper from '../LanguageTabsWrapper';

vi.mock('../../../../../../hooks/useLanguages', () => ({
    usePublicLanguages: () => ({
        languages: [
            { id: 1, locale: 'all', language: 'Independent', csvSeparator: ',' },
            { id: 2, locale: 'de-CH', language: 'German', csvSeparator: ';' },
            { id: 3, locale: 'en-GB', language: 'English', csvSeparator: ',' },
        ],
        isLoading: false,
    }),
}));

describe('LanguageTabsWrapper', () => {
    it('shows separate values per public language tab when seeded from language id 1', () => {
        const onChange = vi.fn();
        renderWithProviders(
            <LanguageTabsWrapper
                translatable
                name="bio"
                value="Shared seed"
                onChange={onChange}
            >
                {(_lang, currentValue, onValueChange) => (
                    <textarea
                        aria-label="bio-input"
                        value={currentValue}
                        onChange={(event) => onValueChange(event.target.value)}
                    />
                )}
            </LanguageTabsWrapper>,
        );

        const activeInput = () => screen.getByRole('textbox', { name: 'bio-input' });
        expect(activeInput()).toHaveValue('Shared seed');

        fireEvent.click(screen.getByRole('tab', { name: 'EN-GB' }));
        expect(activeInput()).toHaveValue('Shared seed');

        fireEvent.change(activeInput(), { target: { value: 'English bio' } });
        expect(onChange).toHaveBeenCalled();

        fireEvent.click(screen.getByRole('tab', { name: 'DE-CH' }));
        expect(activeInput()).toHaveValue('Shared seed');
    });

    it('merges explicit per-language values with the language-id-1 seed fallback', () => {
        renderWithProviders(
            <LanguageTabsWrapper
                translatable
                name="bio"
                value={[
                    { language_id: 1, value: 'Seed text' },
                    { language_id: 2, value: 'German bio' },
                ]}
                onChange={vi.fn()}
            >
                {(_lang, currentValue) => (
                    <div data-testid={`bio-${currentValue}`}>{currentValue}</div>
                )}
            </LanguageTabsWrapper>,
        );

        expect(screen.getByRole('tab', { name: 'DE-CH' })).toBeInTheDocument();
        expect(screen.getByTestId('bio-German bio')).toBeInTheDocument();
    });
});
