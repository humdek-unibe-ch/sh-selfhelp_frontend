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
    Box,
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
import { HeaderNavOverflow } from './HeaderNavOverflow';
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

/** Indented grandchild links (depth 3) under a dropdown row / mega cell. */
function SubLinkList({ items, indent = 34 }: { items: INavigationMenuItem[]; indent?: number }) {
    if (items.length === 0) {
        return null;
    }
    return (
        <div className={classes.subLinkList} style={{ marginLeft: indent }}>
            {items.map((child) => (
                <InternalLink
                    key={String(child.id)}
                    href={getNavigationItemHref(child)}
                    aria-label={getNavigationItemAriaLabel(child)}
                    className={classes.subLink}
                >
                    {child.icon ? <NavIcon name={child.icon} size={13} /> : null}
                    <span>{getNavigationItemLabel(child)}</span>
                </InternalLink>
            ))}
        </div>
    );
}

function navigableChildren(item: INavigationMenuItem): INavigationMenuItem[] {
    return (item.children ?? []).filter(
        (child) => child.page != null || child.item_type === 'external_url',
    );
}

/** One row inside a plain dropdown panel: icon, label, optional description,
    plus indented grandchild links when the menu depth allows them. */
function DropdownRow({ item }: { item: INavigationMenuItem }) {
    const grandchildren = navigableChildren(item);
    return (
        <div>
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
            <SubLinkList items={grandchildren} indent={36} />
        </div>
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

function OverflowPanelStack({ items, atDepthLimit = false }: { items: INavigationMenuItem[]; atDepthLimit?: boolean }) {
    return (
        <Stack gap={2}>
            {items.map((item) => {
                const children = (item.children ?? []).filter(
                    (child) => child.page != null || child.item_type === 'external_url',
                );
                if (children.length > 0 && !atDepthLimit) {
                    return <DropdownRow key={String(item.id)} item={item} />;
                }
                return (
                    <InternalLink
                        key={String(item.id)}
                        href={getNavigationItemHref(item)}
                        aria-label={getNavigationItemAriaLabel(item)}
                        className={classes.overflowPanelLink}
                    >
                        {item.icon ? <NavIcon name={item.icon} size={16} /> : null}
                        <Text size="sm" fw={500}>
                            {getNavigationItemLabel(item)}
                        </Text>
                    </InternalLink>
                );
            })}
        </Stack>
    );
}

function MeasureNavPill({ item, withChevron = false }: { item: INavigationMenuItem; withChevron?: boolean }) {
    return (
        <span className={classes.navTrigger}>
            <NavIcon name={item.icon} size={16} />
            <Text size="sm" fw={500} span style={{ whiteSpace: 'nowrap' }}>
                {getNavigationItemLabel(item)}
            </Text>
            {withChevron ? <IconChevronDown size={14} stroke={1.75} style={{ opacity: 0.6 }} /> : null}
        </span>
    );
}

function MeasureTopRowPill({ item }: { item: INavigationMenuItem }) {
    return (
        <span className={classes.topRowLink}>
            <NavIcon name={item.icon} size={14} />
            <Text size="xs" fw={500} span style={{ whiteSpace: 'nowrap' }}>
                {getNavigationItemLabel(item)}
            </Text>
        </span>
    );
}

function DropdownPreset({ items, atDepthLimit = false }: { items: INavigationMenuItem[]; atDepthLimit?: boolean }) {
    return (
        <HeaderNavOverflow
            key={items.map((item) => item.id).join('-')}
            items={items}
            getItemKey={(item) => String(item.id)}
            measureItem={(item) => {
                const children = (item.children ?? []).filter(
                    (child) => child.page != null || child.item_type === 'external_url',
                );
                return <MeasureNavPill item={item} withChevron={children.length > 0 && !atDepthLimit} />;
            }}
            renderVisibleItems={(visibleItems) => visibleItems.map((item) => (
                <DropdownItem key={String(item.id)} item={item} atDepthLimit={atDepthLimit} />
            ))}
            renderOverflowItems={(overflowItems) => (
                <OverflowPanelStack items={[...overflowItems]} atDepthLimit={atDepthLimit} />
            )}
        />
    );
}

function SimplePreset({ items }: { items: INavigationMenuItem[] }) {
    return (
        <HeaderNavOverflow
            key={items.map((item) => item.id).join('-')}
            items={items}
            getItemKey={(item) => String(item.id)}
            measureItem={(item) => <MeasureNavPill item={item} />}
            renderVisibleItems={(visibleItems) => visibleItems.map((item) => (
                <NavTrigger key={String(item.id)} item={item} withChevron={false} />
            ))}
            renderOverflowItems={(overflowItems) => (
                <OverflowPanelStack items={[...overflowItems]} />
            )}
        />
    );
}

function TabsPreset({ items }: { items: INavigationMenuItem[] }) {
    const pathname = usePathname();
    const firstHref = items[0] ? getNavigationItemHref(items[0]) : undefined;
    const activeItem = items.find((item) => {
        const href = getNavigationItemHref(item);
        if (!href || href === '#') {
            return false;
        }
        const clean = pathname.split('#')[0].split('?')[0].replace(/\/+$/, '') || '/';
        const target = href.replace(/\/+$/, '') || '/';
        return clean === target;
    });
    const tabsValue = activeItem ? getNavigationItemHref(activeItem) : firstHref;

    return (
        <HeaderNavOverflow
            key={items.map((item) => item.id).join('-')}
            items={items}
            overflowTriggerVariant="icon"
            getItemKey={(item) => String(item.id)}
            measureItem={(item) => <MeasureNavPill item={item} />}
            renderVisibleItems={() => null}
            integrateOverflow={({ visibleItems, overflowMenu }) => (
                <Tabs value={tabsValue} variant="default">
                    <Tabs.List style={{ flexWrap: 'nowrap' }}>
                        {visibleItems.map((item) => {
                            const href = getNavigationItemHref(item);
                            return (
                                <Tabs.Tab key={String(item.id)} value={href}>
                                    <InternalLink href={href} aria-label={getNavigationItemAriaLabel(item)}>
                                        <Group gap="xs" wrap="nowrap">
                                            <NavIcon name={item.icon} />
                                            <Text size="sm">{getNavigationItemLabel(item)}</Text>
                                        </Group>
                                    </InternalLink>
                                </Tabs.Tab>
                            );
                        })}
                        {overflowMenu ? (
                            <div className={classes.tabsOverflowSlot}>{overflowMenu}</div>
                        ) : null}
                    </Tabs.List>
                </Tabs>
            )}
            renderOverflowItems={(overflowItems) => (
                <OverflowPanelStack items={[...overflowItems]} />
            )}
        />
    );
}

/** One cell of the mega menu grid: tinted icon tile + title + description,
    plus indented grandchild links when the menu depth allows them. */
function MegaMenuCell({ item }: { item: INavigationMenuItem }) {
    const grandchildren = navigableChildren(item);
    return (
        <div>
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
            <SubLinkList items={grandchildren} indent={62} />
        </div>
    );
}

function MegaMenuItem({ item, atDepthLimit = false }: { item: INavigationMenuItem; atDepthLimit?: boolean }) {
    const children = (item.children ?? []).filter(
        (child) => child.page != null || child.item_type === 'external_url',
    );
    if (children.length === 0 || atDepthLimit) {
        return <DropdownItem item={item} atDepthLimit={atDepthLimit} />;
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
}

function MegaMenuPreset({ items, atDepthLimit = false }: { items: INavigationMenuItem[]; atDepthLimit?: boolean }) {
    return (
        <HeaderNavOverflow
            key={items.map((item) => item.id).join('-')}
            items={items}
            getItemKey={(item) => String(item.id)}
            measureItem={(item) => {
                const children = (item.children ?? []).filter(
                    (child) => child.page != null || child.item_type === 'external_url',
                );
                return <MeasureNavPill item={item} withChevron={children.length > 0 && !atDepthLimit} />;
            }}
            renderVisibleItems={(visibleItems) => visibleItems.map((item) => (
                <MegaMenuItem key={String(item.id)} item={item} atDepthLimit={atDepthLimit} />
            ))}
            renderOverflowItems={(overflowItems) => (
                <OverflowPanelStack items={[...overflowItems]} atDepthLimit={atDepthLimit} />
            )}
        />
    );
}

function TopRowLink({ item }: { item: INavigationMenuItem }) {
    return (
        <InternalLink
            href={getNavigationItemHref(item)}
            aria-label={getNavigationItemAriaLabel(item)}
            className={classes.topRowLink}
        >
            <NavIcon name={item.icon} size={14} />
            <Text size="xs" fw={500} span style={{ whiteSpace: 'nowrap' }}>
                {getNavigationItemLabel(item)}
            </Text>
        </InternalLink>
    );
}

function TopRow({ items, utilitySlot }: { items: INavigationMenuItem[]; utilitySlot?: ReactNode }) {
    if (items.length === 0 && !utilitySlot) {
        return null;
    }

    return (
        <Group justify="space-between" gap="md" wrap="nowrap" w="100%" align="center">
            {items.length > 0 ? (
                <Box component="span" style={{ flex: '1 1 0', minWidth: 0 }}>
                    <HeaderNavOverflow
                        key={items.map((item) => item.id).join('-')}
                        items={items}
                        gap={2}
                        className={classes.topRowOverflow}
                        getItemKey={(item) => String(item.id)}
                        measureItem={(item) => <MeasureTopRowPill item={item} />}
                        renderVisibleItems={(visibleItems) => (
                            <Group
                                gap={2}
                                wrap="nowrap"
                                component="nav"
                                aria-label="Secondary navigation"
                                style={{ minWidth: 0 }}
                            >
                                {visibleItems.map((item) => (
                                    <TopRowLink key={String(item.id)} item={item} />
                                ))}
                            </Group>
                        )}
                        renderOverflowItems={(overflowItems) => (
                            <Stack gap={2}>
                                {overflowItems.map((item) => (
                                    <InternalLink
                                        key={String(item.id)}
                                        href={getNavigationItemHref(item)}
                                        aria-label={getNavigationItemAriaLabel(item)}
                                        className={classes.overflowPanelLink}
                                    >
                                        {item.icon ? <NavIcon name={item.icon} size={14} /> : null}
                                        <Text size="sm" fw={500}>
                                            {getNavigationItemLabel(item)}
                                        </Text>
                                    </InternalLink>
                                ))}
                            </Stack>
                        )}
                    />
                </Box>
            ) : (
                <span />
            )}
            <Group justify="flex-end" gap="md" wrap="nowrap" style={{ flexShrink: 0 }}>
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
            <nav aria-label="Main navigation" style={{ flex: '1 1 0', minWidth: 0, width: '100%', display: 'flex' }}>
                {mainNav}
            </nav>
        );
    }

    const { top, main } = splitHeaderLayers(items);
    const mainNav = renderInnerPreset(innerPreset, main, atDepthLimit);

    return (
        <Stack gap={4} style={{ flex: 1, minWidth: 0, width: '100%' }}>
            <TopRow items={top} utilitySlot={utilitySlot} />
            <Divider />
            <nav aria-label="Main navigation" style={{ minWidth: 0, width: '100%', display: 'flex' }}>
                {mainNav}
            </nav>
        </Stack>
    );
}

export { WEB_HEADER_PRESET_OPTIONS };
