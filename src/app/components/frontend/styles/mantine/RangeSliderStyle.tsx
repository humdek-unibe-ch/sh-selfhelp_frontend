import React, { useState, useEffect, useContext, useRef } from 'react';
import { RangeSlider, Input } from '@mantine/core';
import { getFieldContent } from '../../../../../utils/style-field-extractor';
import { IRangeSliderStyle } from '../../../../../types/common/styles.types';

/**
 * Form Context for component data registration
 */
interface IFormContext {
    registerField: (fieldName: string, value: any) => void;
    unregisterField: (fieldName: string) => void;
}

const FormContext = React.createContext<IFormContext | null>(null);

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
 * - Controlled input with form integration via hidden inputs
 * - Translatable marks values (display = 1)
 * - Radius configuration
 * - Show label on hover option
 * - Labels always on option
 * - Custom marks from JSON configuration
 * - Label and description support using Input.Wrapper (translatable)
 * - Name attribute for form integration
 *
 * Form Submission Pattern:
 * RangeSlider registers its field values with the FormContext:
 * - `${name}_from`: Contains the minimum value
 * - `${name}_to`: Contains the maximum value
 * No hidden inputs needed - values are registered directly with the form.
 *
 * Name Field Handling:
 * Special handling for name field to prevent "undefined" in form data:
 * - If name field contains "undefined" string, uses fallback `range-slider-${style.id}`
 * - If name field is empty/whitespace, uses fallback `range-slider-${style.id}`
 * - Otherwise uses the provided name value
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
    const label = getFieldContent(style, 'label');
    const description = getFieldContent(style, 'description');
    const name = getFieldContent(style, 'name');
    // Get form context for field registration
    const formContext = useContext(FormContext);
    const min = parseFloat(getFieldContent(style, 'mantine_numeric_min') || '0');
    const max = parseFloat(getFieldContent(style, 'mantine_numeric_max') || '100');
    const step = parseFloat(getFieldContent(style, 'mantine_numeric_step') || '1');
    const withMarks = getFieldContent(style, 'mantine_range_slider_marks') === '1';
    const size = getFieldContent(style, 'mantine_size') || 'sm';
    const color = getFieldContent(style, 'mantine_color') || 'blue';
    const radius = getFieldContent(style, 'mantine_radius') || 'sm';
    const disabled = getFieldContent(style, 'disabled') === '1';
    const styleValue = getFieldContent(style, 'value') || '[0, 100]';

    // New fields
    const showLabelOnHover = getFieldContent(style, 'mantine_range_slider_show_label') === '1';
    const labelsAlwaysOn = getFieldContent(style, 'mantine_range_slider_labels_always_on') === '1';

    // Handle CSS field - use direct property from API response
    const cssClass = "section-" + style.id + " " + (style.css ?? '');

    // Build style object
    const styleObj: React.CSSProperties = {};

    // State for controlled component - default to [min, max] range
    const [value, setValue] = useState<[number, number]>(JSON.parse(styleValue) as [number, number]);

    // Parse translatable marks values from JSON
    let customMarks: Array<{ value: number; label: string }> = [];
    try {
        const marksJson = getFieldContent(style, 'mantine_range_slider_marks_values');
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
    const marks = customMarks.length > 0 ? customMarks : (
        withMarks ? [
            { value: min, label: min.toString() },
            { value: max, label: max.toString() }
        ] : undefined
    );

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
        >
            {rangeSliderComponent}
        </Input.Wrapper>
    ) : (
        <div className={cssClass} style={styleObj}>
            {rangeSliderComponent}
        </div>
    );

    return wrappedComponent;
};

export default RangeSliderStyle;
export { FormContext };
export type { IFormContext };

