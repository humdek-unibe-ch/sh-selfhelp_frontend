import React from 'react';
import { RangeSlider } from '@mantine/core';
import { getFieldContent } from '../../../../../utils/style-field-extractor';
import { IRangeSliderStyle } from '../../../../../types/common/styles.types';

/**
 * Props interface for RangeSliderStyle component
 */
interface IRangeSliderStyleProps {
    style: IRangeSliderStyle;
}

/**
 * RangeSliderStyle component renders a Mantine RangeSlider component for range selection.
 * Supports min/max values, step, and marks display.
 *
 * @component
 * @param {IRangeSliderStyleProps} props - Component props
 * @returns {JSX.Element} Rendered Mantine RangeSlider with styled configuration
 */
const RangeSliderStyle: React.FC<IRangeSliderStyleProps> = ({ style }) => {
    // Extract field values using the new unified field structure
    const min = parseFloat(getFieldContent(style, 'mantine_numeric_min') || '0');
    const max = parseFloat(getFieldContent(style, 'mantine_numeric_max') || '100');
    const step = parseFloat(getFieldContent(style, 'mantine_numeric_step') || '1');
    const withMarks = getFieldContent(style, 'mantine_range_slider_marks') === '1';
    const size = getFieldContent(style, 'mantine_size') || 'sm';
    const color = getFieldContent(style, 'mantine_color') || 'blue';
    const disabled = getFieldContent(style, 'disabled') === '1';
    const use_mantine_style = getFieldContent(style, 'use_mantine_style') === '1';

    // Handle CSS field - use direct property from API response
    const cssClass = "section-" + style.id + " " + (style.css ?? '');

    // Build style object
    const styleObj: React.CSSProperties = {};

    if (use_mantine_style) {
        return (
            <RangeSlider
                min={min}
                max={max}
                step={step}
                marks={withMarks ? [
                    { value: min, label: min.toString() },
                    { value: max, label: max.toString() }
                ] : undefined}
                size={size as any}
                color={color}
                disabled={disabled}
                className={cssClass}
                style={styleObj}
            />
        );
    }

    // Fallback to basic range input when Mantine styling is disabled
    return (
        <input
            type="range"
            min={min}
            max={max}
            step={step}
            className={cssClass}
            disabled={disabled}
            style={styleObj}
        />
    );
};

export default RangeSliderStyle;

