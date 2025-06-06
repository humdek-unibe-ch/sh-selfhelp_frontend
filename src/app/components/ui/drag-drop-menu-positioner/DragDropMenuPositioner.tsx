'use client';

import { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
    Box, 
    Text, 
    Paper, 
    Group, 
    ActionIcon,
    Alert,
    Checkbox
} from '@mantine/core';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { IconGripVertical, IconInfoCircle } from '@tabler/icons-react';
import { useAdminPages } from '../../../../hooks/useAdminPages';
import { IAdminPage } from '../../../../types/responses/admin/admin.types';
import { debug } from '../../../../utils/debug-logger';
import styles from './DragDropMenuPositioner.module.css';

export interface IMenuPageItem {
    id: string;
    keyword: string;
    label: string;
    position: number;
    isNew?: boolean;
}

interface IDragDropMenuPositionerProps {
    // Menu configuration
    menuType: 'header' | 'footer';
    title: string;
    
    // Current page being positioned
    currentPage?: IAdminPage | null;
    newPageKeyword?: string;
    
    // Menu state
    enabled: boolean;
    position: number | null;
    
    // Callbacks
    onEnabledChange: (enabled: boolean) => void;
    onPositionChange: (position: number | null) => void;
    
    // Context for filtering pages (for child page creation)
    parentPage?: IAdminPage | null;
    
    // Optional styling
    showCheckbox?: boolean;
    checkboxLabel?: string;
    showAlert?: boolean;
    alertMessage?: string;
}

// DragClonePortal: render children in a portal to <body>
const DragClonePortal = ({ children }: { children: React.ReactNode }) => {
    if (typeof window === "undefined") return null;
    return createPortal(children, document.body);
};

