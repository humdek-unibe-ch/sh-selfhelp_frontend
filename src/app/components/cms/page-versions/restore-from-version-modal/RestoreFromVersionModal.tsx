'use client';

import { Modal, Stack, Text, Alert, Group, Button, Divider, Badge, Box } from '@mantine/core';
import { IconAlertTriangle, IconInfoCircle, IconGitBranch, IconClock } from '@tabler/icons-react';
import { IPageVersion } from '../../../../../types/responses/admin/page-version.types';
import { format } from 'date-fns';

interface IRestoreFromVersionModalProps {
    opened: boolean;
    onClose: () => void;
    onConfirm: () => void;
    version: IPageVersion | null;
    hasUnpublishedChanges: boolean;
    isRestoring: boolean;
}

export function RestoreFromVersionModal({
    opened,
    onClose,
    onConfirm,
    version,
    hasUnpublishedChanges,
    isRestoring
}: IRestoreFromVersionModalProps) {
    if (!version) return null;

    const handleConfirm = () => {
        onConfirm();
    };

    return (
        <Modal
            opened={opened}
            onClose={onClose}
            title={
                <Group gap="xs">
                    <IconGitBranch size={20} />
                    <Text size="lg" fw={600}>Restore from Version</Text>
                </Group>
            }
            size="lg"
            centered
        >
            <Stack gap="md">
                {/* Version Info */}
                <Box p="md" bg="gray.0" style={{ borderRadius: 'var(--mantine-radius-sm)' }}>
                    <Group justify="space-between" mb="xs">
                        <Text size="sm" fw={500}>Version to restore from:</Text>
                        <Badge color="blue" variant="light">
                            v{version.version_number}
                        </Badge>
                    </Group>
                    <Text size="md" fw={600} mb={4}>
                        {version.version_name || `Version ${version.version_number}`}
                    </Text>
                    <Group gap="xs">
                        <IconClock size={14} />
                        <Text size="xs" c="dimmed">
                            Published {format(new Date(version.published_at!), 'MMM dd, yyyy • HH:mm')}
                        </Text>
                    </Group>
                </Box>

                {/* Warning for unpublished changes */}
                {hasUnpublishedChanges && (
                    <Alert color="red" icon={<IconAlertTriangle size={16} />}>
                        <Text size="sm" fw={600} mb={4}>⚠️ You have unpublished changes!</Text>
                        <Text size="sm">
                            Restoring from this version will replace ALL current sections in your draft.
                            Your unpublished changes will be permanently lost.
                        </Text>
                        <Text size="sm" mt={4} c="dimmed">
                            <strong>Recommendation:</strong> Publish your current changes first to create a backup version.
                        </Text>
                    </Alert>
                )}

                {/* Main Warning */}
                <Alert color="orange" icon={<IconInfoCircle size={16} />}>
                    <Text size="sm" fw={600} mb={4}>This action will:</Text>
                    <Text size="sm" component="ul" style={{ margin: 0, paddingLeft: '1.2rem' }}>
                        <li>Replace ALL current sections with sections from the selected version</li>
                        <li>Keep the page in draft mode (unpublished)</li>
                        <li>Allow you to continue editing from this restored state</li>
                        <li>Clear any existing section hierarchies and translations</li>
                    </Text>
                </Alert>

                {/* Action Description */}
                <Box p="sm" bg="blue.0" style={{ borderRadius: 'var(--mantine-radius-sm)', border: '1px solid var(--mantine-color-blue-3)' }}>
                    <Text size="sm" fw={500} c="blue.9" mb={4}>What happens next:</Text>
                    <Text size="sm" c="blue.9">
                        After restoration, you'll have a fresh draft containing the sections from version "{version.version_name || `v${version.version_number}`}"
                        that you can modify and publish when ready.
                    </Text>
                </Box>

                <Divider />

                {/* Confirmation Buttons */}
                <Group justify="flex-end" gap="sm">
                    <Button
                        variant="light"
                        onClick={onClose}
                        disabled={isRestoring}
                    >
                        Cancel
                    </Button>
                    <Button
                        color="green"
                        onClick={handleConfirm}
                        loading={isRestoring}
                        leftSection={<IconGitBranch size={16} />}
                    >
                        {isRestoring ? 'Restoring...' : 'Restore from this Version'}
                    </Button>
                </Group>
            </Stack>
        </Modal>
    );
}
