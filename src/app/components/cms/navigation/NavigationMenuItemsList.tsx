/*

SPDX-FileCopyrightText: 2026 Humdek, University of Bern

SPDX-License-Identifier: MPL-2.0

*/

'use client';



import { useEffect, useMemo, useRef, useState } from 'react';

import {

    ActionIcon,

    Badge,

    Box,

    Group,

    Menu,

    Paper,

    Stack,

    Text,

    Tooltip,

} from '@mantine/core';

import Link from 'next/link';
import {
    IconArrowDown,
    IconArrowUp,
    IconDotsVertical,
    IconExternalLink,
    IconFolder,
    IconGripVertical,
    IconLink,
    IconPencil,
    IconPlus,
} from '@tabler/icons-react';

import {

    draggable,

    dropTargetForElements,

    monitorForElements,

} from '@atlaskit/pragmatic-drag-and-drop/element/adapter';

import {

    attachClosestEdge,

    extractClosestEdge,

    type Edge,

} from '@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge';

import { DropIndicator } from '@atlaskit/pragmatic-drag-and-drop-react-drop-indicator/box';

import type { IAdminNavigationMenuItem } from '../../../../api/admin/navigation.api';
import type { IAdminPage } from '../../../../types/responses/admin/admin.types';
import { menuPlatformForKey, type TMenuKey } from './navigation-builder.constants';
import {
    buildChildDropPayload,
    buildSiblingReorderPayload,
    buildSiblingStepPayload,
    getMenuItemDisplay,
    getPageEditorPath,
    isMenuItemDescendant,
    menuIconForItem,
} from './navigation-builder.utils';
import { MenuItemIcon } from './MenuItemIcon';
import styles from './NavigationMenuItemsList.module.css';



interface INavigationMenuItemsListProps {
    menuKey: TMenuKey;
    items: IAdminNavigationMenuItem[];

    nestedItems: Array<IAdminNavigationMenuItem & { depth: number; orphaned?: boolean }>;

    pageById: Map<number, IAdminPage>;

    resolvedLabelByItemId: Map<number, string>;

    highlightedItemId: number | null;

    canUpdate: boolean;

    onReorder: (order: Array<{ item_id: number; position: number; parent_item_id?: number | null }>) => void;

    onEdit: (item: IAdminNavigationMenuItem) => void;

    onAddExistingChildPage: (item: IAdminNavigationMenuItem) => void;

    onCreateChildPage: (item: IAdminNavigationMenuItem) => void;

    onRemove: (itemId: number) => void;

    isRemovePending: boolean;

}



const ITEM_TYPE_LABELS: Record<string, string> = {
    external_url: 'External link',
    group: 'Group',
};

interface IMenuItemRowProps {
    menuKey: TMenuKey;
    item: IAdminNavigationMenuItem & { depth: number; orphaned?: boolean };
    pageById: Map<number, IAdminPage>;

    allItems: IAdminNavigationMenuItem[];

    childCount: number;

    display: { primary: string; secondary?: string };

    canMoveUp: boolean;

    canMoveDown: boolean;

    highlighted: boolean;

    canUpdate: boolean;

    isDragging: boolean;

    isDragActive: boolean;

    draggedId: number | null;

    closestEdge: Edge | null;

    isContainerTarget: boolean;

    isDropZoneHover: boolean;

    isInvalidDropTarget: boolean;

    onEdit: (item: IAdminNavigationMenuItem) => void;

    onAddExistingChildPage: (item: IAdminNavigationMenuItem) => void;

    onCreateChildPage: (item: IAdminNavigationMenuItem) => void;

    onMove: (itemId: number, direction: 'up' | 'down') => void;

    onRemove: (itemId: number) => void;

    isRemovePending: boolean;

}



