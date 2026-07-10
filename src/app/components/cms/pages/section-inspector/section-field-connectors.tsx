/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
'use client';

import React, { useCallback, useState } from 'react';
import { FieldRenderer, type IFieldData } from '../../shared/field-renderer/FieldRenderer';
import { OptionCatalogEditor } from '../../shared/field-components/OptionCatalogEditor';
import { FieldsMapField } from '../../shared/field-components/FieldsMapField';
import type { ILocaleTabLanguage } from '../../shared/locale-tabs/LocaleTabBadges';
import { useSectionFormStore } from '../../../../store/sectionFormStore';
import { type ISectionField, type ISectionDataTableInfo } from '../../../../../types/responses/admin/admin.types';

interface ISectionLanguage {
    id: number;
    language: string;
    locale?: string;
}

const EMPTY_FIELD_VALUES: Record<number, string> = {};

interface ISectionContentFieldProps {
    field: ISectionField;
    languages: ISectionLanguage[];
    dataVariables?: Record<string, string>;
    className?: string;
}

/**
 * Store-connected content field component
 * Subscribes only to its specific field value for the given language
 * This ensures that changes to other fields don't trigger re-renders
 */
export const SectionContentField = React.memo(function SectionContentField({
    field,
    languages,
    dataVariables,
    className,
}: ISectionContentFieldProps) {
    const fieldValues = useSectionFormStore(
        (state) => state.fields[field.name] ?? EMPTY_FIELD_VALUES,
    );
    const languageKey = languages.map((language) => language.id).join(',');
    const [activeLanguageId, setActiveLanguageId] = useState(
        () => String(languages[0]?.id ?? ''),
    );
    const [prevLanguageKey, setPrevLanguageKey] = useState(languageKey);
    if (prevLanguageKey !== languageKey && languages.length > 0) {
        setPrevLanguageKey(languageKey);
        const stillValid = languages.some((language) => String(language.id) === activeLanguageId);
        if (!stillValid) {
            setActiveLanguageId(String(languages[0].id));
        }
    }

    const activeLanguage = languages.find((language) => String(language.id) === activeLanguageId)
        ?? languages[0];
    const languageId = activeLanguage?.id ?? languages[0]?.id ?? 1;

    const value = fieldValues[languageId] ?? '';

    const setContentField = useSectionFormStore((state) => state.setContentField);

    const handleChange = useCallback((newValue: string | boolean) => {
        setContentField(field.name, languageId, String(newValue));
    }, [field.name, languageId, setContentField]);

    const localeLanguages: ILocaleTabLanguage[] = languages.map((language) => ({
        id: language.id,
        language: language.language,
        locale: language.locale,
        hasTranslation: (fieldValues[language.id] ?? '').trim() !== '',
    }));

    const fieldData: IFieldData = {
        id: field.id,
        name: field.name,
        title: field.title,
        type: field.type,
        default_value: field.default_value,
        help: field.help,
        disabled: field.disabled,
        hidden: field.hidden,
        display: field.display,
        config: field.config,
        translations: field.translations,
    };

    return (
        <FieldRenderer
            key={`${field.id}-${languageId}`}
            field={fieldData}
            value={value}
            onChange={handleChange}
            languageId={languageId}
            locale={activeLanguage?.locale}
            languages={languages.length > 1 ? localeLanguages : undefined}
            activeLanguageId={activeLanguageId}
            onActiveLanguageChange={setActiveLanguageId}
            className={className}
            dataVariables={dataVariables}
        />
    );
});

interface ISectionPropertyFieldProps {
    field: ISectionField;
    dataVariables?: Record<string, string>;
    className?: string;
    sectionId?: number | null;
    styleName?: string;
    ownedDataTable?: ISectionDataTableInfo;
}

/**
 * Store-connected property field component
 * Subscribes only to its specific property value
 * This ensures that changes to other properties don't trigger re-renders
 */
