/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
'use client';

import React from 'react';
import { Stack, Paper, Group, Text, Box, TextInput, Badge, Alert, Anchor, Tooltip } from '@mantine/core';
import { IconInfoCircle, IconAlertTriangle, IconExternalLink, IconLock } from '@tabler/icons-react';
import { type TStylePlatform } from '@selfhelp/shared/registry';
import { GlobalFieldRenderer, type GlobalFieldType } from '../../shared';
import { useSectionFormStore } from '../../../../store/sectionFormStore';
import { SectionPropertyField } from './section-field-connectors';
import { classifySectionField, offPlatformFieldsWithValues } from './section-field-classify';
import { getStylePlatformByName, PLATFORM_BADGE } from '../../../../../utils/style-platform.utils';
import { type ISectionField, type ISectionDetails, type ISectionDataTableInfo } from '../../../../../types/responses/admin/admin.types';
import styles from './SectionInspector.module.css';

interface ISectionGlobalFieldsProps {
    globalFieldTypes: GlobalFieldType[];
    dataVariables?: Record<string, string>;
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

interface IFieldGroupProps {
    fields: ISectionField[];
    dataVariables?: Record<string, string>;
}

/** Render a flat list of store-connected property fields. */
function PropertyFieldList({ fields, dataVariables, keySuffix }: IFieldGroupProps & { keySuffix: string }) {
    return (
        <Stack gap="md">
            {fields.map((field) => (
                <SectionPropertyField
                    key={`${field.id}-${keySuffix}`}
                    field={field}
                    className={styles.fullWidthLabel}
                    dataVariables={dataVariables}
                />
            ))}
        </Stack>
    );
}

/**
 * Properties — `common`-scoped, cross-platform behavior/data config + portable
 * presentation fields (display=0, unprefixed) the shared mapper consumes for
 * both renderers. Driven solely by the backend field scope, never by the field
 * name or the `display` flag.
 */
export const SectionProperties = React.memo(function SectionProperties({
    fields,
    dataVariables
}: IFieldGroupProps) {
    const propertyFields = fields.filter((f) => classifySectionField(f) === 'property');
    return <PropertyFieldList fields={propertyFields} dataVariables={dataVariables} keySuffix="property" />;
});

/**
 * Web Properties — `web_*` fields (Mantine/web-renderer overrides). Shown
 * whenever the style exposes web fields; the web renderer always uses Mantine
 * (the legacy `use_web_style` master toggle was retired).
 */
export const SectionWebProperties = React.memo(function SectionWebProperties({
    fields,
    dataVariables
}: IFieldGroupProps) {
    const webFields = fields.filter((f) => classifySectionField(f) === 'web');
    return <PropertyFieldList fields={webFields} dataVariables={dataVariables} keySuffix="web" />;
});

/**
 * Mobile Properties — `mobile_*` fields (HeroUI Native / mobile-renderer
 * overrides). No master toggle: mobile overrides apply directly when set.
 */
export const SectionMobileProperties = React.memo(function SectionMobileProperties({
    fields,
    dataVariables
}: IFieldGroupProps) {
    const mobileFields = fields.filter((f) => classifySectionField(f) === 'mobile');
    return <PropertyFieldList fields={mobileFields} dataVariables={dataVariables} keySuffix="mobile" />;
});

interface ICrossPlatformWarningProps {
    fields: ISectionField[];
    stylePlatform: TStylePlatform;
}

/**
 * Cross-platform validation: warn when a single-platform style has values set
 * for the other platform's fields (data drift the renderer will ignore).
 */
export const CrossPlatformFieldWarning = React.memo(function CrossPlatformFieldWarning({
    fields,
    stylePlatform
}: ICrossPlatformWarningProps) {
    const properties = useSectionFormStore((state) => state.properties);
    const drifted = offPlatformFieldsWithValues(fields, properties ?? {}, stylePlatform);
    if (drifted.length === 0) return null;

    const otherPlatform = stylePlatform === 'web' ? 'mobile' : 'web';
    return (
        <Alert
            color="yellow"
            icon={<IconAlertTriangle size={16} />}
            title={`Ignored ${otherPlatform} properties`}
            variant="light"
        >
            <Text size="xs">
                This {stylePlatform}-only style has {otherPlatform} properties set
                ({drifted.join(', ')}). They are not rendered and should be cleared.
            </Text>
        </Alert>
    );
});

interface ISectionInfoPanelProps {
    section?: ISectionDetails;
    /** Underlying data table for form sections (issue #56). */
    dataTable?: ISectionDataTableInfo;
}

/**
 * Panel component for section information and name editing
 * Subscribes only to sectionName to isolate name changes from field updates
 */
export const SectionInfoPanel = React.memo(function SectionInfoPanel({
    section,
    dataTable
}: ISectionInfoPanelProps) {
    // Subscribe only to sectionName
    const sectionName = useSectionFormStore((state) => state.sectionName);
    const setSectionName = useSectionFormStore((state) => state.setSectionName);

    if (!section) return null;

    const platform = getStylePlatformByName(section.style.name);
    const badge = PLATFORM_BADGE[platform];

    return (
        <Paper withBorder style={{ backgroundColor: 'light-dark(var(--mantine-color-blue-0), var(--mantine-color-blue-9))' }}>
            <Box p="md">
                <Group gap="xs" mb="sm" justify="space-between">
                    <Group gap="xs">
                        <IconInfoCircle size={16} style={{ color: 'var(--mantine-color-blue-6)' }} />
                        <Text size="sm" fw={500} c="blue">Section Information</Text>
                    </Group>
                    <Badge color={badge.color} variant="light" aria-label={`Platform: ${badge.label}`}>
                        {badge.label}
                    </Badge>
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

                    {dataTable && (
                        <Box mt="sm">
                            <Group gap="xs" mb={2}>
                                <Text size="xs" fw={500} c="dimmed">Data table</Text>
                                {dataTable.locked && (
                                    <Tooltip label="Label manually locked in the Data browser — renaming the form display name no longer changes it">
                                        <Badge color="orange" variant="light" size="xs" leftSection={<IconLock size={10} />}>
                                            Locked
                                        </Badge>
                                    </Tooltip>
                                )}
                            </Group>
                            <Group gap="xs" wrap="nowrap">
                                <Text size="sm" truncate>
                                    {dataTable.display_name || dataTable.name}
                                </Text>
                                <Anchor
                                    size="xs"
                                    href={`/admin/data?tableIds=${dataTable.id}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{ whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                                >
                                    Open in Data browser <IconExternalLink size={12} />
                                </Anchor>
                            </Group>
                        </Box>
                    )}
                </Stack>
            </Box>
        </Paper>
    );
});
