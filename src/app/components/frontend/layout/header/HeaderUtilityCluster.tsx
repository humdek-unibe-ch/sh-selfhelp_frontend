/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
'use client';

import { Group } from '@mantine/core';
import { AuthButton } from '../../../shared/auth/AuthButton';
import { LanguageSelector } from '../../../shared/common/LanguageSelector';
import { ThemeToggle } from '../../../shared/common/ThemeToggle';
import type { IPageItem, INavigationPayload } from '../../../../../shared';
import { HeaderSearch } from './HeaderSearch';

interface IHeaderUtilityClusterProps {
    initialProfilePages?: IPageItem[];
    initialNavigation?: INavigationPayload | null;
    /** Breakpoint slot this cluster sits in; forwarded to `HeaderSearch`. */
    searchSurface?: 'desktop' | 'mobile';
}

/** Search, language, theme, and profile controls shared by desktop utility rows and mobile header chrome. */
export function HeaderUtilityCluster({
    initialProfilePages = [],
    initialNavigation = null,
    searchSurface = 'desktop',
}: IHeaderUtilityClusterProps): React.ReactElement {
    return (
        <Group gap="sm" wrap="nowrap" justify="flex-end">
            <HeaderSearch initialNavigation={initialNavigation} surface={searchSurface} />
            <LanguageSelector />
            <ThemeToggle />
            <AuthButton initialProfilePages={initialProfilePages} />
        </Group>
    );
}
