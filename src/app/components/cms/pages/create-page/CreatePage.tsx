/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
"use client";

import { useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import {
    Stack,
    TextInput,
    Checkbox,
    Radio,
    Group,
    Text,
    Box,
    Alert,
    LoadingOverlay,
    Title,
    Paper,
    SegmentedControl,
    MultiSelect,
    Select,
    ActionIcon,
    Tooltip,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { useCreatePageMutation } from '../../../../../hooks/mutations/useCreatePageMutation';
import { ModalWrapper } from '../../../shared';

import { IconInfoCircle, IconEdit, IconLock, IconWorld, IconLayoutDashboard } from '@tabler/icons-react';
import { useLookupsByType } from '../../../../../hooks/useLookups';
import { useAdminPages } from '../../../../../hooks/useAdminPages';
import { useGroups } from '../../../../../hooks/useGroups';
import {
    PAGE_ACCESS_TYPES,
    PAGE_ACCESS_TYPES_MOBILE_AND_WEB,
    PAGE_SURFACE_PUBLIC,
    PAGE_SURFACE_CMS,
} from '../../../../../constants/lookups.constants';
import {
    CREATE_PAGE_MENU_KEYS,
    type ICreatePageFormValues,
    type ICreatePageModalProps,
    type TCreatePageMenuKey,
} from '../../../../../types/forms/create-page.types';
import { type IAdminPage } from '../../../../../types/responses/admin/admin.types';
import { type ICreatePageRequest } from '../../../../../types/requests/admin/create-page.types';
import { AdminNavigationApi } from '../../../../../api/admin/navigation.api';
import { REACT_QUERY_CONFIG } from '../../../../../config/react-query.config';

const MENU_LABELS: Record<TCreatePageMenuKey, string> = {
    web_header: 'Web header',
    web_footer: 'Web footer',
    mobile_drawer: 'Mobile drawer',
    mobile_bottom_tabs: 'Mobile bottom tabs',
};

export const CreatePageModal = ({ opened, onClose, parentPage = null, navigationPrefill }: ICreatePageModalProps) => {
    const router = useRouter();
    const queryClient = useQueryClient();
    
    // Create page mutation
    const createPageMutation = useCreatePageMutation({
        onSuccess: async (createdPage) => {
            // Reset form and state on successful creation
            form.reset();
            onClose();

            await queryClient.invalidateQueries({ queryKey: ['admin-pages'] });

            // Navigate to the created page after a short delay to allow modal to close
            setTimeout(() => {
                router.push(`/admin/pages/${createdPage.keyword}`);
            }, 100);
        }
    });
    
    // Fetch lookups and admin pages
    const pageAccessTypes = useLookupsByType(PAGE_ACCESS_TYPES);
    const { isLoading: pagesLoading } = useAdminPages();
    const { data: navigationOverview } = useQuery({
        queryKey: ['admin-navigation-overview'],
        queryFn: () => AdminNavigationApi.getOverview(),
        enabled: opened,
        staleTime: REACT_QUERY_CONFIG.CACHE_TIERS.ADMIN_PAGES.staleTime,
    });

    // Groups for the access-group multiselect (CMS-in-CMS ACL authoring).
    const { data: groupsData } = useGroups({ pageSize: 200, sort: 'name', sortDirection: 'asc' });
    const groupOptions = (groupsData?.groups ?? []).map((group) => ({
        value: String(group.id),
        label: group.name,
    }));

    // Use Mantine's useForm for form management
    const form = useForm<ICreatePageFormValues>({
        initialValues: {
            keyword: '',
            navigationMenus: [],
            navigationMenuOptions: {},
            headlessPage: false,
            pageAccessType: PAGE_ACCESS_TYPES_MOBILE_AND_WEB,
            urlPattern: '',
            openAccess: false,
            customUrlEdit: false,
            parentPage: parentPage?.id_pages || null,
            surface: PAGE_SURFACE_PUBLIC,
            accessGroups: [],
            syncUrlWithParent: Boolean(parentPage?.id_pages),
            oldRoutePolicy: 'ask',
        },
        validate: {
            keyword: (value) => {
                if (!value?.trim()) return 'Keyword is required';
                if (!/^[a-zA-Z0-9_-]+$/.test(value)) return 'Keyword can only contain letters, numbers, hyphens, and underscores';
                return null;
            },
            urlPattern: (value) => {
                if (!value?.trim()) return 'URL pattern is required';
                // Check for valid URL pattern (no spaces, starts with /, valid characters)
                if (!/^\/[a-zA-Z0-9_\-\/\[\]:]+$/.test(value)) {
                    return 'URL pattern must start with / and contain only valid URL characters (no spaces)';
                }
                return null;
            },
        },
    });

    // Generate a clean, Symfony-compatible URL from the keyword + parent context.
    // The backend turns this URL into an active, canonical `page_route` on create,
    // so the page is reachable immediately (editable later in the Routes panel).
    // The legacy AltoRouter `[i:nav]` token is gone — navigation is now modelled
    // with child pages + a per-page navigation rendering type.
    const generateUrlPattern = (keyword: string, parentPage: IAdminPage | null) => {
        if (!keyword.trim()) return '';

        // Remove spaces and convert to lowercase for URL safety
        const cleanKeyword = keyword.trim().toLowerCase().replace(/\s+/g, '-');

        // If this is a child page, prepend the parent's URL path so the route
        // nests under the parent (e.g. /parent/child).
        if (parentPage && parentPage.url) {
            const parentPath = parentPage.url.startsWith('/') ? parentPage.url.slice(1) : parentPage.url;
            // Drop any trailing parameter segment of the parent url for a clean hierarchy.
            const cleanParentPath = parentPath.split('/[')[0].split('/{')[0];
            return `/${cleanParentPath}/${cleanKeyword}`;
        }

        return `/${cleanKeyword}`;
    };

    // Apply navigation prefill from the menu builder.
    useEffect(() => {
        if (!opened || !navigationPrefill) {
            return;
        }
        const { menuKey, parentItemId } = navigationPrefill;
        if (!form.values.navigationMenus.includes(menuKey)) {
            form.setFieldValue('navigationMenus', [...form.values.navigationMenus, menuKey]);
        }
        form.setFieldValue('navigationMenuOptions', {
            ...form.values.navigationMenuOptions,
            [menuKey]: {
                ...(form.values.navigationMenuOptions[menuKey] ?? {}),
                parentItemId: parentItemId ?? null,
            },
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps -- keyed on open + prefill only
    }, [opened, navigationPrefill]);

    const parentAutoIncludeMenus = useMemo((): TCreatePageMenuKey[] => {
        if (!parentPage?.id_pages || !navigationOverview?.menus) {
            return [];
        }
        const autoMenus: TCreatePageMenuKey[] = [];
        for (const menuKey of CREATE_PAGE_MENU_KEYS) {
            const items = navigationOverview.menus[menuKey]?.items ?? [];
            const hasAutoParent = items.some(
                (item) => item.page_id === parentPage.id_pages && item.child_source === 'page_children',
            );
            if (hasAutoParent) {
                autoMenus.push(menuKey);
            }
        }
        return autoMenus;
    }, [navigationOverview, parentPage]);

    // When creating a child under a page that already lives in menus, default parent menu items.
    useEffect(() => {
        if (!opened || !parentPage?.navigationMembership?.length) {
            return;
        }
        const nextMenus = [...form.values.navigationMenus];
        const nextOptions = { ...form.values.navigationMenuOptions };
        for (const membership of parentPage.navigationMembership) {
            if (!membership.explicit || !membership.menu_item_id) {
                continue;
            }
            const menuKey = membership.menu_key as TCreatePageMenuKey;
            if (!CREATE_PAGE_MENU_KEYS.includes(menuKey) || parentAutoIncludeMenus.includes(menuKey)) {
                continue;
            }
            if (!nextMenus.includes(menuKey)) {
                nextMenus.push(menuKey);
            }
            nextOptions[menuKey] = {
                ...(nextOptions[menuKey] ?? {}),
                parentItemId: membership.menu_item_id,
                childSource: nextOptions[menuKey]?.childSource ?? 'manual',
            };
        }
        form.setFieldValue('navigationMenus', nextMenus);
        form.setFieldValue('navigationMenuOptions', nextOptions);
        // eslint-disable-next-line react-hooks/exhaustive-deps -- parent membership defaults only when modal opens
    }, [opened, parentPage?.id_pages, parentAutoIncludeMenus]);

    const menuParentOptions = useMemo(() => {
        const map: Partial<Record<TCreatePageMenuKey, Array<{ value: string; label: string }>>> = {};
        if (!navigationOverview?.menus) {
            return map;
        }
        for (const menuKey of CREATE_PAGE_MENU_KEYS) {
            const items = navigationOverview.menus[menuKey]?.items ?? [];
            map[menuKey] = [
                { value: '', label: 'Root level' },
                ...items.map((item) => ({
                    value: String(item.id),
                    label: `#${item.id} ${item.item_type}${item.page_id ? ` → page ${item.page_id}` : ''}`,
                })),
            ];
        }
        return map;
    }, [navigationOverview]);

    // Update URL pattern when keyword or parent changes.
    useEffect(() => {
        const urlPattern = generateUrlPattern(form.values.keyword, parentPage);
        form.setFieldValue('urlPattern', urlPattern);
        // eslint-disable-next-line react-hooks/exhaustive-deps -- intentionally keyed on the specific form values read; `form` is a fresh object each render, so depending on it would re-run every render and call setFieldValue in a loop. `form.setFieldValue` is stable.
    }, [form.values.keyword, parentPage]);





    // Handle form submission
    const handleSubmit = async (values: ICreatePageFormValues) => {
        const navigationAssignments = values.navigationMenus
            .filter((menuKey) => !parentAutoIncludeMenus.includes(menuKey))
            .map((menuKey) => {
            const options = values.navigationMenuOptions[menuKey];
            return {
                menuKey,
                ...(options?.childSource ? { childSource: options.childSource } : {}),
                ...(options?.parentItemId ? { parentItemId: options.parentItemId } : {}),
            };
        });

        const submitData: ICreatePageRequest = {
            keyword: values.keyword,
            pageAccessTypeCode: values.pageAccessType,
            headless: values.headlessPage,
            openAccess: values.openAccess,
            url: values.urlPattern,
            parent: values.parentPage,
            surface: values.surface,
            accessGroups: values.accessGroups,
            navigationAssignments,
            syncUrlWithParent: values.syncUrlWithParent && Boolean(values.parentPage),
            oldRoutePolicy: values.syncUrlWithParent ? values.oldRoutePolicy : undefined,
        };

        createPageMutation.mutate(submitData);
    };

    const handleClose = () => {
        form.reset();
        onClose();
    };



    // Handle create button click
    const handleCreateClick = () => {
        form.onSubmit(handleSubmit)();
    };

    return (
        <ModalWrapper
            opened={opened}
            onClose={handleClose}
            title={parentPage ? `Create Child Page under "${parentPage.keyword}"` : "Create New Page"}
            size="xl"
            onSave={handleCreateClick}
            onCancel={handleClose}
            isLoading={createPageMutation.isPending}
            saveLabel="Create Page"
            cancelLabel="Cancel"
            scrollAreaHeight={600}
        >
            <LoadingOverlay visible={pagesLoading} />

            <form onSubmit={(event) => form.onSubmit(handleSubmit)(event)}>
                <Stack gap="lg">
                                {/* Context Information */}
                                {parentPage && (
                                    <Alert icon={<IconInfoCircle size="1rem" />} color="blue" mb="md">
                                        <Text size="sm">
                                            Creating a child page under: <Text span fw={600}>{parentPage.keyword}</Text>
                                        </Text>
                                    </Alert>
                                )}

                                {/* Basic Page Information */}
                                <Paper p="md" withBorder>
                                    <Stack gap="md">
                                        <Title order={4} size="h5" c="blue">Basic Information</Title>
                                        
                                        <TextInput
                                            label="Keyword"
                                            placeholder="Enter page keyword"
                                            required
                                            {...form.getInputProps('keyword')}
                                        />

                                        {/* Page Access Type - Horizontal Layout */}
                                        <Box>
                                            <Text size="sm" fw={500} mb="xs">Page Access Type</Text>
                                            <Radio.Group
                                                value={form.values.pageAccessType}
                                                onChange={(value) => form.setFieldValue('pageAccessType', value)}
                                            >
                                                <Group gap="xl">
                                                    {pageAccessTypes.map((type) => (
                                                        <Radio
                                                            key={type.lookupCode}
                                                            value={type.lookupCode}
                                                            label={type.lookupValue}
                                                        />
                                                    ))}
                                                </Group>
                                            </Radio.Group>
                                        </Box>
                                    </Stack>
                                </Paper>

                                {/* Surface & Access (CMS-in-CMS) */}
                                <Paper p="md" withBorder>
                                    <Stack gap="md">
                                        <Title order={4} size="h5" c="blue">Surface &amp; Access</Title>

                                        <Box>
                                            <Text size="sm" fw={500} mb="xs">Page Surface</Text>
                                            <SegmentedControl
                                                fullWidth
                                                value={form.values.surface}
                                                onChange={(value) => form.setFieldValue('surface', value)}
                                                data={[
                                                    {
                                                        value: PAGE_SURFACE_PUBLIC,
                                                        label: (
                                                            <Group gap="xs" justify="center" wrap="nowrap">
                                                                <IconWorld size="1rem" />
                                                                <span>Public website</span>
                                                            </Group>
                                                        ),
                                                    },
                                                    {
                                                        value: PAGE_SURFACE_CMS,
                                                        label: (
                                                            <Group gap="xs" justify="center" wrap="nowrap">
                                                                <IconLayoutDashboard size="1rem" />
                                                                <span>CMS application</span>
                                                            </Group>
                                                        ),
                                                    },
                                                ]}
                                            />
                                            <Text size="xs" c="dimmed" mt="xs">
                                                {form.values.surface === PAGE_SURFACE_CMS
                                                    ? 'CMS application pages are grouped separately and default to admin/editor-only access. Use these for CMS-in-CMS tooling (e.g. /cms/team).'
                                                    : 'Public website pages are shown to your normal audience under standard page access rules.'}
                                            </Text>
                                        </Box>

                                        <MultiSelect
                                            label="Additional access groups"
                                            placeholder="Admin always has access"
                                            data={groupOptions}
                                            value={form.values.accessGroups.map(String)}
                                            onChange={(values) =>
                                                form.setFieldValue('accessGroups', values.map(Number))
                                            }
                                            searchable
                                            clearable
                                            description={
                                                form.values.surface === PAGE_SURFACE_CMS
                                                    ? 'Selected groups get full edit access to this CMS application page.'
                                                    : 'Selected groups get read access to this public page.'
                                            }
                                        />
                                    </Stack>
                                </Paper>

                                {/* Page Settings */}
                                <Paper p="md" withBorder>
                                    <Stack gap="md">
                                        <Title order={4} size="h5" c="blue">Page Settings</Title>
                                        
                                        {/* Horizontal Checkbox Group */}
                                        <Group gap="xl">
                                            <Checkbox
                                                label="Headless Page"
                                                description="No header/footer layout"
                                                {...form.getInputProps('headlessPage', { type: 'checkbox' })}
                                            />
                                            <Checkbox
                                                label="Open Access"
                                                description="Public access"
                                                {...form.getInputProps('openAccess', { type: 'checkbox' })}
                                            />
                                        </Group>

                                        {/* URL Pattern with Floating Edit Button */}
                                        <Box pos="relative">
                                            <TextInput
                                                label="URL Pattern"
                                                placeholder="/your-page-url"
                                                readOnly={!form.values.customUrlEdit}
                                                {...form.getInputProps('urlPattern')}
                                                rightSection={
                                                    <Tooltip 
                                                        label={form.values.customUrlEdit ? "Lock URL editing" : "Enable URL editing"}
                                                        position="left"
                                                    >
                                                        <ActionIcon
                                                            variant={form.values.customUrlEdit ? "filled" : "subtle"}
                                                            color={form.values.customUrlEdit ? "blue" : "gray"}
                                                            onClick={() => form.setFieldValue('customUrlEdit', !form.values.customUrlEdit)}
                                                            className="cursor-pointer"
                                                        >
                                                            {form.values.customUrlEdit ? (
                                                                <IconEdit size="1rem" />
                                                            ) : (
                                                                <IconLock size="1rem" />
                                                            )}
                                                        </ActionIcon>
                                                    </Tooltip>
                                                }
                                            />
                                        </Box>

                                        <Alert
                                            icon={<IconInfoCircle size="1rem" />}
                                            color="blue"
                                            variant="light"
                                        >
                                            <Text size="sm">
                                                A public web address (route) is created automatically
                                                from this URL, so the page works as soon as it is saved.
                                                You can fine-tune or add more addresses later in the
                                                page&apos;s <Text span fw={600}>Routes</Text> panel.
                                            </Text>
                                        </Alert>

                                        {form.values.parentPage ? (
                                            <Stack gap="xs">
                                                <Checkbox
                                                    label="Sync URL with page parent"
                                                    description="Update the canonical route to follow the parent URL plus this page slug"
                                                    {...form.getInputProps('syncUrlWithParent', { type: 'checkbox' })}
                                                />
                                                {form.values.syncUrlWithParent ? (
                                                    <Select
                                                        label="Old public route"
                                                        data={[
                                                            { value: 'ask', label: 'Ask each time (use global default)' },
                                                            { value: 'keep_alias', label: 'Keep as alias/redirect' },
                                                            { value: 'remove_old_route', label: 'Remove old route' },
                                                        ]}
                                                        {...form.getInputProps('oldRoutePolicy')}
                                                    />
                                                ) : null}
                                            </Stack>
                                        ) : null}
                                    </Stack>
                                </Paper>

                                {/* Navigation assignments */}
                                <Paper p="md" withBorder>
                                    <Stack gap="md">
                                        <Title order={4} size="h5" c="blue">Navigation (optional)</Title>
                                        <Text size="sm" c="dimmed">
                                            Add this page to one or more public menus. Order and nesting can be adjusted later in the menu builder.
                                        </Text>
                                        {parentAutoIncludeMenus.length > 0 ? (
                                            <Alert color="blue" variant="light" icon={<IconInfoCircle size="1rem" />}>
                                                <Text size="sm">
                                                    The parent page auto-includes child pages in{' '}
                                                    {parentAutoIncludeMenus.map((key) => MENU_LABELS[key]).join(', ')}.
                                                    This new child will appear there automatically — no extra menu item is needed.
                                                </Text>
                                            </Alert>
                                        ) : null}
                                        <Stack gap="xs">
                                            {CREATE_PAGE_MENU_KEYS.map((menuKey) => {
                                                const autoIncluded = parentAutoIncludeMenus.includes(menuKey);
                                                return (
                                                <Box key={menuKey}>
                                                    <Checkbox
                                                        label={MENU_LABELS[menuKey]}
                                                        description={autoIncluded
                                                            ? 'Inherited from parent auto-include rule'
                                                            : undefined}
                                                        disabled={autoIncluded}
                                                        checked={autoIncluded || form.values.navigationMenus.includes(menuKey)}
                                                        onChange={(event) => {
                                                            if (autoIncluded) {
                                                                return;
                                                            }
                                                            const checked = event.currentTarget.checked;
                                                            const current = form.values.navigationMenus;
                                                            form.setFieldValue(
                                                                'navigationMenus',
                                                                checked
                                                                    ? [...current, menuKey]
                                                                    : current.filter((k) => k !== menuKey),
                                                            );
                                                        }}
                                                    />
                                                    {form.values.navigationMenus.includes(menuKey) && !autoIncluded ? (
                                                        <Stack gap="xs" ml="lg">
                                                            <Select
                                                                size="xs"
                                                                label="Parent menu item"
                                                                data={menuParentOptions[menuKey] ?? [{ value: '', label: 'Root level' }]}
                                                                value={form.values.navigationMenuOptions[menuKey]?.parentItemId
                                                                    ? String(form.values.navigationMenuOptions[menuKey]?.parentItemId)
                                                                    : ''}
                                                                onChange={(value) => {
                                                                    form.setFieldValue('navigationMenuOptions', {
                                                                        ...form.values.navigationMenuOptions,
                                                                        [menuKey]: {
                                                                            ...(form.values.navigationMenuOptions[menuKey] ?? {}),
                                                                            parentItemId: value ? Number(value) : null,
                                                                        },
                                                                    });
                                                                }}
                                                            />
                                                            {(menuKey === 'mobile_drawer' || menuKey === 'web_header') ? (
                                                                <Select
                                                                    size="xs"
                                                                    label="Child pages"
                                                                    data={[
                                                                        { value: 'manual', label: 'Manual only' },
                                                                        { value: 'page_children', label: 'Auto-include child pages' },
                                                                    ]}
                                                                    value={form.values.navigationMenuOptions[menuKey]?.childSource ?? 'manual'}
                                                                    onChange={(value) => {
                                                                        form.setFieldValue('navigationMenuOptions', {
                                                                            ...form.values.navigationMenuOptions,
                                                                            [menuKey]: {
                                                                                ...(form.values.navigationMenuOptions[menuKey] ?? {}),
                                                                                childSource: value ?? 'manual',
                                                                            },
                                                                        });
                                                                    }}
                                                                />
                                                            ) : null}
                                                        </Stack>
                                                    ) : null}
                                                </Box>
                                            );
                                            })}
                                        </Stack>
                                    </Stack>
                                </Paper>
                            </Stack>
                        </form>
        </ModalWrapper>
    );
};
