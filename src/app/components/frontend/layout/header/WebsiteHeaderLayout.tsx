/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
'use client';

import { Container, Flex, Group, Text } from '@mantine/core';
import { resolveWebHeaderPreset, type INavigationMenu } from '@selfhelp/shared';
import { useAppNavigation } from '../../../../../hooks/useAppNavigation';
import { AdminButton } from '../../../shared/auth/AdminButton';
import { AuthButton } from '../../../shared/auth/AuthButton';
import { LanguageSelector } from '../../../shared/common/LanguageSelector';
import { ThemeToggle } from '../../../shared/common/ThemeToggle';
import { BurgerMenuClient } from '../../../shared/common/BurgerMenuClient';
import type { IPageItem } from '../../../../../shared';
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
            <Flex justify="space-between" align="center" h="100%">
                <Text size="xl" fw={700} c="blue" className="cursor-pointer">
                    Your Logo
                </Text>

                <Group gap="md" visibleFrom="md" style={{ flex: 1 }}>
                    <WebsiteHeaderNavRow
                        initialHeaderMenu={menu}
                        initialProfilePages={initialProfilePages}
                    />
                </Group>

                <Group gap="sm">
                    <AdminButton />
                    {!isDouble ? (
                        <>
                            <AuthButton initialProfilePages={initialProfilePages} />
                            <LanguageSelector />
                        </>
                    ) : null}
                    <ThemeToggle />
                    <BurgerMenuClient initialHeaderMenu={menu} />
                </Group>
            </Flex>
        </Container>
    );
}
