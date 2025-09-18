'use client';

import { Textarea, Input } from '@mantine/core';

interface ITextareaFieldProps {
    fieldId: number;
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    disabled?: boolean;
    validator?: (value: string) => { isValid: boolean; error?: string };
    sanitize?: (value: string) => string;
    label?: string;
    description?: string;
    required?: boolean;
    useMantineStyle?: boolean;
}

export function TextareaField({
    fieldId,
    value,
    onChange,
    placeholder,
    disabled = false,
    validator,
    sanitize,
    label,
    description,
    required = false,
    useMantineStyle = true
}: ITextareaFieldProps) {
    const errorMessage = validator ? (validator(value).isValid ? undefined : validator(value).error) : undefined;

    // Use Mantine styling with Input.Wrapper when enabled
    if (useMantineStyle) {
        return (
            <Input.Wrapper
                key={fieldId}
                label={label}
                description={description}
                required={required}
                error={errorMessage}
            >
                <Textarea
                    placeholder={placeholder || ''}
                    value={value}
                    onChange={(event) => {
                        const inputValue = event.currentTarget.value;
                        const nextValue = sanitize ? sanitize(inputValue) : inputValue;
                        onChange(nextValue);
                    }}
                    disabled={disabled}
                    autosize
                    minRows={3}
                    maxRows={8}
                />
            </Input.Wrapper>
        );
    }

    // Fallback: Use regular textarea without Mantine styling
    return (
        <div key={fieldId} className="textarea-field-fallback">
            {label && (
                <label className="block text-sm font-medium mb-1">
                    {label}
                    {required && <span className="text-red-500 ml-1">*</span>}
                </label>
            )}
            <textarea
                className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'
                } ${errorMessage ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''}`}
                placeholder={placeholder || ''}
                value={value}
                onChange={(event) => {
                    const inputValue = event.currentTarget.value;
                    const nextValue = sanitize ? sanitize(inputValue) : inputValue;
                    onChange(nextValue);
                }}
                disabled={disabled}
                rows={3}
                style={{ resize: 'vertical', minHeight: '80px', maxHeight: '200px' }}
            />
            {description && (
                <p className="mt-1 text-sm text-gray-600">{description}</p>
            )}
            {errorMessage && (
                <p className="mt-1 text-sm text-red-600">{errorMessage}</p>
            )}
        </div>
    );
}