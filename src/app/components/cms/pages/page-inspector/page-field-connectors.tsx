/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
'use client';

import React, { useCallback } from 'react';
import { FieldRenderer, type IFieldData } from '../../shared/field-renderer/FieldRenderer';
import { usePageFormStore } from '../../../../store/pageFormStore';
import { type IPageField } from '../../../../../types/common/pages.type';

interface IPageContentFieldProps {
    field: IPageField;
    languageId: number;
    locale?: string;
    dataVariables?: Record<string, string>;
    className?: string;
    disabled?: boolean;
}

export const PageContentField = React.memo(function PageContentField({
    field,
    languageId,
    locale,
    dataVariables,
    className,
    disabled = false
}: IPageContentFieldProps) {
    const value = usePageFormStore(
        (state) => state.fields[field.name]?.[languageId] ?? ''
    );

    const setContentField = usePageFormStore((state) => state.setContentField);

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
        disabled,
        display: field.display,
        config: field.config,
        translations: field.translations || []
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
            disabled={disabled}
        />
    );
});

/**
 * Page PROPERTY fields (display=0) are NOT language-specific: the backend stores
 * a single value under the "property" language (id 1) and reads it back from
 * there (`PageFieldService` / `TranslationManagerTrait`). The editor MUST read
 * and write that same id, otherwise an edit lands under a content language and
 * the save (which only serialises id 1) silently drops it. So this component is
 * pinned to the property language and never takes a `languageId`.
 */
const PROPERTY_LANGUAGE_ID = 1;

interface IPagePropertyFieldProps {
    field: IPageField;
    dataVariables?: Record<string, string>;
    className?: string;
}

export const PagePropertyField = React.memo(function PagePropertyField({
    field,
    dataVariables,
    className
}: IPagePropertyFieldProps) {
    const value = usePageFormStore(
        (state) => state.fields[field.name]?.[PROPERTY_LANGUAGE_ID] ?? ''
    );

    const setContentField = usePageFormStore((state) => state.setContentField);

    const handleChange = useCallback((newValue: string | boolean) => {
        setContentField(field.name, PROPERTY_LANGUAGE_ID, String(newValue));
    }, [field.name, setContentField]);

    const fieldData: IFieldData = {
        id: field.id,
        name: field.name,
        title: field.title,
        type: field.type,
        default_value: field.default_value,
        help: field.help,
        display: field.display,
        config: field.config,
        translations: field.translations || []
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
