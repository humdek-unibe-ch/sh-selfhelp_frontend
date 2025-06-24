import React, { useState } from 'react';
import type { IShowUserInputStyle } from '../../../types/common/styles.types';
import { Box, Card, Table, Button, Modal, Text, Group, Collapse } from '@mantine/core';
import { IconTrash, IconEye, IconChevronDown, IconChevronUp } from '@tabler/icons-react';

interface IShowUserInputStyleProps {
    style: IShowUserInputStyle;
}

const ShowUserInputStyle: React.FC<IShowUserInputStyleProps> = ({ style }) => {
    const [deleteModalOpened, setDeleteModalOpened] = useState(false);
    const [selectedEntry, setSelectedEntry] = useState<any>(null);
    const [expandedEntries, setExpandedEntries] = useState<Set<string>>(new Set());

    const deleteTitle = style.delete_title?.content || 'Delete Entry';
    const labelDelete = style.label_delete?.content || 'Delete';
    const deleteContent = style.delete_content?.content || 'Are you sure you want to delete this entry?';
    const isLog = style.is_log?.content === '1';
    const anchor = style.anchor?.content;
    const formName = style.form_name?.content;
    const isExpanded = style.is_expanded?.content === '1';
    const columnNames = style.column_names?.content;
    const loadAsTable = style.load_as_table?.content === '1';

    // Mock data - in real implementation this would come from API
    const mockEntries = [
        {
            id: 1,
            timestamp: '2024-01-15 10:30:00',
            name: 'John Doe',
            email: 'john@example.com',
            message: 'This is a sample entry',
            data: { field1: 'value1', field2: 'value2' }
        },
        {
            id: 2,
            timestamp: '2024-01-14 15:45:00',
            name: 'Jane Smith',
            email: 'jane@example.com',
            message: 'Another sample entry',
            data: { field1: 'value3', field2: 'value4' }
        }
    ];

    const handleDelete = (entry: any) => {
        setSelectedEntry(entry);
        setDeleteModalOpened(true);
    };

    const confirmDelete = () => {
        // In real implementation, make API call to delete entry
        console.log('Deleting entry:', selectedEntry);
        setDeleteModalOpened(false);
        setSelectedEntry(null);
    };

    const toggleExpand = (entryId: string) => {
        const newExpanded = new Set(expandedEntries);
        if (newExpanded.has(entryId)) {
            newExpanded.delete(entryId);
        } else {
            newExpanded.add(entryId);
        }
        setExpandedEntries(newExpanded);
    };

    if (loadAsTable) {
        return (
            <Box className={style.css}>
                <Table striped highlightOnHover withTableBorder>
                    <Table.Thead>
                        <Table.Tr>
                            <Table.Th>Timestamp</Table.Th>
                            <Table.Th>Name</Table.Th>
                            <Table.Th>Email</Table.Th>
                            <Table.Th>Message</Table.Th>
                            <Table.Th>Actions</Table.Th>
                        </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                        {mockEntries.map((entry) => (
                            <Table.Tr key={entry.id}>
                                <Table.Td>{entry.timestamp}</Table.Td>
                                <Table.Td>{entry.name}</Table.Td>
                                <Table.Td>{entry.email}</Table.Td>
                                <Table.Td>{entry.message}</Table.Td>
                                <Table.Td>
                                    <Group gap="xs">
                                        <Button
                                            size="xs"
                                            variant="outline"
                                            leftSection={<IconEye size={14} />}
                                        >
                                            View
                                        </Button>
                                        <Button
                                            size="xs"
                                            color="red"
                                            variant="outline"
                                            leftSection={<IconTrash size={14} />}
                                            onClick={() => handleDelete(entry)}
                                        >
                                            {labelDelete}
                                        </Button>
                                    </Group>
                                </Table.Td>
                            </Table.Tr>
                        ))}
                    </Table.Tbody>
                </Table>

                <Modal
                    opened={deleteModalOpened}
                    onClose={() => setDeleteModalOpened(false)}
                    title={deleteTitle}
                    centered
                >
                    <Text mb="md">{deleteContent}</Text>
                    <Group justify="flex-end">
                        <Button variant="outline" onClick={() => setDeleteModalOpened(false)}>
                            Cancel
                        </Button>
                        <Button color="red" onClick={confirmDelete}>
                            {labelDelete}
                        </Button>
                    </Group>
                </Modal>
            </Box>
        );
    }

    return (
        <Box className={style.css}>
            {mockEntries.map((entry) => {
                const entryId = entry.id.toString();
                const isEntryExpanded = expandedEntries.has(entryId) || isExpanded;

                return (
                    <Card key={entry.id} shadow="sm" padding="lg" radius="md" withBorder mb="md">
                        <Group justify="space-between" mb="md">
                            <Group>
                                <Text fw={500}>{entry.name}</Text>
                                <Text size="sm" c="dimmed">{entry.timestamp}</Text>
                            </Group>
                            <Group gap="xs">
                                <Button
                                    size="xs"
                                    variant="subtle"
                                    onClick={() => toggleExpand(entryId)}
                                    leftSection={isEntryExpanded ? <IconChevronUp size={14} /> : <IconChevronDown size={14} />}
                                >
                                    {isEntryExpanded ? 'Collapse' : 'Expand'}
                                </Button>
                                <Button
                                    size="xs"
                                    color="red"
                                    variant="outline"
                                    leftSection={<IconTrash size={14} />}
                                    onClick={() => handleDelete(entry)}
                                >
                                    {labelDelete}
                                </Button>
                            </Group>
                        </Group>

                        <Text mb="md">{entry.message}</Text>

                        <Collapse in={isEntryExpanded}>
                            <Box>
                                <Text size="sm" fw={500} mb="xs">Additional Data:</Text>
                                <Table>
                                    <Table.Tbody>
                                        {Object.entries(entry.data).map(([key, value]) => (
                                            <Table.Tr key={key}>
                                                <Table.Td fw={500}>{key}</Table.Td>
                                                <Table.Td>{String(value)}</Table.Td>
                                            </Table.Tr>
                                        ))}
                                    </Table.Tbody>
                                </Table>
                            </Box>
                        </Collapse>
                    </Card>
                );
            })}

            <Modal
                opened={deleteModalOpened}
                onClose={() => setDeleteModalOpened(false)}
                title={deleteTitle}
                centered
            >
                <Text mb="md">{deleteContent}</Text>
                <Group justify="flex-end">
                    <Button variant="outline" onClick={() => setDeleteModalOpened(false)}>
                        Cancel
                    </Button>
                    <Button color="red" onClick={confirmDelete}>
                        {labelDelete}
                    </Button>
                </Group>
            </Modal>
        </Box>
    );
};

export default ShowUserInputStyle; 