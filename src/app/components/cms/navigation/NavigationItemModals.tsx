/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
'use client';

import { useMemo, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import {
    Alert,
    Checkbox,
    Select,
    Stack,
    Switch,
    Text,
    TextInput,
} from '@mantine/core';
import {
    AdminNavigationApi,
    type IAdminNavigationMenuItem,
    type ICreateNavigationMenuItemRequest,
    type IUpdateNavigationMenuItemRequest,
} from '../../../../api/admin/navigation.api';
import { ModalWrapper } from '../../shared/common/CustomModal/CustomModal';
import { SelectIconMobileField } from '../shared/field-components/SelectIconMobileField';
import { SelectIconField } from '../../shared/common/SelectIconField';
import { useAdminPages } from '../../../../hooks/useAdminPages';
import { useLanguageContext } from '../../contexts/LanguageContext';
import { isMobileMenuKey, menuPlatformForKey, type TMenuKey } from './navigation-builder.constants';
import type { TNavigationChildrenNavMode } from '@selfhelp/shared';
import {
    buildPageLookup,
    buildResolvedLabelByItemId,
    formatPageRoutePath,
    getDirectCmsChildPages,
    pageDisplayTitle,
    parentItemOptions,
} from './navigation-builder.utils';
import {
    MenuItemLabelTranslationsField,
    buildMenuItemTranslationsPayload,
    translationsRecordFromItem,
    type TMenuItemTranslations,
} from './MenuItemLabelTranslationsField';

interface IEditMenuItemModalProps {
    menuKey: TMenuKey;
    item: IAdminNavigationMenuItem | null;
    menuItems: IAdminNavigationMenuItem[];
    previewItems: Array<Record<string, unknown> & { depth: number }>;
    opened: boolean;
    onClose: () => void;
    onSaved: () => void;
}

interface IEditMenuItemModalContentProps extends Omit<IEditMenuItemModalProps, 'opened'> {
    item: IAdminNavigationMenuItem;
}

function EditMenuItemModalContent({
    menuKey,
    item,
    menuItems,
    previewItems,
    onClose,
    onSaved,
}: IEditMenuItemModalContentProps): React.ReactElement {
    const { currentLanguageId } = useLanguageContext();
    const { pages } = useAdminPages();
    const pageById = useMemo(() => buildPageLookup(pages), [pages]);
    const resolvedLabelByItemId = useMemo(
        () => buildResolvedLabelByItemId(previewItems),
        [previewItems],
    );

    const [icon, setIcon] = useState(() => item.icon ?? '');
    const [mobileIcon, setMobileIcon] = useState(() => item.mobile_icon ?? '');
    const [parentItemId, setParentItemId] = useState<string | null>(
        () => (item.parent_item_id ? String(item.parent_item_id) : null),
    );
    const [layer, setLayer] = useState<'top' | null>(() => item.layer ?? null);
    const [childrenNav, setChildrenNav] = useState<string>(() => item.children_nav ?? 'inherit');
    const [labelTranslations, setLabelTranslations] = useState<TMenuItemTranslations>(
        () => translationsRecordFromItem(item.translations, item.label, currentLanguageId),
    );
    const hasChildren = menuItems.some((row) => row.parent_item_id === item.id);
    const isHeaderRootItem = menuKey === 'web_header' && parentItemId === null;

    const updateMutation = useMutation({
        mutationFn: (payload: Partial<IUpdateNavigationMenuItemRequest>) =>
            AdminNavigationApi.updateMenuItem(item.id, payload),
        onSuccess: () => {
            onSaved();
            onClose();
        },
    });

    const menuPlatform = menuPlatformForKey(menuKey);
    const menuLabel = menuKey.replaceAll('_', ' ');

    const handleSave = () => {
        const payload: Partial<IUpdateNavigationMenuItemRequest> = {
            icon: icon || null,
            mobile_icon: mobileIcon || null,
            parent_item_id: parentItemId ? Number(parentItemId) : null,
        };
        if (menuKey === 'web_header') {
            // Nested items always live in the main tree.
            payload.layer = parentItemId === null ? layer : null;
        }
        if (menuPlatform === 'web') {
            payload.children_nav = childrenNav === 'inherit' ? null : (childrenNav as TNavigationChildrenNavMode);
        }
        if (item.item_type === 'group' || item.item_type === 'external_url') {
            payload.translations = buildMenuItemTranslationsPayload(labelTranslations);
        }
        updateMutation.mutate(payload);
    };

    return (
        <ModalWrapper
            opened
            onClose={onClose}
            title="Menu placement & icon"
            size="md"
            onSave={handleSave}
            onCancel={onClose}
            isLoading={updateMutation.isPending}
            saveLabel="Save"
        >
            <Stack gap="sm">
                <Text size="sm" c="dimmed">
                    Adjust where this entry appears in the {menuLabel} menu. Icons are stored per menu — the same page can use different icons in header, footer, and mobile menus.
                </Text>
                <Select
                    label="Parent item"
                    clearable
                    data={parentItemOptions(menuItems, pageById, resolvedLabelByItemId, item.id)}
                    value={parentItemId}
                    onChange={setParentItemId}
                />
                {isHeaderRootItem ? (
                    <Select
                        label="Header row"
                        description={hasChildren
                            ? 'Items with children stay in the main row — top-row links are flat.'
                            : 'The top row is only shown by double header presets; the assignment is kept when switching presets.'}
                        data={[
                            { value: 'main', label: 'Main row' },
                            { value: 'top', label: 'Top row (utility links)' },
                        ]}
                        value={layer === 'top' ? 'top' : 'main'}
                        disabled={hasChildren}
                        onChange={(value) => setLayer(value === 'top' ? 'top' : null)}
                    />
                ) : null}
                {menuPlatform === 'web' ? (
                    <Select
                        label="Child pages navigation"
                        description={hasChildren
                            ? 'How this item\u2019s child pages are presented on the website.'
                            : 'Takes effect when this item has child pages.'}
                        data={[
                            { value: 'inherit', label: 'Menu default' },
                            { value: 'sidebar', label: 'Left sidebar' },
                            { value: 'pills', label: 'Pill strip' },
                            { value: 'none', label: 'Hidden' },
                        ]}
                        value={childrenNav}
                        onChange={(value) => setChildrenNav(value ?? 'inherit')}
                    />
                ) : null}
                {!isMobileMenuKey(menuKey) ? (
                    <SelectIconField
                        fieldId={item.id}
                        config={{}}
                        value={icon}
                        onChange={setIcon}
                        placeholder="Search and select web icon..."
                    />
                ) : (
                    <SelectIconMobileField
                        fieldId={item.id}
                        config={{}}
                        value={mobileIcon}
                        onChange={setMobileIcon}
                        placeholder="Search and select mobile icon..."
                    />
                )}
                {menuPlatform === 'web' && item.mobile_icon ? (
                    <Text size="xs" c="dimmed">
                        Mobile icon for this page is configured separately in the mobile drawer or tabs menu.
                    </Text>
                ) : null}
                {menuPlatform === 'mobile' && item.icon ? (
                    <Text size="xs" c="dimmed">
                        Web icon for this page is configured separately in the web header or footer menu.
                    </Text>
                ) : null}
                {(item.item_type === 'group' || item.item_type === 'external_url') ? (
                    <MenuItemLabelTranslationsField
                        value={labelTranslations}
                        onChange={setLabelTranslations}
                        required
                        description="Shown in the public menu for this language. Falls back to the default CMS language when a translation is missing."
                    />
                ) : null}
            </Stack>
        </ModalWrapper>
    );
}

export function EditMenuItemModal({
    menuKey,
    item,
    menuItems,
    previewItems,
    opened,
    onClose,
    onSaved,
}: IEditMenuItemModalProps): React.ReactElement | null {
    const { currentLanguageId } = useLanguageContext();

    if (!item || !opened) {
        return null;
    }

    return (
        <EditMenuItemModalContent
            key={`${item.id}-${currentLanguageId}`}
            menuKey={menuKey}
            item={item}
            menuItems={menuItems}
            previewItems={previewItems}
            onClose={onClose}
            onSaved={onSaved}
        />
    );
}

interface IAddItemModalProps {
    menuKey: TMenuKey;
    parentItemId?: number | null;
    parentItemLabel?: string | null;
    /** Current items of the target menu — pages already used are hidden from the picker. */
    menuItems: IAdminNavigationMenuItem[];
    opened: boolean;
    onClose: () => void;
    onCreated: () => void;
}

interface IAddMenuItemModalContentProps extends IAddItemModalProps {}

function AddMenuItemModalContent({
    menuKey,
    parentItemId,
    parentItemLabel,
    menuItems,
    onClose,
    onCreated,
}: IAddMenuItemModalContentProps): React.ReactElement {
    const { pages } = useAdminPages();
    const { currentLanguageId } = useLanguageContext();
    const [pageId, setPageId] = useState<string | null>(null);
    const [externalUrl, setExternalUrl] = useState('');
    const [labelTranslations, setLabelTranslations] = useState<TMenuItemTranslations>({});
    const [itemType, setItemType] = useState<'page' | 'external_url' | 'group'>(
        () => (parentItemId ? 'page' : 'page'),
    );
    const [layer, setLayer] = useState<'top' | null>(null);
    const [selectedChildPageIds, setSelectedChildPageIds] = useState<number[]>([]);
    const [includeDescendants, setIncludeDescendants] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const isHeaderRootTarget = menuKey === 'web_header' && !parentItemId;

    // Pages already linked anywhere in THIS menu are excluded from the picker —
    // adding the same page twice to one menu only creates a duplicate entry.
    const usedPageIds = useMemo(() => {
        const ids = new Set<number>();
        for (const row of menuItems) {
            if (row.page_id != null) {
                ids.add(row.page_id);
            }
        }
        return ids;
    }, [menuItems]);

    const availablePages = useMemo(
        () => (pages ?? []).filter((page) => !usedPageIds.has(page.id_pages)),
        [pages, usedPageIds],
    );
    const hiddenPageCount = (pages?.length ?? 0) - availablePages.length;

    // Options carry the localized title so authors can pick by what users see;
    // the label keeps the keyword so search matches both title and keyword.
    const pageOptions = useMemo(
        () => availablePages.map((page) => {
            const title = pageDisplayTitle(page, currentLanguageId);
            return {
                value: String(page.id_pages),
                label: title ? `${title} \u00b7 ${page.keyword}` : page.keyword,
            };
        }),
        [availablePages, currentLanguageId],
    );

    const pageByIdForOptions = useMemo(() => buildPageLookup(availablePages), [availablePages]);

    const renderPageOption = ({ option }: { option: { value: string; label: string } }) => {
        const page = pageByIdForOptions.get(Number(option.value));
        if (!page) {
            return <Text size="sm">{option.label}</Text>;
        }
        const title = pageDisplayTitle(page, currentLanguageId);
        return (
            <Stack gap={2}>
                <Text size="sm">{title ?? page.keyword}</Text>
                <Text size="xs" c="dimmed">
                    {formatPageRoutePath(page.url, page.keyword) ?? page.keyword}
                </Text>
            </Stack>
        );
    };

    const selectedPageId = pageId ? Number(pageId) : null;
    // Child suggestions also skip pages that already sit in this menu.
    const directChildPages = useMemo(
        () => (selectedPageId
            ? getDirectCmsChildPages(pages ?? [], selectedPageId).filter(
                (child) => !usedPageIds.has(child.id_pages),
            )
            : []),
        [pages, selectedPageId, usedPageIds],
    );

    const createMutation = useMutation({
        mutationFn: (payload: ICreateNavigationMenuItemRequest) =>
            AdminNavigationApi.createMenuItem(menuKey, payload),
        onSuccess: () => {
            setSubmitError(null);
            onCreated();
            onClose();
        },
        onError: (error: Error) => {
            setSubmitError(error.message || 'Failed to add menu item.');
        },
    });

    const toggleChild = (childPageId: number, checked: boolean) => {
        setSelectedChildPageIds((current) => {
            if (checked) {
                return current.includes(childPageId) ? current : [...current, childPageId];
            }
            return current.filter((id) => id !== childPageId);
        });
    };

    const handlePageChange = (value: string | null) => {
        setPageId(value);
        if (!value) {
            setSelectedChildPageIds([]);
            return;
        }
        const childPages = getDirectCmsChildPages(pages ?? [], Number(value)).filter(
            (child) => !usedPageIds.has(child.id_pages),
        );
        setSelectedChildPageIds(childPages.map((page) => page.id_pages));
    };

    const modalTitle = parentItemId
        ? `Add existing child page — ${menuKey.replaceAll('_', ' ')}`
        : `Add existing page — ${menuKey.replaceAll('_', ' ')}`;

    const handleAdd = () => {
        setSubmitError(null);
        const payload: ICreateNavigationMenuItemRequest = {
            item_type: itemType,
            parent_item_id: parentItemId ?? null,
        };
        if (isHeaderRootTarget && layer === 'top') {
            payload.layer = 'top';
        }
        if (itemType === 'page' && pageId) {
            payload.page_id = Number(pageId);
            // Top-row links are flat; children only apply to main-row items.
            if (selectedChildPageIds.length > 0 && layer !== 'top') {
                payload.child_page_ids = selectedChildPageIds;
                payload.include_descendants = includeDescendants;
            }
        }
        if (itemType === 'external_url') {
            payload.external_url = externalUrl;
            payload.translations = buildMenuItemTranslationsPayload(labelTranslations);
        }
        if (itemType === 'group') {
            payload.translations = buildMenuItemTranslationsPayload(labelTranslations);
        }
        createMutation.mutate(payload);
    };

    return (
        <ModalWrapper
            opened
            onClose={onClose}
            title={modalTitle}
            size="md"
            onSave={handleAdd}
            onCancel={onClose}
            isLoading={createMutation.isPending}
            saveLabel="Add"
        >
            <Stack gap="sm">
                {parentItemId ? (
                    <Text size="sm" c="dimmed">
                        New item will be nested under
                        {' '}
                        <Text span fw={600}>{parentItemLabel ?? `item #${parentItemId}`}</Text>
                        .
                    </Text>
                ) : null}

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

                {isHeaderRootTarget && itemType !== 'group' ? (
                    <Select
                        label="Header row"
                        description="The top row is only shown by double header presets; the assignment is kept when switching presets."
                        data={[
                            { value: 'main', label: 'Main row' },
                            { value: 'top', label: 'Top row (utility links)' },
                        ]}
                        value={layer === 'top' ? 'top' : 'main'}
                        onChange={(value) => setLayer(value === 'top' ? 'top' : null)}
                    />
                ) : null}

                {itemType === 'page' ? (
                    <Stack gap={4}>
                        <Select
                            label="Page"
                            searchable
                            data={pageOptions}
                            renderOption={renderPageOption}
                            value={pageId}
                            onChange={handlePageChange}
                            nothingFoundMessage={
                                hiddenPageCount > 0 && pageOptions.length === 0
                                    ? 'All pages are already in this menu'
                                    : 'No matching page'
                            }
                        />
                        {hiddenPageCount > 0 ? (
                            <Text size="xs" c="dimmed">
                                {hiddenPageCount} page(s) already in this menu are not listed.
                            </Text>
                        ) : null}
                    </Stack>
                ) : null}

                {itemType === 'external_url' ? (
                    <>
                        <TextInput label="URL" value={externalUrl} onChange={(e) => setExternalUrl(e.currentTarget.value)} />
                        <MenuItemLabelTranslationsField
                            value={labelTranslations}
                            onChange={setLabelTranslations}
                            required
                            description="Link text shown in the menu for each language."
                        />
                    </>
                ) : null}

                {itemType === 'group' ? (
                    <MenuItemLabelTranslationsField
                        value={labelTranslations}
                        onChange={setLabelTranslations}
                        required
                        label="Group heading translations"
                        description="Non-clickable section title (for example a footer column heading)."
                    />
                ) : null}

                {itemType === 'page' && layer !== 'top' && directChildPages.length > 0 ? (
                    <Stack gap="xs">
                        <Text size="sm" fw={500}>CMS child pages</Text>
                        <Text size="sm" c="dimmed">
                            Selected children will be created as real menu items under this parent menu item.
                            Menus do not auto-update from the page tree later.
                        </Text>
                        {directChildPages.map((child) => {
                            const childTitle = pageDisplayTitle(child, currentLanguageId);
                            return (
                                <Checkbox
                                    key={child.id_pages}
                                    label={childTitle ? `${childTitle} \u00b7 ${child.keyword}` : child.keyword}
                                    checked={selectedChildPageIds.includes(child.id_pages)}
                                    onChange={(event) => toggleChild(child.id_pages, event.currentTarget.checked)}
                                />
                            );
                        })}
                        <Switch
                            label="Include grandchildren"
                            checked={includeDescendants}
                            onChange={(event) => setIncludeDescendants(event.currentTarget.checked)}
                        />
                    </Stack>
                ) : null}

                {submitError ? (
                    <Alert color="red" title="Could not add menu item">
                        {submitError}
                    </Alert>
                ) : null}
            </Stack>
        </ModalWrapper>
    );
}

export function AddMenuItemModal({
    menuKey,
    parentItemId,
    parentItemLabel,
    menuItems,
    opened,
    onClose,
    onCreated,
}: IAddItemModalProps): React.ReactElement | null {
    if (!opened) {
        return null;
    }

    return (
        <AddMenuItemModalContent
            key={`${menuKey}-${parentItemId ?? 'root'}`}
            menuKey={menuKey}
            parentItemId={parentItemId}
            parentItemLabel={parentItemLabel}
            menuItems={menuItems}
            opened={opened}
            onClose={onClose}
            onCreated={onCreated}
        />
    );
}
