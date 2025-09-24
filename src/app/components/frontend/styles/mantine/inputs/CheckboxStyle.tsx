import React, { useState, useEffect, useContext } from 'react';
import { Checkbox, Input } from '@mantine/core';
import IconComponent from '../../../../shared/common/IconComponent';
import { ICheckboxStyle } from '../../../../../../types/common/styles.types';
import { FormFieldValueContext } from '../../FormStyle';
import parse from "html-react-parser";
import { sanitizeHtmlForParsing } from '../../../../../../utils/html-sanitizer.utils';
import { castMantineSize, castMantineRadius } from '../../../../../../utils/style-field-extractor';

/**
 * Props interface for ICheckboxStyle component
 */
interface ICheckboxStyleProps {
    style: ICheckboxStyle;
    styleProps: Record<string, any>;
    cssClass: string;
}

const CheckboxStyle: React.FC<ICheckboxStyleProps> = ({ style, styleProps, cssClass }) => {
    // Extract field values using the new unified field structure
    const label = style.label?.content;
    const name = style.name?.content || `section-${style.id}`;
    const value = style.value?.content;
    const checkboxValue = style.checkbox_value?.content || '1';
    const isRequired = style.is_required?.content === '1';
    const disabled = style.disabled?.content === '1';
    const description = style.description?.content || '';

    // Mantine-specific fields
    const size = castMantineSize((style as any).mantine_size?.content);
    const radius = castMantineRadius((style as any).mantine_radius?.content);
    const color = style.mantine_color?.content;
    const iconName = style.mantine_checkbox_icon?.content;
    const labelPosition = style.mantine_checkbox_labelPosition?.content as 'left' | 'right';
    const useInputWrapper = style.mantine_use_input_wrapper?.content === '1';

    // Handle CSS field - use direct property from API response
    

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
            {...styleProps} className={cssClass}
            style={styleObj}
            label={useInputWrapper ? undefined : label}
            description={useInputWrapper ? undefined : parse(sanitizeHtmlForParsing(description))}
        />
    );

    // Conditionally use Input.Wrapper based on mantine_use_input_wrapper field
    if (useInputWrapper) {
        return (
            <Input.Wrapper
                label={label}
                description={parse(sanitizeHtmlForParsing(description))}
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