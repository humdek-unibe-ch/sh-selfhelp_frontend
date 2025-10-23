'use client';

import { Stack, Paper, Group, Text, Badge, ActionIcon, Tooltip, Box, ScrollArea, Loader, Alert, Center } from '@mantine/core';
import { IconCheck, IconTrash, IconEye, IconGitBranch, IconGitCommit, IconGitCompare, IconRestore } from '@tabler/icons-react';
import { IPageVersion } from '../../../../../types/responses/admin/page-version.types';
import { format } from 'date-fns';
import styles from './VersionHistoryList.module.css';

interface IVersionHistoryListProps {
    versions: IPageVersion[];
    currentPublishedVersionId: number | null;
    isLoading?: boolean;
    error?: Error | null;
    onPublish: (versionId: number) => void;
    onDelete: (versionId: number) => void;
    onView: (versionId: number) => void;
    onCompare?: (versionId: number) => void;
    onRestore?: (versionId: number) => void;
}

export function VersionHistoryList({
    versions,
    currentPublishedVersionId,
    isLoading,
    error,
    onPublish,
    onDelete,
    onView,
    onCompare,
    onRestore
}: IVersionHistoryListProps) {
    if (isLoading) {
        return (
            <Center p="xl">
                <Stack align="center" gap="sm">
                    <Loader size="md" />
                    <Text size="sm" c="dimmed">Loading versions...</Text>
                </Stack>
            </Center>
        );
    }

    if (error) {
        return (
            <Alert color="red" title="Error loading versions">
                {error.message || 'Failed to load version history'}
            </Alert>
        );
    }

    if (!versions || versions.length === 0) {
        return (
            <Paper p="xl" withBorder>
                <Stack align="center" gap="xs">
                    <IconGitBranch size={32} opacity={0.3} />
                    <Text size="sm" c="dimmed" ta="center">
                        No versions yet
                    </Text>
                    <Text size="xs" c="dimmed" ta="center">
                        Click "Publish" to create your first version
                    </Text>
                </Stack>
            </Paper>
        );
    }

    return (
        <ScrollArea.Autosize mah={400}>
            <Stack gap="xs">
                {versions.map((version) => {
                    // Check both current_published_version_id and is_published flag for redundancy
                    const isPublished = version.id === currentPublishedVersionId || version.is_published === true;
                    
                    return (
                        <Paper 
                            key={version.id} 
                            p="md" 
                            withBorder
                            className={isPublished ? styles.publishedVersion : styles.versionItem}
                        >
                            <Group justify="space-between" wrap="nowrap" align="flex-start">
                                <Box style={{ flex: 1, minWidth: 0 }}>
                                    <Group gap="xs" mb={6}>
                                        <IconGitCommit size={16} style={{ flexShrink: 0 }} />
                                        <Text size="sm" fw={600} truncate>
                                            {version.version_name || `Version ${version.version_number}`}
                                        </Text>
                                        {isPublished && (
                                            <Badge size="xs" color="green" variant="filled" leftSection={<IconCheck size={10} />}>
                                                PUBLISHED
                                            </Badge>
                                        )}
                                    </Group>
                                    
                                    <Text size="xs" c="dimmed">
                                        {format(new Date(version.created_at), 'MMM dd, yyyy • HH:mm')}
                                    </Text>
                                    
                                    {version.metadata?.description && (
                                        <Text size="xs" mt={6} lineClamp={2}>
                                            {version.metadata.description}
                                        </Text>
                                    )}
                                    
                                    {version.metadata?.tags && version.metadata.tags.length > 0 && (
                                        <Group gap={4} mt={8}>
                                            {version.metadata.tags.slice(0, 3).map((tag, index) => (
                                                <Badge key={index} size="xs" variant="outline" color="gray">
                                                    {tag}
                                                </Badge>
                                            ))}
                                            {version.metadata.tags.length > 3 && (
                                                <Text size="xs" c="dimmed">
                                                    +{version.metadata.tags.length - 3} more
                                                </Text>
                                            )}
                                        </Group>
                                    )}
                                </Box>

                                <Group gap={6} wrap="nowrap" style={{ flexShrink: 0 }}>
                                    {!isPublished && (
                                        <Tooltip label="Publish this version" withArrow>
                                            <ActionIcon 
                                                size="md" 
                                                variant="light"
                                                color="green"
                                                onClick={() => onPublish(version.id)}
                                            >
                                                <IconCheck size={16} />
                                            </ActionIcon>
                                        </Tooltip>
                                    )}
                                    
                                    <Tooltip label="View details" withArrow>
                                        <ActionIcon
                                            size="md"
                                            variant="light"
                                            color="blue"
                                            onClick={() => onView(version.id)}
                                        >
                                            <IconEye size={16} />
                                        </ActionIcon>
                                    </Tooltip>

                                    {onCompare && (
                                        <Tooltip label="Compare versions" withArrow>
                                            <ActionIcon
                                                size="md"
                                                variant="light"
                                                color="orange"
                                                onClick={() => onCompare(version.id)}
                                            >
                                                <IconGitCompare size={16} />
                                            </ActionIcon>
                                        </Tooltip>
                                    )}

                                    {onRestore && isPublished && (
                                        <Tooltip label="Restore from this version" withArrow>
                                            <ActionIcon
                                                size="md"
                                                variant="light"
                                                color="purple"
                                                onClick={() => onRestore(version.id)}
                                            >
                                                <IconRestore size={16} />
                                            </ActionIcon>
                                        </Tooltip>
                                    )}

                                    {!isPublished && (
                                        <Tooltip label="Delete version" withArrow>
                                            <ActionIcon 
                                                size="md" 
                                                variant="light"
                                                color="red"
                                                onClick={() => onDelete(version.id)}
                                            >
                                                <IconTrash size={16} />
                                            </ActionIcon>
                                        </Tooltip>
                                    )}
                                </Group>
                            </Group>
                        </Paper>
                    );
                })}
            </Stack>
        </ScrollArea.Autosize>
    );
}

