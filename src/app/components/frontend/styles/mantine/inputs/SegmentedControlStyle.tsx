/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import React, { useState, useContext } from 'react';
import { SegmentedControl, Input } from '@mantine/core';
import { type ISegmentedControlStyle } from '../../../../../../types/common/styles.types';
import { FormFieldValueContext } from '../../FormStyle';
import parse from "html-react-parser";
import { sanitizeHtmlForParsing } from '../../../../../../utils/html-sanitizer.utils';

/**
 * Props interface for SegmentedControlStyle component
 */
/**
 * Props interface for ISegmentedControlStyle component
 */
interface ISegmentedControlStyleProps {
    style: ISegmentedControlStyle;
    styleProps: Record<string, string>;
    cssClass: string;
}

/**
 * SegmentedControlStyle component renders a Mantine SegmentedControl component.
 * Supports horizontal/vertical orientation and multiple options from JSON data.
 *
 * @component
 * @param {ISegmentedControlStyleProps} props - Component props
 * @returns {JSX.Element} Rendered Mantine SegmentedControl with styled configuration
 */
const SegmentedControlStyle: React.FC<ISegmentedControlStyleProps> = ({ style, styleProps, cssClass }) => {
    // Extract field values using the new unified field structure
    const orientation = style.shared_orientation?.content || 'horizontal';
    const size = style.shared_size?.content || 'sm';
    const radius = style.shared_radius?.content || 'sm';
    const color = style.shared_color?.content || 'blue';
    const fullWidth = style.fullwidth?.content === '1';
    const disabled = style.disabled?.content === '1';
    const readonly = style.readonly?.content === '1';
    const name = style.name?.content;
    const label = style.label?.content;
    const description = style.description?.content || '';
    const styleValue = style.value?.content;
    const itemBorder = style.web_segmented_control_item_border?.content === '1';
    const isRequired = style.is_required?.content === '1';

    // Get form context for pre-populated values
    const formContext = useContext(FormFieldValueContext);
    const formValue = formContext && name ? formContext.getFieldValue(name) : null;

    // Initialize selected value from form context or style configuration
    const [selectedValue, setSelectedValue] = useState<string>(() => {
        return (formValue && typeof formValue === 'string') ? formValue : (styleValue || '');
    });

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
    const handleValueChange = (value: string) => {
        setSelectedValue(value);
    };

    // Handle CSS field - use direct property from API response
    

    // Build style object
    const styleObj: React.CSSProperties = {};

    // Parse segmented control data from JSON textarea
    let controlData: Array<{ value: string; label: string }> = [];
    try {
        const dataJson = style.segmented_control_data?.content;
        if (dataJson) {
            controlData = JSON.parse(dataJson);
        } else {
            // Default data if none provided
            controlData = [
                { value: 'option1', label: 'Option 1' },
                { value: 'option2', label: 'Option 2' },
                { value: 'option3', label: 'Option 3' }
            ];
        }
    } catch (error) {
        console.warn('Invalid JSON in segmented_control_data:', error);
        controlData = [];
    }

    // Create SegmentedControl component
    const segmentedControl = (
        <SegmentedControl
            data={controlData}
            orientation={orientation as 'horizontal' | 'vertical'}
            size={size as React.ComponentProps<typeof SegmentedControl>['size']}
            radius={radius === 'none' ? 0 : radius}
            color={color}
            fullWidth={fullWidth}
            disabled={disabled}
            readOnly={readonly}
            {...styleProps} className={cssClass}
            style={styleObj}
            name={name}
            value={selectedValue}
            onChange={handleValueChange}
            withItemsBorders={itemBorder}
        />
    );

    // Wrap with Input.Wrapper if label or description are provided
    if (label || description) {
        return (
            <Input.Wrapper
                label={label}
                description={parse(sanitizeHtmlForParsing(description))}
                required={isRequired}
                {...styleProps} className={cssClass}
            >
                {segmentedControl}
            </Input.Wrapper>
        );
    }

    return segmentedControl;
};

export default SegmentedControlStyle;

