/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
'use client';

import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'next/navigation';
import {
    Alert,
    Badge,
    Button,
    Group,
    Loader,
    Modal,
    NumberInput,
    Select,
    Stack,
    Table,
    Tabs,
    Text,
    TextInput,
    Title,
} from '@mantine/core';
import {
    AdminNavigationApi,
    type IAdminNavigationMenuItem,
    type ICreateNavigationMenuItemRequest,
    type IUpdateNavigationMenuItemRequest,
} from '../../../../api/admin/navigation.api';
import { REACT_QUERY_CONFIG } from '../../../../config/react-query.config';
import { invalidateAdminNavigationQueries } from '../../../../utils/admin-navigation-cache.utils';
import { useAdminPages } from '../../../../hooks/useAdminPages';
import { useLanguageContext } from '../../contexts/LanguageContext';
import { useCanUpdateNavigation } from '../../../../hooks/usePermissionChecks';
import { CreatePageModal } from '../pages/create-page/CreatePage';
import { type IAdminPage } from '../../../../types/responses/admin/admin.types';
import { WEB_HEADER_PRESET_OPTIONS as SHARED_PRESET_OPTIONS } from '@selfhelp/shared';

const MENU_TABS = [
    { key: 'web_header', label: 'Web header' },
    { key: 'web_footer', label: 'Web footer' },
    { key: 'mobile_drawer', label: 'Mobile drawer' },
    { key: 'mobile_bottom_tabs', label: 'Mobile tabs' },
] as const;

type TMenuKey = (typeof MENU_TABS)[number]['key'];

interface INavigationPrefill {
    menuKey: TMenuKey;
    parentItemId?: number | null;
    parentPage?: IAdminPage | null;
}

function flattenPreviewItems(
    items: Array<Record<string, unknown>>,
    depth = 0,
): Array<Record<string, unknown> & { depth: number }> {
    const rows: Array<Record<string, unknown> & { depth: number }> = [];
    for (const item of items) {
        rows.push({ ...item, depth });
        const children = item.children;
        if (Array.isArray(children)) {
            rows.push(...flattenPreviewItems(children as Array<Record<string, unknown>>, depth + 1));
        }
    }
    return rows;
}

function parentItemOptions(items: IAdminNavigationMenuItem[]): Array<{ value: string; label: string }> {
    return items.map((item) => ({
        value: String(item.id),
        label: `#${item.id} ${item.item_type}${item.page_id ? ` → page ${item.page_id}` : ''}`,
    }));
}

function nestStoredMenuItems(
    items: IAdminNavigationMenuItem[],
): Array<IAdminNavigationMenuItem & { depth: number }> {
    const byParent = new Map<number | 'root', IAdminNavigationMenuItem[]>();
    for (const item of items) {
        const parentKey = item.parent_item_id ?? 'root';
        const bucket = byParent.get(parentKey) ?? [];
        bucket.push(item);
        byParent.set(parentKey, bucket);
    }

    const output: Array<IAdminNavigationMenuItem & { depth: number }> = [];
    const walk = (parentKey: number | 'root', depth: number): void => {
        const siblings = (byParent.get(parentKey) ?? []).sort((a, b) => a.position - b.position);
        for (const sibling of siblings) {
            output.push({ ...sibling, depth });
            walk(sibling.id, depth + 1);
        }
    };
    walk('root', 0);

    return output;
}

function parseVirtualPreviewItemId(id: unknown): { menuItemId: number; pageId: number } | null {
    if (typeof id !== 'string' || !id.startsWith('virtual-')) {
        return null;
    }
    const match = /^virtual-(\d+)-(\d+)$/.exec(id);
    if (!match) {
        return null;
    }

    return { menuItemId: Number(match[1]), pageId: Number(match[2]) };
}

interface IEditMenuItemModalProps {
    item: IAdminNavigationMenuItem | null;
    menuKey: TMenuKey;
    menuItems: IAdminNavigationMenuItem[];
    opened: boolean;
    onClose: () => void;
    onSaved: () => void;
}

