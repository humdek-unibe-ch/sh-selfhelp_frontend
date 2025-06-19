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

                // Allow container drops if section already has children and in center area
                if (hasChildren && canHaveChildren && relativeY >= 0.25 && relativeY <= 0.75) {
                    return {
                        type: 'container-drop-target',
                        sectionId: section.id,
                        sectionName: section.name,
                        level,
                        parentId,
                        canHaveChildren: true
                    };
                }

                // Always allow edge-based positioning for siblings
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
            style={{ position: 'relative' }}
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
                actionMenuRef={actionMenuRef}
                customStyle={{}}
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

                // Enhanced console log with better formatting (only in debug mode)
                if (isDebugComponentEnabled('dragDropDebug')) {
                    let dropTypeLabel = '📏 Edge Drop';
                    if (isContainerDrop) {
                        dropTypeLabel = '📦 Container Drop (inside existing parent)';
                    } else if (isDropZoneDrop) {
                        dropTypeLabel = '🎯 Drop Zone Drop (first child of empty parent)';
                    } else {
                        dropTypeLabel = `📏 Edge Drop (${edge})`;
                    }

                    console.log('🎯 DROP COMPLETED:', {
                        '📄 Dragged Section': `${draggedSection.name} (ID: ${draggedSectionId})`,
                        '🎯 Target Section': `${targetSection.name} (ID: ${targetSectionId})`,
                        '📍 Drop Type': dropTypeLabel,
                        '🏠 New Parent': newParentId ? `ID: ${newParentId}` : 'Root Level',
                        '📊 New Position': newPosition,
                        '🔄 Would Move': `${1 + getAllDescendantIds(draggedSection).length} item(s)`
                    });
                }

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