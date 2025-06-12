'use client';

import { Box } from '@mantine/core';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { IPageField } from '../../../../../types/common/pages.type';
import { SectionHeader } from './SectionHeader';
import { SectionChildrenArea } from './SectionChildrenArea';
import styles from './PageSections.module.css';

interface PageSectionProps {
    section: IPageField;
    level: number;
    expandedSections: Set<number>;
    onToggleExpand: (sectionId: number) => void;
    isDragActive: boolean;
    overId: string | number | null;
    draggedSectionId?: number | null;
}

export function PageSection({
    section,
    level,
    expandedSections,
    onToggleExpand,
    isDragActive,
    overId,
    draggedSectionId
}: PageSectionProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: section.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    const hasChildren = section.children && section.children.length > 0;
    const isExpanded = expandedSections.has(section.id);
    const isValidDropTarget = section.can_have_children && overId === section.id;
    
    // Check if this section or any of its ancestors is being dragged
    const isBeingDragged = draggedSectionId === section.id;
    const isChildOfDraggedSection = draggedSectionId && section.id !== draggedSectionId && isDragActive;

    const dragHandleProps = {
        ...attributes,
        ...listeners
    };

    // Render function for children to avoid circular dependency
    const renderChild = (child: IPageField, childLevel: number) => (
        <PageSection
            key={child.id}
            section={child}
            level={childLevel}
            expandedSections={expandedSections}
            onToggleExpand={onToggleExpand}
            isDragActive={isDragActive}
            overId={overId}
            draggedSectionId={draggedSectionId}
        />
    );

    return (
        <Box 
            ref={setNodeRef} 
            style={style}
            className={`${styles.sectionItem} ${styles[`level${Math.min(level, 4)}`]}`}
            mb={2}
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

            {/* Children Area - Hide children of dragged element */}
            {!isBeingDragged && (
                <SectionChildrenArea
                    section={section}
                    level={level}
                    childSections={section.children}
                    isExpanded={isExpanded}
                    isDragActive={isDragActive}
                    overId={overId}
                    renderChild={renderChild}
                />
            )}
        </Box>
    );
} 