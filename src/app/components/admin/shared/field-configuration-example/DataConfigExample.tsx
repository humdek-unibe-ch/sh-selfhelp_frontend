'use client';

import { useState } from 'react';
import { Card, Title, Text, Stack, Button, Code, Group, Badge } from '@mantine/core';
import { IconDatabase, IconRefresh } from '@tabler/icons-react';
import { FieldRenderer } from '../field-renderer/FieldRenderer';
import type { IFieldData } from '../field-renderer/FieldRenderer';

const exampleDataConfigField: IFieldData = {
    id: 999,
    name: 'data_configuration',
    title: 'Data Configuration',
    type: 'data-config',
    default_value: '',
    help: 'Configure multiple data sources for dynamic content loading. Each data source can specify tables, fields, and filters to load specific data.',
    disabled: false,
    hidden: 0,
    display: false // Property field
};

const sampleDataConfig = [
    {
        current_user: true,
        all_fields: false,
        scope: 'user_profile',
        table: 'users',
        retrieve: 'first',
        filter: 'status = "active" AND verified = true',
        fields: [
            {
                field_name: 'name',
                field_holder: 'user_name',
                not_found_text: 'Name not available'
            },
            {
                field_name: 'email',
                field_holder: 'user_email',
                not_found_text: 'Email not provided'
            }
        ],
        map_fields: []
    },
    {
        current_user: false,
        all_fields: true,
        scope: 'survey_data',
        table: 'surveys',
        retrieve: 'JSON',
        filter: '',
        fields: [],
        map_fields: [
            {
                field_name: 'title',
                field_new_name: 'survey_title'
            },
            {
                field_name: 'created_at',
                field_new_name: 'creation_date'
            }
        ]
    }
];

export function DataConfigExample() {
    const [fieldValue, setFieldValue] = useState<string>('');
    const [showSample, setShowSample] = useState(false);

    const handleFieldChange = (value: string | boolean) => {
        setFieldValue(typeof value === 'string' ? value : String(value));
    };

    const loadSampleData = () => {
        const sampleJson = JSON.stringify(sampleDataConfig, null, 2);
        setFieldValue(sampleJson);
        setShowSample(true);
    };

    const clearData = () => {
        setFieldValue('');
        setShowSample(false);
    };

    const getConfigSummary = () => {
        if (!fieldValue.trim()) return null;
        
        try {
            const parsed = JSON.parse(fieldValue);
            if (Array.isArray(parsed)) {
                return {
                    count: parsed.length,
                    scopes: parsed.map(config => config.scope).filter(Boolean),
                    tables: [...new Set(parsed.map(config => config.table).filter(Boolean))]
                };
            }
        } catch {
            return null;
        }
        return null;
    };

    const summary = getConfigSummary();

    return (
        <Card p="lg">
            <Stack gap="lg">
                <Group justify="space-between" align="flex-start">
                    <div>
                        <Title order={3} mb="xs">Data Config Field Example</Title>
                        <Text size="sm" c="dimmed">
                            This demonstrates the new data-config field type that allows users to configure multiple data sources 
                            with tables, fields, filters, and mappings through an intuitive modal interface.
                        </Text>
                    </div>
                    <Badge variant="light" color="orange" leftSection={<IconDatabase size={14} />}>
                        data-config
                    </Badge>
                </Group>
                
                <Group gap="sm">
                    <Button
                        variant="light"
                        leftSection={<IconDatabase size={16} />}
                        onClick={loadSampleData}
                        disabled={showSample}
                    >
                        Load Sample Configuration
                    </Button>
                    <Button
                        variant="outline"
                        leftSection={<IconRefresh size={16} />}
                        onClick={clearData}
                        disabled={!fieldValue.trim()}
                    >
                        Clear
                    </Button>
                </Group>

                {summary && (
                    <Card withBorder p="md" bg="blue.0">
                        <Text size="sm" fw={500} mb="xs">Configuration Summary:</Text>
                        <Stack gap="xs">
                            <Text size="sm">
                                <strong>{summary.count}</strong> data source{summary.count !== 1 ? 's' : ''} configured
                            </Text>
                            {summary.scopes.length > 0 && (
                                <Text size="sm">
                                    <strong>Scopes:</strong> {summary.scopes.join(', ')}
                                </Text>
                            )}
                            {summary.tables.length > 0 && (
                                <Text size="sm">
                                    <strong>Tables:</strong> {summary.tables.join(', ')}
                                </Text>
                            )}
                        </Stack>
                    </Card>
                )}
                
                {/* The actual field renderer */}
                <FieldRenderer
                    field={exampleDataConfigField}
                    value={fieldValue}
                    onChange={handleFieldChange}
                />
                
                {/* Show JSON output */}
                {fieldValue.trim() && (
                    <Card withBorder p="md">
                        <Title order={4} mb="sm">Generated JSON Configuration</Title>
                        <Text size="xs" c="dimmed" mb="sm">
                            This is the JSON that would be saved to the database:
                        </Text>
                        <Code block style={{ fontSize: '0.75rem', maxHeight: '300px', overflow: 'auto' }}>
                            {fieldValue}
                        </Code>
                    </Card>
                )}

                {showSample && (
                    <Card withBorder p="md" bg="green.0">
                        <Title order={4} mb="sm">Sample Configuration Explanation</Title>
                        <Stack gap="sm">
                            <div>
                                <Text size="sm" fw={500}>Data Source 1 (user_profile):</Text>
                                <Text size="xs" c="dimmed">
                                    • Loads specific fields (name, email) from users table
                                    • Only for current logged user
                                    • Applies filter for active and verified users
                                    • Maps fields to template variables {'{'}user_name{'}'} and {'{'}user_email{'}'}
                                </Text>
                            </div>
                            <div>
                                <Text size="sm" fw={500}>Data Source 2 (survey_data):</Text>
                                <Text size="xs" c="dimmed">
                                    • Loads all fields from surveys table
                                    • For all users (not just current user)
                                    • Returns data in JSON format
                                    • Maps &apos;title&apos; → &apos;survey_title&apos; and &apos;created_at&apos; → &apos;creation_date&apos;
                                </Text>
                            </div>
                        </Stack>
                    </Card>
                )}
            </Stack>
        </Card>
    );
}