function EditMenuItemModal({ item, menuKey: _menuKey, menuItems, opened, onClose, onSaved }: IEditMenuItemModalProps) {
    const { currentLanguageId, languages } = useLanguageContext();
    const [childSource, setChildSource] = useState('manual');
    const [iconOverride, setIconOverride] = useState('');
    const [parentItemId, setParentItemId] = useState<string | null>(null);
    const [label, setLabel] = useState('');
    const [description, setDescription] = useState('');

    useEffect(() => {
        if (!item) return;
        // Sync local form state when the inspector targets a different menu item.
        // eslint-disable-next-line react-hooks/set-state-in-effect -- controlled form reset on selection change
        setChildSource(item.child_source ?? 'manual');
        setIconOverride(item.icon_override ?? '');
        setParentItemId(item.parent_item_id ? String(item.parent_item_id) : null);
        setLabel('');
        setDescription('');
    }, [item]);

    const updateMutation = useMutation({
        mutationFn: (payload: Partial<IUpdateNavigationMenuItemRequest>) =>
            AdminNavigationApi.updateMenuItem(item!.id, payload),
        onSuccess: () => {
            onSaved();
            onClose();
        },
    });

    if (!item) return null;

    const payload: Partial<IUpdateNavigationMenuItemRequest> = {
        child_source: childSource,
        icon_override: iconOverride || null,
        parent_item_id: parentItemId ? Number(parentItemId) : null,
    };
    if (label.trim() !== '' || description.trim() !== '') {
        payload.translations = [{
            language_id: currentLanguageId,
            label: label.trim() || null,
            description: description.trim() || null,
        }];
    }

    return (
        <Modal opened={opened} onClose={onClose} title={`Edit menu item #${item.id}`}>
            <Stack gap="sm">
                <Select
                    label="Parent item"
                    clearable
                    data={parentItemOptions(menuItems.filter((row) => row.id !== item.id))}
                    value={parentItemId}
                    onChange={setParentItemId}
                />
                {item.item_type === 'page' ? (
                    <Select
                        label="Child source"
                        data={[
                            { value: 'manual', label: 'Manual children only' },
                            { value: 'page_children', label: 'Auto-include page children' },
                            { value: 'manual_plus_suggestions', label: 'Manual + builder suggestions' },
                        ]}
                        value={childSource}
                        onChange={(value) => setChildSource(value ?? 'manual')}
                    />
                ) : null}
                <TextInput label="Icon override" value={iconOverride} onChange={(e) => setIconOverride(e.currentTarget.value)} />
                <TextInput
                    label={`Custom label (${languages.find((l) => l.id === currentLanguageId)?.locale ?? 'current'})`}
                    description="Leave empty to use the page title."
                    value={label}
                    onChange={(e) => setLabel(e.currentTarget.value)}
                />
                <TextInput
                    label="Description (optional)"
                    value={description}
                    onChange={(e) => setDescription(e.currentTarget.value)}
                />
                <Group justify="flex-end">
                    <Button variant="default" onClick={onClose}>Cancel</Button>
                    <Button loading={updateMutation.isPending} onClick={() => updateMutation.mutate(payload)}>Save</Button>
                </Group>
            </Stack>
        </Modal>
    );
}

interface IAddItemModalProps {
    menuKey: TMenuKey;
    parentItemId?: number | null;
    opened: boolean;
    onClose: () => void;
    onCreated: () => void;
}

