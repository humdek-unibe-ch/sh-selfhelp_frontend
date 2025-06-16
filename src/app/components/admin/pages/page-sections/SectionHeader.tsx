'use client';

import { Group, Text, Badge, ActionIcon, Tooltip, Box } from '@mantine/core';
import { 
    IconGripVertical,
    IconChevronDown,
    IconChevronRight,
    IconPlus,
    IconCopy,
    IconTrash,
    IconArrowUp,
    IconArrowDown,
    IconEye,
    IconExternalLink,
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
            {/* Buttons Holder - Only visible on hover */}
            <Box className={headerStyles.buttonsHolder}>
                {/* Left side - Add sibling buttons */}
                <Box className={headerStyles.leftAddButtons}>
                    {onAddSiblingAbove && !isBeingDragged && (
                        <ActionIcon
                            variant="filled"
                            size="sm"
                            color="green"
                            onClick={() => onAddSiblingAbove(section.id, parentId)}
                            title="Add new section above"
                            className={`${headerStyles.sectionBtn} ${headerStyles.iconButtonWhite}`}
                        >
                            <IconPlus size={12} />
                        </ActionIcon>
                    )}
                    {onAddSiblingBelow && !isBeingDragged && (
                        <ActionIcon
                            variant="filled"
                            size="sm"
                            color="green"
                            onClick={() => onAddSiblingBelow(section.id, parentId)}
                            title="Add new section below"
                            className={`${headerStyles.sectionBtn} ${headerStyles.iconButtonWhite}`}
                        >
                            <IconPlus size={12} />
                        </ActionIcon>
                    )}
                </Box>

                {/* Left side grouped menu - Eye and Square buttons */}
                <Box className={headerStyles.leftMenuHolder}>
                    <Box className={headerStyles.menuHolder}>
                        <ActionIcon
                            variant="subtle"
                            size="xs"
                            color="blue"
                            onClick={() => onInspectSection?.(section.id)}
                            title="Show Section Fields"
                            className={headerStyles.menuBtn}
                        >
                            <IconEye size={10} />
                        </ActionIcon>
                        <ActionIcon
                            variant="subtle"
                            size="xs"
                            color="blue"
                            onClick={() => onNavigateToSection?.(section.id)}
                            title="Go To Section"
                            className={headerStyles.menuBtn}
                        >
                            <IconExternalLink size={10} />
                        </ActionIcon>
                    </Box>
                </Box>

                {/* Center - Move up/down buttons */}
                <Box className={headerStyles.centerButtons}>
                    <ActionIcon
                        variant="filled"
                        size="sm"
                        color="blue"
                        onClick={() => onMoveUp?.(section.id, parentId)}
                        title="Move the section up"
                        className={`${headerStyles.sectionBtn} ${headerStyles.iconButtonWhite}`}
                    >
                        <IconChevronUp size={12} />
                    </ActionIcon>
                    <ActionIcon
                        variant="filled"
                        size="sm"
                        color="blue"
                        onClick={() => onMoveDown?.(section.id, parentId)}
                        title="Move the section down"
                        className={`${headerStyles.sectionBtn} ${headerStyles.iconButtonWhite}`}
                    >
                        <IconChevronDownMove size={12} />
                    </ActionIcon>
                </Box>

                {/* Right side - Remove button */}
                <Box className={headerStyles.rightButtons}>
                    <ActionIcon
                        variant="filled"
                        size="sm"
                        color="red"
                        onClick={() => onRemoveSection(section.id, parentId)}
                        title="Remove the section"
                        className={`${headerStyles.sectionBtn} ${headerStyles.iconButtonWhite}`}
                    >
                        <IconTrash size={12} />
                    </ActionIcon>
                </Box>
            </Box>

            {/* Main Section Content */}
            <Group 
                justify="space-between" 
                wrap="nowrap" 
                gap="xs"
                p="xs"
            >
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

                    {/* Expand/Collapse Button - Hide when being dragged */}
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
                        <div style={{ width: 20 }} /> // Spacer for alignment
                    )}

                    {/* Section Info */}
                    <Group gap="xs" style={{ flex: 1, minWidth: 0 }}>
                        <Tooltip label={`${section.name} | Path: ${section.path} | ID: ${section.id}`} position="top" withArrow>
                            <Text fw={500} size="xs" className={`${styles.truncateText} ${headerStyles.truncateText}`} style={{ minWidth: 0, flex: 1 }}>
                                {getSectionTitle(section)}
                            </Text>
                        </Tooltip>
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

                {/* Child Creation Button (Inside Section) */}
                <Group gap={4} style={{ flexShrink: 0 }}>
                    {onAddChildSection && !!section.can_have_children && (
                        <Tooltip label="Add child section">
                            <ActionIcon
                                variant="light"
                                size="sm"
                                color="green"
                                onClick={() => onAddChildSection(section.id)}
                                style={{
                                    backgroundColor: 'var(--mantine-color-green-0)',
                                    border: '1px dashed var(--mantine-color-green-5)'
                                }}
                            >
                                <IconPlus size={16} />
                            </ActionIcon>
                        </Tooltip>
                    )}
                </Group>
            </Group>
        </Box>
    );
} 