/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
'use client';

import { useMemo, type ReactNode } from 'react';
import {
    Divider,
    Group,
    HoverCard,
    SimpleGrid,
    Stack,
    Tabs,
    Text,
    ThemeIcon,
} from '@mantine/core';
import { usePathname } from 'next/navigation';
import { IconChevronDown, IconPoint } from '@tabler/icons-react';
import {
    type INavigationMenu,
    type INavigationMenuItem,
    WEB_HEADER_PRESET_OPTIONS,
    clampMenuItemsAtDepth,
    getNavigationItemAriaLabel,
    getNavigationItemHref,
    getNavigationItemLabel,
    isDoubleWebHeaderPreset,
    mergeHeaderLayers,
    resolveMenuMaxDepth,
    resolveWebHeaderPreset,
    splitHeaderLayers,
} from '@selfhelp/shared';
import { InternalLink } from '../../../shared';
import { IconComponent } from '../../../shared/common';
import classes from './WebsiteHeaderRenderer.module.css';

interface IWebsiteHeaderRendererProps {
    menu: INavigationMenu | null | undefined;
    utilitySlot?: ReactNode;
}

function NavIcon({ name, size = 18 }: { name?: string | null; size?: number }) {
    if (!name) return null;
    return <IconComponent iconName={name} size={size} />;
}

function useIsActive(href: string | undefined): boolean {
    const pathname = usePathname();
    if (!href || href === '#') return false;
    const clean = pathname.split('#')[0].split('?')[0].replace(/\/+$/, '') || '/';
    const target = href.replace(/\/+$/, '') || '/';
    return clean === target;
}

/**
 * Top-level trigger: a padded pill. When the item has its own page the whole
 * pill is a link; hovering still opens the child panel (chevron included).
 */
function NavTrigger({ item, withChevron }: { item: INavigationMenuItem; withChevron: boolean }) {
    const href = getNavigationItemHref(item);
    const ariaLabel = getNavigationItemAriaLabel(item);
    const label = getNavigationItemLabel(item);
    const isActive = useIsActive(href);

    const inner = (
        <>
            <NavIcon name={item.icon} size={16} />
            <Text size="sm" fw={500} span style={{ whiteSpace: 'nowrap' }}>
                {label}
            </Text>
            {withChevron ? <IconChevronDown size={14} stroke={1.75} style={{ opacity: 0.6 }} /> : null}
        </>
    );

    if (href && href !== '#') {
        return (
            <InternalLink href={href} aria-label={ariaLabel} className={classes.navTrigger} data-active={isActive || undefined}>
                {inner}
            </InternalLink>
        );
    }

    return (
        <span className={classes.navTrigger} aria-label={ariaLabel} role="button" tabIndex={0}>
            {inner}
        </span>
    );
}

/** One row inside a plain dropdown panel: icon, label, optional description. */
function DropdownRow({ item }: { item: INavigationMenuItem }) {
    return (
        <InternalLink
            href={getNavigationItemHref(item)}
            aria-label={getNavigationItemAriaLabel(item)}
            className={classes.dropdownRow}
        >
            <span style={{ display: 'inline-flex', marginTop: 2, opacity: 0.75 }}>
                {item.icon ? <NavIcon name={item.icon} size={16} /> : <IconPoint size={16} style={{ opacity: 0.4 }} />}
            </span>
            <Stack gap={2} style={{ minWidth: 0 }}>
                <Text size="sm" fw={500} lh={1.3}>
                    {getNavigationItemLabel(item)}
                </Text>
                {item.description ? (
                    <Text size="xs" c="dimmed" lineClamp={2} lh={1.35}>
                        {item.description}
                    </Text>
                ) : null}
            </Stack>
        </InternalLink>
    );
}

function DropdownItem({ item, atDepthLimit = false }: { item: INavigationMenuItem; atDepthLimit?: boolean }) {
    const children = (item.children ?? []).filter((child) => child.page != null || child.item_type === 'external_url');

    if (children.length === 0 || atDepthLimit) {
        return <NavTrigger item={item} withChevron={false} />;
    }

    return (
        <HoverCard
            openDelay={60}
            closeDelay={120}
            position="bottom-start"
            shadow="lg"
            radius="md"
            offset={4}
            withinPortal
            transitionProps={{ transition: 'pop-top-left', duration: 120 }}
        >
            <HoverCard.Target>
                {/* span wrapper: HoverCard needs a single stable target element */}
                <span style={{ display: 'inline-flex' }}>
                    <NavTrigger item={item} withChevron />
                </span>
            </HoverCard.Target>
            <HoverCard.Dropdown p={6} miw={240} maw={320}>
                <Stack gap={2}>
                    {children.map((child) => (
                        <DropdownRow key={String(child.id)} item={child} />
                    ))}
                </Stack>
            </HoverCard.Dropdown>
        </HoverCard>
    );
}

function DropdownPreset({ items, atDepthLimit = false }: { items: INavigationMenuItem[]; atDepthLimit?: boolean }) {
    return (
        <Group gap={4} wrap="nowrap">
            {items.map((item) => (
                <DropdownItem key={String(item.id)} item={item} atDepthLimit={atDepthLimit} />
            ))}
        </Group>
    );
}

