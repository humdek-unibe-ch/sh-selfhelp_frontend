/**
 * Cache Management Page
 * Main admin page for cache statistics and management
 */

'use client';

import React from 'react';
import { Title, Stack, Grid, Alert, LoadingOverlay, Box } from '@mantine/core';
import { IconInfoCircle } from '@tabler/icons-react';
import { useCacheStats, useCacheHealth } from '../../../../../hooks/useCache';
import { CacheStatisticsCard } from '../cache-statistics-card/CacheStatisticsCard';
import { CacheHealthCard } from '../cache-health-card/CacheHealthCard';
import { CacheManagementCard } from '../cache-management-card/CacheManagementCard';
import { CacheCategoriesCard } from '../cache-categories-card/CacheCategoriesCard';
import { CachePerformanceCard } from '../cache-performance-card/CachePerformanceCard';

export function CachePage() {
    const { data: cacheStats, isLoading: isLoadingStats, error: statsError } = useCacheStats();
    const { data: cacheHealth, isLoading: isLoadingHealth, error: healthError } = useCacheHealth();

    const isLoading = isLoadingStats || isLoadingHealth;
    const hasError = statsError || healthError;

    if (hasError) {
        return (
            <Box py="md">
                <Alert
                    icon={<IconInfoCircle size={16} />}
                    title="Error Loading Cache Data"
                    color="red"
                    variant="light"
                >
                    Failed to load cache information. Please try refreshing the page.
                </Alert>
            </Box>
        );
    }

    return (
        <Box py="md" pos="relative">
            <LoadingOverlay visible={isLoading} />
            
            <Stack gap="lg">
                <Title order={1}>Cache Management</Title>
                
                <Alert
                    icon={<IconInfoCircle size={16} />}
                    title="Cache Management"
                    color="blue"
                    variant="light"
                >
                    Monitor cache performance, clear specific cache categories, and manage cache health.
                    Use cache operations carefully as they may impact application performance.
                </Alert>

                <Grid>
                    {/* Row 1: Health and Statistics */}
                    <Grid.Col span={{ base: 12, md: 6 }}>
                        <CacheHealthCard health={cacheHealth} isLoading={isLoadingHealth} />
                    </Grid.Col>
                    <Grid.Col span={{ base: 12, md: 6 }}>
                        <CacheStatisticsCard stats={cacheStats} isLoading={isLoadingStats} />
                    </Grid.Col>

                    {/* Row 2: Performance and Management */}
                    <Grid.Col span={{ base: 12, md: 6 }}>
                        <CachePerformanceCard stats={cacheStats} isLoading={isLoadingStats} />
                    </Grid.Col>
                    <Grid.Col span={{ base: 12, md: 6 }}>
                        <CacheManagementCard />
                    </Grid.Col>

                    {/* Row 3: Categories (full width for better display) */}
                    <Grid.Col span={12}>
                        <CacheCategoriesCard stats={cacheStats} isLoading={isLoadingStats} />
                    </Grid.Col>
                </Grid>
            </Stack>
        </Box>
    );
}
