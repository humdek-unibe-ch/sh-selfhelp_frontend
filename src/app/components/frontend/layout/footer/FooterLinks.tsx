/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
'use client';

import { Anchor, Group, SimpleGrid, Stack, Text } from '@mantine/core';
import {
    type INavigationMenu,
    type INavigationMenuItem,
    getNavigationItemHref,
    getNavigationItemKeyword,
    getNavigationItemLabel,
} from '../../../../../shared';
import { usePagePrefetch } from '../../../../../hooks/usePagePrefetch';
import { InternalLink } from '../../../shared';

function isActiveItem(item: INavigationMenuItem): boolean {
    return item.is_active !== false;
}

function hasRenderableFooterChildren(item: INavigationMenuItem): boolean {
    return (item.children ?? []).some(
        (child) => isActiveItem(child) && (child.item_type === 'page' || child.item_type === 'external_url'),
    );
}

function shouldRenderFooterColumn(item: INavigationMenuItem): boolean {
    if (!isActiveItem(item)) {
        return false;
    }
    if (item.item_type === 'group') {
        return hasRenderableFooterChildren(item);
    }
    if (item.item_type === 'external_url') {
        return Boolean(item.external_url);
    }
    if (item.item_type === 'page') {
        return item.page != null;
    }
    return hasRenderableFooterChildren(item);
}

interface IFooterLinkProps {
    item: INavigationMenuItem;
    createHoverPrefetch: (keyword: string) => (() => void) | undefined;
}

function FooterLink({ item, createHoverPrefetch }: IFooterLinkProps): React.ReactElement | null {
    if (!isActiveItem(item)) {
        return null;
    }

    const label = getNavigationItemLabel(item);
    const ariaLabel = item.aria_label?.trim() || label;

    if (item.item_type === 'external_url' && item.external_url) {
        return (
            <Anchor href={item.external_url} target="_blank" rel="noopener noreferrer" size="sm" aria-label={ariaLabel}>
                {label}
            </Anchor>
        );
    }

    if (item.item_type !== 'page' || !item.page) {
        return null;
    }

    const keyword = getNavigationItemKeyword(item);
    return (
        <InternalLink
            href={getNavigationItemHref(item)}
            onMouseEnter={keyword ? createHoverPrefetch(keyword) : undefined}
            aria-label={ariaLabel}
        >
            <Text size="sm" component="span">
                {label}
            </Text>
        </InternalLink>
    );
}

interface IFooterColumnProps {
    item: INavigationMenuItem;
    createHoverPrefetch: (keyword: string) => (() => void) | undefined;
}

function FooterColumn({ item, createHoverPrefetch }: IFooterColumnProps): React.ReactElement | null {
    const children = (item.children ?? []).filter(
        (child) => isActiveItem(child) && (child.item_type === 'page' || child.item_type === 'external_url'),
    );
    const isGroup = item.item_type === 'group' || children.length > 0;

    if (isGroup) {
        if (children.length === 0) {
            return null;
        }
        return (
            <Stack gap="xs" align="flex-start">
                <Text fw={600} size="sm" aria-label={item.aria_label?.trim() || getNavigationItemLabel(item)}>
                    {getNavigationItemLabel(item)}
                </Text>
                {item.description ? (
                    <Text size="xs" c="dimmed">{item.description}</Text>
                ) : null}
                <Stack gap={4} align="flex-start">
                    {children.map((child) => (
                        <FooterLink
                            key={String(child.id)}
                            item={child}
                            createHoverPrefetch={createHoverPrefetch}
                        />
                    ))}
                </Stack>
            </Stack>
        );
    }

    return (
        <Stack gap="xs" align="flex-start">
            <FooterLink item={item} createHoverPrefetch={createHoverPrefetch} />
        </Stack>
    );
}

export function FooterLinks({ footerMenu }: { footerMenu: INavigationMenu | null }): React.ReactElement | null {
    const { createHoverPrefetch } = usePagePrefetch();
    const items = (footerMenu?.items ?? []).filter(shouldRenderFooterColumn);
    const footerLayout = (typeof footerMenu?.config === 'object' && footerMenu?.config !== null
        ? (footerMenu.config as Record<string, unknown>).footer_layout
        : null) as string | null;
    const preset = footerLayout ?? 'columns';
    const columnCount = preset === 'inline'
        ? Math.min(items.length, 6)
        : Math.min(items.length, footerMenu?.item_limit ?? 4);

    if (items.length === 0) {
        return null;
    }

    if (preset === 'inline') {
        return (
            <Group gap="lg" wrap="wrap" justify="center">
                {items.flatMap((item) => {
                    if (item.item_type === 'group') {
                        return (item.children ?? [])
                            .filter((child) => isActiveItem(child))
                            .map((child) => (
                                <FooterLink key={String(child.id)} item={child} createHoverPrefetch={createHoverPrefetch} />
                            ));
                    }
                    return [
                        <FooterLink key={String(item.id)} item={item} createHoverPrefetch={createHoverPrefetch} />,
                    ];
                })}
            </Group>
        );
    }

    return (
        <SimpleGrid cols={{ base: 1, xs: 2, md: Math.max(columnCount, 1) }} spacing="lg" w="100%">
            {items.map((item) => (
                <FooterColumn
                    key={String(item.id)}
                    item={item}
                    createHoverPrefetch={createHoverPrefetch}
                />
            ))}
        </SimpleGrid>
    );
}
