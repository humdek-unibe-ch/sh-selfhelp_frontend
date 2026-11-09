/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
'use client';

import { TextInput } from '@mantine/core';
import type { ComponentProps } from 'react';
import { useFieldLabel } from '../../../shared/common/field-label-context';

interface ITextInputFieldProps {
    fieldId: number;
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    inputType?: ComponentProps<typeof TextInput>['type'];
    step?: string | number;
    disabled?: boolean;
    validator?: (value: string) => { isValid: boolean; error?: string };
    sanitize?: (value: string) => string;
}

export function TextInputField({
    fieldId,
    value,
    onChange,
    placeholder,
    inputType = 'text',
    step,
    disabled = false,
    validator,
    sanitize
}: ITextInputFieldProps) {
    const fieldLabel = useFieldLabel();
    const errorMessage = validator ? (validator(value).isValid ? undefined : validator(value).error) : undefined;

    return (
        <TextInput aria-labelledby={fieldLabel?.id}
            key={fieldId}
            type={inputType}
            step={step}
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
