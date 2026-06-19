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
import {
    SectionGlobalFields,
    SectionProperties,
    SectionSharedProperties,
    SectionWebProperties,
    SectionMobileProperties,
    CrossPlatformFieldWarning,
} from './section-field-groups';
import { classifySectionField, isPlatformCardVisible } from './section-field-classify';
import { getStylePlatformByName } from '../../../../../utils/style-platform.utils';
import { type ISectionField } from '../../../../../types/responses/admin/admin.types';
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
    /** Style name — drives the platform-aware Web / Mobile card visibility. */
    styleName?: string;

    languagesData: ILanguage[];
    activeLanguageTab: string;
    onLanguageTabChange: (value: string) => void;
    dataVariables: Record<string, string>;
    hasMultipleLanguages: boolean;
}

export function SectionFieldPanels({
    sectionId: _sectionId,
    fields,
    styleName,
    languagesData,
    activeLanguageTab,
    onLanguageTabChange,
    dataVariables,
    hasMultipleLanguages,
}: ISectionFieldPanelsProps) {
    const globalFieldTypes: GlobalFieldType[] = ['condition', 'data_config', 'css', 'css_mobile', 'debug'];
    const [fieldSearch, setFieldSearch] = useState('');

    const stylePlatform = getStylePlatformByName(styleName ?? '');

    const query = fieldSearch.trim().toLowerCase();
    const matches = (text: string | null | undefined) => (text ?? '').toLowerCase().includes(query);
    // Content fields have empty title in the API response — match on name instead.
    const filteredFields = query
        ? fields.filter(f => matches(f.name))
        : fields;
    const filteredGlobalFieldTypes = query
        ? globalFieldTypes.filter(t => matches(t))
        : globalFieldTypes;

    const inBucket = (bucket: ReturnType<typeof classifySectionField>) =>
        filteredFields.filter(f => classifySectionField(f) === bucket);

    const contentFields = inBucket('content');
    const sharedFields = inBucket('shared');
    const propertyFields = inBucket('property');
    const webFields = inBucket('web');
    const mobileFields = inBucket('mobile');

    const showWebCard = webFields.length > 0 && isPlatformCardVisible('web', stylePlatform);
    const showMobileCard = mobileFields.length > 0 && isPlatformCardVisible('mobile', stylePlatform);

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

            {/* Cross-platform validation: warn on drifted off-platform values. */}
            <CrossPlatformFieldWarning fields={fields} stylePlatform={stylePlatform} />

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

            {/* Shared Properties: unprefixed shared semantic fields (size/intent/…) */}
            {sharedFields.length > 0 && (
                <CollapsibleSection
                    title="Shared Properties"
                    inspectorType={INSPECTOR_TYPES.SECTION}
                    sectionName="shared-properties"
                    defaultExpanded={true}
                >
                    <SectionSharedProperties fields={filteredFields} dataVariables={dataVariables} />
                </CollapsibleSection>
            )}

            {/* Properties: display=false, other unprefixed config fields */}
            {propertyFields.length > 0 && (
                <CollapsibleSection
                    title="Properties"
                    inspectorType={INSPECTOR_TYPES.SECTION}
                    sectionName="properties"
                    defaultExpanded={true}
                >
                    <SectionProperties fields={filteredFields} dataVariables={dataVariables} />
                </CollapsibleSection>
            )}

            {/* Web Properties: web_* fields — only on web / both styles */}
            {showWebCard && (
                <CollapsibleSection
                    title="Web Properties"
                    inspectorType={INSPECTOR_TYPES.SECTION}
                    sectionName="web-properties"
                    defaultExpanded={false}
                >
                    <SectionWebProperties fields={filteredFields} dataVariables={dataVariables} />
                </CollapsibleSection>
            )}

            {/* Mobile Properties: mobile_* fields — only on mobile / both styles */}
            {showMobileCard && (
                <CollapsibleSection
                    title="Mobile Properties"
                    inspectorType={INSPECTOR_TYPES.SECTION}
                    sectionName="mobile-properties"
                    defaultExpanded={false}
                >
                    <SectionMobileProperties fields={filteredFields} dataVariables={dataVariables} />
                </CollapsibleSection>
            )}
        </Stack>
    );
}
