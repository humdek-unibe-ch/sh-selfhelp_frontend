'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Input } from '@mantine/core';
import { IVariableSuggestion, createTippyMentionHandler, ITippyMentionInstance } from '../../../../../utils/mentions.utils';

interface ITextInputWithMentionsProps {
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
    dataVariables?: Record<string, string>;
    maxVisibleRows?: number;
    maxItems?: number;
}

export function TextInputWithMentions({
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
    dataVariables,
    maxVisibleRows = 5,
    maxItems = 50,
}: ITextInputWithMentionsProps) {
    const [inputValue, setInputValue] = useState(value);
    const [cursorPosition, setCursorPosition] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const mentionHandlerRef = useRef<ITippyMentionInstance | null>(null);

    const errorMessage = validator ? (validator(value).isValid ? undefined : validator(value).error) : undefined;

    // Update internal value when prop changes
    useEffect(() => {
        setInputValue(value);
    }, [value]);

    // Convert dataVariables object to IVariableSuggestion array
    const dataVariablesArray: IVariableSuggestion[] = React.useMemo(() => {
        if (!dataVariables) return [];
        return Object.values(dataVariables).map(variableName => ({
            id: variableName,
            label: variableName,
        }));
    }, [dataVariables]);

    // Convert dataVariables to mention suggestions
    const activeVariables = React.useMemo(() => {
        return dataVariablesArray;
    }, [dataVariablesArray]);

    // Create mention handler
    useEffect(() => {
        const handleSuggestionSelect = (suggestion: IVariableSuggestion) => {
            // Get current input value and cursor position
            const currentValue = inputRef.current?.value || inputValue;
            const currentCursorPos = inputRef.current?.selectionStart || cursorPosition;

            const textBeforeCursor = currentValue.substring(0, currentCursorPos);

            // Find the {{ trigger and replace it with the selected variable
            const mentionMatch = textBeforeCursor.match(/\{\{[^}]*$/);
            if (mentionMatch) {
                const beforeMention = textBeforeCursor.substring(0, mentionMatch.index);
                const textAfterCursor = currentValue.substring(currentCursorPos);
                const newValue = beforeMention + `{{${suggestion.label}}}` + textAfterCursor;

                // Update input value
                setInputValue(newValue);

                // Apply sanitization and call onChange
                const sanitizedValue = sanitize ? sanitize(newValue) : newValue;
                onChange(sanitizedValue);

                // Focus back to input and position cursor after the inserted variable
                setTimeout(() => {
                    if (inputRef.current) {
                        inputRef.current.focus();
                        // Position cursor after the inserted variable (always after the second })
                        const newCursorPos = beforeMention.length + `{{${suggestion.label}}`.length;
                        inputRef.current.setSelectionRange(newCursorPos, newCursorPos);
                        setCursorPosition(newCursorPos);
                    }
                }, 0);
            }

            // The input change handler will hide the popup when it detects no more {{ trigger
        };

        mentionHandlerRef.current = createTippyMentionHandler(
            activeVariables,
            handleSuggestionSelect,
            maxVisibleRows,
            maxItems
        );

        return () => {
            mentionHandlerRef.current?.destroy();
        };
    }, [activeVariables, maxVisibleRows, maxItems, sanitize, onChange]);

    // Handle clicks outside to hide popup
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                mentionHandlerRef.current?.hide();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value;
        let cursorPos = e.target.selectionStart || 0;

        // Ensure cursor is at the end when typing {{
        if (newValue.endsWith('{{') && cursorPos >= 2) {
            cursorPos = newValue.length; // Force cursor to end
        }

        setInputValue(newValue);
        setCursorPosition(cursorPos);

        // Check for mention trigger
        const textBeforeCursor = newValue.substring(0, cursorPos);
        const mentionMatch = textBeforeCursor.match(/\{\{([^}]*)$/);

        if (mentionMatch && inputRef.current) {
            const query = mentionMatch[1];
            let filteredSuggestions: IVariableSuggestion[];

            if (query.length > 0) {
                // After typing a letter, show all matching suggestions (up to maxItems)
                filteredSuggestions = activeVariables.filter(variable =>
                    variable.label.toLowerCase().includes(query.toLowerCase())
                ).slice(0, maxItems);
            } else {
                // When just {{ is typed, show all available suggestions (up to maxItems)
                filteredSuggestions = activeVariables.slice(0, maxItems);
            }

            if (filteredSuggestions.length > 0) {
                // Ensure input processing is complete before showing popup
                setTimeout(() => {
                    if (inputRef.current) {
                        // Calculate cursor position for more precise popup placement
                        const inputRect = inputRef.current.getBoundingClientRect();
                        const inputStyle = window.getComputedStyle(inputRef.current);
                        const paddingLeft = parseInt(inputStyle.paddingLeft) || 0;
                        const fontSize = parseInt(inputStyle.fontSize) || 14;
                        const charWidth = fontSize * 0.6; // Approximate character width

                        // Position popup at cursor location (like rich text editor)
                        const cursorX = inputRect.left + paddingLeft + (cursorPos * charWidth);
                        const cursorY = inputRect.bottom;

                        mentionHandlerRef.current?.show(inputRef.current, () => ({
                            left: cursorX,
                            top: cursorY,
                            right: cursorX,
                            bottom: cursorY,
                            width: 0,
                            height: 0,
                            x: cursorX,
                            y: cursorY,
                            toJSON() { return {}; },
                        }), filteredSuggestions);
                    }
                }, 0);
            } else {
                mentionHandlerRef.current?.hide();
            }
        } else {
            mentionHandlerRef.current?.hide();
        }

        // Apply sanitization and call onChange
        const sanitizedValue = sanitize ? sanitize(newValue) : newValue;
        onChange(sanitizedValue);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (mentionHandlerRef.current) {
            // Let the mention handler handle the key events
            const handled = mentionHandlerRef.current.handleKeyDown(e.nativeEvent);
            if (handled) {
                e.preventDefault();
                e.stopPropagation();
            }
        }
    };


    return (
        <Input.Wrapper
            label={label}
            description={description}
            required={required}
            error={errorMessage}
        >
            <div ref={containerRef}>
                <Input
                    ref={inputRef}
                    value={inputValue}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder || 'Start typing...'}
                    disabled={disabled}
                    style={{ width: '100%' }}
                />
            </div>
        </Input.Wrapper>
    );
}
