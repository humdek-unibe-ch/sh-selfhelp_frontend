'use client';

import {
    useCallback,
    useContext,
    useEffect,
    useRef,
    useState,
    createContext,
    memo,
    useMemo
} from 'react';
import { Box, Text, Paper } from '@mantine/core';
import { IconPlus } from '@tabler/icons-react';
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

import { IPageSectionWithFields } from '../../../../../types/common/pages.type';
import { PageSection } from './PageSection';
import { calculateDragDropPosition, calculateContainerDropPosition } from '../../../../../utils/position-calculator';
import styles from './SectionsList.module.css';

// Types
interface ISectionsListProps {
    sections: IPageSectionWithFields[];
    expandedSections: Set<number>;
    onToggleExpand: (sectionId: number) => void;
    onSectionMove: (moveData: any) => void;
    onRemoveSection: (sectionId: number, parentId: number | null) => void;
    onAddChildSection?: (parentSectionId: number) => void;
    onAddSiblingAbove?: (referenceSectionId: number, parentId: number | null) => void;
    onAddSiblingBelow?: (referenceSectionId: number, parentId: number | null) => void;
    onSectionSelect?: (sectionId: number) => void;
    selectedSectionId?: number | null;
    focusedSectionId?: number | null;
    pageId?: number;
}

interface ISectionItemProps {
    section: IPageSectionWithFields;
    level: number;
    index: number;
    parentId: number | null;
    allSections: IPageSectionWithFields[];
    pageId: number;
    onRemoveSection: (sectionId: number, parentId: number | null) => void;
    onAddChildSection?: (parentSectionId: number) => void;
    onAddSiblingAbove?: (referenceSectionId: number, parentId: number | null) => void;
    onAddSiblingBelow?: (referenceSectionId: number, parentId: number | null) => void;
    onSectionSelect?: (sectionId: number) => void;
    selectedSectionId?: number | null;
    focusedSectionId?: number | null;
}

interface IDragState {
    isDragActive: boolean;
    draggedSectionId: number | null;
}

interface IDropState {
    closestEdge: Edge | null;
    isDropTarget: boolean;
    isContainerTarget: boolean;
    isDropZoneHover: boolean;
}

interface IHoverPreviewState {
    isHovering: boolean;
    targetSectionId: number | null;
    dropType: 'above' | 'below' | 'inside' | null;
    newParentId: number | null;
    newPosition: number | null;
    targetSectionName: string | null;
}

// Context for drag state
const DragContext = createContext<IDragState>({
    isDragActive: false,
    draggedSectionId: null
});

// Context for hover preview
const HoverPreviewContext = createContext<{
    hoverState: IHoverPreviewState;
    setHoverState: (state: IHoverPreviewState) => void;
} | null>(null);

