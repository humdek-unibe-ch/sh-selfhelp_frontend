'use client';

import { Box } from '@mantine/core';
import { DraggableProvidedDragHandleProps } from '@hello-pangea/dnd';
import { IPageField } from '../../../../../types/common/pages.type';
import { SectionHeader } from './SectionHeader';
import styles from './PageSections.module.css';

interface PageSectionProps {
    section: IPageField;
    level: number;
    expandedSections: Set<number>;
    onToggleExpand: (sectionId: number) => void;
    isDragActive: boolean;
    overId: string | number | null;
    draggedSectionId?: number | null;
    dragHandleProps?: DraggableProvidedDragHandleProps | null;
    isDragging?: boolean;
}

export function PageSection({
    section,
    level,
    expandedSections,
    onToggleExpand,
    isDragActive,
    overId,
    draggedSectionId,
    dragHandleProps,
    isDragging = false
}: PageSectionProps) {
    const hasChildren = section.children && section.children.length > 0;
    const isExpanded = expandedSections.has(section.id);
    const isValidDropTarget = section.can_have_children && overId === section.id;
    
    // Check if this section or any of its ancestors is being dragged
    const isBeingDragged = draggedSectionId === section.id;

    return (
        <Box 
            className={`${styles.sectionItem} ${styles[`level${Math.min(level, 4)}`]}`}
            mb={2}
            style={{
                opacity: isDragging ? 0.5 : 1,
                marginLeft: level * 16, // Indentation based on level
            }}
        >
            {/* Section Header */}
            <SectionHeader
                section={section}
                level={level}
                hasChildren={hasChildren}
                isExpanded={isExpanded}
                onToggleExpand={onToggleExpand}
                dragHandleProps={dragHandleProps}
                isDragging={isDragging}
                isValidDropTarget={isValidDropTarget}
                isDragActive={isDragActive}
                isBeingDragged={isBeingDragged}
            />
        </Box>
    );
} 