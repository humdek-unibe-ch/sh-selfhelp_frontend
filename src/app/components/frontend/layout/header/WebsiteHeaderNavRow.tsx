/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
'use client';

import { Group } from '@mantine/core';
import { isDoubleWebHeaderPreset, resolveWebHeaderPreset, type INavigationMenu } from '@selfhelp/shared';
import { useAppNavigation } from '../../../../../hooks/useAppNavigation';
import { AuthButton } from '../../../shared/auth/AuthButton';
import { LanguageSelector } from '../../../shared/common/LanguageSelector';
import { ThemeToggle } from '../../../shared/common/ThemeToggle';
import { HeaderSearch } from './HeaderSearch';
import { WebsiteHeaderMenu } from './WebsiteHeaderMenu';
import type { IPageItem } from '../../../../../shared';

interface IWebsiteHeaderNavRowProps {
    initialHeaderMenu?: INavigationMenu | null;
    initialProfilePages?: IPageItem[];
}

/** Top-row utility cluster: search, then language + theme + profile grouped together. */
function HeaderUtilitySlot({ initialProfilePages = [] }: { initialProfilePages?: IPageItem[] }) {
    return (
        <Group gap="sm" wrap="nowrap" justify="flex-end">
            <HeaderSearch />
            <LanguageSelector />
            <ThemeToggle />
            <AuthButton initialProfilePages={initialProfilePages} />
        </Group>
    );
}

/**
 * Desktop navigation row: applies double-header utility composition when the
 * menu preset requires a top utility row.
 */
export function WebsiteHeaderNavRow({
    initialHeaderMenu = null,
    initialProfilePages = [],
}: IWebsiteHeaderNavRowProps) {
    const { headerMenu: liveHeaderMenu } = useAppNavigation();
    const menu = liveHeaderMenu ?? initialHeaderMenu;
    const preset = resolveWebHeaderPreset(menu?.preset);
    const isDouble = isDoubleWebHeaderPreset(preset);

    if (isDouble) {
        return (
            <WebsiteHeaderMenu
                initialHeaderMenu={menu}
                utilitySlot={<HeaderUtilitySlot initialProfilePages={initialProfilePages} />}
            />
        );
    }

    return (
        <Group gap="md" wrap="nowrap" style={{ flex: 1 }}>
            <WebsiteHeaderMenu initialHeaderMenu={menu} />
            <HeaderSearch />
        </Group>
    );
}
