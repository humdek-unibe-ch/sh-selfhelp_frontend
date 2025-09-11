import React from 'react';
import { TextInput, NumberInput, PasswordInput, Checkbox, ColorInput } from '@mantine/core';
import { getFieldContent, castMantineSize, castMantineRadius } from '../../../../utils/style-field-extractor';
import { IInputStyle } from '../../../../types/common/styles.types';
import IconComponent from '../../shared/common/IconComponent';

/**
 * Props interface for InputStyle component
 */
interface IInputStyleProps {
    style: IInputStyle;
}

/**
 * InputStyle component renders various types of input fields
 * Supports text, number, password, email, date, time, checkbox, color, etc.
 * Uses Mantine UI components for better theming and consistency
 */
const InputStyle: React.FC<IInputStyleProps> = ({ style }) => {
    // Extract field values using the new unified field structure
    const inputType = getFieldContent(style, 'type_input') || 'text';
    const label = getFieldContent(style, 'label');
    const placeholder = getFieldContent(style, 'placeholder');
    const name = getFieldContent(style, 'name');
    const value = getFieldContent(style, 'value');
    const required = getFieldContent(style, 'is_required') === '1';
    const min = getFieldContent(style, 'min');
    const max = getFieldContent(style, 'max');
    const format = getFieldContent(style, 'format');
    const locked = getFieldContent(style, 'locked_after_submit') === '1';
    const size = castMantineSize(getFieldContent(style, 'mantine_size'));
    const radius = castMantineRadius(getFieldContent(style, 'mantine_radius'));
    const variant = getFieldContent(style, 'mantine_variant') || 'default';
    const leftIconName = getFieldContent(style, 'mantine_left_icon');
    const rightIconName = getFieldContent(style, 'mantine_right_icon');
    const disabled = getFieldContent(style, 'disabled') === '1';
    const use_mantine_style = getFieldContent(style, 'use_mantine_style') === '1';

    // Handle CSS field - use direct property from API response
    const cssClass = "section-" + style.id + " " + (style.css ?? '');

    // Build style object
    const styleObj: React.CSSProperties = {};

    // Get icon sections using IconComponent
    const leftSection = leftIconName ? <IconComponent iconName={leftIconName} size={16} /> : undefined;
    const rightSection = rightIconName ? <IconComponent iconName={rightIconName} size={16} /> : undefined;

    // Common props for Mantine inputs
    const commonProps = {
        label,
        placeholder,
        name,
        defaultValue: value,
        required,
        disabled: disabled || locked,
        size,
        radius,
        variant: variant as any,
        leftSection,
        rightSection,
        className: cssClass,
        style: styleObj,
    };

    if (!use_mantine_style) {
        // Fallback to basic HTML inputs when Mantine styling is disabled
        return (
            <input
                type={inputType}
                name={name}
                placeholder={placeholder}
                defaultValue={value}
                required={required}
                disabled={disabled || locked}
                min={min}
                max={max}
                className={cssClass}
                style={styleObj}
            />
        );
    }

    switch (inputType) {
        case 'number':
            return (
                <NumberInput
                    {...commonProps}
                    min={min ? parseInt(min) : undefined}
                    max={max ? parseInt(max) : undefined}
                />
            );

        case 'password':
            return <PasswordInput {...commonProps} />;

        case 'checkbox':
            return (
                <Checkbox
                    label={label}
                    name={name}
                    checked={value === '1'}
                    required={required}
                    disabled={disabled || locked}
                    size={size}
                    className={cssClass}
                    style={styleObj}
                />
            );

        case 'color':
            return (
                <ColorInput
                    {...commonProps}
                    format={format as 'hex' | 'rgb' | 'hsl' | undefined}
                />
            );

        case 'email':
        case 'date':
        case 'time':
        case 'tel':
        case 'url':
        case 'text':
        default:
            return (
                <TextInput
                    {...commonProps}
                    type={inputType}
                    minLength={min ? parseInt(min) : undefined}
                    maxLength={max ? parseInt(max) : undefined}
                    pattern={format}
                />
            );
    }
};

export default InputStyle; 