'use client';

import React, { useCallback } from 'react';
import { FieldRenderer, IFieldData } from '../../shared/field-renderer/FieldRenderer';
import { usePageFormStore } from '../../../../store/pageFormStore';
import { IPageField } from '../../../../../types/common/pages.type';

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

interface IPagePropertyFieldProps {
    field: IPageField;
    languageId: number;
    dataVariables?: Record<string, string>;
    className?: string;
}

export const PagePropertyField = React.memo(function PagePropertyField({
    field,
    languageId,
    dataVariables,
    className
}: IPagePropertyFieldProps) {
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
