'use client';

import {
    Stack,
    ScrollArea,
    Paper,
    Title,
    Text,
    Alert
} from '@mantine/core';
import { IconFile } from '@tabler/icons-react';
import { ReactNode } from 'react';

interface IInspectorLayoutProps {
    header: ReactNode;
    children: ReactNode;
    emptyState?: {
        title: string;
        description: string;
        icon?: ReactNode;
    };
    loading?: boolean;
    error?: string | null;
    loadingText?: string;
}

export function InspectorLayout({
    header,
    children,
    emptyState,
    loading = false,
    error = null,
    loadingText = "Loading details..."
}: IInspectorLayoutProps) {
    // Loading state
    if (loading) {
        return (
            <Paper p="xl" withBorder>
                <Stack align="center" gap="md">
                    <Text>{loadingText}</Text>
                </Stack>
            </Paper>
        );
    }

    // Error state
    if (error) {
        return (
            <Paper p="xl" withBorder>
                <Alert color="red" title="Error loading details">
                    {error}
                </Alert>
            </Paper>
        );
    }

    // Empty state
    if (emptyState) {
        return (
            <Paper p="xl" withBorder>
                <Stack align="center" gap="md">
                    {emptyState.icon || <IconFile size="3rem" color="var(--mantine-color-gray-5)" />}
                    <Title order={3} c="dimmed">{emptyState.title}</Title>
                    <Text c="dimmed" ta="center">
                        {emptyState.description}
                    </Text>
                </Stack>
            </Paper>
        );
    }

    // Main layout
    return (
        <Stack gap={0} h="100%">
            {/* Fixed Header */}
            {header}

            {/* Scrollable Content */}
            <ScrollArea flex={1}>
                <Stack gap="lg" p="md">
                    {children}
                </Stack>
            </ScrollArea>
        </Stack>
    );
} 