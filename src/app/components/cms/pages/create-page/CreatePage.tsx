/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';

import {
    Stack,
    TextInput,
    Checkbox,
    Radio,
    Group,
    Text,
    Box,
    Alert,
    SegmentedControl,
    MultiSelect,
    Select,
    ActionIcon,
    Tooltip,
    Stepper,
    Button,
    Tabs,
    Badge,
    Center,
    Loader,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { useCreatePageMutation } from '../../../../../hooks/mutations/useCreatePageMutation';
import { ModalWrapper } from '../../../shared';

import { IconInfoCircle, IconEdit, IconLock, IconWorld, IconLayoutDashboard } from '@tabler/icons-react';
import { useLookupsByType } from '../../../../../hooks/useLookups';
import { useGroups } from '../../../../../hooks/useGroups';
import { useAdminPages } from '../../../../../hooks/useAdminPages';
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
    type ICreatePageNavigationPrefill,
    type TCreatePageMenuKey,
} from '../../../../../types/forms/create-page.types';
import { type IAdminPage } from '../../../../../types/responses/admin/admin.types';
import { type ICreatePageRequest } from '../../../../../types/requests/admin/create-page.types';
import {
    AdminNavigationApi,
    type IAdminNavigationOverview,
} from '../../../../../api/admin/navigation.api';
import { REACT_QUERY_CONFIG } from '../../../../../config/react-query.config';
import {
    buildChildPageParentMenuLabel,
    buildInitialNavigationMenusState,
    buildMenuInsertPositionOptions,
    buildPageLookup,
    formatMenuItemLabel,
    getMenuSiblingsAtParent,
    isSystemAdminGroup,
    resolveChildPageMenuContexts,
    resolveInitialMenuTab,
    resolveMenuInsertPosition,
    type TMenuInsertPositionMode,
} from '../../../../../utils/create-page-navigation.utils';

const MENU_LABELS: Record<TCreatePageMenuKey, string> = {
    web_header: 'Web header',
    web_footer: 'Web footer',
    mobile_drawer: 'Mobile drawer',
    mobile_bottom_tabs: 'Mobile bottom tabs',
};

const WIZARD_LAST_STEP = 3;
const STEP_CONTENT_MIN_HEIGHT = 260;

const SURFACE_SEGMENT_DATA = [
    { value: PAGE_SURFACE_PUBLIC, label: 'Public website' },
    { value: PAGE_SURFACE_CMS, label: 'CMS application' },
] as const;

const SURFACE_HELP_TEXT: Record<string, string> = {
    [PAGE_SURFACE_PUBLIC]: 'Shown to your normal audience under standard page access rules.',
    [PAGE_SURFACE_CMS]: 'Grouped separately; defaults to admin/editor-only access (e.g. /cms/team).',
};

const GROUPS_QUERY_PARAMS = { pageSize: 200, sort: 'name' as const, sortDirection: 'asc' as const };

function buildWizardSessionKey(
    parentPage: IAdminPage | null | undefined,
    navigationPrefill: ICreatePageNavigationPrefill | undefined,
    generation: number,
): string {
    return [
        parentPage?.id_pages ?? 'root',
        navigationPrefill?.menuKey ?? '',
        String(navigationPrefill?.parentItemId ?? ''),
        String(generation),
    ].join(':');
}

function needsNavigationOverview(parentPage: IAdminPage | null | undefined): boolean {
    return Boolean(parentPage?.id_pages || parentPage?.navigationMembership?.length);
}

interface ICreatePageWizardProps {
    parentPage: IAdminPage | null;
    navigationPrefill?: ICreatePageNavigationPrefill;
    navigationOverview: IAdminNavigationOverview | undefined;
    onClose: () => void;
}

