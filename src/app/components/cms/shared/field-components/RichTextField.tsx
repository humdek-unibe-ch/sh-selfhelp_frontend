'use client';

import React from 'react';
import { MentionEditor } from '../../../shared/mentions';

interface IRichTextFieldProps {
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
}

/**
 * RichTextField Component
 * 
 * A rich text editor with mention support for CMS field editing.
 * Uses the unified MentionEditor component with full rich text features.
 */
export function RichTextField({
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
}: IRichTextFieldProps) {
    const errorMessage = validator ? (validator(value).isValid ? undefined : validator(value).error) : undefined;

    // Create a key that includes dataVariables to force re-mount when variables change
    const editorKey = React.useMemo(() => {
        const variablesHash = dataVariables ? JSON.stringify(Object.values(dataVariables).sort()) : '';
        return `${fieldId}-${variablesHash}`;
    }, [fieldId, dataVariables]);

    return (
        <MentionEditor
            key={editorKey}
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
            singleLineMode={false}
            showToolbar={true}
        />
    );
}
