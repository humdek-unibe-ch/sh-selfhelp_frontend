import React, { useState, useEffect, useContext } from 'react';
import { ISelectStyle } from '../../../../types/common/styles.types';
import { FormFieldValueContext } from './FormStyle';

/**
 * Props interface for SelectStyle component
 */
interface ISelectStyleProps {
    style: ISelectStyle;
    cssClass: string;
}

/**
 * SelectStyle component renders a dropdown selection field using HTML select elements
 * Supports single and multiple selection
 * Uses plain HTML select elements for form compatibility
 */
const SelectStyle: React.FC<ISelectStyleProps> = ({ style, cssClass }) => {
    // Extract field values using the new unified field structure
    const placeholder = style.placeholder?.content || 'Select an option';
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

    // Get form context for pre-populated values
    const formContext = useContext(FormFieldValueContext);
    const formValue = formContext && name ? formContext.getFieldValue(name) : null;

    // Use form value if available, otherwise use initial value from style
    const [selectedValue, setSelectedValue] = useState<string | string[]>(
        isMultiple
            ? (formValue ? formValue.split(',') : (value ? value.split(',') : []))
            : (formValue || value || '')
    );

    // Update value when form context changes (for record editing)
    useEffect(() => {
        if (formValue !== null) {
            setSelectedValue(isMultiple ? formValue.split(',') : formValue);
        }
    }, [formValue, isMultiple]);

    const handleSingleValueChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedValue(event.target.value);
    };

    const handleMultiValueChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedOptions = Array.from(event.target.selectedOptions, option => option.value);
        setSelectedValue(selectedOptions);
    };

    return (
        <select
            name={isMultiple ? `${name}[]` : name}
            value={selectedValue}
            onChange={isMultiple ? handleMultiValueChange : handleSingleValueChange}
            multiple={isMultiple}
            required={required}
            disabled={disabled}
            size={isMultiple ? Math.min(optionsArray.length + 1, 6) : undefined} // Show more options for multiple select
        >
            {!isMultiple && !required && <option value="">{placeholder}</option>}
            {optionsArray.map((option: any, index: number) => (
                <option key={index} value={option.value}>
                    {option.label || option.text}
                </option>
            ))}
        </select>
    );
};

export default SelectStyle; 