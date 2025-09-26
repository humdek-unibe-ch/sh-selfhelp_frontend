import React, { useState, useContext, useEffect } from 'react';
import { IInputStyle } from '../../../../types/common/styles.types';
import { FormFieldValueContext } from './FormStyle';

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

    // Get form context for pre-populated values
    const formContext = useContext(FormFieldValueContext);
    const formValue = formContext && name ? formContext.getFieldValue(name) : null;

    // Use form value if available, otherwise use initial value from style
    const [value, setValue] = useState(formValue || initialValue);

    // Update value when form context changes (for record editing)
    useEffect(() => {
        if (formValue !== null) {
            setValue(formValue);
        }
    }, [formValue]);

    // Handle CSS field - use direct property from API response
    const onChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (inputType === 'checkbox') {
            setValue(event.target.checked ? '1' : '0');
        } else {
            setValue(event.target.value);
        }
    };

    // For checkboxes, use checked instead of value
    const checkboxProps = inputType === 'checkbox' ? {
        checked: value === '1',
        value: undefined
    } : {
        value: value,
        checked: undefined
    };

    return (
        <input
            onChange={onChange}
            type={inputType}
            name={name}
            placeholder={placeholder}
            required={required}
            min={min}
            max={max}
            className={cssClass}
            disabled={disabled}
            {...checkboxProps}
        />
    );
};

export default InputStyle; 