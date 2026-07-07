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
import type { IPageItem, INavigationPayload } from '../../../../../shared';

interface IWebsiteHeaderNavRowProps {
    initialHeaderMenu?: INavigationMenu | null;
    initialNavigation?: INavigationPayload | null;
    initialProfilePages?: IPageItem[];
}

/** Top-row utility cluster: search, then language + theme + profile grouped together. */
function HeaderUtilitySlot({
    initialProfilePages = [],
    initialNavigation = null,
}: {
    initialProfilePages?: IPageItem[];
    initialNavigation?: INavigationPayload | null;
}) {
    return (
        <Group gap="sm" wrap="nowrap" justify="flex-end">
            <HeaderSearch initialNavigation={initialNavigation} />
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
    initialNavigation = null,
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
                utilitySlot={
                    <HeaderUtilitySlot
                        initialProfilePages={initialProfilePages}
                        initialNavigation={initialNavigation}
                    />
                }
            />
        );
    }

    return (
        <Group gap="md" wrap="nowrap" style={{ flex: 1 }}>
            <WebsiteHeaderMenu initialHeaderMenu={menu} />
            <HeaderSearch initialNavigation={initialNavigation} />
        </Group>
    );
}
