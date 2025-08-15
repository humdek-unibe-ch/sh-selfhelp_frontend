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
    List,
    ScrollArea
} from '@mantine/core';
import { IconAlertTriangle, IconTrash } from '@tabler/icons-react';
import { useDeleteAllUnusedSectionsMutation } from '../../../../../hooks/useSectionUtility';
import type { IUnusedSection } from '../../../../../types/responses/admin/section-utility.types';

interface IDeleteAllUnusedSectionsModalProps {
    sections: IUnusedSection[];
    opened: boolean;
    onClose: () => void;
    onDeleted: () => void;
}

export function DeleteAllUnusedSectionsModal({ 
    sections, 
    opened, 
    onClose, 
    onDeleted 
}: IDeleteAllUnusedSectionsModalProps) {
    const [confirmationText, setConfirmationText] = useState('');

    const deleteAllMutation = useDeleteAllUnusedSectionsMutation();

    const handleClose = () => {
        setConfirmationText('');
        onClose();
    };

    const handleDeleteAll = () => {
        deleteAllMutation.mutate(undefined, {
            onSuccess: () => {
                handleClose();
                onDeleted();
            }
        });
    };

    const confirmationPhrase = 'DELETE ALL SECTIONS';
    const isConfirmationValid = confirmationText === confirmationPhrase;

    return (
        <Modal
            opened={opened}
            onClose={handleClose}
            title={
                <Group gap="sm">
                    <IconAlertTriangle color="var(--mantine-color-red-6)" size={20} />
                    <Text fw={600} c="red">Delete All Unused Sections</Text>
                </Group>
            }
            size="lg"
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
                        You are about to permanently delete <Text span fw={600}>{sections.length} unused sections</Text> and all their data. 
                        This action is irreversible and will affect multiple sections at once.
                    </Text>
                </Alert>

                {/* Sections List */}
                <Card withBorder p="md" bg="gray.0">
                    <Text fw={500} mb="sm">Sections to be deleted:</Text>
                    <ScrollArea h={sections.length > 10 ? 200 : 'auto'}>
                        <List size="sm" spacing="xs">
                            {sections.map((section) => (
                                <List.Item key={section.id}>
                                    <Group gap="xs" wrap="nowrap">
                                        <Text size="sm">
                                            <Text span fw={500}>{section.name}</Text>
                                            <Text span c="dimmed"> (ID: {section.id})</Text>
                                        </Text>
                                        {section.styleName && (
                                            <Text size="xs" c="dimmed">
                                                - {section.styleName}
                                            </Text>
                                        )}
                                    </Group>
                                </List.Item>
                            ))}
                        </List>
                    </ScrollArea>
                </Card>

                {/* Confirmation Input */}
                <Stack gap="xs">
                    <Text fw={500}>
                        To confirm deletion of all {sections.length} sections, type: <Text span c="red" fw={600}>{confirmationPhrase}</Text>
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
                        disabled={deleteAllMutation.isPending}
                    >
                        Cancel
                    </Button>
                    <Button
                        color="red"
                        leftSection={<IconTrash size={16} />}
                        onClick={handleDeleteAll}
                        disabled={!isConfirmationValid || deleteAllMutation.isPending}
                        loading={deleteAllMutation.isPending}
                    >
                        Delete All {sections.length} Sections
                    </Button>
                </Group>
            </Stack>
        </Modal>
    );
}
