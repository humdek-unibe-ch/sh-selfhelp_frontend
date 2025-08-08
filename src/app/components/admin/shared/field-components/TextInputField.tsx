'use client';

import { TextInput } from '@mantine/core';

interface ITextInputFieldProps {
    fieldId: number;
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    disabled?: boolean;
    validator?: (value: string) => { isValid: boolean; error?: string };
    sanitize?: (value: string) => string;
}

export function TextInputField({
    fieldId,
    value,
    onChange,
    placeholder,
    disabled = false,
    validator,
    sanitize
}: ITextInputFieldProps) {
    const errorMessage = validator ? (validator(value).isValid ? undefined : validator(value).error) : undefined;

    return (
        <TextInput
            key={fieldId}
            placeholder={placeholder || ''}
            value={value}
            onChange={(event) => {
                const inputValue = event.currentTarget.value;
                const nextValue = sanitize ? sanitize(inputValue) : inputValue;
                onChange(nextValue);
            }}
            disabled={disabled}
            error={errorMessage}
        />
    );
}