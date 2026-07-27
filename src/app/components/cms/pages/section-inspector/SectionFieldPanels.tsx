/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
'use client';

import {
    Box,
    Stack,
    TextInput,
    ActionIcon,
} from '@mantine/core';
import {
    IconSearch,
    IconX,
} from '@tabler/icons-react';
import { useState } from 'react';
import { OPTION_STYLE_CONFIGS, FIELDS_MAP_STYLE_CONFIG, type TOptionStyleName } from '@selfhelp/shared';

import { CollapsibleSection } from '../../shared/collapsible-section/CollapsibleSection';
import { FieldLabelWithTooltip } from '../../ui/field-label-with-tooltip/FieldLabelWithTooltip';
import { INSPECTOR_TYPES } from '../../../../../store/inspectorStore';
import { SectionContentField, SectionOptionCatalogEditor, SectionFieldsMapEditor } from './section-field-connectors';
import {
    SectionGlobalFields,
    SectionProperties,
    SectionWebProperties,
    SectionMobileProperties,
    CrossPlatformFieldWarning,
} from './section-field-groups';
import { classifySectionField, isPlatformCardVisible } from './section-field-classify';
import { getStylePlatformByName } from '../../../../../utils/style-platform.utils';
import { type ISectionField, type ISectionDataTableInfo } from '../../../../../types/responses/admin/admin.types';
import { extractFieldHelpExample } from '../../../../../utils/field-help.utils';
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
    ownedDataTable?: ISectionDataTableInfo;

    languagesData: ILanguage[];
    activeLanguageTab: string;
    onLanguageTabChange: (value: string) => void;
    dataVariables: Record<string, string>;
    hasMultipleLanguages: boolean;
}

