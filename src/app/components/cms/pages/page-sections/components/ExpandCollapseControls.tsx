'use client';

import { memo } from 'react';
import { Group, ActionIcon, Tooltip } from '@mantine/core';
import { IconChevronUp, IconChevronDown } from '@tabler/icons-react';

interface IExpandCollapseControlsProps {
    onExpandAll: () => void;
    onCollapseAll: () => void;
}

export const ExpandCollapseControls = memo<IExpandCollapseControlsProps>(
    function ExpandCollapseControls({ onExpandAll, onCollapseAll }) {
        return (
            <Group gap={4}>
                <Tooltip label="Expand All">
                    <ActionIcon 
                        size="sm" 
                        variant="subtle" 
                        color="blue"
                        onClick={onExpandAll}
                    >
                        <IconChevronDown size={12} />
                    </ActionIcon>
                </Tooltip>
                <Tooltip label="Collapse All">
                    <ActionIcon 
                        size="sm" 
                        variant="subtle" 
                        color="blue"
                        onClick={onCollapseAll}
                    >
                        <IconChevronUp size={12} />
                    </ActionIcon>
                </Tooltip>
            </Group>
        );
    }
    // No custom comparison needed - functions are stable with useCallback
);
