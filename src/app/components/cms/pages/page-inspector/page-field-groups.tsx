/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
'use client';

import React, { useMemo } from 'react';
import {
    Paper,
    Stack,
    Text,
    Group,
    Box,
    Checkbox,
    ActionIcon,
    Tooltip,
    Badge,
    SegmentedControl,
    Alert,
    Button,
    Menu,
} from '@mantine/core';
import { IconInfoCircle, IconWorld, IconLayoutDashboard, IconChevronDown } from '@tabler/icons-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AdminNavigationApi } from '../../../../../api/admin/navigation.api';
import { REACT_QUERY_CONFIG } from '../../../../../config/react-query.config';
import { invalidateAdminNavigationQueries } from '../../../../../utils/admin-navigation-cache.utils';
import type { IAdminPage, INavigationMembershipBadge } from '../../../../../types/responses/admin/admin.types';
import { usePageFormStore } from '../../../../store/pageFormStore';
import { LockedField } from '../../ui/locked-field/LockedField';
import { FieldLabelWithTooltip } from '../../ui/field-label-with-tooltip/FieldLabelWithTooltip';
import { PagePropertyField } from './page-field-connectors';
import { type IPageField } from '../../../../../types/common/pages.type';
import { usePageSections } from '../../../../../hooks/usePageDetails';
import { useAdminPages } from '../../../../../hooks/useAdminPages';
import { useCanUpdateNavigation } from '../../../../../hooks/usePermissionChecks';
import styles from './PageInspector.module.css';

// ==================== Page Info Panel ====================

interface IPageInfoPanelProps {
    page: IAdminPage;
    pageId?: number;
    isConfigurationPage: boolean;
}

export const PageInfoPanel = React.memo(function PageInfoPanel({
    page,
    pageId,
    isConfigurationPage
}: IPageInfoPanelProps) {
    return (
        <Paper withBorder style={{ backgroundColor: 'light-dark(var(--mantine-color-blue-0), var(--mantine-color-blue-9))' }}>
            <Box p="md">
                <Group gap="xs" mb="sm">
                    <IconInfoCircle size={16} style={{ color: 'var(--mantine-color-blue-6)' }} />
                    <Text size="sm" fw={500} c="blue">Page Information</Text>
                </Group>

                <Stack gap="xs">
                    <Group gap="md" wrap="wrap">
                        <Box>
                            <Text size="xs" fw={500} c="dimmed">Keyword</Text>
                            <Text size="sm" style={{ fontFamily: 'monospace', color: 'var(--mantine-color-text)' }}>{page.keyword}</Text>
                        </Box>
                        <Box>
                            <Text size="xs" fw={500} c="dimmed">URL</Text>
                            <Text size="sm" style={{ fontFamily: 'monospace', color: 'var(--mantine-color-text)' }}>{page.url}</Text>
                        </Box>
                        <Box>
                            <Text size="xs" fw={500} c="dimmed">Page ID</Text>
                            <Text size="sm" style={{ color: 'var(--mantine-color-text)' }}>{pageId || page.id_pages}</Text>
                        </Box>
                    </Group>

                    <Group gap="xs" mt="xs">
                        {isConfigurationPage && (
                            <Badge color="purple" variant="light" size="sm">
                                Configuration Page
                            </Badge>
                        )}
                        {page.is_headless && (
                            <Badge color="orange" variant="light" size="sm">
                                Headless
                            </Badge>
                        )}
                        {page.id_parent_page !== null && (
                            <Badge color="green" variant="light" size="sm">
                                Child Page
                            </Badge>
                        )}
                    </Group>
                </Stack>
            </Box>
        </Paper>
    );
});

// ==================== Basic Info Fields (Keyword + URL) ====================

