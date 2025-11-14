'use client';

import { Modal, Stack, Group, Text, Badge, Divider, Paper, Button, ActionIcon, CopyButton, Tooltip, Code, Box, Alert } from '@mantine/core';
import { IconCheck, IconCopy, IconGitCommit, IconUser, IconClock, IconTag } from '@tabler/icons-react';
import { format } from 'date-fns';
import { IPageVersion } from '../../../../../types/responses/admin/page-version.types';

interface IVersionDetailsModalProps {
    opened: boolean;
    onClose: () => void;
    version: IPageVersion | null;
    isPublished: boolean;
}

export function VersionDetailsModal({
    opened,
    onClose,
    version,
    isPublished
}: IVersionDetailsModalProps) {
    
    if (!version) return null;

    return (
        <Modal
            opened={opened}
            onClose={onClose}
            title={
                <Group gap="xs">
                    <IconGitCommit size={20} />
                    <Text fw={600}>Version Details</Text>
                </Group>
            }
            size="lg"
            centered
        >
            <Stack gap="md">
                {/* Version Header */}
                <Paper p="md" withBorder>
                    <Group justify="space-between" mb="xs">
                        <Text size="lg" fw={600}>
                            {version.version_name || `Version ${version.version_number}`}
                        </Text>
                        {isPublished && (
                            <Badge size="md" color="green" variant="filled" leftSection={<IconCheck size={14} />}>
                                PUBLISHED
                            </Badge>
                        )}
                    </Group>
                    <Text size="sm" c="dimmed">
                        Version #{version.version_number}
                    </Text>
                </Paper>

                {/* Metadata Section */}
                <Stack gap="sm">
                    {/* Created Date */}
                    <Group gap="xs">
                        <IconClock size={16} opacity={0.6} />
                        <Text size="sm" fw={500}>Created:</Text>
                        <Text size="sm" c="dimmed">
                            {format(new Date(version.created_at), 'MMM dd, yyyy HH:mm:ss')}
                        </Text>
                    </Group>

                    {/* Published Date */}
                    {version.published_at && (
                        <Group gap="xs">
                            <IconCheck size={16} opacity={0.6} />
                            <Text size="sm" fw={500}>Published:</Text>
                            <Text size="sm" c="dimmed">
                                {format(new Date(version.published_at), 'MMM dd, yyyy HH:mm:ss')}
                            </Text>
                        </Group>
                    )}

                    {/* Created By */}
                    {version.created_by && (
                        <Group gap="xs">
                            <IconUser size={16} opacity={0.6} />
                            <Text size="sm" fw={500}>Created by:</Text>
                            <Text size="sm" c="dimmed">
                                {typeof version.created_by === 'object' && 'name' in version.created_by
                                    ? version.created_by.name
                                    : `User #${version.created_by}`}
                            </Text>
                        </Group>
                    )}

                    {/* Description */}
                    {version.metadata?.description && (
                        <>
                            <Divider />
                            <Box>
                                <Text size="sm" fw={500} mb={4}>Description:</Text>
                                <Text size="sm">{version.metadata.description}</Text>
                            </Box>
                        </>
                    )}

                    {/* Tags */}
                    {version.metadata?.tags && version.metadata.tags.length > 0 && (
                        <>
                            <Divider />
                            <Box>
                                <Group gap="xs" mb={6}>
                                    <IconTag size={16} opacity={0.6} />
                                    <Text size="sm" fw={500}>Tags:</Text>
                                </Group>
                                <Group gap={6}>
                                    {version.metadata.tags.map((tag, index) => (
                                        <Badge key={index} size="sm" variant="outline" color="gray">
                                            {tag}
                                        </Badge>
                                    ))}
                                </Group>
                            </Box>
                        </>
                    )}

                    {/* Version ID */}
                    <Divider />
                    <Group gap="xs">
                        <Text size="sm" fw={500}>Version ID:</Text>
                        <Code>{version.id}</Code>
                        <CopyButton value={version.id.toString()}>
                            {({ copied, copy }) => (
                                <Tooltip label={copied ? 'Copied' : 'Copy ID'}>
                                    <ActionIcon
                                        size="sm"
                                        variant="subtle"
                                        color={copied ? 'green' : 'gray'}
                                        onClick={copy}
                                    >
                                        {copied ? <IconCheck size={14} /> : <IconCopy size={14} />}
                                    </ActionIcon>
                                </Tooltip>
                            )}
                        </CopyButton>
                    </Group>
                </Stack>

                {/* Warning for Published Version */}
                {isPublished && (
                    <Alert color="blue" variant="light">
                        <Text size="sm">
                            This is the currently published version. It cannot be deleted.
                        </Text>
                    </Alert>
                )}

                {/* Actions */}
                <Divider />
                <Group justify="flex-end" gap="xs">
                    <Button variant="default" onClick={onClose}>
                        Close
                    </Button>
                </Group>
            </Stack>
        </Modal>
    );
}

