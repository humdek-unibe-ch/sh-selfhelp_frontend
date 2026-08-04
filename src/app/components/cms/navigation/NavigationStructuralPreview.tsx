/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
'use client';

/**
 * Compact structural wireframe for one navigation menu tab.
 *
 * Shows how the CURRENT preset arranges the stored items, without leaving the
 * builder: the web header renders its top/main rows (double presets) or the
 * single merged row, the web footer renders group columns + meta row versus
 * the flat inline row, the mobile drawer a nested list, and the bottom tabs a
 * tab strip honouring `item_limit` (group holder tabs are marked — they open
 * their first child).
 *
 * @module app/components/cms/navigation/NavigationStructuralPreview
 */

import { useMemo } from 'react';
import { Badge, Box, Divider, Group, Stack, Text, Tooltip } from '@mantine/core';
import type { IAdminNavigationMenuItem } from '../../../../api/admin/navigation.api';
import type { IAdminPage } from '../../../../types/responses/admin/admin.types';
import type { TMenuKey } from './navigation-builder.constants';
import { getMenuItemDisplay } from './navigation-builder.utils';

interface INavigationStructuralPreviewProps {
    menuKey: TMenuKey;
    items: IAdminNavigationMenuItem[];
    /** Web header: double preset renders two rows (top + main). */
    layerMode?: boolean;
    /** Web footer: `columns` or `inline`. */
    footerPreset?: string | null;
    /** Mobile bottom tabs: max rendered root items. */
    itemLimit?: number | null;
    pageById: Map<number, IAdminPage>;
    resolvedLabelByItemId: Map<number, string>;
}

interface IPillProps {
    label: string;
    variant?: 'link' | 'group' | 'muted';
    suffix?: string;
    title?: string;
}

function Pill({ label, variant = 'link', suffix, title }: IPillProps): React.ReactElement {
    const badge = (
        <Badge
            variant={variant === 'group' ? 'filled' : 'light'}
            color={variant === 'group' ? 'gray' : variant === 'muted' ? 'gray' : 'blue'}
            radius="sm"
            styles={{ root: { textTransform: 'none', fontWeight: 500, maxWidth: 180 } }}
        >
            {label}
            {suffix ? ` ${suffix}` : ''}
        </Badge>
    );
    return title ? <Tooltip label={title} withArrow>{badge}</Tooltip> : badge;
}

