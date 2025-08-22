"use client";

import { useState } from 'react';
import {
    Modal,
    Title,
    Text,
    Group,
    Button,
    TextInput,
    Alert,
    Stack,
    List,
} from '@mantine/core';
import { IconAlertTriangle } from '@tabler/icons-react';

interface IBulkDeleteJobsModalProps {
    opened: boolean;
    onClose: () => void;
    jobIds: number[];
    jobDescriptions: string[];
    onConfirm: (jobIds: number[]) => void;
}

export function BulkDeleteJobsModal({
    opened,
    onClose,
    jobIds,
    jobDescriptions,
    onConfirm,
}: IBulkDeleteJobsModalProps) {
    const [confirmText, setConfirmText] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);

    const expectedText = `DELETE ${jobIds.length} JOBS`;

    const handleConfirm = async () => {
        if (confirmText === expectedText) {
            setIsDeleting(true);
            try {
                await onConfirm(jobIds);
                setConfirmText('');
            } finally {
                setIsDeleting(false);
            }
        }
    };

    const handleClose = () => {
        setConfirmText('');
        setIsDeleting(false);
        onClose();
    };

    return (
        <Modal
            opened={opened}
            onClose={handleClose}
            title={
                <Group gap="sm">
                    <IconAlertTriangle size={20} color="red" />
                    <Title order={3} component="div">Delete Multiple Jobs</Title>
                </Group>
            }
            size="md"
            centered
        >
            <Stack gap="md">
                <Alert
                    variant="light"
                    color="red"
                    title="Warning"
                    icon={<IconAlertTriangle size={16} />}
                >
                    You are about to permanently delete {jobIds.length} scheduled job(s). 
                    This action cannot be undone.
                </Alert>

                <div>
                    <Text size="sm" fw={500} mb="xs">
                        Jobs to be deleted:
                    </Text>
                    <List size="sm" spacing="xs">
                        {jobDescriptions.map((description, index) => (
                            <List.Item key={jobIds[index]}>
                                <Text size="sm">
                                    <strong>ID {jobIds[index]}:</strong> {description}
                                </Text>
                            </List.Item>
                        ))}
                    </List>
                </div>

                <Text size="sm" c="dimmed">
                    To confirm deletion, please type: <strong>{expectedText}</strong>
                </Text>

                <TextInput
                    placeholder={expectedText}
                    value={confirmText}
                    onChange={(e) => setConfirmText(e.currentTarget.value)}
                    error={confirmText && confirmText !== expectedText ? 'Text does not match' : null}
                />

                <Group justify="flex-end" gap="sm">
                    <Button variant="light" onClick={handleClose}>
                        Cancel
                    </Button>
                    <Button
                        color="red"
                        onClick={handleConfirm}
                        disabled={confirmText !== expectedText}
                        loading={isDeleting}
                    >
                        Delete {jobIds.length} Job{jobIds.length !== 1 ? 's' : ''}
                    </Button>
                </Group>
            </Stack>
        </Modal>
    );
} 