'use client';

import { useState, useMemo, useEffect, useRef, useCallback, createContext, useContext } from 'react';
import { 
    Box, 
    Text, 
    Paper, 
    Group, 
    ActionIcon,
    Alert,
    Checkbox
} from '@mantine/core';
import { IconGripVertical, IconInfoCircle } from '@tabler/icons-react';
import {
    draggable,
    dropTargetForElements,
    monitorForElements,
} from '@atlaskit/pragmatic-drag-and-drop/element/adapter';
import {
    attachClosestEdge,
    extractClosestEdge,
    type Edge
} from '@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge';
import { autoScrollForElements } from '@atlaskit/pragmatic-drag-and-drop-auto-scroll/element';
import { pointerOutsideOfPreview } from '@atlaskit/pragmatic-drag-and-drop/element/pointer-outside-of-preview';
import { setCustomNativeDragPreview } from '@atlaskit/pragmatic-drag-and-drop/element/set-custom-native-drag-preview';
import { DropIndicator } from '@atlaskit/pragmatic-drag-and-drop-react-drop-indicator/box';

import { useAdminPages } from '../../../../hooks/useAdminPages';
import { IAdminPage } from '../../../../types/responses/admin/admin.types';
import { debug } from '../../../../utils/debug-logger';
import { calculateMenuPosition, calculateFinalMenuPosition } from '../../../../utils/position-calculator';
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
    onGetFinalPosition?: (getFinalPositionFn: () => number | null) => void;
    
    // Context for filtering pages (for child page creation)
    parentPage?: IAdminPage | null;
    
    // Optional styling
    showCheckbox?: boolean;
    checkboxLabel?: string;
    showAlert?: boolean;
    alertMessage?: string;
}

interface IDragState {
    isDragActive: boolean;
    draggedPageId: string | null;
}

interface IDropState {
    closestEdge: Edge | null;
    isDropTarget: boolean;
}

// Context for drag state
const DragContext = createContext<IDragState>({
    isDragActive: false,
    draggedPageId: null
});

function MenuPageItem({ 
    item, 
    index,
    onPositionChange 
}: { 
    item: IMenuPageItem; 
    index: number;
    onPositionChange: (position: number | null) => void;
}) {
    const dragContext = useContext(DragContext);
    const elementRef = useRef<HTMLDivElement>(null);
    const dragHandleRef = useRef<HTMLButtonElement>(null);

    const [isDragging, setIsDragging] = useState(false);
    const [dropState, setDropState] = useState<IDropState>({
        closestEdge: null,
        isDropTarget: false
    });

    const isBeingDragged = dragContext.draggedPageId === item.id;
    const canDrag = item.isNew; // Only new/current pages can be dragged

    // Setup draggable
    useEffect(() => {
        const element = elementRef.current;
        const dragHandle = dragHandleRef.current;

        if (!element || !dragHandle || !canDrag) return;

        return draggable({
            element: dragHandle,
            getInitialData: () => ({
                type: 'menu-page-item',
                pageId: item.id,
                keyword: item.keyword,
                position: item.position,
                index,
                isNew: item.isNew
            }),
            onGenerateDragPreview: ({ nativeSetDragImage }) => {
                setCustomNativeDragPreview({
                    nativeSetDragImage,
                    getOffset: pointerOutsideOfPreview({
                        x: '16px',
                        y: '8px',
                    }),
                    render: ({ container }) => {
                        const preview = document.createElement('div');
                        preview.style.cssText = `
                            background: white;
                            border: 1px solid #e0e0e0;
                            border-radius: 4px;
                            padding: 8px 12px;
                            font-size: 14px;
                            box-shadow: 0 2px 8px rgba(0,0,0,0.15);
                            display: flex;
                            align-items: center;
                            gap: 8px;
                        `;
                        preview.innerHTML = `
                            <span style="color: #666;">📄</span>
                            <span>${item.label}</span>
                            ${item.isNew ? '<span style="color: #1976d2; font-size: 12px; font-weight: 500;">New</span>' : ''}
                        `;
                        container.appendChild(preview);
                    },
                });
            },
            onDragStart: () => {
                setIsDragging(true);
            },
            onDrop: () => {
                setIsDragging(false);
            }
        });
    }, [item, index, canDrag]);

    // Setup drop target
    useEffect(() => {
        const element = elementRef.current;
        if (!element) return;

        return dropTargetForElements({
            element,
            canDrop: ({ source }) => {
                const draggedId = source.data.pageId as string;
                // Can't drop on itself
                return draggedId !== item.id && source.data.type === 'menu-page-item';
            },
            getData: ({ input, element }) => {
                const data = {
                    type: 'menu-page-drop-target',
                    pageId: item.id,
                    keyword: item.keyword,
                    position: item.position,
                    index,
                    isNew: item.isNew
                };

                return attachClosestEdge(data, {
                    input,
                    element,
                    allowedEdges: ['top', 'bottom']
                });
            },
            onDragEnter: ({ self }) => {
                const edge = extractClosestEdge(self.data);
                setDropState({
                    closestEdge: edge,
                    isDropTarget: true
                });
            },
            onDragLeave: () => {
                setDropState({
                    closestEdge: null,
                    isDropTarget: false
                });
            },
            onDrop: () => {
                setDropState({
                    closestEdge: null,
                    isDropTarget: false
                });
            }
        });
    }, [item, index]);

    return (
        <Paper
            ref={elementRef}
            p="xs"
            mb="xs"
            withBorder
            className={`${styles.item} ${item.isNew ? styles.newPageItem : ''} ${isDragging ? styles.itemDragging : ''}`}
            style={{
                opacity: isDragging || isBeingDragged ? 0.5 : 1,
                position: 'relative'
            }}
        >
            {/* Drop indicators */}
            {dropState.isDropTarget && dropState.closestEdge === 'top' && (
                <DropIndicator edge="top" gap="8px" />
            )}
            {dropState.isDropTarget && dropState.closestEdge === 'bottom' && (
                <DropIndicator edge="bottom" gap="8px" />
            )}

            <Group gap="xs" wrap="nowrap">
                <ActionIcon
                    ref={dragHandleRef}
                    variant="subtle"
                    size="sm"
                    className={item.isNew ? styles.dragItem : styles.dragItemDisabled}
                    style={{ 
                        cursor: canDrag ? (isDragging ? 'grabbing' : 'grab') : 'not-allowed',
                        pointerEvents: canDrag ? 'auto' : 'none'
                    }}
                >
                    <IconGripVertical size="0.8rem" />
                </ActionIcon>
                <Text size="sm" fw={item.isNew ? 600 : 400} style={{ flex: 1 }}>
                    {item.label}
                </Text>
                {item.isNew && (
                    <Text size="xs" c="blue" fw={500}>
                        New
                    </Text>
                )}
            </Group>
        </Paper>
    );
}

