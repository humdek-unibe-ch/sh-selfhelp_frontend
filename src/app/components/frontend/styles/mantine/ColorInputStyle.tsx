import React from 'react';
import { ColorInput } from '@mantine/core';
import { getFieldContent } from '../../../../../utils/style-field-extractor';
import { IColorInputStyle } from '../../../../../types/common/styles.types';

/**
 * Props interface for ColorInputStyle component
 */
interface IColorInputStyleProps {
    style: IColorInputStyle;
}

/**
 * ColorInputStyle component renders a Mantine ColorInput component for color selection.
 * Provides various formats and swatches support.
 *
 * @component
 * @param {IColorInputStyleProps} props - Component props
 * @returns {JSX.Element} Rendered Mantine ColorInput with styled configuration
 */
const ColorInputStyle: React.FC<IColorInputStyleProps> = ({ style }) => {
    // Extract field values using the new unified field structure
    const placeholder = getFieldContent(style, 'placeholder');
    const format = getFieldContent(style, 'mantine_color_format') || 'hex';
    const withSwatches = getFieldContent(style, 'mantine_color_input_swatches') === '1';
    const size = getFieldContent(style, 'mantine_size') || 'sm';
    const radius = getFieldContent(style, 'mantine_radius') || 'sm';
    const disabled = getFieldContent(style, 'disabled') === '1';
    const use_mantine_style = getFieldContent(style, 'use_mantine_style') === '1';

    // Handle CSS field - use direct property from API response
    const cssClass = "section-" + style.id + " " + (style.css ?? '');

    // Build style object
    const styleObj: React.CSSProperties = {};

    if (use_mantine_style) {
        return (
            <ColorInput
                placeholder={placeholder || 'Pick a color'}
                format={format as 'hex' | 'rgba' | 'hsla'}
                withPicker={withSwatches}
                size={size as any}
                radius={radius}
                disabled={disabled}
                className={cssClass}
                style={styleObj}
            />
        );
    }

    // Fallback to basic input when Mantine styling is disabled
    return (
        <input
            type="color"
            placeholder={placeholder || 'Pick a color'}
            className={cssClass}
            disabled={disabled}
            style={styleObj}
        />
    );
};

export default ColorInputStyle;

