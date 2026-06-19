/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import React, { useState, useContext } from 'react';
import { Switch, Input } from '@mantine/core';
import { type ISwitchStyle } from '../../../../../../types/common/styles.types';
import { FormFieldValueContext } from '../../FormStyle';
import parse from "html-react-parser";
import { sanitizeHtmlForParsing } from '../../../../../../utils/html-sanitizer.utils';
import { castMantineSize } from '../../../../../../utils/style-field-extractor';

/**
 * Props interface for SwitchStyle component
 */
/**
 * Props interface for ISwitchStyle component
 */
interface ISwitchStyleProps {
    style: ISwitchStyle;
    styleProps: Record<string, string>;
    cssClass: string;
}

/**
 * SwitchStyle component renders a Mantine Switch component for toggle functionality.
 * Supports customizable labels, size, and color with on/off states.
 *
 * @component
 * @param {ISwitchStyleProps} props - Component props
 * @returns {JSX.Element} Rendered Mantine Switch with styled configuration
 */
const SwitchStyle: React.FC<ISwitchStyleProps> = ({ style, styleProps, cssClass }) => {
    // Extract field values using the new unified field structure
    const label = style.label?.content || 'Switch';
    const description = style.description?.content || '';
    const onLabel = style.switch_on_label?.content || 'On';
    const offLabel = style.switch_off_label?.content || 'Off';
    const size = castMantineSize(style.shared_size?.content);
    const color = style.shared_color?.content || 'blue';
    const radius = castMantineSize(style.shared_radius?.content);
    const disabled = style.disabled?.content === '1';
    const name = style.name?.content;
    const value = style.value?.content;
    const isRequired = style.is_required?.content === '1';
    const labelPosition = style.web_label_position?.content || 'top';
    const onValue = style.web_switch_on_value?.content || '1';
    const offValue = style.web_switch_off_value?.content || '0';
    const useInputWrapper = style.web_use_input_wrapper?.content === '1';

    // Get form context for pre-populated values
    const formContext = useContext(FormFieldValueContext);
    const formValue = formContext && name ? formContext.getFieldValue(name) : null;

    // Initialize checked state from form context or style configuration
    const [isChecked, setIsChecked] = useState(() => {
        if (formValue !== null) {
            // Use form value if available
            return formValue === onValue;
        }
        // Fallback to style configuration
        return value === onValue;
    });

    // Keep checked state in sync with the (async) form value via a render-phase
    // update instead of an effect; the sentinel initial runs it on first render
    // too, and prevOnValue mirrors the original [formValue, onValue] deps.
    const [prevFormValue, setPrevFormValue] = useState<unknown>(() => ({}));
    const [prevOnValue, setPrevOnValue] = useState(onValue);
    if (prevFormValue !== formValue || prevOnValue !== onValue) {
        setPrevFormValue(formValue);
        setPrevOnValue(onValue);
        if (formValue !== null) {
            setIsChecked(formValue === onValue);
        }
    }

    // Handle switch change
    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setIsChecked(event.currentTarget.checked);
    };

    // Handle CSS field - use direct property from API response
    

    // Build style object
    const styleObj: React.CSSProperties = {};

    // Create the Switch component
    const switchElement = (
        <Switch
            checked={isChecked}
            onChange={handleChange}
            name="" // Empty name to prevent HTML switch from submitting
            required={isRequired}
            onLabel={onLabel}
            offLabel={offLabel}
            size={size}
            color={color}
            radius={radius}
            disabled={disabled}
            {...styleProps} className={cssClass}
            style={styleObj}
            labelPosition={labelPosition as 'left' | 'right'}
            label={ useInputWrapper ? undefined : label}
            description={useInputWrapper ? undefined : parse(sanitizeHtmlForParsing(description))}
        />
    );

    // Conditionally use Input.Wrapper based on web_use_input_wrapper field
    if (useInputWrapper) {
        return (
            <Input.Wrapper
                label={label}
                description={parse(sanitizeHtmlForParsing(description))}
                required={isRequired}
            >
                <div>
                    {switchElement}
                    {/* Hidden input to ensure form submission captures the value */}
                    <input
                        type="hidden"
                        name={name}
                        value={isChecked ? onValue : offValue}
                    />
                </div>
            </Input.Wrapper>
        );
    }

    return (
        <>
            {switchElement}
            {/* Hidden input to ensure form submission captures the value */}
            <input
                type="hidden"
                name={name}
                value={isChecked ? onValue : offValue}
            />
        </>
    );
};

export default SwitchStyle;
