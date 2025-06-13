'use client';

import { Box, Text } from '@mantine/core';
import { DraggableProvidedDragHandleProps } from '@hello-pangea/dnd';
import { IPageField } from '../../../../../types/common/pages.type';
import { SectionHeader } from './SectionHeader';
import styles from './PageSections.module.css';

interface IPageSectionProps {
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
}: IPageSectionProps) {
    const hasChildren = section.children && section.children.length > 0;
    const isExpanded = expandedSections.has(section.id);
    const isValidDropTarget = Boolean(section.can_have_children) && overId === section.id;
    
    // Check if this section or any of its ancestors is being dragged
    const isBeingDragged = draggedSectionId === section.id;
    
    // Show child drop zone if: can have children, has no children, and someone is dragging (but not this element)
    const shouldShowChildDropZone = Boolean(section.can_have_children) && !hasChildren && isDragActive && !isBeingDragged;

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
            
            {/* Child Drop Zone - moves with the element */}
            {shouldShowChildDropZone  && (
                <Box
                    style={{
                        marginTop: 8,
                        marginLeft: 16, // Additional indentation for child level
                        minHeight: 40,
                        // padding: '12px',
                        backgroundColor: 'var(--mantine-color-gray-0)',
                        border: '2px dashed var(--mantine-color-blue-5)',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.2s ease',
                        opacity: isDragging ? 0.5 : 1, // Same opacity as parent when dragging
                    }}
                >
                    <Text 
                        size="sm" 
                        fw={500}
                        c={level > 0 ? "blue.6" : "gray.6"}
                        ta="center"
                    >
                        📁 Drop here to add first child
                    </Text>
                </Box>
            )}
        </Box>
    );
} 