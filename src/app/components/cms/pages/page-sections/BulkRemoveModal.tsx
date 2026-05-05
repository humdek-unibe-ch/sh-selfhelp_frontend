import { Modal, Stack, Alert, List, Group, Button, Text } from "@mantine/core";
import { IconAlertTriangle } from "@tabler/icons-react";

interface BulkRemoveModalProps {
  opened: boolean;
  onClose: () => void;
  selectedSections: { id: number; name: string }[];
  onConfirm: () => void;
}

export function BulkRemoveModal({
  opened,
  onClose,
  selectedSections,
  onConfirm,
}: BulkRemoveModalProps) {
  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Remove Sections"
      centered
      size="lg"
    >
      <Stack>
        <Alert
          icon={<IconAlertTriangle size={20} />}
          color="blue"
          title="Warning"
        >
          This will remove the section from this page/parent, but the section
          will not be deleted permanently. You can add it back later from the
          unused sections.
        </Alert>
        <Text c={"orange"} fw={500}>Selected sections ({selectedSections.length}):</Text>
        <Stack gap="xs">
          {selectedSections.map(({ id, name }) => (
            <Group
              key={id}
              justify="space-between"
              px="sm"
              py={6}
              style={{
                border: "1px solid var(--mantine-color-gray-3)",
                borderRadius: 8,
                backgroundColor: "var(--mantine-color-gray-0)",
              }}
            >
              <Text size="sm" fw={500}>
                {name}
              </Text>

              <Text size="xs" c="dimmed">
                #{id}
              </Text>
            </Group>
          ))}
        </Stack>
        <Group justify="flex-end" mt="md">
          <Button variant="light" onClick={onClose}>
            Cancel
          </Button>
          <Button color="orange" onClick={onConfirm}>
          Remove All
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
