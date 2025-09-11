import React from 'react';
import { ColorPicker } from '@mantine/core';
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
 * Supports swatches, format selection, and full color picker functionality.
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
    const use_mantine_style = getFieldContent(style, 'use_mantine_style') === '1';

    // Handle CSS field - use direct property from API response
    const cssClass = "section-" + style.id + " " + (style.css ?? '');

    // Build style object
    const styleObj: React.CSSProperties = {};

    if (use_mantine_style) {
        return (
            <ColorPicker
                format={format as 'hex' | 'rgba' | 'hsla'}
                swatchesPerRow={swatchesPerRow}
                size={size as any}
                className={cssClass}
                style={styleObj}
            />
        );
    }

    // Fallback to basic color input when Mantine styling is disabled
    return (
        <div className={cssClass} style={{ ...styleObj, padding: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                Color Picker
            </label>
            <input
                type="color"
                style={{
                    width: '60px',
                    height: '60px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    cursor: 'pointer'
                }}
            />
            <div style={{ marginTop: '8px', fontSize: '0.875rem', color: '#666' }}>
                Format: {format.toUpperCase()}
            </div>
        </div>
    );
};

export default ColorPickerStyle;

