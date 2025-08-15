/**
 * Cache Categories Card Component
 * Displays available cache categories and their details
 */

'use client';

import React from 'react';
import { Card, Title, Text, Stack, Badge, SimpleGrid, Skeleton, Alert, Group, Progress } from '@mantine/core';
import { IconInfoCircle, IconTrendingUp, IconTrendingDown } from '@tabler/icons-react';
import type { ICacheStatsResponse } from '../../../../../types/responses/admin/cache.types';

interface ICacheCategoriesCardProps {
    stats?: ICacheStatsResponse;
    isLoading?: boolean;
}

const CATEGORY_DESCRIPTIONS: Record<string, { label: string; description: string; color: string }> = {
    pages: { label: 'Pages', description: 'Page content and metadata', color: 'blue' },
    users: { label: 'Users', description: 'User profiles and authentication', color: 'green' },
    sections: { label: 'Sections', description: 'Page sections and components', color: 'purple' },
    languages: { label: 'Languages', description: 'Language settings and translations', color: 'cyan' },
    groups: { label: 'Groups', description: 'User groups and permissions', color: 'orange' },
    roles: { label: 'Roles', description: 'User roles and access control', color: 'red' },
    permissions: { label: 'Permissions', description: 'System permissions', color: 'pink' },
    lookups: { label: 'Lookups', description: 'Static lookup data', color: 'indigo' },
    assets: { label: 'Assets', description: 'Files and media assets', color: 'teal' },
    frontend_user: { label: 'Frontend User', description: 'Frontend user sessions', color: 'lime' },
    cms_preferences: { label: 'CMS Preferences', description: 'System configuration', color: 'yellow' },
    scheduled_jobs: { label: 'Scheduled Jobs', description: 'Background job data', color: 'grape' },
    actions: { label: 'Actions', description: 'System actions and workflows', color: 'violet' },
};

export function CacheCategoriesCard({ stats, isLoading }: ICacheCategoriesCardProps) {
    if (isLoading) {
        return (
            <Card shadow="sm" padding="lg" radius="md" withBorder h="100%">
                <Stack gap="md">
                    <Skeleton height={24} width="60%" />
                    <SimpleGrid cols={2}>
                        {Array.from({ length: 6 }).map((_, index) => (
                            <Skeleton key={index} height={40} />
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
                    title="No Categories Data"
                    color="gray"
                    variant="light"
                >
                    Cache categories information is not available.
                </Alert>
            </Card>
        );
    }

    const { cache_categories, cache_stats, cache_pools } = stats;

    return (
        <Card shadow="sm" padding="lg" radius="md" withBorder h="100%">
            <Stack gap="md">
                <Title order={3}>Cache Categories</Title>
                
                <Text size="sm" c="dimmed">
                    {cache_categories.length} cache categories available
                </Text>

                <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="xs">
                    {cache_categories.map((category) => {
                        const info = CATEGORY_DESCRIPTIONS[category] || {
                            label: category,
                            description: 'Cache category',
                            color: 'gray'
                        };
                        
                        const categoryStats = cache_stats.category_stats[category];
                        const pool = cache_pools[categoryStats?.cache_pool] || null;

                        return (
                            <Stack key={category} gap="xs" p="sm" style={{ 
                                borderRadius: '8px', 
                                border: '1px solid var(--mantine-color-gray-3)',
                                height: '100%'
                            }}>
                                <Group justify="space-between" align="center">
                                    <Badge
                                        color={info.color}
                                        variant="light"
                                        size="sm"
                                    >
                                        {info.label}
                                    </Badge>
                                    
                                    {categoryStats && categoryStats.hit_rate > 0 ? (
                                        <IconTrendingUp size={12} color="var(--mantine-color-green-6)" />
                                    ) : (
                                        <IconTrendingDown size={12} color="var(--mantine-color-gray-6)" />
                                    )}
                                </Group>
                                
                                <Text size="xs" c="dimmed">
                                    {info.description}
                                </Text>
                                
                                {pool && (
                                    <Text size="xs" c="dimmed">
                                        Pool: {pool.name}
                                    </Text>
                                )}
                                
                                {categoryStats && (
                                    <Stack gap={4}>
                                        <Group justify="space-between">
                                            <Text size="xs" fw={600}>
                                                Hit Rate
                                            </Text>
                                            <Text size="xs" fw={600} c={categoryStats.hit_rate > 80 ? 'green' : categoryStats.hit_rate > 60 ? 'yellow' : 'red'}>
                                                {categoryStats.hit_rate.toFixed(1)}%
                                            </Text>
                                        </Group>
                                        
                                        <Progress
                                            value={categoryStats.hit_rate}
                                            size="xs"
                                            color={categoryStats.hit_rate > 80 ? 'green' : categoryStats.hit_rate > 60 ? 'yellow' : 'red'}
                                        />
                                        
                                        <Group justify="space-between">
                                            <Text size="xs" c="green">
                                                {categoryStats.hits}H
                                            </Text>
                                            <Text size="xs" c="red">
                                                {categoryStats.misses}M
                                            </Text>
                                            <Text size="xs" c="blue">
                                                {categoryStats.sets}S
                                            </Text>
                                        </Group>
                                    </Stack>
                                )}
                            </Stack>
                        );
                    })}
                </SimpleGrid>
            </Stack>
        </Card>
    );
}
