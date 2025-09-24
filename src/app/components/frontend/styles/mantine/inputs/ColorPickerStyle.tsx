import React, { useState, useEffect, useContext } from 'react';
import { ColorPicker, Button, Popover, Tooltip, Input } from '@mantine/core';
import { IColorPickerStyle } from '../../../../../../types/common/styles.types';
import { FormFieldValueContext } from '../../FormStyle';
import parse from "html-react-parser";
import { sanitizeHtmlForParsing } from '../../../../../../utils/html-sanitizer.utils';

/**
 * Props interface for ColorPickerStyle component
 */
/**
 * Props interface for IColorPickerStyle component
 */
interface IColorPickerStyleProps {
    style: IColorPickerStyle;
    styleProps: Record<string, any>;
    cssClass: string;
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
const ColorPickerStyle: React.FC<IColorPickerStyleProps> = ({ style, styleProps, cssClass }) => {

    // Extract field values using the new unified field structure
    const format = style.mantine_color_format?.content || 'hex';
    const swatchesPerRow = parseInt((style as any).mantine_color_picker_swatches_per_row?.content || '7');
    const size = style.mantine_size?.content || 'sm';

    // New field values
    const swatchesJson = style.mantine_color_picker_swatches?.content;        
    const saturationLabel = style.mantine_color_picker_saturation_label?.content || 'Saturation';
    const hueLabel = style.mantine_color_picker_hue_label?.content || 'Hue';
    const alphaLabel = style.mantine_color_picker_alpha_label?.content || 'Alpha';
    const fullWidth = style.mantine_fullwidth?.content === '1';

    // Form configuration fields (similar to ChipStyle)
    const label = style.label?.content;
    const description = style.description?.content || '';
    const name = style.name?.content || `section-${style.id}`;
    const defaultValue = style.value?.content || '';
    const isRequired = style.is_required?.content === '1';

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
    

    // Get form context for pre-populated values
    const formContext = useContext(FormFieldValueContext);
    const formValue = formContext && name ? formContext.getFieldValue(name) : null;

    // Initialize selected color state from form context or style configuration
    const [selectedColor, setSelectedColor] = useState(() => {
        if (formValue !== null) {
            // Use form value if available
            return formValue;
        }

        // Fallback to style configuration
        return defaultValue;
    });

    // Update selected color when form context changes (for record editing)
    useEffect(() => {
        if (formValue !== null) {
            setSelectedColor(formValue);
        }
    }, [formValue]);

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
            {...styleProps} className={cssClass}
        />
    );

    // Wrap component with label or description if present
    const wrappedColorPicker = label || description ? (
        <Input.Wrapper
            label={label}
            description={parse(sanitizeHtmlForParsing(description))}
            required={isRequired}
            {...styleProps} className={cssClass}
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

