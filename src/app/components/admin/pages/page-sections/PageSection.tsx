'use client';

import { forwardRef, RefObject } from 'react';
import { Box, Text, Paper, Group, Badge, ActionIcon, Tooltip } from '@mantine/core';
import { 
    IconChevronRight, 
    IconChevronDown, 
    IconPlus, 
    IconTrash, 
    IconGripVertical,
    IconFolder,
    IconFolderOpen
} from '@tabler/icons-react';
import { IPageField } from '../../../../../types/common/pages.type';

interface IPageSectionProps {
    section: IPageField;
    level: number;
    parentId: number | null;
    expandedSections: Set<number>;
    onToggleExpand: (sectionId: number) => void;
    onRemoveSection: (sectionId: number, parentId: number | null) => void;
    onAddChildSection?: (parentSectionId: number) => void;
    onAddSiblingAbove?: (referenceSectionId: number, parentId: number | null) => void;
    onAddSiblingBelow?: (referenceSectionId: number, parentId: number | null) => void;
    isDragActive: boolean;
    overId: string | number | null;
    draggedSectionId?: number | null;
    dragHandleProps?: any;
    isDragging?: boolean;
    actionMenuRef?: RefObject<HTMLButtonElement>;
    customStyle?: React.CSSProperties;
    showInsideDropZone?: boolean;
}

