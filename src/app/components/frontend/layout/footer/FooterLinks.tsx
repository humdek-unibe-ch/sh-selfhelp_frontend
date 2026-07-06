/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
'use client';

import { Anchor, Group, SimpleGrid, Stack, Text } from '@mantine/core';
import {
    type INavigationMenu,
    type INavigationMenuItem,
    flattenFooterItems,
    footerColumnItems,
    footerGroupLinks,
    footerStandaloneItems,
    getNavigationItemHref,
    getNavigationItemKeyword,
    getNavigationItemLabel,
    resolveWebFooterPreset,
} from '../../../../../shared';
import { usePagePrefetch } from '../../../../../hooks/usePagePrefetch';
import { InternalLink } from '../../../shared';

interface IFooterLinkProps {
    item: INavigationMenuItem;
    createHoverPrefetch: (keyword: string) => (() => void) | undefined;
}

function FooterLink({ item, createHoverPrefetch }: IFooterLinkProps): React.ReactElement | null {
    if (!item.is_active) {
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
    group: INavigationMenuItem;
    createHoverPrefetch: (keyword: string) => (() => void) | undefined;
}

function FooterColumn({ group, createHoverPrefetch }: IFooterColumnProps): React.ReactElement {
    return (
        <Stack gap="xs" align="flex-start">
            <Text fw={600} size="sm" aria-label={group.aria_label?.trim() || getNavigationItemLabel(group)}>
                {getNavigationItemLabel(group)}
            </Text>
            {group.description ? (
                <Text size="xs" c="dimmed">{group.description}</Text>
            ) : null}
            <Stack gap={4} align="flex-start">
                {footerGroupLinks(group).map((child) => (
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

/**
 * Renders the global `web_footer` menu using its preset:
 * `columns` — group headings become columns, standalone links form a trailing
 * meta row; `inline` — one flat centered link row (groups flattened at render
 * time only, so switching presets never mutates menu data).
 */
export function FooterLinks({ footerMenu }: { footerMenu: INavigationMenu | null }): React.ReactElement | null {
    const { createHoverPrefetch } = usePagePrefetch();
    const items = footerMenu?.items ?? [];
    const preset = resolveWebFooterPreset(footerMenu?.preset);

    if (preset === 'inline') {
        const links = flattenFooterItems(items);
        if (links.length === 0) {
            return null;
        }
        return (
            <Group gap="lg" wrap="wrap" justify="center">
                {links.map((item) => (
                    <FooterLink key={String(item.id)} item={item} createHoverPrefetch={createHoverPrefetch} />
                ))}
            </Group>
        );
    }

    const columns = footerColumnItems(items);
    const standalone = footerStandaloneItems(items);
    if (columns.length === 0 && standalone.length === 0) {
        return null;
    }

    return (
        <Stack gap="lg" w="100%">
            {columns.length > 0 ? (
                <SimpleGrid cols={{ base: 1, xs: 2, md: Math.max(Math.min(columns.length, 4), 1) }} spacing="lg" w="100%">
                    {columns.map((group) => (
                        <FooterColumn
                            key={String(group.id)}
                            group={group}
                            createHoverPrefetch={createHoverPrefetch}
                        />
                    ))}
                </SimpleGrid>
            ) : null}
            {standalone.length > 0 ? (
                <Group gap="lg" wrap="wrap" justify="center">
                    {standalone.map((item) => (
                        <FooterLink key={String(item.id)} item={item} createHoverPrefetch={createHoverPrefetch} />
                    ))}
                </Group>
            ) : null}
        </Stack>
    );
}
