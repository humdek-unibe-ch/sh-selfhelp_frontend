import React, { useState, useEffect, useContext } from 'react';
import { Select, MultiSelect } from '@mantine/core';
import { ISelectStyle } from '../../../../types/common/styles.types';
import { FormFieldValueContext } from './FormStyle';
import { castMantineSize, castMantineRadius } from '../../../../utils/style-field-extractor';

/**
 * Props interface for SelectStyle component
 */
interface ISelectStyleProps {
    style: ISelectStyle;
    cssClass: string;
}

/**
 * SelectStyle component renders a dropdown selection field
 * Supports single and multiple selection, live search, image selection
 * Uses Mantine UI components for consistency
 */
const SelectStyle: React.FC<ISelectStyleProps> = ({ style, cssClass }) => {
    // Extract field values using the new unified field structure
    const label = style.label?.content;
    const placeholder = (style as any).placeholder?.content || 'Select an option';
    const name = style.name?.content;
    const value = style.value?.content;
    const required = style.is_required?.content === '1';
    const isMultiple = style.is_multiple?.content === '1';
    const searchable = (style as any).mantine_select_searchable?.content === '1' || style.live_search?.content === '1';
    const clearable = (style as any).mantine_select_clearable?.content === '1' || style.allow_clear?.content === '1';
    const disabled = style.disabled?.content === '1';
    const size = castMantineSize((style as any).mantine_size?.content);
    const radius = castMantineRadius((style as any).mantine_radius?.content);
    const maxValues = style.max?.content ? parseInt(style.max.content) : undefined;
    const use_mantine_style = (style as any).use_mantine_style?.content === '1';

    // Build style object
    const styleObj: React.CSSProperties = {};

    // Parse items - handle both array and JSON string formats
    let itemsArray: any[] = [];
    try {
        const itemsContent = (style as any).mantine_multi_select_data?.content || style.items?.content;
        if (itemsContent) {
            itemsArray = JSON.parse(itemsContent);
        }
    } catch (error) {
        itemsArray = [];
    }

    // Transform items from the database format to Mantine format
    const items = itemsArray.map((item: any) => ({
        value: item.value,
        label: item.label || item.text,
    }));

    // Get form context for pre-populated values
    const formContext = useContext(FormFieldValueContext);
    const formValue = formContext && name ? formContext.getFieldValue(name) : null;

    // Use form value if available, otherwise use initial value from style
    const [selectedValue, setSelectedValue] = useState(isMultiple ? (formValue ? formValue.split(',') : []) : (formValue || value));

    // Update value when form context changes (for record editing)
    useEffect(() => {
        if (formValue !== null) {
            setSelectedValue(isMultiple ? formValue.split(',') : formValue);
        }
    }, [formValue, isMultiple]);

    const handleSingleValueChange = (value: string | null) => {
        setSelectedValue(value || '');
    };

    const handleMultiValueChange = (value: string[]) => {
        setSelectedValue(value);
    };

    const commonProps = {
        label,
        placeholder,
        name,
        required,
        disabled: disabled,
        searchable,
        clearable,
        size,
        radius,
        className: cssClass,
        style: styleObj,
        data: items,
    };

    if (use_mantine_style) {
        if (isMultiple) {
            return (
                <MultiSelect
                    {...commonProps}
                    maxValues={maxValues}
                    value={selectedValue as string[] | undefined}
                    onChange={handleMultiValueChange}
                />
            );
        }

        return (
            <Select
                {...commonProps}
                value={selectedValue as string | null | undefined}
                onChange={handleSingleValueChange}
            />
        );
    }

    // Fallback to basic select when Mantine styling is disabled
    return (
        <div className={cssClass} style={styleObj}>
            {label && (
                <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '500',
                    marginBottom: '8px'
                }}>
                    {label}
                    {required && <span style={{ color: 'red' }}> *</span>}
                </label>
            )}
            <select
                name={name}
                value={isMultiple ? undefined : selectedValue}
                onChange={(e) => handleSingleValueChange(e.target.value)}
                multiple={isMultiple}
                required={required}
                disabled={disabled}
                style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    fontSize: '14px'
                }}
            >
                {!isMultiple && <option value="">{placeholder}</option>}
                {items.map((item, index) => (
                    <option key={index} value={item.value}>
                        {item.label}
                    </option>
                ))}
            </select>
        </div>
    );
};

export default SelectStyle; 