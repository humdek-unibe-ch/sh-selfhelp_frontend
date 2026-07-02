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
import { useCanUpdateNavigation } from '../../../../hooks/usePermissionChecks';
import { CreatePageModal } from '../pages/create-page/CreatePage';
import { type IAdminPage } from '../../../../types/responses/admin/admin.types';
import { WEB_HEADER_PRESET_OPTIONS as SHARED_PRESET_OPTIONS } from '@selfhelp/shared';
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
import { NavigationMenuItemsList } from './NavigationMenuItemsList';
import { AddMenuItemModal, EditMenuItemModal } from './NavigationItemModals';

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
    const { pages } = useAdminPages();

    const menuParam = searchParams.get('menu');
    const activeTab = navigationTabFromSearchParam(menuParam);
    const highlightedItemId = Number(searchParams.get('item') || 0) || null;

    const [addOpen, setAddOpen] = useState(false);
    const [addParentItemId, setAddParentItemId] = useState<number | null>(null);
    const [addParentItemLabel, setAddParentItemLabel] = useState<string | null>(null);
    const [editItem, setEditItem] = useState<IAdminNavigationMenuItem | null>(null);
    const [createPageOpen, setCreatePageOpen] = useState(false);
    const [createPrefill, setCreatePrefill] = useState<INavigationPrefill | null>(null);

    const activeMenu: TMenuKey = activeTab === 'settings' ? 'web_header' : activeTab;

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
        enabled: currentLanguageId > 0 && activeTab !== 'settings',
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
        mutationFn: (order: Array<{ item_id: number; position: number; parent_item_id?: number | null }>) =>
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

    useEffect(() => {
        if (!highlightedItemId || !data?.menus[activeMenu]?.items?.length) {
            return;
        }
        const match = data.menus[activeMenu]?.items.find((item) => item.id === highlightedItemId) ?? null;
        if (match) {
            setEditItem(match);
        }
    }, [highlightedItemId, data, activeMenu]);

    const presetMutation = useMutation({
        mutationFn: (preset: string) => AdminNavigationApi.updateMenuDefinition('web_header', { preset }),
        onMutate: (preset) => {
            applyOverviewPatch((current) => {
                const menu = current.menus.web_header;
                if (!menu) {
                    return current;
                }
                return {
                    ...current,
                    menus: {
                        ...current.menus,
                        web_header: { ...menu, preset },
                    },
                };
            });
        },
        onSettled: () => {
            refreshBuilderPreview();
            schedulePublicNavigationRefresh(queryClient);
        },
    });

    const footerPresetMutation = useMutation({
        mutationFn: (layout: string) => AdminNavigationApi.updateMenuDefinition('web_footer', {
            config: { footer_layout: layout },
        }),
        onMutate: (layout) => {
            applyOverviewPatch((current) => {
                const menu = current.menus.web_footer;
                if (!menu) {
                    return current;
                }
                const config = {
                    ...(typeof menu.config === 'object' && menu.config !== null
                        ? menu.config as Record<string, unknown>
                        : {}),
                    footer_layout: layout,
                };
                return {
                    ...current,
                    menus: {
                        ...current.menus,
                        web_footer: { ...menu, config },
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
    const nestedStoredItems = nestStoredMenuItems(items);
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
                </Tabs.List>

                {MENU_TABS.map((tab) => {
                    const tabMenu = data.menus[tab.key];
                    const tabItems = tabMenu?.items ?? [];
                    const tabNestedItems = nestStoredMenuItems(tabItems);
                    const isActiveMenuTab = activeTab === tab.key;

                    return (
                        <Tabs.Panel key={tab.key} value={tab.key} pt="md">
                            <Stack gap="md">
                                <Paper withBorder radius="md" p="md">
                                    <Group justify="space-between" align="flex-end" wrap="wrap">
                                        <div>
                                            <Text fw={600}>{tab.label}</Text>
                                            <Text size="sm" c="dimmed">
                                                {tabItems.length} stored item{tabItems.length === 1 ? '' : 's'}
                                            </Text>
                                        </div>
                                        {tab.key === 'web_header' ? (
                                            <Select
                                                w={260}
                                                label="Header preset"
                                                data={SHARED_PRESET_OPTIONS.map((opt) => ({
                                                    value: opt.value,
                                                    label: opt.label,
                                                }))}
                                                value={tabMenu?.preset ?? 'dropdown'}
                                                disabled={!canUpdateNavigation}
                                                onChange={(value) => {
                                                    if (value) presetMutation.mutate(value);
                                                }}
                                            />
                                        ) : tab.key === 'web_footer' ? (
                                            <Select
                                                w={260}
                                                label="Footer layout"
                                                data={[
                                                    { value: 'columns', label: 'Columns (grouped)' },
                                                    { value: 'inline', label: 'Inline links' },
                                                ]}
                                                value={
                                                    (typeof tabMenu?.config === 'object' && tabMenu?.config !== null
                                                        ? (tabMenu.config as Record<string, unknown>).footer_layout
                                                        : null) as string | undefined ?? 'columns'
                                                }
                                                disabled={!canUpdateNavigation}
                                                onChange={(value) => {
                                                    if (value) {
                                                        footerPresetMutation.mutate(value);
                                                    }
                                                }}
                                            />
                                        ) : tabMenu?.preset ? (
                                            <Badge variant="light">preset: {tabMenu.preset}</Badge>
                                        ) : null}
                                    </Group>
                                </Paper>

                                <div>
                                    <Text fw={600} mb="xs">Menu structure</Text>
                                    <NavigationMenuItemsList
                                        menuKey={tab.key}
                                        items={tabItems}
                                        nestedItems={tabNestedItems}
                                        pageById={pageById}
                                        resolvedLabelByItemId={isActiveMenuTab ? resolvedLabelByItemId : new Map()}
                                        highlightedItemId={isActiveMenuTab ? highlightedItemId : null}
                                        canUpdate={canUpdateNavigation && isActiveMenuTab}
                                        onReorder={(order) => reorderMutation.mutate(order)}
                                        onEdit={setEditItem}
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
            </Tabs>

            <AddMenuItemModal
                menuKey={activeMenu}
                parentItemId={addParentItemId}
                parentItemLabel={addParentItemLabel}
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
                    setEditItem(null);
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
