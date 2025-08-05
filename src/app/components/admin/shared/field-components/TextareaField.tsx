'use client';

import { Textarea } from '@mantine/core';

interface ITextareaFieldProps {
    fieldId: number;
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    disabled?: boolean;
}

export function TextareaField({
    fieldId,
    value,
    onChange,
    placeholder,
    disabled = false
}: ITextareaFieldProps) {
    return (
        <Textarea
            key={fieldId}
            placeholder={placeholder || ''}
            value={value}
            onChange={(event) => onChange(event.currentTarget.value)}
            disabled={disabled}
            autosize
            minRows={3}
            maxRows={8}
        />
    );
}