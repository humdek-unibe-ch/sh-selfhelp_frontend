import React, { useState, useEffect, useContext } from 'react';
import { RangeSlider, Input } from '@mantine/core';
import { IRangeSliderStyle } from '../../../../../../types/common/styles.types';
import { FormFieldValueContext } from '../../FormStyle';
import parse from "html-react-parser";
import { sanitizeHtmlForParsing } from '../../../../../../utils/html-sanitizer.utils';

/**
 * Props interface for RangeSliderStyle component
 */
interface IRangeSliderStyleProps {
    style: IRangeSliderStyle;
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
const RangeSliderStyle: React.FC<IRangeSliderStyleProps> = ({ style }) => {
    // Extract field values using the new unified field structure
    const label = style.label?.content;
    const description = style.description?.content || '';
    const name = style.name?.content;
    // Get form context for field registration
    const min = parseFloat((style as any).mantine_numeric_min?.content || '0');
    const max = parseFloat((style as any).mantine_numeric_max?.content || '100');
    const step = parseFloat((style as any).mantine_numeric_step?.content || '1');
    const size = style.mantine_size?.content || 'sm';
    const color = style.mantine_color?.content || 'blue';
    const radius = style.mantine_radius?.content || 'sm';
    const disabled = style.disabled?.content === '1';
    const styleValue = style.value?.content || '[0, 100]';

    // New fields
    const showLabelOnHover = style.mantine_range_slider_show_label?.content === '1';
    const labelsAlwaysOn = style.mantine_range_slider_labels_always_on?.content === '1';
    const inverted = style.mantine_range_slider_inverted?.content === '1';

    // Handle CSS field - use direct property from API response
    const cssClass = "section-" + style.id + " " + (style.css ?? '');

    // Build style object
    const styleObj: React.CSSProperties = {};

    // Get form context for pre-populated values
    const formContext = useContext(FormFieldValueContext);
    const formValue = formContext && name ? formContext.getFieldValue(name) : null;

    // Initialize value from form context or style configuration
    const [value, setValue] = useState<[number, number]>(() => {
        if (formValue !== null) {
            // Use form value if available - might be JSON string or already parsed array
            try {
                if (typeof formValue === 'string') {
                    return JSON.parse(formValue) as [number, number];
                } else if (Array.isArray(formValue)) {
                    return formValue as [number, number];
                }
            } catch (error) {
                console.warn('Failed to parse range slider form value:', formValue);
            }
        }

        // Fallback to style configuration
        try {
            return JSON.parse(styleValue) as [number, number];
        } catch (error) {
            // Default to full range if parsing fails
            return [min, max];
        }
    });

    // Update value when form context changes (for record editing)
    useEffect(() => {
        if (formValue !== null) {
            try {
                let parsedValue: [number, number];
                if (typeof formValue === 'string') {
                    parsedValue = JSON.parse(formValue) as [number, number];
                } else if (Array.isArray(formValue)) {
                    parsedValue = formValue as [number, number];
                } else {
                    return; // Invalid format
                }
                setValue(parsedValue);
            } catch (error) {
                console.warn('Failed to parse updated range slider form value:', formValue);
            }
        }
    }, [formValue]);

    // Parse translatable marks values from JSON
    let customMarks: Array<{ value: number; label: string }> = [];
    try {
        const marksJson = style.mantine_range_slider_marks_values?.content;
        if (marksJson && marksJson.trim()) {
            const parsed = JSON.parse(marksJson);
            if (Array.isArray(parsed)) {
                customMarks = parsed.map((mark: any) => ({
                    value: Number(mark.value),
                    label: mark.label || mark.value.toString()
                }));
            }
        }
    } catch (error) {
        console.warn('Invalid JSON in mantine_range_slider_marks_values:', error);
        customMarks = [];
    }

    // Generate marks - use custom marks if provided, otherwise use default min/max marks
    const marks = customMarks.length > 0 ? customMarks : [];

    // Handle value change to update local state and register with form
    const handleChange = (newValue: [number, number]) => {
        setValue(newValue);
    };

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
        />
    );

    // Wrap component with label or description if present
    const wrappedComponent = label || description ? (
        <Input.Wrapper
            label={label}
            description={parse(sanitizeHtmlForParsing(description))}
            className={cssClass}
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
