import React, { useState, useEffect } from 'react';
import { NumberInput, Input } from '@mantine/core';
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
 * Supports min/max values, step, decimal places, clamp behavior, and form integration.
 *
 * Form Integration Features:
 * - Configurable field name for form submission
 * - Controlled component with state management
 * - Support for required field validation
 * - Label and description support
 * - Hidden input to ensure form submission captures the value
 *
 * @component
 * @param {INumberInputStyleProps} props - Component props
 * @returns {JSX.Element} Rendered Mantine NumberInput with styled configuration
 */
const NumberInputStyle: React.FC<INumberInputStyleProps> = ({ style }) => {
    // Extract field values using the new unified field structure
    const placeholder = getFieldContent(style, 'placeholder');
    const label = getFieldContent(style, 'label');
    const description = getFieldContent(style, 'description');
    const min = getFieldContent(style, 'mantine_numeric_min');
    const max = getFieldContent(style, 'mantine_numeric_max');
    const step = getFieldContent(style, 'mantine_numeric_step') || '1';
    const decimalScale = parseInt(getFieldContent(style, 'mantine_number_input_decimal_scale') || '2');
    const clampBehavior = getFieldContent(style, 'mantine_number_input_clamp_behavior') || 'strict';
    const size = getFieldContent(style, 'mantine_size') || 'sm';
    const radius = getFieldContent(style, 'mantine_radius') || 'sm';

    // Form configuration fields
    const name = getFieldContent(style, 'name') || `section-${style.id}`;
    const defaultValue = getFieldContent(style, 'value');
    const isRequired = getFieldContent(style, 'is_required') === '1';
    const disabled = getFieldContent(style, 'disabled') === '1';

    // Handle CSS field - use direct property from API response
    const cssClass = "section-" + style.id + " " + (style.css ?? '');

    // Initialize selected value state from section_data if available (for record forms)
    const [selectedValue, setSelectedValue] = useState(() => {
        // Check if we have existing data from section_data (for record forms)
        const sectionDataArray: any[] | undefined = (style as any).section_data;
        const firstRecord = Array.isArray(sectionDataArray) && sectionDataArray.length > 0 ? sectionDataArray[0] : null;

        if (firstRecord && firstRecord[name]) {
            // If we have existing data, use it to determine the selected value
            const existingValue = firstRecord[name];
            return existingValue || defaultValue;
        }

        // Fallback to style configuration
        return defaultValue;
    });

    // Update selected value when section_data changes (for record form pre-population)
    useEffect(() => {
        const sectionDataArray: any[] | undefined = (style as any).section_data;
        const firstRecord = Array.isArray(sectionDataArray) && sectionDataArray.length > 0 ? sectionDataArray[0] : null;

        if (firstRecord && firstRecord[name]) {
            const existingValue = firstRecord[name];
            setSelectedValue(existingValue || defaultValue);
        }
    }, [style, name, defaultValue]);

    // Handle value change
    const handleValueChange = (value: string | number) => {
        setSelectedValue(value?.toString() || '');
    };

    // NumberInput component
    const numberInputComponent = (
        <NumberInput
            placeholder={placeholder || 'Enter number'}
            value={selectedValue ? parseFloat(selectedValue) : undefined}
            onChange={handleValueChange}
            min={min ? parseFloat(min) : undefined}
            max={max ? parseFloat(max) : undefined}
            step={parseFloat(step)}
            decimalScale={decimalScale}
            clampBehavior={clampBehavior as 'strict' | 'blur'}
            size={size as 'xs' | 'sm' | 'md' | 'lg' | 'xl'}
            radius={radius === 'none' ? 0 : radius}
            disabled={disabled}
            required={isRequired}
            className={cssClass}
            name={name}
        />
    );

    // Wrap component with label or description if present
    const wrappedComponent = label || description ? (
        <Input.Wrapper
            label={label}
            description={description}
            required={isRequired}
            className={cssClass}
        >
            {numberInputComponent}
        </Input.Wrapper>
    ) : (
        numberInputComponent
    );

    return (
        <>
            {wrappedComponent}
        </>
    );
};

export default NumberInputStyle;

