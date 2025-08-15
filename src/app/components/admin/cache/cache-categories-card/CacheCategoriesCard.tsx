/**
 * Cache Categories Card Component
 * Displays available cache categories and their details
 */

'use client';

import React from 'react';
import { Card, Title, Text, Stack, Badge, SimpleGrid, Skeleton, Alert } from '@mantine/core';
import { IconInfoCircle } from '@tabler/icons-react';

interface ICacheCategoriesCardProps {
    categories?: string[];
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
};

export function CacheCategoriesCard({ categories, isLoading }: ICacheCategoriesCardProps) {
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

    if (!categories || categories.length === 0) {
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

    return (
        <Card shadow="sm" padding="lg" radius="md" withBorder h="100%">
            <Stack gap="md">
                <Title order={3}>Cache Categories</Title>
                
                <Text size="sm" c="dimmed">
                    {categories.length} cache categories available
                </Text>

                <SimpleGrid cols={1} spacing="xs">
                    {categories.map((category) => {
                        const info = CATEGORY_DESCRIPTIONS[category] || {
                            label: category,
                            description: 'Cache category',
                            color: 'gray'
                        };

                        return (
                            <Stack key={category} gap="xs" p="sm" style={{ borderRadius: '8px', border: '1px solid var(--mantine-color-gray-3)' }}>
                                <Badge
                                    color={info.color}
                                    variant="light"
                                    size="sm"
                                    style={{ alignSelf: 'flex-start' }}
                                >
                                    {info.label}
                                </Badge>
                                <Text size="xs" c="dimmed">
                                    {info.description}
                                </Text>
                            </Stack>
                        );
                    })}
                </SimpleGrid>
            </Stack>
        </Card>
    );
}
