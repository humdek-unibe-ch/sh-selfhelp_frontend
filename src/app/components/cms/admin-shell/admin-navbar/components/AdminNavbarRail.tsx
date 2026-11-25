/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
'use client';

import { ActionIcon, Box, Menu, ScrollArea, Stack, Tooltip, useMantineColorScheme } from '@mantine/core';
import { IconDashboard, IconLayoutSidebarLeftExpand, IconSearch } from '@tabler/icons-react';
import { usePathname, useRouter } from 'next/navigation';
import Image from 'next/image';
import type { IAdminMenuPreviewLink } from '../../../../../../utils/admin-navigation-membership';
import { AuthButton, PreviewModeToggle } from '../../../../shared';
import type { TNavbarGroup, TNavbarItem } from '../AdminNavbar';
import classes from './AdminNavbarRail.module.css';

interface IAdminNavbarRailProps {
    groups: TNavbarGroup[];
    onExpand: () => void;
    onSearch: () => void;
}

const linkPath = (link: string): string => link.split('?')[0];

function hasActiveLink(links: IAdminMenuPreviewLink[] | undefined, pathname: string): boolean {
    return (links ?? []).some((link) => linkPath(link.link) === pathname || hasActiveLink(link.links, pathname));
}

function isGroupActive(group: TNavbarGroup, pathname: string): boolean {
    return group.items.some((item) =>
        (item.link !== undefined && linkPath(item.link) === pathname) || hasActiveLink(item.links, pathname),
    );
}

/**
 * The collapsed admin navbar: an icon rail. Each section opens its links in
 * a flyout menu on hover or click (keyboard: Enter / arrow keys), so nothing
 * becomes unreachable while the sidebar is narrow.
 */
export function AdminNavbarRail({ groups, onExpand, onSearch }: IAdminNavbarRailProps) {
    const router = useRouter();
    const pathname = usePathname();
    const { colorScheme } = useMantineColorScheme();

    const navigate = (event: React.MouseEvent, link: string) => {
        if (event.button === 1 || event.ctrlKey || event.metaKey) return;
        event.preventDefault();
        router.push(link);
    };

    const renderLinks = (links: IAdminMenuPreviewLink[], depth: number): React.ReactNode =>
        links.map((link) => (
            <Box key={link.id ?? link.link}>
                <Menu.Item
                    component="a"
                    href={link.link}
                    onClick={(event: React.MouseEvent) => navigate(event, link.link)}
                    data-active={linkPath(link.link) === pathname || undefined}
                    className={classes.menuItem}
                    style={{ paddingInlineStart: `calc(var(--mantine-spacing-sm) + ${depth * 12}px)` }}
                >
                    {link.label}
                </Menu.Item>
                {link.links && link.links.length > 0 && renderLinks(link.links, depth + 1)}
            </Box>
        ));

    const renderItem = (item: TNavbarItem): React.ReactNode => {
        if (item.links) {
            return (
                <Box key={item.id}>
                    <Menu.Label className={classes.subLabel}>{item.label}</Menu.Label>
                    {renderLinks(item.links, 0)}
                </Box>
            );
        }
        if (item.link) {
            const link = item.link;
            return (
                <Menu.Item
                    key={item.id}
                    component="a"
                    href={link}
                    leftSection={item.icon}
                    onClick={(event: React.MouseEvent) => navigate(event, link)}
                    data-active={linkPath(link) === pathname || undefined}
                    className={classes.menuItem}
                >
                    {item.label}
                </Menu.Item>
            );
        }
        return (
            <Menu.Item key={item.id} leftSection={item.icon} onClick={item.onClick} className={classes.menuItem}>
                {item.label}
            </Menu.Item>
        );
    };

    return (
        <Box className={classes.rail}>
            <Stack gap={6} align="center" className={classes.header}>
                <Image
                    src={colorScheme === 'dark' ? '/assets/images/logo_negative.svg' : '/assets/images/logo.svg'}
                    alt="SelfHelp"
                    width={28}
                    height={28}
                    className="object-contain"
                />
                <Tooltip label="Expand sidebar (Ctrl+B)" position="right" withArrow>
                    <ActionIcon variant="subtle" color="gray" size="lg" aria-label="Expand sidebar" onClick={onExpand}>
                        <IconLayoutSidebarLeftExpand size={20} stroke={1.6} />
                    </ActionIcon>
                </Tooltip>
                <Tooltip label="Search functions and pages" position="right" withArrow>
                    <ActionIcon variant="subtle" color="gray" size="lg" aria-label="Search functions and pages" onClick={onSearch}>
                        <IconSearch size={19} stroke={1.6} />
                    </ActionIcon>
                </Tooltip>
            </Stack>

            <ScrollArea className={classes.links} scrollbars="y" type="never">
                <Stack gap={2} align="center" py="xs" component="ul" className={classes.list}>
                    <li>
                        <Tooltip label="Dashboard" position="right" withArrow>
                            <ActionIcon
                                component="a"
                                href="/admin"
                                onClick={(event: React.MouseEvent) => navigate(event, '/admin')}
                                size={40}
                                radius="md"
                                variant={pathname === '/admin' ? 'light' : 'subtle'}
                                color={pathname === '/admin' ? 'blue' : 'gray'}
                                aria-label="Dashboard"
                                aria-current={pathname === '/admin' ? 'page' : undefined}
                            >
                                <IconDashboard size={20} stroke={1.6} />
                            </ActionIcon>
                        </Tooltip>
                    </li>
                    {groups.map((group) => {
                        const active = isGroupActive(group, pathname);
                        return (
                            <li key={group.id}>
                                <Menu
                                    trigger="click-hover"
                                    position="right-start"
                                    offset={10}
                                    openDelay={60}
                                    closeDelay={180}
                                    shadow="md"
                                    width={260}
                                    withinPortal
                                >
                                    <Menu.Target>
                                        <ActionIcon
                                            size={40}
                                            radius="md"
                                            variant={active ? 'light' : 'subtle'}
                                            color={active ? 'blue' : 'gray'}
                                            aria-label={group.label}
                                            className={classes.groupButton}
                                        >
                                            {group.icon}
                                        </ActionIcon>
                                    </Menu.Target>
                                    <Menu.Dropdown className={classes.dropdown}>
                                        <Menu.Label className={classes.groupLabel}>{group.label}</Menu.Label>
                                        <ScrollArea.Autosize mah="min(70vh, 520px)" type="auto" scrollbars="y">
                                            {group.items.map(renderItem)}
                                        </ScrollArea.Autosize>
                                        {group.actions && group.actions.length > 0 && (
                                            <>
                                                <Menu.Divider />
                                                {group.actions.map((action) => (
                                                    <Menu.Item key={action.id} leftSection={action.icon} onClick={action.onClick}>
                                                        {action.label}
                                                    </Menu.Item>
                                                ))}
                                            </>
                                        )}
                                    </Menu.Dropdown>
                                </Menu>
                            </li>
                        );
                    })}
                </Stack>
            </ScrollArea>

            <Stack gap={6} align="center" className={classes.footer}>
                <PreviewModeToggle compact />
                <AuthButton variant="navbar-rail" />
            </Stack>
        </Box>
    );
}
