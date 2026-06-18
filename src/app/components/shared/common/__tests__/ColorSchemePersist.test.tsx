/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { afterEach, describe, expect, it } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import { MantineProvider, type MantineColorScheme } from '@mantine/core';

import { ColorSchemePersist } from '../ColorSchemePersist';
import { cookieColorSchemeManager } from '../../../../../utils/cookie-color-scheme-manager';
import { COLOR_SCHEME_COOKIE } from '../../../../../config/cookie-names';

/**
 * Regression for the reported "nothing selected" color scheme issue: the cookie
 * was only written when the user *changed* the scheme, so a fresh visitor never
 * had it saved. `ColorSchemePersist` must initialise it on first visit without
 * overwriting an already-saved explicit choice.
 */
function clearAllCookies(): void {
    document.cookie.split(';').forEach((entry) => {
        const name = entry.split('=')[0]?.trim();
        if (name) document.cookie = `${name}=; path=/; max-age=0`;
    });
}

function renderPersist(defaultColorScheme: MantineColorScheme): void {
    render(
        <MantineProvider defaultColorScheme={defaultColorScheme} colorSchemeManager={cookieColorSchemeManager()}>
            <ColorSchemePersist />
        </MantineProvider>,
    );
}

describe('ColorSchemePersist', () => {
    afterEach(() => clearAllCookies());

    it('saves the scheme cookie on the first visit (none stored yet)', async () => {
        clearAllCookies();
        renderPersist('auto');
        await waitFor(() => {
            expect(document.cookie).toContain(`${COLOR_SCHEME_COOKIE}=auto`);
        });
    });

    it('does not overwrite an already-saved explicit choice', async () => {
        clearAllCookies();
        document.cookie = `${COLOR_SCHEME_COOKIE}=dark; path=/`;
        renderPersist('auto');
        await waitFor(() => expect(document.cookie).toContain(`${COLOR_SCHEME_COOKIE}=dark`));
        expect(document.cookie).not.toContain(`${COLOR_SCHEME_COOKIE}=auto`);
    });
});
