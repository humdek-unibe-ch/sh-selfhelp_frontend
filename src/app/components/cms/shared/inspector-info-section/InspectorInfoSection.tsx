'use client';

import {
    Paper,
    Box,
    Group,
    Text,
    Stack,
    Badge
} from '@mantine/core';
import { IconInfoCircle } from '@tabler/icons-react';
import { ReactNode } from 'react';

interface IInfoItem {
    label: string;
    value: string | number;
    variant?: 'text' | 'code' | 'badge';
    color?: string;
}

interface IInspectorInfoSectionProps {
    title?: string;
    infoItems: IInfoItem[];
    badges?: Array<{
        label: string;
        color: string;
        variant?: 'light' | 'filled' | 'outline';
    }>;
    children?: ReactNode;
    className?: string;
}

export function InspectorInfoSection({
    title = "Information",
    infoItems,
    badges = [],
    children,
    className
}: IInspectorInfoSectionProps) {
    return (
        <div className={`aside-section ${className || ''}`}>
            <Paper withBorder={false} style={{ backgroundColor: 'light-dark(var(--mantine-color-blue-0), var(--mantine-color-blue-9))' }}>
                <Box p="sm">
                    <Group gap="xs" mb="sm">
                        <IconInfoCircle size={16} style={{ color: 'var(--mantine-color-blue-6)' }} />
                        <Text size="sm" fw={500} c="blue">{title}</Text>
                    </Group>
                    
                    <Stack gap="xs">
                        {children}
                        
                        {infoItems.length > 0 && (
                            <Group gap="md" wrap="wrap">
                                {infoItems.map((item, index) => (
                                    <Box key={index}>
                                        <Text size="xs" fw={500} c="dimmed">{item.label}</Text>
                                        {item.variant === 'code' ? (
                                            <Text size="sm" style={{ fontFamily: 'monospace', color: 'var(--mantine-color-text)' }}>
                                                {item.value}
                                            </Text>
                                        ) : item.variant === 'badge' ? (
                                            <Badge size="sm" color={item.color} variant="light">
                                                {item.value}
                                            </Badge>
                                        ) : (
                                            <Text size="sm" style={{ color: 'var(--mantine-color-text)' }}>
                                                {item.value}
                                            </Text>
                                        )}
                                    </Box>
                                ))}
                            </Group>
                        )}
                        
                        {badges.length > 0 && (
                            <Group gap="xs" mt="xs">
                                {badges.map((badge, index) => (
                                    <Badge 
                                        key={index}
                                        color={badge.color} 
                                        variant={badge.variant || "light"} 
                                        size="sm"
                                    >
                                        {badge.label}
                                    </Badge>
                                ))}
                            </Group>
                        )}
                    </Stack>
                </Box>
            </Paper>
        </div>
    );
}
