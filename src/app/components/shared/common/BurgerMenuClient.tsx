/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
'use client';

import type { ReactNode } from 'react';
import { Burger, Drawer, NavLink, Stack } from '@mantine/core';
import { useDisclosure, useMediaQuery } from '@mantine/hooks';
import { usePathname, useRouter } from 'next/navigation';
import {
    type INavigationMenu,
    type INavigationMenuItem,
    getNavigationItemHref,
    getNavigationItemLabel,
} from '@selfhelp/shared';
import { useAppNavigation } from '../../../../hooks/useAppNavigation';
import IconComponent from './IconComponent';

interface IBurgerMenuClientProps {
    /** Server-resolved `web_header` menu for first paint. */
    initialHeaderMenu?: INavigationMenu | null;
}

function isItemActive(item: INavigationMenuItem, pathname: string): boolean {
    const href = getNavigationItemHref(item);
    if (href && (pathname === href || pathname.startsWith(`${href}/`))) {
        return true;
    }

    return (item.children ?? []).some((child) => isItemActive(child, pathname));
}

function BurgerNavTree({
    items,
    pathname,
    depth = 0,
    onNavigate,
    onNavigateHref,
}: {
    items: INavigationMenuItem[];
    pathname: string;
    depth?: number;
    onNavigate: () => void;
    onNavigateHref: (href: string) => void;
}): ReactNode {
    return items.map((item) => {
        const label = getNavigationItemLabel(item);
        const href = getNavigationItemHref(item);
        const children = (item.children ?? []).filter(
            (child) => child.item_type === 'external_url' || child.page != null || child.item_type === 'group',
        );
        const iconName = item.icon ?? item.page?.icon ?? null;
        const active = isItemActive(item, pathname);
        const handleNavigate = href
            ? () => {
                onNavigate();
                onNavigateHref(href);
            }
            : undefined;

        if (children.length > 0) {
            return (
                <NavLink
                    key={String(item.id)}
                    label={label}
                    leftSection={iconName ? <IconComponent iconName={iconName} size={18} /> : undefined}
                    active={active}
                    defaultOpened={active}
                    pl={depth * 12}
                    onClick={handleNavigate}
                >
                    <BurgerNavTree
                        items={children}
                        pathname={pathname}
                        depth={depth + 1}
                        onNavigate={onNavigate}
                        onNavigateHref={onNavigateHref}
                    />
                </NavLink>
            );
        }

        return (
            <NavLink
                key={String(item.id)}
                label={label}
                leftSection={iconName ? <IconComponent iconName={iconName} size={18} /> : undefined}
                active={active}
                pl={depth * 12}
                onClick={handleNavigate}
            />
        );
    });
}

/**
 * Small-viewport burger that opens a drawer with the resolved `web_header` menu tree.
 */
export function BurgerMenuClient({ initialHeaderMenu = null }: IBurgerMenuClientProps) {
    const [opened, { toggle, close }] = useDisclosure(false);
    const isSmallViewport = useMediaQuery('(max-width: 62em)') ?? false;
    const pathname = usePathname();
    const router = useRouter();
    const { headerMenu } = useAppNavigation();
    const menu = headerMenu ?? initialHeaderMenu;
    const items = menu?.items ?? [];

    if (!isSmallViewport || items.length === 0) {
        return null;
    }

    return (
        <>
            <Burger opened={opened} onClick={toggle} size="sm" hiddenFrom="md" aria-label="Open navigation menu" />
            <Drawer
                opened={opened}
                onClose={close}
                title="Menu"
                position="right"
                size="xs"
            >
                <Stack gap={4}>
                    <BurgerNavTree
                        items={items}
                        pathname={pathname}
                        onNavigate={close}
                        onNavigateHref={(href) => {
                            if (href.startsWith('http://') || href.startsWith('https://')) {
                                window.location.assign(href);
                                return;
                            }
                            router.push(href);
                        }}
                    />
                </Stack>
            </Drawer>
        </>
    );
}
