import React, { useState, useEffect } from 'react';
import { ColorPicker, Button, Popover, Tooltip, Input } from '@mantine/core';
import { getFieldContent } from '../../../../../utils/style-field-extractor';
import { IColorPickerStyle } from '../../../../../types/common/styles.types';

/**
 * Props interface for ColorPickerStyle component
 */
interface IColorPickerStyleProps {
    style: IColorPickerStyle;
}

/**
 * ColorPickerStyle component renders a Mantine ColorPicker component for advanced color selection.
 * Supports swatches, format selection, accessibility labels, button mode, and form integration.
 *
 * Form Integration Features:
 * - Configurable field name for form submission
 * - Controlled component with state management
 * - Support for required field validation
 * - Optional button mode for compact display
 * - Backward compatibility with legacy fields
 * - Hidden input to ensure form submission captures the value
 *
 * @component
 * @param {IColorPickerStyleProps} props - Component props
 * @returns {JSX.Element} Rendered Mantine ColorPicker with styled configuration
 */
const ColorPickerStyle: React.FC<IColorPickerStyleProps> = ({ style }) => {

    // Extract field values using the new unified field structure
    const format = getFieldContent(style, 'mantine_color_format') || 'hex';
    const swatchesPerRow = parseInt(getFieldContent(style, 'mantine_color_picker_swatches_per_row') || '7');
    const size = getFieldContent(style, 'mantine_size') || 'sm';

    // New field values
    const swatchesJson = getFieldContent(style, 'mantine_color_picker_swatches');        
    const saturationLabel = getFieldContent(style, 'mantine_color_picker_saturation_label') || 'Saturation';
    const hueLabel = getFieldContent(style, 'mantine_color_picker_hue_label') || 'Hue';
    const alphaLabel = getFieldContent(style, 'mantine_color_picker_alpha_label') || 'Alpha';
    const fullWidth = getFieldContent(style, 'mantine_fullwidth') === '1';

    // Form configuration fields (similar to ChipStyle)
    const label = getFieldContent(style, 'label');
    const description = getFieldContent(style, 'description');
    const name = getFieldContent(style, 'name') || `section-${style.id}`;
    const defaultValue = getFieldContent(style, 'value') || '';
    const isRequired = getFieldContent(style, 'is_required') === '1';

    // Parse swatches JSON array
    let swatches: string[] = [];
    try {
        if (swatchesJson) {
            swatches = JSON.parse(swatchesJson);
        }
    } catch (error) {
        console.warn('Invalid swatches JSON for ColorPicker:', swatchesJson);
        // Fallback to default swatches
        swatches = ['#2e2e2e', '#868e96', '#fa5252', '#e64980', '#be4bdb', '#7950f2', '#4c6ef5', '#228be6', '#15aabf', '#12b886', '#40c057', '#82c91e', '#fab005', '#fd7e14'];
    }

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

    // ColorPicker component
    const colorPickerComponent = (
        <ColorPicker
            format={format as 'hex' | 'rgba' | 'hsla'}
            swatchesPerRow={swatchesPerRow}
            size={size as 'xs' | 'sm' | 'md' | 'lg' | 'xl'}
            swatches={swatches}
            value={selectedColor}
            onChange={handleColorChange}
            saturationLabel={saturationLabel}
            hueLabel={hueLabel}
            alphaLabel={alphaLabel}
            fullWidth={fullWidth}
            className={cssClass}
        />
    );

    // Wrap component with label or description if present
    const wrappedColorPicker = label || description ? (
        <Input.Wrapper
            label={label}
            description={description}
            required={isRequired}
            className={cssClass}
        >
            {colorPickerComponent}
        </Input.Wrapper>
    ) : (
        colorPickerComponent
    );

    // Default mode - return ColorPicker directly
    return (
        <>
            {wrappedColorPicker}
            {/* Hidden input to ensure form submission captures the value */}
            <input
                type="hidden"
                name={name}
                value={selectedColor}
                required={isRequired}
            />
        </>
    );
};

export default ColorPickerStyle;

