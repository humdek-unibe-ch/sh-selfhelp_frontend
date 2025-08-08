'use client';

import { Textarea } from '@mantine/core';

interface ITextareaFieldProps {
    fieldId: number;
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    disabled?: boolean;
    validator?: (value: string) => { isValid: boolean; error?: string };
    sanitize?: (value: string) => string;
}

export function TextareaField({
    fieldId,
    value,
    onChange,
    placeholder,
    disabled = false,
    validator,
    sanitize
}: ITextareaFieldProps) {
    const errorMessage = validator ? (validator(value).isValid ? undefined : validator(value).error) : undefined;
    return (
        <Textarea
            key={fieldId}
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
            error={errorMessage}
        />
    );
}