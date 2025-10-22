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
    /** If true, enables rich text formatting shortcuts (bold, italic, underline) in single-line mode */
    enableRichTextShortcuts?: boolean;
}

/**
 * TextInputWithMentions Component
 *
 * A single-line text input with mention support for CMS field editing.
 * Uses the unified MentionEditor component in single-line mode.
 * When enableRichTextShortcuts is true, supports formatting shortcuts (bold, italic, underline)
 * while maintaining the appearance of a simple text input.
 * Behaves like a standard Mantine Input but with mention and optional rich text functionality.
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
    enableRichTextShortcuts = false,
}: ITextInputWithMentionsProps) {
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
            singleLineMode={true}
            showToolbar={false}
            autoFocus={autoFocus}
            onKeyDown={onKeyDown}
            enableRichTextShortcuts={enableRichTextShortcuts}
        />
    );
}
