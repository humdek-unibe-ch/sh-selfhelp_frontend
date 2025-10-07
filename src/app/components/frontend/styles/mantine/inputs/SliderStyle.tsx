import React, { useState, useEffect, useContext } from 'react';
import { Slider, Input } from '@mantine/core';
import { ISliderStyle } from '../../../../../../types/common/styles.types';
import { FormFieldValueContext } from '../../FormStyle';
import parse from "html-react-parser";
import { sanitizeHtmlForParsing } from '../../../../../../utils/html-sanitizer.utils';

/**
 * Props interface for SliderStyle component
 */
/**
 * Props interface for ISliderStyle component
 */
interface ISliderStyleProps {
    style: ISliderStyle;
    styleProps: Record<string, any>;
    cssClass: string;
}

/**
 * SliderStyle component renders a Mantine Slider component for single value selection.
 * Enhanced with controlled input functionality, translatable marks, radius, and standard input fields.
 *
 * Features:
 * - Controlled input with form integration via name attribute
 * - Translatable marks values (display = 1)
 * - Radius configuration
 * - Show label on hover option
 * - Labels always on option
 * - Inverted slider option
 * - Readonly and required support
 * - Custom marks from JSON configuration
 * - Label and description support using Input.Wrapper (translatable)
 * - Name attribute for form integration
 *
 * Form Submission Pattern:
 * Uses standard HTML form submission with the name attribute.
 * The selected value is submitted as form data with the specified name.
 *
 * Input.Wrapper Pattern:
 * Always use Input.Wrapper for labels and descriptions in input components.
 * This ensures consistent styling and proper accessibility features.
 *
 * @component
 * @param {ISliderStyleProps} props - Component props
 * @returns {JSX.Element} Rendered Mantine Slider with enhanced configuration
 */
const SliderStyle: React.FC<ISliderStyleProps> = ({ style, styleProps, cssClass }) => {
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
    const required = style.mantine_slider_required?.content === '1';
    const thumbSize = parseFloat((style as any).mantine_slider_thumb_size?.content || '16');
    const styleValue = style.value?.content || '50';

    // New fields
    const showLabelOnHover = style.mantine_slider_show_label?.content === '1';
    const labelsAlwaysOn = style.mantine_slider_labels_always_on?.content === '1';
    const inverted = style.mantine_slider_inverted?.content === '1';

    // Handle CSS field - use direct property from API response
    

    // Build style object
    const styleObj: React.CSSProperties = {};

    // Get form context for pre-populated values
    const formContext = useContext(FormFieldValueContext);
    const formValue = formContext && name ? formContext.getFieldValue(name) : null;

    // Initialize value from form context or style configuration
    const defaultValue = parseFloat(styleValue) || ((min + max) / 2);
    const [value, setValue] = useState<number>(() => {
        if (formValue !== null && typeof formValue === 'string') {
            // Use form value if available and it's a string
            return parseFloat(formValue) || defaultValue;
        }
        // Fallback to style configuration
        return defaultValue;
    });

    // Update value when form context changes (for record editing)
    useEffect(() => {
        if (formValue !== null && typeof formValue === 'string') {
            const parsedValue = parseFloat(formValue);
            if (!isNaN(parsedValue)) {
                setValue(parsedValue);
            }
        }
    }, [formValue]);

    // Parse translatable marks values from JSON
    let customMarks: Array<{ value: number; label: string }> = [];
    try {
        const marksJson = style.mantine_slider_marks_values?.content;
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
        console.warn('Invalid JSON in mantine_slider_marks_values:', error);
        customMarks = [];
    }

    // Generate marks - use custom marks if provided, otherwise use default min/max marks
    const marks = customMarks.length > 0 ? customMarks : [];

    // Handle value change to update local state and register with form
    const handleChange = (newValue: number) => {
        setValue(newValue);
    };

    // Slider component
    const sliderComponent = (
        <Slider
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
            thumbSize={thumbSize}
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
            {...styleProps} className={cssClass}
            style={styleObj}
            required={required}
        >
            {sliderComponent}
        </Input.Wrapper>
    ) : (
         sliderComponent
    );

    return wrappedComponent;
};

export default SliderStyle;
