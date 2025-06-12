'use client';

import { useState, useMemo } from 'react';
import { Stack, Box, Text } from '@mantine/core';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { IPageField } from '../../../../../types/common/pages.type';
import { PageSection } from './PageSection';
import styles from './PageSections.module.css';

interface SectionsListProps {
    sections: IPageField[];
    expandedSections: Set<number>;
    onToggleExpand: (sectionId: number) => void;
    onSectionMove: (moveData: any) => void;
    pageKeyword?: string;
}

interface MoveData {
    draggedSectionId: number;
    newParentId: number | null;
    pageKeyword?: string;
    newPosition: number;
    draggedSection: IPageField;
    newParent: IPageField | null;
    descendantIds: number[];
    totalMovingItems: number;
}

// Flatten sections for drag and drop while preserving hierarchy info
interface FlatSection {
    section: IPageField;
    level: number;
    parentId: number | null;
    canAcceptChildren: boolean;
    isChildDropZone?: boolean;
    originalIndex?: number;
}

export function SectionsList({
    sections,
    expandedSections,
    onToggleExpand,
    onSectionMove,
    pageKeyword
}: SectionsListProps) {
    const [draggedSectionId, setDraggedSectionId] = useState<number | null>(null);

    // Flatten sections for drag and drop
    const flattenSections = (items: IPageField[], level = 0, parentId: number | null = null): FlatSection[] => {
        const result: FlatSection[] = [];
        
        items.forEach((item, index) => {
            // Add the section itself
            result.push({
                section: item,
                level,
                parentId,
                canAcceptChildren: item.can_have_children,
                originalIndex: index
            });
            
            // Add child drop zone if section can have children and (is expanded or dragging)
            if (item.can_have_children && (expandedSections.has(item.id) || draggedSectionId)) {
                result.push({
                    section: item,
                    level: level + 1,
                    parentId: item.id,
                    canAcceptChildren: false,
                    isChildDropZone: true
                });
            }
            
            // Add children if expanded or dragging
            if (item.children && (expandedSections.has(item.id) || draggedSectionId)) {
                result.push(...flattenSections(item.children, level + 1, item.id));
            }
        });
        
        return result;
    };

    const flatSections = useMemo(() => flattenSections(sections), [sections, expandedSections, draggedSectionId]);

    // Get all descendants of a section (for dragging parent with children)
    const getAllDescendants = (sectionId: number): number[] => {
        const descendants: number[] = [];
        
        const collectDescendants = (items: IPageField[]) => {
            items.forEach(item => {
                if (item.id === sectionId) {
                    const addChildren = (children: IPageField[]) => {
                        children.forEach(child => {
                            descendants.push(child.id);
                            if (child.children) {
                                addChildren(child.children);
                            }
                        });
                    };
                    if (item.children) {
                        addChildren(item.children);
                    }
                } else if (item.children) {
                    collectDescendants(item.children);
                }
            });
        };
        
        collectDescendants(sections);
        return descendants;
    };

    // Find section by ID in nested structure
    const findSection = (id: number, items: IPageField[] = sections): IPageField | null => {
        for (const item of items) {
            if (item.id === id) return item;
            if (item.children) {
                const found = findSection(id, item.children);
                if (found) return found;
            }
        }
        return null;
    };

    // Calculate position based on 5, 15, 25, 35... pattern
    const calculateNewPosition = (targetParent: IPageField | null, dropIndex: number): number => {
        const siblings = targetParent ? (targetParent.children || []) : sections;
        const sortedSiblings = [...siblings].sort((a, b) => a.position - b.position);
        
        if (sortedSiblings.length === 0) {
            return 5; // First item
        }
        
        if (dropIndex === 0) {
            // Dropping at the beginning
            const firstPosition = sortedSiblings[0].position;
            return Math.max(5, firstPosition - 10);
        } else if (dropIndex >= sortedSiblings.length) {
            // Dropping at the end
            const lastPosition = sortedSiblings[sortedSiblings.length - 1].position;
            return lastPosition + 10;
        } else {
            // Dropping in the middle
            const prevPosition = sortedSiblings[dropIndex - 1].position;
            const nextPosition = sortedSiblings[dropIndex].position;
            const gap = nextPosition - prevPosition;
            
            if (gap > 10) {
                return Math.floor((prevPosition + nextPosition) / 2);
            } else {
                // Use the 5, 15, 25 pattern
                return prevPosition + 5;
            }
        }
    };

    const handleDragStart = (start: any) => {
        const draggedId = parseInt(start.draggableId);
        setDraggedSectionId(draggedId);
        console.log('🚀 Drag started:', { draggedId });
    };

    const handleDragEnd = (result: DropResult) => {
        setDraggedSectionId(null);
        
        if (!result.destination) {
            console.log('❌ Drag cancelled');
            return;
        }

        const sourceIndex = result.source.index;
        const destinationIndex = result.destination.index;
        const draggedId = parseInt(result.draggableId);
        
        if (sourceIndex === destinationIndex) {
            console.log('↩️ No position change');
            return;
        }

        const draggedSection = findSection(draggedId);
        if (!draggedSection) {
            console.log('❌ Dragged section not found');
            return;
        }

        // Determine drop target and new parent
        const destinationItem = flatSections[destinationIndex];
        let newParentId: number | null = null;
        let dropIndex = 0;

        if (destinationItem.isChildDropZone) {
            // Dropping into a child zone
            newParentId = destinationItem.parentId;
            const parent = findSection(newParentId!);
            dropIndex = parent?.children?.length || 0;
        } else {
            // Dropping at same level or root
            newParentId = destinationItem.parentId;
            // Calculate index among siblings
            const siblings = flatSections.filter(item => 
                !item.isChildDropZone && item.parentId === newParentId
            );
            dropIndex = siblings.findIndex(item => item.section.id === destinationItem.section.id);
            if (dropIndex === -1) dropIndex = siblings.length;
        }

        // Validate drop target
        const targetParent = newParentId ? findSection(newParentId) : null;
        if (newParentId && targetParent && !targetParent.can_have_children) {
            console.log('❌ Cannot drop on section that cannot have children');
            return;
        }

        // Prevent dropping on self or descendants
        const isDescendant = (parentId: number, childId: number): boolean => {
            const checkChildren = (sections: IPageField[]): boolean => {
                return sections.some(section => {
                    if (section.id === childId) return true;
                    return section.children && checkChildren(section.children);
                });
            };
            
            const parent = findSection(parentId);
            return parent ? checkChildren(parent.children || []) : false;
        };

        if (newParentId && (draggedSection.id === newParentId || isDescendant(draggedSection.id, newParentId))) {
            console.log('❌ Cannot drop section on itself or its descendants');
            return;
        }

        // Get all descendants that will move with the parent
        const descendantIds = getAllDescendants(draggedSection.id);
        
        // Calculate new position
        const newPosition = calculateNewPosition(targetParent, dropIndex);
        
        // Prepare move data for backend
        const moveData: MoveData = {
            draggedSectionId: draggedSection.id,
            newParentId,
            pageKeyword,
            newPosition,
            draggedSection,
            newParent: targetParent,
            descendantIds,
            totalMovingItems: descendantIds.length + 1
        };

        console.log('📦 Section Move Data for Backend:', moveData);
        onSectionMove(moveData);
    };

    return (
        <Box className={styles.sectionsContainer}>
            <DragDropContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
                <Droppable droppableId="sections-list">
                    {(provided, snapshot) => (
                        <Box
                            ref={provided.innerRef}
                            {...provided.droppableProps}
                            style={{
                                backgroundColor: 'transparent',
                                borderRadius: '8px',
                                transition: 'background-color 0.2s ease'
                            }}
                        >
                            <Stack gap={2}>
                                {flatSections.map((item, index) => (
                                    <SectionDraggableItem
                                        key={`${item.section.id}-${item.isChildDropZone ? 'drop' : 'section'}-${item.level}`}
                                        item={item}
                                        index={index}
                                        expandedSections={expandedSections}
                                        onToggleExpand={onToggleExpand}
                                        draggedSectionId={draggedSectionId}
                                    />
                                ))}
                            </Stack>
                            {provided.placeholder}
                        </Box>
                    )}
                </Droppable>
            </DragDropContext>
        </Box>
    );
}