// Clean Section Item Component with improved drop detection - memoized for performance
const SectionItem = memo(function SectionItem({
    section,
    level,
    index,
    parentId,
    allSections,
    pageId,
    onRemoveSection,
    onAddChildSection,
    onAddSiblingAbove,
    onAddSiblingBelow,
    onSectionSelect,
    selectedSectionId,
    focusedSectionId
}: ISectionItemProps) {
    const dragContext = useContext(DragContext);
    const hoverPreviewContext = useContext(HoverPreviewContext);
    const elementRef = useRef<HTMLDivElement>(null);
    const dragHandleRef = useRef<HTMLDivElement>(null);
    const dropZoneRef = useRef<HTMLDivElement>(null);

    const [isDragging, setIsDragging] = useState(false);
    const [dropState, setDropState] = useState<IDropState>({
        closestEdge: null,
        isDropTarget: false,
        isContainerTarget: false,
        isDropZoneHover: false
    });

    const { expandedSections, onToggleExpand } = useSectionsContext();
    const isExpanded = expandedSections.has(section.id);
    const hasChildren = section.children && section.children.length > 0;
    const canHaveChildren = !!section.can_have_children;
    const isBeingDragged = dragContext.draggedSectionId === section.id;

    // Helper function to calculate drag preview data
    const calculateDragPreview = useCallback((relativeY: number): IHoverPreviewState => {
        const edgeThreshold = 0.50; // 50% from top/bottom edges
        const isNearTopEdge = relativeY <= edgeThreshold;
        const isNearBottomEdge = relativeY >= (1 - edgeThreshold);

        // Get siblings for position calculation - fix the root level filtering
        const siblings = parentId
            ? (allSections.find(s => s.id === parentId)?.children || [])
            : allSections.filter(s => {
                // Find root level sections (sections that are not children of any other section)
                return !allSections.some(parent =>
                    parent.children && parent.children.some(child => child.id === s.id)
                );
            });

        const sortedSiblings = [...siblings].sort((a, b) => a.position - b.position);
        const currentIndex = sortedSiblings.findIndex(s => s.id === section.id);

        if (isNearTopEdge) {
            // Dropping above this section
            const newPosition = currentIndex === 0 ? -1 :
                (sortedSiblings[currentIndex - 1]?.position ?? 0) + 5;
            return {
                isHovering: true,
                targetSectionId: section.id,
                dropType: 'above',
                newParentId: parentId,
                newPosition,
                targetSectionName: section.name
            };
        } else if (isNearBottomEdge) {
            // Dropping below this section
            const newPosition = section.position + 5;
            return {
                isHovering: true,
                targetSectionId: section.id,
                dropType: 'below',
                newParentId: parentId,
                newPosition,
                targetSectionName: section.name
            };
        } else if (hasChildren && canHaveChildren) {
            // Dropping inside this section
            return {
                isHovering: true,
                targetSectionId: section.id,
                dropType: 'inside',
                newParentId: section.id,
                newPosition: -1, // First child
                targetSectionName: section.name
            };
        } else {
            // Default to below
            const newPosition = section.position + 5;
            return {
                isHovering: true,
                targetSectionId: section.id,
                dropType: 'below',
                newParentId: parentId,
                newPosition,
                targetSectionName: section.name
            };
        }
    }, [section, parentId, allSections, hasChildren, canHaveChildren]);

    // Helper function to check if this section is a descendant of the dragged section
    const isDescendantOfDragged = useCallback((): boolean => {
        if (!dragContext.draggedSectionId) return false;

        const findInTree = (sections: IPageSectionWithFields[], targetId: number, currentId: number): boolean => {
            for (const sec of sections) {
                if (sec.id === targetId) {
                    return checkInChildren(sec.children || [], currentId);
                }
                if (sec.children && findInTree(sec.children, targetId, currentId)) {
                    return true;
                }
            }
            return false;
        };

        const checkInChildren = (children: IPageSectionWithFields[], targetId: number): boolean => {
            for (const child of children) {
                if (child.id === targetId) return true;
                if (child.children && checkInChildren(child.children, targetId)) return true;
            }
            return false;
        };

        return findInTree(allSections, dragContext.draggedSectionId, section.id);
    }, [dragContext.draggedSectionId, section.id, allSections]);

    // Mouse event handlers for drag preview (only during drag)
    const handleMouseMove = useCallback((e: React.MouseEvent) => {
        if (!hoverPreviewContext || !dragContext.isDragActive) return;

        const element = elementRef.current;
        if (!element) return;

        const rect = element.getBoundingClientRect();
        const relativeY = (e.clientY - rect.top) / rect.height;
        const dragPreview = calculateDragPreview(relativeY);

        hoverPreviewContext.setHoverState(dragPreview);
    }, [hoverPreviewContext, dragContext.isDragActive, calculateDragPreview]);

    const handleMouseLeave = useCallback(() => {
        if (!hoverPreviewContext || !dragContext.isDragActive) return;

        hoverPreviewContext.setHoverState({
            isHovering: false,
            targetSectionId: null,
            dropType: null,
            newParentId: null,
            newPosition: null,
            targetSectionName: null
        });
    }, [hoverPreviewContext, dragContext.isDragActive]);

    // Setup draggable
    useEffect(() => {
        const element = elementRef.current;
        const dragHandle = dragHandleRef.current;

        if (!element || !dragHandle) return;

        return draggable({
            element: dragHandle,
            getInitialData: () => ({
                type: 'section-item',
                sectionId: section.id,
                sectionName: section.name,
                level,
                parentId,
                index,
                canHaveChildren
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
                        preview.className = styles.dragPreview;
                        preview.textContent = `📄 ${section.name}`;
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
    }, [section, level, parentId, index]);

    // Setup drop targets with improved logic based on requirements
    useEffect(() => {
        const element = elementRef.current;
        if (!element) return;

        return dropTargetForElements({
            element,
            canDrop: ({ source }) => {
                const draggedId = source.data.sectionId as number;

                // Can't drop on itself
                if (draggedId === section.id) return false;

                // Can't drop parent on its own child
                if (isDescendantOfDragged()) return false;

                return source.data.type === 'section-item';
            },
            getData: ({ input, element }) => {
                const rect = element.getBoundingClientRect();
                const relativeY = (input.clientY - rect.top) / rect.height;

                // Use same threshold as hover preview for consistency
                const edgeThreshold = 0.50; // 50% from top/bottom edges
                const isNearTopEdge = relativeY <= edgeThreshold;
                const isNearBottomEdge = relativeY >= (1 - edgeThreshold);

                // If near edges, always treat as edge drop for sibling positioning
                if (isNearTopEdge || isNearBottomEdge) {
                    const data = {
                        type: 'section-drop-target',
                        sectionId: section.id,
                        sectionName: section.name,
                        level,
                        parentId,
                        index,
                        canHaveChildren
                    };

                    return attachClosestEdge(data, {
                        input,
                        element,
                        allowedEdges: ['top', 'bottom']
                    });
                }

                // Allow container drops if section already has children and in center area
                if (hasChildren && canHaveChildren) {
                    return {
                        type: 'container-drop-target',
                        sectionId: section.id,
                        sectionName: section.name,
                        level,
                        parentId,
                        canHaveChildren: true
                    };
                }

                // Default to edge-based positioning for siblings (below)
                const data = {
                    type: 'section-drop-target',
                    sectionId: section.id,
                    sectionName: section.name,
                    level,
                    parentId,
                    index,
                    canHaveChildren
                };

                return attachClosestEdge(data, {
                    input,
                    element,
                    allowedEdges: ['bottom'] // Default to bottom when not in edge zones
                });
            },
            onDragEnter: ({ self }) => {
                if (self.data.type === 'container-drop-target') {
                    setDropState({
                        closestEdge: null,
                        isDropTarget: false,
                        isContainerTarget: true,
                        isDropZoneHover: false
                    });
                } else {
                    const edge = extractClosestEdge(self.data);
                    setDropState({
                        closestEdge: edge,
                        isDropTarget: true,
                        isContainerTarget: false,
                        isDropZoneHover: false
                    });
                }
            },
            onDragLeave: () => {
                setDropState({
                    closestEdge: null,
                    isDropTarget: false,
                    isContainerTarget: false,
                    isDropZoneHover: false
                });
            },
            onDrop: () => {
                setDropState({
                    closestEdge: null,
                    isDropTarget: false,
                    isContainerTarget: false,
                    isDropZoneHover: false
                });
            }
        });
    }, [section, level, parentId, index, isDescendantOfDragged, canHaveChildren, hasChildren]);

    // Setup separate drop target for the drop zone area
    useEffect(() => {
        const dropZoneElement = dropZoneRef.current;
        if (!dropZoneElement || !canHaveChildren || hasChildren) return;

        return dropTargetForElements({
            element: dropZoneElement,
            canDrop: ({ source }) => {
                const draggedId = source.data.sectionId as number;

                // Can't drop on itself
                if (draggedId === section.id) return false;

                // Can't drop parent on its own child
                if (isDescendantOfDragged()) return false;

                return source.data.type === 'section-item';
            },
            getData: () => ({
                type: 'drop-zone-target',
                sectionId: section.id,
                sectionName: section.name,
                level,
                parentId,
                canHaveChildren: true
            }),
            onDragEnter: () => {
                setDropState({
                    closestEdge: null,
                    isDropTarget: false,
                    isContainerTarget: false,
                    isDropZoneHover: true
                });
            },
            onDragLeave: () => {
                setDropState({
                    closestEdge: null,
                    isDropTarget: false,
                    isContainerTarget: false,
                    isDropZoneHover: false
                });
            },
            onDrop: () => {
                setDropState({
                    closestEdge: null,
                    isDropTarget: false,
                    isContainerTarget: false,
                    isDropZoneHover: false
                });
            }
        });
    }, [section, level, parentId, isDescendantOfDragged, canHaveChildren, hasChildren]);

    // Get wrapper classes based on states
    const getWrapperClasses = () => {
        const classes = [styles.sectionItemWrapper];

        if (isDragging) classes.push(styles.isDragging);
        if (dropState.isDropTarget) classes.push(styles.isDropTarget);
        if (dropState.isContainerTarget) classes.push(styles.isContainerDropTarget);
        if (isBeingDragged) classes.push(styles.isBeingDragged);
        if (dragContext.isDragActive && (isBeingDragged || isDescendantOfDragged())) {
            classes.push(styles.isDraggedOrChild);
        }

        return classes.join(' ');
    };

    return (
        <Box
            className={getWrapperClasses()}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
        >
            {/* Top drop indicator - show only when in top 50% threshold */}
            {dropState.closestEdge === 'top' && !dropState.isDropZoneHover && (
                <DropIndicator edge="top" gap="2px" indent={`${level * 12}px`} />
            )}

            {/* Section Component */}
            <PageSection
                ref={elementRef}
                section={section}
                level={level}
                parentId={parentId}
                pageId={pageId}
                expandedSections={expandedSections}
                onToggleExpand={onToggleExpand}
                onRemoveSection={onRemoveSection}
                onAddChildSection={onAddChildSection}
                onAddSiblingAbove={onAddSiblingAbove}
                onAddSiblingBelow={onAddSiblingBelow}
                isDragActive={dragContext.isDragActive}
                overId={dropState.isDropTarget || dropState.isContainerTarget || dropState.isDropZoneHover ? section.id : null}
                draggedSectionId={dragContext.draggedSectionId}
                isDragging={isDragging}
                dragHandleProps={{
                    ref: dragHandleRef,
                    'data-drag-handle': true,
                    className: `${styles.dragHandle} ${isDragging ? styles.isDragging : ''}`
                }}

                showInsideDropZone={dropState.isContainerTarget || dropState.isDropZoneHover}
                onSectionSelect={onSectionSelect}
                selectedSectionId={selectedSectionId}
                focusedSectionId={focusedSectionId}
            />

            {/* Drop zone area for sections that can have children but don't have any */}
            {dragContext.isDragActive && canHaveChildren && !hasChildren && !isBeingDragged && (
                <Box
                    ref={dropZoneRef}
                    className={`${styles.dropZoneArea} ${styles.visible} ${dropState.isDropZoneHover ? styles.active : ''}`}
                >
                    <IconPlus size={16} className={styles.dropZoneIcon} />
                    <Text className={styles.dropZoneText}>
                        Add as first Child
                    </Text>
                </Box>
            )}

            {/* Bottom drop indicator - show only when in bottom 50% threshold */}
            {dropState.closestEdge === 'bottom' && !dropState.isDropZoneHover && (
                <DropIndicator edge="bottom" gap="2px" indent={`${level * 12}px`} />
            )}

            {/* Render children if expanded */}
            {isExpanded && hasChildren && (
                <Box className={`${styles.childrenContainer} ${styles[`level${level}`] || styles.level0}`}>
                    {section.children.map((child, childIndex) => (
                        <SectionItem
                            key={`section-${child.id}-${child.position || childIndex}`}
                            section={child}
                            level={level + 1}
                            index={childIndex}
                            parentId={section.id}
                            allSections={allSections}
                            pageId={pageId}
                            onRemoveSection={onRemoveSection}
                            onAddChildSection={onAddChildSection}
                            onAddSiblingAbove={onAddSiblingAbove}
                            onAddSiblingBelow={onAddSiblingBelow}
                            onSectionSelect={onSectionSelect}
                            selectedSectionId={selectedSectionId}
                            focusedSectionId={focusedSectionId}
                        />
                    ))}
                </Box>
            )}
        </Box>
    );
}, (prevProps, nextProps) => {
    // Custom comparison for memoization
    return (
        prevProps.section.id === nextProps.section.id &&
        prevProps.section.name === nextProps.section.name &&
        prevProps.section.position === nextProps.section.position &&
        prevProps.level === nextProps.level &&
        prevProps.index === nextProps.index &&
        prevProps.parentId === nextProps.parentId &&
        prevProps.selectedSectionId === nextProps.selectedSectionId &&
        prevProps.focusedSectionId === nextProps.focusedSectionId &&
        prevProps.pageId === nextProps.pageId &&
        JSON.stringify(prevProps.section.children) === JSON.stringify(nextProps.section.children)
    );
});

// Context for sections functionality
const SectionsContext = createContext<{
    expandedSections: Set<number>;
    onToggleExpand: (sectionId: number) => void;
} | null>(null);

function useSectionsContext() {
    const context = useContext(SectionsContext);
    if (!context) {
        throw new Error('useSectionsContext must be used within SectionsContext');
    }
    return context;
}

function useHoverPreviewContext() {
    const context = useContext(HoverPreviewContext);
    if (!context) {
        throw new Error('useHoverPreviewContext must be used within HoverPreviewContext');
    }
    return context;
}

// Main sections list component - memoized for performance
const SectionsListComponent = function SectionsList({
    sections,
    expandedSections,
    onToggleExpand,
    onSectionMove,
    onRemoveSection,
    onAddChildSection,
    onAddSiblingAbove,
    onAddSiblingBelow,
    onSectionSelect,
    selectedSectionId,
    focusedSectionId,
    pageId,
}: ISectionsListProps) {

    // Memoize sections to prevent unnecessary re-renders
    const memoizedSections = useMemo(() => sections, [sections]);
    const containerRef = useRef<HTMLDivElement>(null);
    const [dragState, setDragState] = useState<IDragState>({
        isDragActive: false,
        draggedSectionId: null
    });

    const [hoverPreviewState, setHoverPreviewState] = useState<IHoverPreviewState>({
        isHovering: false,
        targetSectionId: null,
        dropType: null,
        newParentId: null,
        newPosition: null,
        targetSectionName: null
    });

    // Helper functions
    const findSectionById = useCallback((id: number, items: IPageSectionWithFields[]): IPageSectionWithFields | null => {
        for (const item of items) {
            if (item.id === id) return item;
            if (item.children) {
                const found = findSectionById(id, item.children);
                if (found) return found;
            }
        }
        return null;
    }, []);

    const getAllDescendantIds = useCallback((section: IPageSectionWithFields): number[] => {
        const ids: number[] = [];
        if (section.children) {
            section.children.forEach(child => {
                ids.push(child.id);
                ids.push(...getAllDescendantIds(child));
            });
        }
        return ids;
    }, []);

    const findParentId = useCallback((sectionId: number, items: IPageSectionWithFields[], parentId: number | null = null): number | null => {
        for (const item of items) {
            if (item.id === sectionId) return parentId;
            if (item.children) {
                const found = findParentId(sectionId, item.children, item.id);
                if (found !== null) return found;
            }
        }
        return null;
    }, []);

    /**
     * Calculates the new position for a dropped section using centralized positioning logic
     */
    const calculateNewPosition = useCallback((
        targetSection: IPageSectionWithFields,
        edge: Edge | null,
        targetParentId: number | null,
        isContainerDrop: boolean = false
    ): { newParentId: number | null; newPosition: number } => {
        if (isContainerDrop) {
            // Dropping into a container - becomes first child
            const result = calculateContainerDropPosition(targetSection.id);
            return {
                newParentId: result.newParentId as number | null,
                newPosition: result.newPosition
            };
        }

        // Get siblings in the target container
        const siblings = targetParentId
            ? (findSectionById(targetParentId, sections)?.children || [])
            : sections;

        const result = calculateDragDropPosition(targetSection, edge, siblings, targetParentId);
        return {
            newParentId: result.newParentId as number | null,
            newPosition: result.newPosition
        };
    }, [sections, findSectionById]);

    // Set up auto-scroll with proper reinitialization
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        return autoScrollForElements({
            element: container,
        });
    }, [sections, expandedSections]); // Re-run when sections or expanded state changes

    // Monitor for drag and drop
    useEffect(() => {
        return monitorForElements({
            canMonitor: ({ source }) => source.data.type === 'section-item',
            onDragStart: ({ source }) => {
                const sectionId = source.data.sectionId as number;

                setDragState({
                    isDragActive: true,
                    draggedSectionId: sectionId
                });
            },
            onDrop: ({ location, source }) => {
                setDragState({
                    isDragActive: false,
                    draggedSectionId: null
                });

                // Clear the preview state when drag ends
                setHoverPreviewState({
                    isHovering: false,
                    targetSectionId: null,
                    dropType: null,
                    newParentId: null,
                    newPosition: null,
                    targetSectionName: null
                });

                if (!location.current.dropTargets.length) {
                    return;
                }

                const draggedSectionId = source.data.sectionId as number;
                const target = location.current.dropTargets[0];
                const targetSectionId = target.data.sectionId as number;

                const draggedSection = findSectionById(draggedSectionId, sections);
                const targetSection = findSectionById(targetSectionId, sections);

                if (!draggedSection || !targetSection) {
                    return;
                }

                const isContainerDrop = target.data.type === 'container-drop-target';
                const isDropZoneDrop = target.data.type === 'drop-zone-target';
                const isAnyContainerDrop = isContainerDrop || isDropZoneDrop;
                const edge = isAnyContainerDrop ? null : extractClosestEdge(target.data);
                const targetParentId = isAnyContainerDrop ? null : (target.data.parentId as number | null);

                const { newParentId, newPosition } = calculateNewPosition(
                    targetSection,
                    edge,
                    targetParentId,
                    isAnyContainerDrop
                );

                // Find the old parent information
                const oldParentId = findParentId(draggedSectionId, sections);
                const oldParentSectionId = oldParentId;

                // Determine if we need to send oldParentPageId
                // Only send it when moving FROM root TO section or FROM section TO root
                // Don't send it when reordering within the same parent (root or section)
                const isMovingFromRootToSection = oldParentId === null && newParentId !== null;
                const isMovingFromSectionToRoot = oldParentId !== null && newParentId === null;
                const isChangingParent = isMovingFromRootToSection || isMovingFromSectionToRoot;

                const oldParentPageId = isChangingParent && oldParentId === null ? pageId : null;

                // Execute the section move with API call
                onSectionMove({
                    draggedSectionId,
                    newParentId,
                    newPosition,
                    pageId,
                    draggedSection,
                    newParent: newParentId ? findSectionById(newParentId, sections) : null,
                    descendantIds: getAllDescendantIds(draggedSection),
                    totalMovingItems: 1 + getAllDescendantIds(draggedSection).length,
                    ...(oldParentPageId && { oldParentPageId }),
                    oldParentSectionId
                });
            },
        });
    }, [sections, findSectionById, getAllDescendantIds, calculateNewPosition, pageId, findParentId]);


    return (
        <DragContext.Provider value={dragState}>
            <HoverPreviewContext.Provider value={{ hoverState: hoverPreviewState, setHoverState: setHoverPreviewState }}>
                <SectionsContext.Provider value={{ expandedSections, onToggleExpand }}>


                    <Box
                        ref={containerRef}
                        data-scroll-container
                        className={styles.sectionsContainer}
                    >
                        {!sections || sections.length === 0 ? (
                            <Paper className={styles.emptyState}>
                                <Text className={styles.emptyStateIcon}>📄</Text>
                                <Text className={styles.emptyStateTitle}>No sections yet</Text>
                                <Text className={styles.emptyStateSubtitle}>
                                    Add your first section to get started
                                </Text>
                            </Paper>
                        ) : (
                            <div className={styles.sectionsList}>
                                {memoizedSections.map((section, index) => (
                                    <SectionItem
                                        key={`section-${section.id}-${section.position || index}`}
                                        section={section}
                                        level={0}
                                        index={index}
                                        parentId={null}
                                        allSections={memoizedSections}
                                        pageId={pageId || 0}
                                        onRemoveSection={onRemoveSection}
                                        onAddChildSection={onAddChildSection}
                                        onAddSiblingAbove={onAddSiblingAbove}
                                        onAddSiblingBelow={onAddSiblingBelow}
                                        onSectionSelect={onSectionSelect}
                                        selectedSectionId={selectedSectionId}
                                        focusedSectionId={focusedSectionId}
                                    />
                                ))}
                            </div>
                        )}
                    </Box>
                </SectionsContext.Provider>
            </HoverPreviewContext.Provider>
        </DragContext.Provider>
    );
};

// Export memoized component
export const SectionsList = memo(SectionsListComponent, (prevProps, nextProps) => {
    return (
        prevProps.sections.length === nextProps.sections.length &&
        prevProps.sections.every((section, index) =>
            section.id === nextProps.sections[index]?.id &&
            section.position === nextProps.sections[index]?.position
        ) &&
        prevProps.selectedSectionId === nextProps.selectedSectionId &&
        prevProps.focusedSectionId === nextProps.focusedSectionId &&
        prevProps.pageId === nextProps.pageId &&
        prevProps.expandedSections.size === nextProps.expandedSections.size &&
        Array.from(prevProps.expandedSections).every(id => nextProps.expandedSections.has(id))
    );
}); 