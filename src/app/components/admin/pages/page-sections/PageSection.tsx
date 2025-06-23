'use client';

import { forwardRef, RefObject, useState } from 'react';
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
import { DeleteSectionModal } from './DeleteSectionModal';
import styles from './PageSection.module.css';

interface IPageSectionProps {
    section: IPageField;
    level: number;
    parentId: number | null;
    keyword: string;
    expandedSections: Set<number>;
    onToggleExpand: (sectionId: number) => void;
    onRemoveSection: (sectionId: number, parentId: number | null) => void;
    onAddChildSection?: (parentSectionId: number) => void;
    onAddSiblingAbove?: (referenceSectionId: number, parentId: number | null) => void;
    onAddSiblingBelow?: (referenceSectionId: number, parentId: number | null) => void;
    onSectionSelect?: (sectionId: number) => void;
    selectedSectionId?: number | null;
    focusedSectionId?: number | null;
    isDragActive: boolean;
    overId: string | number | null;
    draggedSectionId?: number | null;
    dragHandleProps?: any;
    isDragging?: boolean;

    showInsideDropZone?: boolean;
}

export const PageSection = forwardRef<HTMLDivElement, IPageSectionProps>(({
    section,
    level,
    parentId,
    keyword,
    expandedSections,
    onToggleExpand,
    onRemoveSection,
    onAddChildSection,
    onAddSiblingAbove,
    onAddSiblingBelow,
    onSectionSelect,
    selectedSectionId,
    focusedSectionId,
    isDragActive,
    overId,
    draggedSectionId,
    dragHandleProps,
    isDragging = false,

    showInsideDropZone = false
}, ref) => {
    const [deleteModalOpened, setDeleteModalOpened] = useState(false);
    
    const hasChildren = section.children && section.children.length > 0;
    const isExpanded = expandedSections.has(section.id);
    const canHaveChildren = !!section.can_have_children;
    const isBeingDragged = draggedSectionId === section.id;
    const isValidDropTarget = canHaveChildren && overId === section.id;
    const isSelected = selectedSectionId === section.id;
    const isFocused = focusedSectionId === section.id;

    // Dynamic indentation aligned with chevron - 12px per level to align with chevron positioning
    const getSectionTypeColor = () => {
        if (canHaveChildren) return 'blue';
        return 'gray';
    };

    const getIndentationStyle = () => ({
        '--section-indent': `${level * 12}px`,
        '--section-icon-color': `var(--mantine-color-${getSectionTypeColor()}-6)`
    } as React.CSSProperties);

    const getSectionIcon = () => {
        if (canHaveChildren) {
            return hasChildren && isExpanded ? <IconFolderOpen size={10} /> : <IconFolder size={10} />;
        }
        return <IconFile size={10} />;
    };

    // Get level class with support for 30+ levels
    const getLevelClass = () => {
        const maxDefinedLevel = 29;
        if (level <= maxDefinedLevel) {
            return styles[`level${level}`];
        }
        // For levels beyond 29, cycle through the first 12 levels with different shades
        const cycleLevel = level % 12;
        return styles[`level${cycleLevel + 18}`]; // Use levels 18-29 for cycling
    };

    const handleToggleExpand = () => {
        if (hasChildren) {
            onToggleExpand(section.id);
        }
    };

    const handleRemoveSection = () => {
        setDeleteModalOpened(true);
    };

    const handleDeleteModalClose = () => {
        setDeleteModalOpened(false);
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

    const handleSectionClick = () => {
        if (onSectionSelect) {
            onSectionSelect(section.id);
        }
    };

    return (
        <>
            <div style={getIndentationStyle()} className={styles.indentationWrapper}>
                <Paper
                    ref={ref}
                    className={`${styles.sectionItem} ${getLevelClass()} ${isSelected ? styles.selected : ''} ${isFocused ? styles.focused : ''}`}
                    onClick={handleSectionClick}
                    data-section-id={section.id}
                >
                    <Group gap="xs" p="xs" wrap="nowrap" align="center" className={styles.compactGroup}>
                        {/* Drag Handle - properly connected */}
                        <div {...dragHandleProps}>
                            <ActionIcon
                                variant="subtle"
                                size="xs"
                                color="gray"
                                className={`${styles.dragHandle} ${isDragActive ? 'opacity-100' : 'opacity-60'} ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
                            >
                                <IconGripVertical />
                            </ActionIcon>
                        </div>

                        {/* Expand/Collapse Toggle - only show if has children */}
                        {hasChildren ? (
                            <ActionIcon
                                variant="subtle"
                                size="xs"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleToggleExpand();
                                }}
                                className={styles.expandButton}
                            >
                                {isExpanded ? <IconChevronDown  /> : <IconChevronRight  />}
                            </ActionIcon>
                        ) : (
                            <Box w={12} />
                        )}

                        {/* Section Icon */}
                        <Box className={styles.sectionIcon}>
                            {getSectionIcon()}
                        </Box>

                        {/* Section Info - Ultra Compact */}
                        <Box className={styles.sectionInfo}>
                            <Group gap={3} wrap="nowrap" align="center">
                                <Text 
                                    size="xs" 
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

                        {/* Action Buttons - Ultra compact and hover-based */}
                        <Group gap={1} className={styles.actionButtons}>
                            {canHaveChildren && (
                                <Tooltip label="Add child" position="top" withArrow>
                                    <ActionIcon
                                        size="xs"
                                        variant="subtle"
                                        color="green"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleAddChild();
                                        }}
                                        className={styles.actionButton}
                                    >
                                        <IconPlus />
                                    </ActionIcon>
                                </Tooltip>
                            )}
                            
                            <Tooltip label="Add above" position="top" withArrow>
                                <ActionIcon
                                    size="xs"
                                    variant="subtle"
                                    color="blue"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleAddSiblingAbove();
                                    }}
                                    className={styles.actionButton}
                                >
                                    <IconPlus />
                                </ActionIcon>
                            </Tooltip>
                            
                            <Tooltip label="Add below" position="top" withArrow>
                                <ActionIcon
                                    size="xs"
                                    variant="subtle"
                                    color="blue"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleAddSiblingBelow();
                                    }}
                                    className={styles.actionButton}
                                >
                                    <IconPlus />
                                </ActionIcon>
                            </Tooltip>

                            <Tooltip label="Delete" position="top" withArrow>
                                <ActionIcon
                                    size="xs"
                                    variant="subtle"
                                    color="red"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleRemoveSection();
                                    }}
                                    className={styles.actionButton}
                                >
                                    <IconTrash />
                                </ActionIcon>
                            </Tooltip>
                        </Group>
                    </Group>
                </Paper>
            </div>

            {/* Delete Section Modal */}
            <DeleteSectionModal
                opened={deleteModalOpened}
                onClose={handleDeleteModalClose}
                section={section}
                keyword={keyword}
            />
        </>
    );
});

PageSection.displayName = 'PageSection'; 