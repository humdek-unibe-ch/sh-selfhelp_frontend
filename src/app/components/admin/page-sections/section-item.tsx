'use client';

import { useState } from 'react';
import {
    Paper,
    Group,
    Text,
    ActionIcon,
    Stack,
    Badge,
    Box
} from '@mantine/core';
import {
    IconArrowUp,
    IconArrowDown,
    IconCopy,
    IconTrash,
    IconChevronDown,
    IconChevronRight
} from '@tabler/icons-react';
import { IPageField } from '../../../../types/common/pages.type';

interface SectionItemProps {
    section: IPageField;
    isTopLevel?: boolean;
    level?: number;
}

export function SectionItem({ section, isTopLevel = false, level = 0 }: SectionItemProps) {
    const [expanded, setExpanded] = useState(true);
    const hasChildren = section.children && section.children.length > 0;

    // Get style-specific display name
    const getSectionTitle = (section: IPageField) => {
        const nameParts = section.name.split('-');
        // Remove timestamp prefix if present (e.g., "1746623233-entryList" -> "entryList")
        const displayName = nameParts.length > 1 ? nameParts[1] : section.name;
        return displayName;
    };

    // Handle section actions
    const handleMoveUp = (e: React.MouseEvent) => {
        e.stopPropagation();
    };

    const handleMoveDown = (e: React.MouseEvent) => {
        e.stopPropagation();
    };

    const handleCopy = (e: React.MouseEvent) => {
        e.stopPropagation();
    };

    const handleDelete = (e: React.MouseEvent) => {
        e.stopPropagation();
    };

    const toggleExpand = () => {
        setExpanded(!expanded);
    };

    return (
        <Box>
            <Paper
                withBorder
                p="md"
                shadow="xs"
                style={{
                    marginLeft: isTopLevel ? 0 : `${level * 20}px`,
                    borderLeft: !isTopLevel ? '3px solid var(--mantine-color-blue-4)' : undefined
                }}
            >
                <Group justify="space-between" wrap="nowrap" onClick={hasChildren ? toggleExpand : undefined} style={{ cursor: hasChildren ? 'pointer' : 'default' }}>
                    <Group gap="xs">
                        {hasChildren && (
                            expanded ? <IconChevronDown size={16} /> : <IconChevronRight size={16} />
                        )}
                        <Text fw={500}>{getSectionTitle(section)}</Text>
                        <Badge size="sm" color="gray">{section.style_name}</Badge>
                    </Group>
                    <Group gap="xs">
                        <ActionIcon variant="subtle" size="sm" onClick={handleMoveUp}>
                            <IconArrowUp size={16} />
                        </ActionIcon>
                        <ActionIcon variant="subtle" size="sm" onClick={handleMoveDown}>
                            <IconArrowDown size={16} />
                        </ActionIcon>
                        <ActionIcon variant="subtle" size="sm" onClick={handleCopy}>
                            <IconCopy size={16} />
                        </ActionIcon>
                        <ActionIcon variant="subtle" color="red" size="sm" onClick={handleDelete}>
                            <IconTrash size={16} />
                        </ActionIcon>
                    </Group>
                </Group>
            </Paper>

            {/* Render children if expanded */}
            {hasChildren && expanded && (
                <Stack gap="xs" mt="xs">
                    {section.children.map((child, index) => (
                        <SectionItem
                            key={`${child.id}-${child.path}-${index}`}
                            section={child}
                            isTopLevel={false}
                            level={level + 1}
                        />
                    ))}
                </Stack>
            )}
        </Box>
    );
}
