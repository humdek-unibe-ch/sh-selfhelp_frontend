import React, { useState, useContext, useEffect } from 'react';
import { IInputStyle } from '../../../../types/common/styles.types';
import { FormFieldValueContext } from './FormStyle';
import LanguageTabsWrapper from './shared/LanguageTabsWrapper';

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
    const translatable = style.translatable?.content === '1';

    // Get form context for pre-populated values
    const formContext = useContext(FormFieldValueContext);
    const formValue = formContext && name ? formContext.getFieldValue(name) : null;

    // Use form value if available, otherwise use initial value from style
    const [value, setValue] = useState<string | Array<{ language_id: number; value: string }> | null>(formValue || initialValue);

    // Update value when form context changes (for record editing)
    useEffect(() => {
        if (formValue !== null) {
            setValue(formValue);
        }
    }, [formValue]);

    // Handle value change - for LanguageTabsWrapper
    const handleValueChange = (fieldName: string, newValue: string | Array<{ language_id: number; value: string }> | null) => {
        // Update local state
        setValue(newValue);
        // The LanguageTabsWrapper handles the actual form submission via hidden inputs
    };

    // Render input for a specific language
    const renderInput = (language: any, currentValue: string, onValueChange: (value: string) => void) => {
        // For checkboxes, use checked instead of value
        const checkboxProps = inputType === 'checkbox' ? {
            checked: currentValue === '1',
            value: undefined
        } : {
            value: currentValue,
            checked: undefined
        };

        const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
            if (inputType === 'checkbox') {
                onValueChange(event.target.checked ? '1' : '0');
            } else {
                onValueChange(event.target.value);
            }
        };

        return (
            <input
                onChange={handleChange}
                type={inputType}
                name={translatable ? undefined : name} // Don't set name for translatable fields - handled by wrapper
                placeholder={placeholder}
                required={required}
                min={min}
                max={max}
                className={translatable ? undefined : cssClass}
                disabled={disabled}
                {...checkboxProps}
            />
        );
    };

    return (
        <LanguageTabsWrapper
            translatable={translatable}
            name={name || ''}
            value={value}
            onChange={handleValueChange}
            className={translatable ? cssClass : undefined}
        >
            {renderInput}
        </LanguageTabsWrapper>
    );
};

export default InputStyle; 