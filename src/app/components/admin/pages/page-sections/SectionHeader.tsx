'use client';

import { Group, Text, Badge, ActionIcon, Tooltip, Box, Button } from '@mantine/core';
import { 
    IconGripVertical,
    IconChevronDown,
    IconChevronRight,
    IconPlus,
    IconTrash,
    IconChevronUp,
    IconChevronDown as IconChevronDownMove
} from '@tabler/icons-react';
import { IPageField } from '../../../../../types/common/pages.type';
import styles from './PageSections.module.css';
import headerStyles from './SectionHeader.module.css';

interface ISectionHeaderProps {
    section: IPageField;
    level: number;
    parentId: number | null;
    hasChildren: boolean;
    isExpanded: boolean;
    onToggleExpand: (sectionId: number) => void;
    onRemoveSection: (sectionId: number, parentId: number | null) => void;
    onAddChildSection?: (parentSectionId: number) => void;
    onAddSiblingAbove?: (referenceSectionId: number, parentId: number | null) => void;
    onAddSiblingBelow?: (referenceSectionId: number, parentId: number | null) => void;
    onMoveUp?: (sectionId: number, parentId: number | null) => void;
    onMoveDown?: (sectionId: number, parentId: number | null) => void;
    onInspectSection?: (sectionId: number) => void;
    onNavigateToSection?: (sectionId: number) => void;
    dragHandleProps: any;
    isDragging: boolean;
    isValidDropTarget: boolean;
    isDragActive: boolean;
    isBeingDragged: boolean;
}

export function SectionHeader({
    section,
    level,
    parentId,
    hasChildren,
    isExpanded,
    onToggleExpand,
    onRemoveSection,
    onAddChildSection,
    onAddSiblingAbove,
    onAddSiblingBelow,
    onMoveUp,
    onMoveDown,
    onInspectSection,
    onNavigateToSection,
    dragHandleProps,
    isDragging,
    isValidDropTarget,
    isDragActive,
    isBeingDragged
}: ISectionHeaderProps) {
    const getSectionTitle = (section: IPageField) => {
        const nameParts = section.name.split('-');
        return nameParts.length > 1 ? nameParts[1] : section.name;
    };

    const handleRemoveClick = () => {
        if (window.confirm(`Are you sure you want to remove section "${getSectionTitle(section)}"?`)) {
            onRemoveSection(section.id, parentId);
        }
    };

    return (
        <Box
            className={headerStyles.sectionContainer}
            style={{
                backgroundColor: isValidDropTarget && isDragActive ? 'var(--mantine-color-green-0)' : 
                                isBeingDragged ? 'var(--mantine-color-blue-0)' : undefined,
                opacity: isDragActive && !section.can_have_children ? 0.3 : 1,
                cursor: isDragging ? 'grabbing' : 'default'
            }}
        >
            <Group justify="space-between" wrap="nowrap" gap="xs" p="xs">
                {/* Left Side - Drag Handle + Expand/Collapse + Section Info */}
                <Group gap="xs" style={{ flex: 1, minWidth: 0 }}>
                    {/* Drag Handle */}
                    <ActionIcon 
                        variant="subtle" 
                        size="xs" 
                        className={`${styles.dragHandle} ${headerStyles.dragHandle}`}
                        style={{ flexShrink: 0 }}
                        {...dragHandleProps}
                    >
                        <IconGripVertical size={12} />
                    </ActionIcon>

                    {/* Expand/Collapse Button */}
                    {hasChildren && !isBeingDragged ? (
                        <ActionIcon 
                            variant="subtle" 
                            size="xs"
                            style={{ flexShrink: 0 }}
                            onClick={() => onToggleExpand(section.id)}
                        >
                            {isExpanded ? <IconChevronDown size={12} /> : <IconChevronRight size={12} />}
                        </ActionIcon>
                    ) : (
                        <div style={{ width: 20 }} />
                    )}

                    {/* Section Info */}
                    <Group gap="xs" style={{ flex: 1, minWidth: 0 }}>
                        <Tooltip label={`${section.name} | Path: ${section.path}`} position="top" withArrow>
                            <Text fw={500} size="xs" className={`${styles.truncateText} ${headerStyles.truncateText}`} style={{ minWidth: 0, flex: 1 }}>
                                {getSectionTitle(section)}
                            </Text>
                        </Tooltip>
                        
                        {/* Section ID Badge */}
                        <Badge size="xs" variant="outline" color="gray" style={{ flexShrink: 0 }}>
                            ID: {section.id}
                        </Badge>
                        
                        <Badge size="xs" variant="light" color="blue" style={{ flexShrink: 0 }}>
                            {section.style_name}
                        </Badge>
                        
                        <Badge size="xs" variant="outline" color="gray" style={{ flexShrink: 0 }}>
                            {section.position}
                        </Badge>
                        
                        {hasChildren && (
                            <Badge 
                                size="xs" 
                                variant="dot" 
                                color={isBeingDragged ? "orange" : "green"}
                                style={{ flexShrink: 0 }} 
                                title={isBeingDragged ? 
                                    `Moving with ${section.children?.length || 0} children` : 
                                    `Has ${section.children?.length || 0} children (will move together)`
                                }
                            >
                                {isBeingDragged ? `+${section.children?.length || 0}` : section.children?.length || 0}
                            </Badge>
                        )}
                        
                        {section.can_have_children && (
                            <Badge size="xs" variant="dot" color="blue" style={{ flexShrink: 0 }} title="Can accept children">
                                📁
                            </Badge>
                        )}
                    </Group>
                </Group>

                {/* Right Side - Action Buttons */}
                <Group gap={4} style={{ flexShrink: 0 }}>
                    {/* Add Sibling Above */}
                    {onAddSiblingAbove && (
                        <Tooltip label="Add section above">
                            <ActionIcon
                                variant="light"
                                size="xs"
                                color="green"
                                onClick={() => onAddSiblingAbove(section.id, parentId)}
                                className={headerStyles.actionBtn}
                            >
                                <IconChevronUp size={10} />
                            </ActionIcon>
                        </Tooltip>
                    )}

                    {/* Add Sibling Below */}
                    {onAddSiblingBelow && (
                        <Tooltip label="Add section below">
                            <ActionIcon
                                variant="light"
                                size="xs"
                                color="green"
                                onClick={() => onAddSiblingBelow(section.id, parentId)}
                                className={headerStyles.actionBtn}
                            >
                                <IconChevronDownMove size={10} />
                            </ActionIcon>
                        </Tooltip>
                    )}

                    {/* Add Child Section */}
                    {onAddChildSection && section.can_have_children && (
                        <Tooltip label="Add child section">
                            <ActionIcon
                                variant="light"
                                size="xs"
                                color="blue"
                                onClick={() => onAddChildSection(section.id)}
                                className={headerStyles.actionBtn}
                            >
                                <IconPlus size={10} />
                            </ActionIcon>
                        </Tooltip>
                    )}

                    {/* Remove Section */}
                    <Tooltip label="Remove section">
                        <ActionIcon
                            variant="light"
                            size="xs"
                            color="red"
                            onClick={handleRemoveClick}
                            className={headerStyles.actionBtn}
                        >
                            <IconTrash size={10} />
                        </ActionIcon>
                    </Tooltip>
                </Group>
            </Group>
        </Box>
    );
} 