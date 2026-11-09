/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
'use client';

import { useMemo, type ReactNode } from 'react';
import {
    Box,
    Breadcrumbs,
    Flex,
    Group,
    ScrollArea,
    Stack,
    Text,
} from '@mantine/core';
import { IconArrowLeft, IconArrowRight, IconChevronRight } from '@tabler/icons-react';
import {
    type IBranchNavContext,
    type IBranchNavSegment,
    type IBreadcrumbEntry,
    type INavigationPayload,
    resolveWebBranchNavContext,
} from '../../../../shared';
import { InternalLink } from '../../shared';
import { IconComponent } from '../../shared/common';
import classes from './BranchNavigation.module.css';

interface IBranchNavigationProps {
    navigation: INavigationPayload | null | undefined;
    currentPageId: number;
    children: ReactNode;
}

function segmentHref(segment: IBranchNavSegment): string {
    if (segment.url && segment.url !== '') {
        return segment.url.startsWith('/') ? segment.url : `/${segment.url}`;
    }
    return segment.keyword === 'home' ? '/' : `/${segment.keyword}`;
}

function BranchBreadcrumbs({ breadcrumbs }: { breadcrumbs: IBreadcrumbEntry[] }) {
    return (
        <Breadcrumbs
            separator={<IconChevronRight size={13} stroke={1.75} style={{ opacity: 0.45 }} />}
            separatorMargin={6}
            mb="md"
        >
            {breadcrumbs.map((crumb, index) => {
                const isLast = index === breadcrumbs.length - 1;
                if (isLast || !crumb.url) {
                    return (
                        <Text key={`${crumb.label}-${index}`} size="sm" c={isLast ? undefined : 'dimmed'} fw={isLast ? 600 : 400}>
                            {crumb.label}
                        </Text>
                    );
                }
                return (
                    <InternalLink key={`${crumb.label}-${index}`} href={crumb.url} className={classes.crumbLink}>
                        {crumb.label}
                    </InternalLink>
                );
            })}
        </Breadcrumbs>
    );
}

/** Prev/next neighbour pager: arrow + neighbour page title (already language-resolved). */
function BranchPager({ pager }: { pager: IBranchNavContext['pager'] }) {
    if (!pager.prev && !pager.next) {
        return null;
    }
    return (
        <Group justify="space-between" mt="xl" wrap="nowrap" gap="md" className={classes.pagerRow}>
            {pager.prev ? (
                <InternalLink href={segmentHref(pager.prev)} className={classes.pagerCard} aria-label={`Previous: ${pager.prev.label}`}>
                    <IconArrowLeft size={18} stroke={1.75} style={{ flexShrink: 0, opacity: 0.7 }} />
                    <Stack gap={1} style={{ minWidth: 0 }}>
                        <Text size="xs" c="dimmed">Previous</Text>
                        <Text size="sm" fw={500} lineClamp={1}>
                            {pager.prev.label}
                        </Text>
                    </Stack>
                </InternalLink>
            ) : (
                <span />
            )}
            {pager.next ? (
                <InternalLink
                    href={segmentHref(pager.next)}
                    className={classes.pagerCard}
                    aria-label={`Next: ${pager.next.label}`}
                    style={{ marginLeft: 'auto', justifyContent: 'flex-end' }}
                >
                    <Stack gap={1} align="flex-end" style={{ minWidth: 0 }}>
                        <Text size="xs" c="dimmed">Next</Text>
                        <Text size="sm" fw={500} lineClamp={1}>
                            {pager.next.label}
                        </Text>
                    </Stack>
                    <IconArrowRight size={18} stroke={1.75} style={{ flexShrink: 0, opacity: 0.7 }} />
                </InternalLink>
            ) : (
                <span />
            )}
        </Group>
    );
}

function PillStrip({ segments, currentPageId }: { segments: IBranchNavSegment[]; currentPageId: number }) {
    return (
        <ScrollArea type="never">
            <Group gap={8} wrap="nowrap" py={4}>
                {segments.map((segment) => (
                    <InternalLink
                        key={segment.pageId}
                        href={segmentHref(segment)}
                        className={classes.pill}
                        data-active={segment.pageId === currentPageId || undefined}
                    >
                        {segment.icon ? <IconComponent iconName={segment.icon} size={14} /> : null}
                        <Text size="sm" span fw="inherit">
                            {segment.label}
                        </Text>
                    </InternalLink>
                ))}
            </Group>
        </ScrollArea>
    );
}