export const PageBasicInfoFields = React.memo(function PageBasicInfoFields() {
    const keyword = usePageFormStore((state) => state.keyword);
    const url = usePageFormStore((state) => state.url);
    const setKeyword = usePageFormStore((state) => state.setKeyword);
    const setUrl = usePageFormStore((state) => state.setUrl);

    return (
        <Paper p="md" withBorder>
            <Stack gap="md">
                <Text size="sm" fw={500} c="blue">Basic Information</Text>
                <LockedField
                    label={
                        <FieldLabelWithTooltip
                            label="Keyword"
                            tooltip="Unique identifier for the page. Used in URLs and internal references. Cannot contain spaces or special characters."
                        />
                    }
                    value={keyword}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setKeyword(e.currentTarget.value)}
                    lockedTooltip="Enable keyword editing"
                    unlockedTooltip="Lock keyword editing"
                />

                <LockedField
                    label={
                        <FieldLabelWithTooltip
                            label="URL"
                            tooltip="The web address path for this page. Should start with / and be user-friendly."
                        />
                    }
                    value={url}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUrl(e.currentTarget.value)}
                    lockedTooltip="Enable URL editing"
                    unlockedTooltip="Lock URL editing"
                />
            </Stack>
        </Paper>
    );
});

// ==================== Page Access Type Radio ====================

interface IPageAccessTypeGroupProps {
    options: Array<{ lookupCode: string; lookupValue: string }>;
}

export const PageAccessTypeGroup = React.memo(function PageAccessTypeGroup({
    options
}: IPageAccessTypeGroupProps) {
    const pageAccessType = usePageFormStore((state) => state.pageAccessType);
    const setPageAccessType = usePageFormStore((state) => state.setPageAccessType);

    if (options.length === 0) return null;

    return (
        <Paper p="md" withBorder>
            <Stack gap="md">
                <FieldLabelWithTooltip
                    label="Page Access Type"
                    tooltip="Controls who can access this page - web only, mobile only, or both platforms"
                />
                <Stack gap="xs">
                    {options.map((type) => {
                        const id = `pageAccessType-${type.lookupCode}`;
                        return (
                            <Group key={type.lookupCode} gap="xs" align="center">
                                <input
                                    id={id}
                                    type="radio"
                                    name="pageAccessType"
                                    value={type.lookupCode}
                                    checked={pageAccessType === type.lookupCode}
                                    onChange={() => setPageAccessType(type.lookupCode)}
                                    className="cursor-pointer"
                                />
                                <label htmlFor={id} className="cursor-pointer">
                                    <Text size="sm">{type.lookupValue}</Text>
                                </label>
                            </Group>
                        );
                    })}
                </Stack>
            </Stack>
        </Paper>
    );
});

// ==================== Navigation membership (read-only) ====================

const MENU_LABELS: Record<string, string> = {
    web_header: 'Web header',
    web_footer: 'Web footer',
    mobile_drawer: 'Mobile drawer',
    mobile_bottom_tabs: 'Mobile tabs',
};

const ALL_MENU_KEYS = ['web_header', 'web_footer', 'mobile_drawer', 'mobile_bottom_tabs'] as const;

interface IPageNavigationMembershipProps {
    pageId: number;
}

