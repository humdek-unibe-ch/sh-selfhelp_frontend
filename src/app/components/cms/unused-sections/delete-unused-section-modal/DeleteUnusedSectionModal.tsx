'use client';

import { useState } from 'react';
import {
    Modal,
    Text,
    Button,
    Group,
    Stack,
    Alert,
    TextInput,
    Card,
    Badge
} from '@mantine/core';
import { IconAlertTriangle, IconTrash } from '@tabler/icons-react';
import { useDeleteUnusedSectionMutation } from '../../../../../hooks/useSectionUtility';
import type { IUnusedSection } from '../../../../../types/responses/admin/section-utility.types';

interface IDeleteUnusedSectionModalProps {
    section: IUnusedSection | null;
    opened: boolean;
    onClose: () => void;
    onDeleted: () => void;
}

export function DeleteUnusedSectionModal({ 
    section, 
    opened, 
    onClose, 
    onDeleted 
}: IDeleteUnusedSectionModalProps) {
    const [confirmationText, setConfirmationText] = useState('');

    const deleteMutation = useDeleteUnusedSectionMutation();

    const handleClose = () => {
        setConfirmationText('');
        onClose();
    };

    const handleDelete = () => {
        if (!section) return;
        deleteMutation.mutate(section.id, {
            onSuccess: () => {
                handleClose();
                onDeleted();
            }
        });
    };

    if (!section) return null;

    const isConfirmationValid = confirmationText === section.name;

    return (
        <Modal
            opened={opened}
            onClose={handleClose}
            title={
                <Group gap="sm">
                    <IconAlertTriangle color="var(--mantine-color-red-6)" size={20} />
                    <Text fw={600} c="red">Delete Unused Section</Text>
                </Group>
            }
            size="md"
            centered
        >
            <Stack gap="md">
                <Alert
                    icon={<IconAlertTriangle size={16} />}
                    color="red"
                    variant="light"
                >
                    <Text fw={500} mb="xs">This action cannot be undone!</Text>
                    <Text size="sm">
                        You are about to permanently delete this unused section and all its data. 
                        This action is irreversible.
                    </Text>
                </Alert>

                {/* Section Details */}
                <Card withBorder p="md" bg="gray.0">
                    <Stack gap="xs">
                        <Group justify="space-between">
                            <Text fw={500}>Section Name:</Text>
                            <Text>{section.name}</Text>
                        </Group>
                        <Group justify="space-between">
                            <Text fw={500}>Section ID:</Text>
                            <Text>{section.id}</Text>
                        </Group>
                        <Group justify="space-between">
                            <Text fw={500}>Style:</Text>
                            <Badge
                                size="sm"
                                variant="light"
                                color={section.styleName ? "blue" : "gray"}
                            >
                                {section.styleName || 'No style'}
                            </Badge>
                        </Group>
                        <Group justify="space-between">
                            <Text fw={500}>Style ID:</Text>
                            <Text>{section.idStyles}</Text>
                        </Group>
                    </Stack>
                </Card>

                {/* Confirmation Input */}
                <Stack gap="xs">
                    <Text fw={500}>
                        To confirm deletion, type the section name: <Text span c="red" fw={600}>{section.name}</Text>
                    </Text>
                    <TextInput
                        placeholder={`Type "${section.name}" to confirm`}
                        value={confirmationText}
                        onChange={(event) => setConfirmationText(event.currentTarget.value)}
                        error={confirmationText && !isConfirmationValid ? 'Section name does not match' : null}
                    />
                </Stack>

                {/* Actions */}
                <Group justify="flex-end" gap="sm">
                    <Button 
                        variant="subtle" 
                        onClick={handleClose}
                        disabled={deleteMutation.isPending}
                    >
                        Cancel
                    </Button>
                    <Button
                        color="red"
                        leftSection={<IconTrash size={16} />}
                        onClick={handleDelete}
                        disabled={!isConfirmationValid || deleteMutation.isPending}
                        loading={deleteMutation.isPending}
                    >
                        Delete Section
                    </Button>
                </Group>
            </Stack>
        </Modal>
    );
}
