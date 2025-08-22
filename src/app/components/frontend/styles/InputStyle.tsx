import React from 'react';
import { TextInput, NumberInput, PasswordInput, Checkbox, ColorInput } from '@mantine/core';
import { IInputStyle } from '../../../../types/common/styles.types';

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

    // Common props for all input types
    const commonProps = {
        label,
        placeholder,
        name,
        defaultValue: value,
        required,
        disabled: locked,
        className: style.css || '',
        size: 'md' as const,
    };

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
                    defaultChecked={value === '1'}
                    required={required}
                    disabled={locked}
                    className={style.css || ''}
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