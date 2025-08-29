'use client';

import { Group, Text, Tooltip, ActionIcon, Badge, Box } from '@mantine/core';
import { IconInfoCircle } from '@tabler/icons-react';
import styles from './FieldLabelWithTooltip.module.css';

interface FieldLabelWithTooltipProps {
    /** The label text */
    label: string;
    /** The tooltip/help text */
    tooltip: string;
    /** Whether the field is required */
    required?: boolean;
    /** The locale code to display on the right side */
    locale?: string;
}

export function FieldLabelWithTooltip({ 
    label, 
    tooltip, 
    required = false,
    locale
}: FieldLabelWithTooltipProps) {
    return (
        <Box className={styles.labelContainer}>
            <Group 
                className={styles.labelWrapper}
                justify="space-between" 
                wrap="nowrap" 
                w="100%"
            >
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
                            className="cursor-help"
                        >
                            <IconInfoCircle size="0.75rem" />
                        </ActionIcon>
                    </Tooltip>
                </Group>
                {locale && (
                    <Badge 
                        variant="light" 
                        color="gray" 
                        size="xs"
                        style={{ flexShrink: 0 }}
                    >
                        {locale}
                    </Badge>
                )}
            </Group>
        </Box>
    );
} 