export const SectionPropertyField = React.memo(function SectionPropertyField({
    field,
    dataVariables,
    className,
    sectionId,
    styleName,
    ownedDataTable,
}: ISectionPropertyFieldProps) {
    // Granular selector - subscribes only to this specific property's value
    const value = useSectionFormStore(
        (state) => state.properties[field.name] ?? ''
    );

    const setPropertyField = useSectionFormStore((state) => state.setPropertyField);

    const handleChange = useCallback((newValue: string | boolean) => {
        setPropertyField(field.name, newValue);
    }, [field.name, setPropertyField]);

    // Property & override selects (shared_*/web_*/mobile_* and plain properties)
    // must always be clearable: clearing an override (e.g. badge `web_variant`)
    // resets it back to the inherited/shared value, and clearing a shared field
    // reverts it to the style default. Some fields are seeded with
    // `config.clearable: false`, which would otherwise hide the clear (×) button.
    const config: IFieldData['config'] = field.config
        ? { ...field.config, clearable: true }
        : field.config;

    const fieldData: IFieldData = {
        id: field.id,
        name: field.name,
        title: field.title,
        type: field.type,
        default_value: field.default_value,
        help: field.help,
        disabled: field.disabled,
        hidden: field.hidden,
        display: field.display,
        config,
        translations: field.translations
    };

    return (
        <FieldRenderer
            key={`${field.id}-property`}
            field={fieldData}
            value={value}
            onChange={handleChange}
            className={className}
            dataVariables={dataVariables}
            sectionId={sectionId}
            styleName={styleName}
            ownedDataTable={ownedDataTable}
        />
    );
});

interface ISectionOptionCatalogEditorProps {
    catalogField: string;
    languages: ISectionLanguage[];
}

const EMPTY_LABEL_VALUES: Record<number, string> = {};

export const SectionFieldsMapEditor = React.memo(function SectionFieldsMapEditor({
    languages,
}: {
    languages: ISectionLanguage[];
}) {
    const catalogValue = useSectionFormStore(
        (state) => String(state.properties.fields_map ?? ''),
    );
    const labelValues = useSectionFormStore(
        (state) => state.fields.fields_map_labels ?? EMPTY_LABEL_VALUES,
    );
    const setPropertyField = useSectionFormStore((state) => state.setPropertyField);
    const setContentField = useSectionFormStore((state) => state.setContentField);

    const handleCatalogChange = useCallback((value: string) => {
        setPropertyField('fields_map', value);
    }, [setPropertyField]);

    const handleLabelChange = useCallback((languageId: number, value: string) => {
        setContentField('fields_map_labels', languageId, value);
    }, [setContentField]);

    return (
        <FieldsMapField
            catalogValue={catalogValue}
            labelValues={labelValues}
            languages={languages}
            onCatalogChange={handleCatalogChange}
            onLabelChange={handleLabelChange}
        />
    );
});
export const SectionOptionCatalogEditor = React.memo(function SectionOptionCatalogEditor({
    catalogField,
    languages,
}: ISectionOptionCatalogEditorProps) {
    const catalogValue = useSectionFormStore(
        (state) => String(state.properties[catalogField] ?? ''),
    );
    const labelValues = useSectionFormStore(
        (state) => state.fields.option_labels ?? EMPTY_LABEL_VALUES,
    );
    const setPropertyField = useSectionFormStore((state) => state.setPropertyField);
    const setContentField = useSectionFormStore((state) => state.setContentField);

    const handleCatalogChange = useCallback((value: string) => {
        setPropertyField(catalogField, value);
    }, [catalogField, setPropertyField]);

    const handleLabelChange = useCallback((languageId: number, value: string) => {
        setContentField('option_labels', languageId, value);
    }, [setContentField]);

    return (
        <OptionCatalogEditor
            catalogValue={catalogValue}
            labelValues={labelValues}
            languages={languages}
            onCatalogChange={handleCatalogChange}
            onLabelChange={handleLabelChange}
        />
    );
});
