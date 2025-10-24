'use client';

import React from 'react';
import { Stack, Paper, Group, Text, Box, TextInput } from '@mantine/core';
import { IconInfoCircle } from '@tabler/icons-react';
import { GlobalFieldRenderer, GlobalFieldType } from '../../shared';
import { useSectionFormStore } from '../../../../store/sectionFormStore';
import { SectionPropertyField } from './section-field-connectors';
import styles from './SectionInspector.module.css';

interface ISectionGlobalFieldsProps {
    globalFieldTypes: GlobalFieldType[];
    dataVariables?: Record<string, any>;
}

/**
 * Group component for section global fields
 * Subscribes to the entire globalFields object since these fields are related
 * and often change together. This isolates global field changes from the rest of the form.
 */
export const SectionGlobalFields = React.memo(function SectionGlobalFields({
    globalFieldTypes,
    dataVariables
}: ISectionGlobalFieldsProps) {
    // Subscribe to globalFields - isolated from other form changes
    const globalFields = useSectionFormStore((state) => state.globalFields);
    const setGlobalField = useSectionFormStore((state) => state.setGlobalField);

    return (
        <Stack gap="md">
            {globalFieldTypes.map(fieldType => (
                <GlobalFieldRenderer
                    key={fieldType}
                    fieldType={fieldType}
                    value={globalFields[fieldType]}
                    onChange={(value) => setGlobalField(fieldType, value)}
                    dataVariables={dataVariables}
                    className={styles.fullWidthLabel}
                />
            ))}
        </Stack>
    );
});

interface ISectionPropertiesProps {
    fields: any[];
    dataVariables?: Record<string, any>;
}

/**
 * Group component for section property fields
 * Contains individual SectionPropertyField components that each subscribe
 * to their own specific property value for maximum granularity
 */
export const SectionProperties = React.memo(function SectionProperties({
    fields,
    dataVariables
}: ISectionPropertiesProps) {
    const propertyFieldsToDisplay = fields.filter(
        field => !field.display && !field.name.startsWith('mantine_')
    );

    return (
        <Stack gap="md">
            {propertyFieldsToDisplay.map((field: any) => (
                <SectionPropertyField
                    key={`${field.id}-property`}
                    field={field}
                    className={styles.fullWidthLabel}
                    dataVariables={dataVariables}
                />
            ))}
        </Stack>
    );
});

interface ISectionMantinePropertiesProps {
    fields: any[];
    dataVariables?: Record<string, any>;
}

/**
 * Group component for Mantine-specific properties
 * Only renders if use_mantine_style is enabled
 * Subscribes to the specific boolean flag to determine visibility
 */
export const SectionMantineProperties = React.memo(function SectionMantineProperties({
    fields,
    dataVariables
}: ISectionMantinePropertiesProps) {
    // Subscribe only to the specific flag that controls visibility
    const useMantineStyle = useSectionFormStore(
        (state) => state.properties?.use_mantine_style === true
    );

    if (!useMantineStyle) {
        return null;
    }

    const mantineFieldsToDisplay = fields.filter(
        field => !field.display && field.name.startsWith('mantine_')
    );

    return (
        <Stack gap="md">
            {mantineFieldsToDisplay.map((field: any) => (
                <SectionPropertyField
                    key={`${field.id}-mantine`}
                    field={field}
                    className={styles.fullWidthLabel}
                    dataVariables={dataVariables}
                />
            ))}
        </Stack>
    );
});

interface ISectionInfoPanelProps {
    section?: any;
}

/**
 * Panel component for section information and name editing
 * Subscribes only to sectionName to isolate name changes from field updates
 */
export const SectionInfoPanel = React.memo(function SectionInfoPanel({
    section
}: ISectionInfoPanelProps) {
    // Subscribe only to sectionName
    const sectionName = useSectionFormStore((state) => state.sectionName);
    const setSectionName = useSectionFormStore((state) => state.setSectionName);

    if (!section) return null;

    return (
        <Paper withBorder style={{ backgroundColor: 'light-dark(var(--mantine-color-blue-0), var(--mantine-color-blue-9))' }}>
            <Box p="md">
                <Group gap="xs" mb="sm">
                    <IconInfoCircle size={16} style={{ color: 'var(--mantine-color-blue-6)' }} />
                    <Text size="sm" fw={500} c="blue">Section Information</Text>
                </Group>
                
                <Stack gap="xs">
                    <Box>
                        <Text size="xs" fw={500} c="dimmed" mb="xs">Section Name</Text>
                        <TextInput
                            value={sectionName}
                            onChange={(e) => setSectionName(e.currentTarget.value)}
                            placeholder="Enter section name"
                            size="sm"
                        />
                    </Box>
                    
                    <Group gap="md" wrap="wrap">
                        <Box>
                            <Text size="xs" fw={500} c="dimmed">Style</Text>
                            <Text size="sm">{section.style.name}</Text>
                        </Box>
                        <Box>
                            <Text size="xs" fw={500} c="dimmed">Type</Text>
                            <Text size="sm">{section.style.type}</Text>
                        </Box>
                        <Box>
                            <Text size="xs" fw={500} c="dimmed">Section ID</Text>
                            <Text size="sm">{section.id}</Text>
                        </Box>
                    </Group>
                    
                    {section.style.description && (
                        <Box mt="sm">
                            <Text size="xs" fw={500} c="dimmed">Description</Text>
                            <Text size="sm">{section.style.description}</Text>
                        </Box>
                    )}
                </Stack>
            </Box>
        </Paper>
    );
});

