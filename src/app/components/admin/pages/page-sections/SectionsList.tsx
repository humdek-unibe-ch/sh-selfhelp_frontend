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

import { IPageField } from '../../../../../types/common/pages.type';
import { PageSection } from './PageSection';
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
}

// Context for drag state
const DragContext = createContext<IDragState>({
    isDragActive: false,
    draggedSectionId: null
});

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
    const elementRef = useRef<HTMLDivElement>(null);
    const dragHandleRef = useRef<HTMLDivElement>(null);
    const actionMenuRef = useRef<HTMLButtonElement>(null);
    
    const [isDragging, setIsDragging] = useState(false);
    const [dropState, setDropState] = useState<IDropState>({
        closestEdge: null,
        isDropTarget: false,
        isContainerTarget: false
    });

    const { expandedSections, onToggleExpand } = useSectionsContext();
    const isExpanded = expandedSections.has(section.id);
    const hasChildren = section.children && section.children.length > 0;
    const canHaveChildren = !!section.can_have_children;
    const isBeingDragged = dragContext.draggedSectionId === section.id;

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
                        preview.style.cssText = `
                            background: white;
                            border: 2px solid var(--mantine-color-green-4);
                            border-radius: 6px;
                            padding: 8px 12px;
                            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                            font-size: 13px;
                            font-weight: 500;
                            color: var(--mantine-color-gray-9);
                            max-width: 200px;
                            white-space: nowrap;
                            overflow: hidden;
                            text-overflow: ellipsis;
                        `;
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

    // Setup drop targets with improved edge detection for easier sibling drops
    useEffect(() => {
        const element = elementRef.current;
        if (!element) return;

        // Single drop target that handles both edge and container drops
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
                
                // If this section can have children and we're in the center zone (30%-70%)
                if (canHaveChildren && relativeY >= 0.3 && relativeY <= 0.7) {
                    return {
                        type: 'container-drop-target',
                        sectionId: section.id,
                        sectionName: section.name,
                        level,
                        parentId,
                        canHaveChildren: true
                    };
                }
                
                // Otherwise, use edge-based positioning
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
            },
            onDragEnter: ({ self }) => {
                if (self.data.type === 'container-drop-target') {
                    setDropState({
                        closestEdge: null,
                        isDropTarget: false,
                        isContainerTarget: true
                    });
                } else {
                    const edge = extractClosestEdge(self.data);
                    setDropState({
                        closestEdge: edge,
                        isDropTarget: true,
                        isContainerTarget: false
                    });
                }
            },
            onDragLeave: () => {
                setDropState({
                    closestEdge: null,
                    isDropTarget: false,
                    isContainerTarget: false
                });
            },
            onDrop: () => {
                setDropState({
                    closestEdge: null,
                    isDropTarget: false,
                    isContainerTarget: false
                });
            }
        });
    }, [section, level, parentId, index, isDescendantOfDragged, canHaveChildren]);

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
        >
            {/* Top drop indicator - Green line for sibling drops */}
            {dropState.closestEdge === 'top' && (
                <Box className={`${styles.dropIndicatorWrapper} ${styles.top}`}>
                    <Box className={styles.dropIndicatorLine} />
                    <Box className={styles.dropIndicatorDot} />
                </Box>
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
                overId={dropState.isDropTarget || dropState.isContainerTarget ? section.id : null}
                draggedSectionId={dragContext.draggedSectionId}
                isDragging={isDragging}
                dragHandleProps={{
                    ref: dragHandleRef,
                    'data-drag-handle': true,
                    className: `${styles.dragHandle} ${isDragging ? styles.isDragging : ''}`
                }}
                actionMenuRef={actionMenuRef}
                customStyle={{}}
                showInsideDropZone={dropState.isContainerTarget}
                onSectionSelect={onSectionSelect}
                selectedSectionId={selectedSectionId}
                focusedSectionId={focusedSectionId}
            />

            {/* Bottom drop indicator - Green line for sibling drops */}
            {dropState.closestEdge === 'bottom' && (
                <Box className={`${styles.dropIndicatorWrapper} ${styles.bottom}`}>
                    <Box className={styles.dropIndicatorLine} />
                    <Box className={styles.dropIndicatorDot} />
                </Box>
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
                newPosition: 0
            };
        }

        // Edge-based positioning
        const siblings = targetParentId 
            ? (findSectionById(targetParentId, sections)?.children || [])
            : sections;
        
        const sortedSiblings = [...siblings].sort((a, b) => a.position - b.position);
        const targetIndex = sortedSiblings.findIndex(s => s.id === targetSection.id);
        
        if (edge === 'top') {
            if (targetIndex === 0) {
                return {
                    newParentId: targetParentId,
                    newPosition: Math.max(0, targetSection.position - 10)
                };
            }
            const prevPosition = sortedSiblings[targetIndex - 1]?.position || 0;
            const currentPosition = targetSection.position;
            return {
                newParentId: targetParentId,
                newPosition: Math.floor((prevPosition + currentPosition) / 2)
            };
        } else {
            if (targetIndex === sortedSiblings.length - 1) {
                return {
                    newParentId: targetParentId,
                    newPosition: targetSection.position + 10
                };
            }
            const currentPosition = targetSection.position;
            const nextPosition = sortedSiblings[targetIndex + 1]?.position || currentPosition + 20;
            return {
                newParentId: targetParentId,
                newPosition: Math.floor((currentPosition + nextPosition) / 2)
            };
        }
    }, [sections, findSectionById]);

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
                const edge = isContainerDrop ? null : extractClosestEdge(target.data);
                const targetParentId = isContainerDrop ? null : (target.data.parentId as number | null);

                const { newParentId, newPosition } = calculateNewPosition(
                    targetSection,
                    edge,
                    targetParentId,
                    isContainerDrop
                );
                
                // ONLY console log the final position
                console.log('📋 FINAL DROP POSITION:', {
                    draggedSectionId,
                    newParentId,
                    newPosition,
                    edge,
                    targetSectionId,
                    dropType: isContainerDrop ? 'container' : 'edge'
                });

                // TODO: Uncomment when ready to enable API calls
                // onSectionMove({
                //     draggedSectionId,
                //     newParentId,
                //     newPosition,
                //     pageKeyword,
                //     draggedSection,
                //     newParent: newParentId ? findSectionById(newParentId, sections) : null,
                //     descendantIds: getAllDescendantIds(draggedSection),
                //     totalMovingItems: 1 + getAllDescendantIds(draggedSection).length,
                //     dropType: isContainerDrop ? 'container' : 'edge',
                //     edge
                // });
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
            <SectionsContext.Provider value={{ expandedSections, onToggleExpand }}>
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
        </DragContext.Provider>
    );
} 