/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import React, { useState, useContext } from 'react';
import { NumberInput } from '@mantine/core';
import { type INumberInputStyle } from '../../../../../../types/common/styles.types';
import { FormFieldValueContext } from '../../FormStyle';
import DOMPurify from 'isomorphic-dompurify';

/**
 * Props interface for NumberInputStyle component
 */
/**
 * Props interface for INumberInputStyle component
 */
interface INumberInputStyleProps {
    style: INumberInputStyle;
    styleProps: Record<string, string>;
    cssClass: string;
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
const NumberInputStyle: React.FC<INumberInputStyleProps> = ({ style, styleProps, cssClass }) => {
    // Extract field values using the new unified field structure
    const placeholder = DOMPurify.sanitize(style.placeholder?.content ?? '');
    const label = style.label?.content;
    const description = style.description?.content;
    const min = style.web_numeric_min?.content;
    const max = style.web_numeric_max?.content;
    const step = style.web_numeric_step?.content || '1';
    const decimalScale = parseInt(style.web_number_input_decimal_scale?.content || '2');
    const clampBehavior = style.web_number_input_clamp_behavior?.content || 'strict';
    const size = style.shared_size?.content || 'sm';
    const radius = style.shared_radius?.content || 'sm';

    // Form configuration fields
    const name = style.name?.content || `section-${style.id}`;
    const defaultValue = style.value?.content;
    const isRequired = style.is_required?.content === '1';
    const disabled = style.disabled?.content === '1';

    // Handle CSS field - use direct property from API response
    

    // Get form context for pre-populated values
    const formContext = useContext(FormFieldValueContext);
    const formValue = formContext && name ? formContext.getFieldValue(name) : null;

    // Use form value if available, otherwise use initial value from style
    const [selectedValue, setSelectedValue] = useState(formValue && typeof formValue === 'string' ? formValue : defaultValue);

    // Keep state in sync with the (async) form value via a render-phase update
    // instead of an effect; the sentinel initial runs it on first render too.
    const [prevFormValue, setPrevFormValue] = useState<unknown>(() => ({}));
    if (prevFormValue !== formValue) {
        setPrevFormValue(formValue);
        if (formValue !== null && typeof formValue === 'string') {
            setSelectedValue(formValue);
        }
    }

    // Handle value change
    const handleValueChange = (value: string | number) => {
        setSelectedValue(value?.toString() || '');
    };

    // NumberInput component
    const numberInputComponent = (
        <NumberInput
            placeholder={ DOMPurify.sanitize(placeholder || 'Enter a number', { ALLOWED_TAGS: [] })}
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
            {...styleProps} className={cssClass}
            name={name}
            label={label}
            description={description}
            // See note in TextInputStyle — autofill extensions decorate
            // numeric fields (phone / postal code / age) before hydration.
            suppressHydrationWarning
        />
    );

    return (
        <>
            {numberInputComponent}
        </>
    );
};

export default NumberInputStyle;

