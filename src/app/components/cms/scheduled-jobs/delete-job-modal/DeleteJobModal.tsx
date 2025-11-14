"use client";

import { useState } from 'react';
import { 
    Modal, 
    Text, 
    Group, 
    Button, 
    TextInput, 
    Alert,
    Stack
} from '@mantine/core';
import { IconAlertTriangle } from '@tabler/icons-react';

interface IDeleteJobModalProps {
    opened: boolean;
    onClose: () => void;
    jobId?: number;
    jobDescription?: string;
    onConfirm: (jobId: number) => void;
}

export function DeleteJobModal({
    opened,
    onClose,
    jobId,
    jobDescription,
    onConfirm
}: IDeleteJobModalProps) {
    const [confirmText, setConfirmText] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);

    const expectedText = `DELETE JOB ${jobId}`;
    const isConfirmed = confirmText === expectedText;

    const handleConfirm = async () => {
        if (!jobId || !isConfirmed) return;

        setIsDeleting(true);
        try {
            await onConfirm(jobId);
            handleClose();
        } catch (error) {

        } finally {
            setIsDeleting(false);
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
            title="Delete Scheduled Job"
            size="md"
            centered
        >
            <Stack gap="lg">
                <Alert
                    icon={<IconAlertTriangle size={16} />}
                    title="Warning"
                    color="red"
                    variant="light"
                >
                    This action cannot be undone. The job will be permanently deleted.
                </Alert>

                <div>
                    <Text size="sm" fw={500} mb="xs">Job Details:</Text>
                    <Text size="sm" c="dimmed">
                        ID: {jobId}
                    </Text>
                    {jobDescription && (
                        <Text size="sm" c="dimmed">
                            Description: {jobDescription}
                        </Text>
                    )}
                </div>

                <div>
                    <Text size="sm" fw={500} mb="xs">
                        To confirm deletion, please type:
                    </Text>
                    <Text size="sm" fw={700} c="red" mb="xs">
                        {expectedText}
                    </Text>
                    <TextInput
                        value={confirmText}
                        onChange={(e) => setConfirmText(e.currentTarget.value)}
                        placeholder="Type the confirmation text"
                        error={confirmText && !isConfirmed ? 'Text does not match' : null}
                    />
                </div>

                <Group justify="flex-end">
                    <Button variant="light" onClick={handleClose} disabled={isDeleting}>
                        Cancel
                    </Button>
                    <Button
                        color="red"
                        onClick={handleConfirm}
                        disabled={!isConfirmed || isDeleting}
                        loading={isDeleting}
                    >
                        Delete Job
                    </Button>
                </Group>
            </Stack>
        </Modal>
    );
} 