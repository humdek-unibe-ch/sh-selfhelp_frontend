'use client';

import {
    Paper,
    Box,
    Group,
    Text,
    ActionIcon,
    Collapse,
    Stack
} from '@mantine/core';
import {
    IconChevronDown,
    IconChevronUp
} from '@tabler/icons-react';
import { ReactNode } from 'react';
import { useInspectorStore, INSPECTOR_TYPES, INSPECTOR_SECTIONS } from '../../../../../store/inspectorStore';

interface ICollapsibleSectionProps {
    title: string;
    children: ReactNode;
    inspectorType: string;
    sectionName: string;
    defaultExpanded?: boolean;
    className?: string;
}

export function CollapsibleSection({
    title,
    children,
    inspectorType,
    sectionName,
    defaultExpanded = true,
    className
}: ICollapsibleSectionProps) {
    const { isCollapsed, setCollapsed } = useInspectorStore();

    // Check if this section is collapsed, default to not collapsed if not found
    const collapsed = isCollapsed(inspectorType, sectionName) ?? !defaultExpanded;

    const handleToggle = () => {
        setCollapsed(inspectorType, sectionName, !collapsed);
    };

    return (
        <Paper withBorder className={className}>
            <Box p="md">
                <Group justify="space-between" mb="md" className="cursor-pointer" onClick={handleToggle}>
                    <Text fw={500}>{title}</Text>
                    <ActionIcon variant="subtle">
                        {collapsed ? <IconChevronDown size={16} /> : <IconChevronUp size={16} />}
                    </ActionIcon>
                </Group>

                <Collapse in={!collapsed}>
                    <Stack gap="md">
                        {children}
                    </Stack>
                </Collapse>
            </Box>
        </Paper>
    );
}
