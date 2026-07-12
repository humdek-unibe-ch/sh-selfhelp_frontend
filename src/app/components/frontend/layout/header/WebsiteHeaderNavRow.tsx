/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
'use client';

import { Group, Box } from '@mantine/core';
import { isDoubleWebHeaderPreset, resolveWebHeaderPreset, type INavigationMenu } from '@selfhelp/shared';
import { useAppNavigation } from '../../../../../hooks/useAppNavigation';
import { HeaderSearch } from './HeaderSearch';
import { HeaderUtilityCluster } from './HeaderUtilityCluster';
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
        <HeaderUtilityCluster
            initialProfilePages={initialProfilePages}
            initialNavigation={initialNavigation}
        />
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
            <Box style={{ flex: '1 1 0', minWidth: 0, width: '100%' }}>
                <WebsiteHeaderMenu
                    initialHeaderMenu={menu}
                    utilitySlot={
                        <HeaderUtilitySlot
                            initialProfilePages={initialProfilePages}
                            initialNavigation={initialNavigation}
                        />
                    }
                />
            </Box>
        );
    }

    return (
        <Group gap="md" wrap="nowrap" style={{ flex: '1 1 0', minWidth: 0, width: '100%' }}>
            <Box style={{ flex: '1 1 0', minWidth: 0, width: '100%' }}>
                <WebsiteHeaderMenu initialHeaderMenu={menu} />
            </Box>
            <HeaderSearch initialNavigation={initialNavigation} />
        </Group>
    );
}