function SidebarNav({ context, currentPageId }: { context: IBranchNavContext; currentPageId: number }) {
    return (
        <Stack gap={4} className={classes.sidebar}>
            {context.heading ? (
                <Text size="xs" fw={700} tt="uppercase" c="dimmed" px={10} pb={4} lts="0.06em">
                    {context.heading}
                </Text>
            ) : null}
            {context.segments.map((segment) => {
                const href = segmentHref(segment);
                return (
                    <InternalLink
                        key={segment.pageId}
                        href={href}
                        className={classes.sideLink}
                        data-active={segment.pageId === currentPageId || undefined}
                    >
                        <Group gap={8} wrap="nowrap">
                            {segment.icon ? <IconComponent iconName={segment.icon} size={16} /> : null}
                            <Text size="sm" span fw="inherit" lineClamp={1} className={classes.sideLinkLabel}>
                                {segment.label}
                            </Text>
                        </Group>
                        <span className={classes.sideLinkPath}>{href}</span>
                    </InternalLink>
                );
            })}
        </Stack>
    );
}

/**
 * Branch layout for pages that live inside a menu branch (parent with
 * children). Presentation is controlled by the CMS: the menu-level
 * `children_nav` default plus the per-parent-item override, and the
 * menu-level `show_breadcrumbs` toggle.
 *
 * - `sidebar`: sticky left sidebar with the sibling group (pill strip on
 *   small screens), breadcrumbs above the content, prev/next pager below.
 * - `pills`: horizontal pill strip above the content + breadcrumbs + pager.
 * - `none`: content only (breadcrumbs still honoured when enabled).
 *
 * Pages outside any branch (top-level leaves) render their content untouched.
 */
export function BranchNavigation({ navigation, currentPageId, children }: IBranchNavigationProps) {
    const context = useMemo(
        () => (navigation ? resolveWebBranchNavContext(navigation, currentPageId) : null),
        [navigation, currentPageId],
    );

    if (!context) {
        return <>{children}</>;
    }

    const crumbs = context.showBreadcrumbs && context.breadcrumbs.length > 1
        ? <BranchBreadcrumbs breadcrumbs={context.breadcrumbs} />
        : null;
    const pagerEl = context.showPager ? <BranchPager pager={context.pager} /> : null;

    if (context.mode === 'none') {
        if (!crumbs) {
            return <>{children}</>;
        }
        return (
            <Box px="md" pt="md">
                {crumbs}
                {children}
            </Box>
        );
    }

    if (context.mode === 'pills') {
        return (
            <Box px="md" pt="sm" pb="md">
                <PillStrip segments={context.segments} currentPageId={currentPageId} />
                <Box mt="sm">
                    {crumbs}
                    {children}
                    {pagerEl}
                </Box>
            </Box>
        );
    }

    // sidebar mode
    return (
        <Box px="md" py="md">
            {/* Small screens: fall back to the pill strip. */}
            <Box hiddenFrom="md" mb="sm">
                <PillStrip segments={context.segments} currentPageId={currentPageId} />
            </Box>
            <Flex gap="lg" align="stretch">
                {/* The rail lives on the column so it spans the full content
                    height; the nav itself stays sticky inside it. */}
                <Box
                    component="aside"
                    w={250}
                    visibleFrom="md"
                    className={classes.sidebarRail}
                    style={{ flexShrink: 0 }}
                >
                    <Box
                        style={{
                            position: 'sticky',
                            top: 'calc(var(--app-shell-header-height, 60px) + 16px)',
                        }}
                    >
                        <SidebarNav context={context} currentPageId={currentPageId} />
                    </Box>
                </Box>
                <Box style={{ flex: 1, minWidth: 0 }}>
                    {crumbs}
                    {children}
                    {pagerEl}
                </Box>
            </Flex>
        </Box>
    );
}
