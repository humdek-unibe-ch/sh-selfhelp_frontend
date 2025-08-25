'use client';

import {
    Paper,
    Box,
    Group,
    Text,
    ActionIcon,
    Collapse,
    Divider,
    Title
} from '@mantine/core';
import {
    IconChevronDown,
    IconChevronUp
} from '@tabler/icons-react';
import { useState, useEffect, ReactNode } from 'react';
import { useInspectorStore } from '../../../../../store/inspectorStore';

interface ICollapsibleInspectorSectionProps {
    title: string;
    children: ReactNode;
    inspectorType: string;
    sectionName: string;
    defaultExpanded?: boolean;
    className?: string;
}

export function CollapsibleInspectorSection({
    title,
    children,
    inspectorType,
    sectionName,
    defaultExpanded = true,
    className
}: ICollapsibleInspectorSectionProps) {
    const { isCollapsed, setCollapsed } = useInspectorStore();
    
    // Get persistent state, fallback to defaultExpanded if no stored state
    const [expanded, setExpanded] = useState(() => {
        const storedCollapsed = isCollapsed(inspectorType, sectionName);
        return storedCollapsed ? false : defaultExpanded;
    });
    
    // Update persistent state when expanded changes
    useEffect(() => {
        setCollapsed(inspectorType, sectionName, !expanded);
    }, [expanded, inspectorType, sectionName, setCollapsed]);

    const handleToggle = () => {
        setExpanded(!expanded);
    };

    return (
        <div className={`aside-section ${className || ''}`}>
            <Group 
                p="sm" 
                justify="space-between" 
                style={{ cursor: 'pointer' }}
                onClick={handleToggle}
            >
                <Title order={5}>{title}</Title>
                <ActionIcon variant="subtle" size="sm">
                    {expanded ? <IconChevronUp size="1rem" /> : <IconChevronDown size="1rem" />}
                </ActionIcon>
            </Group>
            
            <Collapse in={expanded}>
                <Divider />
                <Box p="sm">
                    {children}
                </Box>
            </Collapse>
        </div>
    );
}
