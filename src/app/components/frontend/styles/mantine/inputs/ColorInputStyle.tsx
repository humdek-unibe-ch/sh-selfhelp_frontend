import React, { useState, useEffect } from 'react';
import { ColorInput, Input } from '@mantine/core';
import { getFieldContent } from '../../../../../../utils/style-field-extractor';
import { IColorInputStyle } from '../../../../../../types/common/styles.types';

/**
 * Props interface for ColorInputStyle component
 */
interface IColorInputStyleProps {
    style: IColorInputStyle;
}

/**
 * ColorInputStyle component renders a Mantine ColorInput component for color selection.
 * Provides various formats, swatches support, and form integration.
 *
 * Form Integration Features:
 * - Configurable field name for form submission
 * - Controlled component with state management
 * - Support for required field validation
 * - Backward compatibility with legacy fields
 * - Hidden input to ensure form submission captures the value
 *
 * @component
 * @param {IColorInputStyleProps} props - Component props
 * @returns {JSX.Element} Rendered Mantine ColorInput with styled configuration
 */
const ColorInputStyle: React.FC<IColorInputStyleProps> = ({ style }) => {
    // Extract field values using the new unified field structure
    const placeholder = getFieldContent(style, 'placeholder');
    const format = getFieldContent(style, 'mantine_color_format') || 'hex';
    const size = getFieldContent(style, 'mantine_size') || 'sm';
    const radius = getFieldContent(style, 'mantine_radius') || 'sm';

    // Form configuration fields (similar to ColorPicker)
    const label = getFieldContent(style, 'label');
    const description = getFieldContent(style, 'description');
    const name = getFieldContent(style, 'name') || `section-${style.id}`;
    const defaultValue = getFieldContent(style, 'value') || '';
    const isRequired = getFieldContent(style, 'is_required') === '1';
    const disabled = getFieldContent(style, 'disabled') === '1';

    // Handle CSS field - use direct property from API response
    const cssClass = "section-" + style.id + " " + (style.css ?? '');

    // Initialize selected color state from section_data if available (for record forms)
    const [selectedColor, setSelectedColor] = useState(() => {
        // Check if we have existing data from section_data (for record forms)
        const sectionDataArray: any[] | undefined = (style as any).section_data;
        const firstRecord = Array.isArray(sectionDataArray) && sectionDataArray.length > 0 ? sectionDataArray[0] : null;

        if (firstRecord && firstRecord[name]) {
            // If we have existing data, use it to determine the selected color
            const existingValue = firstRecord[name];
            return existingValue || defaultValue;
        }

        // Fallback to style configuration
        return defaultValue;
    });

    // Update selected color when section_data changes (for record form pre-population)
    useEffect(() => {
        const sectionDataArray: any[] | undefined = (style as any).section_data;
        const firstRecord = Array.isArray(sectionDataArray) && sectionDataArray.length > 0 ? sectionDataArray[0] : null;

        if (firstRecord && firstRecord[name]) {
            const existingValue = firstRecord[name];
            setSelectedColor(existingValue || defaultValue);
        }
    }, [style, name, defaultValue]);

    // Handle color change
    const handleColorChange = (color: string) => {
        setSelectedColor(color);
    };


    // Build style object
    const styleObj: React.CSSProperties = {};

    const colorInputComponent = (
        <ColorInput
            placeholder={placeholder || 'Pick a color'}
            format={format as 'hex' | 'rgba' | 'hsla'}
            size={size as 'xs' | 'sm' | 'md' | 'lg' | 'xl'}
            radius={radius === 'none' ? 0 : radius}
            value={selectedColor}
            onChange={handleColorChange}
            disabled={disabled}
            required={isRequired}
            className={cssClass}
            style={styleObj}
            name={name}
            label={label}
            description={description}
        />
    );
    return (
        <>
            {colorInputComponent}
        </>
    );
};

export default ColorInputStyle;

