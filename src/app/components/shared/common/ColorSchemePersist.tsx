/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
'use client';

import { useEffect } from 'react';
import { useMantineColorScheme } from '@mantine/core';
import { COLOR_SCHEME_COOKIE, LONG_LIVED_COOKIE_MAX_AGE } from '../../../../config/cookie-names';
import { writeBrowserCookie } from '../../../../utils/auth.utils';

/**
 * Persists the color-scheme choice on the FIRST visit so it is "initialised".
 *
 * Mantine's `ColorSchemeManager` only writes the `sh_color_scheme` cookie when
 * the user *changes* the scheme (`setColorScheme`). A brand-new visitor
 * therefore has no cookie, so the scheme is re-derived from scratch on every
 * load. This effect writes the current choice (the default `auto`, i.e.
 * "follow system") once on mount when the cookie is absent — so the preference
 * is explicit and saved from the first definition onward, without changing the
 * user's choice or breaking system-follow.
 *
 * The visual flash itself is fixed in `ColorSchemeInjector` (the pre-hydration
 * bootstrap now defaults to `auto`); this component only handles persistence.
 */
export function ColorSchemePersist(): null {
    const { colorScheme } = useMantineColorScheme();

    useEffect(() => {
        const hasCookie = document.cookie
            .split('; ')
            .some((entry) => entry.startsWith(`${COLOR_SCHEME_COOKIE}=`));
        if (!hasCookie) {
            writeBrowserCookie(COLOR_SCHEME_COOKIE, colorScheme, LONG_LIVED_COOKIE_MAX_AGE);
        }
    }, [colorScheme]);

    return null;
}