export const PageNavigationMembership = React.memo(function PageNavigationMembership({
    pageId,
}: IPageNavigationMembershipProps) {
    const queryClient = useQueryClient();
    const { pages, isLoading } = useAdminPages();
    const canUpdateNavigation = useCanUpdateNavigation();

    const memberships = useMemo(() => {
        const page = pages?.find((entry) => entry.id_pages === pageId);
        const badges = page?.navigationMembership ?? [];
        return badges.map((badge: INavigationMembershipBadge) => ({
            key: badge.menu_key,
            label: MENU_LABELS[badge.menu_key as keyof typeof MENU_LABELS] ?? badge.menu_key,
            explicit: badge.explicit !== false,
            menuItemId: badge.menu_item_id,
        }));
    }, [pages, pageId]);

    const removeMutation = useMutation({
        mutationFn: (menuItemId: number) => AdminNavigationApi.deleteMenuItem(menuItemId),
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: REACT_QUERY_CONFIG.QUERY_KEYS.ADMIN_PAGES });
            await invalidateAdminNavigationQueries(queryClient);
        },
    });

    return (
        <Paper p="md" withBorder>
            <Stack gap="sm">
                <Group gap="xs" justify="space-between">
                    <Text size="sm" fw={500} c="blue">Navigation membership</Text>
                    <Group gap="xs">
                        {canUpdateNavigation ? (
                        <Menu withinPortal position="bottom-end">
                            <Menu.Target>
                                <Button variant="default" size="xs" rightSection={<IconChevronDown size={14} />}>
                                    Add to menu
                                </Button>
                            </Menu.Target>
                            <Menu.Dropdown>
                                {ALL_MENU_KEYS.map((menuKey) => (
                                    <Menu.Item
                                        key={menuKey}
                                        component="a"
                                        href={`/admin/navigation?menu=${encodeURIComponent(menuKey)}`}
                                    >
                                        {MENU_LABELS[menuKey]}
                                    </Menu.Item>
                                ))}
                            </Menu.Dropdown>
                        </Menu>
                        ) : null}
                        <Button component="a" href="/admin/navigation" variant="light" size="xs">
                            Open menu builder
                        </Button>
                    </Group>
                </Group>
                {isLoading ? <Text size="sm" c="dimmed">Loading…</Text> : null}
                {!isLoading && memberships.length === 0 ? (
                    <Text size="sm" c="dimmed">This page is not in any public menu yet.</Text>
                ) : null}
                <Stack gap="xs">
                    {memberships.map((entry) => (
                        <Group key={`${entry.key}-${entry.menuItemId}`} gap="xs" justify="space-between" wrap="nowrap">
                            <Group gap="xs">
                                <Badge variant="light" color={entry.explicit ? 'blue' : 'gray'}>
                                    {entry.label}
                                </Badge>
                                <Button
                                    component="a"
                                    href={`/admin/navigation?menu=${encodeURIComponent(entry.key)}&item=${entry.menuItemId}`}
                                    variant="subtle"
                                    size="xs"
                                >
                                    Open in builder
                                </Button>
                            </Group>
                            {entry.explicit && canUpdateNavigation ? (
                                <Button
                                    variant="subtle"
                                    color="red"
                                    size="xs"
                                    loading={removeMutation.isPending}
                                    onClick={() => removeMutation.mutate(entry.menuItemId)}
                                >
                                    Remove
                                </Button>
                            ) : entry.explicit ? (
                                <Text size="xs" c="dimmed">Read-only</Text>
                            ) : (
                                <Button
                                    component="a"
                                    href={`/admin/navigation?menu=${encodeURIComponent(entry.key)}&item=${entry.menuItemId}`}
                                    variant="subtle"
                                    size="xs"
                                >
                                    Open in builder
                                </Button>
                            )}
                        </Group>
                    ))}
                </Stack>
            </Stack>
        </Paper>
    );
});

// ==================== Page Settings (Headless + Open Access) ====================