function MenuItemRow({
    menuKey,
    item,
    pageById,
    allItems,

    childCount,

    display,

    canMoveUp,

    canMoveDown,

    highlighted,

    canUpdate,

    isDragging,

    isDragActive,

    draggedId,

    closestEdge,

    isContainerTarget,

    isDropZoneHover,

    isInvalidDropTarget,

    onEdit,

    onAddExistingChildPage,

    onCreateChildPage,

    onMove,

    onRemove,

    isRemovePending,

}: IMenuItemRowProps): React.ReactElement {

    const rowRef = useRef<HTMLDivElement | null>(null);

    const handleRef = useRef<HTMLButtonElement | null>(null);

    const dropZoneRef = useRef<HTMLDivElement | null>(null);

    const canAcceptChildren = item.item_type === 'page' || item.item_type === 'group';
    const hasChildren = childCount > 0;
    const menuPlatform = menuPlatformForKey(menuKey);
    const menuIcon = menuIconForItem(item, menuKey);
    const pageEditorPath = item.item_type === 'page' && item.page_id !== null
        ? getPageEditorPath(pageById, item.page_id)
        : null;
    const isInvalidChildTarget = draggedId !== null
        && (draggedId === item.id || isMenuItemDescendant(allItems, draggedId, item.id));



    useEffect(() => {

        const row = rowRef.current;

        const handle = handleRef.current;

        if (!row || !canUpdate) {

            return () => {};

        }



        const cleanups: Array<() => void> = [];



        if (handle) {

            cleanups.push(draggable({

                element: handle,

                getInitialData: () => ({ type: 'navigation-item', itemId: item.id }),

            }));

        }



        cleanups.push(dropTargetForElements({

            element: row,

            canDrop: ({ source }) => {

                const sourceId = source.data.itemId;

                if (typeof sourceId !== 'number' || sourceId === item.id) {

                    return false;

                }

                if (isMenuItemDescendant(allItems, sourceId, item.id)) {

                    return false;

                }

                return source.data.type === 'navigation-item';

            },

            getData: ({ input, element }) => {

                const rect = element.getBoundingClientRect();

                const relativeY = (input.clientY - rect.top) / rect.height;

                const edgeThreshold = 0.35;

                const isNearTopEdge = relativeY <= edgeThreshold;

                const isNearBottomEdge = relativeY >= (1 - edgeThreshold);



                if (isNearTopEdge || isNearBottomEdge) {
                    return attachClosestEdge(
                        { type: 'navigation-item-target', itemId: item.id, dropMode: 'sibling' },
                        { input, element, allowedEdges: ['top', 'bottom'] },
                    );
                }

                if (canAcceptChildren) {
                    return {
                        type: 'navigation-container-target',
                        itemId: item.id,
                        dropMode: 'child',
                    };
                }

                return attachClosestEdge(

                    { type: 'navigation-item-target', itemId: item.id, dropMode: 'sibling' },

                    { input, element, allowedEdges: ['bottom'] },

                );

            },

        }));



        return () => {

            cleanups.forEach((cleanup) => cleanup());

        };

    }, [allItems, canAcceptChildren, canUpdate, hasChildren, item.id]);



    useEffect(() => {

        const dropZoneElement = dropZoneRef.current;

        if (!dropZoneElement || !canUpdate || !canAcceptChildren || hasChildren) {

            return undefined;

        }



        return dropTargetForElements({

            element: dropZoneElement,

            canDrop: ({ source }) => {

                const sourceId = source.data.itemId;

                if (typeof sourceId !== 'number' || sourceId === item.id) {

                    return false;

                }

                if (isMenuItemDescendant(allItems, sourceId, item.id)) {

                    return false;

                }

                return source.data.type === 'navigation-item';

            },

            getData: () => ({

                type: 'navigation-drop-zone-target',

                itemId: item.id,

                dropMode: 'child',

            }),

        });

    }, [allItems, canAcceptChildren, canUpdate, hasChildren, item.id]);



    const TypeIcon = item.item_type === 'page'
        ? IconLink
        : item.item_type === 'external_url'
            ? IconExternalLink
            : IconFolder;
    const RowIcon = menuIcon
        ? <MenuItemIcon iconName={menuIcon} platform={menuPlatform} size={18} />
        : <TypeIcon size={18} style={{ flexShrink: 0, opacity: 0.7 }} />;



    const wrapperClass = [

        styles.rowWrapper,

        isContainerTarget ? styles.isContainerTarget : '',

        closestEdge && !isDropZoneHover ? styles.isDropTarget : '',

        isInvalidDropTarget ? styles.isInvalidDropTarget : '',

    ].filter(Boolean).join(' ');



    return (

        <Box

            pos="relative"

            pl={item.depth * 24}

            style={{ borderLeft: item.depth > 0 ? '2px solid var(--mantine-color-blue-8)' : undefined }}

        >

            <Box className={wrapperClass}>

                {closestEdge && !isDropZoneHover ? <DropIndicator edge={closestEdge} gap="6px" /> : null}

                <Paper

                    ref={rowRef}

                    withBorder

                    radius="md"

                    p="sm"

                    mb="xs"

                    style={{

                        opacity: isDragging ? 0.45 : 1,

                        borderColor: highlighted ? 'var(--mantine-color-blue-5)' : undefined,

                        background: highlighted ? 'var(--mantine-color-blue-light)' : undefined,

                    }}

                >

                <Group justify="space-between" align="center" wrap="nowrap" gap="sm">

                    <Group gap="sm" wrap="nowrap" style={{ flex: 1, minWidth: 0 }}>

                        {canUpdate ? (

                            <Tooltip label="Drag to reorder among siblings at the same level">

                                <ActionIcon

                                    ref={handleRef}

                                    variant="subtle"

                                    color="gray"

                                    size="sm"

                                    aria-label={`Reorder ${display.primary}`}

                                    style={{ cursor: isDragging ? 'grabbing' : 'grab' }}

                                >

                                    <IconGripVertical size={16} />

                                </ActionIcon>

                            </Tooltip>

                        ) : (

                            <Box w={28} />

                        )}

                        <Box style={{ flexShrink: 0, display: 'flex', alignItems: 'center', opacity: menuIcon ? 1 : 0.7 }}>
                            {RowIcon}
                        </Box>

                        <Box style={{ minWidth: 0 }}>

                            <Text fw={600} size="sm" truncate>

                                {display.primary}

                            </Text>

                            {display.secondary ? (

                                <Text size="xs" c="dimmed" truncate>

                                    {display.secondary}

                                </Text>

                            ) : null}

                        </Box>

                    </Group>



                    <Group gap={6} wrap="nowrap" style={{ flexShrink: 0 }}>

                        {canUpdate ? (

                            <>

                                <Tooltip label="Move up">

                                    <ActionIcon

                                        variant="subtle"

                                        color="gray"

                                        size="sm"

                                        disabled={!canMoveUp}

                                        aria-label={`Move ${display.primary} up`}

                                        onClick={() => onMove(item.id, 'up')}

                                    >

                                        <IconArrowUp size={16} />

                                    </ActionIcon>

                                </Tooltip>

                                <Tooltip label="Move down">

                                    <ActionIcon

                                        variant="subtle"

                                        color="gray"

                                        size="sm"

                                        disabled={!canMoveDown}

                                        aria-label={`Move ${display.primary} down`}

                                        onClick={() => onMove(item.id, 'down')}

                                    >

                                        <IconArrowDown size={16} />

                                    </ActionIcon>

                                </Tooltip>

                            </>

                        ) : null}

                        {pageEditorPath ? (
                            <Tooltip label="Open page editor">
                                <ActionIcon
                                    component={Link}
                                    href={pageEditorPath}
                                    variant="subtle"
                                    color="blue"
                                    size="sm"
                                    aria-label={`Open page editor for ${display.primary}`}
                                >
                                    <IconPencil size={16} />
                                </ActionIcon>
                            </Tooltip>
                        ) : null}

                        {item.item_type !== 'page' ? (
                            <Badge variant="light" size="sm">
                                {ITEM_TYPE_LABELS[item.item_type] ?? item.item_type}
                            </Badge>
                        ) : null}

                        {item.orphaned ? (

                            <Badge variant="outline" color="orange" size="sm">

                                Orphaned

                            </Badge>

                        ) : null}

                        {canUpdate ? (

                            <Menu withinPortal position="bottom-end">

                                <Menu.Target>

                                    <ActionIcon variant="subtle" color="gray" aria-label={`Actions for ${display.primary}`}>

                                        <IconDotsVertical size={16} />

                                    </ActionIcon>

                                </Menu.Target>

                                <Menu.Dropdown>

                                    <Menu.Item onClick={() => onEdit(item)}>Menu placement &amp; icon</Menu.Item>

                                    {(item.item_type === 'page' || item.item_type === 'group') ? (
                                        <>
                                            <Menu.Item onClick={() => onAddExistingChildPage(item)}>
                                                Add existing child page
                                            </Menu.Item>
                                            <Menu.Item onClick={() => onCreateChildPage(item)}>Create child page</Menu.Item>
                                        </>
                                    ) : null}

                                    <Menu.Divider />

                                    <Menu.Item

                                        color="red"

                                        disabled={isRemovePending}

                                        onClick={() => onRemove(item.id)}

                                    >

                                        Remove

                                    </Menu.Item>

                                </Menu.Dropdown>

                            </Menu>

                        ) : null}

                    </Group>

                </Group>

            </Paper>

            </Box>



            {isDragActive && canAcceptChildren && !hasChildren && draggedId !== item.id ? (
                <Box
                    ref={dropZoneRef}
                    className={[
                        styles.dropZoneArea,
                        styles.ready,
                        isDropZoneHover ? (isInvalidChildTarget ? styles.invalid : styles.active) : '',
                    ].filter(Boolean).join(' ')}
                    ml={item.depth * 24}
                >
                    <IconPlus size={14} />
                    <Text className={styles.dropZoneText}>Nest as first child</Text>
                </Box>
            ) : null}

        </Box>

    );

}



