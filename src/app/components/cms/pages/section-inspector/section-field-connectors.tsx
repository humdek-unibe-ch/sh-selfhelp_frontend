'use client';

import React, { useCallback } from 'react';
import { FieldRenderer, IFieldData } from '../../shared/field-renderer/FieldRenderer';
import { useSectionFormStore } from '../../../../store/sectionFormStore';
import { ISectionField } from '../../../../../types/responses/admin/admin.types';

interface ISectionContentFieldProps {
    field: ISectionField;
    languageId: number;
    locale?: string;
    dataVariables?: Record<string, any>;
    className?: string;
}

/**
 * Store-connected content field component
 * Subscribes only to its specific field value for the given language
 * This ensures that changes to other fields don't trigger re-renders
 */
export const SectionContentField = React.memo(function SectionContentField({
    field,
    languageId,
    locale,
    dataVariables,
    className
}: ISectionContentFieldProps) {
    // Granular selector - subscribes only to this specific field's value for this language
    const value = useSectionFormStore(
        (state) => state.fields[field.name]?.[languageId] ?? ''
    );

    const setContentField = useSectionFormStore((state) => state.setContentField);

    const handleChange = useCallback((newValue: string | boolean) => {
        setContentField(field.name, languageId, String(newValue));
    }, [field.name, languageId, setContentField]);

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
        translations: field.translations
    };

    return (
        <FieldRenderer
            key={`${field.id}-${languageId}`}
            field={fieldData}
            value={value}
            onChange={handleChange}
            locale={locale}
            className={className}
            dataVariables={dataVariables}
        />
    );
});

interface ISectionPropertyFieldProps {
    field: ISectionField;
    dataVariables?: Record<string, any>;
    className?: string;
}

/**
 * Store-connected property field component
 * Subscribes only to its specific property value
 * This ensures that changes to other properties don't trigger re-renders
 */
export const SectionPropertyField = React.memo(function SectionPropertyField({
    field,
    dataVariables,
    className
}: ISectionPropertyFieldProps) {
    // Granular selector - subscribes only to this specific property's value
    const value = useSectionFormStore(
        (state) => state.properties[field.name] ?? ''
    );

    const setPropertyField = useSectionFormStore((state) => state.setPropertyField);

    const handleChange = useCallback((newValue: string | boolean) => {
        setPropertyField(field.name, newValue);
    }, [field.name, setPropertyField]);

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
        />
    );
});

