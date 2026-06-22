/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import React, { useState, useContext } from 'react';
import { Slider, Input } from '@mantine/core';
import { type ISliderStyle } from '../../../../../../types/common/styles.types';
import { FormFieldValueContext } from '../../FormStyle';
import parse from "html-react-parser";
import { sanitizeHtmlForParsing } from '../../../../../../utils/html-sanitizer.utils';
import DOMPurify from 'isomorphic-dompurify';

/**
 * Props interface for SliderStyle component
 */
/**
 * Props interface for ISliderStyle component
 */
interface ISliderStyleProps {
    style: ISliderStyle;
    styleProps: Record<string, string>;
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
    const min = parseFloat(style.web_numeric_min?.content || '0');
    const max = parseFloat(style.web_numeric_max?.content || '100');
    const step = parseFloat(style.web_numeric_step?.content || '1');
    const size = style.shared_size?.content || 'sm';
    const color = style.shared_color?.content || 'blue';
    const radius = style.shared_radius?.content || 'sm';
    const disabled = style.disabled?.content === '1';
    const required = style.web_slider_required?.content === '1';
    const thumbSize = parseFloat(style.web_slider_thumb_size?.content || '16');
    const styleValue = style.value?.content || '50';

    // New fields
    const showLabelOnHover = style.web_slider_show_label?.content === '1';
    const labelsAlwaysOn = style.web_slider_labels_always_on?.content === '1';
    const inverted = style.web_slider_inverted?.content === '1';

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

    // Keep state in sync with the (async) form value via a render-phase update
    // instead of an effect; the sentinel initial runs it on first render too.
    const [prevFormValue, setPrevFormValue] = useState<unknown>(() => ({}));
    if (prevFormValue !== formValue) {
        setPrevFormValue(formValue);
        if (formValue !== null && typeof formValue === 'string') {
            const parsedValue = parseFloat(formValue);
            if (!isNaN(parsedValue)) {
                setValue(parsedValue);
            }
        }
    }

    // Parse translatable marks values from JSON
    let customMarks: Array<{ value: number; label: string }> = [];
    try {
        const marksJson = style.slider_marks_values?.content;
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
        console.warn('Invalid JSON in slider_marks_values:', error);
        customMarks = [];
    }

    // Generate marks - use custom marks if provided, otherwise use default min/max marks
    const marks = customMarks.length > 0 ? customMarks : [];

    // Handle value change to update local state and register with form
    const handleChange = (newValue: number) => {
        setValue(newValue);
    };

    // When there is no label/description wrapper, the Slider itself is the root
    // element, so it must carry the section css class + spacing (otherwise the
    // `css`/`css_mobile` escape hatch and spacing silently do nothing on a
    // label-less slider). With a wrapper, those live on the Input.Wrapper below.
    const hasWrapper = Boolean(label || description);

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
            {...(hasWrapper ? {} : { ...styleProps, className: cssClass })}
        />
    );

    // Wrap component with label or description if present
    const wrappedComponent = hasWrapper ? (
        <Input.Wrapper
            label={ DOMPurify.sanitize(label || '', { ALLOWED_TAGS: [] })}
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
