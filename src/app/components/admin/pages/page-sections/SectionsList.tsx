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
import { Stack, Box, Text, Group, ActionIcon, Tooltip, Paper } from '@mantine/core';
import { IconChevronRight, IconChevronDown, IconPlus, IconTrash, IconGripVertical } from '@tabler/icons-react';
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
    type ElementDropTargetEventBasePayload,
    monitorForElements,
} from '@atlaskit/pragmatic-drag-and-drop/element/adapter';
import { 
    attachClosestEdge, 
    extractClosestEdge,
    type Edge 
} from '@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge';
import { autoScrollForElements } from '@atlaskit/pragmatic-drag-and-drop-auto-scroll/element';

import { IPageField } from '../../../../../types/common/pages.type';

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

// Individual tree item component
interface ITreeItemProps {
    item: IPageField;
    level: number;
    index: number;
    parentId: number | null;
    onRemoveSection: (sectionId: number, parentId: number | null) => void;
    onAddChildSection?: (parentSectionId: number) => void;
    onAddSiblingAbove?: (referenceSectionId: number, parentId: number | null) => void;
    onAddSiblingBelow?: (referenceSectionId: number, parentId: number | null) => void;
}

function TreeItem({ 
    item, 
    level, 
    index,
    parentId,
    onRemoveSection,
    onAddChildSection,
    onAddSiblingAbove,
    onAddSiblingBelow
}: ITreeItemProps) {
    const context = useContext(SectionsTreeContext);
    const elementRef = useRef<HTMLDivElement>(null);
    const dragHandleRef = useRef<HTMLDivElement>(null);
    const actionMenuRef = useRef<HTMLButtonElement>(null);
    
    const [isDragging, setIsDragging] = useState(false);
    const [dragState, setDragState] = useState<'idle' | 'preview' | 'is-dragging'>('idle');
    const [closestEdge, setClosestEdge] = useState<Edge | null>(null);
    const [isHovered, setIsHovered] = useState(false);

    invariant(context);
    const { 
        expandedSections, 
        onToggleExpand, 
        registerTreeItem, 
        uniqueContextId 
    } = context;

    const isExpanded = expandedSections.has(item.id);
    const hasChildren = item.children && item.children.length > 0;
    const canHaveChildren = !!item.can_have_children;

    // Register tree item
    useEffect(() => {
        if (!elementRef.current || !actionMenuRef.current) return;
        
        return registerTreeItem({
            itemId: item.id.toString(),
            element: elementRef.current,
            actionMenuTrigger: actionMenuRef.current
        });
    }, [item.id, registerTreeItem]);

    // Setup draggable with auto-scroll
    useEffect(() => {
        const element = elementRef.current;
        const dragHandle = dragHandleRef.current;
        
        if (!element || !dragHandle) return;

        return combine(
            autoScrollForElements({
                element: element.closest('[data-scroll-container]') || document.body,
            }),
            draggable({
                element: dragHandle,
                getInitialData: () => ({
                    type: 'tree-item',
                    itemId: item.id.toString(),
                    uniqueContextId,
                    level,
                    canHaveChildren,
                    parentId: parentId?.toString() || null
                }),
                onGenerateDragPreview: () => {
                    setDragState('preview');
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
            dropTargetForElements({
                element,
                canDrop: ({ source }) => {
                    const draggedId = source.data.itemId as string;
                    const draggedParentId = source.data.parentId as string | null;
                    
                    // Can't drop on itself
                    if (draggedId === item.id.toString()) return false;
                    
                    // Can't drop parent on its own child (prevent circular reference)
                    if (isDescendantOf(parseInt(draggedId), item.id)) return false;
                    
                    return (
                        source.data.uniqueContextId === uniqueContextId &&
                        source.data.type === 'tree-item'
                    );
                },
                getIsSticky: () => true,
                getData: ({ input, element }) => {
                    const data = {
                        type: 'tree-item',
                        itemId: item.id.toString(),
                        level,
                        canHaveChildren,
                        parentId: parentId?.toString() || null
                    };

                    return attachClosestEdge(data, {
                        input,
                        element,
                        allowedEdges: ['top', 'bottom']
                    });
                },
                onDragEnter: ({ self, source }) => {
                    const edge = extractClosestEdge(self.data);
                    setClosestEdge(edge);
                },
                onDragLeave: () => {
                    setClosestEdge(null);
                },
                onDrop: () => {
                    setClosestEdge(null);
                }
            })
        );
    }, [item.id, level, uniqueContextId, canHaveChildren, parentId]);

    // Helper function to check if a section is descendant of another
    const isDescendantOf = (ancestorId: number, descendantId: number): boolean => {
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
    };

    const handleToggleExpand = () => {
        onToggleExpand(item.id);
    };

    const handleRemoveSection = () => {
        onRemoveSection(item.id, parentId);
    };

    const handleAddChild = () => {
        if (canHaveChildren && onAddChildSection) {
            onAddChildSection(item.id);
        }
    };

    const handleAddSiblingAbove = () => {
        if (onAddSiblingAbove) {
            onAddSiblingAbove(item.id, parentId);
        }
    };

    const handleAddSiblingBelow = () => {
        if (onAddSiblingBelow) {
            onAddSiblingBelow(item.id, parentId);
        }
    };

    return (
        <div>
            {/* Drop indicator for top edge */}
            {closestEdge === 'top' && (
                <DropIndicator edge="top" gap="4px" />
            )}
            
            <Paper
                ref={elementRef}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                style={{
                    marginLeft: `${level * 20}px`,
                    opacity: isDragging ? 0.4 : 1,
                    backgroundColor: dragState === 'is-dragging' 
                        ? 'var(--mantine-color-blue-0)' 
                        : isHovered 
                        ? 'var(--mantine-color-gray-0)'
                        : 'transparent',
                    transition: 'all 0.15s ease',
                    border: dragState === 'is-dragging' 
                        ? '2px dashed var(--mantine-color-blue-4)' 
                        : '1px solid transparent',
                    borderRadius: '6px',
                    cursor: isDragging ? 'grabbing' : 'default'
                }}
                p="xs"
                mb={4}
                withBorder={isHovered || dragState === 'is-dragging'}
            >
                <Group gap="xs" wrap="nowrap" align="center">
                    {/* Expand/collapse toggle - moved to front */}
                    <ActionIcon
                        size="sm"
                        variant="subtle"
                        onClick={handleToggleExpand}
                        disabled={!hasChildren}
                        style={{ 
                            visibility: hasChildren ? 'visible' : 'hidden',
                            opacity: hasChildren ? 1 : 0,
                            minWidth: '24px'
                        }}
                    >
                        {isExpanded ? (
                            <IconChevronDown size={14} />
                        ) : (
                            <IconChevronRight size={14} />
                        )}
                    </ActionIcon>

                    {/* Section info */}
                    <Box style={{ flex: 1, minWidth: 0 }}>
                        <Group gap="xs" wrap="nowrap">
                            <Text size="sm" fw={500} truncate>
                                {item.name}
                            </Text>
                            <Group gap={4}>
                                <Text size="xs" c="dimmed">
                                    #{item.id}
                                </Text>
                                <Text size="xs" c="dimmed">
                                    {item.style_name}
                                </Text>
                                {canHaveChildren && (
                                    <Text size="xs" c="blue" fw={500}>
                                        Container
                                    </Text>
                                )}
                            </Group>
                        </Group>
                    </Box>

                    {/* Action buttons - only show on hover or when dragging */}
                    <Group gap={4} style={{ 
                        opacity: isHovered || dragState === 'is-dragging' ? 1 : 0,
                        transition: 'opacity 0.15s ease'
                    }}>
                        {canHaveChildren && (
                            <Tooltip label="Add child section" position="top">
                                <ActionIcon
                                    size="sm"
                                    variant="subtle"
                                    color="green"
                                    onClick={handleAddChild}
                                >
                                    <IconPlus size={12} />
                                </ActionIcon>
                            </Tooltip>
                        )}
                        
                        <Tooltip label="Add section above" position="top">
                            <ActionIcon
                                size="sm"
                                variant="subtle"
                                color="blue"
                                onClick={handleAddSiblingAbove}
                            >
                                <IconPlus size={12} />
                            </ActionIcon>
                        </Tooltip>
                        
                        <Tooltip label="Add section below" position="top">
                            <ActionIcon
                                size="sm"
                                variant="subtle"
                                color="blue"
                                onClick={handleAddSiblingBelow}
                            >
                                <IconPlus size={12} />
                            </ActionIcon>
                        </Tooltip>

                        <Tooltip label="Remove section" position="top">
                            <ActionIcon
                                ref={actionMenuRef}
                                size="sm"
                                variant="subtle"
                                color="red"
                                onClick={handleRemoveSection}
                            >
                                <IconTrash size={12} />
                            </ActionIcon>
                        </Tooltip>
                    </Group>

                    {/* Drag handle - moved to back */}
                    <div
                        ref={dragHandleRef}
                        style={{ 
                            cursor: isDragging ? 'grabbing' : 'grab',
                            display: 'flex',
                            alignItems: 'center',
                            padding: '2px',
                            opacity: isHovered || dragState === 'is-dragging' ? 1 : 0.3,
                            transition: 'opacity 0.15s ease'
                        }}
                    >
                        <IconGripVertical 
                            size={16} 
                            style={{ color: 'var(--mantine-color-gray-6)' }} 
                        />
                    </div>
                </Group>
            </Paper>

            {/* Drop indicator for bottom edge */}
            {closestEdge === 'bottom' && (
                <DropIndicator edge="bottom" gap="4px" />
            )}

            {/* Render children if expanded */}
            {isExpanded && hasChildren && (
                <div style={{ marginTop: '4px' }}>
                    {item.children.map((child, childIndex) => (
                        <TreeItem
                            key={child.id}
                            item={child}
                            level={level + 1}
                            index={childIndex}
                            parentId={item.id}
                            onRemoveSection={onRemoveSection}
                            onAddChildSection={onAddChildSection}
                            onAddSiblingAbove={onAddSiblingAbove}
                            onAddSiblingBelow={onAddSiblingBelow}
                        />
                    ))}
                </div>
            )}
        </div>
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

    const { data, lastAction } = state;
    const lastStateRef = useRef<IPageField[]>(data);
    
    useEffect(() => {
        lastStateRef.current = sections; // Use live sections data
    }, [sections]);

    // Handle post-move effects
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
        });
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

    // Context value
    const contextValue = useMemo<ISectionsTreeContext>(() => ({
        dispatch,
        uniqueContextId: Symbol('sections-tree'),
        getPathToItem,
        getMoveTargets,
        getChildrenOfItem,
        expandedSections,
        onToggleExpand,
        registerTreeItem,
    }), [
        getChildrenOfItem, 
        getMoveTargets, 
        registerTreeItem, 
        expandedSections, 
        onToggleExpand, 
        getPathToItem
    ]);

    // Calculate new position based on drop location
    const calculateNewPosition = (targetSection: IPageField | null, edge: Edge | null, targetParentId: number | null): number => {
        // Get siblings at the target level
        const siblings = targetParentId 
            ? (findSectionById(targetParentId, sections)?.children || [])
            : sections;
        
        const sortedSiblings = [...siblings].sort((a, b) => a.position - b.position);
        
        if (!targetSection) {
            // Dropping at the end
            if (sortedSiblings.length === 0) return -1; // First item
            const lastPosition = sortedSiblings[sortedSiblings.length - 1].position;
            return lastPosition + 10;
        }
        
        const targetIndex = sortedSiblings.findIndex(s => s.id === targetSection.id);
        
        if (edge === 'top') {
            // Dropping above target
            if (targetIndex === 0) {
                // Dropping at the very beginning
                const firstPosition = sortedSiblings[0].position;
                return firstPosition - 10;
            } else {
                // Dropping between items
                const prevPosition = sortedSiblings[targetIndex - 1].position;
                const currentPosition = sortedSiblings[targetIndex].position;
                const gap = currentPosition - prevPosition;
                
                if (gap > 2) {
                    return Math.floor((prevPosition + currentPosition) / 2);
                } else {
                    return prevPosition + 1;
                }
            }
        } else {
            // Dropping below target
            if (targetIndex === sortedSiblings.length - 1) {
                // Dropping at the very end
                return targetSection.position + 10;
            } else {
                // Dropping between items
                const currentPosition = sortedSiblings[targetIndex].position;
                const nextPosition = sortedSiblings[targetIndex + 1].position;
                const gap = nextPosition - currentPosition;
                
                if (gap > 2) {
                    return Math.floor((currentPosition + nextPosition) / 2);
                } else {
                    return currentPosition + 1;
                }
            }
        }
    };

    // Monitor for drag and drop
    useEffect(() => {
        if (!containerRef.current) return;

        return monitorForElements({
            canMonitor: ({ source }) =>
                source.data.uniqueContextId === contextValue.uniqueContextId &&
                source.data.type === 'tree-item',
            onDrop(args) {
                const { location, source } = args;
                
                if (!location.current.dropTargets.length) return;

                const itemId = source.data.itemId as string;
                const target = location.current.dropTargets[0];
                const targetId = target.data.itemId as string;
                const edge = extractClosestEdge(target.data);
                const targetParentId = target.data.parentId ? parseInt(target.data.parentId as string) : null;

                // Handle the drop with proper positioning
                const draggedSection = findSectionById(parseInt(itemId), sections);
                const targetSection = findSectionById(parseInt(targetId), sections);

                if (draggedSection && onSectionMove) {
                    const newPosition = calculateNewPosition(targetSection, edge, targetParentId);
                    
                    // Create move data
                    const moveData = {
                        draggedSectionId: parseInt(itemId),
                        newParentId: targetParentId,
                        pageKeyword,
                        newPosition,
                        draggedSection,
                        newParent: targetParentId ? findSectionById(targetParentId, sections) : null,
                        descendantIds: getAllDescendantIds(draggedSection),
                        totalMovingItems: 1 + getAllDescendantIds(draggedSection).length
                    };

                    onSectionMove(moveData);
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
                style={{
                    minHeight: '200px',
                    padding: '8px'
                }}
            >
                {sections.length === 0 ? (
                    <Paper p="xl" ta="center" withBorder style={{ 
                        backgroundColor: 'var(--mantine-color-gray-0)',
                        border: '2px dashed var(--mantine-color-gray-4)'
                    }}>
                        <Text size="sm" c="dimmed">
                            No sections in this page yet.
                        </Text>
                        <Text size="xs" c="dimmed" mt="xs">
                            Add your first section to get started.
                        </Text>
                    </Paper>
                ) : (
                    <Stack gap={2}>
                        {sections.map((section, index) => (
                            <TreeItem
                                key={section.id}
                                item={section}
                                level={0}
                                index={index}
                                parentId={null}
                                onRemoveSection={onRemoveSection}
                                onAddChildSection={onAddChildSection}
                                onAddSiblingAbove={onAddSiblingAbove}
                                onAddSiblingBelow={onAddSiblingBelow}
                            />
                        ))}
                    </Stack>
                )}
            </Box>
        </SectionsTreeContext.Provider>
    );
} 