export const PageSettings = React.memo(function PageSettings() {
    const headless = usePageFormStore((state) => state.headless);
    const openAccess = usePageFormStore((state) => state.openAccess);
    const surface = usePageFormStore((state) => state.surface);
    const setHeadless = usePageFormStore((state) => state.setHeadless);
    const setOpenAccess = usePageFormStore((state) => state.setOpenAccess);
    const setSurface = usePageFormStore((state) => state.setSurface);

    return (
        <Paper p="md" withBorder>
            <Stack gap="md">
                <Group gap="xs">
                    <Text size="sm" fw={500} c="blue">Page Settings</Text>
                    <Tooltip
                        label="Configure special page behaviors and access controls."
                        multiline
                        w={300}
                    >
                        <ActionIcon variant="subtle" size="xs" color="gray">
                            <IconInfoCircle size="0.75rem" />
                        </ActionIcon>
                    </Tooltip>
                </Group>

                <Box>
                    <FieldLabelWithTooltip
                        label="Surface"
                        tooltip="Public website pages render on the public frontend under normal page ACL. CMS application pages are CMS-in-CMS tooling, grouped separately and ACL-gated to admins/editors."
                    />
                    <SegmentedControl
                        mt={6}
                        fullWidth
                        value={surface}
                        onChange={(value) => setSurface(value === 'cms' ? 'cms' : 'public')}
                        data={[
                            {
                                value: 'public',
                                label: (
                                    <Group gap={6} justify="center" wrap="nowrap">
                                        <IconWorld size="0.9rem" />
                                        <span>Public website</span>
                                    </Group>
                                ),
                            },
                            {
                                value: 'cms',
                                label: (
                                    <Group gap={6} justify="center" wrap="nowrap">
                                        <IconLayoutDashboard size="0.9rem" />
                                        <span>CMS application</span>
                                    </Group>
                                ),
                            },
                        ]}
                    />
                </Box>

                <Group>
                    <Tooltip label="Page will not include header/footer layout - useful for popups, embeds, or standalone pages">
                        <Checkbox
                            label="Headless Page"
                            checked={headless}
                            onChange={(event) => setHeadless(event.currentTarget.checked)}
                        />
                    </Tooltip>
                    <Tooltip label="Page can be accessed without authentication - visible to all users including guests">
                        <Checkbox
                            label="Open Access"
                            checked={openAccess}
                            onChange={(event) => setOpenAccess(event.currentTarget.checked)}
                        />
                    </Tooltip>
                </Group>
            </Stack>
        </Paper>
    );
});

// ==================== Additional Properties ====================

interface IPageAdditionalPropertiesProps {
    fields: IPageField[];
}

// Property fields (url, search_visibility, page-type settings) are returned
// verbatim by the backend and never interpolated at render, so they expose no
// `{{ }}` picker (issue #56 v2 honest-picker rule). The picker lives on content
// fields (mail-config templates) and sections instead. Property fields are not
// language-specific (stored under the property language), so no language id is
// threaded here — `PagePropertyField` pins itself to that language.
export const PageAdditionalProperties = React.memo(function PageAdditionalProperties({
    fields
}: IPageAdditionalPropertiesProps) {
    if (fields.length === 0) return null;

    return (
        <Paper p="md" withBorder>
            <Stack gap="md">
                <Group gap="xs">
                    <Text size="sm" fw={500} c="blue">Additional Properties</Text>
                    <Tooltip
                        label="Additional configuration fields specific to this page type."
                        multiline
                        w={300}
                    >
                        <ActionIcon variant="subtle" size="xs" color="gray">
                            <IconInfoCircle size="0.75rem" />
                        </ActionIcon>
                    </Tooltip>
                </Group>

                {fields.map(field => (
                    <Box key={field.id}>
                        <PagePropertyField
                            field={field}
                            className={styles.fullWidthLabel}
                        />
                    </Box>
                ))}
            </Stack>
        </Paper>
    );
});

// ==================== Navigation Hints ====================

interface IPageNavigationHintsProps {
    page: IAdminPage;
    adminPages: IAdminPage[];
}

/**
 * Hints about branch navigation (resolved from menu builder + page tree).
 */
export const PageNavigationHints = React.memo(function PageNavigationHints({
    page,
    adminPages
}: IPageNavigationHintsProps) {
    const children = useMemo(
        () => adminPages.filter((candidate) => candidate.id_parent_page === page.id_pages),
        [adminPages, page.id_pages]
    );

    const { data: sectionsData } = usePageSections(page.id_pages, children.length > 0);
    const sectionCount = sectionsData?.sections?.length ?? null;
    const hasChildren = children.length > 0;

    if (!hasChildren) {
        return null;
    }

    return (
        <Stack gap="xs">
            {sectionCount === 0 && (
                <Alert color="blue" variant="light" icon={<IconInfoCircle size="1rem" />}>
                    This page has child pages but no content sections. When those children appear in a
                    resolved menu branch, the frontend may auto-route to the first visible child.
                </Alert>
            )}
            <Alert color="gray" variant="light" icon={<IconInfoCircle size="1rem" />}>
                Menu placement is managed in the Navigation builder. Child/sibling tabs are derived from
                resolved menus, not page-level render settings.
            </Alert>
        </Stack>
    );
});
