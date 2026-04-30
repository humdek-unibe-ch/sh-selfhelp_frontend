import { Modal, Stack, Alert, List, Group, Button, Text } from "@mantine/core";
import { IconAlertTriangle } from "@tabler/icons-react";

interface BulkRemoveModalProps {
    opened: boolean;
    onClose: () => void;
    selectedSections: { id: number; name: string }[];
    onConfirm: () => void;
}

export function BulkRemoveModal({ opened, onClose, selectedSections, onConfirm }: BulkRemoveModalProps) {
    return (
        <Modal opened={opened} onClose={onClose} title="Delete Sections" centered size="lg">
            <Stack>
                <Alert icon={<IconAlertTriangle size={20} />} color="red" title="Warning">
                    This action cannot be undone. All selected sections and their children will be permanently deleted.
                </Alert>
                <Text fw={500}>Selected sections ({selectedSections.length}):</Text>
                <List>
                    {selectedSections.map(({ id, name }) => (
                        <List.Item key={id}>{name}</List.Item>
                    ))}
                </List>
                <Group justify="flex-end" mt="md">
                    <Button variant="light" onClick={onClose}>Cancel</Button>
                    <Button color="red" onClick={onConfirm}>
                        Yes, Delete All
                    </Button>
                </Group>
            </Stack>
        </Modal>
    );
}