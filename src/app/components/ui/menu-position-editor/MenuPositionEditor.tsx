'use client';

import { useState, useEffect, useRef, useCallback, createContext, useContext } from 'react';
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
    index 
}: { 
    item: IMenuPageItem; 
    index: number; 
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

    // Setup draggable
    useEffect(() => {
        const element = elementRef.current;
        const dragHandle = dragHandleRef.current;

        if (!element || !dragHandle) return;

        return draggable({
            element: dragHandle,
            getInitialData: () => ({
                type: 'menu-page-item',
                pageId: item.id,
                keyword: item.keyword,
                position: item.position,
                index,
                isCurrentPage: item.isCurrentPage
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
                            ${item.isCurrentPage ? '<span style="color: #1976d2; font-size: 12px; font-weight: 500;">Current</span>' : ''}
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
    }, [item, index]);

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
                    isCurrentPage: item.isCurrentPage
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
            withBorder
            style={{
                backgroundColor: item.isCurrentPage 
                    ? 'var(--mantine-color-blue-0)' 
                    : undefined,
                borderColor: item.isCurrentPage 
                    ? 'var(--mantine-color-blue-4)' 
                    : undefined,
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
                    style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
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
    );
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
    const containerRef = useRef<HTMLDivElement>(null);
    const [menuPages, setMenuPages] = useState<IMenuPageItem[]>([]);
    const [dragState, setDragState] = useState<IDragState>({
        isDragActive: false,
        draggedPageId: null
    });

    // Helper functions
    const findPageById = useCallback((id: string, items: IMenuPageItem[]): IMenuPageItem | null => {
        return items.find(item => item.id === id) || null;
    }, []);

    const calculateNewPosition = useCallback((
        targetPage: IMenuPageItem,
        edge: Edge | null,
        pages: IMenuPageItem[]
    ): number => {
        const sortedPages = [...pages].sort((a, b) => a.position - b.position);
        const targetIndex = sortedPages.findIndex(p => p.id === targetPage.id);

        if (edge === 'top') {
            if (targetIndex === 0) {
                // Dropping above the first element
                return targetPage.position - 10;
            }
            // Dropping above target - take position between previous and target
            const previousPage = sortedPages[targetIndex - 1];
            const gap = targetPage.position - previousPage.position;
            return gap > 2 ? Math.floor((previousPage.position + targetPage.position) / 2) : previousPage.position + 1;
        } else {
            // Dropping below target
            if (targetIndex === sortedPages.length - 1) {
                // Dropping below the last element
                return targetPage.position + 10;
            }
            // Dropping below target - take position between target and next
            const nextPage = sortedPages[targetIndex + 1];
            const gap = nextPage.position - targetPage.position;
            return gap > 2 ? Math.floor((targetPage.position + nextPage.position) / 2) : targetPage.position + 1;
        }
    }, []);

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

    // Setup auto-scroll
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        return autoScrollForElements({
            element: container,
        });
    }, [menuPages]);

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

                const draggedPage = findPageById(draggedPageId, menuPages);
                const targetPage = findPageById(targetPageId, menuPages);

                if (!draggedPage || !targetPage || draggedPageId === targetPageId) {
                    return;
                }

                const edge = extractClosestEdge(target.data);
                const newPosition = calculateNewPosition(targetPage, edge, menuPages);

                // Update the menu pages with new positions
                const updatedPages = menuPages.map(page => {
                    if (page.id === draggedPageId) {
                        return { ...page, position: newPosition };
                    }
                    return page;
                }).sort((a, b) => a.position - b.position);

                setMenuPages(updatedPages);

                // If the dragged page is the current page, update the position
                if (draggedPage.isCurrentPage) {
                    onPositionChange(newPosition);
                }
            }
        });
    }, [menuPages, findPageById, calculateNewPosition, onPositionChange]);

    const handleEnabledChange = (checked: boolean) => {
        onEnabledChange(checked);
        
        if (checked && position === null) {
            // Auto-assign position at the end
            const maxPosition = Math.max(0, ...menuPages.map(p => p.position));
            onPositionChange(maxPosition + 10);
        } else if (!checked) {
            onPositionChange(null);
        }
    };

    const menuLabel = menuType === 'header' ? 'Header Menu' : 'Footer Menu';

    return (
        <DragContext.Provider value={dragState}>
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
                            <div ref={containerRef}>
                                <Stack gap="xs">
                                    {menuPages.map((item, index) => (
                                        <MenuPageItem
                                            key={item.id}
                                            item={item}
                                            index={index}
                                        />
                                    ))}
                                </Stack>
                            </div>
                        ) : (
                            <Alert icon={<IconInfoCircle size="1rem" />} color="blue">
                                This page will be the first item in the {menuType} menu.
                            </Alert>
                        )}
                    </Box>
                )}
            </Stack>
        </DragContext.Provider>
    );
} 