function SimplePreset({ items }: { items: INavigationMenuItem[] }) {
    return (
        <Group gap={4} wrap="nowrap">
            {items.map((item) => (
                <NavTrigger key={String(item.id)} item={item} withChevron={false} />
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

/** One cell of the mega menu grid: tinted icon tile + title + description. */
function MegaMenuCell({ item }: { item: INavigationMenuItem }) {
    return (
        <InternalLink
            href={getNavigationItemHref(item)}
            aria-label={getNavigationItemAriaLabel(item)}
            className={classes.megaItem}
        >
            <ThemeIcon variant="light" radius="md" size={38} color="blue">
                {item.icon ? <NavIcon name={item.icon} size={20} /> : <IconPoint size={20} />}
            </ThemeIcon>
            <Stack gap={2} style={{ minWidth: 0 }}>
                <Text size="sm" fw={600} lh={1.3}>
                    {getNavigationItemLabel(item)}
                </Text>
                {item.description ? (
                    <Text size="xs" c="dimmed" lineClamp={2} lh={1.4}>
                        {item.description}
                    </Text>
                ) : null}
            </Stack>
        </InternalLink>
    );
}

function MegaMenuPreset({ items, atDepthLimit = false }: { items: INavigationMenuItem[]; atDepthLimit?: boolean }) {
    return (
        <Group gap={4} wrap="nowrap">
            {items.map((item) => {
                const children = (item.children ?? []).filter(
                    (child) => child.page != null || child.item_type === 'external_url',
                );
                if (children.length === 0 || atDepthLimit) {
                    return <DropdownItem key={String(item.id)} item={item} atDepthLimit={atDepthLimit} />;
                }
                return (
                    <HoverCard
                        key={String(item.id)}
                        openDelay={60}
                        closeDelay={120}
                        position="bottom-start"
                        shadow="lg"
                        radius="md"
                        offset={4}
                        withinPortal
                        transitionProps={{ transition: 'pop-top-left', duration: 120 }}
                    >
                        <HoverCard.Target>
                            <span style={{ display: 'inline-flex' }}>
                                <NavTrigger item={item} withChevron />
                            </span>
                        </HoverCard.Target>
                        <HoverCard.Dropdown p="md" w={children.length > 3 ? 560 : 300}>
                            <SimpleGrid cols={children.length > 3 ? 2 : 1} spacing={4} verticalSpacing={4}>
                                {children.map((child) => (
                                    <MegaMenuCell key={String(child.id)} item={child} />
                                ))}
                            </SimpleGrid>
                        </HoverCard.Dropdown>
                    </HoverCard>
                );
            })}
        </Group>
    );
}

function TopRow({ items, utilitySlot }: { items: INavigationMenuItem[]; utilitySlot?: ReactNode }) {
    if (items.length === 0 && !utilitySlot) {
        return null;
    }

    return (
        <Group justify="space-between" gap="md" wrap="nowrap" w="100%">
            <Group gap={2} wrap="nowrap" component="nav" aria-label="Secondary navigation">
                {items.map((item) => (
                    <InternalLink
                        key={String(item.id)}
                        href={getNavigationItemHref(item)}
                        aria-label={getNavigationItemAriaLabel(item)}
                        className={classes.topRowLink}
                    >
                        <NavIcon name={item.icon} size={14} />
                        <Text size="xs" fw={500} span style={{ whiteSpace: 'nowrap' }}>
                            {getNavigationItemLabel(item)}
                        </Text>
                    </InternalLink>
                ))}
            </Group>
            <Group justify="flex-end" gap="md" wrap="nowrap">
                {utilitySlot}
            </Group>
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
 *
 * Double presets split root items into a top utility row (`layer: 'top'`,
 * flat links next to the utility slot) and the main navigation row. Single
 * presets merge both layers into one row (main items first, top items
 * appended) without touching the stored layer assignments.
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
    const isDouble = isDoubleWebHeaderPreset(preset);
    const innerPreset = preset === 'double-dropdown'
        ? 'dropdown'
        : preset === 'double-mega-menu'
            ? 'mega-menu'
            : preset;

    const atDepthLimit = maxDepth !== null && maxDepth <= 1;

    if (!isDouble) {
        const mainNav = renderInnerPreset(innerPreset, mergeHeaderLayers(items), atDepthLimit);
        return (
            <Group gap="lg" wrap="nowrap" style={{ flex: 1 }} component="nav" aria-label="Main navigation">
                {mainNav}
            </Group>
        );
    }

    const { top, main } = splitHeaderLayers(items);
    const mainNav = renderInnerPreset(innerPreset, main, atDepthLimit);

    return (
        <Stack gap={4} style={{ flex: 1, minWidth: 0 }}>
            <TopRow items={top} utilitySlot={utilitySlot} />
            <Divider />
            <Group
                component="nav"
                aria-label="Main navigation"
                wrap="nowrap"
                style={{ overflowX: 'auto', scrollbarWidth: 'none' }}
            >
                {mainNav}
            </Group>
        </Stack>
    );
}

export { WEB_HEADER_PRESET_OPTIONS };