export const PageSection = forwardRef<HTMLDivElement, IPageSectionProps>(({
    section,
    level,
    parentId,
    expandedSections,
    onToggleExpand,
    onRemoveSection,
    onAddChildSection,
    onAddSiblingAbove,
    onAddSiblingBelow,
    isDragActive,
    overId,
    draggedSectionId,
    dragHandleProps,
    isDragging = false,
    actionMenuRef,
    customStyle,
    showInsideDropZone = false
}, ref) => {
    const hasChildren = section.children && section.children.length > 0;
    const isExpanded = expandedSections.has(section.id);
    const canHaveChildren = !!section.can_have_children;
    const isBeingDragged = draggedSectionId === section.id;
    const isValidDropTarget = canHaveChildren && overId === section.id;

    // Modern CMS styling
    const getSectionTypeColor = () => {
        if (canHaveChildren) return 'blue';
        return 'gray';
    };

    const getSectionIcon = () => {
        if (canHaveChildren) {
            return hasChildren && isExpanded ? <IconFolderOpen size={16} /> : <IconFolder size={16} />;
        }
        return null;
    };

    const handleToggleExpand = () => {
        if (hasChildren) {
            onToggleExpand(section.id);
        }
    };

    const handleRemoveSection = () => {
        if (window.confirm(`Remove section "${section.name}"?`)) {
            onRemoveSection(section.id, parentId);
        }
    };

    const handleAddChild = () => {
        if (canHaveChildren && onAddChildSection) {
            onAddChildSection(section.id);
        }
    };

    const handleAddSiblingAbove = () => {
        if (onAddSiblingAbove) {
            onAddSiblingAbove(section.id, parentId);
        }
    };

    const handleAddSiblingBelow = () => {
        if (onAddSiblingBelow) {
            onAddSiblingBelow(section.id, parentId);
        }
    };

    return (
        <Paper
            ref={ref}
            withBorder
            style={{
                backgroundColor: isBeingDragged 
                    ? 'var(--mantine-color-blue-0)' 
                    : isValidDropTarget && isDragActive 
                    ? 'var(--mantine-color-green-0)'
                    : 'white',
                borderColor: isBeingDragged 
                    ? 'var(--mantine-color-blue-4)' 
                    : isValidDropTarget && isDragActive 
                    ? 'var(--mantine-color-green-4)'
                    : 'var(--mantine-color-gray-3)',
                borderWidth: isBeingDragged || (isValidDropTarget && isDragActive) ? '2px' : '1px',
                borderStyle: isBeingDragged ? 'dashed' : 'solid',
                opacity: isDragging ? 0.6 : 1,
                transition: 'all 0.2s ease',
                cursor: isDragging ? 'grabbing' : 'default',
                borderRadius: '12px',
                overflow: 'hidden',
                ...customStyle
            }}
            {...dragHandleProps}
        >
            <Group gap="sm" p="md" wrap="nowrap" align="center">
                {/* Drag Handle */}
                <ActionIcon
                    variant="subtle"
                    size="sm"
                    color="gray"
                    style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
                >
                    <IconGripVertical size={16} />
                </ActionIcon>

                {/* Expand/Collapse Toggle */}
                <ActionIcon
                    variant="subtle"
                    size="sm"
                    onClick={handleToggleExpand}
                    disabled={!hasChildren}
                    style={{ 
                        opacity: hasChildren ? 1 : 0.3,
                        cursor: hasChildren ? 'pointer' : 'default'
                    }}
                >
                    {hasChildren ? (
                        isExpanded ? <IconChevronDown size={16} /> : <IconChevronRight size={16} />
                    ) : (
                        <Box style={{ width: 16, height: 16 }} />
                    )}
                </ActionIcon>

                {/* Section Icon */}
                <Box style={{ color: `var(--mantine-color-${getSectionTypeColor()}-6)` }}>
                    {getSectionIcon()}
                </Box>

                {/* Section Info */}
                <Box style={{ flex: 1, minWidth: 0 }}>
                    <Group gap="xs" wrap="nowrap">
                        <Text size="sm" fw={500} truncate>
                            {section.name}
                        </Text>
                        <Badge size="xs" variant="light" color={getSectionTypeColor()}>
                            {section.style_name}
                        </Badge>
                        {canHaveChildren && (
                            <Badge size="xs" variant="dot" color="blue">
                                Container
                            </Badge>
                        )}
                        {hasChildren && (
                            <Badge size="xs" variant="outline" color="gray">
                                {section.children?.length || 0} items
                            </Badge>
                        )}
                    </Group>
                    <Text size="xs" c="dimmed">
                        ID: {section.id} • Position: {section.position}
                    </Text>
                </Box>

                {/* Action Buttons */}
                <Group gap={4}>
                    {canHaveChildren && (
                        <Tooltip label="Add child section">
                            <ActionIcon
                                size="sm"
                                variant="light"
                                color="green"
                                onClick={handleAddChild}
                            >
                                <IconPlus size={14} />
                            </ActionIcon>
                        </Tooltip>
                    )}
                    
                    <Tooltip label="Add section above">
                        <ActionIcon
                            size="sm"
                            variant="light"
                            color="blue"
                            onClick={handleAddSiblingAbove}
                        >
                            <IconPlus size={14} />
                        </ActionIcon>
                    </Tooltip>
                    
                    <Tooltip label="Add section below">
                        <ActionIcon
                            size="sm"
                            variant="light"
                            color="blue"
                            onClick={handleAddSiblingBelow}
                        >
                            <IconPlus size={14} />
                        </ActionIcon>
                    </Tooltip>

                    <Tooltip label="Remove section">
                        <ActionIcon
                            ref={actionMenuRef}
                            size="sm"
                            variant="light"
                            color="red"
                            onClick={handleRemoveSection}
                        >
                            <IconTrash size={14} />
                        </ActionIcon>
                    </Tooltip>
                </Group>
            </Group>

            {/* Child Drop Zone for empty containers */}
            {showInsideDropZone && (
                <Box
                    style={{
                        margin: '8px 16px 16px 16px',
                        minHeight: 40,
                        backgroundColor: 'var(--mantine-color-blue-0)',
                        border: '2px dashed var(--mantine-color-blue-4)',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.2s ease'
                    }}
                >
                    <Text size="sm" c="blue.6" ta="center">
                        📁 Drop here to add first child section
                    </Text>
                </Box>
            )}
        </Paper>
    );
});

PageSection.displayName = 'PageSection'; 