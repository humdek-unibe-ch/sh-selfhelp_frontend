/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
'use client';

import { useMemo, useState } from 'react';
import {
    Badge,
    Card,
    Group,
    ScrollArea,
    Table,
    Tabs,
    Text,
    TextInput,
    Title,
} from '@mantine/core';
import { IconSearch } from '@tabler/icons-react';
import type { IAboutItem, IPlatformAbout } from '../../../../shared';
import { type IVersionStyle } from '../../../../types/common/styles.types';
import { WEB_LIBRARIES } from '../../../../utils/web-libraries.utils';

interface IVersionStyleProps {
    style: IVersionStyle;
    cssClass: string;
}

interface IAboutGroup {
    key: string;
    heading: string;
    items: readonly IAboutItem[];
}

/** Case-insensitive substring match on name and licence. */
export function filterAboutItems(items: readonly IAboutItem[], query: string): IAboutItem[] {
    const needle = query.trim().toLowerCase();
    if (!needle) {
        return [...items];
    }
    return items.filter((item) => {
        const name = item.name.toLowerCase();
        const license = (item.license ?? '').toLowerCase();
        return name.includes(needle) || license.includes(needle);
    });
}

/**
 * "About this platform": one designed card with tabs per non-empty group and a
 * filter. Facts come from `style.about` (server) plus the website's generated
 * list. Exact versions (except the SelfHelp product version) only when
 * `about.detail` is true. Every label is a translatable style field.
 */
const VersionStyle: React.FC<IVersionStyleProps> = ({ style, cssClass }) => {
    const about: IPlatformAbout | undefined = style.about;
    const [filter, setFilter] = useState('');

    const groups = useMemo((): IAboutGroup[] => {
        if (!about) {
            return [];
        }
        const showVersions = about.detail === true;
        const withVersions = (items: readonly IAboutItem[]): IAboutItem[] =>
            items.map((item) => ({ ...item, version: showVersions ? item.version : null }));

        const candidates: Array<{ key: string; heading: string | undefined; items: readonly IAboutItem[] }> = [
            { key: 'frameworks', heading: style.label_frameworks?.content, items: about.frameworks },
            { key: 'plugins', heading: style.label_plugins?.content, items: about.plugins },
            { key: 'libraries', heading: style.label_libraries?.content, items: about.libraries },
            { key: 'web', heading: style.label_web?.content, items: WEB_LIBRARIES },
        ];

        return candidates
            .filter((group) => group.items.length > 0)
            .map((group) => ({
                key: group.key,
                heading: group.heading ?? '',
                items: withVersions(group.items),
            }));
    }, [about, style.label_frameworks?.content, style.label_plugins?.content, style.label_libraries?.content, style.label_web?.content]);

    const [activeTab, setActiveTab] = useState<string | null>(null);
    const currentTab = activeTab && groups.some((group) => group.key === activeTab) ? activeTab : (groups[0]?.key ?? null);
    const activeGroup = groups.find((group) => group.key === currentTab) ?? null;
    const visibleItems = activeGroup ? filterAboutItems(activeGroup.items, filter) : [];

    if (!about) {
        return null;
    }

    const title = style.title?.content;
    const filterLabel = style.label_filter?.content;
    const noMatch = style.label_no_match?.content;
    const productLabel = `${about.product.name} ${about.product.version}`;

    return (
        <Card withBorder padding="lg" radius="md" className={cssClass}>
            <Group justify="space-between" align="flex-start" gap="sm" mb="md" wrap="wrap">
                {title ? (
                    <Title order={2} size="h3">
                        {title}
                    </Title>
                ) : (
                    <span />
                )}
                <Badge size="lg" variant="light">
                    {productLabel}
                </Badge>
            </Group>

            {groups.length === 0 ? null : (
                <>
                    {filterLabel ? (
                        <TextInput
                            mb="sm"
                            value={filter}
                            onChange={(event) => setFilter(event.currentTarget.value)}
                            placeholder={filterLabel}
                            aria-label={filterLabel}
                            leftSection={<IconSearch size={16} aria-hidden />}
                        />
                    ) : null}

                    <Tabs
                        value={currentTab}
                        onChange={setActiveTab}
                        variant="outline"
                    >
                        <Tabs.List style={{ flexWrap: 'nowrap', overflowX: 'auto' }}>
                            {groups.map((group) => (
                                <Tabs.Tab key={group.key} value={group.key}>
                                    {group.heading ? `${group.heading} (${group.items.length})` : `(${group.items.length})`}
                                </Tabs.Tab>
                            ))}
                        </Tabs.List>

                        {groups.map((group) => (
                            <Tabs.Panel key={group.key} value={group.key} pt="sm">
                                {group.key !== currentTab ? null : visibleItems.length === 0 ? (
                                    noMatch ? <Text c="dimmed" size="sm">{noMatch}</Text> : null
                                ) : (
                                    <ScrollArea.Autosize mah={320} type="auto" offsetScrollbars>
                                        <Table striped highlightOnHover verticalSpacing="xs" horizontalSpacing="sm">
                                            <Table.Tbody>
                                                {visibleItems.map((item) => (
                                                    <Table.Tr key={item.name}>
                                                        <Table.Td>{item.name}</Table.Td>
                                                        <Table.Td>
                                                            {item.license ? (
                                                                <Badge size="sm" variant="light">
                                                                    {item.license}
                                                                </Badge>
                                                            ) : null}
                                                        </Table.Td>
                                                        <Table.Td>
                                                            {item.version ? (
                                                                <Text ff="monospace" size="sm" c="dimmed">
                                                                    {item.version}
                                                                </Text>
                                                            ) : null}
                                                        </Table.Td>
                                                    </Table.Tr>
                                                ))}
                                            </Table.Tbody>
                                        </Table>
                                    </ScrollArea.Autosize>
                                )}
                            </Tabs.Panel>
                        ))}
                    </Tabs>
                </>
            )}
        </Card>
    );
};

export default VersionStyle;
