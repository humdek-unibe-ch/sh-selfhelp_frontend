import React, { useState } from 'react';
import { Slider, Input } from '@mantine/core';
import { getFieldContent } from '../../../../../utils/style-field-extractor';
import { ISliderStyle } from '../../../../../types/common/styles.types';

/**
 * Props interface for SliderStyle component
 */
interface ISliderStyleProps {
    style: ISliderStyle;
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
const SliderStyle: React.FC<ISliderStyleProps> = ({ style }) => {
    // Extract field values using the new unified field structure
    const label = getFieldContent(style, 'label');
    const description = getFieldContent(style, 'description');
    const name = getFieldContent(style, 'name');
    // Get form context for field registration
    const min = parseFloat(getFieldContent(style, 'mantine_numeric_min') || '0');
    const max = parseFloat(getFieldContent(style, 'mantine_numeric_max') || '100');
    const step = parseFloat(getFieldContent(style, 'mantine_numeric_step') || '1');
    const size = getFieldContent(style, 'mantine_size') || 'sm';
    const color = getFieldContent(style, 'mantine_color') || 'blue';
    const radius = getFieldContent(style, 'mantine_radius') || 'sm';
    const disabled = getFieldContent(style, 'disabled') === '1';
    const required = getFieldContent(style, 'mantine_slider_required') === '1';
    const thumbSize = parseFloat(getFieldContent(style, 'mantine_slider_thumb_size') || '16');
    const styleValue = getFieldContent(style, 'value') || '50';

    // New fields
    const showLabelOnHover = getFieldContent(style, 'mantine_slider_show_label') === '1';
    const labelsAlwaysOn = getFieldContent(style, 'mantine_slider_labels_always_on') === '1';
    const inverted = getFieldContent(style, 'mantine_slider_inverted') === '1';

    // Handle CSS field - use direct property from API response
    const cssClass = "section-" + style.id + " " + (style.css ?? '');

    // Build style object
    const styleObj: React.CSSProperties = {};

    // State for controlled component - default to min + (max-min)/2
    const defaultValue = parseFloat(styleValue) || ((min + max) / 2);
    const [value, setValue] = useState<number>(defaultValue);

    // Parse translatable marks values from JSON
    let customMarks: Array<{ value: number; label: string }> = [];
    try {
        const marksJson = getFieldContent(style, 'mantine_slider_marks_values');
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

    console.log(style);

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
            description={description}
            className={cssClass}
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
