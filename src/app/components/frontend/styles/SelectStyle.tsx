/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import React, { useState, useContext, useMemo } from 'react';
import { type ISelectStyle } from '../../../../types/common/styles.types';
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
    const label = style.label?.content || undefined;
    const value = style.value?.content;
    const required = style.is_required?.content === '1';
    const isMultiple = style.is_multiple?.content === '1';
    const disabled = style.disabled?.content === '1';
    const maxValues = style.max?.content ? parseInt(style.max.content) : undefined;
    // RF-17: author-configurable (was hardcoded). Default preserves prior
    // behaviour — searchable on, clearable only when the field is not required.
    const searchable = style.shared_searchable?.content !== '0';
    const clearable = style.shared_clearable?.content ? style.shared_clearable.content === '1' : !required;

    // Convert options into Mantine format. Parsing happens inside the memo so the
    // derived `data` only changes when the raw options string changes (the
    // intermediate parsed array is no longer a separate render-phase value).
    const data = useMemo(() => {
        let optionsArray: Array<{ value: string; label: string; text: string }> = [];
        try {
            const optionsContent = style.options?.content;
            if (optionsContent) {
                optionsArray = JSON.parse(optionsContent);
            }
        } catch {
            optionsArray = [];
        }
        return optionsArray.map((option) => ({
            value: option.value,
            label: option.label || option.text,
        }));
    }, [style.options]);

    // Get form context for pre-populated values
    const formContext = useContext(FormFieldValueContext);
    const formValue = formContext && name ? formContext.getFieldValue(name) : null;

    // Use form value if available, otherwise use initial value from style
    const [selectedValue, setSelectedValue] = useState<string | string[]>(
        isMultiple
            ? (formValue && typeof formValue === 'string' ? formValue.split(',') : (value ? value.split(',') : []))
            : (formValue && typeof formValue === 'string' ? formValue : (value || ''))
    );

    // Keep state in sync with the (async) form value via a render-phase update
    // instead of an effect; the sentinel initial runs it on first render too,
    // and prevIsMultiple mirrors the original [formValue, isMultiple] deps.
    const [prevFormValue, setPrevFormValue] = useState<unknown>(() => ({}));
    const [prevIsMultiple, setPrevIsMultiple] = useState(isMultiple);
    if (prevFormValue !== formValue || prevIsMultiple !== isMultiple) {
        setPrevFormValue(formValue);
        setPrevIsMultiple(isMultiple);
        if (formValue !== null && typeof formValue === 'string') {
            setSelectedValue(isMultiple ? formValue.split(',') : formValue);
        }
    }

    const handleChange = (val: string | string[] | null) => {
        setSelectedValue(val ?? (isMultiple ? [] : ''));
    };

    return isMultiple ? (
        <MultiSelect
            className={cssClass}
            label={label}
            data={data}
            value={selectedValue as string[]}
            onChange={handleChange}
            placeholder={placeholder}
            disabled={disabled}
            required={required}
            searchable={searchable}
            clearable={clearable}
            maxValues={maxValues}
        />
    ) : (
        <Select
            className={cssClass}
            label={label}
            data={data}
            value={selectedValue as string}
            onChange={handleChange}
            placeholder={placeholder}
            disabled={disabled}
            required={required}
            searchable={searchable}
            clearable={clearable}
        />
    );
};

export default SelectStyle;