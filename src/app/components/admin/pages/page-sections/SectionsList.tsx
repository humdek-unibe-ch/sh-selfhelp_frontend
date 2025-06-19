'use client';

import {
    useCallback,
    useContext,
    useEffect,
    useRef,
    useState,
    createContext
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

import { IPageField } from '../../../../../types/common/pages.type';
import { PageSection } from './PageSection';
import { isDebugComponentEnabled } from '../../../../../config/debug.config';
import styles from './SectionsList.module.css';

// Types
interface ISectionsListProps {
    sections: IPageField[];
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
    pageKeyword?: string;
    isProcessing?: boolean;
}

interface ISectionItemProps {
    section: IPageField;
    level: number;
    index: number;
    parentId: number | null;
    allSections: IPageField[];
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

// Clean Section Item Component with improved drop detection
function SectionItem({
    section,
    level,
    index,
    parentId,
    allSections,
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
        const edgeThreshold = 0.50; // 25% from top/bottom edges
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

        const findInTree = (sections: IPageField[], targetId: number, currentId: number): boolean => {
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

        const checkInChildren = (children: IPageField[], targetId: number): boolean => {
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
                const edgeThreshold = 0.50; // 25% from top/bottom edges
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
                        canHaveChildren,
                        relativeY, // Add for debugging
                        threshold: edgeThreshold
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
                        canHaveChildren: true,
                        relativeY, // Add for debugging
                        threshold: edgeThreshold
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
                    canHaveChildren,
                    relativeY, // Add for debugging
                    threshold: edgeThreshold
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
            {/* Top drop indicator - hide when drop zone is active */}
            {dropState.closestEdge === 'top' && !dropState.isDropZoneHover && (
                <DropIndicator edge="top" gap="2px" indent={`${level * 12}px`} />
            )}

            {/* Section Component */}
            <PageSection
                ref={elementRef}
                section={section}
                level={level}
                parentId={parentId}
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

            {/* Bottom drop indicator - hide when drop zone is active */}
            {dropState.closestEdge === 'bottom' && !dropState.isDropZoneHover && (
                <DropIndicator edge="bottom" gap="2px" indent={`${level * 12}px`} />
            )}

            {/* Render children if expanded */}
            {isExpanded && hasChildren && (
                <Box className={`${styles.childrenContainer} ${styles[`level${level}`] || styles.level0}`}>
                    {section.children.map((child, childIndex) => (
                        <SectionItem
                            key={child.id}
                            section={child}
                            level={level + 1}
                            index={childIndex}
                            parentId={section.id}
                            allSections={allSections}
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
}

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

// Main sections list component
export function SectionsList({
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
    pageKeyword,
    isProcessing = false
}: ISectionsListProps) {
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
    const findSectionById = useCallback((id: number, items: IPageField[]): IPageField | null => {
        for (const item of items) {
            if (item.id === id) return item;
            if (item.children) {
                const found = findSectionById(id, item.children);
                if (found) return found;
            }
        }
        return null;
    }, []);

    const getAllDescendantIds = useCallback((section: IPageField): number[] => {
        const ids: number[] = [];
        if (section.children) {
            section.children.forEach(child => {
                ids.push(child.id);
                ids.push(...getAllDescendantIds(child));
            });
        }
        return ids;
    }, []);

    const findParentId = useCallback((sectionId: number, items: IPageField[], parentId: number | null = null): number | null => {
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
     * Calculates the new position for a dropped section using simple positioning logic:
     * 
     * Position Logic:
     * - First element: -1
     * - Any other position: previous sibling's position + 5
     * 
     * This ensures we always place the element after the intended sibling.
     */
    const calculateNewPosition = useCallback((
        targetSection: IPageField,
        edge: Edge | null,
        targetParentId: number | null,
        isContainerDrop: boolean = false
    ): { newParentId: number | null; newPosition: number } => {
        if (isContainerDrop) {
            // Dropping into a container - becomes first child
            return {
                newParentId: targetSection.id,
                newPosition: -1
            };
        }

        // Get siblings in the target container
        const siblings = targetParentId
            ? (findSectionById(targetParentId, sections)?.children || [])
            : sections;

        const sortedSiblings = [...siblings].sort((a, b) => a.position - b.position);
        const targetIndex = sortedSiblings.findIndex(s => s.id === targetSection.id);

        if (edge === 'top') {
            if (targetIndex === 0) {
                // Dropping above the first element - becomes new first element
                return {
                    newParentId: targetParentId,
                    newPosition: -1
                };
            }
            // Dropping above target - take position of previous sibling + 5
            const previousSibling = sortedSiblings[targetIndex - 1];
            return {
                newParentId: targetParentId,
                newPosition: previousSibling.position + 5
            };
        } else {
            // Dropping below target - take target's position + 5
            // This ensures we always add AFTER the target section
            return {
                newParentId: targetParentId,
                newPosition: targetSection.position + 5
            };
        }
    }, [sections, findSectionById]);

    // Debug helper function for testing position calculations
    const testPositionCalculation = useCallback(() => {
        if (!isDebugComponentEnabled('dragDropDebug')) return;
        
        console.log('🧪 POSITION CALCULATION TEST:');
        console.log('Simple positioning logic:');
        console.log('- First element: -1');
        console.log('- Any other position: previous sibling position + 5');
        console.log('');
        console.log('Example scenario with normalized positions [0, 10, 20]:');
        console.log('- Drop as 1st: position = -1');
        console.log('- Drop after 1st (pos 0): position = 0 + 5 = 5');
        console.log('- Drop after 2nd (pos 10): position = 10 + 5 = 15');
        console.log('- Drop after 3rd (pos 20): position = 20 + 5 = 25');
        console.log('');
        console.log('Backend will normalize these to maintain 10-unit spacing.');
    }, []);

    // Expose test function to global scope for debugging
    if (typeof window !== 'undefined' && isDebugComponentEnabled('dragDropDebug')) {
        (window as any).testSectionPositions = testPositionCalculation;
    }

    // Set up auto-scroll with better error handling
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        // Check if container is scrollable
        const isScrollable = container.scrollHeight > container.clientHeight ||
            container.scrollWidth > container.clientWidth;

        if (!isScrollable) {
            console.warn('Auto-scroll container may not be scrollable:', {
                scrollHeight: container.scrollHeight,
                clientHeight: container.clientHeight,
                overflowY: getComputedStyle(container).overflowY,
                overflowX: getComputedStyle(container).overflowX
            });
        }

        return autoScrollForElements({
            element: container,
        });
    }, [sections]); // Re-run when sections change

    // Monitor for drag and drop - ONLY console log final position
    useEffect(() => {
        return monitorForElements({
            canMonitor: ({ source }) => source.data.type === 'section-item',
            onDragStart: ({ source }) => {
                const sectionId = source.data.sectionId as number;
                const draggedSection = findSectionById(sectionId, sections);

                if (isDebugComponentEnabled('dragDropDebug')) {
                    console.log('🚀 DRAG STARTED:', {
                        '📄 Section': `${draggedSection?.name} (ID: ${sectionId})`,
                        '📋 Drop Rules': 'Only edges for siblings, container only if target has children'
                    });
                }

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

                // Debug position calculation
                if (isDebugComponentEnabled('dragDropDebug')) {
                    const siblings = newParentId
                        ? (findSectionById(newParentId, sections)?.children || [])
                        : sections;
                    const sortedSiblings = [...siblings].sort((a, b) => a.position - b.position);
                    
                    console.log('📊 THRESHOLD & POSITION DEBUG:', {
                        '🎯 Target Section': `${targetSection.name} (pos: ${targetSection.position})`,
                        '📏 Drop Data': {
                            edge: edge || 'container',
                            relativeY: target.data.relativeY,
                            threshold: target.data.threshold,
                            type: target.data.type
                        },
                        '👥 Current Siblings': sortedSiblings.map(s => `${s.name}(${s.position})`).join(', '),
                        '🆕 Calculated Position': newPosition,
                        '📋 Position Logic': newPosition === -1 ? 'First position (-1)' : 
                                           edge === 'top' ? `Above target (prev sibling + 5 = ${newPosition})` :
                                           `Below target (target position + 5 = ${newPosition})`
                    });
                }

                // Enhanced console log with better formatting (only in debug mode)
                if (isDebugComponentEnabled('dragDropDebug')) {
                    let dropTypeLabel = '📏 Edge Drop';
                    let apiCallType = 'addSectionToPage';
                    
                    if (isContainerDrop) {
                        dropTypeLabel = '📦 Container Drop (inside existing parent)';
                        apiCallType = 'addSectionToSection';
                    } else if (isDropZoneDrop) {
                        dropTypeLabel = '🎯 Drop Zone Drop (first child of empty parent)';
                        apiCallType = 'addSectionToSection';
                    } else {
                        dropTypeLabel = `📏 Edge Drop (${edge})`;
                        apiCallType = newParentId ? 'addSectionToSection' : 'addSectionToPage';
                    }

                    // Find old parent for debug logging
                    const oldParentId = findParentId(draggedSectionId, sections);
                    
                    console.log('🎯 DROP COMPLETED:', {
                        '📄 Dragged Section': `${draggedSection.name} (ID: ${draggedSectionId})`,
                        '🎯 Target Section': `${targetSection.name} (ID: ${targetSectionId})`,
                        '📍 Drop Type': dropTypeLabel,
                        '🏠 Old Parent': oldParentId ? `Section ID: ${oldParentId}` : `Page: "${pageKeyword}"`,
                        '🏠 New Parent': newParentId ? `Section ID: ${newParentId}` : 'Root Level',
                        '📊 New Position': newPosition,
                        '🔄 Will Move': `${1 + getAllDescendantIds(draggedSection).length} item(s)`,
                        '🌐 API Call': `${apiCallType}(${newParentId ? `parentId: ${newParentId}, ` : `pageKeyword: "${pageKeyword}", `}sectionId: ${draggedSectionId}, position: ${newPosition}, oldParent: ${oldParentId ? `sectionId: ${oldParentId}` : `pageId: "${pageKeyword}"`})`
                    });
                }

                // Find the old parent information
                const oldParentId = findParentId(draggedSectionId, sections);
                const oldParentSectionId = oldParentId;

                // Determine if we need to send oldParentPageId
                // Only send it when moving FROM root TO section or FROM section TO root
                // Don't send it when reordering within the same parent (root or section)
                const isMovingFromRootToSection = oldParentId === null && newParentId !== null;
                const isMovingFromSectionToRoot = oldParentId !== null && newParentId === null;
                const isChangingParent = isMovingFromRootToSection || isMovingFromSectionToRoot;
                
                const oldParentPageId = isChangingParent && oldParentId === null ? pageKeyword : null;

                // Execute the section move with API call
                onSectionMove({
                    draggedSectionId,
                    newParentId,
                    newPosition,
                    pageKeyword,
                    draggedSection,
                    newParent: newParentId ? findSectionById(newParentId, sections) : null,
                    descendantIds: getAllDescendantIds(draggedSection),
                    totalMovingItems: 1 + getAllDescendantIds(draggedSection).length,
                    ...(oldParentPageId && { oldParentPageId }),
                    oldParentSectionId      
                });
            },
        });
    }, [sections, findSectionById, getAllDescendantIds, calculateNewPosition, pageKeyword, findParentId]);

    if (isProcessing) {
        return (
            <Box className={styles.processingState}>
                <Text className={styles.processingText}>Processing sections...</Text>
            </Box>
        );
    }

    return (
        <DragContext.Provider value={dragState}>
            <HoverPreviewContext.Provider value={{ hoverState: hoverPreviewState, setHoverState: setHoverPreviewState }}>
                <SectionsContext.Provider value={{ expandedSections, onToggleExpand }}>
                    {/* Drag Preview Display */}
                    {hoverPreviewState.isHovering && dragState.isDragActive && (
                        <Box
                            style={{
                                position: 'fixed',
                                top: '10px',
                                right: '10px',
                                background: 'var(--mantine-color-blue-light)',
                                border: '1px solid var(--mantine-color-blue-6)',
                                borderRadius: '8px',
                                padding: '12px',
                                fontSize: '12px',
                                fontFamily: 'monospace',
                                zIndex: 1000,
                                maxWidth: '300px',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                            }}
                        >
                            <div style={{ fontWeight: 'bold', marginBottom: '8px', color: 'var(--mantine-color-blue-8)' }}>
                                🎯 Drop Preview
                            </div>
                            <div><strong>Target:</strong> {hoverPreviewState.targetSectionName}</div>
                            <div><strong>Action:</strong> Drop {hoverPreviewState.dropType}</div>
                            <div><strong>New Parent:</strong> {hoverPreviewState.newParentId ? `Section ${hoverPreviewState.newParentId}` : 'Root Level'}</div>
                            <div><strong>New Position:</strong> {hoverPreviewState.newPosition}</div>
                            <div style={{ marginTop: '8px', fontSize: '11px', color: 'var(--mantine-color-gray-6)' }}>
                                API: {hoverPreviewState.newParentId ? 'addSectionToSection' : 'addSectionToPage'}
                            </div>
                        </Box>
                    )}

                    <Box
                        ref={containerRef}
                        data-scroll-container
                        className={styles.sectionsContainer}
                    >
                    {sections.length === 0 ? (
                        <Paper className={styles.emptyState}>
                            <Text className={styles.emptyStateIcon}>📄</Text>
                            <Text className={styles.emptyStateTitle}>No sections yet</Text>
                            <Text className={styles.emptyStateSubtitle}>
                                Add your first section to get started
                            </Text>
                        </Paper>
                    ) : (
                        <div className={styles.sectionsList}>
                            {sections.map((section, index) => (
                                <SectionItem
                                    key={section.id}
                                    section={section}
                                    level={0}
                                    index={index}
                                    parentId={null}
                                    allSections={sections}
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
} 