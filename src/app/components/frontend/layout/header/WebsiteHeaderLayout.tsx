/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
'use client';

import { Container, Flex, Group } from '@mantine/core';
import { resolveWebHeaderPreset, type INavigationMenu } from '@selfhelp/shared';
import { useAppNavigation } from '../../../../../hooks/useAppNavigation';
import { AuthButton } from '../../../shared/auth/AuthButton';
import { LanguageSelector } from '../../../shared/common/LanguageSelector';
import { ThemeToggle } from '../../../shared/common/ThemeToggle';
import { BurgerMenuClient } from '../../../shared/common/BurgerMenuClient';
import type { IPageItem } from '../../../../../shared';
import { HeaderBrand } from './HeaderBrand';
import { WebsiteHeaderNavRow } from './WebsiteHeaderNavRow';

interface IWebsiteHeaderLayoutProps {
    initialHeaderMenu?: INavigationMenu | null;
    initialProfilePages?: IPageItem[];
}

export function WebsiteHeaderLayout({
    initialHeaderMenu = null,
    initialProfilePages = [],
}: IWebsiteHeaderLayoutProps) {
    const { headerMenu: liveHeaderMenu } = useAppNavigation();
    const menu = liveHeaderMenu ?? initialHeaderMenu;
    const preset = resolveWebHeaderPreset(menu?.preset);
    const isDouble = preset === 'double-dropdown' || preset === 'double-mega-menu';

    return (
        <Container size="xl" h="100%">
            <Flex justify="space-between" align="center" h="100%" gap="md">
                <HeaderBrand />

                <Group gap="md" visibleFrom="md" style={{ flex: 1, minWidth: 0 }}>
                    <WebsiteHeaderNavRow
                        initialHeaderMenu={menu}
                        initialProfilePages={initialProfilePages}
                    />
                </Group>

                {/* Utility cluster: language + theme + profile grouped together.
                    Double presets host this cluster in the top utility row
                    (HeaderUtilitySlot), so here only the burger remains. */}
                <Group gap="sm" wrap="nowrap">
                    {!isDouble ? (
                        <>
                            <LanguageSelector />
                            <ThemeToggle />
                            <AuthButton initialProfilePages={initialProfilePages} />
                        </>
                    ) : null}
                    <BurgerMenuClient initialHeaderMenu={menu} />
                </Group>
            </Flex>
        </Container>
    );
}
