import React, { useState } from 'react';
import { IInputStyle } from '../../../../types/common/styles.types';

/**
 * Props interface for InputStyle component
 */
/**
 * Props interface for IInputStyle component
 */
interface IInputStyleProps {
    style: IInputStyle;
    cssClass: string;
}

/**
 * InputStyle component renders various types of input fields
 * Supports text, number, password, email, date, time, checkbox, color, etc.
 * Uses Mantine UI components for better theming and consistency
 */
const InputStyle: React.FC<IInputStyleProps> = ({ style, cssClass }) => {
    // Extract field values using the new unified field structure
    const inputType = style.type_input?.content || 'text';
    const placeholder = style.placeholder?.content;
    const name = style.name?.content;
    const initialValue = style.value?.content || '';
    const required = style.is_required?.content === '1';
    const min = style.min?.content;
    const max = style.max?.content;
    const disabled = style.disabled?.content === '1';

    const [value, setValue] = useState(initialValue);

    // Handle CSS field - use direct property from API response
    const onChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setValue(event.target.value);
    };

    return (
        <input
            onChange={onChange}
            type={inputType}
            name={name}
            value={value}
            placeholder={placeholder}
            required={required}
            min={min}
            max={max}
            className={cssClass}
            disabled={disabled}
        />
    );
};

export default InputStyle; 