'use client';

import { Container, Title, Stack, Paper } from '@mantine/core';
import { FieldConfigurationExample } from '../../components/admin/shared/field-configuration-example/FieldConfigurationExample';

export default function TestFieldsPage() {
    return (
        <Container size="lg" py="xl">
            <Stack gap="xl">
                <Title order={1}>Field Configuration Test</Title>
                
                <Paper p="md" withBorder>
                    <Title order={2} mb="md">Testing New Select Field Types</Title>
                    <FieldConfigurationExample />
                </Paper>
            </Stack>
        </Container>
    );
} 