export function DragDropMenuPositioner({
    menuType,
    title,
    currentPage,
    newPageKeyword,
    enabled,
    position,
    onEnabledChange,
    onPositionChange,
    onGetFinalPosition,
    parentPage = null,
    showCheckbox = true,
    checkboxLabel,
    showAlert = true,
    alertMessage = "Drag the page to set its position"
}: IDragDropMenuPositionerProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [menuPages, setMenuPages] = useState<IMenuPageItem[]>([]);
    const [droppedIndex, setDroppedIndex] = useState<number | null>(null);
    const [dragState, setDragState] = useState<IDragState>({
        isDragActive: false,
        draggedPageId: null
    });
    
    // Fetch admin pages
    const { pages, isLoading: pagesLoading } = useAdminPages();

    // Helper functions
    const findPageById = useCallback((id: string, items: IMenuPageItem[]): IMenuPageItem | null => {
        return items.find(item => item.id === id) || null;
    }, []);

    const calculateNewPosition = useCallback((
        targetPage: IMenuPageItem,
        edge: Edge | null,
        pages: IMenuPageItem[]
    ): number => {
        return calculateMenuPosition(targetPage, edge, pages);
    }, []);

    // Memoize parent page ID to avoid object reference issues
    const parentPageId = useMemo(() => parentPage?.id_pages || null, [parentPage?.id_pages]);

    // Process admin pages into menu items based on context
    const processMenuPages = useMemo(() => {
        if (!pages.length) return [];

        const menuPages: IMenuPageItem[] = [];
        
        // Determine which pages to show based on context
        let pagesToProcess: IAdminPage[] = [];

        if (parentPageId) {
            // Creating a child page - show only children of the parent
            pagesToProcess = pages.filter(page => page.parent === parentPageId);
            debug('Processing child pages for parent', 'DragDropMenuPositioner', {
                parentPageId,
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
            context: parentPageId ? 'child' : 'root',
            parentPageId,
            menuType,
            pagesCount: menuPages.length
        });

        return menuPages;
    }, [pages, parentPageId, menuType]);

    // Initialize menu pages when data is available - with stability check
    useEffect(() => {
        setMenuPages(prevMenuPages => {
            // Only update if the processed pages are actually different
            // This prevents unnecessary re-renders when the same data is recalculated
            if (prevMenuPages.length === processMenuPages.length &&
                prevMenuPages.every((page, index) => 
                    page.id === processMenuPages[index]?.id &&
                    page.keyword === processMenuPages[index]?.keyword &&
                    page.position === processMenuPages[index]?.position
                )
            ) {
                return prevMenuPages; // Return the same reference to prevent re-renders
            }
            return processMenuPages;
        });
    }, [processMenuPages]);

    // Add new page to menu list when enabled
    const menuPagesWithNew = useMemo(() => {
        const pageKeyword = newPageKeyword || currentPage?.keyword;
        if (!pageKeyword || !enabled) {
            return menuPages;
        }
        
        // Check if the page already exists in the menu
        const existingPageIndex = menuPages.findIndex(page => page.keyword === pageKeyword);
        
        if (existingPageIndex !== -1) {
            // Page already exists in menu - mark it as current instead of adding duplicate
            let updatedPages = menuPages.map((page, index) => ({
                ...page,
                isNew: index === existingPageIndex // Mark the existing page as current
            }));
            
            // If user has dragged to a new position, reorder the pages
            if (droppedIndex !== null && droppedIndex !== existingPageIndex) {
                // Remove the current page from its original position
                const currentPageItem = updatedPages[existingPageIndex];
                updatedPages = updatedPages.filter((_, index) => index !== existingPageIndex);
                
                // Insert at the new position (no adjustment needed since we removed the item first)
                updatedPages.splice(droppedIndex, 0, currentPageItem);
                
                debug('Reordering existing page in menu', 'DragDropMenuPositioner', {
                    menuType,
                    pageKeyword,
                    originalIndex: existingPageIndex,
                    newIndex: droppedIndex,
                    droppedIndex,
                    updatedPagesCount: updatedPages.length
                });
            }
            
            debug('Page already exists in menu, marking as current', 'DragDropMenuPositioner', {
                menuType,
                pageKeyword,
                existingPageIndex,
                droppedIndex,
                menuPagesCount: menuPages.length
            });
            
            return updatedPages;
        } else {
            // Page doesn't exist in menu - add as new (for create mode)
            const newPage: IMenuPageItem = {
                id: currentPage ? `current-page-${currentPage.id_pages}` : 'new-page',
                keyword: pageKeyword,
                label: pageKeyword,
                position: menuPages.length > 0 ? menuPages[menuPages.length - 1].position + 10 : 10,
                isNew: true
            };
            
            // If user dragged to specific position, insert there
            if (droppedIndex !== null) {
                const pagesWithNew = [...menuPages];
                pagesWithNew.splice(droppedIndex, 0, newPage);
                
                debug('Adding new page at dropped position', 'DragDropMenuPositioner', {
                    menuType,
                    pageKeyword,
                    droppedIndex,
                    menuPagesCount: menuPages.length,
                    newPagePosition: newPage.position
                });
                
                return pagesWithNew;
            } else {
                // Add at the end
                debug('Adding new page at end', 'DragDropMenuPositioner', {
                    menuType,
                    pageKeyword,
                    menuPagesCount: menuPages.length,
                    newPagePosition: newPage.position
                });
                
                return [...menuPages, newPage];
            }
        }
    }, [menuPages, enabled, currentPage, newPageKeyword, droppedIndex, menuType]);

    // Setup auto-scroll
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        return autoScrollForElements({
            element: container,
        });
    }, [menuPagesWithNew]);

    // Monitor for drag and drop
    useEffect(() => {
        return monitorForElements({
            canMonitor: ({ source }) => source.data.type === 'menu-page-item',
            onDragStart: ({ source }) => {
                const pageId = source.data.pageId as string;
                setDragState({
                    isDragActive: true,
                    draggedPageId: pageId
                });
            },
            onDrop: ({ location, source }) => {
                setDragState({
                    isDragActive: false,
                    draggedPageId: null
                });

                if (!location.current.dropTargets.length) {
                    return;
                }

                const draggedPageId = source.data.pageId as string;
                const target = location.current.dropTargets[0];
                const targetPageId = target.data.pageId as string;

                const draggedPage = findPageById(draggedPageId, menuPagesWithNew || []);
                const targetPage = findPageById(targetPageId, menuPagesWithNew || []);

                if (!draggedPage || !targetPage || draggedPageId === targetPageId) {
                    return;
                }

                const edge = extractClosestEdge(target.data);
                const newPosition = calculateNewPosition(targetPage, edge, menuPagesWithNew || []);

                // Update the menu pages with new positions
                const updatedPages = (menuPagesWithNew || []).map(page => {
                    if (page.id === draggedPageId) {
                        return { ...page, position: newPosition };
                    }
                    return page;
                }).sort((a, b) => a.position - b.position);

                // Find the new index after sorting
                const newIndex = updatedPages.findIndex(page => page.id === draggedPageId);
                setDroppedIndex(newIndex);

                // If the dragged page is the new page, update the position
                if (draggedPage.isNew) {
                    onPositionChange(newPosition);
                }

                debug('Drag ended', 'DragDropMenuPositioner', {
                    menuType,
                    draggedPageId,
                    targetPageId,
                    edge,
                    newPosition,
                    newIndex
                });
            }
        });
    }, [menuPagesWithNew, findPageById, calculateNewPosition, onPositionChange, menuType]);

    // Calculate final position helper
    const calculateFinalPosition = (pages: IMenuPageItem[], targetIndex: number): number => {
        return calculateFinalMenuPosition(pages, targetIndex);
    };

    // Get final calculated position for external use
    const getFinalPosition = useCallback((): number | null => {
        if (!enabled) return null;
        
        const pageKeyword = newPageKeyword || currentPage?.keyword;
        if (!pageKeyword) return null;
        
        // Check if the page already exists in the menu
        const existingPageIndex = menuPages.findIndex(page => page.keyword === pageKeyword);
        
        if (existingPageIndex !== -1) {
            // Page already exists in menu
            if (droppedIndex !== null && droppedIndex !== existingPageIndex) {
                // User dragged to a new position - calculate based on the final reordered position
                // Create a copy of the menu pages and simulate the reordering
                const reorderedPages = [...menuPages];
                const currentPageItem = reorderedPages[existingPageIndex];
                
                // Remove the current page from its original position
                reorderedPages.splice(existingPageIndex, 1);
                
                // Insert at the new position (no adjustment needed since we removed the item first)
                reorderedPages.splice(droppedIndex, 0, currentPageItem);
                
                // Calculate position based on the new index in the reordered array
                const finalPosition = calculateFinalPosition(reorderedPages.filter(p => p.keyword !== pageKeyword), droppedIndex);
                
                debug('Calculating final position for existing page (dragged)', 'DragDropMenuPositioner', {
                    menuType,
                    pageKeyword,
                    existingPageIndex,
                    droppedIndex,
                    finalPosition,
                    reorderedPagesCount: reorderedPages.length,
                    otherPagesCount: reorderedPages.filter(p => p.keyword !== pageKeyword).length
                });
                return finalPosition;
            } else {
                // User didn't drag or dragged to same position - keep existing position
                const existingPosition = menuPages[existingPageIndex].position;
                debug('Keeping existing position for page in menu', 'DragDropMenuPositioner', {
                    menuType,
                    pageKeyword,
                    existingPageIndex,
                    existingPosition
                });
                return existingPosition;
            }
        } else {
            // Page doesn't exist in menu - this is create mode
            if (droppedIndex !== null) {
                // User dragged to specific position - calculate based on the dropped index
                const finalPosition = calculateFinalPosition(menuPages, droppedIndex);
                debug('Calculating final position for new page (dragged)', 'DragDropMenuPositioner', {
                    menuType,
                    pageKeyword,
                    droppedIndex,
                    menuPagesCount: menuPages.length,
                    finalPosition
                });
                return finalPosition;
            } else {
                // User enabled menu but didn't drag - add at the end
                const endPosition = menuPages.length > 0 ? 
                    (menuPages[menuPages.length - 1].position === -1 ? 5 : menuPages[menuPages.length - 1].position + 10) : 
                    -1;
                debug('Calculating final position for new page (no drag)', 'DragDropMenuPositioner', {
                    menuType,
                    pageKeyword,
                    menuPagesCount: menuPages.length,
                    endPosition
                });
                return endPosition;
            }
        }
    }, [enabled, newPageKeyword, currentPage, menuPages, droppedIndex, calculateFinalPosition, menuType]);

    // Expose getFinalPosition function to parent component
    useEffect(() => {
        if (onGetFinalPosition) {
            onGetFinalPosition(getFinalPosition);
        }
    }, [onGetFinalPosition, getFinalPosition]);

    return (
        <DragContext.Provider value={dragState}>
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
                        <Box
                            ref={containerRef}
                            p="sm"
                            className={styles.dragArea}
                        >
                            {menuPagesWithNew?.map((item, index) => (
                                <MenuPageItem
                                    key={item.id}
                                    item={item}
                                    index={index}
                                    onPositionChange={onPositionChange}
                                />
                            ))}
                            {(menuPagesWithNew?.length ?? 0) === 0 && (
                                <Text size="sm" c="dimmed" ta="center" mt="md">
                                    No pages to display
                                </Text>
                            )}
                        </Box>
                        
                        {showAlert && (
                            <Alert icon={<IconInfoCircle size="1rem" />} mt="xs" color="blue">
                                {alertMessage}
                            </Alert>
                        )}
                    </>
                )}
            </Box>
        </DragContext.Provider>
    );
}

// Export as default
export { DragDropMenuPositioner as default }; 