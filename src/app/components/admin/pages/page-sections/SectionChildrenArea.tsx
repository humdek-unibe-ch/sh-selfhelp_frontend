'use client';

import { Box, Stack, Text } from '@mantine/core';
import { useDroppable } from '@dnd-kit/core';
import { IPageField } from '../../../../../types/common/pages.type';

interface SectionChildrenAreaProps {
    section: IPageField;
    level: number;
    childSections: IPageField[];
    isExpanded: boolean;
    isDragActive: boolean;
    overId: string | number | null;
    renderChild: (child: IPageField, level: number) => React.ReactNode;
}

export function SectionChildrenArea({
    section,
    level,
    childSections,
    isExpanded,
    isDragActive,
    overId,
    renderChild
}: SectionChildrenAreaProps) {
    const dropZoneId = `children-${section.id}`;
    
    const { isOver, setNodeRef } = useDroppable({
        id: dropZoneId,
        disabled: !section.can_have_children
    });

    if (!section.can_have_children || !isExpanded) {
        return null;
    }

    const hasChildren = childSections && childSections.length > 0;
    const isValidDropZone = section.can_have_children && isDragActive;
    const isHighlighted = isOver && isDragActive;

    return (
        <Box
            ref={setNodeRef}
            style={{
                marginLeft: 16,
                marginTop: 4,
                minHeight: hasChildren ? 'auto' : 40,
                borderLeft: '2px solid var(--mantine-color-gray-3)',
                paddingLeft: 8,
                backgroundColor: isHighlighted ? 'var(--mantine-color-green-0)' : 
                                isValidDropZone ? 'var(--mantine-color-gray-0)' : 'transparent',
                border: isHighlighted ? '2px dashed var(--mantine-color-green-6)' : 
                        isValidDropZone ? '1px dashed var(--mantine-color-gray-4)' : 'none',
                borderRadius: '4px',
                padding: isValidDropZone ? '4px' : '0',
                transition: 'all 0.2s ease'
            }}
        >
            {hasChildren ? (
                <Stack gap={2}>
                    {childSections.map(child => renderChild(child, level + 1))}
                </Stack>
            ) : (
                isValidDropZone && (
                    <Box
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            minHeight: 32,
                            opacity: 0.6
                        }}
                    >
                        <Text size="xs" c="dimmed" ta="center">
                            {isHighlighted ? 'Drop here to add as child' : 'Drop zone for children'}
                        </Text>
                    </Box>
                )
            )}
        </Box>
    );
} 