// Individual draggable section item
interface SectionDraggableItemProps {
    item: FlatSection;
    index: number;
    expandedSections: Set<number>;
    onToggleExpand: (sectionId: number) => void;
    draggedSectionId: number | null;
}

function SectionDraggableItem({
    item,
    index,
    expandedSections,
    onToggleExpand,
    draggedSectionId
}: SectionDraggableItemProps) {
    const isDraggedSection = draggedSectionId === item.section.id;
    const isChildOfDraggedSection = draggedSectionId && 
        item.section.id !== draggedSectionId && 
        draggedSectionId !== null;

    // Don't render children of dragged section
    if (isChildOfDraggedSection && item.parentId === draggedSectionId) {
        return null;
    }

    if (item.isChildDropZone) {
        // Render child drop zone
        return (
            <Draggable 
                draggableId={`drop-${item.section.id}-${item.level}`} 
                index={index}
                isDragDisabled={true}
            >
                {(provided, snapshot) => (
                    <Box
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        style={{
                            marginLeft: item.level * 16,
                            minHeight: 50,
                            padding: '12px',
                                                                                      backgroundColor: 'var(--mantine-color-gray-0)',
                            border: `2px dashed ${item.level > 1 ? 'var(--mantine-color-blue-5)' : 'var(--mantine-color-gray-5)'}`,
                            borderRadius: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.2s ease',
                            ...provided.draggableProps.style
                        }}
                    >
                        <Text 
                            size="sm" 
                            fw={500}
                            c={item.level > 1 ? "blue.6" : "gray.6"}
                            ta="center"
                        >
                            📁 Drop here to add as child (Level {item.level})
                        </Text>
                    </Box>
                )}
            </Draggable>
        );
    }

    // Render regular section
    return (
        <Draggable 
            draggableId={item.section.id.toString()} 
            index={index}
            isDragDisabled={isDraggedSection}
        >
            {(provided, snapshot) => (
                <Box
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    style={{
                        ...provided.draggableProps.style,
                        opacity: snapshot.isDragging ? 0.8 : 1
                    }}
                >
                    <PageSection
                        section={item.section}
                        level={item.level}
                        expandedSections={expandedSections}
                        onToggleExpand={onToggleExpand}
                        isDragActive={!!draggedSectionId}
                        overId={null}
                        draggedSectionId={draggedSectionId}
                        dragHandleProps={provided.dragHandleProps}
                        isDragging={snapshot.isDragging}
                    />
                </Box>
            )}
        </Draggable>
    );
} 