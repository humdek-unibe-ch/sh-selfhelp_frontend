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
import { useForceDeleteSectionMutation } from '../../../../../../hooks/useSectionUtility';

interface IForceDeleteSectionModalProps {
    section: { id: number; name: string } | null;
    pageKeyword: string;
    opened: boolean;
    onClose: () => void;
    onDeleted: () => void;
}

export function ForceDeleteSectionModal({ 
    section, 
    pageKeyword,
    opened, 
    onClose, 
    onDeleted 
}: IForceDeleteSectionModalProps) {
    const [confirmationText, setConfirmationText] = useState('');

    const deleteMutation = useForceDeleteSectionMutation();

    const handleClose = () => {
        setConfirmationText('');
        onClose();
    };

    const handleDelete = () => {
        if (!section) return;
        deleteMutation.mutate({ pageKeyword, sectionId: section.id }, {
            onSuccess: () => {
                handleClose();
                onDeleted();
            }
        });
    };

    if (!section) return null;

    const confirmationPhrase = 'FORCE DELETE';
    const isConfirmationValid = confirmationText === confirmationPhrase;

    return (
        <Modal
            opened={opened}
            onClose={handleClose}
            title={
                <Group gap="sm">
                    <IconAlertTriangle color="var(--mantine-color-red-6)" size={20} />
                    <Text fw={600} c="red">Force Delete Section</Text>
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
                    <Text fw={500} mb="xs">Dangerous Operation - This action cannot be undone!</Text>
                    <Text size="sm">
                        Force delete will permanently remove this section from the page, even if it has children 
                        or is referenced elsewhere. This is more aggressive than a normal delete and may cause 
                        data inconsistencies.
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
                            <Text fw={500}>Page:</Text>
                            <Badge variant="light" color="blue">{pageKeyword}</Badge>
                        </Group>
                    </Stack>
                </Card>

                {/* Confirmation Input */}
                <Stack gap="xs">
                    <Text fw={500}>
                        To confirm force deletion, type: <Text span c="red" fw={600}>{confirmationPhrase}</Text>
                    </Text>
                    <TextInput
                        placeholder={`Type "${confirmationPhrase}" to confirm`}
                        value={confirmationText}
                        onChange={(event) => setConfirmationText(event.currentTarget.value)}
                        error={confirmationText && !isConfirmationValid ? 'Confirmation phrase does not match' : null}
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
                        Force Delete Section
                    </Button>
                </Group>
            </Stack>
        </Modal>
    );
}
