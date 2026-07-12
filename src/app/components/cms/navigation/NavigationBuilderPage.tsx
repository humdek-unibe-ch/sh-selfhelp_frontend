/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
    Alert,
    Badge,
    Button,
    Group,
    Loader,
    Paper,
    Select,
    Stack,
    Switch,
    Tabs,
    Text,
} from '@mantine/core';
import {
    AdminNavigationApi,
    type IAdminNavigationMenuItem,
    type IAdminNavigationOverview,
} from '../../../../api/admin/navigation.api';
import { REACT_QUERY_CONFIG } from '../../../../config/react-query.config';
import { patchNavigationOverview, schedulePublicNavigationRefresh } from '../../../../utils/admin-navigation-cache.utils';
import { useAdminPages } from '../../../../hooks/useAdminPages';
import { useLanguageContext } from '../../contexts/LanguageContext';
import { useCanExportNavigation, useCanImportNavigation, useCanUpdateNavigation } from '../../../../hooks/usePermissionChecks';
import { CreatePageModal } from '../pages/create-page/CreatePage';
import { type IAdminPage } from '../../../../types/responses/admin/admin.types';
import {
    WEB_FOOTER_PRESET_OPTIONS,
    WEB_HEADER_PRESET_OPTIONS,
    isDoubleWebHeaderPreset,
    resolveWebFooterPreset,
    resolveWebHeaderPreset,
    type TNavigationChildrenNavMode,
} from '@selfhelp/shared';
import { PageHeader } from '../../shared/common/PageHeader';
import {
    MENU_TABS,
    navigationTabFromSearchParam,
    type TMenuKey,
    type TNavigationTab,
} from './navigation-builder.constants';
import {
    buildPageLookup,
    buildResolvedLabelByItemId,
    flattenPreviewItems,
    getMenuItemDisplay,
    nestStoredMenuItems,
} from './navigation-builder.utils';
import { NavigationSettingsPanel } from './NavigationSettingsPanel';
import { NavigationExportImportPanel } from './NavigationExportImportPanel';
import { NavigationMenuItemsList } from './NavigationMenuItemsList';
import { NavigationStructuralPreview } from './NavigationStructuralPreview';
import { AddMenuItemModal, EditMenuItemModal } from './NavigationItemModals';

/** Option shape shared by both preset catalogs (label + explanatory blurb). */
interface IPresetSelectOption {
    value: string;
    label: string;
    description?: string;
}

/** Two-line preset option: name plus its description underneath. */
function renderPresetOption(
    options: readonly IPresetSelectOption[],
): (input: { option: { value: string; label: string } }) => React.ReactNode {
    return function PresetOptionRow({ option }) {
        const preset = options.find((candidate) => candidate.value === option.value);
        return (
            <Stack gap={2}>
                <Text size="sm">{option.label}</Text>
                {preset?.description ? (
                    <Text size="xs" c="dimmed">{preset.description}</Text>
                ) : null}
            </Stack>
        );
    };
}

interface INavigationPrefill {
    menuKey: TMenuKey;
    parentItemId?: number | null;
    parentPage?: IAdminPage | null;
}

function buildNavigationUrl(pathname: string, tab: TNavigationTab, itemId?: number | null): string {
    const params = new URLSearchParams();
    params.set('menu', tab);
    if (itemId) {
        params.set('item', String(itemId));
    }
    return `${pathname}?${params.toString()}`;
}

