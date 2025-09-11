import React from 'react';
import { Combobox } from '@mantine/core';
import { getFieldContent, castMantineSize, castMantineRadius } from '../../../../../utils/style-field-extractor';
import { IComboboxStyle } from '../../../../../types/common/styles.types';

/**
 * Props interface for ComboboxStyle component
 */
interface IComboboxStyleProps {
    style: IComboboxStyle;
}

/**
 * ComboboxStyle component renders a Mantine Combobox component for searchable dropdowns.
 * Supports customizable data options and styling configurations.
 *
 * @component
 * @param {IComboboxStyleProps} props - Component props
 * @returns {JSX.Element} Rendered Mantine Combobox with styled configuration
 */
const ComboboxStyle: React.FC<IComboboxStyleProps> = ({ style }) => {
    // Extract field values using the new unified field structure
    const placeholder = getFieldContent(style, 'placeholder') || 'Select option...';
    const size = castMantineSize(getFieldContent(style, 'mantine_size'));
    const radius = castMantineRadius(getFieldContent(style, 'mantine_radius'));
    const disabled = getFieldContent(style, 'disabled') === '1';
    const use_mantine_style = getFieldContent(style, 'use_mantine_style') === '1';

    // Handle CSS field - use direct property from API response
    const cssClass = "section-" + style.id + " " + (style.css ?? '');

    // Build style object
    const styleObj: React.CSSProperties = {};

    // Parse combobox data from JSON textarea
    let comboboxData: Array<{ value: string; label: string }> = [];
    try {
        const dataJson = getFieldContent(style, 'mantine_combobox_data');
        if (dataJson) {
            comboboxData = JSON.parse(dataJson);
        } else {
            // Default data if none provided
            comboboxData = [
                { value: 'option1', label: 'Option 1' },
                { value: 'option2', label: 'Option 2' },
                { value: 'option3', label: 'Option 3' }
            ];
        }
    } catch (error) {
        console.warn('Invalid JSON in mantine_combobox_data:', error);
        comboboxData = [];
    }

    if (use_mantine_style) {
        return (
            <Combobox
                data={comboboxData}
                placeholder={placeholder}
                size={size}
                radius={radius}
                disabled={disabled}
                className={cssClass}
                style={styleObj}
            />
        );
    }

    // Fallback to basic select when Mantine styling is disabled
    return (
        <select
            className={cssClass}
            disabled={disabled}
            style={styleObj}
        >
            <option value="" disabled>
                {placeholder}
            </option>
            {comboboxData.map((option, index) => (
                <option key={index} value={option.value}>
                    {option.label}
                </option>
            ))}
        </select>
    );
};

export default ComboboxStyle;
