/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
'use client';

import React from 'react';
import { Group, Text, Kbd } from '@mantine/core';
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
    autoFocus = false,
    onKeyDown,
    enableRichTextShortcuts = false,
}: ITextInputWithMentionsProps) {
    const errorMessage = validator ? (validator(value).isValid ? undefined : validator(value).error) : undefined;

    // Handle onChange with automatic trimming to prevent trailing spaces
    // This solves the space issue globally for all uses of this component
    const handleChange = (newValue: string) => {
        // Trim leading and trailing spaces but preserve middle spaces
        const trimmedValue = newValue.trim();
        onChange(trimmedValue);
    };

    // Note: MentionEditor internally handles dataVariables changes through its memoized extensions
    // No need to force re-mount with key changes - that would be more expensive and lose state

    return (
        <>
            {enableRichTextShortcuts && !disabled && (
                <Group gap={6} mb={4} wrap="nowrap" align="center" aria-hidden>
                    <Text size="xs" c="dimmed">Rich text:</Text>
                    <Kbd size="xs">Ctrl/⌘ B</Kbd>
                    <Kbd size="xs">I</Kbd>
                    <Kbd size="xs">U</Kbd>
                </Group>
            )}
            <MentionEditor
                value={value}
                onChange={handleChange}
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
        </>
    );
}