function AddMenuItemModal({ menuKey, parentItemId, opened, onClose, onCreated }: IAddItemModalProps) {
    const { pages } = useAdminPages();
    const [pageId, setPageId] = useState<string | null>(null);
    const [childSource, setChildSource] = useState<string>('manual');
    const [externalUrl, setExternalUrl] = useState('');
    const [groupLabel, setGroupLabel] = useState('');
    const [itemType, setItemType] = useState<'page' | 'external_url' | 'group'>('page');
    const { currentLanguageId } = useLanguageContext();

    const pageOptions = useMemo(
        () => (pages ?? []).map((page) => ({
            value: String(page.id_pages),
            label: page.keyword,
        })),
        [pages],
    );

    const createMutation = useMutation({
        mutationFn: (payload: ICreateNavigationMenuItemRequest) =>
            AdminNavigationApi.createMenuItem(menuKey, payload),
        onSuccess: () => {
            onCreated();
            onClose();
            setPageId(null);
            setExternalUrl('');
            setGroupLabel('');
        },
    });

    return (
        <Modal opened={opened} onClose={onClose} title={`Add item — ${menuKey}`}>
            <Stack gap="sm">
                <Select
                    label="Item type"
                    data={[
                        { value: 'page', label: 'Page' },
                        { value: 'external_url', label: 'External URL' },
                        { value: 'group', label: 'Group heading' },
                    ]}
                    value={itemType}
                    onChange={(value) => setItemType((value as typeof itemType) ?? 'page')}
                />
                {itemType === 'page' ? (
                    <Select label="Page" searchable data={pageOptions} value={pageId} onChange={setPageId} />
                ) : null}
                {itemType === 'external_url' ? (
                    <TextInput label="URL" value={externalUrl} onChange={(e) => setExternalUrl(e.currentTarget.value)} />
                ) : null}
                {itemType === 'group' ? (
                    <TextInput label="Group label" required value={groupLabel} onChange={(e) => setGroupLabel(e.currentTarget.value)} />
                ) : null}
                {itemType === 'page' ? (
                    <Select
                        label="Child source"
                        data={[
                            { value: 'manual', label: 'Manual children only' },
                            { value: 'page_children', label: 'Auto-include page children' },
                            { value: 'manual_plus_suggestions', label: 'Manual + builder suggestions' },
                        ]}
                        value={childSource}
                        onChange={(value) => setChildSource(value ?? 'manual')}
                    />
                ) : null}
                <Group justify="flex-end">
                    <Button variant="default" onClick={onClose}>Cancel</Button>
                    <Button
                        loading={createMutation.isPending}
                        onClick={() => {
                            const payload: ICreateNavigationMenuItemRequest = {
                                item_type: itemType,
                                child_source: childSource,
                                parent_item_id: parentItemId ?? null,
                            };
                            if (itemType === 'page' && pageId) {
                                payload.page_id = Number(pageId);
                            }
                            if (itemType === 'external_url') {
                                payload.external_url = externalUrl;
                                payload.translations = [{ language_id: currentLanguageId, label: externalUrl }];
                            }
                            if (itemType === 'group') {
                                payload.translations = [{ language_id: currentLanguageId, label: groupLabel }];
                            }
                            createMutation.mutate(payload);
                        }}
                    >
                        Add
                    </Button>
                </Group>
            </Stack>
        </Modal>
    );
}

