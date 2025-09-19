import React, { useState, useEffect, useContext } from 'react';
import { Checkbox, Input } from '@mantine/core';
import { getFieldContent, castMantineSize, castMantineRadius } from '../../../../../../utils/style-field-extractor';
import IconComponent from '../../../../shared/common/IconComponent';
import { ICheckboxStyle } from '../../../../../../types/common/styles.types';
import { FormFieldValueContext } from '../../FormStyle';

interface ICheckboxStyleProps {
    style: ICheckboxStyle;
}

const CheckboxStyle: React.FC<ICheckboxStyleProps> = ({ style }) => {
    // Extract field values using the new unified field structure
    const label = getFieldContent(style, 'label');
    const name = getFieldContent(style, 'name') || `section-${style.id}`;
    const value = getFieldContent(style, 'value');
    const checkboxValue = getFieldContent(style, 'checkbox_value') || '1';
    const isRequired = getFieldContent(style, 'is_required') === '1';
    const disabled = getFieldContent(style, 'disabled') === '1';
    const description = getFieldContent(style, 'description');

    // Mantine-specific fields
    const size = castMantineSize(getFieldContent(style, 'mantine_size'));
    const radius = castMantineRadius(getFieldContent(style, 'mantine_radius'));
    const color = getFieldContent(style, 'mantine_color');
    const iconName = getFieldContent(style, 'mantine_checkbox_icon');
    const labelPosition = getFieldContent(style, 'mantine_checkbox_labelPosition') as 'left' | 'right';
    const useInputWrapper = getFieldContent(style, 'mantine_use_input_wrapper') === '1';

    // Handle CSS field - use direct property from API response
    const cssClass = "section-" + style.id + " " + (style.css ?? '');

    // Get icon component if specified
    const icon = iconName ? ({ indeterminate, className }: { indeterminate: boolean | undefined; className: string }) =>
        <span className={className}><IconComponent iconName={iconName} size={16} /></span> : undefined;

    // Build style object for wrapper props
    const styleObj: React.CSSProperties = {};

    // Get form context for pre-populated values
    const formContext = useContext(FormFieldValueContext);
    const formValue = formContext && name ? formContext.getFieldValue(name) : null;

    // Initialize checked state from form context or style configuration
    const [isChecked, setIsChecked] = useState(() => {
        if (formValue !== null) {
            // Use form value if available
            return formValue === checkboxValue || (formValue === '1' && checkboxValue === '1');
        }
        // Fallback to style configuration
        return value === checkboxValue;
    });

    // Update checked state when form context changes (for record editing)
    useEffect(() => {
        if (formValue !== null) {
            const shouldBeChecked = formValue === checkboxValue || (formValue === '1' && checkboxValue === '1');
            setIsChecked(shouldBeChecked);
        }
    }, [formValue, checkboxValue]);

    // Handle checkbox change
    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setIsChecked(event.currentTarget.checked);
    };

    // Determine the current value based on checked state for form submission
    const currentValue = isChecked ? checkboxValue : '';

    // Create the Checkbox component
    const checkboxElement = (
        <Checkbox
            checked={isChecked}
            onChange={handleChange}
            name="" // Empty name to prevent HTML checkbox from submitting
            required={isRequired}
            disabled={disabled}
            size={size}
            radius={radius === 'none' ? 0 : radius}
            color={color}
            icon={icon}
            labelPosition={labelPosition}
            className={cssClass}
            style={styleObj}
            label={useInputWrapper ? undefined : label}
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
                    {checkboxElement}
                    {/* Hidden input to ensure form submission captures the value */}
                    <input
                        type="hidden"
                        name={name}
                        value={currentValue}
                    />
                </div>
            </Input.Wrapper>
        );
    }

    return checkboxElement;

};

export default CheckboxStyle; 