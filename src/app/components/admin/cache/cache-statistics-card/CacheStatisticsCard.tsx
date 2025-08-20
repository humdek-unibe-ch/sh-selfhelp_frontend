/**
 * Cache Statistics Card Component
 * Displays global cache statistics and performance metrics
 */

'use client';

import React from 'react';
import { Card, Title, Text, Stack, Group, SimpleGrid, Skeleton, Alert, RingProgress, Center } from '@mantine/core';
import { IconInfoCircle } from '@tabler/icons-react';
import type { ICacheStatsResponse } from '../../../../../types/responses/admin/cache.types';

interface ICacheStatisticsCardProps {
    stats?: ICacheStatsResponse;
    isLoading?: boolean;
}

export function CacheStatisticsCard({ stats, isLoading }: ICacheStatisticsCardProps) {
    if (isLoading) {
        return (
            <Card shadow="sm" padding="lg" radius="md" withBorder h="100%">
                <Stack gap="md">
                    <Skeleton height={24} width="60%" />
                    <SimpleGrid cols={2}>
                        <Skeleton height={60} />
                        <Skeleton height={60} />
                        <Skeleton height={60} />
                        <Skeleton height={60} />
                    </SimpleGrid>
                    <Skeleton height={80} />
                </Stack>
            </Card>
        );
    }

    if (!stats) {
        return (
            <Card shadow="sm" padding="lg" radius="md" withBorder h="100%">
                <Alert
                    icon={<IconInfoCircle size={16} />}
                    title="No Statistics Data"
                    color="gray"
                    variant="light"
                >
                    Cache statistics are not available.
                </Alert>
            </Card>
        );
    }

    const globalStats = stats.cache_stats.global_stats;
    const totalOperations = globalStats.hits + globalStats.misses + globalStats.sets + globalStats.invalidations;

    return (
        <Card shadow="sm" padding="lg" radius="md" withBorder h="100%">
            <Stack gap="md">
                <Title order={3}>Cache Statistics</Title>

                <SimpleGrid cols={2}>
                    <Stack gap="xs" align="center">
                        <Text size="lg" fw={700} c="green">
                            {globalStats.hits.toLocaleString()}
                        </Text>
                        <Text size="xs" c="dimmed" ta="center">Hits</Text>
                    </Stack>

                    <Stack gap="xs" align="center">
                        <Text size="lg" fw={700} c="red">
                            {globalStats.misses.toLocaleString()}
                        </Text>
                        <Text size="xs" c="dimmed" ta="center">Misses</Text>
                    </Stack>

                    <Stack gap="xs" align="center">
                        <Text size="lg" fw={700} c="blue">
                            {globalStats.sets.toLocaleString()}
                        </Text>
                        <Text size="xs" c="dimmed" ta="center">Sets</Text>
                    </Stack>

                    <Stack gap="xs" align="center">
                        <Text size="lg" fw={700} c="orange">
                            {globalStats.invalidations.toLocaleString()}
                        </Text>
                        <Text size="xs" c="dimmed" ta="center">Invalidations</Text>
                    </Stack>
                </SimpleGrid>

                <Center>
                    <RingProgress
                        size={120}
                        thickness={8}
                        sections={[
                            { value: globalStats.hit_rate, color: globalStats.hit_rate > 80 ? 'green' : globalStats.hit_rate > 60 ? 'yellow' : 'red' },
                        ]}
                        label={
                            <Stack gap={0} align="center">
                                <Text size="lg" fw={700}>
                                    {globalStats.hit_rate.toFixed(1)}%
                                </Text>
                                <Text size="xs" c="dimmed">Hit Rate</Text>
                            </Stack>
                        }
                    />
                </Center>

                <Group justify="space-between">
                    <Text size="sm" c="dimmed">Total Operations</Text>
                    <Text size="sm" fw={600}>{totalOperations.toLocaleString()}</Text>
                </Group>

                <Text size="xs" c="dimmed">
                    Updated: {new Date(stats.timestamp).toLocaleString()}
                </Text>
            </Stack>
        </Card>
    );
}
