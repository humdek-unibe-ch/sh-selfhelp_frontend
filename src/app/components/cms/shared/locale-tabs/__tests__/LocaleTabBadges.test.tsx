/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../../../../../test-utils/renderWithProviders';
import { LocaleTabBadges } from '../LocaleTabBadges';

/** A3: the field language switch is reachable and usable from the keyboard. */
describe('LocaleTabBadges', () => {
    const languages = [
        { id: 2, language: 'Deutsch', locale: 'DE', hasTranslation: true },
        { id: 3, language: 'English', locale: 'EN' },
    ];

    it('switches language with Tab and Enter, and says which language is translated', async () => {
        const onChange = vi.fn();
        renderWithProviders(<LocaleTabBadges languages={languages} activeLanguageId="2" onActiveLanguageChange={onChange} />);

        const german = screen.getByRole('button', { name: 'Edit Deutsch (DE), translated' });
        expect(german).toHaveAttribute('aria-pressed', 'true');

        await userEvent.tab();
        await userEvent.tab();
        expect(screen.getByRole('button', { name: 'Edit English (EN)' })).toHaveFocus();

        await userEvent.keyboard('{Enter}');
        expect(onChange).toHaveBeenCalledWith('3');
    });
});
