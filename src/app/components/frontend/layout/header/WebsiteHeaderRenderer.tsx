/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
'use client';

import { useMemo, type ReactNode } from 'react';
import {
    Group,
    Menu,
    Text,
    UnstyledButton,
    Tabs,
    Stack,
    SimpleGrid,
    Card,
    Divider,
} from '@mantine/core';
import { IconChevronDown } from '@tabler/icons-react';
import {
    type INavigationMenu,
    type INavigationMenuItem,
    WEB_HEADER_PRESET_OPTIONS,
    clampMenuItemsAtDepth,
    getNavigationItemAriaLabel,
    getNavigationItemHref,
    getNavigationItemLabel,
    resolveMenuMaxDepth,
    resolveWebHeaderPreset,
} from '@selfhelp/shared';
import { InternalLink } from '../../../shared';
import { IconComponent } from '../../../shared/common';

interface IWebsiteHeaderRendererProps {
    menu: INavigationMenu | null | undefined;
    utilitySlot?: ReactNode;
}

function NavIcon({ name, size = 18 }: { name?: string | null; size?: number }) {
    if (!name) return null;
    return <IconComponent iconName={name} size={size} />;
}

function DropdownItem({ item, atDepthLimit = false }: { item: INavigationMenuItem; atDepthLimit?: boolean }) {
    const children = (item.children ?? []).filter((child) => child.page != null || child.item_type === 'external_url');
    const label = getNavigationItemLabel(item);
    const href = getNavigationItemHref(item);
    const icon = item.icon ?? null;
    const ariaLabel = getNavigationItemAriaLabel(item);

    if (children.length > 0 && !atDepthLimit) {
        return (
            <Menu trigger="hover" withinPortal>
                <Menu.Target>
                    <UnstyledButton component="div" aria-label={ariaLabel}>
                        <Group gap="xs" wrap="nowrap">
                            {href ? (
                                <span onClick={(event) => event.stopPropagation()} role="presentation">
                                    <InternalLink href={href} aria-label={ariaLabel}>
                                        <Group gap="xs" wrap="nowrap">
                                            <NavIcon name={icon} />
                                            <Text size="sm" fw={500}>{label}</Text>
                                        </Group>
                                    </InternalLink>
                                </span>
                            ) : (
                                <>
                                    <NavIcon name={icon} />
                                    <Text size="sm" fw={500}>{label}</Text>
                                </>
                            )}
                            <IconChevronDown size={16} stroke={1.5} />
                        </Group>
                    </UnstyledButton>
                </Menu.Target>
                <Menu.Dropdown>
                    {children.map((child) => (
                        <Menu.Item
                            key={String(child.id)}
                            leftSection={<NavIcon name={child.icon} size={16} />}
                        >
                            <InternalLink href={getNavigationItemHref(child)} aria-label={getNavigationItemAriaLabel(child)}>
                                <Text size="sm">{getNavigationItemLabel(child)}</Text>
                            </InternalLink>
                        </Menu.Item>
                    ))}
                </Menu.Dropdown>
            </Menu>
        );
    }

    return (
        <InternalLink href={href} aria-label={ariaLabel}>
            <UnstyledButton>
                <Group gap="xs">
                    <NavIcon name={icon} />
                    <Text size="sm" fw={500}>{label}</Text>
                </Group>
            </UnstyledButton>
        </InternalLink>
    );
}

function DropdownPreset({ items, atDepthLimit = false }: { items: INavigationMenuItem[]; atDepthLimit?: boolean }) {
    return (
        <Group gap="lg">
            {items.map((item) => (
                <DropdownItem key={String(item.id)} item={item} atDepthLimit={atDepthLimit} />
            ))}
        </Group>
    );
}

function SimplePreset({ items }: { items: INavigationMenuItem[] }) {
    return (
        <Group gap="lg">
            {items.map((item) => (
                <InternalLink
                    key={String(item.id)}
                    href={getNavigationItemHref(item)}
                    aria-label={getNavigationItemAriaLabel(item)}
                >
                    <Text size="sm" fw={500}>{getNavigationItemLabel(item)}</Text>
                </InternalLink>
            ))}
        </Group>
    );
}

function TabsPreset({ items }: { items: INavigationMenuItem[] }) {
    const firstHref = items[0] ? getNavigationItemHref(items[0]) : undefined;
    return (
        <Tabs defaultValue={firstHref}>
            <Tabs.List>
                {items.map((item) => {
                    const href = getNavigationItemHref(item);
                    return (
                        <Tabs.Tab key={String(item.id)} value={href}>
                            <InternalLink href={href} aria-label={getNavigationItemAriaLabel(item)}>
                                <Group gap="xs">
                                    <NavIcon name={item.icon} />
                                    <Text size="sm">{getNavigationItemLabel(item)}</Text>
                                </Group>
                            </InternalLink>
                        </Tabs.Tab>
                    );
                })}
            </Tabs.List>
        </Tabs>
    );
}

