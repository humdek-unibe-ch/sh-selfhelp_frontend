import React, { useState, useMemo } from 'react';
import type { IShowUserInputStyle } from '../../../types/common/styles.types';
import { Box, Card, Table, Button, Modal, Text, Group, Collapse, LoadingOverlay, Center } from '@mantine/core';
import { IconTrash, IconEye, IconChevronDown, IconChevronUp } from '@tabler/icons-react';
import { useUserInputEntries, useDeleteUserInputEntryMutation } from '../../../hooks/useUserInput';
import { IUserInputFilters } from '../../../types/responses/admin/user-input.types';

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

    // Build filters based on style configuration
    const filters: IUserInputFilters = useMemo(() => ({
        page: 1,
        pageSize: 50,
        form_name: formName,
        sort: 'timestamp',
        sortDirection: 'desc',
    }), [formName]);

    // Real API calls
    const { data: userInputData, isLoading, error } = useUserInputEntries(filters);
    const deleteEntryMutation = useDeleteUserInputEntryMutation();

    const entries = userInputData?.data?.entries || [];

    const handleDelete = (entry: any) => {
        setSelectedEntry(entry);
        setDeleteModalOpened(true);
    };

    const confirmDelete = () => {
        if (selectedEntry) {
            deleteEntryMutation.mutate(selectedEntry.id, {
                onSuccess: () => {
                    setDeleteModalOpened(false);
                    setSelectedEntry(null);
                },
            });
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

    if (loadAsTable) {
        return (
            <Box className={style.css} style={{ position: 'relative' }}>
                <LoadingOverlay visible={isLoading} />
                
                {error ? (
                    <Center py="xl">
                        <Text c="red" ta="center">
                            Failed to load entries. Please try again.
                        </Text>
                    </Center>
                ) : (
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
                            loading={deleteEntryMutation.isPending}
                        >
                            {labelDelete}
                        </Button>
                    </Group>
                </Modal>
            </Box>
        );
    }

    return (
        <Box className={style.css} style={{ position: 'relative' }}>
            <LoadingOverlay visible={isLoading} />
            
            {error ? (
                <Center py="xl">
                    <Text c="red" ta="center">
                        Failed to load entries. Please try again.
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
                        loading={deleteEntryMutation.isPending}
                    >
                        {labelDelete}
                    </Button>
                </Group>
            </Modal>
        </Box>
    );
};

export default ShowUserInputStyle; 