export function NavigationMenuItemsList({
    menuKey,
    items,

    nestedItems,

    pageById,

    resolvedLabelByItemId,

    highlightedItemId,

    canUpdate,

    onReorder,

    onEdit,

    onAddExistingChildPage,

    onCreateChildPage,

    onRemove,

    isRemovePending,

}: INavigationMenuItemsListProps): React.ReactElement {

    const [draggedId, setDraggedId] = useState<number | null>(null);

    const [dropTarget, setDropTarget] = useState<{

        itemId: number;

        edge?: 'top' | 'bottom';

        mode: 'sibling' | 'child' | 'dropzone';

        isInvalid: boolean;

    } | null>(null);



    const childCountByItemId = useMemo(() => {

        const counts = new Map<number, number>();

        for (const item of items) {

            if (item.parent_item_id !== null) {

                counts.set(item.parent_item_id, (counts.get(item.parent_item_id) ?? 0) + 1);

            }

        }

        return counts;

    }, [items]);



    const siblingBounds = useMemo(() => {

        const bounds = new Map<number, { canMoveUp: boolean; canMoveDown: boolean }>();

        const byParent = new Map<number | 'root', IAdminNavigationMenuItem[]>();

        for (const item of items) {

            const parentKey = item.parent_item_id ?? 'root';

            const bucket = byParent.get(parentKey) ?? [];

            bucket.push(item);

            byParent.set(parentKey, bucket);

        }

        for (const siblings of byParent.values()) {

            const sorted = [...siblings].sort((a, b) => a.position - b.position);

            sorted.forEach((item, index) => {

                bounds.set(item.id, {

                    canMoveUp: index > 0,

                    canMoveDown: index < sorted.length - 1,

                });

            });

        }

        return bounds;

    }, [items]);



    useEffect(() => {

        if (!canUpdate) {

            return () => {};

        }



        return monitorForElements({

            onDragStart: ({ source }) => {

                const itemId = source.data.itemId;

                setDraggedId(typeof itemId === 'number' ? itemId : null);

            },

            onDrop: ({ source, location }) => {

                const dragged = typeof source.data.itemId === 'number' ? source.data.itemId : null;

                const targets = location.current.dropTargets;

                const dropZoneTarget = targets.find((entry) => entry.data.type === 'navigation-drop-zone-target');

                const containerTarget = targets.find((entry) => entry.data.type === 'navigation-container-target');

                const siblingTarget = targets.find((entry) => entry.data.type === 'navigation-item-target');



                if (dragged) {

                    if (dropZoneTarget || containerTarget) {

                        const parentId = typeof (dropZoneTarget ?? containerTarget)?.data.itemId === 'number'

                            ? (dropZoneTarget ?? containerTarget)!.data.itemId as number

                            : null;

                        if (parentId !== null) {

                            const order = buildChildDropPayload(items, dragged, parentId);

                            if (order.length > 0) {

                                onReorder(order);

                            }

                        }

                    } else if (siblingTarget) {

                        const targetId = typeof siblingTarget.data.itemId === 'number' ? siblingTarget.data.itemId : null;

                        const edge = siblingTarget.data ? extractClosestEdge(siblingTarget.data) : null;

                        if (targetId && (edge === 'top' || edge === 'bottom')) {

                            const order = buildSiblingReorderPayload(items, dragged, targetId, edge);

                            if (order.length > 0) {

                                onReorder(order);

                            }

                        }

                    }

                }



                setDraggedId(null);

                setDropTarget(null);

            },



            onDrag: ({ location, source }) => {

                const activeDraggedId = typeof source.data.itemId === 'number' ? source.data.itemId : null;

                const targets = location.current.dropTargets;

                const dropZoneTarget = targets.find((entry) => entry.data.type === 'navigation-drop-zone-target');

                const containerTarget = targets.find((entry) => entry.data.type === 'navigation-container-target');

                const siblingTarget = targets.find((entry) => entry.data.type === 'navigation-item-target');



                if (dropZoneTarget) {

                    const itemId = typeof dropZoneTarget.data.itemId === 'number' ? dropZoneTarget.data.itemId : null;

                    if (itemId !== null && activeDraggedId !== null) {

                        setDropTarget({

                            itemId,

                            mode: 'dropzone',

                            isInvalid: activeDraggedId === itemId

                                || isMenuItemDescendant(items, activeDraggedId, itemId),

                        });

                        return;

                    }

                }



                if (containerTarget) {

                    const itemId = typeof containerTarget.data.itemId === 'number' ? containerTarget.data.itemId : null;

                    if (itemId !== null && activeDraggedId !== null) {

                        setDropTarget({

                            itemId,

                            mode: 'child',

                            isInvalid: activeDraggedId === itemId

                                || isMenuItemDescendant(items, activeDraggedId, itemId),

                        });

                        return;

                    }

                }



                if (siblingTarget) {

                    const itemId = typeof siblingTarget.data.itemId === 'number' ? siblingTarget.data.itemId : null;

                    const edge = siblingTarget.data ? extractClosestEdge(siblingTarget.data) : null;

                    if (itemId && (edge === 'top' || edge === 'bottom')) {

                        setDropTarget({ itemId, edge, mode: 'sibling', isInvalid: false });

                        return;

                    }

                }



                setDropTarget(null);

            },

        });

    }, [canUpdate, items, onReorder]);



    if (nestedItems.length === 0) {

        return (

            <Paper withBorder radius="md" p="xl">

                <Stack align="center" gap="xs">

                    <Text fw={500}>No menu items yet</Text>

                    <Text size="sm" c="dimmed" ta="center">

                        Add an existing page or create a new page to start building this menu.

                    </Text>

                </Stack>

            </Paper>

        );

    }



    return (

        <Stack gap={0}>

            {canUpdate ? (

                <Text size="sm" c="dimmed" mb="sm">
                    Drag to reorder. Drop on row edges to reorder siblings, or on the row center to nest under a page or group.
                </Text>

            ) : null}

            {nestedItems.map((item) => {

                const display = getMenuItemDisplay(item, pageById, resolvedLabelByItemId);

                const bounds = siblingBounds.get(item.id) ?? { canMoveUp: false, canMoveDown: false };

                return (

                    <MenuItemRow
                        key={item.id}
                        menuKey={menuKey}
                        item={item}
                        pageById={pageById}
                        allItems={items}

                        childCount={childCountByItemId.get(item.id) ?? 0}

                        display={display}

                        canMoveUp={bounds.canMoveUp}

                        canMoveDown={bounds.canMoveDown}

                        highlighted={highlightedItemId === item.id}

                        canUpdate={canUpdate}

                        isDragging={draggedId === item.id}

                        isDragActive={draggedId !== null}

                        draggedId={draggedId}

                        closestEdge={dropTarget?.itemId === item.id && dropTarget.mode === 'sibling' ? dropTarget.edge ?? null : null}

                        isContainerTarget={dropTarget?.itemId === item.id && dropTarget.mode === 'child'}

                        isDropZoneHover={dropTarget?.itemId === item.id && dropTarget.mode === 'dropzone'}

                        isInvalidDropTarget={dropTarget?.itemId === item.id && dropTarget.isInvalid}

                        onEdit={onEdit}

                        onAddExistingChildPage={onAddExistingChildPage}
                        onCreateChildPage={onCreateChildPage}

                        onMove={(itemId, direction) => {

                            const order = buildSiblingStepPayload(items, itemId, direction);

                            if (order.length > 0) {

                                onReorder(order);

                            }

                        }}

                        onRemove={onRemove}

                        isRemovePending={isRemovePending}

                    />

                );

            })}

        </Stack>

    );

}

