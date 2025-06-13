'use client';

import { Group, Text, Badge, ActionIcon, Tooltip } from '@mantine/core';
import { 
    IconGripVertical,
    IconChevronDown,
    IconChevronRight,
    IconPlus,
    IconCopy,
    IconTrash
} from '@tabler/icons-react';
import { IPageField } from '../../../../../types/common/pages.type';
import styles from './PageSections.module.css';

interface ISectionHeaderProps {
    section: IPageField;
    level: number;
    hasChildren: boolean;
    isExpanded: boolean;
    onToggleExpand: (sectionId: number) => void;
    dragHandleProps: any;
    isDragging: boolean;
    isValidDropTarget: boolean;
    isDragActive: boolean;
    isBeingDragged: boolean;
}

export function SectionHeader({
    section,
    level,
    hasChildren,
    isExpanded,
    onToggleExpand,
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
        <Group 
            justify="space-between" 
            wrap="nowrap" 
            gap="xs"
            p="xs"
            style={{
                borderRadius: '4px',
                backgroundColor: isValidDropTarget && isDragActive ? 'var(--mantine-color-green-0)' : 
                                isBeingDragged ? 'var(--mantine-color-blue-0)' : undefined,
                border: isValidDropTarget && isDragActive ? '2px solid var(--mantine-color-green-6)' : 
                        isBeingDragged ? '2px solid var(--mantine-color-blue-6)' : '1px solid var(--mantine-color-gray-3)',
                opacity: isDragActive && !Boolean(section.can_have_children) ? 0.3 : 1,
                cursor: isDragging ? 'grabbing' : 'default'
            }}
        >
            <Group gap="xs" style={{ flex: 1, minWidth: 0 }}>
                {/* Drag Handle */}
                <ActionIcon 
                    variant="subtle" 
                    size="xs" 
                    className={styles.dragHandle}
                    style={{ cursor: 'grab', flexShrink: 0 }}
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
                        <Text fw={500} size="xs" className={styles.truncateText} style={{ minWidth: 0, flex: 1 }}>
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
                    {Boolean(section.can_have_children) && (
                        <Badge size="xs" variant="dot" color="blue" style={{ flexShrink: 0 }} title="Can accept children">
                            📁
                        </Badge>
                    )}
                </Group>
            </Group>

            {/* Action Buttons */}
            <Group gap={4} style={{ flexShrink: 0 }}>
                {Boolean(section.can_have_children) && (
                    <ActionIcon variant="subtle" size="xs" color="blue" title="Add child section">
                        <IconPlus size={12} />
                    </ActionIcon>
                )}
                <ActionIcon variant="subtle" size="xs" color="gray" title="Copy section">
                    <IconCopy size={12} />
                </ActionIcon>
                <ActionIcon variant="subtle" size="xs" color="red" title="Delete section">
                    <IconTrash size={12} />
                </ActionIcon>
            </Group>
        </Group>
    );
} 