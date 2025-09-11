import React from 'react';
import { NumberInput } from '@mantine/core';
import { getFieldContent } from '../../../../../utils/style-field-extractor';
import { INumberInputStyle } from '../../../../../types/common/styles.types';

/**
 * Props interface for NumberInputStyle component
 */
interface INumberInputStyleProps {
    style: INumberInputStyle;
}

/**
 * NumberInputStyle component renders a Mantine NumberInput component for numeric input.
 * Supports min/max values, step, decimal places, and clamp behavior.
 *
 * @component
 * @param {INumberInputStyleProps} props - Component props
 * @returns {JSX.Element} Rendered Mantine NumberInput with styled configuration
 */
const NumberInputStyle: React.FC<INumberInputStyleProps> = ({ style }) => {
    // Extract field values using the new unified field structure
    const placeholder = getFieldContent(style, 'placeholder');
    const min = getFieldContent(style, 'mantine_numeric_min');
    const max = getFieldContent(style, 'mantine_numeric_max');
    const step = getFieldContent(style, 'mantine_numeric_step') || '1';
    const decimalScale = parseInt(getFieldContent(style, 'mantine_number_input_decimal_scale') || '2');
    const clampBehavior = getFieldContent(style, 'mantine_number_input_clamp_behavior') || 'strict';
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
            <NumberInput
                placeholder={placeholder || 'Enter number'}
                min={min ? parseFloat(min) : undefined}
                max={max ? parseFloat(max) : undefined}
                step={parseFloat(step)}
                decimalScale={decimalScale}
                clampBehavior={clampBehavior as 'strict' | 'blur'}
                size={size as any}
                radius={radius === 'none' ? 0 : radius}
                disabled={disabled}
                className={cssClass}
                style={styleObj}
            />
        );
    }

    // Fallback to basic input when Mantine styling is disabled
    return (
        <input
            type="number"
            placeholder={placeholder || 'Enter number'}
            min={min}
            max={max}
            step={step}
            className={cssClass}
            disabled={disabled}
            style={styleObj}
        />
    );
};

export default NumberInputStyle;

