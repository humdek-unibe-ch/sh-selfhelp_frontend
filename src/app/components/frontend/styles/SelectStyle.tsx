import React from 'react';
import { Select, MultiSelect } from '@mantine/core';
import { ISelectStyle } from '../../../../types/common/styles.types';
import { getFieldContent, castMantineSize, castMantineRadius } from '../../../../utils/style-field-extractor';

/**
 * Props interface for SelectStyle component
 */
interface ISelectStyleProps {
    style: ISelectStyle;
}

/**
 * SelectStyle component renders a dropdown selection field
 * Supports single and multiple selection, live search, image selection
 * Uses Mantine UI components for consistency
 */
const SelectStyle: React.FC<ISelectStyleProps> = ({ style }) => {
    // Extract field values using the new unified field structure
    const label = getFieldContent(style, 'label');
    const placeholder = getFieldContent(style, 'placeholder') || 'Select an option';
    const name = getFieldContent(style, 'name');
    const value = getFieldContent(style, 'value');
    const required = getFieldContent(style, 'is_required') === '1';
    const isMultiple = getFieldContent(style, 'is_multiple') === '1';
    const searchable = getFieldContent(style, 'mantine_select_searchable') === '1' || getFieldContent(style, 'live_search') === '1';
    const clearable = getFieldContent(style, 'mantine_select_clearable') === '1' || getFieldContent(style, 'allow_clear') === '1';
    const locked = getFieldContent(style, 'locked_after_submit') === '1';
    const disabled = getFieldContent(style, 'disabled') === '1';
    const size = castMantineSize(getFieldContent(style, 'mantine_size'));
    const radius = castMantineRadius(getFieldContent(style, 'mantine_radius'));
    const maxValues = getFieldContent(style, 'max') ? parseInt(getFieldContent(style, 'max')!) : undefined;
    const use_mantine_style = getFieldContent(style, 'use_mantine_style') === '1';

    // Handle CSS field - use direct property from API response
    const cssClass = "section-" + style.id + " " + (style.css ?? '');

    // Build style object
    const styleObj: React.CSSProperties = {};

    // Parse items - handle both array and JSON string formats
    let itemsArray: any[] = [];
    try {
        const itemsContent = getFieldContent(style, 'mantine_multi_select_data') || getFieldContent(style, 'items');
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

    const commonProps = {
        label,
        placeholder,
        name,
        required,
        disabled: disabled || locked,
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
                    defaultValue={value ? value.split(',') : undefined}
                    maxValues={maxValues}
                />
            );
        }

        return (
            <Select
                {...commonProps}
                defaultValue={value}
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
                defaultValue={isMultiple ? undefined : value}
                multiple={isMultiple}
                required={required}
                disabled={disabled || locked}
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