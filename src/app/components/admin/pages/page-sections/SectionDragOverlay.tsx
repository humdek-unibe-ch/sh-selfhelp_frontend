'use client';

import { Paper, Group, Text } from '@mantine/core';
import { DragOverlay } from '@dnd-kit/core';
import { IconGripVertical } from '@tabler/icons-react';
import { IPageField } from '../../../../../types/common/pages.type';

interface SectionDragOverlayProps {
    activeId: string | number | null;
    sections: IPageField[];
    getAllDescendants: (sectionId: number) => number[];
}

export function SectionDragOverlay({
    activeId,
    sections,
    getAllDescendants
}: SectionDragOverlayProps) {
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

    const getSectionTitle = (section: IPageField) => {
        const nameParts = section.name.split('-');
        return nameParts.length > 1 ? nameParts[1] : section.name;
    };

    return (
        <DragOverlay>
            {activeId ? (() => {
                const draggedSection = findSection(activeId);
                const childrenCount = draggedSection ? getAllDescendants(draggedSection.id).length : 0;
                return (
                    <Paper 
                        p="xs" 
                        withBorder 
                        shadow="lg" 
                        style={{ 
                            opacity: 0.9, 
                            backgroundColor: 'var(--mantine-color-blue-1)',
                        }}
                    >
                        <Group gap="xs">
                            <IconGripVertical size={12} />
                            <Text fw={500} size="xs">
                                Moving {draggedSection ? getSectionTitle(draggedSection) : activeId}
                                {childrenCount > 0 && (
                                    <Text span c="dimmed" size="xs"> (+{childrenCount} children)</Text>
                                )}
                            </Text>
                        </Group>
                    </Paper>
                );
            })() : null}
        </DragOverlay>
    );
} 