function NavigationSettingsPanel({
    settings,
    onSave,
    isSaving,
    readOnly = false,
}: {
    settings: Record<string, unknown>;
    onSave: (payload: Record<string, unknown>) => void;
    isSaving: boolean;
    readOnly?: boolean;
}) {
    const { pages } = useAdminPages();
    const pageOptions = useMemo(
        () => (pages ?? []).map((page) => ({ value: String(page.id_pages), label: page.keyword })),
        [pages],
    );

    const [searchMode, setSearchMode] = useState(String(settings.web_header_search_mode ?? 'content_index'));
    const [minChars, setMinChars] = useState(Number(settings.web_header_search_min_chars ?? 2));
    const [resultLimit, setResultLimit] = useState(Number(settings.web_header_search_result_limit ?? 8));
    const [fieldPolicy, setFieldPolicy] = useState(String(settings.search_field_policy ?? 'all_display_text'));
    const [visibility, setVisibility] = useState(String(settings.search_default_visibility ?? 'all_accessible_pages'));
    const [webStartMode, setWebStartMode] = useState(String(settings.web_user_start_mode ?? 'fixed_page'));
    const [mobileStartMode, setMobileStartMode] = useState(String(settings.mobile_user_start_mode ?? 'fixed_page'));
    const [mobileStartSource, setMobileStartSource] = useState(String(settings.mobile_start_page_source ?? 'same_as_web'));
    const [routeSyncPolicy, setRouteSyncPolicy] = useState(String(settings.route_sync_old_route_policy ?? 'ask'));
    const [webGuestStart, setWebGuestStart] = useState(settings.web_guest_start_page_id ? String(settings.web_guest_start_page_id) : null);
    const [webUserStart, setWebUserStart] = useState(settings.web_user_start_page_id ? String(settings.web_user_start_page_id) : null);
    const [mobileGuestStart, setMobileGuestStart] = useState(settings.mobile_guest_start_page_id ? String(settings.mobile_guest_start_page_id) : null);
    const [mobileUserStart, setMobileUserStart] = useState(settings.mobile_user_start_page_id ? String(settings.mobile_user_start_page_id) : null);

    return (
        <Stack gap="sm">
            <Title order={4}>Start & search</Title>
            <Select
                label="Web header search mode"
                data={[
                    { value: 'off', label: 'Off' },
                    { value: 'menu_pages', label: 'Menu pages only' },
                    { value: 'searchable_pages', label: 'Searchable pages' },
                    { value: 'content_index', label: 'Content index' },
                ]}
                value={searchMode}
                onChange={(value) => setSearchMode(value ?? 'content_index')}
                disabled={readOnly}
            />
            <Group grow>
                <NumberInput label="Min chars" value={minChars} onChange={(v) => setMinChars(Number(v) || 2)} min={1} disabled={readOnly} />
                <NumberInput label="Result limit" value={resultLimit} onChange={(v) => setResultLimit(Number(v) || 8)} min={1} max={50} disabled={readOnly} />
            </Group>
            <Select
                label="Search field policy"
                data={[
                    { value: 'all_display_text', label: 'All display text' },
                    { value: 'page_metadata_only', label: 'Page metadata only' },
                ]}
                value={fieldPolicy}
                onChange={(value) => setFieldPolicy(value ?? 'all_display_text')}
                disabled={readOnly}
            />
            <Select
                label="Default search visibility"
                data={[
                    { value: 'all_accessible_pages', label: 'All accessible pages' },
                    { value: 'menu_pages_only', label: 'Menu pages only' },
                ]}
                value={visibility}
                onChange={(value) => setVisibility(value ?? 'all_accessible_pages')}
                disabled={readOnly}
            />
            <Select label="Web guest start page" searchable clearable data={pageOptions} value={webGuestStart} onChange={setWebGuestStart} disabled={readOnly} />
            <Select label="Web logged-in start page" searchable clearable data={pageOptions} value={webUserStart} onChange={setWebUserStart} disabled={readOnly} />
            <Select
                label="Web logged-in start mode"
                data={[
                    { value: 'fixed_page', label: 'Fixed landing page' },
                    { value: 'last_visited_then_fixed_page', label: 'Last visited, then fixed page' },
                ]}
                value={webStartMode}
                onChange={(value) => setWebStartMode(value ?? 'fixed_page')}
                disabled={readOnly}
            />
            <Select
                label="Mobile start page source"
                data={[
                    { value: 'same_as_web', label: 'Same as web' },
                    { value: 'custom_mobile_pages', label: 'Custom mobile pages' },
                ]}
                value={mobileStartSource}
                onChange={(value) => setMobileStartSource(value ?? 'same_as_web')}
                disabled={readOnly}
            />
            <Select
                label="Mobile guest start page"
                searchable
                clearable
                disabled={readOnly || mobileStartSource !== 'custom_mobile_pages'}
                data={pageOptions}
                value={mobileGuestStart}
                onChange={setMobileGuestStart}
            />
            <Select
                label="Mobile logged-in start page"
                searchable
                clearable
                disabled={readOnly || mobileStartSource !== 'custom_mobile_pages'}
                data={pageOptions}
                value={mobileUserStart}
                onChange={setMobileUserStart}
            />
            <Select
                label="Mobile logged-in start mode"
                data={[
                    { value: 'fixed_page', label: 'Fixed landing page' },
                    { value: 'last_visited_then_fixed_page', label: 'Last visited, then fixed page' },
                ]}
                value={mobileStartMode}
                onChange={(value) => setMobileStartMode(value ?? 'fixed_page')}
                disabled={readOnly}
            />
            <Select
                label="Route sync old-route policy"
                data={[
                    { value: 'ask', label: 'Ask on each save' },
                    { value: 'keep_alias', label: 'Keep old route as alias' },
                    { value: 'remove_old_route', label: 'Remove old route' },
                ]}
                value={routeSyncPolicy}
                onChange={(value) => setRouteSyncPolicy(value ?? 'ask')}
                disabled={readOnly}
            />
            {!readOnly ? (
            <Button
                loading={isSaving}
                onClick={() => onSave({
                    web_header_search_mode: searchMode,
                    web_header_search_min_chars: minChars,
                    web_header_search_result_limit: resultLimit,
                    search_field_policy: fieldPolicy,
                    search_default_visibility: visibility,
                    web_guest_start_page_id: webGuestStart ? Number(webGuestStart) : null,
                    web_user_start_page_id: webUserStart ? Number(webUserStart) : null,
                    web_user_start_mode: webStartMode,
                    mobile_guest_start_page_id: mobileGuestStart ? Number(mobileGuestStart) : null,
                    mobile_user_start_page_id: mobileUserStart ? Number(mobileUserStart) : null,
                    mobile_user_start_mode: mobileStartMode,
                    mobile_start_page_source: mobileStartSource,
                    route_sync_old_route_policy: routeSyncPolicy,
                })}
            >
                Save settings
            </Button>
            ) : (
                <Text size="sm" c="dimmed">Read-only — you need navigation update permission to change settings.</Text>
            )}
        </Stack>
    );
}

