import React, { useState, useEffect, useContext } from 'react';
import { Switch, Input } from '@mantine/core';
import { getFieldContent, castMantineSize } from '../../../../../../utils/style-field-extractor';
import { ISwitchStyle } from '../../../../../../types/common/styles.types';
import { FormFieldValueContext } from '../../FormStyle';

/**
 * Props interface for SwitchStyle component
 */
interface ISwitchStyleProps {
    style: ISwitchStyle;
}

/**
 * SwitchStyle component renders a Mantine Switch component for toggle functionality.
 * Supports customizable labels, size, and color with on/off states.
 *
 * @component
 * @param {ISwitchStyleProps} props - Component props
 * @returns {JSX.Element} Rendered Mantine Switch with styled configuration
 */
const SwitchStyle: React.FC<ISwitchStyleProps> = ({ style }) => {
    // Extract field values using the new unified field structure
    const label = getFieldContent(style, 'label') || 'Switch';
    const description = getFieldContent(style, 'description');
    const onLabel = getFieldContent(style, 'mantine_switch_on_label') || 'On';
    const offLabel = getFieldContent(style, 'mantine_switch_off_label') || 'Off';
    const size = castMantineSize(getFieldContent(style, 'mantine_size'));
    const color = getFieldContent(style, 'mantine_color') || 'blue';
    const radius = castMantineSize(getFieldContent(style, 'mantine_radius'));
    const disabled = getFieldContent(style, 'disabled') === '1';
    const name = getFieldContent(style, 'name');
    const value = getFieldContent(style, 'value');
    const isRequired = getFieldContent(style, 'is_required') === '1';
    const labelPosition = getFieldContent(style, 'mantine_label_position') || 'top';
    const onValue = getFieldContent(style, 'mantine_switch_on_value') || '1';
    const offValue = getFieldContent(style, 'mantine_switch_off_value') || '0';
    const useInputWrapper = getFieldContent(style, 'mantine_use_input_wrapper') === '1';

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

    // Update checked state when form context changes (for record editing)
    useEffect(() => {
        if (formValue !== null) {
            setIsChecked(formValue === onValue);
        }
    }, [formValue, onValue]);

    // Handle switch change
    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setIsChecked(event.currentTarget.checked);
    };

    // Handle CSS field - use direct property from API response
    const cssClass = "section-" + style.id + " " + (style.css ?? '');

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
            className={cssClass}
            style={styleObj}
            labelPosition={labelPosition as 'left' | 'right'}
            label={ useInputWrapper ? undefined : label}
            description={useInputWrapper ? undefined : description}
        />
    );

    // Conditionally use Input.Wrapper based on mantine_use_input_wrapper field
    if (useInputWrapper) {
        return (
            <Input.Wrapper
                label={label}
                description={description}
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
