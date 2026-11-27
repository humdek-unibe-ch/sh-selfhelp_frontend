/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
'use client';

import {
    Box,
    Stack,
} from '@mantine/core';
import { OPTION_STYLE_CONFIGS, FIELDS_MAP_STYLE_CONFIG, type TOptionStyleName } from '@selfhelp/shared';

import { CollapsibleSection } from '../../shared/collapsible-section/CollapsibleSection';
import { ReadOnlyFieldset, usePageEditRights } from '../page-rights/PageRightsContext';
import {
    InspectorFieldSearch,
    useInspectorFieldFilter,
    matchesFieldQuery,
    countMatchingFields,
    type ISearchableField,
} from '../../shared/inspector-search';
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
    /** Server field → message from a refused list save (shown next to that field). */
    fieldErrors?: Record<string, string>;
}

function sectionFieldToSearchable(field: ISectionField): ISearchableField {
    return {
        id: `section-field-${field.id}`,
        label: field.title,
        name: field.name,
        help: field.help,
    };
}

const GLOBAL_FIELD_META: Record<'css' | 'css_mobile' | 'debug', ISearchableField> = {
    css: { id: 'global-css', label: 'CSS', name: 'css', keywords: ['Global Fields'] },
    css_mobile: {
        id: 'global-css-mobile',
        label: 'CSS (mobile)',
        name: 'css_mobile',
        keywords: ['Global Fields'],
    },
    debug: {
        id: 'global-debug',
        label: 'Debug',
        name: 'debug',
        keywords: ['Global Fields'],
    },
};

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
    fieldErrors,
}: ISectionFieldPanelsProps) {
    // condition and data_config are now edited inline, not in the inspector.
    type TInspectorGlobalField = keyof typeof GLOBAL_FIELD_META;
    const globalFieldTypes: TInspectorGlobalField[] = ['css', 'css_mobile', 'debug'];
    const fieldFilter = useInspectorFieldFilter({ resetKey: sectionId });
    const query = fieldFilter.query;

    const stylePlatform = getStylePlatformByName(styleName ?? '');

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

    const optionSearchable: ISearchableField | null = hasOptionEditorFields
        ? {
            id: 'options-editor',
            label: 'Options',
            name: optionStyleConfig.catalogField,
            help: optionHelpTooltip,
            keywords: ['option_labels', 'Options'],
        }
        : null;

    const fieldsMapSearchable: ISearchableField | null = hasFieldsMapEditor
        ? {
            id: 'fields-map-editor',
            label: 'Column mapping',
            name: FIELDS_MAP_STYLE_CONFIG.catalogField,
            help: fieldsMapHelpTooltip,
            keywords: [FIELDS_MAP_STYLE_CONFIG.labelsField, 'Column mapping'],
        }
        : null;

    const panelFields = fields.filter(
        (field) =>
            !combinedOptionFieldNames.has(field.name) &&
            !combinedFieldsMapNames.has(field.name),
    );

    const searchableCatalog: ISearchableField[] = [
        ...panelFields.map(sectionFieldToSearchable),
        ...globalFieldTypes.map((type) => GLOBAL_FIELD_META[type]),
        ...(optionSearchable ? [optionSearchable] : []),
        ...(fieldsMapSearchable ? [fieldsMapSearchable] : []),
    ];

    const matchCount = countMatchingFields(searchableCatalog, query);

    const fieldMatches = (field: ISectionField) =>
        matchesFieldQuery(sectionFieldToSearchable(field), query);

    const filteredFields = query.trim()
        ? panelFields.filter(fieldMatches)
        : panelFields;
    const filteredGlobalFieldTypes = query.trim()
        ? globalFieldTypes.filter((type) =>
            matchesFieldQuery(GLOBAL_FIELD_META[type], query),
        )
        : globalFieldTypes;

    const inBucket = (bucket: ReturnType<typeof classifySectionField>) =>
        filteredFields.filter((f) => classifySectionField(f) === bucket);

    const contentFields = inBucket('content');
    const propertyFields = inBucket('property');
    const webFields = inBucket('web');
    const mobileFields = inBucket('mobile');

    const showWebCard = webFields.length > 0 && isPlatformCardVisible('web', stylePlatform);
    const showMobileCard = mobileFields.length > 0 && isPlatformCardVisible('mobile', stylePlatform);
    const showOptionEditor = Boolean(
        optionSearchable && matchesFieldQuery(optionSearchable, query),
    );
    const showFieldsMapEditor = Boolean(
        fieldsMapSearchable && matchesFieldQuery(fieldsMapSearchable, query),
    );
    const searchForceExpand = fieldFilter.isActive;

    // Without the update right on the page every field is shown read-only.
    const readOnly = !usePageEditRights().canUpdate;

    return (
        <Stack gap="md">
            <InspectorFieldSearch
                query={fieldFilter.query}
                onQueryChange={fieldFilter.setQuery}
                onClear={fieldFilter.clear}
                onInputKeyDown={fieldFilter.handleInputKeyDown}
                inputRef={fieldFilter.inputRef}
                matchCount={matchCount}
                totalCount={searchableCatalog.length}
            />

            {/* Cross-platform validation: warn on drifted off-platform values. */}
            <CrossPlatformFieldWarning fields={fields} stylePlatform={stylePlatform} />

            {showOptionEditor && optionStyleConfig ? (
                <CollapsibleSection
                    title="Options"
                    inspectorType={INSPECTOR_TYPES.SECTION}
                    sectionName="options"
                    defaultExpanded={true}
                    forceExpanded={searchForceExpand}
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
                    <ReadOnlyFieldset readOnly={readOnly}>
                    <SectionOptionCatalogEditor
                        key={`${sectionId ?? 'new'}-${optionStyleConfig.catalogField}`}
                        catalogField={optionStyleConfig.catalogField}
                        languages={languagesData}
                    />
                    </ReadOnlyFieldset>
                </CollapsibleSection>
            ) : null}

            {showFieldsMapEditor ? (
                <CollapsibleSection
                    title="Column mapping"
                    inspectorType={INSPECTOR_TYPES.SECTION}
                    sectionName="fields-map"
                    defaultExpanded={true}
                    forceExpanded={searchForceExpand}
                    headerAction={fieldsMapHelpTooltip ? (
                        <FieldLabelWithTooltip
                            label="Column mapping"
                            helpTitle="Column mapping"
                            tooltip={fieldsMapHelpTooltip}
                            iconOnly
                        />
                    ) : null}
                >
                    <ReadOnlyFieldset readOnly={readOnly}>
                    <SectionFieldsMapEditor
                        key={`${sectionId ?? 'new'}-fields-map`}
                        languages={languagesData}
                    />
                    </ReadOnlyFieldset>
                </CollapsibleSection>
            ) : null}

            {/* Content fields: display=true, translatable per language */}
            {contentFields.length > 0 && (
                <CollapsibleSection
                    title="Content"
                    inspectorType={INSPECTOR_TYPES.SECTION}
                    sectionName="content"
                    defaultExpanded={true}
                    forceExpanded={searchForceExpand}
                >
                    <ReadOnlyFieldset readOnly={readOnly}>
                    <Stack gap="md">
                        {panelFields
                            .filter((field) => classifySectionField(field) === 'content')
                            .map((field) => {
                                const visible = fieldMatches(field);
                                return (
                                    <Box
                                        key={field.id}
                                        style={visible ? undefined : { display: 'none' }}
                                        aria-hidden={!visible}
                                    >
                                        <SectionContentField
                                            field={field}
                                            languages={languagesData}
                                            className={styles.fullWidthLabel}
                                            dataVariables={dataVariables}
                                        />
                                    </Box>
                                );
                            })}
                    </Stack>
                    </ReadOnlyFieldset>
                </CollapsibleSection>
            )}

            {/* Global fields: shared across all sections — css, css_mobile, debug */}
            {filteredGlobalFieldTypes.length > 0 && (
                <CollapsibleSection
                    title="Global Fields"
                    inspectorType={INSPECTOR_TYPES.SECTION}
                    sectionName="global-fields"
                    defaultExpanded={false}
                    forceExpanded={searchForceExpand}
                >
                    <ReadOnlyFieldset readOnly={readOnly}>
                    <SectionGlobalFields
                        globalFieldTypes={filteredGlobalFieldTypes as GlobalFieldType[]}
                        dataVariables={dataVariables}
                    />
                    </ReadOnlyFieldset>
                </CollapsibleSection>
            )}

            {/* Properties: display=false, unprefixed config + portable semantic fields */}
            {propertyFields.length > 0 && (
                <CollapsibleSection
                    title="Properties"
                    inspectorType={INSPECTOR_TYPES.SECTION}
                    sectionName="properties"
                    defaultExpanded={true}
                    forceExpanded={searchForceExpand}
                >
                    <ReadOnlyFieldset readOnly={readOnly}>
                    <SectionProperties
                        fields={filteredFields}
                        dataVariables={dataVariables}
                        sectionId={sectionId}
                        styleName={styleName}
                        ownedDataTable={ownedDataTable}
                        fieldErrors={fieldErrors}
                    />
                    </ReadOnlyFieldset>
                </CollapsibleSection>
            )}

            {/* Web Properties: web_* fields — only on web / both styles */}
            {showWebCard && (
                <CollapsibleSection
                    title="Web Properties"
                    inspectorType={INSPECTOR_TYPES.SECTION}
                    sectionName="web-properties"
                    defaultExpanded={false}
                    forceExpanded={searchForceExpand}
                >
                    <ReadOnlyFieldset readOnly={readOnly}>
                    <SectionWebProperties
                        fields={filteredFields}
                        dataVariables={dataVariables}
                    />
                    </ReadOnlyFieldset>
                </CollapsibleSection>
            )}

            {/* Mobile Properties: mobile_* fields — only on mobile / both styles */}
            {showMobileCard && (
                <CollapsibleSection
                    title="Mobile Properties"
                    inspectorType={INSPECTOR_TYPES.SECTION}
                    sectionName="mobile-properties"
                    defaultExpanded={false}
                    forceExpanded={searchForceExpand}
                >
                    <ReadOnlyFieldset readOnly={readOnly}>
                    <SectionMobileProperties
                        fields={filteredFields}
                        dataVariables={dataVariables}
                    />
                    </ReadOnlyFieldset>
                </CollapsibleSection>
            )}
        </Stack>
    );
}
