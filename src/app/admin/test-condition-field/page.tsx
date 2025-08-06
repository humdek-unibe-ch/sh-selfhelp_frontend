'use client';

import { useState } from 'react';
import { Container, Stack, Title, Paper, Text, Code, Button, Group } from '@mantine/core';
import { FieldRenderer } from '../../components/admin/shared/field-renderer/FieldRenderer';
import type { IFieldData } from '../../components/admin/shared/field-renderer/FieldRenderer';

export default function TestConditionFieldPage() {
    const [conditionValue, setConditionValue] = useState('');

    // Mock field data for condition field
    const mockConditionField: IFieldData = {
        id: 1,
        name: 'test_condition',
        title: 'Test Condition Field',
        type: 'condition',
        default_value: null,
        help: 'This is a test condition field that demonstrates the condition builder functionality.',
        disabled: false,
        hidden: 0,
        display: false
    };

    const handleReset = () => {
        setConditionValue('');
    };

    const handleSetSampleCondition = () => {
        const sampleCondition = {
            "and": [
                {
                    "==": ["user_group", "$admin"]
                },
                {
                    ">=": ["__current_date__", "2024-01-01"]
                }
            ]
        };
        setConditionValue(JSON.stringify(sampleCondition));
    };

    return (
        <Container size="lg" py="xl">
            <Stack gap="xl">
                <div>
                    <Title order={1} mb="md">Condition Field Test Page</Title>
                    <Text c="dimmed">
                        Test the new condition field type with React Query Builder integration.
                    </Text>
                </div>

                <Paper p="xl" withBorder>
                    <Stack gap="lg">
                        <div>
                            <Title order={3} mb="sm">Condition Field Demo</Title>
                            <Text size="sm" c="dimmed" mb="md">
                                Click the button below to open the condition builder modal using only built-in React Query Builder operators. 
                                Features validation feedback, show branches, drag-and-drop, and JSON Logic export.
                            </Text>
                        </div>

                        <FieldRenderer
                            field={mockConditionField}
                            value={conditionValue}
                            onChange={setConditionValue}
                            disabled={false}
                        />

                        <Group gap="sm">
                            <Button variant="outline" size="sm" onClick={handleReset}>
                                Reset Condition
                            </Button>
                            <Button variant="outline" size="sm" onClick={handleSetSampleCondition}>
                                Set Sample Condition
                            </Button>
                        </Group>

                        {conditionValue && (
                            <div>
                                <Text fw={500} mb="sm">Current Condition Value (JSON Logic):</Text>
                                <Code block>
                                    {conditionValue ? JSON.stringify(JSON.parse(conditionValue), null, 2) : 'No condition set'}
                                </Code>
                            </div>
                        )}
                    </Stack>
                </Paper>

                <Paper p="xl" withBorder>
                    <Stack gap="md">
                        <Title order={3}>Available Field Types</Title>
                        <Text size="sm" c="dimmed">
                            The condition builder supports the following field types based on your old jQuery implementation:
                        </Text>
                        
                        <Stack gap="xs">
                            <Text size="sm"><strong>User Group:</strong> Multi-select from available groups with in/notIn operators</Text>
                            <Text size="sm"><strong>Field Name:</strong> Text input with standard comparison operators (=, !=, >, <, etc.)</Text>
                            <Text size="sm"><strong>Date Fields:</strong> Current Date, Current Datetime, Current Time, Birth Date with date/datetime inputs</Text>
                            <Text size="sm"><strong>Page Keyword:</strong> Dynamic select from pages API (/pages endpoint)</Text>
                            <Text size="sm"><strong>Platform:</strong> Select from pageAccessTypes lookups</Text>
                            <Text size="sm"><strong>Language:</strong> Select from available languages</Text>
                            <Text size="sm"><strong>Last Login:</strong> Datetime input with comparison operators</Text>
                            <Text size="sm" c="green"><strong>Features:</strong> Built-in operators only, validation feedback, show branches, no NOT toggle</Text>
                        </Stack>
                    </Stack>
                </Paper>
            </Stack>
        </Container>
    );
}