/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
'use client';

import {
    Box,
    Stack,
    Tabs,
    TextInput,
    ActionIcon,
} from '@mantine/core';
import {
    IconSearch,
    IconX,
} from '@tabler/icons-react';
import { useState } from 'react';

import { CollapsibleSection } from '../../shared/collapsible-section/CollapsibleSection';
import { INSPECTOR_TYPES } from '../../../../../store/inspectorStore';
import { SectionContentField } from './section-field-connectors';
import { SectionGlobalFields, SectionProperties, SectionMantineProperties } from './section-field-groups';
import { ISectionField } from '../../../../../types/responses/admin/admin.types';
import type { GlobalFieldType } from '../../shared';
import styles from './SectionInspector.module.css';

interface ILanguage {
    id: number;
    language: string;
    locale?: string;
}

interface ISectionFieldPanelsProps {
    sectionId: number | null;
    /** All fields for the section as returned by the API. */
    fields: ISectionField[];

    languagesData: ILanguage[];
    activeLanguageTab: string;
    onLanguageTabChange: (value: string) => void;
    dataVariables: Record<string, any>;
    hasMultipleLanguages: boolean;
}

export function SectionFieldPanels({
    sectionId,
    fields,
    languagesData,
    activeLanguageTab,
    onLanguageTabChange,
    dataVariables,
    hasMultipleLanguages,
}: ISectionFieldPanelsProps) {
    const globalFieldTypes: GlobalFieldType[] = ['condition', 'data_config', 'css', 'css_mobile', 'debug'];
    const [fieldSearch, setFieldSearch] = useState('');
    // Track the last rendered sectionId in state so we can reset the search
    // during render when it changes — avoids a useEffect extra render cycle.
    const [prevSectionId, setPrevSectionId] = useState(sectionId);
    if (prevSectionId !== sectionId) {
        setPrevSectionId(sectionId);
        setFieldSearch('');
    }

    const query = fieldSearch.trim().toLowerCase();
    const matches = (text: string | null | undefined) => (text ?? '').toLowerCase().includes(query);
    // Content fields have empty title in the API response — match on name instead.
    const filteredFields = query
        ? fields.filter(f => matches(f.name))
        : fields;
    const filteredGlobalFieldTypes = query
        ? globalFieldTypes.filter(t => matches(t))
        : globalFieldTypes;

    const contentFields = filteredFields.filter(f => f.display);
    const propertyFields = filteredFields.filter(f => !f.display && !f.name.startsWith('mantine_'));
    const mantineFields = filteredFields.filter(f => !f.display && f.name.startsWith('mantine_'));

    return (
        <Stack gap="md">
            <Box>
                <TextInput
                    placeholder="Search fields by name..."
                    value={fieldSearch}
                    onChange={(e) => setFieldSearch(e.currentTarget.value)}
                    leftSection={<IconSearch size={14} />}
                    rightSection={fieldSearch ? (
                        <ActionIcon
                            size="sm"
                            variant="subtle"
                            color="gray"
                            onClick={() => setFieldSearch('')}
                            aria-label="Clear search"
                        >
                            <IconX size={12} />
                        </ActionIcon>
                    ) : undefined}
                    size="sm"
                />
            </Box>

            {/* Content fields: display=true, translatable per language */}
            {contentFields.length > 0 && (
                <CollapsibleSection
                    title="Content"
                    inspectorType={INSPECTOR_TYPES.SECTION}
                    sectionName="content"
                    defaultExpanded={true}
                >
                    {hasMultipleLanguages ? (
                        <Tabs
                            value={activeLanguageTab}
                            onChange={(value) => onLanguageTabChange(value || (languagesData[0]?.id.toString() || ''))}
                        >
                            <Tabs.List>
                                {languagesData.map(lang => (
                                    <Tabs.Tab key={lang.id} value={lang.id.toString()}>
                                        {lang.language}
                                    </Tabs.Tab>
                                ))}
                            </Tabs.List>
                            {languagesData.map(lang => (
                                <Tabs.Panel key={lang.id} value={lang.id.toString()} pt="md">
                                    <Stack gap="md">
                                        {contentFields.map(field => (
                                            <SectionContentField
                                                key={`${field.id}-${lang.id}`}
                                                field={field}
                                                languageId={lang.id}
                                                locale={lang.locale}
                                                className={styles.fullWidthLabel}
                                                dataVariables={dataVariables}
                                            />
                                        ))}
                                    </Stack>
                                </Tabs.Panel>
                            ))}
                        </Tabs>
                    ) : (
                        <Stack gap="md">
                            {contentFields.map(field => (
                                <SectionContentField
                                    key={`${field.id}-${languagesData[0]?.id}`}
                                    field={field}
                                    languageId={languagesData[0]?.id || 1}
                                    locale={languagesData[0]?.locale}
                                    className={styles.fullWidthLabel}
                                    dataVariables={dataVariables}
                                />
                            ))}
                        </Stack>
                    )}
                </CollapsibleSection>
            )}

            {/* Global fields: shared across all sections — condition, css, data_config, etc. */}
            {filteredGlobalFieldTypes.length > 0 && (
                <CollapsibleSection
                    title="Global Fields"
                    inspectorType={INSPECTOR_TYPES.SECTION}
                    sectionName="global-fields"
                    defaultExpanded={false}
                >
                    <SectionGlobalFields
                        globalFieldTypes={filteredGlobalFieldTypes}
                        dataVariables={dataVariables}
                    />
                </CollapsibleSection>
            )}

            {/* Properties: display=false, non-mantine — section-specific config fields */}
            {propertyFields.length > 0 && (
                <CollapsibleSection
                    title="Properties"
                    inspectorType={INSPECTOR_TYPES.SECTION}
                    sectionName="properties"
                    defaultExpanded={true}
                >
                    <SectionProperties
                        fields={filteredFields}
                        dataVariables={dataVariables}
                    />
                </CollapsibleSection>
            )}

            {/* Mantine Properties: display=false, name prefixed with "mantine_" — UI/style overrides */}
            {mantineFields.length > 0 && (
                <CollapsibleSection
                    title="Mantine Properties"
                    inspectorType={INSPECTOR_TYPES.SECTION}
                    sectionName="mantine-properties"
                    defaultExpanded={false}
                >
                    <SectionMantineProperties
                        fields={filteredFields}
                        dataVariables={dataVariables}
                    />
                </CollapsibleSection>
            )}
        </Stack>
    );
}