export function DragDropMenuPositioner({
    menuType,
    title,
    currentPage,
    newPageKeyword,
    enabled,
    position,
    onEnabledChange,
    onPositionChange,
    parentPage = null,
    showCheckbox = true,
    checkboxLabel,
    showAlert = true,
    alertMessage = "Drag the page to set its position"
}: IDragDropMenuPositionerProps) {
    const [menuPages, setMenuPages] = useState<IMenuPageItem[]>([]);
    const [droppedIndex, setDroppedIndex] = useState<number | null>(null);
    
    // Fetch admin pages
    const { pages, isLoading: pagesLoading } = useAdminPages();

    // Process admin pages into menu items based on context
    const processMenuPages = useMemo(() => {
        if (!pages.length) return [];

        const menuPages: IMenuPageItem[] = [];
        
        // Determine which pages to show based on context
        let pagesToProcess: IAdminPage[] = [];

        if (parentPage) {
            // Creating a child page - show only children of the parent
            pagesToProcess = parentPage.children || [];
            debug('Processing child pages for parent', 'DragDropMenuPositioner', {
                parentKeyword: parentPage.keyword,
                childrenCount: pagesToProcess.length,
                menuType
            });
        } else {
            // Show root pages (pages with parent: null)
            pagesToProcess = pages.filter(page => page.parent === null);
            debug('Processing root pages', 'DragDropMenuPositioner', {
                rootPagesCount: pagesToProcess.length,
                menuType
            });
        }

        const processPage = (page: IAdminPage) => {
            const positionField = menuType === 'header' ? 'nav_position' : 'footer_position';
            const pagePosition = page[positionField];
            
            // Only include pages that have a position in this menu type
            if (pagePosition !== null && pagePosition !== undefined) {
                menuPages.push({
                    id: page.id_pages.toString(),
                    keyword: page.keyword,
                    label: page.keyword,
                    position: pagePosition
                });
            }
        };

        // Process pages
        pagesToProcess.forEach(processPage);

        // Sort pages by position
        menuPages.sort((a, b) => a.position - b.position);

        debug('Processed menu pages', 'DragDropMenuPositioner', {
            context: parentPage ? 'child' : 'root',
            parentKeyword: parentPage?.keyword,
            menuType,
            pagesCount: menuPages.length
        });

        return menuPages;
    }, [pages, parentPage, menuType]);

    // Initialize menu pages when data is available
    useEffect(() => {
        setMenuPages(processMenuPages);
    }, [processMenuPages]);

    // Add new page to menu list when enabled
    const menuPagesWithNew = useMemo(() => {
        const pageKeyword = newPageKeyword || currentPage?.keyword;
        if (!pageKeyword || !enabled) return menuPages;
        
        const newPage: IMenuPageItem = {
            id: currentPage ? `current-page-${currentPage.id_pages}` : 'new-page',
            keyword: pageKeyword,
            label: pageKeyword,
            position: menuPages.length > 0 ? menuPages[menuPages.length - 1].position + 5 : 10,
            isNew: true
        };

        // If we have a dropped index, insert at that position
        if (droppedIndex !== null) {
            const result = [...menuPages];
            result.splice(droppedIndex, 0, newPage);
            return result;
        }

        // Default: add at the end
        return [...menuPages, newPage];
    }, [menuPages, currentPage, newPageKeyword, enabled, droppedIndex]);

    // Handle drag end
    const handleDragEnd = (result: DropResult) => {
        const pageKeyword = newPageKeyword || currentPage?.keyword;
        if (!result.destination || !pageKeyword) return;
        
        // Store both the form position and the visual dropped index
        const destinationIndex = result.destination.index;
        onPositionChange(destinationIndex);
        setDroppedIndex(destinationIndex);
    };

    // Calculate final position based on index and existing pages
    const calculateFinalPosition = (pages: IMenuPageItem[], targetIndex: number): number => {
        if (targetIndex === 0) {
            // First position - place at 5 (before first position of 10)
            if (pages.length === 0) {
                return 10; // If no pages, start at 10
            }
            return Math.max(5, pages[0].position - 5);
        } else if (targetIndex >= pages.length) {
            // Last position - add 5 to last page position (or start at 10 if no pages)
            return pages.length > 0 ? pages[pages.length - 1].position + 5 : 10;
        } else {
            // Between two pages - place exactly in the middle
            const prevPage = pages[targetIndex - 1];
            const nextPage = pages[targetIndex];
            const middlePosition = Math.floor((prevPage.position + nextPage.position) / 2);
            
            // Ensure we don't get the same position as existing pages
            if (middlePosition <= prevPage.position) {
                return prevPage.position + 5;
            } else if (middlePosition >= nextPage.position) {
                return nextPage.position - 5;
            }
            
            return middlePosition;
        }
    };

    // Get final calculated position for external use
    const getFinalPosition = (): number | null => {
        if (!enabled) return null;
        
        if (position !== null) {
            // User dragged to specific position
            const finalPosition = Math.round(calculateFinalPosition(menuPages, position));
            return finalPosition < 0 ? 1 : finalPosition;
        } else {
            // User enabled menu but didn't drag - add at the end
            return menuPages.length > 0 ? menuPages[menuPages.length - 1].position + 5 : 10;
        }
    };

    // Render menu item for drag and drop
    const renderMenuItem = (item: IMenuPageItem, index: number) => {
        return (
            <Draggable 
                key={item.id} 
                draggableId={item.id} 
                index={index}
                isDragDisabled={!item.isNew} // Only new/current pages can be dragged
            >
                {(provided, snapshot) => {
                    const draggableContent = (
                        <Paper
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...(item.isNew ? provided.dragHandleProps : {})}
                            p="xs"
                            mb="xs"
                            withBorder
                            className={`${styles.item} ${item.isNew ? styles.newPageItem : ''} ${snapshot.isDragging ? styles.itemDragging : ''}`}
                            style={{
                                ...provided.draggableProps.style,
                            }}
                        >
                            <Group gap="xs" wrap="nowrap">
                                <ActionIcon
                                    variant="subtle"
                                    size="sm"
                                    className={item.isNew ? styles.dragItem : styles.dragItemDisabled}
                                    style={{ pointerEvents: 'none' }}
                                >
                                    <IconGripVertical size="0.8rem" />
                                </ActionIcon>
                                <Text size="sm" fw={item.isNew ? 600 : 400} style={{ flex: 1 }}>
                                    {item.label}
                                </Text>
                                {item.isNew && (
                                    <Text size="xs" c="blue" fw={500}>
                                        {currentPage ? 'Current' : 'New'}
                                    </Text>
                                )}
                            </Group>
                        </Paper>
                    );

                    // If dragging, render in portal to escape modal/container transform
                    if (snapshot.isDragging) {
                        return <DragClonePortal>{draggableContent}</DragClonePortal>;
                    }
                    
                    return draggableContent;
                }}
            </Draggable>
        );
    };

    return (
        <Box className={styles.dragContainer}>
            {showCheckbox && (
                <Checkbox
                    label={checkboxLabel || `${title} Menu`}
                    checked={enabled}
                    onChange={(event) => onEnabledChange(event.currentTarget.checked)}
                    mb="md"
                />
            )}
            
            {enabled && (
                <>
                    <Text size="sm" fw={500} mb="xs">{title}</Text>
                    <DragDropContext onDragEnd={handleDragEnd}>
                        <Droppable droppableId={`${menuType}-menu`}>
                            {(provided, snapshot) => (
                                <Box
                                    {...provided.droppableProps}
                                    ref={provided.innerRef}
                                    p="sm"
                                    className={styles.dragArea}
                                >
                                    {menuPagesWithNew.map((item, index) => renderMenuItem(item, index))}
                                    {provided.placeholder}
                                    {menuPagesWithNew.length === 0 && (
                                        <Text size="sm" c="dimmed" ta="center" mt="md">
                                            No pages to display
                                        </Text>
                                    )}
                                </Box>
                            )}
                        </Droppable>
                    </DragDropContext>
                    
                    {showAlert && (
                        <Alert icon={<IconInfoCircle size="1rem" />} mt="xs" color="blue">
                            {alertMessage}
                        </Alert>
                    )}
                </>
            )}
        </Box>
    );
}

// Export as default
export { DragDropMenuPositioner as default }; 