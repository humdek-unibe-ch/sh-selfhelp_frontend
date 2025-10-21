'use client';

import React from 'react';
import { MentionEditor } from '../../../shared/mentions';

interface ITextInputWithMentionsProps {
    fieldId: number;
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    disabled?: boolean;
    validator?: (value: string) => { isValid: boolean; error?: string };
    label?: string;
    description?: string;
    required?: boolean;
    dataVariables?: Record<string, string>;
    maxVisibleRows?: number;
    maxItems?: number;
    autoFocus?: boolean;
    onKeyDown?: (event: React.KeyboardEvent) => void;
}

/**
 * TextInputWithMentions Component
 * 
 * A single-line text input with mention support for CMS field editing.
 * Uses the unified MentionEditor component in single-line mode (no rich text, no HTML).
 * Behaves like a standard Mantine Input but with mention functionality.
 */
export function TextInputWithMentions({
    fieldId,
    value,
    onChange,
    placeholder,
    disabled = false,
    validator,
    label,
    description,
    required = false,
    dataVariables,
    maxVisibleRows = 5,
    maxItems = 50,
    autoFocus = true,
    onKeyDown,
}: ITextInputWithMentionsProps) {
    const errorMessage = validator ? (validator(value).isValid ? undefined : validator(value).error) : undefined;

    return (
        <MentionEditor
            key={fieldId}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            disabled={disabled}
            label={label}
            description={description}
            required={required}
            error={errorMessage}
            dataVariables={dataVariables}
            maxVisibleRows={maxVisibleRows}
            maxItems={maxItems}
            singleLineMode={true}
            showToolbar={false}
            autoFocus={autoFocus}
            onKeyDown={onKeyDown}
        />
    );
}
