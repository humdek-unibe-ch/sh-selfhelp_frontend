import React, { useState, useEffect, useContext, useMemo } from 'react';
import { ISelectStyle } from '../../../../types/common/styles.types';
import { FormFieldValueContext } from './FormStyle';
import DOMPurify from 'isomorphic-dompurify';
import { Select, MultiSelect } from '@mantine/core';

/**
 * Props interface for SelectStyle component
 */
interface ISelectStyleProps {
    style: ISelectStyle;
    cssClass: string;
}

/**
 * SelectStyle component renders a dropdown selection field using Mantine Select components
 * Supports single and multiple selection
 * Uses Mantine Select / MultiSelect for better UX and form handling
 */
const SelectStyle: React.FC<ISelectStyleProps> = ({ style, cssClass }) => {
    // Extract field values using the new unified field structure
    const placeholder =
        DOMPurify.sanitize(style.placeholder?.content ?? '', {
            ALLOWED_TAGS: [],
        }) || 'Select an option';

    const name = style.name?.content;
    const value = style.value?.content;
    const required = style.is_required?.content === '1';
    const isMultiple = style.is_multiple?.content === '1';
    const disabled = style.disabled?.content === '1';
    const maxValues = style.max?.content ? parseInt(style.max.content) : undefined;

    // Parse options - handle JSON string format
    let optionsArray: any[] = [];
    try {
        const optionsContent = style.options?.content;
        if (optionsContent) {
            optionsArray = JSON.parse(optionsContent);
        }
    } catch (error) {
        optionsArray = [];
    }

    // Convert options into Mantine format
    const data = useMemo(
        () =>
            optionsArray.map((option: any) => ({
                value: option.value,
                label: option.label || option.text,
            })),
        [optionsArray]
    );

    // Get form context for pre-populated values
    const formContext = useContext(FormFieldValueContext);
    const formValue = formContext && name ? formContext.getFieldValue(name) : null;

    // Use form value if available, otherwise use initial value from style
    const [selectedValue, setSelectedValue] = useState<string | string[]>(
        isMultiple
            ? (formValue && typeof formValue === 'string' ? formValue.split(',') : (value ? value.split(',') : []))
            : (formValue && typeof formValue === 'string' ? formValue : (value || ''))
    );

    // Update value when form context changes (for record editing)
    useEffect(() => {
        if (formValue !== null && typeof formValue === 'string') {
            setSelectedValue(isMultiple ? formValue.split(',') : formValue);
        }
    }, [formValue, isMultiple]);

    const handleChange = (val: string | string[] | null) => {
        setSelectedValue(val ?? (isMultiple ? [] : ''));
    };

    return isMultiple ? (
        <MultiSelect
            className={cssClass}
            data={data}
            value={selectedValue as string[]}
            onChange={handleChange}
            placeholder={placeholder}
            disabled={disabled}
            required={required}
            searchable
            clearable={!required}
            maxValues={maxValues}
        />
    ) : (
        <Select
            className={cssClass}
            data={data}
            value={selectedValue as string}
            onChange={handleChange}
            placeholder={placeholder}
            disabled={disabled}
            required={required}
            searchable
            clearable={!required}
        />
    );
};

export default SelectStyle;