'use client';

import { Stack, Paper, Group, Text, Badge, ActionIcon, Tooltip, Box, ScrollArea, Loader, Alert } from '@mantine/core';
import { IconCheck, IconClock, IconTrash, IconEye, IconGitBranch } from '@tabler/icons-react';
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
    onCompare: (versionId: number) => void;
    onView: (versionId: number) => void;
}

export function VersionHistoryList({
    versions,
    currentPublishedVersionId,
    isLoading,
    error,
    onPublish,
    onDelete,
    onCompare,
    onView
}: IVersionHistoryListProps) {
    if (isLoading) {
        return (
            <Box p="md">
                <Stack align="center" gap="sm">
                    <Loader size="md" />
                    <Text size="sm" c="dimmed">Loading versions...</Text>
                </Stack>
            </Box>
        );
    }

    if (error) {
        return (
            <Alert color="red" title="Error" p="md">
                {error.message || 'Failed to load version history'}
            </Alert>
        );
    }

    if (!versions || versions.length === 0) {
        return (
            <Box p="md">
                <Text size="sm" c="dimmed" ta="center">
                    No versions yet. Publish your first version to get started.
                </Text>
            </Box>
        );
    }

    return (
        <ScrollArea h={400}>
            <Stack gap="xs" p="xs">
                {versions.map((version) => {
                    const isPublished = version.id === currentPublishedVersionId;
                    
                    return (
                        <Paper 
                            key={version.id} 
                            p="sm" 
                            withBorder
                            className={isPublished ? styles.publishedVersion : styles.versionItem}
                        >
                            <Group justify="space-between" wrap="nowrap">
                                <Box style={{ flex: 1, minWidth: 0 }}>
                                    <Group gap="xs" wrap="nowrap">
                                        <IconGitBranch size={16} />
                                        <Text size="sm" fw={500} truncate>
                                            {version.version_name || `Version ${version.version_number}`}
                                        </Text>
                                        {isPublished && (
                                            <Badge size="sm" color="green" variant="filled">
                                                Published
                                            </Badge>
                                        )}
                                    </Group>
                                    
                                    <Text size="xs" c="dimmed" mt={4}>
                                        {format(new Date(version.created_at), 'MMM dd, yyyy HH:mm')}
                                    </Text>
                                    
                                    {version.metadata?.description && (
                                        <Text size="xs" c="dimmed" mt={4} lineClamp={2}>
                                            {version.metadata.description}
                                        </Text>
                                    )}
                                    
                                    {version.metadata?.tags && version.metadata.tags.length > 0 && (
                                        <Group gap={4} mt={6}>
                                            {version.metadata.tags.slice(0, 3).map((tag, index) => (
                                                <Badge key={index} size="xs" variant="dot" color="gray">
                                                    {tag}
                                                </Badge>
                                            ))}
                                        </Group>
                                    )}
                                </Box>

                                <Group gap={4} wrap="nowrap">
                                    <Tooltip label="View version details">
                                        <ActionIcon 
                                            size="sm" 
                                            variant="subtle"
                                            onClick={() => onView(version.id)}
                                        >
                                            <IconEye size={16} />
                                        </ActionIcon>
                                    </Tooltip>
                                    
                                    {!isPublished && (
                                        <Tooltip label="Publish this version">
                                            <ActionIcon 
                                                size="sm" 
                                                variant="subtle"
                                                color="green"
                                                onClick={() => onPublish(version.id)}
                                            >
                                                <IconCheck size={16} />
                                            </ActionIcon>
                                        </Tooltip>
                                    )}
                                    
                                    <Tooltip label="Compare with current">
                                        <ActionIcon 
                                            size="sm" 
                                            variant="subtle"
                                            color="blue"
                                            onClick={() => onCompare(version.id)}
                                        >
                                            <IconGitBranch size={16} />
                                        </ActionIcon>
                                    </Tooltip>
                                    
                                    {!isPublished && (
                                        <Tooltip label="Delete version">
                                            <ActionIcon 
                                                size="sm" 
                                                variant="subtle"
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
        </ScrollArea>
    );
}

