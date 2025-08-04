'use client';

import { useState } from 'react';
import { Card, Title, Text, Stack } from '@mantine/core';
import { FieldRenderer, IFieldData } from '../field-renderer/FieldRenderer';

            // Example field configurations
            const exampleFields: IFieldData[] = [
                {
                    id: 1,
                    name: 'css_classes',
                    title: 'CSS Classes',
                    type: 'select-css',
                    default_value: null,
                    help: 'Select CSS classes for styling',
                    fieldConfig: {
                        multiSelect: true,
                        separator: ' ',
                        apiUrl: '/cms-api/v1/frontend/css-classes'
                    }
                },
                {
                    id: 2,
                    name: 'single_css_class',
                    title: 'Single CSS Class',
                    type: 'select-css',
                    default_value: null,
                    help: 'Select a single CSS class',
                    fieldConfig: {
                        multiSelect: false,
                        apiUrl: '/cms-api/v1/frontend/css-classes'
                    }
                },
                {
                    id: 3,
                    name: 'groups',
                    title: 'Groups',
                    type: 'select-group',
                    default_value: null,
                    help: 'Select groups',
                    fieldConfig: {
                        multiSelect: true,
                        separator: ',',
                        apiUrl: '/cms-api/v1/frontend/groups-options'
                    }
                },
                {
                    id: 4,
                    name: 'data_tables',
                    title: 'Data Tables',
                    type: 'select-data_table',
                    default_value: null,
                    help: 'Select data tables',
                    fieldConfig: {
                        multiSelect: false,
                        separator: ',',
                        apiUrl: '/cms-api/v1/frontend/data-tables-options'
                    }
                },
                {
                    id: 5,
                    name: 'page_keywords',
                    title: 'Page Keywords',
                    type: 'select-page-keyword',
                    default_value: null,
                    help: 'Select page keywords',
                    fieldConfig: {
                        multiSelect: true,
                        separator: ',',
                        apiUrl: '/cms-api/v1/frontend/page-keywords-options'
                    }
                }
            ];

export function FieldConfigurationExample() {
    const [fieldValues, setFieldValues] = useState<Record<string, string>>({});

    const handleFieldChange = (fieldName: string, value: string | boolean) => {
        setFieldValues(prev => ({
            ...prev,
            [fieldName]: typeof value === 'string' ? value : String(value)
        }));
    };

    return (
        <Card p="lg">
            <Title order={3} mb="md">Field Configuration Example</Title>
            <Text size="sm" c="dimmed" mb="lg">
                This demonstrates the dynamic field configuration system with API-driven select fields.
            </Text>
            
            <Stack gap="lg">
                {exampleFields.map(field => (
                    <FieldRenderer
                        key={field.id}
                        field={field}
                        value={fieldValues[field.name] || ''}
                        onChange={(value) => handleFieldChange(field.name, value)}
                    />
                ))}
            </Stack>
            
            <Card mt="lg" p="md" withBorder>
                <Title order={4} mb="sm">Current Values</Title>
                <pre style={{ fontSize: '12px', overflow: 'auto' }}>
                    {JSON.stringify(fieldValues, null, 2)}
                </pre>
            </Card>
        </Card>
    );
} 