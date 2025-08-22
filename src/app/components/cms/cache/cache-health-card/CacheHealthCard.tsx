/**
 * Cache Health Card Component
 * Displays cache health status, hit rate, and recommendations
 */

'use client';

import React from 'react';
import { Card, Title, Text, Stack, Group, Badge, Progress, Alert, List, ThemeIcon, Skeleton } from '@mantine/core';
import { IconCheck, IconAlertTriangle, IconExclamationMark, IconInfoCircle } from '@tabler/icons-react';
import type { ICacheHealthResponse } from '../../../../../types/responses/admin/cache.types';

interface ICacheHealthCardProps {
    health?: ICacheHealthResponse;
    isLoading?: boolean;
}

export function CacheHealthCard({ health, isLoading }: ICacheHealthCardProps) {
    if (isLoading) {
        return (
            <Card shadow="sm" padding="lg" radius="md" withBorder h="100%">
                <Stack gap="md">
                    <Skeleton height={24} width="60%" />
                    <Skeleton height={20} width="40%" />
                    <Skeleton height={8} />
                    <Skeleton height={60} />
                    <Skeleton height={40} />
                </Stack>
            </Card>
        );
    }

    if (!health) {
        return (
            <Card shadow="sm" padding="lg" radius="md" withBorder h="100%">
                <Alert
                    icon={<IconInfoCircle size={16} />}
                    title="No Health Data"
                    color="gray"
                    variant="light"
                >
                    Cache health information is not available.
                </Alert>
            </Card>
        );
    }

    const getStatusIcon = () => {
        switch (health.status) {
            case 'excellent':
            case 'good':
                return <IconCheck size={16} />;
            case 'fair':
                return <IconInfoCircle size={16} />;
            case 'poor':
                return <IconAlertTriangle size={16} />;
            default:
                return <IconExclamationMark size={16} />;
        }
    };

    const getPriorityIcon = (priority: string) => {
        switch (priority) {
            case 'critical':
                return <IconExclamationMark size={14} />;
            case 'high':
                return <IconAlertTriangle size={14} />;
            case 'medium':
                return <IconInfoCircle size={14} />;
            default:
                return <IconCheck size={14} />;
        }
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'critical':
                return 'red';
            case 'high':
                return 'orange';
            case 'medium':
                return 'yellow';
            default:
                return 'blue';
        }
    };

    return (
        <Card shadow="sm" padding="lg" radius="md" withBorder h="100%">
            <Stack gap="md">
                <Group justify="space-between" align="flex-start">
                    <Title order={3}>Cache Health</Title>
                    <Badge
                        color={health.color}
                        variant="light"
                        leftSection={getStatusIcon()}
                        size="lg"
                    >
                        {health.status.charAt(0).toUpperCase() + health.status.slice(1)}
                    </Badge>
                </Group>

                <Stack gap="xs">
                    <Group justify="space-between">
                        <Text size="sm" c="dimmed">Hit Rate</Text>
                        <Text size="sm" fw={600}>{health.hit_rate.toFixed(1)}%</Text>
                    </Group>
                    <Progress
                        value={health.hit_rate}
                        color={health.color}
                        size="lg"
                        radius="md"
                    />
                </Stack>

                <Group justify="space-between">
                    <Text size="sm" c="dimmed">Total Operations</Text>
                    <Text size="sm" fw={600}>{health.total_operations.toLocaleString()}</Text>
                </Group>

                {health.recommendations.length > 0 && (
                    <Stack gap="xs">
                        <Text size="sm" fw={600}>Recommendations</Text>
                        <List spacing="xs" size="sm" withPadding={false}>
                            {health.recommendations.slice(0, 3).map((rec, index) => (
                                <List.Item
                                    key={index}
                                    icon={
                                        <ThemeIcon
                                            color={getPriorityColor(rec.priority)}
                                            size={18}
                                            radius="xl"
                                            variant="light"
                                        >
                                            {getPriorityIcon(rec.priority)}
                                        </ThemeIcon>
                                    }
                                >
                                    <Text size="xs">{rec.message}</Text>
                                </List.Item>
                            ))}
                        </List>
                        {health.recommendations.length > 3 && (
                            <Text size="xs" c="dimmed">
                                +{health.recommendations.length - 3} more recommendations
                            </Text>
                        )}
                    </Stack>
                )}

                <Text size="xs" c="dimmed">
                    Updated: {new Date(health.timestamp).toLocaleString()}
                </Text>
            </Stack>
        </Card>
    );
}