export function SectionFieldPanels({
    sectionId,
    fields,
    styleName,
    ownedDataTable,
    languagesData,
    activeLanguageTab: _activeLanguageTab,
    onLanguageTabChange: _onLanguageTabChange,
    dataVariables,
    hasMultipleLanguages: _hasMultipleLanguages,
}: ISectionFieldPanelsProps) {
    // condition and data_config are now edited inline, not in the inspector.
    const globalFieldTypes: GlobalFieldType[] = ['css', 'css_mobile', 'debug'];
    const [fieldSearch, setFieldSearch] = useState('');

    const stylePlatform = getStylePlatformByName(styleName ?? '');

    const query = fieldSearch.trim().toLowerCase();
    const matches = (text: string | null | undefined) => (text ?? '').toLowerCase().includes(query);
    const optionStyleConfig = styleName && styleName in OPTION_STYLE_CONFIGS
        ? OPTION_STYLE_CONFIGS[styleName as TOptionStyleName]
        : null;
    const hasOptionEditorFields = optionStyleConfig !== null
        && fields.some((field) => field.name === optionStyleConfig.catalogField)
        && fields.some((field) => field.name === 'option_labels');
    const combinedOptionFieldNames = new Set(
        hasOptionEditorFields
            ? [optionStyleConfig.catalogField, 'option_labels']
            : [],
    );
    const hasFieldsMapEditor = styleName === 'entry-table'
        && fields.some((field) => field.name === FIELDS_MAP_STYLE_CONFIG.catalogField)
        && fields.some((field) => field.name === FIELDS_MAP_STYLE_CONFIG.labelsField);
    const combinedFieldsMapNames = new Set<string>(
        hasFieldsMapEditor
            ? [FIELDS_MAP_STYLE_CONFIG.catalogField, FIELDS_MAP_STYLE_CONFIG.labelsField]
            : [],
    );
    // Content fields have empty title in the API response — match on name instead.
    const filteredFields = query
        ? fields.filter(f => matches(f.name) && !combinedOptionFieldNames.has(f.name) && !combinedFieldsMapNames.has(f.name))
        : fields.filter((field) => !combinedOptionFieldNames.has(field.name) && !combinedFieldsMapNames.has(field.name));
    const filteredGlobalFieldTypes = query
        ? globalFieldTypes.filter(t => matches(t))
        : globalFieldTypes;

    const inBucket = (bucket: ReturnType<typeof classifySectionField>) =>
        filteredFields.filter(f => classifySectionField(f) === bucket);

    const contentFields = inBucket('content');
    const propertyFields = inBucket('property');
    const webFields = inBucket('web');
    const mobileFields = inBucket('mobile');

    const showWebCard = webFields.length > 0 && isPlatformCardVisible('web', stylePlatform);
    const showMobileCard = mobileFields.length > 0 && isPlatformCardVisible('mobile', stylePlatform);
    const showOptionEditor = hasOptionEditorFields
        && (!query || matches(optionStyleConfig.catalogField) || matches('option_labels'));
    const catalogFieldMeta = hasOptionEditorFields
        ? fields.find((field) => field.name === optionStyleConfig.catalogField)
        : undefined;
    const optionLabelsFieldMeta = hasOptionEditorFields
        ? fields.find((field) => field.name === 'option_labels')
        : undefined;
    const optionHelpTooltip = [catalogFieldMeta?.help, optionLabelsFieldMeta?.help]
        .filter((text): text is string => Boolean(text && text.trim()))
        .join('\n\n');
    const optionHelpExample = extractFieldHelpExample(
        catalogFieldMeta?.type ?? 'json',
        catalogFieldMeta?.default_value,
        optionHelpTooltip,
    );

    const fieldsMapCatalogMeta = hasFieldsMapEditor
        ? fields.find((field) => field.name === FIELDS_MAP_STYLE_CONFIG.catalogField)
        : undefined;
    const fieldsMapLabelsMeta = hasFieldsMapEditor
        ? fields.find((field) => field.name === FIELDS_MAP_STYLE_CONFIG.labelsField)
        : undefined;
    const fieldsMapHelpTooltip = [fieldsMapCatalogMeta?.help, fieldsMapLabelsMeta?.help]
        .filter((text): text is string => Boolean(text && text.trim()))
        .join('\n\n');
    const showFieldsMapEditor = hasFieldsMapEditor
        && (!query || matches(FIELDS_MAP_STYLE_CONFIG.catalogField) || matches(FIELDS_MAP_STYLE_CONFIG.labelsField));

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

            {showOptionEditor ? (
                <CollapsibleSection
                    title="Options"
                    inspectorType={INSPECTOR_TYPES.SECTION}
                    sectionName="options"
                    defaultExpanded={true}
                    headerAction={optionHelpTooltip ? (
                        <FieldLabelWithTooltip
                            label="Options"
                            helpTitle="Options"
                            tooltip={optionHelpTooltip}
                            example={optionHelpExample?.code}
                            exampleLanguage={optionHelpExample?.language}
                            iconOnly
                        />
                    ) : null}
                >
                    <SectionOptionCatalogEditor
                        key={`${sectionId ?? 'new'}-${optionStyleConfig.catalogField}`}
                        catalogField={optionStyleConfig.catalogField}
                        languages={languagesData}
                    />
                </CollapsibleSection>
            ) : null}

            {showFieldsMapEditor ? (
                <CollapsibleSection
                    title="Column mapping"
                    inspectorType={INSPECTOR_TYPES.SECTION}
                    sectionName="fields-map"
                    defaultExpanded={true}
                    headerAction={fieldsMapHelpTooltip ? (
                        <FieldLabelWithTooltip
                            label="Column mapping"
                            helpTitle="Column mapping"
                            tooltip={fieldsMapHelpTooltip}
                            iconOnly
                        />
                    ) : null}
                >
                    <SectionFieldsMapEditor
                        key={`${sectionId ?? 'new'}-fields-map`}
                        languages={languagesData}
                    />
                </CollapsibleSection>
            ) : null}

            {/* Content fields: display=true, translatable per language */}
            {contentFields.length > 0 && (
                <CollapsibleSection
                    title="Content"
                    inspectorType={INSPECTOR_TYPES.SECTION}
                    sectionName="content"
                    defaultExpanded={true}
                >
                    <Stack gap="md">
                        {contentFields.map((field) => (
                            <SectionContentField
                                key={field.id}
                                field={field}
                                languages={languagesData}
                                className={styles.fullWidthLabel}
                                dataVariables={dataVariables}
                            />
                        ))}
                    </Stack>
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

            {/* Properties: display=false, unprefixed config + portable semantic fields */}
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
                        sectionId={sectionId}
                        styleName={styleName}
                        ownedDataTable={ownedDataTable}
                    />
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
