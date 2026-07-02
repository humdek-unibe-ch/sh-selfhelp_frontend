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
import {
    buildPageLookup,
    buildResolvedLabelByItemId,
    getDirectCmsChildPages,
    parentItemOptions,
} from './navigation-builder.utils';
import {
    MenuItemLabelTranslationsField,
    buildMenuItemTranslationsPayload,
    translationsRecordFromItem,
    type TMenuItemLabelTranslations,
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
    const [labelTranslations, setLabelTranslations] = useState<TMenuItemLabelTranslations>(
        () => translationsRecordFromItem(item.translations, item.label, currentLanguageId),
    );

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
    opened: boolean;
    onClose: () => void;
    onCreated: () => void;
}

interface IAddMenuItemModalContentProps extends IAddItemModalProps {}

function AddMenuItemModalContent({
    menuKey,
    parentItemId,
    parentItemLabel,
    onClose,
    onCreated,
}: IAddMenuItemModalContentProps): React.ReactElement {
    const { pages } = useAdminPages();
    const [pageId, setPageId] = useState<string | null>(null);
    const [externalUrl, setExternalUrl] = useState('');
    const [labelTranslations, setLabelTranslations] = useState<TMenuItemLabelTranslations>({});
    const [itemType, setItemType] = useState<'page' | 'external_url' | 'group'>(
        () => (parentItemId ? 'page' : 'page'),
    );
    const [selectedChildPageIds, setSelectedChildPageIds] = useState<number[]>([]);
    const [includeDescendants, setIncludeDescendants] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);

    const pageOptions = useMemo(
        () => (pages ?? []).map((page) => ({
            value: String(page.id_pages),
            label: page.keyword,
        })),
        [pages],
    );

    const selectedPageId = pageId ? Number(pageId) : null;
    const directChildPages = useMemo(
        () => (selectedPageId ? getDirectCmsChildPages(pages ?? [], selectedPageId) : []),
        [pages, selectedPageId],
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
        const childPages = getDirectCmsChildPages(pages ?? [], Number(value));
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
        if (itemType === 'page' && pageId) {
            payload.page_id = Number(pageId);
            if (selectedChildPageIds.length > 0) {
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

                {itemType === 'page' ? (
                    <Select
                        label="Page"
                        searchable
                        data={pageOptions}
                        value={pageId}
                        onChange={handlePageChange}
                    />
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

                {itemType === 'page' && directChildPages.length > 0 ? (
                    <Stack gap="xs">
                        <Text size="sm" fw={500}>CMS child pages</Text>
                        <Text size="sm" c="dimmed">
                            Selected children will be created as real menu items under this parent menu item.
                            Menus do not auto-update from the page tree later.
                        </Text>
                        {directChildPages.map((child) => (
                            <Checkbox
                                key={child.id_pages}
                                label={child.keyword}
                                checked={selectedChildPageIds.includes(child.id_pages)}
                                onChange={(event) => toggleChild(child.id_pages, event.currentTarget.checked)}
                            />
                        ))}
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
            opened={opened}
            onClose={onClose}
            onCreated={onCreated}
        />
    );
}
