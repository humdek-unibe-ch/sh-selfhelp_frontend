'use client';

import { useState, useMemo } from 'react';
import { Stack, Box, Text } from '@mantine/core';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
    DragOverlay,
    DragStartEvent,
    UniqueIdentifier,
    DragOverEvent,
    useDroppable
} from '@dnd-kit/core';
import {
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy
} from '@dnd-kit/sortable';
import { IPageField } from '../../../../../types/common/pages.type';
import { PageSection } from './PageSection';
import styles from './PageSections.module.css';
import { SectionDragOverlay } from './SectionDragOverlay';

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

export function SectionsList({
    sections,
    expandedSections,
    onToggleExpand,
    onSectionMove,
    pageKeyword
}: SectionsListProps) {
    const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);
    const [overId, setOverId] = useState<UniqueIdentifier | null>(null);

    // Get all section IDs for sortable context (including nested ones)
    const getAllSectionIds = (items: IPageField[]): number[] => {
        const ids: number[] = [];
        items.forEach(item => {
            ids.push(item.id);
            if (item.children) {
                ids.push(...getAllSectionIds(item.children));
            }
        });
        return ids;
    };

    const allSectionIds = useMemo(() => getAllSectionIds(sections), [sections]);

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
    const findSection = (id: number | string, items: IPageField[] = sections): IPageField | null => {
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

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(event.active.id);
    };

    const handleDragOver = (event: DragOverEvent) => {
        const { over } = event;
        setOverId(over?.id || null);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        
        if (!over || active.id === over.id) {
            setActiveId(null);
            setOverId(null);
            return;
        }

        // Find the sections being moved
        const activeSection = findSection(active.id);
        let overSection = findSection(over.id);
        let newParentId: number | null = null;
        let dropIndex = 0;

        // Handle dropping on children area
        if (typeof over.id === 'string' && over.id.startsWith('children-')) {
            const parentId = parseInt(over.id.replace('children-', ''));
            overSection = findSection(parentId);
            newParentId = parentId;
            dropIndex = overSection?.children?.length || 0; // Add to end of children
        } else if (typeof over.id === 'string' && over.id.startsWith('page-root-')) {
            // Dropping on page root
            newParentId = null;
            dropIndex = sections.length; // Add to end of root sections
        } else if (overSection) {
            // Dropping on a section - determine if it's before/after or as child
            newParentId = null; // For now, treat as root level
            // Calculate drop index based on position in siblings
            const siblings = sections;
            dropIndex = siblings.findIndex(s => s.id === overSection!.id);
            if (dropIndex === -1) dropIndex = siblings.length;
        }

        if (!activeSection) {
            setActiveId(null);
            setOverId(null);
            return;
        }

        // Check if the target section can have children (if dropping as child)
        if (newParentId && overSection && !overSection.can_have_children) {
            console.log('Cannot drop on section that cannot have children:', overSection.name);
            setActiveId(null);
            setOverId(null);
            return;
        }

        // Prevent dropping a section on itself or its descendants
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

        if (newParentId && (activeSection.id === newParentId || isDescendant(activeSection.id, newParentId))) {
            console.log('Cannot drop section on itself or its descendants');
            setActiveId(null);
            setOverId(null);
            return;
        }

        // Get all descendants that will move with the parent
        const descendantIds = getAllDescendants(activeSection.id);
        
        // Calculate new position
        const targetParent = newParentId ? overSection : null;
        const newPosition = calculateNewPosition(targetParent, dropIndex);
        
        // Prepare move data for backend
        const moveData: MoveData = {
            draggedSectionId: activeSection.id,
            newParentId,
            pageKeyword,
            newPosition,
            draggedSection: activeSection,
            newParent: targetParent,
            descendantIds,
            totalMovingItems: descendantIds.length + 1
        };

        console.log('Section Move Data for Backend:', moveData);
        
        // Call the move handler
        onSectionMove(moveData);
        
        // Don't reset activeId and overId immediately - let the parent handle success/failure
        // Only reset on successful backend update or after timeout
        setTimeout(() => {
            setActiveId(null);
            setOverId(null);
        }, 100);
    };

    return (
        <Box className={styles.sectionsContainer}>
            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDragEnd={handleDragEnd}
            >
                <SortableContext
                    items={allSectionIds}
                    strategy={verticalListSortingStrategy}
                >
                    <RootDropZone isDragActive={!!activeId} pageKeyword={pageKeyword} sections={sections}>
                        <Stack gap={2}>
                            {sections.map(section => (
                                <PageSection
                                    key={section.id}
                                    section={section}
                                    level={0}
                                    expandedSections={expandedSections}
                                    onToggleExpand={onToggleExpand}
                                    isDragActive={!!activeId}
                                    overId={overId}
                                    draggedSectionId={typeof activeId === 'number' ? activeId : null}
                                />
                            ))}
                        </Stack>
                    </RootDropZone>
                </SortableContext>

                <SectionDragOverlay
                    activeId={activeId}
                    sections={sections}
                    getAllDescendants={getAllDescendants}
                />
            </DndContext>
        </Box>
    );
}

// Root drop zone component for page-level drops
function RootDropZone({ 
    children, 
    isDragActive, 
    pageKeyword,
    sections
}: { 
    children: React.ReactNode; 
    isDragActive: boolean; 
    pageKeyword?: string; 
    sections: IPageField[]; 
}) {
    const { isOver, setNodeRef } = useDroppable({
        id: `page-root-${pageKeyword || 'unknown'}`,
        disabled: !isDragActive
    });

    return (
        <Box
            ref={setNodeRef}
            style={{
                minHeight: isDragActive ? 60 : 'auto',
                padding: isDragActive ? '8px' : '0',
                backgroundColor: isOver && isDragActive ? 'var(--mantine-color-blue-0)' : 'transparent',
                border: isOver && isDragActive ? '2px dashed var(--mantine-color-blue-6)' : 'none',
                borderRadius: '4px',
                transition: 'all 0.2s ease',
                position: 'relative'
            }}
        >
            {isDragActive && sections.length === 0 && (
                <Box
                    style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        opacity: 0.6,
                        pointerEvents: 'none'
                    }}
                >
                    <Text size="xs" c="dimmed" ta="center">
                        {isOver ? 'Drop here to add to page root' : 'Page root drop zone'}
                    </Text>
                </Box>
            )}
            {children}
        </Box>
    );
} 