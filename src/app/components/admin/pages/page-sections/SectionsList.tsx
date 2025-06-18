'use client';

import { 
    useCallback, 
    useContext, 
    useEffect, 
    useMemo, 
    useReducer, 
    useRef, 
    useState, 
    createContext 
} from 'react';
import { Stack, Box, Text, Group, Paper } from '@mantine/core';
import memoizeOne from 'memoize-one';
import invariant from 'tiny-invariant';

import { triggerPostMoveFlash } from '@atlaskit/pragmatic-drag-and-drop-flourish/trigger-post-move-flash';
import { type Instruction } from '@atlaskit/pragmatic-drag-and-drop-hitbox/list-item';
import * as liveRegion from '@atlaskit/pragmatic-drag-and-drop-live-region';
import { DropIndicator } from '@atlaskit/pragmatic-drag-and-drop-react-drop-indicator/box';
import { combine } from '@atlaskit/pragmatic-drag-and-drop/combine';
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
import { getReorderDestinationIndex } from '@atlaskit/pragmatic-drag-and-drop-hitbox/util/get-reorder-destination-index';
import { autoScrollForElements } from '@atlaskit/pragmatic-drag-and-drop-auto-scroll/element';
import { pointerOutsideOfPreview } from '@atlaskit/pragmatic-drag-and-drop/element/pointer-outside-of-preview';
import { setCustomNativeDragPreview } from '@atlaskit/pragmatic-drag-and-drop/element/set-custom-native-drag-preview';

import { IPageField } from '../../../../../types/common/pages.type';
import { PageSection } from './PageSection';
import styles from './PageSections.module.css';

// Types for tree management
interface ISectionsTreeState {
    data: IPageField[];
    lastAction: ITreeAction | null;
}

interface ITreeAction {
    type: 'instruction' | 'modal-move';
    itemId: string;
    targetId: string;
    index: number;
    instruction?: Instruction;
}

interface ISectionsTreeContext {
    dispatch: (action: ITreeAction) => void;
    uniqueContextId: symbol;
    getPathToItem: (targetId: string) => IPageField[];
    getMoveTargets: (args: { itemId: string }) => IPageField[];
    getChildrenOfItem: (itemId: string) => IPageField[];
    expandedSections: Set<number>;
    onToggleExpand: (sectionId: number) => void;
    registerTreeItem: (args: {
        itemId: string;
        element: HTMLElement;
        actionMenuTrigger: HTMLElement;
    }) => () => void;
    isDragActive: boolean;
    draggedSectionId: number | null;
}

interface ISectionsListProps {
    sections: IPageField[];
    expandedSections: Set<number>;
    onToggleExpand: (sectionId: number) => void;
    onSectionMove: (moveData: any) => void;
    onRemoveSection: (sectionId: number, parentId: number | null) => void;
    onAddChildSection?: (parentSectionId: number) => void;
    onAddSiblingAbove?: (referenceSectionId: number, parentId: number | null) => void;
    onAddSiblingBelow?: (referenceSectionId: number, parentId: number | null) => void;
    pageKeyword?: string;
    isProcessing?: boolean;
}

// Context for tree functionality
const SectionsTreeContext = createContext<ISectionsTreeContext | null>(null);

// Tree reducer for state management
function sectionsTreeReducer(
    state: ISectionsTreeState,
    action: ITreeAction
): ISectionsTreeState {
    if (action.type === 'instruction') {
        return {
            ...state,
            lastAction: action
        };
    }
    
    return state;
}

function getInitialTreeState(sections: IPageField[]): ISectionsTreeState {
    return {
        data: sections,
        lastAction: null
    };
}

// Tree item registry for managing references
function createTreeItemRegistry() {
    const registry = new Map<string, { 
        element: HTMLElement; 
        actionMenuTrigger: HTMLElement 
    }>();

    const registerTreeItem = ({
        itemId,
        element,
        actionMenuTrigger,
    }: {
        itemId: string;
        element: HTMLElement;
        actionMenuTrigger: HTMLElement;
    }) => {
        registry.set(itemId, { element, actionMenuTrigger });
        return () => {
            registry.delete(itemId);
        };
    };

    return { registry, registerTreeItem };
}

