'use client';

import { useState, useEffect } from 'react';
import { 
    Checkbox, 
    Stack, 
    Text, 
    Paper, 
    Group, 
    ActionIcon, 
    Alert,
    Box
} from '@mantine/core';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { IconGripVertical, IconInfoCircle } from '@tabler/icons-react';
import { useAdminPages } from '../../../../hooks/useAdminPages';
import { IAdminPage } from '../../../../types/responses/admin/admin.types';

interface IMenuPageItem {
    id: string;
    keyword: string;
    label: string;
    position: number;
    isCurrentPage?: boolean;
}

interface MenuPositionEditorProps {
    /** Current page being edited */
    currentPage: IAdminPage;
    /** Menu type: 'header' or 'footer' */
    menuType: 'header' | 'footer';
    /** Whether the menu is enabled */
    enabled: boolean;
    /** Current position value */
    position: number | null;
    /** Callback when enabled state changes */
    onEnabledChange: (enabled: boolean) => void;
    /** Callback when position changes */
    onPositionChange: (position: number | null) => void;
}

export function MenuPositionEditor({
    currentPage,
    menuType,
    enabled,
    position,
    onEnabledChange,
    onPositionChange
}: MenuPositionEditorProps) {
    const { pages } = useAdminPages();
    const [menuPages, setMenuPages] = useState<IMenuPageItem[]>([]);
    const [droppedIndex, setDroppedIndex] = useState<number | null>(null);

    // Filter and prepare menu pages
    useEffect(() => {
        if (!pages) return;

        const positionField = menuType === 'header' ? 'nav_position' : 'footer_position';
        
        // Get pages that have positions in this menu type
        const existingMenuPages = pages
            .filter(page => page[positionField] !== null && page.keyword !== currentPage.keyword)
            .sort((a, b) => (a[positionField] || 0) - (b[positionField] || 0))
            .map(page => ({
                id: page.id_pages.toString(),
                keyword: page.keyword,
                label: page.keyword,
                position: page[positionField] || 0
            }));

        // Add current page if it has a position
        if (position !== null) {
            const currentPageItem: IMenuPageItem = {
                id: currentPage.id_pages.toString(),
                keyword: currentPage.keyword,
                label: currentPage.keyword,
                position: position,
                isCurrentPage: true
            };

            // Insert current page at correct position
            const allPages = [...existingMenuPages, currentPageItem]
                .sort((a, b) => a.position - b.position);

            setMenuPages(allPages);
        } else {
            setMenuPages(existingMenuPages);
        }
    }, [pages, currentPage, menuType, position]);

    const handleEnabledChange = (checked: boolean) => {
        onEnabledChange(checked);
        
        if (checked && position === null) {
            // Auto-assign position at the end
            const maxPosition = Math.max(0, ...menuPages.map(p => p.position));
            onPositionChange(maxPosition + 10);
            setDroppedIndex(null);
        } else if (!checked) {
            onPositionChange(null);
            setDroppedIndex(null);
        }
    };

    const handleDragEnd = (result: DropResult) => {
        if (!result.destination) return;

        const items = Array.from(menuPages);
        const [reorderedItem] = items.splice(result.source.index, 1);
        items.splice(result.destination.index, 0, reorderedItem);

        // Update positions based on new order
        const updatedItems = items.map((item, index) => ({
            ...item,
            position: (index + 1) * 10
        }));

        setMenuPages(updatedItems);

        // Find the current page's new position
        const currentPageItem = updatedItems.find(item => item.isCurrentPage);
        if (currentPageItem) {
            onPositionChange(currentPageItem.position);
            setDroppedIndex(result.destination.index);
        }
    };

    const menuLabel = menuType === 'header' ? 'Header Menu' : 'Footer Menu';

    return (
        <Stack gap="md">
            <Checkbox
                label={menuLabel}
                checked={enabled}
                onChange={(e) => handleEnabledChange(e.currentTarget.checked)}
            />

            {enabled && (
                <Box>
                    <Text size="sm" fw={500} mb="xs">
                        {menuLabel} Position
                    </Text>
                    
                    {menuPages.length > 0 ? (
                        <DragDropContext onDragEnd={handleDragEnd}>
                            <Droppable droppableId={`${menuType}-menu`}>
                                {(provided) => (
                                    <div {...provided.droppableProps} ref={provided.innerRef}>
                                        <Stack gap="xs">
                                            {menuPages.map((item, index) => (
                                                <Draggable
                                                    key={item.id}
                                                    draggableId={item.id}
                                                    index={index}
                                                >
                                                    {(provided, snapshot) => (
                                                        <Paper
                                                            ref={provided.innerRef}
                                                            {...provided.draggableProps}
                                                            {...provided.dragHandleProps}
                                                            p="xs"
                                                            withBorder
                                                            style={{
                                                                ...provided.draggableProps.style,
                                                                backgroundColor: item.isCurrentPage 
                                                                    ? 'var(--mantine-color-blue-0)' 
                                                                    : undefined,
                                                                borderColor: item.isCurrentPage 
                                                                    ? 'var(--mantine-color-blue-4)' 
                                                                    : undefined,
                                                                opacity: snapshot.isDragging ? 0.8 : 1
                                                            }}
                                                        >
                                                            <Group gap="xs" wrap="nowrap">
                                                                <ActionIcon
                                                                    variant="subtle"
                                                                    size="sm"
                                                                    style={{ cursor: 'grab' }}
                                                                >
                                                                    <IconGripVertical size="0.8rem" />
                                                                </ActionIcon>
                                                                <Text 
                                                                    size="sm" 
                                                                    fw={item.isCurrentPage ? 600 : 400}
                                                                    style={{ flex: 1 }}
                                                                >
                                                                    {item.label}
                                                                </Text>
                                                                <Text size="xs" c="dimmed">
                                                                    Pos: {item.position}
                                                                </Text>
                                                                {item.isCurrentPage && (
                                                                    <Text size="xs" c="blue" fw={500}>
                                                                        Current
                                                                    </Text>
                                                                )}
                                                            </Group>
                                                        </Paper>
                                                    )}
                                                </Draggable>
                                            ))}
                                        </Stack>
                                        {provided.placeholder}
                                    </div>
                                )}
                            </Droppable>
                        </DragDropContext>
                    ) : (
                        <Alert icon={<IconInfoCircle size="1rem" />} color="blue">
                            This page will be the first item in the {menuType} menu.
                        </Alert>
                    )}
                </Box>
            )}
        </Stack>
    );
} 