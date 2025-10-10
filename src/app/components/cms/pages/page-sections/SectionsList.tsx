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
import { IStyleGroup } from '../../../../../types/responses/admin/styles.types';
import { isStyleRelationshipValid, findStyleById } from '../../../../../utils/style-relationship.utils';
import styles from './SectionsList.module.css';

// Types
interface ISectionsListProps {
    sections: IPageSectionWithFields[] | undefined;
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
    styleGroups?: IStyleGroup[];
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
    styleGroups?: IStyleGroup[];
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
    isInvalidDropTarget: boolean;
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
    focusedSectionId,
    styleGroups
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
        isDropZoneHover: false,
        isInvalidDropTarget: false
    });

    // Helper function to check if style relationship is valid for drop
    const isValidDropTarget = useCallback((draggedStyleId: number, targetParentId: number | null): boolean => {
        if (!styleGroups || styleGroups.length === 0) {
            return true; // If no style groups available, allow all drops
        }

        const draggedStyle = findStyleById(draggedStyleId, styleGroups);
        if (!draggedStyle) {
            return true; // If dragged style not found, allow drop
        }

        // If dropping to page level (no parent)
        if (targetParentId === null) {
            // Check if dragged style has parent restrictions
            if (draggedStyle.relationships && draggedStyle.relationships.allowedParents.length > 0) {
                // If dragged style has allowedParents restrictions, don't allow page-level drops
                return false;
            }
            return true; // Allow dropping to page level if no parent restrictions
        }

        // If dropping to another section
        let targetSection;
        let targetStyle;

        // First try to find in allSections (which is now flattened)
        targetSection = allSections.find(s => s.id === targetParentId);

        // If not found in allSections, it might be the current section
        if (!targetSection && targetParentId === section.id) {
            targetSection = section;
        }

        if (!targetSection) {
            return true;
        }

        targetStyle = findStyleById(targetSection.id_styles, styleGroups);
        if (!targetStyle) {
            return true; // If target style not found, allow drop
        }

        // Check if the relationship is valid
        return isStyleRelationshipValid(draggedStyle, targetStyle);
    }, [styleGroups, allSections, section]);

    // Helper function to check if current drag target is invalid (for visual feedback)
    const isCurrentDropTargetInvalid = useCallback((): boolean => {
        if (!dragContext.isDragActive || !dragContext.draggedSectionId) return false;

        const draggedSection = allSections.find(s => s.id === dragContext.draggedSectionId);
        if (!draggedSection) return false;

        const isInvalid = !isValidDropTarget(draggedSection.id_styles, section.id);
        return isInvalid;
    }, [dragContext.isDragActive, dragContext.draggedSectionId, allSections, section.id, isValidDropTarget]);

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
                targetSectionName: section.section_name
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
                targetSectionName: section.section_name
            };
        } else if (hasChildren && canHaveChildren) {
            // Dropping inside this section
            return {
                isHovering: true,
                targetSectionId: section.id,
                dropType: 'inside',
                newParentId: section.id,
                newPosition: -1, // First child
                targetSectionName: section.section_name
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
                targetSectionName: section.section_name
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
                sectionName: section.section_name,
                level,
                parentId,
                index,
                canHaveChildren,
                styleId: section.id_styles,
                styleName: section.style_name
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
                        preview.textContent = `📄 ${section.section_name}`;
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
            canDrop: ({ source, input, element }) => {
                const draggedId = source.data.sectionId as number;
                const draggedStyleId = source.data.styleId as number;

                // Can't drop on itself
                if (draggedId === section.id) return false;

                // Can't drop parent on its own child
                if (isDescendantOfDragged()) return false;

                // Determine drop type based on mouse position (same logic as getData)
                const rect = element.getBoundingClientRect();
                const relativeY = (input.clientY - rect.top) / rect.height;
                const edgeThreshold = 0.50; // 50% from top/bottom edges
                const isNearTopEdge = relativeY <= edgeThreshold;
                const isNearBottomEdge = relativeY >= (1 - edgeThreshold);
                const isNearEdge = isNearTopEdge || isNearBottomEdge;

                let targetParentId: number | null;
                let dropType: string;

                if (isNearEdge) {
                    // Sibling drop - target parent is the parent of current section
                    targetParentId = parentId;
                    dropType = 'sibling';
                } else if (hasChildren && canHaveChildren) {
                    // Container drop - target parent is the current section itself
                    targetParentId = section.id;
                    dropType = 'container';
                } else if (!hasChildren && canHaveChildren) {
                    // Empty container drop - target parent is the current section itself
                    targetParentId = section.id;
                    dropType = 'empty-container';
                } else {
                    // Default to sibling drop
                    targetParentId = parentId;
                    dropType = 'sibling';
                }

                // Check style relationship validity
                if (!isValidDropTarget(draggedStyleId, targetParentId)) {
                    return false;
                }

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
                        sectionName: section.section_name,
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
                        sectionName: section.section_name,
                        level,
                        parentId,
                        canHaveChildren: true
                    };
                }

                // Default to edge-based positioning for siblings (below)
                const data = {
                    type: 'section-drop-target',
                    sectionId: section.id,
                    sectionName: section.section_name,
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
                const isInvalid = isCurrentDropTargetInvalid();
                if (self.data.type === 'container-drop-target') {
                    setDropState({
                        closestEdge: null,
                        isDropTarget: false,
                        isContainerTarget: true,
                        isDropZoneHover: false,
                        isInvalidDropTarget: isInvalid
                    });
                } else {
                    const edge = extractClosestEdge(self.data);
                    setDropState({
                        closestEdge: edge,
                        isDropTarget: true,
                        isContainerTarget: false,
                        isDropZoneHover: false,
                        isInvalidDropTarget: isInvalid
                    });
                }
            },
            onDragLeave: () => {
                setDropState({
                    closestEdge: null,
                    isDropTarget: false,
                    isContainerTarget: false,
                    isDropZoneHover: false,
                    isInvalidDropTarget: false
                });
            },
            onDrop: () => {
                setDropState({
                    closestEdge: null,
                    isDropTarget: false,
                    isContainerTarget: false,
                    isDropZoneHover: false,
                    isInvalidDropTarget: false
                });
            }
        });
    }, [section, level, parentId, index, isDescendantOfDragged, canHaveChildren, hasChildren, isCurrentDropTargetInvalid]);

    // Setup separate drop target for the drop zone area
    useEffect(() => {
        const dropZoneElement = dropZoneRef.current;
        if (!dropZoneElement || !canHaveChildren || hasChildren) return;

        return dropTargetForElements({
            element: dropZoneElement,
            canDrop: ({ source }) => {
                const draggedId = source.data.sectionId as number;
                const draggedStyleId = source.data.styleId as number;

                // Can't drop on itself
                if (draggedId === section.id) return false;

                // Can't drop parent on its own child
                if (isDescendantOfDragged()) return false;

                // For drop zone, this is always a container drop - target parent is the current section
                const targetParentId = section.id;
                const dropType = 'drop-zone';

                // Check style relationship validity
                if (!isValidDropTarget(draggedStyleId, targetParentId)) {
                    return false;
                }

                return source.data.type === 'section-item';
            },
            getData: () => ({
                type: 'drop-zone-target',
                sectionId: section.id,
                sectionName: section.section_name,
                level,
                parentId,
                canHaveChildren: true
            }),
            onDragEnter: () => {
                const isInvalid = isCurrentDropTargetInvalid();
                setDropState({
                    closestEdge: null,
                    isDropTarget: false,
                    isContainerTarget: false,
                    isDropZoneHover: true,
                    isInvalidDropTarget: isInvalid
                });
            },
            onDragLeave: () => {
                setDropState({
                    closestEdge: null,
                    isDropTarget: false,
                    isContainerTarget: false,
                    isDropZoneHover: false,
                    isInvalidDropTarget: false
                });
            },
            onDrop: () => {
                setDropState({
                    closestEdge: null,
                    isDropTarget: false,
                    isContainerTarget: false,
                    isDropZoneHover: false,
                    isInvalidDropTarget: false
                });
            }
        });
    }, [section, level, parentId, isDescendantOfDragged, canHaveChildren, hasChildren, isCurrentDropTargetInvalid]);

    // Get wrapper classes based on states
    const getWrapperClasses = () => {
        const classes = [styles.sectionItemWrapper];

        if (isDragging) classes.push(styles.isDragging);
        if (dropState.isDropTarget) classes.push(styles.isDropTarget);
        if (dropState.isContainerTarget) classes.push(styles.isContainerDropTarget);
        if (dropState.isDropZoneHover) classes.push(styles.isContainerDropTarget); // Show container styling for drop zone hover
        if (dropState.isInvalidDropTarget) classes.push(styles.isInvalidDropTarget);
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
                    className={`${styles.dropZoneArea} ${styles.visible} ${dropState.isDropZoneHover ? (dropState.isInvalidDropTarget ? styles.invalid : styles.active) : ''}`}
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
                            styleGroups={styleGroups}
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
        prevProps.section.section_name === nextProps.section.section_name &&
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
    styleGroups,
}: ISectionsListProps) {

    // Helper function to flatten all sections including nested children
    const flattenSections = useCallback((sections: IPageSectionWithFields[]): IPageSectionWithFields[] => {
        const result: IPageSectionWithFields[] = [];

        const flatten = (items: IPageSectionWithFields[]) => {
            items.forEach(section => {
                result.push(section);
                if (section.children && section.children.length > 0) {
                    flatten(section.children);
                }
            });
        };

        if (sections) {
            flatten(sections);
        }

        return result;
    }, []);

    // Memoize sections to prevent unnecessary re-renders
    const memoizedSections = useMemo(() => {
        return sections;
    }, [sections]);

    // Create flattened version of all sections for validation
    const allFlattenedSections = useMemo(() => {
        return flattenSections(sections || []);
    }, [sections, flattenSections]);
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
            ? (findSectionById(targetParentId, sections || [])?.children || [])
            : (sections || []);

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

                if (!sections) return;

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

                // Determine old parent information based on current location
                let oldParentPageId: number | null = null;
                let oldParentSectionId: number | null = null;

                if (oldParentId === null) {
                    // Section was at page level, send the page ID
                    oldParentPageId = pageId || null;
                } else {
                    // Section was inside another section, send the section ID
                    oldParentSectionId = oldParentId;
                }

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
                    oldParentPageId,
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
                        {sections === undefined || sections === null ? (
                            // Loading state - show nothing until data is loaded
                            null
                        ) : sections.length === 0 ? (
                            <Paper className={styles.emptyState}>
                                <Text className={styles.emptyStateIcon}>📄</Text>
                                <Text className={styles.emptyStateTitle}>No sections yet</Text>
                                <Text className={styles.emptyStateSubtitle}>
                                    Add your first section to get started
                                </Text>
                            </Paper>
                        ) : (
                            <div className={styles.sectionsList}>
                                {memoizedSections?.map((section, index) => (
                                    <SectionItem
                                        key={`section-${section.id}-${section.position || index}`}
                                        section={section}
                                        level={0}
                                        index={index}
                                        parentId={null}
                                        allSections={allFlattenedSections}
                                        pageId={pageId || 0}
                                        onRemoveSection={onRemoveSection}
                                        onAddChildSection={onAddChildSection}
                                        onAddSiblingAbove={onAddSiblingAbove}
                                        onAddSiblingBelow={onAddSiblingBelow}
                                        onSectionSelect={onSectionSelect}
                                        selectedSectionId={selectedSectionId}
                                        focusedSectionId={focusedSectionId}
                                        styleGroups={styleGroups}
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

// Temporarily export without memoization for debugging
export const SectionsList = SectionsListComponent; 