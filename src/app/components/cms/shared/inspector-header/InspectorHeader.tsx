'use client';

import {
    Paper,
    Group,
    Title,
    Badge,
    Button,
    Stack
} from '@mantine/core';
import { ReactNode } from 'react';

interface IInspectorHeaderProps {
    title: string;
    badges?: Array<{
        label: string;
        color: string;
        variant?: 'light' | 'filled' | 'outline';
    }>;
    actions?: Array<{
        label: string;
        icon: ReactNode;
        onClick: () => void;
        variant?: 'filled' | 'light' | 'outline';
        color?: string;
        loading?: boolean;
        disabled?: boolean;
    }>;
}

export function InspectorHeader({
    title,
    badges = [],
    actions = []
}: IInspectorHeaderProps) {
    return (
        <Paper p="md" withBorder className="border-b-0">
            <Group justify="space-between" align="center">
                <Group gap="xs">
                    <Title order={2}>{title}</Title>
                    {badges.map((badge, index) => (
                        <Badge
                            key={index}
                            color={badge.color}
                            variant={badge.variant || 'light'}
                        >
                            {badge.label}
                        </Badge>
                    ))}
                </Group>
                
                {actions.length > 0 && (
                    <Group gap="xs">
                        {actions.map((action, index) => (
                            <Button
                                key={index}
                                leftSection={action.icon}
                                onClick={action.onClick}
                                variant={action.variant || 'filled'}
                                color={action.color}
                                size="sm"
                                loading={action.loading}
                                disabled={action.disabled}
                            >
                                {action.label}
                            </Button>
                        ))}
                    </Group>
                )}
            </Group>
        </Paper>
    );
} 