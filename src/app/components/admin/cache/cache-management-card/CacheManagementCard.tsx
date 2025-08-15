/**
 * Cache Management Card Component
 * Provides cache clearing and management actions
 */

'use client';

import React, { useState } from 'react';
import { Card, Title, Stack, Button, Group, TextInput, Select, Alert, ActionIcon } from '@mantine/core';
import { IconTrash, IconRefresh, IconUser, IconDatabase, IconX } from '@tabler/icons-react';
import { useClearAllCachesMutation, useClearCacheCategoryMutation, useClearUserCacheMutation, useResetCacheStatsMutation } from '../../../../../hooks/useCache';
import type { TCacheCategory } from '../../../../../types/responses/admin/cache.types';

const CACHE_CATEGORIES: { value: TCacheCategory; label: string }[] = [
    { value: 'pages', label: 'Pages' },
    { value: 'users', label: 'Users' },
    { value: 'sections', label: 'Sections' },
    { value: 'languages', label: 'Languages' },
    { value: 'groups', label: 'Groups' },
    { value: 'roles', label: 'Roles' },
    { value: 'permissions', label: 'Permissions' },
    { value: 'lookups', label: 'Lookups' },
    { value: 'assets', label: 'Assets' },
    { value: 'frontend_user', label: 'Frontend User' },
    { value: 'cms_preferences', label: 'CMS Preferences' },
    { value: 'scheduled_jobs', label: 'Scheduled Jobs' },
];

export function CacheManagementCard() {
    const [selectedCategory, setSelectedCategory] = useState<string>('');
    const [userId, setUserId] = useState<string>('');

    const clearAllCachesMutation = useClearAllCachesMutation();
    const clearCacheCategoryMutation = useClearCacheCategoryMutation();
    const clearUserCacheMutation = useClearUserCacheMutation();
    const resetCacheStatsMutation = useResetCacheStatsMutation();

    const handleClearAllCaches = () => {
        clearAllCachesMutation.mutate();
    };

    const handleClearCacheCategory = () => {
        if (selectedCategory) {
            clearCacheCategoryMutation.mutate({
                category: selectedCategory as TCacheCategory,
            });
            setSelectedCategory('');
        }
    };

    const handleClearUserCache = () => {
        const userIdNumber = parseInt(userId);
        if (userIdNumber && userIdNumber > 0) {
            clearUserCacheMutation.mutate({
                user_id: userIdNumber,
            });
            setUserId('');
        }
    };

    const handleResetCacheStats = () => {
        resetCacheStatsMutation.mutate();
    };

    const isAnyMutationLoading = 
        clearAllCachesMutation.isPending ||
        clearCacheCategoryMutation.isPending ||
        clearUserCacheMutation.isPending ||
        resetCacheStatsMutation.isPending;

    return (
        <Card shadow="sm" padding="lg" radius="md" withBorder h="100%">
            <Stack gap="md">
                <Title order={3}>Cache Management</Title>

                <Alert
                    color="yellow"
                    variant="light"
                    title="Warning"
                    icon={<IconDatabase size={16} />}
                >
                    Cache operations may temporarily impact application performance.
                </Alert>

                {/* Clear All Caches */}
                <Stack gap="xs">
                    <Button
                        variant="filled"
                        color="red"
                        leftSection={<IconTrash size={16} />}
                        onClick={handleClearAllCaches}
                        loading={clearAllCachesMutation.isPending}
                        disabled={isAnyMutationLoading}
                        fullWidth
                    >
                        Clear All Caches
                    </Button>
                </Stack>

                {/* Clear Cache Category */}
                <Stack gap="xs">
                    <Group>
                        <Select
                            placeholder="Select category"
                            data={CACHE_CATEGORIES}
                            value={selectedCategory}
                            onChange={(value) => setSelectedCategory(value || '')}
                            flex={1}
                            searchable
                            clearable
                            rightSection={selectedCategory ? (
                                <ActionIcon
                                    variant="subtle"
                                    color="gray"
                                    size="sm"
                                    onClick={() => setSelectedCategory('')}
                                >
                                    <IconX size={14} />
                                </ActionIcon>
                            ) : undefined}
                        />
                        <Button
                            variant="filled"
                            color="orange"
                            leftSection={<IconDatabase size={16} />}
                            onClick={handleClearCacheCategory}
                            loading={clearCacheCategoryMutation.isPending}
                            disabled={!selectedCategory || isAnyMutationLoading}
                        >
                            Clear Category
                        </Button>
                    </Group>
                </Stack>

                {/* Clear User Cache */}
                <Stack gap="xs">
                    <Group>
                        <TextInput
                            placeholder="User ID"
                            value={userId}
                            onChange={(event) => setUserId(event.currentTarget.value)}
                            type="number"
                            min={1}
                            flex={1}
                            rightSection={userId ? (
                                <ActionIcon
                                    variant="subtle"
                                    color="gray"
                                    size="sm"
                                    onClick={() => setUserId('')}
                                >
                                    <IconX size={14} />
                                </ActionIcon>
                            ) : undefined}
                        />
                        <Button
                            variant="filled"
                            color="blue"
                            leftSection={<IconUser size={16} />}
                            onClick={handleClearUserCache}
                            loading={clearUserCacheMutation.isPending}
                            disabled={!userId || parseInt(userId) <= 0 || isAnyMutationLoading}
                        >
                            Clear User
                        </Button>
                    </Group>
                </Stack>

                {/* Reset Cache Statistics */}
                <Button
                    variant="outline"
                    color="gray"
                    leftSection={<IconRefresh size={16} />}
                    onClick={handleResetCacheStats}
                    loading={resetCacheStatsMutation.isPending}
                    disabled={isAnyMutationLoading}
                    fullWidth
                >
                    Reset Statistics
                </Button>
            </Stack>
        </Card>
    );
}
