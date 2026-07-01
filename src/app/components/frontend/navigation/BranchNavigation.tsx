/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
'use client';

import { Group, ScrollArea, Tabs, Text, UnstyledButton, useMantineTheme } from '@mantine/core';
import { useMemo } from 'react';
import {
    type INavigationPayload,
    resolveWebBranchNavGroup,
} from '../../../../shared';
import { InternalLink } from '../../shared';
import { IconComponent } from '../../shared/common';

interface IBranchNavigationProps {
    navigation: INavigationPayload | null | undefined;
    currentPageId: number;
    compact?: boolean;
}

function segmentHref(segment: { url: string | null; keyword: string }): string {
    return segment.url ?? (segment.keyword === 'home' ? '/' : `/${segment.keyword}`);
}

/**
 * In-page sibling/child navigation derived from resolved web menus.
 */
export function BranchNavigation({ navigation, currentPageId, compact = false }: IBranchNavigationProps) {
    const theme = useMantineTheme();
    const segments = useMemo(
        () => (navigation ? resolveWebBranchNavGroup(navigation, currentPageId) : null),
        [navigation, currentPageId],
    );

    if (!segments || segments.length === 0) {
        return null;
    }

    const activeBackground = theme.colors[theme.primaryColor][theme.primaryShade as number] ?? theme.colors.blue[6];
    const inactiveBackground = theme.colors.gray[1];
    const activeTextColor = theme.white;

    if (compact) {
        return (
            <ScrollArea type="auto" offsetScrollbars>
                <Group gap="xs" py="xs" px="md" wrap="nowrap">
                    {segments.map((segment) => {
                        const href = segmentHref(segment);
                        const active = segment.pageId === currentPageId;
                        return (
                            <InternalLink key={segment.pageId} href={href}>
                                <UnstyledButton
                                    px="sm"
                                    py={6}
                                    style={{
                                        borderRadius: theme.radius.xl,
                                        background: active ? activeBackground : inactiveBackground,
                                    }}
                                >
                                    <Group gap={6} wrap="nowrap">
                                        {segment.icon ? <IconComponent iconName={segment.icon} size={14} /> : null}
                                        <Text size="sm" c={active ? activeTextColor : undefined} fw={active ? 600 : 500}>
                                            {segment.label}
                                        </Text>
                                    </Group>
                                </UnstyledButton>
                            </InternalLink>
                        );
                    })}
                </Group>
            </ScrollArea>
        );
    }

    const activeHref = segments.find((s) => s.pageId === currentPageId)?.url
        ?? segments[0]?.url
        ?? '/';

    return (
        <Tabs value={activeHref} variant="outline" color={theme.primaryColor}>
            <Tabs.List>
                {segments.map((segment) => {
                    const href = segmentHref(segment);
                    return (
                        <Tabs.Tab key={segment.pageId} value={href}>
                            <InternalLink href={href}>
                                <Text size="sm">{segment.label}</Text>
                            </InternalLink>
                        </Tabs.Tab>
                    );
                })}
            </Tabs.List>
        </Tabs>
    );
}