function CreatePageWizard({
    parentPage,
    navigationPrefill,
    navigationOverview,
    onClose,
}: ICreatePageWizardProps) {
    const router = useRouter();
    const [activeStep, setActiveStep] = useState(0);
    const [activeMenuTab, setActiveMenuTab] = useState<TCreatePageMenuKey>(() =>
        resolveInitialMenuTab(navigationPrefill, parentPage, navigationOverview),
    );

    const initialNavigationState = useMemo(
        () => buildInitialNavigationMenusState(parentPage, navigationPrefill, navigationOverview),
        [navigationOverview, navigationPrefill, parentPage],
    );

    const form = useForm<ICreatePageFormValues>({
        initialValues: {
            keyword: '',
            navigationMenus: initialNavigationState.navigationMenus,
            navigationMenuOptions: initialNavigationState.navigationMenuOptions,
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
                if (!/^\/[a-zA-Z0-9_\-\/\[\]:]+$/.test(value)) {
                    return 'URL pattern must start with / and contain only valid URL characters (no spaces)';
                }
                return null;
            },
        },
    });

    const createPageMutation = useCreatePageMutation({
        onSuccess: async (createdPage) => {
            onClose();

            setTimeout(() => {
                router.push(`/admin/pages/${createdPage.keyword}`);
            }, 100);
        },
    });

    const pageAccessTypes = useLookupsByType(PAGE_ACCESS_TYPES);
    const { data: groupsData } = useGroups(GROUPS_QUERY_PARAMS);
    const { pages: adminPages } = useAdminPages();
    const pageById = useMemo(() => buildPageLookup(adminPages ?? []), [adminPages]);

    const groupOptions = useMemo(
        () => (groupsData?.groups ?? [])
            .filter((group) => !isSystemAdminGroup(group))
            .map((group) => ({
                value: String(group.id),
                label: group.name,
            })),
        [groupsData?.groups],
    );

    const accessGroupDescription = form.values.surface === PAGE_SURFACE_CMS
        ? 'Selected groups get full edit access to this CMS application page.'
        : 'Selected groups get read access to this public page.';

    const generateUrlPattern = useCallback((keyword: string, parent: IAdminPage | null) => {
        if (!keyword.trim()) return '';

        const cleanKeyword = keyword.trim().toLowerCase().replace(/\s+/g, '-');

        if (parent && parent.url) {
            const parentPath = parent.url.startsWith('/') ? parent.url.slice(1) : parent.url;
            const cleanParentPath = parentPath.split('/[')[0].split('/{')[0];
            return `/${cleanParentPath}/${cleanKeyword}`;
        }

        return `/${cleanKeyword}`;
    }, []);

    const resolvedUrlPattern = form.values.customUrlEdit
        ? form.values.urlPattern
        : generateUrlPattern(form.values.keyword, parentPage);

    const childPageMenuContexts = useMemo(
        () => (parentPage ? resolveChildPageMenuContexts(parentPage, navigationOverview) : []),
        [navigationOverview, parentPage],
    );

    const wizardMenuKeys = useMemo((): TCreatePageMenuKey[] => {
        if (!parentPage?.id_pages) {
            return [...CREATE_PAGE_MENU_KEYS];
        }
        return childPageMenuContexts.map((context) => context.menuKey);
    }, [childPageMenuContexts, parentPage?.id_pages]);

    const effectiveMenuTab = useMemo((): TCreatePageMenuKey | null => {
        if (activeMenuTab && wizardMenuKeys.includes(activeMenuTab)) {
            return activeMenuTab;
        }
        return wizardMenuKeys[0] ?? null;
    }, [activeMenuTab, wizardMenuKeys]);

    const menuParentOptions = useMemo(() => {
        const map: Partial<Record<TCreatePageMenuKey, Array<{ value: string; label: string }>>> = {};
        if (!navigationOverview?.menus) {
            return map;
        }
        const isChildPage = Boolean(parentPage?.id_pages);
        for (const menuKey of wizardMenuKeys) {
            const items = navigationOverview.menus[menuKey]?.items ?? [];
            if (isChildPage) {
                const context = childPageMenuContexts.find((entry) => entry.menuKey === menuKey);
                if (!context) {
                    continue;
                }
                const parentItem = items.find((item) => item.id === context.parentItemId);
                map[menuKey] = [{
                    value: String(context.parentItemId),
                    label: parentItem
                        ? formatMenuItemLabel(parentItem, pageById)
                        : buildChildPageParentMenuLabel(
                            parentPage!,
                            context.parentItemId,
                            navigationOverview,
                            pageById,
                        ),
                }];
                continue;
            }
            map[menuKey] = [
                { value: '', label: 'Root level' },
                ...items.map((item) => ({
                    value: String(item.id),
                    label: formatMenuItemLabel(item, pageById),
                })),
            ];
        }
        return map;
    }, [childPageMenuContexts, navigationOverview, pageById, parentPage, wizardMenuKeys]);

    const menuPositionOptions = useMemo(() => {
        const map: Partial<Record<TCreatePageMenuKey, Array<{ value: TMenuInsertPositionMode; label: string }>>> = {};
        if (!navigationOverview?.menus) {
            return map;
        }
        const isChildPage = Boolean(parentPage?.id_pages);
        for (const menuKey of wizardMenuKeys) {
            const items = navigationOverview.menus[menuKey]?.items ?? [];
            const childContext = childPageMenuContexts.find((entry) => entry.menuKey === menuKey);
            const parentItemId = isChildPage && childContext
                ? childContext.parentItemId
                : (form.values.navigationMenuOptions[menuKey]?.parentItemId ?? null);
            const siblings = getMenuSiblingsAtParent(items, parentItemId);
            map[menuKey] = buildMenuInsertPositionOptions(siblings, pageById);
        }
        return map;
    }, [childPageMenuContexts, form.values.navigationMenuOptions, navigationOverview, pageById, parentPage, wizardMenuKeys]);

    const handleKeywordChange = (keyword: string) => {
        form.setFieldValue('keyword', keyword);
        if (!form.values.customUrlEdit) {
            form.setFieldValue('urlPattern', generateUrlPattern(keyword, parentPage));
        }
    };

    const toggleCustomUrlEdit = () => {
        const next = !form.values.customUrlEdit;
        form.setFieldValue('customUrlEdit', next);
        if (!next) {
            form.setFieldValue('urlPattern', generateUrlPattern(form.values.keyword, parentPage));
        }
    };

    const validateStep = (step: number): boolean => {
        if (step === 0) {
            return !form.validateField('keyword').hasError;
        }
        if (step === 2) {
            if (!form.values.customUrlEdit) {
                form.setFieldValue('urlPattern', resolvedUrlPattern);
            }
            return !form.validateField('urlPattern').hasError;
        }
        return true;
    };

    const handleSubmit = async (values: ICreatePageFormValues) => {
        const urlPattern = values.customUrlEdit
            ? values.urlPattern
            : generateUrlPattern(values.keyword, parentPage);

        const navigationAssignments = values.navigationMenus
            .map((menuKey) => {
                const options = values.navigationMenuOptions[menuKey];
                const items = navigationOverview?.menus[menuKey]?.items ?? [];
                const childContext = childPageMenuContexts.find((entry) => entry.menuKey === menuKey);
                const parentItemId = childContext?.parentItemId
                    ?? options?.parentItemId
                    ?? null;
                const siblings = getMenuSiblingsAtParent(items, parentItemId);
                const position = resolveMenuInsertPosition(
                    options?.insertPosition as TMenuInsertPositionMode | undefined,
                    siblings,
                );
                return {
                    menuKey,
                    ...(parentItemId ? { parentItemId } : {}),
                    ...(position !== undefined ? { position } : {}),
                };
            });

        const submitData: ICreatePageRequest = {
            keyword: values.keyword,
            pageAccessTypeCode: values.pageAccessType,
            headless: values.headlessPage,
            openAccess: values.openAccess,
            url: urlPattern,
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
        onClose();
    };

    const handleNext = () => {
        if (!validateStep(activeStep)) {
            return;
        }
        setActiveStep((current) => Math.min(current + 1, WIZARD_LAST_STEP));
    };

    const handleBack = () => {
        setActiveStep((current) => Math.max(current - 1, 0));
    };

    const handleStepClick = (step: number) => {
        if (step >= activeStep) {
            return;
        }
        setActiveStep(step);
    };

    const handleCreateClick = () => {
        form.onSubmit(handleSubmit)();
    };

    const toggleMenuAssignment = (menuKey: TCreatePageMenuKey, checked: boolean) => {
        const current = form.getValues().navigationMenus;
        form.setFieldValue(
            'navigationMenus',
            checked ? [...current, menuKey] : current.filter((k) => k !== menuKey),
        );
        if (checked) {
            const childContext = childPageMenuContexts.find((entry) => entry.menuKey === menuKey);
            if (childContext) {
                form.setFieldValue('navigationMenuOptions', {
                    ...form.getValues().navigationMenuOptions,
                    [menuKey]: {
                        ...(form.getValues().navigationMenuOptions[menuKey] ?? {}),
                        parentItemId: childContext.parentItemId,
                        insertPosition: form.getValues().navigationMenuOptions[menuKey]?.insertPosition ?? 'end',
                    },
                });
            }
        }
    };

    const isChildPageFlow = Boolean(parentPage?.id_pages);

    const wizardFooter = (
        <Group gap="sm">
            {activeStep > 0 ? (
                <Button variant="default" onClick={handleBack} disabled={createPageMutation.isPending} size="sm">
                    Back
                </Button>
            ) : null}
            {activeStep < WIZARD_LAST_STEP ? (
                <Button onClick={handleNext} size="sm">
                    Next
                </Button>
            ) : (
                <Button onClick={handleCreateClick} loading={createPageMutation.isPending} size="sm">
                    Create Page
                </Button>
            )}
        </Group>
    );

    const renderMenuTabPanel = (menuKey: TCreatePageMenuKey) => {
        const isAssigned = form.values.navigationMenus.includes(menuKey);
        const childContext = childPageMenuContexts.find((entry) => entry.menuKey === menuKey);
        const lockedParentItemId = childContext?.parentItemId
            ?? form.values.navigationMenuOptions[menuKey]?.parentItemId
            ?? null;

        return (
            <Stack gap="sm" justify="flex-start">
                <Checkbox
                    label={`Add to ${MENU_LABELS[menuKey]}`}
                    description={
                        isChildPageFlow
                            ? 'Optional — appears nested under the parent page in this menu'
                            : 'Optional — leave unchecked to skip this menu'
                    }
                    checked={isAssigned}
                    onChange={(event) => toggleMenuAssignment(menuKey, event.currentTarget.checked)}
                />
                {isAssigned ? (
                    <>
                        {isChildPageFlow ? (
                            <TextInput
                                label="Parent menu item"
                                description="Child pages cannot be placed at the root menu — they appear under their parent."
                                value={menuParentOptions[menuKey]?.[0]?.label ?? ''}
                                readOnly
                            />
                        ) : (
                            <Select
                                label="Parent menu item"
                                description="Place this page under an existing menu entry, or at root level."
                                data={menuParentOptions[menuKey] ?? [{ value: '', label: 'Root level' }]}
                                value={lockedParentItemId ? String(lockedParentItemId) : ''}
                                onChange={(value) => {
                                    form.setFieldValue('navigationMenuOptions', {
                                        ...form.values.navigationMenuOptions,
                                        [menuKey]: {
                                            ...(form.values.navigationMenuOptions[menuKey] ?? {}),
                                            parentItemId: value ? Number(value) : null,
                                            insertPosition: 'end',
                                        },
                                    });
                                }}
                            />
                        )}
                        <Select
                            label="Menu position"
                            description={
                                isChildPageFlow
                                    ? 'Where this page appears among the parent’s child menu items.'
                                    : 'Where this page appears among siblings at the chosen level.'
                            }
                            data={menuPositionOptions[menuKey] ?? [{ value: 'end', label: 'At the end (last)' }]}
                            value={(form.values.navigationMenuOptions[menuKey]?.insertPosition ?? 'end') as TMenuInsertPositionMode}
                            onChange={(value) => {
                                form.setFieldValue('navigationMenuOptions', {
                                    ...form.values.navigationMenuOptions,
                                    [menuKey]: {
                                        ...(form.values.navigationMenuOptions[menuKey] ?? {}),
                                        insertPosition: value ?? 'end',
                                    },
                                });
                            }}
                        />
                        {!isChildPageFlow && (menuKey === 'mobile_drawer' || menuKey === 'web_header') ? (
                            <Text size="sm" c="dimmed">
                                Create the page first. Add child pages later via Add existing page in the Navigation builder.
                            </Text>
                        ) : null}
                    </>
                ) : null}
            </Stack>
        );
    };

    const renderStepContent = () => {
        switch (activeStep) {
            case 0:
                return (
                    <Stack gap="md">
                        {parentPage ? (
                            <Alert icon={<IconInfoCircle size="1rem" />} color="blue" variant="light">
                                <Text size="sm">
                                    Creating a child page under:{' '}
                                    <Text span fw={600}>{parentPage.keyword}</Text>
                                </Text>
                            </Alert>
                        ) : null}

                        <TextInput
                            label="Keyword"
                            placeholder="Enter page keyword"
                            required
                            value={form.values.keyword}
                            error={form.errors.keyword}
                            onChange={(event) => handleKeywordChange(event.currentTarget.value)}
                            onBlur={form.getInputProps('keyword').onBlur}
                        />

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
                );

            case 1:
                return (
                    <Stack gap="md">
                        <Box>
                            <Text size="sm" fw={500} mb="xs">Page Surface</Text>
                            <SegmentedControl
                                fullWidth
                                value={form.values.surface}
                                onChange={(value) => form.setFieldValue('surface', value)}
                                data={[...SURFACE_SEGMENT_DATA]}
                            />
                            <Group gap={6} mt="xs" wrap="nowrap">
                                {form.values.surface === PAGE_SURFACE_PUBLIC ? (
                                    <IconWorld size="0.9rem" style={{ flexShrink: 0 }} />
                                ) : (
                                    <IconLayoutDashboard size="0.9rem" style={{ flexShrink: 0 }} />
                                )}
                                <Text size="xs" c="dimmed" lineClamp={2}>
                                    {SURFACE_HELP_TEXT[form.values.surface] ?? SURFACE_HELP_TEXT[PAGE_SURFACE_PUBLIC]}
                                </Text>
                            </Group>
                        </Box>

                        <MultiSelect
                            label="Additional access groups"
                            placeholder="Admins always have access — select other groups"
                            data={groupOptions}
                            value={form.values.accessGroups.map(String)}
                            onChange={(values) => form.setFieldValue('accessGroups', values.map(Number))}
                            searchable
                            clearable
                            description={accessGroupDescription}
                        />

                        <Checkbox
                            label="Open Access"
                            description="Allow public access without login"
                            {...form.getInputProps('openAccess', { type: 'checkbox' })}
                        />
                    </Stack>
                );

            case 2:
                return (
                    <Stack gap="md">
                        <Checkbox
                            label="Headless Page"
                            description="No header/footer layout"
                            {...form.getInputProps('headlessPage', { type: 'checkbox' })}
                        />

                        <TextInput
                            label="URL Pattern"
                            placeholder="/your-page-url"
                            required
                            readOnly={!form.values.customUrlEdit}
                            value={resolvedUrlPattern}
                            error={form.errors.urlPattern}
                            onChange={(event) => form.setFieldValue('urlPattern', event.currentTarget.value)}
                            onBlur={form.getInputProps('urlPattern').onBlur}
                            rightSection={
                                <Tooltip
                                    label={form.values.customUrlEdit ? 'Lock URL editing' : 'Enable URL editing'}
                                    position="left"
                                >
                                    <ActionIcon
                                        variant={form.values.customUrlEdit ? 'filled' : 'subtle'}
                                        color={form.values.customUrlEdit ? 'blue' : 'gray'}
                                        onClick={toggleCustomUrlEdit}
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

                        <Text size="xs" c="dimmed">
                            A route is created automatically from this URL. Fine-tune it later in the page&apos;s Routes panel.
                        </Text>

                        {form.values.parentPage ? (
                            <Stack gap="xs">
                                <Checkbox
                                    label="Sync URL with page parent"
                                    description="Rebuild the public URL from the parent path plus this page’s keyword (e.g. /parent/child)."
                                    {...form.getInputProps('syncUrlWithParent', { type: 'checkbox' })}
                                />
                                {form.values.syncUrlWithParent ? (
                                    <Select
                                        label="Previous URL route"
                                        description="If the URL above differs from the synced parent path, choose what happens to that first URL’s public route."
                                        data={[
                                            { value: 'ask', label: 'Use global default (Navigation settings)' },
                                            { value: 'keep_alias', label: 'Keep as alias — old URL still works (redirect)' },
                                            { value: 'remove_old_route', label: 'Remove — only the synced URL stays public' },
                                        ]}
                                        {...form.getInputProps('oldRoutePolicy')}
                                    />
                                ) : null}
                            </Stack>
                        ) : null}
                    </Stack>
                );

            case 3:
            default:
                return (
                    <Stack gap="sm">
                        <Text size="sm" c="dimmed">
                            {isChildPageFlow
                                ? 'Add this child page only under menus where its parent already appears. Child pages cannot be placed at the root menu level.'
                                : 'Optionally add this page to menus and choose where it appears. Fine-tune later in the menu builder.'}
                        </Text>

                        {isChildPageFlow && wizardMenuKeys.length === 0 ? (
                            <Alert color="yellow" variant="light" icon={<IconInfoCircle size="1rem" />}>
                                <Text size="sm">
                                    Parent page &quot;{parentPage?.keyword}&quot; is not in any menu yet. Add it in{' '}
                                    <Text span fw={600}>Navigation</Text> first, or this child will only be reachable by URL.
                                </Text>
                            </Alert>
                        ) : (
                            <Tabs
                                value={effectiveMenuTab}
                                onChange={(value) => setActiveMenuTab(value as TCreatePageMenuKey)}
                                keepMounted={false}
                            >
                                <Tabs.List grow>
                                    {wizardMenuKeys.map((menuKey) => {
                                        const assigned = form.values.navigationMenus.includes(menuKey);
                                        return (
                                            <Tabs.Tab
                                                key={menuKey}
                                                value={menuKey}
                                                rightSection={assigned ? <Badge size="xs" circle color="blue" /> : null}
                                            >
                                                {MENU_LABELS[menuKey]}
                                            </Tabs.Tab>
                                        );
                                    })}
                                </Tabs.List>

                                {wizardMenuKeys.map((menuKey) => (
                                    <Tabs.Panel key={menuKey} value={menuKey} pt="sm">
                                        {renderMenuTabPanel(menuKey)}
                                    </Tabs.Panel>
                                ))}
                            </Tabs>
                        )}
                    </Stack>
                );
        }
    };

    return (
        <ModalWrapper
            opened
            onClose={handleClose}
            title={parentPage ? `Create Child Page under "${parentPage.keyword}"` : 'Create New Page'}
            size="xl"
            onCancel={handleClose}
            cancelPosition="left"
            customActions={wizardFooter}
            isLoading={createPageMutation.isPending}
            cancelLabel="Cancel"
            disableScroll
        >
            <form onSubmit={(event) => event.preventDefault()}>
                <Stack gap="md">
                    <Stepper
                        active={activeStep}
                        onStepClick={handleStepClick}
                        allowNextStepsSelect={false}
                        size="sm"
                    >
                        <Stepper.Step label="Basics" />
                        <Stepper.Step label="Access" />
                        <Stepper.Step label="URL" />
                        <Stepper.Step label="Menus" />
                    </Stepper>

                    <Box mih={STEP_CONTENT_MIN_HEIGHT}>
                        {renderStepContent()}
                    </Box>
                </Stack>
            </form>
        </ModalWrapper>
    );
}

export const CreatePageModal = ({ opened, onClose, parentPage = null, navigationPrefill }: ICreatePageModalProps) => {
    const [wizardGeneration, setWizardGeneration] = useState(0);
    const prevOpenedRef = useRef(false);

    useEffect(() => {
        if (opened && !prevOpenedRef.current) {
            setWizardGeneration((generation) => generation + 1);
        }
        prevOpenedRef.current = opened;
    }, [opened]);

    const requiresNavOverview = needsNavigationOverview(parentPage);

    const { data: navigationOverview, isPending: navOverviewPending, isFetched: navOverviewFetched } = useQuery({
        queryKey: REACT_QUERY_CONFIG.QUERY_KEYS.ADMIN_NAVIGATION_OVERVIEW,
        queryFn: () => AdminNavigationApi.getOverview(),
        enabled: opened,
        staleTime: REACT_QUERY_CONFIG.CACHE_TIERS.ADMIN_PAGES.staleTime,
    });

    const wizardReady = !requiresNavOverview || navOverviewFetched;

    if (!opened) {
        return null;
    }

    if (!wizardReady && navOverviewPending) {
        return (
            <ModalWrapper
                opened
                onClose={onClose}
                title={parentPage ? `Create Child Page under "${parentPage.keyword}"` : 'Create New Page'}
                size="xl"
                onCancel={onClose}
                cancelPosition="left"
                cancelLabel="Cancel"
                disableScroll
            >
                <Center mih={STEP_CONTENT_MIN_HEIGHT}>
                    <Loader size="sm" aria-label="Loading navigation menus" />
                </Center>
            </ModalWrapper>
        );
    }

    const wizardSessionKey = buildWizardSessionKey(
        parentPage,
        navigationPrefill,
        wizardGeneration,
    );

    return (
        <CreatePageWizard
            key={wizardSessionKey}
            parentPage={parentPage}
            navigationPrefill={navigationPrefill}
            navigationOverview={navigationOverview}
            onClose={onClose}
        />
    );
};
