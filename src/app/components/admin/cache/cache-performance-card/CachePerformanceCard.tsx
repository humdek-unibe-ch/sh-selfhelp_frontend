/**
 * Cache Performance Card Component
 * Displays top performing cache categories and detailed performance metrics
 */

'use client';

import React from 'react';
import { Card, Title, Text, Stack, Badge, SimpleGrid, Skeleton, Alert, Group, Progress, Divider } from '@mantine/core';
import { IconInfoCircle, IconTrophy, IconActivity, IconClock } from '@tabler/icons-react';
import type { ICacheStatsResponse } from '../../../../../types/responses/admin/cache.types';

interface ICachePerformanceCardProps {
    stats?: ICacheStatsResponse;
    isLoading?: boolean;
}

const CATEGORY_DESCRIPTIONS: Record<string, { label: string; color: string }> = {
    pages: { label: 'Pages', color: 'blue' },
    users: { label: 'Users', color: 'green' },
    sections: { label: 'Sections', color: 'purple' },
    languages: { label: 'Languages', color: 'cyan' },
    groups: { label: 'Groups', color: 'orange' },
    roles: { label: 'Roles', color: 'red' },
    permissions: { label: 'Permissions', color: 'pink' },
    lookups: { label: 'Lookups', color: 'indigo' },
    assets: { label: 'Assets', color: 'teal' },
    frontend_user: { label: 'Frontend User', color: 'lime' },
    cms_preferences: { label: 'CMS Preferences', color: 'yellow' },
    scheduled_jobs: { label: 'Scheduled Jobs', color: 'grape' },
    actions: { label: 'Actions', color: 'violet' },
};

export function CachePerformanceCard({ stats, isLoading }: ICachePerformanceCardProps) {
    if (isLoading) {
        return (
            <Card shadow="sm" padding="lg" radius="md" withBorder h="100%">
                <Stack gap="md">
                    <Skeleton height={24} width="60%" />
                    <SimpleGrid cols={1}>
                        {Array.from({ length: 3 }).map((_, index) => (
                            <Skeleton key={index} height={60} />
                        ))}
                    </SimpleGrid>
                </Stack>
            </Card>
        );
    }

    if (!stats) {
        return (
            <Card shadow="sm" padding="lg" radius="md" withBorder h="100%">
                <Alert
                    icon={<IconInfoCircle size={16} />}
                    title="No Performance Data"
                    color="gray"
                    variant="light"
                >
                    Cache performance information is not available.
                </Alert>
            </Card>
        );
    }

    const { top_performing_categories, cache_pools } = stats;
    const topCategories = Object.entries(top_performing_categories)
        .filter(([_, categoryStats]) => categoryStats.total_operations > 0)
        .sort((a, b) => b[1].hit_rate - a[1].hit_rate)
        .slice(0, 5);

    return (
        <Card shadow="sm" padding="lg" radius="md" withBorder h="100%">
            <Stack gap="md">
                <Group gap="xs">
                    <IconTrophy size={20} color="var(--mantine-color-yellow-6)" />
                    <Title order={3}>Top Performing Categories</Title>
                </Group>
                
                {topCategories.length === 0 ? (
                    <Alert
                        icon={<IconActivity size={16} />}
                        title="No Active Categories"
                        color="gray"
                        variant="light"
                    >
                        No cache categories have recorded operations yet.
                    </Alert>
                ) : (
                    <Stack gap="sm">
                        {topCategories.map(([category, categoryStats], index) => {
                            const info = CATEGORY_DESCRIPTIONS[category] || {
                                label: category,
                                color: 'gray'
                            };
                            
                            const pool = cache_pools[categoryStats.cache_pool];
                            const lastActivity = new Date(categoryStats.last_activity);
                            const isRecent = Date.now() - lastActivity.getTime() < 60000; // Within last minute

                            return (
                                <div key={category}>
                                    <Stack gap="xs" p="sm" style={{ 
                                        borderRadius: '8px', 
                                        backgroundColor: index === 0 ? 'var(--mantine-color-yellow-0)' : 'var(--mantine-color-gray-0)',
                                        border: `1px solid ${index === 0 ? 'var(--mantine-color-yellow-3)' : 'var(--mantine-color-gray-3)'}` 
                                    }}>
                                        <Group justify="space-between" align="center">
                                            <Group gap="xs">
                                                {index === 0 && <IconTrophy size={16} color="var(--mantine-color-yellow-6)" />}
                                                <Badge
                                                    color={info.color}
                                                    variant={index === 0 ? 'filled' : 'light'}
                                                    size="sm"
                                                >
                                                    #{index + 1} {info.label}
                                                </Badge>
                                                {isRecent && (
                                                    <Badge color="green" variant="dot" size="xs">
                                                        Active
                                                    </Badge>
                                                )}
                                            </Group>
                                            
                                            <Text size="sm" fw={700} c={categoryStats.hit_rate > 80 ? 'green' : categoryStats.hit_rate > 60 ? 'yellow' : 'red'}>
                                                {categoryStats.hit_rate.toFixed(1)}%
                                            </Text>
                                        </Group>
                                        
                                        <Progress
                                            value={categoryStats.hit_rate}
                                            size="sm"
                                            color={categoryStats.hit_rate > 80 ? 'green' : categoryStats.hit_rate > 60 ? 'yellow' : 'red'}
                                        />
                                        
                                        <Group justify="space-between" align="center">
                                            <Group gap={12}>
                                                <Text size="xs" c="green">
                                                    {categoryStats.hits} hits
                                                </Text>
                                                <Text size="xs" c="red">
                                                    {categoryStats.misses} misses
                                                </Text>
                                                <Text size="xs" c="blue">
                                                    {categoryStats.total_operations} total
                                                </Text>
                                            </Group>
                                            
                                            <Group gap="xs">
                                                <IconClock size={12} color="var(--mantine-color-gray-6)" />
                                                <Text size="xs" c="dimmed">
                                                    {pool?.name || categoryStats.cache_pool}
                                                </Text>
                                            </Group>
                                        </Group>
                                    </Stack>
                                    
                                    {index < topCategories.length - 1 && <Divider size="xs" />}
                                </div>
                            );
                        })}
                        
                        <Text size="xs" c="dimmed" ta="center" mt="xs">
                            Ranked by hit rate performance
                        </Text>
                    </Stack>
                )}
            </Stack>
        </Card>
    );
}
