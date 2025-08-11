'use client';

import { useState, useEffect, useMemo } from 'react';
import {
    Modal,
    Button,
    Group,
    Stack,
    Text,
    Alert,
    Code,
    Tabs
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconAlertTriangle, IconCheck, IconCode, IconFilter } from '@tabler/icons-react';
import { defaultValidator, QueryBuilder, RuleGroupType, formatQuery } from 'react-querybuilder';
import { QueryBuilderMantine } from '@react-querybuilder/mantine';
import 'react-querybuilder/dist/query-builder.css';
import { useTableColumns } from '../../../../../hooks/useData';

interface IFilterBuilderModalProps {
    opened: boolean;
    onClose: () => void;
    onSave: (filter: string) => void;
    initialValue?: string;
    tableName?: string;
}

// Build fields from real column list
function useQueryBuilderFields(tableName?: string) {
    const { data: columnsResp } = useTableColumns(tableName || undefined);
    return useMemo(() => {
        const cols = columnsResp?.columns || [];
        // Default to text datatype; users can still write SQL for advanced types
        return cols.map((c) => ({ name: c.name, label: c.name, dataType: 'text' as const }));
    }, [columnsResp]);
}

const initialQuery: RuleGroupType = {
    combinator: 'and',
    rules: []
};

export function FilterBuilderModal({
    opened,
    onClose,
    onSave,
    initialValue,
    tableName = 'users'
}: IFilterBuilderModalProps) {
    const [query, setQuery] = useState<RuleGroupType>(initialQuery);
    const [activeTab, setActiveTab] = useState<string>('builder');
    const [rawSql, setRawSql] = useState(initialValue || '');
    const fields = useQueryBuilderFields(tableName);

    // Initialize query from initial value
    useEffect(() => {
        if (opened) {
            if (initialValue && initialValue.trim()) {
                setRawSql(initialValue);
                // For now, we'll start with empty query builder when there's existing SQL
                // In a real implementation, you might want to parse simple SQL to query builder format
                setQuery(initialQuery);
            } else {
                setQuery(initialQuery);
                setRawSql('');
            }
        }
    }, [opened, initialValue]);

    const handleSave = () => {
        let filterToSave = '';

        if (activeTab === 'builder') {
            // Convert query builder to SQL
            try {
                const sqlQuery = formatQuery(query, 'sql');
                filterToSave = sqlQuery;
            } catch (error) {
                notifications.show({
                    title: 'Error',
                    message: 'Failed to convert query to SQL format',
                    color: 'red',
                    icon: <IconAlertTriangle size={16} />
                });
                return;
            }
        } else {
            // Use raw SQL
            filterToSave = rawSql.trim();
        }

        onSave(filterToSave);
        
        notifications.show({
            title: 'Success',
            message: 'Filter saved successfully',
            color: 'green',
            icon: <IconCheck size={16} />
        });
        
        onClose();
    };

    const handleQueryChange = (newQuery: RuleGroupType) => {
        setQuery(newQuery);
        // Update raw SQL tab with generated SQL
        try {
            const sqlQuery = formatQuery(newQuery, 'sql');
            setRawSql(sqlQuery);
        } catch (error) {
            console.warn('Failed to generate SQL:', error);
        }
    };

    const getCurrentPreview = () => {
        if (activeTab === 'builder') {
            try {
                return formatQuery(query, 'sql');
            } catch {
                return 'Invalid query structure';
            }
        } else {
            return rawSql || 'No filter specified';
        }
    };

    return (
        <Modal
            opened={opened}
            onClose={onClose}
            title={`Filter Builder - ${tableName}`}
            size="lg"
        >
            <Stack gap="md">
                <Alert variant="light" color="blue" icon={<IconFilter size={16} />}>
                    <Text size="sm">
                        Build advanced filters for your data source. You can use the visual builder or write raw SQL.
                    </Text>
                </Alert>

                <Tabs value={activeTab} onChange={(value) => setActiveTab(value || 'builder')}>
                    <Tabs.List>
                        <Tabs.Tab value="builder" leftSection={<IconFilter size={16} />}>
                            Query Builder
                        </Tabs.Tab>
                        <Tabs.Tab value="sql" leftSection={<IconCode size={16} />}>
                            Raw SQL
                        </Tabs.Tab>
                    </Tabs.List>

                    <Tabs.Panel value="builder" pt="md">
                        <Stack gap="md">
                            <Text size="sm" c="dimmed">
                                Build your filter using the visual query builder:
                            </Text>
                            
                            <QueryBuilderMantine>
                                <QueryBuilder
                                    fields={fields}
                                    query={query}
                                    onQueryChange={handleQueryChange}
                                    validator={defaultValidator}
                                    controlClassnames={{
                                        queryBuilder: 'validateQuery'
                                    }}
                                />
                            </QueryBuilderMantine>
                        </Stack>
                    </Tabs.Panel>

                    <Tabs.Panel value="sql" pt="md">
                        <Stack gap="md">
                            <Text size="sm" c="dimmed">
                                Write raw SQL WHERE clause conditions:
                            </Text>
                            
                            <textarea
                                value={rawSql}
                                onChange={(e) => setRawSql(e.target.value)}
                                placeholder="Enter SQL WHERE clause conditions (without WHERE keyword)&#10;Example: status = 'active' AND created_at > '2023-01-01'"
                                rows={6}
                                style={{
                                    width: '100%',
                                    padding: '0.75rem',
                                    border: '1px solid var(--mantine-color-gray-4)',
                                    borderRadius: 'var(--mantine-radius-sm)',
                                    fontFamily: 'monospace',
                                    fontSize: '0.875rem'
                                }}
                            />
                        </Stack>
                    </Tabs.Panel>
                </Tabs>

                {/* Preview */}
                <Stack gap="xs">
                    <Text size="sm" fw={500}>Generated SQL Preview:</Text>
                    <Code block p="sm" style={{ fontSize: '0.8rem' }}>
                        {getCurrentPreview()}
                    </Code>
                </Stack>

                <Group justify="flex-end" gap="sm">
                    <Button variant="outline" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button onClick={handleSave}>
                        Apply Filter
                    </Button>
                </Group>
            </Stack>
        </Modal>
    );
}