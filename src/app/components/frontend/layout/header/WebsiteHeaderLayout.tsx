/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
'use client';

import { Container, Flex, Group, Box } from '@mantine/core';
import { resolveWebHeaderPreset, type INavigationMenu } from '@selfhelp/shared';
import { useAppNavigation } from '../../../../../hooks/useAppNavigation';
import { AuthButton } from '../../../shared/auth/AuthButton';
import { LanguageSelector } from '../../../shared/common/LanguageSelector';
import { ThemeToggle } from '../../../shared/common/ThemeToggle';
import { BurgerMenuClient } from '../../../shared/common/BurgerMenuClient';
import type { IPageItem, INavigationBranding, INavigationPayload } from '../../../../../shared';
import { HeaderBrand } from './HeaderBrand';
import { HeaderUtilityCluster } from './HeaderUtilityCluster';
import { WebsiteHeaderNavRow } from './WebsiteHeaderNavRow';
import classes from './WebsiteHeaderLayout.module.css';

interface IWebsiteHeaderLayoutProps {
    initialHeaderMenu?: INavigationMenu | null;
    initialNavigation?: INavigationPayload | null;
    initialBranding?: INavigationBranding | null;
    initialProfilePages?: IPageItem[];
}

export function WebsiteHeaderLayout({
    initialHeaderMenu = null,
    initialNavigation = null,
    initialBranding = null,
    initialProfilePages = [],
}: IWebsiteHeaderLayoutProps) {
    const { headerMenu: liveHeaderMenu } = useAppNavigation();
    const menu = liveHeaderMenu ?? initialHeaderMenu;
    const preset = resolveWebHeaderPreset(menu?.preset);
    const isDouble = preset === 'double-dropdown' || preset === 'double-mega-menu';

    return (
        <Container size="xl" h="100%">
            <Flex
                justify="space-between"
                align={isDouble ? 'stretch' : 'center'}
                h="100%"
                gap="xs"
            >
                <Box className={classes.brandSlot} data-double={isDouble || undefined}>
                    <HeaderBrand initialBranding={initialBranding} />
                </Box>

                <Group
                    gap="md"
                    visibleFrom="md"
                    wrap="nowrap"
                    style={{
                        flex: '1 1 0',
                        minWidth: 0,
                        alignSelf: 'stretch',
                        justifyContent: 'center',
                    }}
                >
                    <WebsiteHeaderNavRow
                        initialHeaderMenu={menu}
                        initialNavigation={initialNavigation}
                        initialProfilePages={initialProfilePages}
                    />
                </Group>

                <Group gap="xs" wrap="nowrap" style={{ flexShrink: 0 }}>
                    {!isDouble ? (
                        <Group gap="sm" wrap="nowrap" visibleFrom="md">
                            <LanguageSelector />
                            <ThemeToggle />
                            <AuthButton initialProfilePages={initialProfilePages} />
                        </Group>
                    ) : null}
                    <Group gap="xs" wrap="nowrap" hiddenFrom="md">
                        <HeaderUtilityCluster
                            initialProfilePages={initialProfilePages}
                            initialNavigation={initialNavigation}
                        />
                    </Group>
                    <BurgerMenuClient initialHeaderMenu={menu} />
                </Group>
            </Flex>
        </Container>
    );
}
