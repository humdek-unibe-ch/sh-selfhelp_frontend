import React, { useState, useEffect, useContext } from 'react';
import { ColorInput, Input } from '@mantine/core';
import { IColorInputStyle } from '../../../../../../types/common/styles.types';
import { FormFieldValueContext } from '../../FormStyle';

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
    const placeholder = style.placeholder?.content;
    const format = style.mantine_color_format?.content || 'hex';
    const size = style.mantine_size?.content || 'sm';
    const radius = style.mantine_radius?.content || 'sm';

    // Form configuration fields (similar to ColorPicker)
    const label = style.label?.content;
    const description = style.description?.content;
    const name = style.name?.content || `section-${style.id}`;
    const defaultValue = style.value?.content || '';
    const isRequired = style.is_required?.content === '1';
    const disabled = style.disabled?.content === '1';

    // Handle CSS field - use direct property from API response
    const cssClass = "section-" + style.id + " " + (style.css ?? '');

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

