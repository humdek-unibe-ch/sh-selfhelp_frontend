'use client';

import { useState, useMemo } from 'react';
import { Stack, Box } from '@mantine/core';
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
    DragOverEvent
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
}

export function SectionsList({
    sections,
    expandedSections,
    onToggleExpand,
    onSectionMove
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
        setActiveId(null);
        setOverId(null);

        if (!over || active.id === over.id) {
            return;
        }

        // Find the sections being moved
        const activeSection = findSection(active.id);
        let overSection = findSection(over.id);

        // Handle dropping on children area
        if (typeof over.id === 'string' && over.id.startsWith('children-')) {
            const parentId = parseInt(over.id.replace('children-', ''));
            overSection = findSection(parentId);
        }

        if (!activeSection || !overSection) {
            return;
        }

        // Check if the target section can have children
        if (!overSection.can_have_children) {
            console.log('Cannot drop on section that cannot have children:', overSection.name);
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
            return parent ? checkChildren(parent.children) : false;
        };

        if (activeSection.id === overSection.id || isDescendant(activeSection.id, overSection.id)) {
            console.log('Cannot drop section on itself or its descendants');
            return;
        }

        // Get all descendants that will move with the parent
        const descendantIds = getAllDescendants(activeSection.id);
        
        // Call the move handler
        onSectionMove({
            activeId: active.id,
            overId: over.id,
            activeSection,
            overSection,
            descendantIds,
            totalMovingItems: descendantIds.length + 1,
            canAcceptChildren: overSection.can_have_children,
            action: 'move_to_parent'
        });
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
                            />
                        ))}
                    </Stack>
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