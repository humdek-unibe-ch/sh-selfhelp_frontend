'use client';

import { TextInput } from '@mantine/core';

interface ITextInputFieldProps {
    fieldId: number;
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    disabled?: boolean;
}

export function TextInputField({
    fieldId,
    value,
    onChange,
    placeholder,
    disabled = false
}: ITextInputFieldProps) {
    return (
        <TextInput
            key={fieldId}
            placeholder={placeholder || ''}
            value={value}
            onChange={(event) => onChange(event.currentTarget.value)}
            disabled={disabled}
        />
    );
}