function MegaMenuPreset({ items, atDepthLimit = false }: { items: INavigationMenuItem[]; atDepthLimit?: boolean }) {
    return (
        <Group gap="lg">
            {items.map((item) => {
                const children = item.children ?? [];
                if (children.length === 0 || atDepthLimit) {
                    return <DropdownItem key={String(item.id)} item={item} atDepthLimit={atDepthLimit} />;
                }
                return (
                    <Menu key={String(item.id)} trigger="hover" withinPortal width={420}>
                        <Menu.Target>
                            <UnstyledButton component="div" aria-label={getNavigationItemAriaLabel(item)}>
                                <Group gap="xs" wrap="nowrap">
                                    {getNavigationItemHref(item) ? (
                                        <span onClick={(event) => event.stopPropagation()} role="presentation">
                                            <InternalLink href={getNavigationItemHref(item)} aria-label={getNavigationItemAriaLabel(item)}>
                                                <Group gap="xs" wrap="nowrap">
                                                    <NavIcon name={item.icon} />
                                                    <Text size="sm" fw={500}>{getNavigationItemLabel(item)}</Text>
                                                </Group>
                                            </InternalLink>
                                        </span>
                                    ) : (
                                        <>
                                            <NavIcon name={item.icon} />
                                            <Text size="sm" fw={500}>{getNavigationItemLabel(item)}</Text>
                                        </>
                                    )}
                                    <IconChevronDown size={16} stroke={1.5} />
                                </Group>
                            </UnstyledButton>
                        </Menu.Target>
                        <Menu.Dropdown>
                            <SimpleGrid cols={2} p="sm">
                                {children.map((child) => (
                                    <Card key={String(child.id)} padding="sm" withBorder>
                                        <InternalLink href={getNavigationItemHref(child)} aria-label={getNavigationItemAriaLabel(child)}>
                                            <Stack gap={4}>
                                                <Group gap="xs">
                                                    <NavIcon name={child.icon} size={16} />
                                                    <Text size="sm" fw={600}>{getNavigationItemLabel(child)}</Text>
                                                </Group>
                                                {child.description ? (
                                                    <Text size="xs" c="dimmed">{child.description}</Text>
                                                ) : null}
                                            </Stack>
                                        </InternalLink>
                                    </Card>
                                ))}
                            </SimpleGrid>
                        </Menu.Dropdown>
                    </Menu>
                );
            })}
        </Group>
    );
}

function UtilityRow({ utilitySlot }: { utilitySlot?: ReactNode }) {
    if (!utilitySlot) {
        return null;
    }

    return (
        <Group justify="flex-end" gap="md" wrap="nowrap" w="100%">
            {utilitySlot}
        </Group>
    );
}

function renderInnerPreset(
    preset: string,
    items: INavigationMenuItem[],
    atDepthLimit: boolean,
): ReactNode {
    switch (preset) {
        case 'simple':
            return <SimplePreset items={items} />;
        case 'tabs':
            return <TabsPreset items={items} />;
        case 'mega-menu':
            return <MegaMenuPreset items={items} atDepthLimit={atDepthLimit} />;
        case 'dropdown':
        default:
            return <DropdownPreset items={items} atDepthLimit={atDepthLimit} />;
    }
}

/**
 * Renders the global `web_header` menu using the menu-builder preset.
 */
export function WebsiteHeaderRenderer({ menu, utilitySlot }: IWebsiteHeaderRendererProps) {
    const maxDepth = resolveMenuMaxDepth(menu?.max_depth);
    const items = useMemo(
        () => clampMenuItemsAtDepth(menu?.items ?? [], maxDepth),
        [menu?.items, maxDepth],
    );

    if (items.length === 0) {
        return null;
    }

    const preset = resolveWebHeaderPreset(menu?.preset);
    const isDouble = preset === 'double-dropdown' || preset === 'double-mega-menu';
    const innerPreset = preset === 'double-dropdown'
        ? 'dropdown'
        : preset === 'double-mega-menu'
            ? 'mega-menu'
            : preset;

    const atDepthLimit = maxDepth !== null && maxDepth <= 1;
    const mainNav = renderInnerPreset(innerPreset, items, atDepthLimit);

    if (!isDouble) {
        return (
            <Group gap="lg" wrap="nowrap" style={{ flex: 1 }} component="nav" aria-label="Main navigation">
                {mainNav}
            </Group>
        );
    }

    return (
        <Stack gap={6} style={{ flex: 1 }}>
            <UtilityRow utilitySlot={utilitySlot} />
            <Divider />
            <Group component="nav" aria-label="Main navigation" wrap="nowrap">
                {mainNav}
            </Group>
        </Stack>
    );
}

export { WEB_HEADER_PRESET_OPTIONS };
