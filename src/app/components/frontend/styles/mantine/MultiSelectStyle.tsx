import React from 'react';
import { MultiSelect } from '@mantine/core';
import { getFieldContent, castMantineSize, castMantineRadius } from '../../../../../utils/style-field-extractor';
import { IMultiSelectStyle } from '../../../../../types/common/styles.types';

/**
 * Props interface for MultiSelectStyle component
 */
interface IMultiSelectStyleProps {
    style: IMultiSelectStyle;
}

/**
 * MultiSelectStyle component renders a Mantine MultiSelect component for multiple selection dropdowns.
 * Supports customizable data options, max values, and styling configurations.
 *
 * @component
 * @param {IMultiSelectStyleProps} props - Component props
 * @returns {JSX.Element} Rendered Mantine MultiSelect with styled configuration
 */
const MultiSelectStyle: React.FC<IMultiSelectStyleProps> = ({ style }) => {
    // Extract field values using the new unified field structure
    const placeholder = getFieldContent(style, 'placeholder') || 'Select options...';
    const maxValues = parseInt(getFieldContent(style, 'mantine_multi_select_max_values') || '0') || undefined;
    const size = castMantineSize(getFieldContent(style, 'mantine_size'));
    const radius = castMantineRadius(getFieldContent(style, 'mantine_radius'));
    const disabled = getFieldContent(style, 'disabled') === '1';
    const use_mantine_style = getFieldContent(style, 'use_mantine_style') === '1';

    // Handle CSS field - use direct property from API response
    const cssClass = "section-" + style.id + " " + (style.css ?? '');

    // Build style object
    const styleObj: React.CSSProperties = {};

    // Parse multi-select data from JSON textarea
    let multiSelectData: Array<{ value: string; label: string }> = [];
    try {
        const dataJson = getFieldContent(style, 'mantine_multi_select_data');
        if (dataJson) {
            multiSelectData = JSON.parse(dataJson);
        } else {
            // Default data if none provided
            multiSelectData = [
                { value: 'option1', label: 'Option 1' },
                { value: 'option2', label: 'Option 2' },
                { value: 'option3', label: 'Option 3' },
                { value: 'option4', label: 'Option 4' }
            ];
        }
    } catch (error) {
        console.warn('Invalid JSON in mantine_multi_select_data:', error);
        multiSelectData = [];
    }

    if (use_mantine_style) {
        return (
            <MultiSelect
                data={multiSelectData}
                placeholder={placeholder}
                maxValues={maxValues}
                size={size}
                radius={radius === 'none' ? 0 : radius}
                disabled={disabled}
                className={cssClass}
                style={styleObj}
            />
        );
    }

    // Fallback to basic multi-select when Mantine styling is disabled
    return (
        <select
            multiple
            className={cssClass}
            disabled={disabled}
            style={styleObj}
        >
            {multiSelectData.map((option, index) => (
                <option key={index} value={option.value}>
                    {option.label}
                </option>
            ))}
        </select>
    );
};

export default MultiSelectStyle;
