'use client';

import { forwardRef, RefObject } from 'react';
import { Box, Text, Paper, Group, Badge, ActionIcon, Tooltip, Stack } from '@mantine/core';
import { 
    IconChevronRight, 
    IconChevronDown, 
    IconPlus, 
    IconTrash, 
    IconGripVertical,
    IconFolder,
    IconFolderOpen,
    IconFile
} from '@tabler/icons-react';
import { IPageField } from '../../../../../types/common/pages.type';
import styles from './PageSection.module.css';

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

    // Compact styling based on level
    const getIndentationStyle = () => ({
        marginLeft: `${level * 16}px`,
        borderLeft: level > 0 ? `2px solid var(--mantine-color-gray-2)` : 'none',
        paddingLeft: level > 0 ? '8px' : '0'
    });

    const getSectionTypeColor = () => {
        if (canHaveChildren) return 'blue';
        return 'gray';
    };

    const getSectionIcon = () => {
        if (canHaveChildren) {
            return hasChildren && isExpanded ? <IconFolderOpen size={14} /> : <IconFolder size={14} />;
        }
        return <IconFile size={14} />;
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
        <div style={getIndentationStyle()}>
            <Paper
                ref={ref}
                className={`${styles.sectionItem} ${styles[`level${Math.min(level, 4)}`]}`}
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
                    cursor: isDragging ? 'grabbing' : 'default',
                    marginBottom: '4px',
                    ...customStyle
                }}
            >
                <Group gap="xs" p="xs" wrap="nowrap" align="center" className={styles.compactGroup}>
                    {/* Drag Handle - properly connected */}
                    <div {...dragHandleProps}>
                        <ActionIcon
                            variant="subtle"
                            size="xs"
                            color="gray"
                            className={styles.dragHandle}
                            style={{ 
                                cursor: isDragging ? 'grabbing' : 'grab',
                                opacity: isDragActive ? 1 : 0.6
                            }}
                        >
                            <IconGripVertical size={12} />
                        </ActionIcon>
                    </div>

                    {/* Expand/Collapse Toggle - only show if has children */}
                    {hasChildren ? (
                        <ActionIcon
                            variant="subtle"
                            size="xs"
                            onClick={handleToggleExpand}
                            className={styles.expandButton}
                        >
                            {isExpanded ? <IconChevronDown size={12} /> : <IconChevronRight size={12} />}
                        </ActionIcon>
                    ) : (
                        <Box w={20} />
                    )}

                    {/* Section Icon */}
                    <Box style={{ 
                        color: `var(--mantine-color-${getSectionTypeColor()}-6)`,
                        display: 'flex',
                        alignItems: 'center'
                    }}>
                        {getSectionIcon()}
                    </Box>

                    {/* Section Info - Compact */}
                    <Box style={{ flex: 1, minWidth: 0 }}>
                        <Group gap={4} wrap="nowrap" align="center">
                            <Text 
                                size="sm" 
                                fw={500} 
                                className={styles.sectionName}
                                title={section.name}
                            >
                                {section.name}
                            </Text>
                            <Badge 
                                size="xs" 
                                variant="light" 
                                color={getSectionTypeColor()}
                                className={styles.styleBadge}
                            >
                                {section.style_name}
                            </Badge>
                            {hasChildren && (
                                <Badge size="xs" variant="outline" color="gray" className={styles.childCount}>
                                    {section.children?.length}
                                </Badge>
                            )}
                        </Group>
                        <Text size="xs" c="dimmed" className={styles.sectionMeta}>
                            #{section.id} • pos:{section.position}
                        </Text>
                    </Box>

                    {/* Action Buttons - Compact and hover-based */}
                    <Group gap={2} className={styles.actionButtons}>
                        {canHaveChildren && (
                            <Tooltip label="Add child" position="top" withArrow>
                                <ActionIcon
                                    size="xs"
                                    variant="subtle"
                                    color="green"
                                    onClick={handleAddChild}
                                    className={styles.actionButton}
                                >
                                    <IconPlus size={12} />
                                </ActionIcon>
                            </Tooltip>
                        )}
                        
                        <Tooltip label="Add above" position="top" withArrow>
                            <ActionIcon
                                size="xs"
                                variant="subtle"
                                color="blue"
                                onClick={handleAddSiblingAbove}
                                className={styles.actionButton}
                            >
                                <IconPlus size={12} />
                            </ActionIcon>
                        </Tooltip>
                        
                        <Tooltip label="Add below" position="top" withArrow>
                            <ActionIcon
                                size="xs"
                                variant="subtle"
                                color="blue"
                                onClick={handleAddSiblingBelow}
                                className={styles.actionButton}
                            >
                                <IconPlus size={12} />
                            </ActionIcon>
                        </Tooltip>

                        <Tooltip label="Remove" position="top" withArrow>
                            <ActionIcon
                                ref={actionMenuRef}
                                size="xs"
                                variant="subtle"
                                color="red"
                                onClick={handleRemoveSection}
                                className={styles.actionButton}
                            >
                                <IconTrash size={12} />
                            </ActionIcon>
                        </Tooltip>
                    </Group>
                </Group>
            </Paper>
        </div>
    );
});

PageSection.displayName = 'PageSection'; 