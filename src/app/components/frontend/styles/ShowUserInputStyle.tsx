import React, { useState, useMemo } from 'react';
import { Box, Card, Table, Button, Modal, Text, Group, Collapse, Center } from '@mantine/core';
import { IconTrash, IconEye, IconChevronDown, IconChevronUp } from '@tabler/icons-react';
import { IShowUserInputStyle } from '../../../../types/common/styles.types';

interface IShowUserInputStyleProps {
    style: IShowUserInputStyle;
}

// Mock data interface (simplified from the deleted types)
interface IUserInputEntry {
    id: number;
    timestamp: string;
    name: string;
    email: string;
    message: string;
    data: Record<string, any>;
}

const ShowUserInputStyle: React.FC<IShowUserInputStyleProps> = ({ style }) => {
    const [deleteModalOpened, setDeleteModalOpened] = useState(false);
    const [selectedEntry, setSelectedEntry] = useState<IUserInputEntry | null>(null);
    const [expandedEntries, setExpandedEntries] = useState<Set<string>>(new Set());
    const [entries, setEntries] = useState<IUserInputEntry[]>([]);

    const deleteTitle = style.delete_title?.content || 'Delete Entry';
    const labelDelete = style.label_delete?.content || 'Delete';
    const deleteContent = style.delete_content?.content || 'Are you sure you want to delete this entry?';
    const isExpanded = style.is_expanded?.content === '1';
    const loadAsTable = style.load_as_table?.content === '1';
    const formName = style.form_name?.content;

    // Generate mock data based on form_name
    const mockEntries = useMemo(() => {
        if (!formName) return [];
        
        return [
            {
                id: 1,
                timestamp: new Date().toISOString(),
                name: 'John Doe',
                email: 'john.doe@example.com',
                message: `Sample entry for form: ${formName}`,
                data: {
                    'Form Name': formName,
                    'Additional Info': 'This is mock data since API endpoints are not available',
                    'Status': 'Sample Entry'
                }
            },
            {
                id: 2,
                timestamp: new Date(Date.now() - 86400000).toISOString(), // Yesterday
                name: 'Jane Smith',
                email: 'jane.smith@example.com',
                message: `Another sample entry for form: ${formName}`,
                data: {
                    'Form Name': formName,
                    'Additional Info': 'Mock data for demonstration purposes',
                    'Status': 'Demo Entry'
                }
            }
        ];
    }, [formName]);

    // Initialize entries with mock data
    React.useEffect(() => {
        setEntries(mockEntries);
    }, [mockEntries]);

    const handleDelete = (entry: IUserInputEntry) => {
        setSelectedEntry(entry);
        setDeleteModalOpened(true);
    };

    const confirmDelete = () => {
        if (selectedEntry) {
            // Remove entry from local state (mock deletion)
            setEntries(prevEntries => prevEntries.filter(entry => entry.id !== selectedEntry.id));
            setDeleteModalOpened(false);
            setSelectedEntry(null);
        }
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

    // Format timestamp to European style
    const formatTimestamp = (timestamp: string) => {
        try {
            return new Date(timestamp).toLocaleString('de-DE', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            });
        } catch {
            return timestamp;
        }
    };

    // Show message if no form_name is provided
    if (!formName) {
        return (
            <Box className={style.css ?? ""}>
                <Center py="xl">
                    <Text c="orange" ta="center">
                        Please configure the form_name field to display user input data.
                    </Text>
                </Center>
            </Box>
        );
    }

    if (loadAsTable) {
        return (
            <Box className={style.css ?? ""}>
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
                        {entries.map((entry) => (
                            <Table.Tr key={entry.id}>
                                <Table.Td>{formatTimestamp(entry.timestamp)}</Table.Td>
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
                        <Button 
                            color="red" 
                            onClick={confirmDelete}
                        >
                            {labelDelete}
                        </Button>
                    </Group>
                </Modal>
            </Box>
        );
    }

    return (
        <Box className={style.css ?? ""}>
            {entries.length === 0 ? (
                <Center py="xl">
                    <Text c="dimmed" ta="center">
                        No entries found for form: {formName}
                    </Text>
                </Center>
            ) : (
                entries.map((entry) => {
                    const entryId = entry.id.toString();
                    const isEntryExpanded = expandedEntries.has(entryId) || isExpanded;

                    return (
                        <Card key={entry.id} shadow="sm" padding="lg" radius="md" withBorder mb="md">
                            <Group justify="space-between" mb="md">
                                <Group>
                                    <Text fw={500}>{entry.name}</Text>
                                    <Text size="sm" c="dimmed">{formatTimestamp(entry.timestamp)}</Text>
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
                })
            )}

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
                    <Button 
                        color="red" 
                        onClick={confirmDelete}
                    >
                        {labelDelete}
                    </Button>
                </Group>
            </Modal>
        </Box>
    );
};

export default ShowUserInputStyle;