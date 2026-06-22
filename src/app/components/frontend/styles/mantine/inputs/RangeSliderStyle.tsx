/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import React, { useState, useContext } from 'react';
import { RangeSlider, Input } from '@mantine/core';
import { type IRangeSliderStyle } from '../../../../../../types/common/styles.types';
import { FormFieldValueContext } from '../../FormStyle';
import parse from "html-react-parser";
import { sanitizeHtmlForParsing } from '../../../../../../utils/html-sanitizer.utils';

/**
 * Props interface for RangeSliderStyle component
 */
/**
 * Props interface for IRangeSliderStyle component
 */
interface IRangeSliderStyleProps {
    style: IRangeSliderStyle;
    styleProps: Record<string, string>;
    cssClass: string;
}

/**
 * RangeSliderStyle component renders a Mantine RangeSlider component for range selection.
 * Enhanced with controlled input functionality, translatable marks, radius, and standard input fields.
 *
 * Features:
 * - Controlled input with form integration via name attribute
 * - Translatable marks values (display = 1)
 * - Radius configuration
 * - Show label on hover option
 * - Labels always on option
 * - Inverted slider option
 * - Custom marks from JSON configuration
 * - Label and description support using Input.Wrapper (translatable)
 * - Name attribute for form integration
 *
 * Form Submission Pattern:
 * Uses standard HTML form submission with the name attribute.
 * The selected range values are submitted as form data with the specified name.
 *
 * Input.Wrapper Pattern:
 * Always use Input.Wrapper for labels and descriptions in input components.
 * This ensures consistent styling and proper accessibility features.
 *
 * @component
 * @param {IRangeSliderStyleProps} props - Component props
 * @returns {JSX.Element} Rendered Mantine RangeSlider with enhanced configuration
 */
const RangeSliderStyle: React.FC<IRangeSliderStyleProps> = ({ style, styleProps, cssClass }) => {
    // Extract field values using the new unified field structure
    const label = style.label?.content;
    const description = style.description?.content || '';
    const name = style.name?.content;
    // Get form context for field registration
    const min = parseFloat(style.web_numeric_min?.content || '0');
    const max = parseFloat(style.web_numeric_max?.content || '100');
    const step = parseFloat(style.web_numeric_step?.content || '1');
    const size = style.size?.content || 'sm';
    const color = style.color?.content || 'blue';
    const radius = style.radius?.content || 'sm';
    const disabled = style.disabled?.content === '1';
    const styleValue = style.value?.content || '[0, 100]';

    // New fields
    const showLabelOnHover = style.web_range_slider_show_label?.content === '1';
    const labelsAlwaysOn = style.web_range_slider_labels_always_on?.content === '1';
    const inverted = style.web_range_slider_inverted?.content === '1';

    // Handle CSS field - use direct property from API response
    

    // Build style object
    const styleObj: React.CSSProperties = {};

    // Get form context for pre-populated values
    const formContext = useContext(FormFieldValueContext);
    const formValue = formContext && name ? formContext.getFieldValue(name) : null;

    // Initialize value from form context or style configuration
    const [value, setValue] = useState<[number, number]>(() => {
        if (formValue !== null && typeof formValue === 'string') {
            // Use form value if available and it's a string - might be JSON string
            try {
                return JSON.parse(formValue) as [number, number];
            } catch {
                console.warn('Failed to parse range slider form value:', formValue);
            }
        }

        // Fallback to style configuration
        try {
            return JSON.parse(styleValue) as [number, number];
        } catch {
            // Default to full range if parsing fails
            return [min, max];
        }
    });

    // Keep state in sync with the (async) form value via a render-phase update
    // instead of an effect; the sentinel initial runs it on first render too.
    const [prevFormValue, setPrevFormValue] = useState<unknown>(() => ({}));
    if (prevFormValue !== formValue) {
        setPrevFormValue(formValue);
        if (formValue !== null && typeof formValue === 'string') {
            try {
                const parsedValue = JSON.parse(formValue) as [number, number];
                setValue(parsedValue);
            } catch {
                console.warn('Failed to parse updated range slider form value:', formValue);
            }
        }
    }

    // Parse translatable marks values from JSON
    let customMarks: Array<{ value: number; label: string }> = [];
    try {
        const marksJson = style.range_slider_marks_values?.content;
        if (marksJson && marksJson.trim()) {
            const parsed = JSON.parse(marksJson) as unknown;
            if (Array.isArray(parsed)) {
                customMarks = (parsed as Array<{ value: number | string; label?: string }>).map((mark) => ({
                    value: Number(mark.value),
                    label: mark.label || mark.value.toString()
                }));
            }
        }
    } catch (error) {
        console.warn('Invalid JSON in range_slider_marks_values:', error);
        customMarks = [];
    }

    // Generate marks - use custom marks if provided, otherwise use default min/max marks
    const marks = customMarks.length > 0 ? customMarks : [];

    // Handle value change to update local state and register with form
    const handleChange = (newValue: [number, number]) => {
        setValue(newValue);
    };

    // When there is no label/description wrapper, the RangeSlider itself is the
    // root element, so it must carry the section css class + spacing (otherwise
    // the `css`/`css_mobile` escape hatch and spacing silently do nothing on a
    // label-less slider). With a wrapper, those live on the Input.Wrapper below.
    const hasWrapper = Boolean(label || description);

    // RangeSlider component
    const rangeSliderComponent = (
        <RangeSlider
            name={name}
            value={value}
            onChange={handleChange}
            min={min}
            max={max}
            step={step}
            marks={marks}
            size={size}
            color={color}
            radius={radius}
            disabled={disabled}
            inverted={inverted}
            showLabelOnHover={showLabelOnHover}
            labelAlwaysOn={labelsAlwaysOn}
            {...(hasWrapper ? {} : { ...styleProps, className: cssClass })}
        />
    );

    // Wrap component with label or description if present
    const wrappedComponent = hasWrapper ? (
        <Input.Wrapper
            label={label}
            description={parse(sanitizeHtmlForParsing(description))}
            {...styleProps} className={cssClass}
            style={styleObj}
        >
            {rangeSliderComponent}
        </Input.Wrapper>
    ) : (
         rangeSliderComponent 
    );

    return wrappedComponent;
};

export default RangeSliderStyle;
