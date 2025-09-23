import React from 'react';
import { TextInput, NumberInput, PasswordInput, Checkbox, ColorInput } from '@mantine/core';
import { IInputStyle } from '../../../../types/common/styles.types';
import IconComponent from '../../shared/common/IconComponent';
import { castMantineSize, castMantineRadius } from '../../../../utils/style-field-extractor';

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
    const inputType = style.type_input?.content || 'text';
    const label = style.label?.content;
    const placeholder = style.placeholder?.content;
    const name = style.name?.content;
    const value = style.value?.content;
    const required = style.is_required?.content === '1';
    const min = style.min?.content;
    const max = style.max?.content;
    const format = style.format?.content;
    const locked = style.locked_after_submit?.content === '1';
    const size = castMantineSize((style as any).mantine_size?.content);
    const radius = castMantineRadius((style as any).mantine_radius?.content);
    const variant = (style as any).mantine_variant?.content || 'default';
    const leftIconName = (style as any).mantine_left_icon?.content;
    const rightIconName = (style as any).mantine_right_icon?.content;
    const disabled = (style as any).disabled?.content === '1';
    const use_mantine_style = (style as any).use_mantine_style?.content === '1';

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