// Enhanced Section Item Component with proper drop indicators
interface ISectionItemProps {
    section: IPageField;
    level: number;
    index: number;
    parentId: number | null;
    onRemoveSection: (sectionId: number, parentId: number | null) => void;
    onAddChildSection?: (parentSectionId: number) => void;
    onAddSiblingAbove?: (referenceSectionId: number, parentId: number | null) => void;
    onAddSiblingBelow?: (referenceSectionId: number, parentId: number | null) => void;
}

function SectionItem({ 
    section, 
    level, 
    index,
    parentId,
    onRemoveSection,
    onAddChildSection,
    onAddSiblingAbove,
    onAddSiblingBelow
}: ISectionItemProps) {
    const context = useContext(SectionsTreeContext);
    const elementRef = useRef<HTMLDivElement>(null);
    const dragHandleRef = useRef<HTMLDivElement>(null);
    const actionMenuRef = useRef<HTMLButtonElement>(null);
    
    const [isDragging, setIsDragging] = useState(false);
    const [dragState, setDragState] = useState<'idle' | 'preview' | 'is-dragging'>('idle');
    const [closestEdge, setClosestEdge] = useState<Edge | null>(null);
    const [isDropTarget, setIsDropTarget] = useState(false);
    const [isContainerDropTarget, setIsContainerDropTarget] = useState(false);

    invariant(context);
    const { 
        expandedSections, 
        onToggleExpand, 
        registerTreeItem, 
        uniqueContextId,
        isDragActive,
        draggedSectionId
    } = context;

    const isExpanded = expandedSections.has(section.id);
    const hasChildren = section.children && section.children.length > 0;
    const canHaveChildren = !!section.can_have_children;
    const isBeingDragged = draggedSectionId === section.id;

    // Helper function to check if this section is being dragged or is a child of dragged section
    const isBeingDraggedOrChild = (): boolean => {
        if (!draggedSectionId) return false;
        if (section.id === draggedSectionId) return true;
        return isDescendantOf(draggedSectionId, section.id);
    };

    // Helper function to check if a section is descendant of another (memoized for stability)
    const isDescendantOf = useCallback((ancestorId: number, descendantId: number): boolean => {
        const findInChildren = (children: IPageField[]): boolean => {
            return children.some(child => {
                if (child.id === descendantId) return true;
                if (child.children) return findInChildren(child.children);
                return false;
            });
        };
        
        // Find the ancestor section and check if descendant is in its tree
        const findAncestor = (sections: IPageField[]): IPageField | null => {
            for (const section of sections) {
                if (section.id === ancestorId) return section;
                if (section.children) {
                    const found = findAncestor(section.children);
                    if (found) return found;
                }
            }
            return null;
        };
        
        const ancestor = findAncestor(context.getChildrenOfItem(''));
        return ancestor ? findInChildren(ancestor.children || []) : false;
    }, [context]);

    // Register tree item
    useEffect(() => {
        if (!elementRef.current || !actionMenuRef.current) return;
        
        return registerTreeItem({
            itemId: section.id.toString(),
            element: elementRef.current,
            actionMenuTrigger: actionMenuRef.current
        });
    }, [section.id, registerTreeItem]);

    // Memoize stable values to prevent unnecessary re-registrations
    const stableData = useMemo(() => ({
        sectionId: section.id,
        sectionName: section.name,
        level,
        canHaveChildren,
        parentId,
        hasChildren,
        index
    }), [section.id, section.name, level, canHaveChildren, parentId, hasChildren, index]);

    // Setup draggable with enhanced preview and feedback
    useEffect(() => {
        const element = elementRef.current;
        const dragHandle = dragHandleRef.current;
        
        if (!element || !dragHandle) return;

        const cleanupFunctions = [
            draggable({
                element: element, // Use the main element for dragging
                dragHandle: dragHandle, // But use the handle for initiation
                getInitialData: () => ({
                    type: 'section-item',
                    itemId: stableData.sectionId.toString(),
                    uniqueContextId,
                    level: stableData.level,
                    canHaveChildren: stableData.canHaveChildren,
                    parentId: stableData.parentId?.toString() || null,
                    sectionName: stableData.sectionName,
                    index: stableData.index
                }),
                onGenerateDragPreview: ({ nativeSetDragImage }) => {
                    setDragState('preview');
                    
                    // Create custom drag preview
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
                                border: 2px solid var(--mantine-color-blue-4);
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
                            preview.textContent = `📄 ${stableData.sectionName}`;
                            container.appendChild(preview);
                        },
                    });
                    return () => {};
                },
                onDragStart: () => {
                    setDragState('is-dragging');
                    setIsDragging(true);
                },
                onDrop: () => {
                    setDragState('idle');
                    setIsDragging(false);
                }
            }),
            // Main drop target for edge positioning
            dropTargetForElements({
                element,
                canDrop: ({ source }) => {
                    const draggedId = source.data.itemId as string;
                    
                    // Can't drop on itself
                    if (draggedId === stableData.sectionId.toString()) return false;
                    
                    // Can't drop parent on its own child (prevent circular reference)
                    if (isDescendantOf(parseInt(draggedId), stableData.sectionId)) return false;
                    
                    return (
                        source.data.uniqueContextId === uniqueContextId &&
                        source.data.type === 'section-item'
                    );
                },
                getIsSticky: () => true,
                getData: ({ input, element }) => {
                    const data = {
                        type: 'section-item',
                        itemId: stableData.sectionId.toString(),
                        level: stableData.level,
                        canHaveChildren: stableData.canHaveChildren,
                        parentId: stableData.parentId?.toString() || null,
                        index: stableData.index,
                        hasChildren: stableData.hasChildren
                    };

                    // Always allow top/bottom positioning
                    return attachClosestEdge(data, {
                        input,
                        element,
                        allowedEdges: ['top', 'bottom']
                    });
                },
                onDragEnter: ({ self, source }) => {
                    const edge = extractClosestEdge(self.data);
                    setClosestEdge(edge);
                    setIsDropTarget(true);
                    
                    // Announce to screen readers
                    const draggedName = source.data.sectionName as string;
                    const targetName = stableData.sectionName;
                    const position = edge === 'top' ? 'above' : 'below';
                    liveRegion.announce(`Moving ${draggedName} ${position} ${targetName}`);
                },
                onDragLeave: () => {
                    setClosestEdge(null);
                    setIsDropTarget(false);
                },
                onDrop: () => {
                    setClosestEdge(null);
                    setIsDropTarget(false);
                }
            })
        ];

        // Add container drop target if applicable
        if (stableData.canHaveChildren && !stableData.hasChildren) {
            cleanupFunctions.push(
                dropTargetForElements({
                    element,
                    canDrop: ({ source }) => {
                        const draggedId = source.data.itemId as string;
                        
                        // Can't drop on itself
                        if (draggedId === stableData.sectionId.toString()) return false;
                        
                        // Can't drop parent on its own child
                        if (isDescendantOf(parseInt(draggedId), stableData.sectionId)) return false;
                        
                        return (
                            source.data.uniqueContextId === uniqueContextId &&
                            source.data.type === 'section-item'
                        );
                    },
                    getData: () => ({
                        type: 'container-drop',
                        itemId: stableData.sectionId.toString(),
                        canHaveChildren: true,
                        parentId: stableData.parentId?.toString() || null
                    }),
                    onDragEnter: ({ source }) => {
                        setIsContainerDropTarget(true);
                        
                        const draggedName = source.data.sectionName as string;
                        liveRegion.announce(`Moving ${draggedName} into ${stableData.sectionName} container`);
                    },
                    onDragLeave: () => {
                        setIsContainerDropTarget(false);
                    },
                    onDrop: () => {
                        setIsContainerDropTarget(false);
                    }
                })
            );
        }

        return combine(...cleanupFunctions);
    }, [stableData, uniqueContextId, isDescendantOf]);

    // Get background color based on drop state
    const getBackgroundColor = () => {
        if (isBeingDragged) {
            return 'var(--mantine-color-blue-0)';
        }
        if ((isDropTarget || isContainerDropTarget) && isDragActive) {
            return isContainerDropTarget ? 'var(--mantine-color-green-0)' : 'var(--mantine-color-blue-0)';
        }
        return 'white';
    };

    // Get border color based on drop state
    const getBorderColor = () => {
        if (isBeingDragged) {
            return 'var(--mantine-color-blue-4)';
        }
        if ((isDropTarget || isContainerDropTarget) && isDragActive) {
            return isContainerDropTarget ? 'var(--mantine-color-green-4)' : 'var(--mantine-color-blue-4)';
        }
        return 'var(--mantine-color-gray-3)';
    };

    return (
        <Box
            style={{
                marginLeft: level > 0 ? `${level * 24}px` : 0,
                position: 'relative'
            }}
        >
            {/* Enhanced Drop indicator for top edge */}
            {closestEdge === 'top' && (
                <Box style={{ 
                    position: 'relative', 
                    marginBottom: '8px',
                    height: '2px'
                }}>
                    <DropIndicator edge="top" gap="8px" />
                    <Box
                        style={{
                            position: 'absolute',
                            top: '-1px',
                            left: '-4px',
                            right: '0',
                            height: '2px',
                            backgroundColor: 'var(--mantine-color-blue-6)',
                            borderRadius: '1px',
                            boxShadow: '0 0 8px var(--mantine-color-blue-4)',
                            zIndex: 10
                        }}
                    />
                    {/* Terminal dot */}
                    <Box
                        style={{
                            position: 'absolute',
                            top: '-4px',
                            left: '-8px',
                            width: '8px',
                            height: '8px',
                            backgroundColor: 'var(--mantine-color-blue-6)',
                            borderRadius: '50%',
                            boxShadow: '0 0 4px var(--mantine-color-blue-4)',
                            zIndex: 11
                        }}
                    />
                </Box>
            )}
            
            {/* Modern CMS-style Section Component with enhanced feedback */}
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
                isDragActive={isDragActive}
                overId={isDropTarget || isContainerDropTarget ? section.id : null}
                draggedSectionId={draggedSectionId}
                isDragging={isDragging}
                dragHandleProps={{
                    ref: dragHandleRef,
                    'data-drag-handle': true,
                    style: { 
                        cursor: isDragging ? 'grabbing' : 'grab'
                    }
                }}
                actionMenuRef={actionMenuRef}
                customStyle={{
                    backgroundColor: getBackgroundColor(),
                    borderColor: getBorderColor(),
                    borderWidth: isBeingDragged || isDropTarget || isContainerDropTarget ? '2px' : '1px',
                    borderStyle: isBeingDragged ? 'dashed' : 'solid',
                    opacity: isDragging || (isDragActive && isBeingDraggedOrChild()) ? 0.4 : 1,
                    transition: 'all 0.2s cubic-bezier(0.15, 1.0, 0.3, 1.0)',
                    transform: isDragging ? 'scale(0.98)' : 'scale(1)',
                    filter: isDragActive && isBeingDraggedOrChild() ? 'grayscale(0.3)' : 'none'
                }}
                showInsideDropZone={false}
            />

            {/* Enhanced Drop indicator for bottom edge */}
            {closestEdge === 'bottom' && (
                <Box style={{ 
                    position: 'relative', 
                    marginTop: '8px',
                    height: '2px'
                }}>
                    <DropIndicator edge="bottom" gap="8px" />
                    <Box
                        style={{
                            position: 'absolute',
                            bottom: '-1px',
                            left: '-4px',
                            right: '0',
                            height: '2px',
                            backgroundColor: 'var(--mantine-color-blue-6)',
                            borderRadius: '1px',
                            boxShadow: '0 0 8px var(--mantine-color-blue-4)',
                            zIndex: 10
                        }}
                    />
                    {/* Terminal dot */}
                    <Box
                        style={{
                            position: 'absolute',
                            bottom: '-4px',
                            left: '-8px',
                            width: '8px',
                            height: '8px',
                            backgroundColor: 'var(--mantine-color-blue-6)',
                            borderRadius: '50%',
                            boxShadow: '0 0 4px var(--mantine-color-blue-4)',
                            zIndex: 11
                        }}
                    />
                </Box>
            )}

            {/* Render children if expanded with compact indentation */}
            {isExpanded && hasChildren && (
                <Box style={{ marginTop: '2px' }}>
                    {section.children.map((child, childIndex) => (
                        <SectionItem
                            key={child.id}
                            section={child}
                            level={level + 1}
                            index={childIndex}
                            parentId={section.id}
                            onRemoveSection={onRemoveSection}
                            onAddChildSection={onAddChildSection}
                            onAddSiblingAbove={onAddSiblingAbove}
                            onAddSiblingBelow={onAddSiblingBelow}
                        />
                    ))}
                </Box>
            )}
        </Box>
    );
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
    pageKeyword,
    isProcessing = false
}: ISectionsListProps) {
    const [state, dispatch] = useReducer(sectionsTreeReducer, sections, getInitialTreeState);
    const containerRef = useRef<HTMLDivElement>(null);
    const [{ registry, registerTreeItem }] = useState(createTreeItemRegistry);
    const [isDragActive, setIsDragActive] = useState(false);
    const [draggedSectionId, setDraggedSectionId] = useState<number | null>(null);

    const { data, lastAction } = state;
    const lastStateRef = useRef<IPageField[]>(data);
    
    useEffect(() => {
        lastStateRef.current = sections; // Use live sections data
    }, [sections]);

    // Handle post-move effects with enhanced flash
    useEffect(() => {
        if (lastAction === null) return;

        setTimeout(() => {
            if (lastAction.type === 'modal-move') {
                const parentName = lastAction.targetId === '' ? 'the page' : `Section ${lastAction.targetId}`;

                liveRegion.announce(
                    `You've moved Section ${lastAction.itemId} to position ${
                        lastAction.index + 1
                    } in ${parentName}.`,
                );

                const { element, actionMenuTrigger } = registry.get(lastAction.itemId) ?? {};
                if (element) {
                    triggerPostMoveFlash(element);
                }

                actionMenuTrigger?.focus();
                return;
            }

            if (lastAction.type === 'instruction') {
                const { element } = registry.get(lastAction.itemId) ?? {};
                if (element) {
                    triggerPostMoveFlash(element);
                }
                return;
            }
        }, 100); // Slight delay for better visual feedback
    }, [lastAction, registry]);

    // Cleanup live region
    useEffect(() => {
        return () => {
            liveRegion.cleanup();
        };
    }, []);

    // Get move targets for a section
    const getMoveTargets = useCallback(({ itemId }: { itemId: string }) => {
        const data = lastStateRef.current;
        const targets: IPageField[] = [];

        const searchStack = Array.from(data);
        while (searchStack.length > 0) {
            const node = searchStack.pop();
            if (!node) continue;

            // Skip the item being moved and its descendants
            if (node.id.toString() === itemId) continue;

            // Only sections that can have children are valid targets
            if (node.can_have_children) {
                targets.push(node);
            }

            // Add children to search stack
            if (node.children) {
                node.children.forEach((child) => searchStack.push(child));
            }
        }

        return targets;
    }, []);

    // Get children of a section
    const getChildrenOfItem = useCallback((itemId: string) => {
        const data = lastStateRef.current;

        if (itemId === '') {
            return data; // Root level
        }

        const findItem = (items: IPageField[], targetId: string): IPageField | null => {
            for (const item of items) {
                if (item.id.toString() === targetId) return item;
                if (item.children) {
                    const found = findItem(item.children, targetId);
                    if (found) return found;
                }
            }
            return null;
        };

        const item = findItem(data, itemId);
        return item?.children || [];
    }, []);

    // Get path to item (memoized)
    const getPathToItem = useMemo(() => 
        memoizeOne((targetId: string) => {
            const findPath = (items: IPageField[], targetId: string, path: IPageField[] = []): IPageField[] | null => {
                for (const item of items) {
                    const currentPath = [...path, item];
                    if (item.id.toString() === targetId) {
                        return currentPath;
                    }
                    if (item.children) {
                        const found = findPath(item.children, targetId, currentPath);
                        if (found) return found;
                    }
                }
                return null;
            };
            return findPath(sections, targetId) || [];
        })
    , [sections]);

    // Context value with drag state
    const contextValue = useMemo<ISectionsTreeContext>(() => ({
        dispatch,
        uniqueContextId: Symbol('sections-tree'),
        getPathToItem,
        getMoveTargets,
        getChildrenOfItem,
        expandedSections,
        onToggleExpand,
        registerTreeItem,
        isDragActive,
        draggedSectionId,
    }), [
        getChildrenOfItem, 
        getMoveTargets, 
        registerTreeItem, 
        expandedSections, 
        onToggleExpand, 
        getPathToItem,
        isDragActive,
        draggedSectionId
    ]);

    // Enhanced position calculation with reorder utilities
    const calculateNewPosition = (targetSection: IPageField | null, edge: Edge | null, targetParentId: number | null): number => {
        // Get siblings at the target level
        const siblings = targetParentId 
            ? (findSectionById(targetParentId, sections)?.children || [])
            : sections;
        
        const sortedSiblings = [...siblings].sort((a, b) => a.position - b.position);
        
        if (!targetSection) {
            // Dropping at the end
            if (sortedSiblings.length === 0) return 0; // First item
            const lastPosition = sortedSiblings[sortedSiblings.length - 1].position;
            return lastPosition + 10;
        }
        
        const targetIndex = sortedSiblings.findIndex(s => s.id === targetSection.id);
        
        // Note: 'inside' edge is not supported in this implementation
        
        if (edge === 'top') {
            // Use reorder utility for better positioning
            const destinationIndex = Math.max(0, targetIndex);
            return destinationIndex * 10;
        } else {
            // Bottom edge
            const destinationIndex = targetIndex + 1;
            return destinationIndex * 10;
        }
    };

    // Set up auto-scroll for the container
    useEffect(() => {
        if (!containerRef.current) return;

        return autoScrollForElements({
            element: containerRef.current,
        });
    }, []);

    // Monitor for drag and drop with enhanced feedback
    useEffect(() => {
        if (!containerRef.current) return;

        return monitorForElements({
            canMonitor: ({ source }) =>
                source.data.uniqueContextId === contextValue.uniqueContextId &&
                source.data.type === 'section-item',
            onDragStart: ({ source }) => {
                setIsDragActive(true);
                setDraggedSectionId(parseInt(source.data.itemId as string));
                
                // Announce drag start
                const sectionName = source.data.sectionName as string;
                liveRegion.announce(`Started dragging ${sectionName}`);
            },
            onDrop(args) {
                const { location, source } = args;
                
                setIsDragActive(false);
                setDraggedSectionId(null);
                
                if (!location.current.dropTargets.length) {
                    liveRegion.announce('Drop cancelled');
                    return;
                }

                const itemId = source.data.itemId as string;
                const target = location.current.dropTargets[0];
                const targetId = target.data.itemId as string;
                
                // Handle the drop with proper positioning
                const draggedSection = findSectionById(parseInt(itemId), sections);
                const targetSection = findSectionById(parseInt(targetId), sections);

                if (draggedSection && onSectionMove) {
                    let moveData;
                    let announcement = '';

                    // Check if this is a container drop
                    if (target.data.type === 'container-drop') {
                        // Dropping into an empty container
                        moveData = {
                            draggedSectionId: parseInt(itemId),
                            newParentId: parseInt(targetId),
                            pageKeyword,
                            newPosition: 0, // First child
                            draggedSection,
                            newParent: targetSection,
                            descendantIds: getAllDescendantIds(draggedSection),
                            totalMovingItems: 1 + getAllDescendantIds(draggedSection).length,
                            edge: null
                        };
                        
                        announcement = `Moved ${draggedSection.name} into ${targetSection?.name} container`;
                    } else {
                        // Regular edge drop
                        const edge = extractClosestEdge(target.data);
                        const targetParentId = target.data.parentId ? parseInt(target.data.parentId as string) : null;
                        const newPosition = calculateNewPosition(targetSection, edge, targetParentId);
                        
                        moveData = {
                            draggedSectionId: parseInt(itemId),
                            newParentId: targetParentId,
                            pageKeyword,
                            newPosition,
                            draggedSection,
                            newParent: targetParentId ? findSectionById(targetParentId, sections) : null,
                            descendantIds: getAllDescendantIds(draggedSection),
                            totalMovingItems: 1 + getAllDescendantIds(draggedSection).length,
                            edge
                        };
                        
                        const targetName = targetSection?.name || 'page';
                        const position = edge === 'top' ? 'above' : 'below';
                        announcement = `Moved ${draggedSection.name} ${position} ${targetName}`;
                    }

                    onSectionMove(moveData);
                    liveRegion.announce(announcement);
                }

                // Update local state for UI feedback
                dispatch({
                    type: 'instruction',
                    itemId,
                    targetId,
                    index: 0,
                });
            },
        });
    }, [contextValue.uniqueContextId, sections, onSectionMove, pageKeyword]);

    // Helper functions
    const findSectionById = (id: number, items: IPageField[]): IPageField | null => {
        for (const item of items) {
            if (item.id === id) return item;
            if (item.children) {
                const found = findSectionById(id, item.children);
                if (found) return found;
            }
        }
        return null;
    };

    const getAllDescendantIds = (section: IPageField): number[] => {
        const ids: number[] = [];
        if (section.children) {
            section.children.forEach(child => {
                ids.push(child.id);
                ids.push(...getAllDescendantIds(child));
            });
        }
        return ids;
    };

    if (isProcessing) {
        return (
            <Box p="md" ta="center">
                <Text size="sm" c="dimmed">Processing sections...</Text>
            </Box>
        );
    }

    return (
        <SectionsTreeContext.Provider value={contextValue}>
            <Box
                ref={containerRef}
                data-scroll-container
                className={styles.sectionsContainer}
                style={{
                    minHeight: '200px',
                    maxHeight: '75vh',
                    overflowY: 'auto',
                    overflowX: 'hidden',
                    padding: '8px',
                    backgroundColor: 'var(--mantine-color-gray-0)',
                    borderRadius: '8px',
                    border: '1px solid var(--mantine-color-gray-2)'
                }}
            >
                {sections.length === 0 ? (
                    <Paper p="lg" ta="center" withBorder style={{ 
                        backgroundColor: 'white',
                        border: '2px dashed var(--mantine-color-gray-4)',
                        borderRadius: '8px',
                        margin: '8px'
                    }}>
                        <Text size="sm" c="dimmed" fw={500}>
                            📄 No sections yet
                        </Text>
                        <Text size="xs" c="dimmed" mt={4}>
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
                                onRemoveSection={onRemoveSection}
                                onAddChildSection={onAddChildSection}
                                onAddSiblingAbove={onAddSiblingAbove}
                                onAddSiblingBelow={onAddSiblingBelow}
                            />
                        ))}
                    </div>
                )}
            </Box>
        </SectionsTreeContext.Provider>
    );
} 