export function NavigationBuilderPage(): React.ReactElement {
    const queryClient = useQueryClient();
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const { currentLanguageId } = useLanguageContext();
    const canUpdateNavigation = useCanUpdateNavigation();
    const canExportNavigation = useCanExportNavigation();
    const canImportNavigation = useCanImportNavigation();
    const showExportImportTab = canExportNavigation || canImportNavigation;
    const { pages } = useAdminPages();

    const menuParam = searchParams.get('menu');
    const activeTab = navigationTabFromSearchParam(menuParam);
    const highlightedItemId = Number(searchParams.get('item') || 0) || null;

    const [addOpen, setAddOpen] = useState(false);
    const [addParentItemId, setAddParentItemId] = useState<number | null>(null);
    const [addParentItemLabel, setAddParentItemLabel] = useState<string | null>(null);
    const [manualEditItem, setManualEditItem] = useState<IAdminNavigationMenuItem | null>(null);
    const [createPageOpen, setCreatePageOpen] = useState(false);
    const [createPrefill, setCreatePrefill] = useState<INavigationPrefill | null>(null);

    const activeMenu: TMenuKey = activeTab === 'settings' || activeTab === 'export_import'
        ? 'web_header'
        : activeTab;

    const replaceTabInUrl = useCallback((tab: TNavigationTab, itemId?: number | null) => {
        router.replace(buildNavigationUrl(pathname, tab, itemId), { scroll: false });
    }, [pathname, router]);

    useEffect(() => {
        if (!searchParams.get('menu')) {
            replaceTabInUrl('web_header');
        }
    }, [replaceTabInUrl, searchParams]);

    const { data, isLoading, error } = useQuery({
        queryKey: REACT_QUERY_CONFIG.QUERY_KEYS.ADMIN_NAVIGATION_OVERVIEW,
        queryFn: () => AdminNavigationApi.getOverview(),
        staleTime: REACT_QUERY_CONFIG.CACHE_TIERS.ADMIN_PAGES.staleTime,
    });

    const previewQuery = useQuery({
        queryKey: REACT_QUERY_CONFIG.QUERY_KEYS.ADMIN_NAVIGATION_PREVIEW(activeMenu, currentLanguageId),
        queryFn: () => AdminNavigationApi.getMenuPreview(activeMenu, currentLanguageId),
        enabled: currentLanguageId > 0 && activeTab !== 'settings' && activeTab !== 'export_import',
    });

    const refreshBuilderPreview = () => {
        void queryClient.invalidateQueries({
            queryKey: REACT_QUERY_CONFIG.QUERY_KEYS.ADMIN_NAVIGATION_PREVIEW(activeMenu, currentLanguageId),
        });
    };

    const refreshBuilderFully = (options?: { pages?: boolean; publicNav?: boolean }) => {
        void queryClient.invalidateQueries({ queryKey: REACT_QUERY_CONFIG.QUERY_KEYS.ADMIN_NAVIGATION_OVERVIEW });
        refreshBuilderPreview();
        if (options?.pages) {
            void queryClient.invalidateQueries({ queryKey: REACT_QUERY_CONFIG.QUERY_KEYS.ADMIN_PAGES });
        }
        if (options?.publicNav) {
            schedulePublicNavigationRefresh(queryClient);
        }
    };

    const applyOverviewPatch = (
        patcher: (current: IAdminNavigationOverview) => IAdminNavigationOverview,
    ) => {
        patchNavigationOverview(queryClient, patcher);
    };

    const deleteMutation = useMutation({
        mutationFn: (itemId: number) => AdminNavigationApi.deleteMenuItem(itemId),
        onSuccess: () => refreshBuilderFully({ pages: true, publicNav: true }),
    });

    const reorderMutation = useMutation({
        mutationFn: (order: Array<{ item_id: number; position: number; parent_item_id?: number | null; layer?: 'top' | null }>) =>
            AdminNavigationApi.reorderMenuItems(activeMenu, order),
        onMutate: (order) => {
            const positionById = new Map(order.map((row) => [row.item_id, row]));
            applyOverviewPatch((current) => {
                const menu = current.menus[activeMenu];
                if (!menu) {
                    return current;
                }
                const items = menu.items.map((item) => {
                    const patch = positionById.get(item.id);
                    if (!patch) {
                        return item;
                    }
                    return {
                        ...item,
                        position: patch.position,
                        parent_item_id: patch.parent_item_id ?? item.parent_item_id,
                        layer: 'layer' in patch ? patch.layer ?? null : item.layer,
                    };
                });
                return {
                    ...current,
                    menus: {
                        ...current.menus,
                        [activeMenu]: { ...menu, items },
                    },
                };
            });
        },
        onSettled: () => {
            refreshBuilderPreview();
            schedulePublicNavigationRefresh(queryClient);
        },
    });

    const menuDefinitionMutation = useMutation({
        mutationFn: ({ menuKey, payload }: {
            menuKey: 'web_header' | 'web_footer';
            payload: { preset?: string; children_nav?: TNavigationChildrenNavMode | null; show_breadcrumbs?: boolean; show_pager?: boolean };
        }) => AdminNavigationApi.updateMenuDefinition(menuKey, payload),
        onMutate: ({ menuKey, payload }) => {
            applyOverviewPatch((current) => {
                const menu = current.menus[menuKey];
                if (!menu) {
                    return current;
                }
                return {
                    ...current,
                    menus: {
                        ...current.menus,
                        [menuKey]: { ...menu, ...payload },
                    },
                };
            });
        },
        onSettled: () => {
            refreshBuilderPreview();
            schedulePublicNavigationRefresh(queryClient);
        },
    });

    const settingsMutation = useMutation({
        mutationFn: (payload: Record<string, unknown>) => AdminNavigationApi.updateSettings(payload),
        onSuccess: () => refreshBuilderFully({ publicNav: true }),
    });

    const pageById = useMemo(() => buildPageLookup(pages), [pages]);

    const urlEditItem = useMemo(() => {
        if (!highlightedItemId || !data?.menus[activeMenu]?.items?.length) {
            return null;
        }
        return data.menus[activeMenu]?.items.find((item) => item.id === highlightedItemId) ?? null;
    }, [highlightedItemId, data, activeMenu]);

    const editItem = manualEditItem ?? urlEditItem;

    if (isLoading) {
        return <Loader />;
    }

    if (error || !data) {
        return (
            <Alert color="red" title="Navigation">
                Failed to load navigation menus.
            </Alert>
        );
    }

    const menu = data.menus[activeMenu];
    const items = menu?.items ?? [];
    const previewItems = flattenPreviewItems(
        (previewQuery.data?.resolved?.items as Array<Record<string, unknown>> | undefined) ?? [],
    );
    const resolvedLabelByItemId = buildResolvedLabelByItemId(previewItems);

    const openAddExistingChild = (parentItem: IAdminNavigationMenuItem) => {
        const display = getMenuItemDisplay(parentItem, pageById, resolvedLabelByItemId);
        setAddParentItemId(parentItem.id);
        setAddParentItemLabel(display.primary);
        setAddOpen(true);
    };

    const openCreatePageHere = (parentItem?: IAdminNavigationMenuItem) => {
        const parentPage = parentItem?.page_id
            ? ({ id_pages: parentItem.page_id } as IAdminPage)
            : null;
        setCreatePrefill({
            menuKey: activeMenu,
            parentItemId: parentItem?.id ?? null,
            parentPage,
        });
        setCreatePageOpen(true);
    };

    const handleTabChange = (value: string | null) => {
        const nextTab = navigationTabFromSearchParam(value);
        replaceTabInUrl(nextTab);
    };

    return (
        <Stack gap="md">
            <PageHeader
                title="Navigation"
                subtitle="Manage public menus, preview resolved trees, and configure startup/search behaviour."
            >
                {canUpdateNavigation ? (
                    <>
                        <Button onClick={() => {
                            setAddParentItemId(null);
                            setAddParentItemLabel(null);
                            setAddOpen(true);
                        }}>
                            Add existing page
                        </Button>
                        <Button variant="light" onClick={() => openCreatePageHere()}>
                            Create page here
                        </Button>
                    </>
                ) : (
                    <Text size="sm" c="dimmed">Read-only — you can preview menus but cannot edit them.</Text>
                )}
            </PageHeader>

            <Tabs value={activeTab} onChange={handleTabChange} keepMounted={false}>
                <Tabs.List>
                    {MENU_TABS.map((tab) => (
                        <Tabs.Tab key={tab.key} value={tab.key}>{tab.label}</Tabs.Tab>
                    ))}
                    <Tabs.Tab value="settings">Settings</Tabs.Tab>
                    {showExportImportTab ? (
                        <Tabs.Tab value="export_import">Export / import</Tabs.Tab>
                    ) : null}
                </Tabs.List>

                {MENU_TABS.map((tab) => {
                    const tabMenu = data.menus[tab.key];
                    const tabItems = tabMenu?.items ?? [];
                    const tabNestedItems = nestStoredMenuItems(tabItems);
                    const isActiveMenuTab = activeTab === tab.key;
                    const rootItemCount = tabItems.filter((item) => item.parent_item_id === null).length;
                    const itemLimit = tabMenu?.item_limit ?? null;
                    const overItemLimit = itemLimit !== null && rootItemCount > itemLimit;
                    const headerPreset = tab.key === 'web_header' ? resolveWebHeaderPreset(tabMenu?.preset) : null;
                    const headerLayerMode = tab.key === 'web_header' && isDoubleWebHeaderPreset(headerPreset);
                    const topLayerCount = tab.key === 'web_header'
                        ? tabItems.filter((item) => item.layer === 'top').length
                        : 0;
                    const footerPreset = tab.key === 'web_footer' ? resolveWebFooterPreset(tabMenu?.preset) : null;

                    return (
                        <Tabs.Panel key={tab.key} value={tab.key} pt="md">
                            <Stack gap="md">
                                <Paper withBorder radius="md" p="md">
                                    <Group justify="space-between" align="flex-start" wrap="wrap">
                                        <div>
                                            <Text fw={600}>{tab.label}</Text>
                                            <Group gap="xs">
                                                <Text size="sm" c="dimmed">
                                                    {tabItems.length} stored item{tabItems.length === 1 ? '' : 's'}
                                                </Text>
                                                {itemLimit !== null ? (
                                                    <Badge
                                                        variant="light"
                                                        color={overItemLimit ? 'orange' : 'gray'}
                                                        title={overItemLimit
                                                            ? 'Extra root items are not shown; only the first ones up to the limit render.'
                                                            : 'Root items rendered by this menu.'}
                                                    >
                                                        {rootItemCount} / {itemLimit} root items
                                                    </Badge>
                                                ) : null}
                                            </Group>
                                        </div>
                                        {tab.key === 'web_header' ? (
                                            <Group gap="lg" align="flex-start" wrap="wrap">
                                                <Select
                                                    w={220}
                                                    label="Header preset"
                                                    description="Row layout and panel style"
                                                    inputWrapperOrder={['label', 'input', 'description']}
                                                    data={WEB_HEADER_PRESET_OPTIONS.map((opt) => ({
                                                        value: opt.value,
                                                        label: opt.label,
                                                    }))}
                                                    renderOption={renderPresetOption(WEB_HEADER_PRESET_OPTIONS)}
                                                    value={headerPreset}
                                                    disabled={!canUpdateNavigation}
                                                    onChange={(value) => {
                                                        if (value) menuDefinitionMutation.mutate({ menuKey: 'web_header', payload: { preset: value } });
                                                    }}
                                                />
                                                <Select
                                                    w={220}
                                                    label="Child pages navigation"
                                                    description="Default for pages with children"
                                                    inputWrapperOrder={['label', 'input', 'description']}
                                                    data={[
                                                        { value: 'sidebar', label: 'Left sidebar' },
                                                        { value: 'pills', label: 'Pill strip' },
                                                        { value: 'none', label: 'Hidden' },
                                                    ]}
                                                    value={tabMenu?.children_nav ?? 'sidebar'}
                                                    disabled={!canUpdateNavigation}
                                                    onChange={(value) => {
                                                        if (value) {
                                                            menuDefinitionMutation.mutate({
                                                                menuKey: 'web_header',
                                                                payload: { children_nav: value as TNavigationChildrenNavMode },
                                                            });
                                                        }
                                                    }}
                                                />
                                                <div>
                                                    <Text size="sm" fw={500} lh="var(--mantine-line-height-sm)" mb={7}>
                                                        Child page extras
                                                    </Text>
                                                    <Stack gap={8}>
                                                        <Switch
                                                            size="sm"
                                                            label="Breadcrumbs"
                                                            checked={tabMenu?.show_breadcrumbs ?? false}
                                                            disabled={!canUpdateNavigation}
                                                            onChange={(event) => {
                                                                menuDefinitionMutation.mutate({
                                                                    menuKey: 'web_header',
                                                                    payload: { show_breadcrumbs: event.currentTarget.checked },
                                                                });
                                                            }}
                                                        />
                                                        <Switch
                                                            size="sm"
                                                            label="Prev / next pager"
                                                            checked={tabMenu?.show_pager ?? true}
                                                            disabled={!canUpdateNavigation}
                                                            onChange={(event) => {
                                                                menuDefinitionMutation.mutate({
                                                                    menuKey: 'web_header',
                                                                    payload: { show_pager: event.currentTarget.checked },
                                                                });
                                                            }}
                                                        />
                                                    </Stack>
                                                </div>
                                            </Group>
                                        ) : tab.key === 'web_footer' ? (
                                            <Select
                                                w={260}
                                                label="Footer layout"
                                                data={WEB_FOOTER_PRESET_OPTIONS.map((opt) => ({
                                                    value: opt.value,
                                                    label: opt.label,
                                                }))}
                                                renderOption={renderPresetOption(WEB_FOOTER_PRESET_OPTIONS)}
                                                value={footerPreset}
                                                disabled={!canUpdateNavigation}
                                                onChange={(value) => {
                                                    if (value) menuDefinitionMutation.mutate({ menuKey: 'web_footer', payload: { preset: value } });
                                                }}
                                            />
                                        ) : null}
                                    </Group>
                                    {tab.key === 'web_header' && !headerLayerMode && topLayerCount > 0 ? (
                                        <Alert color="blue" variant="light" mt="sm" p="xs">
                                            {topLayerCount} item{topLayerCount === 1 ? '' : 's'} assigned to the top row
                                            {' '}are appended after the main items in single-row presets. Their assignment
                                            {' '}is kept — switch back to a double preset to restore the split.
                                        </Alert>
                                    ) : null}
                                    {tab.key === 'web_footer' && footerPreset === 'inline' ? (
                                        <Alert color="blue" variant="light" mt="sm" p="xs">
                                            Inline layout hides group headings and shows their links in one flat row.
                                            {' '}Groups are kept and restored when you switch back to columns.
                                        </Alert>
                                    ) : null}
                                    <NavigationStructuralPreview
                                        menuKey={tab.key}
                                        items={tabItems}
                                        layerMode={headerLayerMode}
                                        footerPreset={footerPreset}
                                        itemLimit={itemLimit}
                                        pageById={pageById}
                                        resolvedLabelByItemId={isActiveMenuTab ? resolvedLabelByItemId : new Map()}
                                    />
                                </Paper>

                                <div>
                                    <Text fw={600} mb="xs">Menu structure</Text>
                                    <NavigationMenuItemsList
                                        menuKey={tab.key}
                                        items={tabItems}
                                        nestedItems={tabNestedItems}
                                        layerMode={headerLayerMode}
                                        pageById={pageById}
                                        resolvedLabelByItemId={isActiveMenuTab ? resolvedLabelByItemId : new Map()}
                                        highlightedItemId={isActiveMenuTab ? highlightedItemId : null}
                                        canUpdate={canUpdateNavigation && isActiveMenuTab}
                                        onReorder={(order) => reorderMutation.mutate(order)}
                                        onEdit={setManualEditItem}
                                        onAddExistingChildPage={isActiveMenuTab ? openAddExistingChild : () => {}}
                                        onCreateChildPage={openCreatePageHere}
                                        onRemove={(itemId) => deleteMutation.mutate(itemId)}
                                        isRemovePending={deleteMutation.isPending}
                                    />
                                </div>
                            </Stack>
                        </Tabs.Panel>
                    );
                })}

                <Tabs.Panel value="settings" pt="md">
                    <NavigationSettingsPanel
                        settings={data.settings}
                        isSaving={settingsMutation.isPending}
                        readOnly={!canUpdateNavigation}
                        onSave={(payload) => settingsMutation.mutate(payload)}
                    />
                </Tabs.Panel>

                {showExportImportTab ? (
                    <Tabs.Panel value="export_import" pt="md">
                        <NavigationExportImportPanel
                            onImported={() => refreshBuilderFully({ pages: true, publicNav: true })}
                        />
                    </Tabs.Panel>
                ) : null}
            </Tabs>

            <AddMenuItemModal
                menuKey={activeMenu}
                parentItemId={addParentItemId}
                parentItemLabel={addParentItemLabel}
                menuItems={items}
                opened={addOpen}
                onClose={() => {
                    setAddOpen(false);
                    setAddParentItemId(null);
                    setAddParentItemLabel(null);
                }}
                onCreated={() => refreshBuilderFully({ pages: true, publicNav: true })}
            />

            <EditMenuItemModal
                menuKey={activeMenu}
                item={editItem}
                menuItems={items}
                previewItems={previewItems}
                opened={editItem !== null}
                onClose={() => {
                    setManualEditItem(null);
                    if (highlightedItemId) {
                        replaceTabInUrl(activeTab);
                    }
                }}
                onSaved={() => refreshBuilderFully({ pages: true, publicNav: true })}
            />

            <CreatePageModal
                opened={createPageOpen}
                onClose={() => { setCreatePageOpen(false); setCreatePrefill(null); }}
                parentPage={createPrefill?.parentPage ?? null}
                navigationPrefill={createPrefill ? {
                    menuKey: createPrefill.menuKey,
                    parentItemId: createPrefill.parentItemId,
                } : undefined}
            />
        </Stack>
    );
}