export function NavigationBuilderPage(): React.ReactElement {
    const queryClient = useQueryClient();
    const searchParams = useSearchParams();
    const { currentLanguageId } = useLanguageContext();
    const canUpdateNavigation = useCanUpdateNavigation();
    const initialMenu = (searchParams.get('menu') as TMenuKey | null) ?? 'web_header';
    const highlightedItemId = Number(searchParams.get('item') || 0) || null;
    const [activeMenu, setActiveMenu] = useState<TMenuKey>(initialMenu);
    const [addOpen, setAddOpen] = useState(false);
    const [addParentItemId, setAddParentItemId] = useState<number | null>(null);
    const [editItem, setEditItem] = useState<IAdminNavigationMenuItem | null>(null);
    const [createPageOpen, setCreatePageOpen] = useState(false);
    const [createPrefill, setCreatePrefill] = useState<INavigationPrefill | null>(null);
    const [draggedId, setDraggedId] = useState<number | null>(null);

    const { data, isLoading, error } = useQuery({
        queryKey: REACT_QUERY_CONFIG.QUERY_KEYS.ADMIN_NAVIGATION_OVERVIEW,
        queryFn: () => AdminNavigationApi.getOverview(),
        staleTime: REACT_QUERY_CONFIG.CACHE_TIERS.ADMIN_PAGES.staleTime,
    });

    const previewQuery = useQuery({
        queryKey: REACT_QUERY_CONFIG.QUERY_KEYS.ADMIN_NAVIGATION_PREVIEW(activeMenu, currentLanguageId),
        queryFn: () => AdminNavigationApi.getMenuPreview(activeMenu, currentLanguageId),
        enabled: currentLanguageId > 0,
    });

    const invalidate = () => {
        void invalidateAdminNavigationQueries(queryClient);
        void queryClient.invalidateQueries({ queryKey: REACT_QUERY_CONFIG.QUERY_KEYS.ADMIN_PAGES });
    };

    const deleteMutation = useMutation({
        mutationFn: (itemId: number) => AdminNavigationApi.deleteMenuItem(itemId),
        onSuccess: invalidate,
    });

    const convertMutation = useMutation({
        mutationFn: (itemId: number) => AdminNavigationApi.convertAutoChildren(itemId, currentLanguageId),
        onSuccess: invalidate,
    });

    const addExclusionMutation = useMutation({
        mutationFn: ({ itemId, pageId }: { itemId: number; pageId: number }) =>
            AdminNavigationApi.addMenuItemExclusion(itemId, pageId),
        onSuccess: invalidate,
    });

    const removeExclusionMutation = useMutation({
        mutationFn: ({ itemId, pageId }: { itemId: number; pageId: number }) =>
            AdminNavigationApi.removeMenuItemExclusion(itemId, pageId),
        onSuccess: invalidate,
    });

    const reorderMutation = useMutation({
        mutationFn: (order: Array<{ item_id: number; position: number; parent_item_id?: number | null }>) =>
            AdminNavigationApi.reorderMenuItems(activeMenu, order),
        onSuccess: invalidate,
    });

    useEffect(() => {
        if (!highlightedItemId || !data?.menus[activeMenu]?.items?.length) {
            return;
        }
        const match = data.menus[activeMenu]?.items.find((item) => item.id === highlightedItemId) ?? null;
        if (match) {
            // eslint-disable-next-line react-hooks/set-state-in-effect -- deep-link highlight opens the inspector
            setEditItem(match);
        }
    }, [highlightedItemId, data, activeMenu]);

    const presetMutation = useMutation({
        mutationFn: (preset: string) => AdminNavigationApi.updateMenuDefinition('web_header', { preset }),
        onSuccess: invalidate,
    });

    const footerPresetMutation = useMutation({
        mutationFn: (layout: string) => AdminNavigationApi.updateMenuDefinition('web_footer', {
            config: { footer_layout: layout },
        }),
        onSuccess: invalidate,
    });

    const settingsMutation = useMutation({
        mutationFn: (payload: Record<string, unknown>) => AdminNavigationApi.updateSettings(payload),
        onSuccess: invalidate,
    });

    const handleDrop = (target: IAdminNavigationMenuItem) => {
        if (!data || draggedId === null || draggedId === target.id) return;
        const menu = data.menus[activeMenu];
        const items = menu?.items ?? [];
        const dragged = items.find((row) => row.id === draggedId);
        if (!dragged) return;
        const siblings = items
            .filter((row) => row.parent_item_id === target.parent_item_id && row.id !== draggedId)
            .sort((a, b) => a.position - b.position);
        const targetIndex = siblings.findIndex((row) => row.id === target.id);
        siblings.splice(Math.max(targetIndex, 0), 0, { ...dragged, parent_item_id: target.parent_item_id });
        const order = siblings.map((row, index) => ({
            item_id: row.id,
            position: (index + 1) * 10,
            parent_item_id: row.parent_item_id,
        }));
        if (!order.some((row) => row.item_id === draggedId)) {
            order.push({
                item_id: draggedId,
                position: (order.length + 1) * 10,
                parent_item_id: target.parent_item_id,
            });
        }
        reorderMutation.mutate(order);
        setDraggedId(null);
    };

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

    return (
        <Stack gap="md">
            <Group justify="space-between">
                <div>
                    <Title order={2}>Navigation</Title>
                    <Text c="dimmed" size="sm">
                        Manage public menus, preview resolved trees, and configure startup/search behaviour.
                    </Text>
                </div>
                <Group>
                    {canUpdateNavigation ? (
                        <>
                            <Button onClick={() => { setAddParentItemId(null); setAddOpen(true); }}>Add existing page</Button>
                            <Button variant="light" onClick={() => openCreatePageHere()}>Create page here</Button>
                        </>
                    ) : (
                        <Text size="sm" c="dimmed">Read-only — you can preview menus but cannot edit them.</Text>
                    )}
                </Group>
            </Group>

            <Tabs value={activeMenu} onChange={(value) => setActiveMenu((value as TMenuKey) ?? 'web_header')}>
                <Tabs.List>
                    {MENU_TABS.map((tab) => (
                        <Tabs.Tab key={tab.key} value={tab.key}>{tab.label}</Tabs.Tab>
                    ))}
                    <Tabs.Tab value="settings">Settings</Tabs.Tab>
                </Tabs.List>

                {MENU_TABS.map((tab) => (
                    <Tabs.Panel key={tab.key} value={tab.key} pt="md">
                        <Group mb="sm" gap="xs">
                            <Text size="sm">{items.length} stored item{items.length === 1 ? '' : 's'}</Text>
                            {tab.key === 'web_header' ? (
                                <Select
                                    size="xs"
                                    w={220}
                                    label="Header preset"
                                    data={SHARED_PRESET_OPTIONS.map((opt) => ({
                                        value: opt.value,
                                        label: opt.label,
                                    }))}
                                    value={menu?.preset ?? 'dropdown'}
                                    disabled={!canUpdateNavigation}
                                    onChange={(value) => {
                                        if (value) presetMutation.mutate(value);
                                    }}
                                />
                            ) : tab.key === 'web_footer' ? (
                                <Select
                                    size="xs"
                                    w={220}
                                    label="Footer layout"
                                    data={[
                                        { value: 'columns', label: 'Columns (grouped)' },
                                        { value: 'inline', label: 'Inline links' },
                                    ]}
                                    value={
                                        (typeof menu?.config === 'object' && menu?.config !== null
                                            ? (menu.config as Record<string, unknown>).footer_layout
                                            : null) as string | undefined ?? 'columns'
                                    }
                                    disabled={!canUpdateNavigation}
                                    onChange={(value) => {
                                        if (value) {
                                            footerPresetMutation.mutate(value);
                                        }
                                    }}
                                />
                            ) : menu?.preset ? (
                                <Badge variant="light">preset: {menu.preset}</Badge>
                            ) : null}
                        </Group>

                        {tab.key === activeMenu && previewQuery.data?.warnings?.length ? (
                            <Alert color="yellow" title="Menu warnings" mb="sm">
                                <Stack gap="xs">
                                    {previewQuery.data.warnings.map((warning) => (
                                        <Group key={`${warning.code}-${warning.message}`} justify="space-between" wrap="nowrap">
                                            <Text size="sm">{warning.message}</Text>
                                            {warning.menu_item_id ? (
                                                <Button
                                                    size="xs"
                                                    variant="light"
                                                    component="a"
                                                    href={`/admin/navigation?menu=${encodeURIComponent(tab.key)}&item=${warning.menu_item_id}`}
                                                >
                                                    Open item
                                                </Button>
                                            ) : null}
                                        </Group>
                                    ))}
                                </Stack>
                            </Alert>
                        ) : null}

                        {tab.key === activeMenu && previewQuery.data?.suggestions?.length ? (
                            <Alert color="blue" title="Suggested menu items" mb="sm">
                                <Stack gap="xs">
                                    {previewQuery.data.suggestions.map((suggestion) => (
                                        <Group key={`${suggestion.code}-${suggestion.message}`} justify="space-between" wrap="nowrap">
                                            <Text size="sm">{suggestion.message}</Text>
                                            <Group gap="xs">
                                                {suggestion.page_id ? (
                                                    <Button
                                                        size="xs"
                                                        variant="subtle"
                                                        component="a"
                                                        href={`/admin/pages/${suggestion.keyword ?? suggestion.page_id}`}
                                                    >
                                                        Edit page
                                                    </Button>
                                                ) : null}
                                                {suggestion.menu_item_id && canUpdateNavigation ? (
                                                    <Button
                                                        size="xs"
                                                        variant="light"
                                                        onClick={() => {
                                                            setAddParentItemId(suggestion.menu_item_id ?? null);
                                                            setAddOpen(true);
                                                        }}
                                                    >
                                                        Add child item
                                                    </Button>
                                                ) : null}
                                            </Group>
                                        </Group>
                                    ))}
                                </Stack>
                            </Alert>
                        ) : null}

                        <Title order={5} mb="xs">Stored items</Title>
                        <Text size="sm" c="dimmed" mb="sm">
                            {canUpdateNavigation
                                ? 'Drag rows to reorder among siblings. Use Edit to change the parent item or child-source mode.'
                                : 'Read-only view of stored menu items.'}
                        </Text>
                        <Table striped highlightOnHover withTableBorder mb="lg">
                            <Table.Thead>
                                <Table.Tr>
                                    <Table.Th>ID</Table.Th>
                                    <Table.Th>Page / URL</Table.Th>
                                    <Table.Th>Type</Table.Th>
                                    <Table.Th>Child source</Table.Th>
                                    <Table.Th>Exclusions</Table.Th>
                                    <Table.Th>Position</Table.Th>
                                    <Table.Th>Actions</Table.Th>
                                </Table.Tr>
                            </Table.Thead>
                            <Table.Tbody>
                                {items.length === 0 ? (
                                    <Table.Tr>
                                        <Table.Td colSpan={7}>
                                            <Text size="sm" c="dimmed">No stored items in this menu.</Text>
                                        </Table.Td>
                                    </Table.Tr>
                                ) : (
                                    nestedStoredItems.map((item) => (
                                        <Table.Tr
                                            key={item.id}
                                            draggable={canUpdateNavigation}
                                            onDragStart={canUpdateNavigation ? () => setDraggedId(item.id) : undefined}
                                            onDragOver={canUpdateNavigation ? (event) => event.preventDefault() : undefined}
                                            onDrop={canUpdateNavigation ? () => handleDrop(item) : undefined}
                                            style={{
                                                cursor: canUpdateNavigation ? 'grab' : undefined,
                                                backgroundColor: highlightedItemId === item.id
                                                    ? 'var(--mantine-color-blue-light)'
                                                    : undefined,
                                            }}
                                        >
                                            <Table.Td>{item.id}</Table.Td>
                                            <Table.Td style={{ paddingLeft: 12 + item.depth * 20 }}>
                                                {item.page_id ?? item.external_url ?? '—'}
                                                {item.parent_item_id ? (
                                                    <Text span size="xs" c="dimmed"> (parent #{item.parent_item_id})</Text>
                                                ) : null}
                                            </Table.Td>
                                            <Table.Td>{item.item_type}</Table.Td>
                                            <Table.Td>{item.child_source ?? 'manual'}</Table.Td>
                                            <Table.Td>
                                                {item.child_source === 'page_children' && (item.excluded_page_ids?.length ?? 0) > 0 ? (
                                                    <Group gap={4}>
                                                        {item.excluded_page_ids.map((pageId) => (
                                                            <Badge
                                                                key={pageId}
                                                                variant="light"
                                                                color="gray"
                                                                rightSection={canUpdateNavigation ? (
                                                                    <Button
                                                                        size="compact-xs"
                                                                        variant="subtle"
                                                                        color="red"
                                                                        loading={removeExclusionMutation.isPending}
                                                                        onClick={() => removeExclusionMutation.mutate({ itemId: item.id, pageId })}
                                                                    >
                                                                        ×
                                                                    </Button>
                                                                ) : undefined}
                                                            >
                                                                page {pageId}
                                                            </Badge>
                                                        ))}
                                                    </Group>
                                                ) : (
                                                    <Text size="xs" c="dimmed">—</Text>
                                                )}
                                            </Table.Td>
                                            <Table.Td>{item.position}</Table.Td>
                                            <Table.Td>
                                                {canUpdateNavigation ? (
                                                <Group gap="xs">
                                                    <Button size="xs" variant="light" onClick={() => setEditItem(item)}>Edit</Button>
                                                    <Button size="xs" variant="subtle" onClick={() => openCreatePageHere(item)}>Create child page</Button>
                                                    {item.child_source === 'page_children' ? (
                                                        <Button size="xs" variant="light" loading={convertMutation.isPending} onClick={() => convertMutation.mutate(item.id)}>
                                                            Convert children
                                                        </Button>
                                                    ) : null}
                                                    <Button size="xs" color="red" variant="subtle" loading={deleteMutation.isPending} onClick={() => deleteMutation.mutate(item.id)}>
                                                        Delete
                                                    </Button>
                                                </Group>
                                                ) : (
                                                    <Text size="xs" c="dimmed">—</Text>
                                                )}
                                            </Table.Td>
                                        </Table.Tr>
                                    ))
                                )}
                            </Table.Tbody>
                        </Table>

                        <Title order={5}>Resolved preview</Title>
                        <Table striped withTableBorder>
                            <Table.Thead>
                                <Table.Tr>
                                    <Table.Th>Label</Table.Th>
                                    <Table.Th>Keyword</Table.Th>
                                    <Table.Th>Depth</Table.Th>
                                    <Table.Th>Actions</Table.Th>
                                </Table.Tr>
                            </Table.Thead>
                            <Table.Tbody>
                                {previewItems.length === 0 ? (
                                    <Table.Tr>
                                        <Table.Td colSpan={4}><Text size="sm" c="dimmed">No public items resolve for this menu.</Text></Table.Td>
                                    </Table.Tr>
                                ) : (
                                    previewItems.map((row, index) => {
                                        const virtual = parseVirtualPreviewItemId(row.id);
                                        const pageId = row.page && typeof row.page === 'object'
                                            ? Number((row.page as { id?: number }).id ?? 0)
                                            : 0;

                                        return (
                                        <Table.Tr key={`${String(row.id ?? index)}-${index}`}>
                                            <Table.Td style={{ paddingLeft: 12 + Number(row.depth ?? 0) * 16 }}>
                                                {String(row.label ?? (row.page && typeof row.page === 'object' ? (row.page as { title?: string }).title : '—'))}
                                            </Table.Td>
                                            <Table.Td>
                                                {String(row.page && typeof row.page === 'object' ? (row.page as { keyword?: string }).keyword : '—')}
                                            </Table.Td>
                                            <Table.Td>{String(row.depth ?? 0)}</Table.Td>
                                            <Table.Td>
                                                {virtual && canUpdateNavigation ? (
                                                    <Button
                                                        size="xs"
                                                        variant="light"
                                                        color="orange"
                                                        loading={addExclusionMutation.isPending}
                                                        onClick={() => addExclusionMutation.mutate({
                                                            itemId: virtual.menuItemId,
                                                            pageId: virtual.pageId,
                                                        })}
                                                    >
                                                        Exclude from branch
                                                    </Button>
                                                ) : pageId > 0 && virtual === null && typeof row.id === 'number' ? (
                                                    <Text size="xs" c="dimmed">Explicit</Text>
                                                ) : null}
                                            </Table.Td>
                                        </Table.Tr>
                                        );
                                    })
                                )}
                            </Table.Tbody>
                        </Table>
                    </Tabs.Panel>
                ))}

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
                opened={addOpen}
                onClose={() => setAddOpen(false)}
                onCreated={invalidate}
            />

            <EditMenuItemModal
                item={editItem}
                menuKey={activeMenu}
                menuItems={items}
                opened={editItem !== null}
                onClose={() => setEditItem(null)}
                onSaved={invalidate}
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