export function NavigationStructuralPreview({
    menuKey,
    items,
    layerMode = false,
    footerPreset = null,
    itemLimit = null,
    pageById,
    resolvedLabelByItemId,
}: INavigationStructuralPreviewProps): React.ReactElement | null {
    const activeItems = useMemo(
        () => items.filter((item) => item.is_active !== false),
        [items],
    );
    const roots = useMemo(
        () => activeItems
            .filter((item) => item.parent_item_id === null)
            .sort((a, b) => a.position - b.position),
        [activeItems],
    );
    const childrenOf = useMemo(() => {
        const map = new Map<number, IAdminNavigationMenuItem[]>();
        for (const item of activeItems) {
            if (item.parent_item_id !== null) {
                const bucket = map.get(item.parent_item_id) ?? [];
                bucket.push(item);
                map.set(item.parent_item_id, bucket);
            }
        }
        for (const bucket of map.values()) {
            bucket.sort((a, b) => a.position - b.position);
        }
        return map;
    }, [activeItems]);

    if (roots.length === 0) {
        return null;
    }

    const labelOf = (item: IAdminNavigationMenuItem): string =>
        getMenuItemDisplay(item, pageById, resolvedLabelByItemId).primary;

    let body: React.ReactElement;

    if (menuKey === 'web_header') {
        const topRow = roots.filter((item) => item.layer === 'top');
        const mainRow = roots.filter((item) => item.layer !== 'top');
        const mainPills = (row: IAdminNavigationMenuItem[]) => (
            <Group gap={6} wrap="wrap">
                {row.map((item) => {
                    const childCount = childrenOf.get(item.id)?.length ?? 0;
                    return (
                        <Pill
                            key={item.id}
                            label={labelOf(item)}
                            variant={item.item_type === 'group' ? 'group' : 'link'}
                            suffix={childCount > 0 ? `▾${childCount}` : undefined}
                            title={childCount > 0 ? `${childCount} dropdown item(s)` : undefined}
                        />
                    );
                })}
            </Group>
        );
        body = layerMode ? (
            <Stack gap={6}>
                <Group gap="xs" wrap="nowrap" align="center">
                    <Text size="xs" c="dimmed" w={64} style={{ flexShrink: 0 }}>Top row</Text>
                    {topRow.length > 0 ? (
                        <Group gap={6} wrap="wrap">
                            {topRow.map((item) => <Pill key={item.id} label={labelOf(item)} variant="muted" />)}
                        </Group>
                    ) : (
                        <Text size="xs" c="dimmed" fs="italic">empty — assign items to the top row</Text>
                    )}
                </Group>
                <Divider />
                <Group gap="xs" wrap="nowrap" align="center">
                    <Text size="xs" c="dimmed" w={64} style={{ flexShrink: 0 }}>Main row</Text>
                    {mainPills(mainRow)}
                </Group>
            </Stack>
        ) : (
            <Group gap="xs" wrap="nowrap" align="center">
                <Text size="xs" c="dimmed" w={64} style={{ flexShrink: 0 }}>One row</Text>
                {/* Single presets append top-row assignments after the main items. */}
                {mainPills([...mainRow, ...roots.filter((item) => item.layer === 'top')])}
            </Group>
        );
    } else if (menuKey === 'web_footer') {
        const groups = roots.filter((item) => item.item_type === 'group');
        const standalone = roots.filter((item) => item.item_type !== 'group');
        body = footerPreset === 'inline' ? (
            <Group gap={6} wrap="wrap">
                {/* Inline preset flattens group children into the single row; headings are hidden. */}
                {roots.flatMap((item) => (item.item_type === 'group'
                    ? (childrenOf.get(item.id) ?? [])
                    : [item]
                )).map((item) => <Pill key={item.id} label={labelOf(item)} />)}
            </Group>
        ) : (
            <Stack gap={8}>
                {groups.length > 0 ? (
                    <Group gap="lg" align="flex-start" wrap="wrap">
                        {groups.map((group) => (
                            <Stack key={group.id} gap={4}>
                                <Text size="xs" fw={700}>{labelOf(group)}</Text>
                                {(childrenOf.get(group.id) ?? []).map((child) => (
                                    <Pill key={child.id} label={labelOf(child)} />
                                ))}
                            </Stack>
                        ))}
                    </Group>
                ) : null}
                {standalone.length > 0 ? (
                    <>
                        <Divider />
                        <Group gap={6} wrap="wrap">
                            <Text size="xs" c="dimmed">Meta row</Text>
                            {standalone.map((item) => <Pill key={item.id} label={labelOf(item)} />)}
                        </Group>
                    </>
                ) : null}
            </Stack>
        );
    } else if (menuKey === 'mobile_bottom_tabs') {
        const limit = itemLimit ?? roots.length;
        const shown = roots.slice(0, limit);
        const hidden = roots.slice(limit);
        // Opening a tab that has children shows them as a strip along the TOP of
        // the screen, so the app displays two tab rows at once. Preview both,
        // otherwise the flat row implies the children are simply dropped.
        const tabsWithChildren = shown.filter((item) => (childrenOf.get(item.id) ?? []).length > 0);
        const tabRow = (
            <Group gap={6} wrap="wrap">
                {shown.map((item) => {
                    const firstChild = (childrenOf.get(item.id) ?? [])[0];
                    const isHolder = item.item_type === 'group' && firstChild != null;
                    return (
                        <Pill
                            key={item.id}
                            label={labelOf(item)}
                            variant={item.item_type === 'group' ? 'group' : 'link'}
                            suffix={isHolder ? `→ ${labelOf(firstChild)}` : undefined}
                            title={isHolder ? 'Holder tab — opens its first child page' : undefined}
                        />
                    );
                })}
                {hidden.map((item) => (
                    <Pill
                        key={item.id}
                        label={labelOf(item)}
                        variant="muted"
                        title="Over the tab limit — not rendered"
                    />
                ))}
            </Group>
        );
        body = tabsWithChildren.length === 0 ? tabRow : (
            <Stack gap={6}>
                {tabsWithChildren.map((item) => (
                    <Group key={item.id} gap={6} wrap="nowrap" align="flex-start">
                        <Text size="xs" c="dimmed" w={92} style={{ flexShrink: 0 }}>
                            Top tabs
                        </Text>
                        <Group gap={6} wrap="wrap">
                            {(childrenOf.get(item.id) ?? []).map((child) => (
                                <Pill
                                    key={child.id}
                                    label={labelOf(child)}
                                    title={`Shown at the top of the screen while the "${labelOf(item)}" tab is open`}
                                />
                            ))}
                        </Group>
                    </Group>
                ))}
                <Group gap={6} wrap="nowrap" align="flex-start">
                    <Text size="xs" c="dimmed" w={92} style={{ flexShrink: 0 }}>
                        Tab bar
                    </Text>
                    {tabRow}
                </Group>
            </Stack>
        );
    } else {
        // mobile_drawer: nested list.
        body = (
            <Stack gap={2}>
                {roots.map((item) => (
                    <Box key={item.id}>
                        <Pill label={labelOf(item)} variant={item.item_type === 'group' ? 'group' : 'link'} />
                        {(childrenOf.get(item.id) ?? []).map((child) => (
                            <Box key={child.id} ml="lg" mt={2}>
                                <Pill label={labelOf(child)} />
                            </Box>
                        ))}
                    </Box>
                ))}
            </Stack>
        );
    }

    return (
        <Box
            mt="sm"
            p="sm"
            style={{
                border: '1px dashed var(--mantine-color-gray-4)',
                borderRadius: 'var(--mantine-radius-md)',
            }}
        >
            <Text size="xs" c="dimmed" mb={6} fw={600}>Structural preview</Text>
            {body}
        </Box>
    );
}
