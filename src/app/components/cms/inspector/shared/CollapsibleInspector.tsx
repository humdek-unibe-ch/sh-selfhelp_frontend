'use client';

import {
    Box,
    Group,
    ActionIcon,
    Collapse,
    Divider,
    Title
} from '@mantine/core';
import {
    IconChevronDown,
    IconChevronUp
} from '@tabler/icons-react';
import { useState, useEffect, ReactNode, memo } from 'react';
import { useInspectorStore } from '../../../../../store/inspectorStore';

interface ICollapsibleInspectorProps {
    title: string;
    children: ReactNode;
    inspectorType: string;
    sectionName: string;
    defaultExpanded?: boolean;
    className?: string;
}

export const CollapsibleInspector = memo<ICollapsibleInspectorProps>(
    function CollapsibleInspector({
        title,
        children,
        inspectorType,
        sectionName,
        defaultExpanded = true,
        className
    }) {
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
    },
    // Custom comparison for optimal performance
    (prevProps, nextProps) => {
        return (
            prevProps.title === nextProps.title &&
            prevProps.inspectorType === nextProps.inspectorType &&
            prevProps.sectionName === nextProps.sectionName &&
            prevProps.defaultExpanded === nextProps.defaultExpanded &&
            prevProps.className === nextProps.className
            // Children comparison handled by React's default behavior
        );
    }
);
