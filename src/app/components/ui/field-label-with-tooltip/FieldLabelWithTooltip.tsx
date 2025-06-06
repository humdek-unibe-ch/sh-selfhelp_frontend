'use client';

import { Group, Text, Tooltip, ActionIcon } from '@mantine/core';
import { IconInfoCircle } from '@tabler/icons-react';

interface FieldLabelWithTooltipProps {
    /** The label text */
    label: string;
    /** The tooltip/help text */
    tooltip: string;
    /** Whether the field is required */
    required?: boolean;
}

export function FieldLabelWithTooltip({ 
    label, 
    tooltip, 
    required = false 
}: FieldLabelWithTooltipProps) {
    return (
        <Group gap="xs" wrap="nowrap">
            <Text size="sm" fw={500}>
                {label}
                {required && <Text span c="red"> *</Text>}
            </Text>
            <Tooltip 
                label={tooltip} 
                multiline 
                w={300}
                position="top"
                withArrow
            >
                <ActionIcon 
                    variant="subtle" 
                    size="xs" 
                    color="gray"
                    style={{ cursor: 'help' }}
                >
                    <IconInfoCircle size="0.75rem" />
                </ActionIcon>
            </Tooltip>
        </Group>
    );
} 