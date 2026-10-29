/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { describe, expect, it, vi } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import { LanguageProvider, useLanguageContext } from '../LanguageContext';
import type { ILanguage } from '../../../../types/responses/admin/languages.types';

/**
 * M2: `<html lang>` was set only by the server, so a client-side language
 * switch left it on the previous language (screen readers, hyphenation).
 */
vi.mock('../../../../hooks/useUserData', () => ({
    useAuthUser: () => ({ user: null, isLoading: false }),
}));

const languages = [
    { id: 2, locale: 'de-CH', language: 'Deutsch (Schweiz)' },
    { id: 3, locale: 'en-GB', language: 'English (GB)' },
] as unknown as ILanguage[];

vi.mock('../../../../hooks/useLanguages', () => ({
    usePublicLanguages: () => ({ languages }),
}));

function Switcher() {
    const { setCurrentLanguageId } = useLanguageContext();
    return <button onClick={() => setCurrentLanguageId(3)}>English</button>;
}

describe('LanguageProvider html lang', () => {
    it('updates the html lang attribute when the language changes', () => {
        document.documentElement.lang = 'de';
        render(
            <LanguageProvider initialLanguageId={2} initialLanguages={languages}>
                <Switcher />
            </LanguageProvider>,
        );

        act(() => screen.getByRole('button', { name: 'English' }).click());

        expect(document.documentElement.lang).toBe('en');
    });
});
