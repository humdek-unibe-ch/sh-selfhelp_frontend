'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Input } from '@mantine/core';
import { IVariableSuggestion, VariableList, DEFAULT_VARIABLES } from '../../../../../utils/mentions.utils';

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
    variables?: IVariableSuggestion[];
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
    variables,
}: ITextInputWithMentionsProps) {
    const [inputValue, setInputValue] = useState(value);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [suggestions, setSuggestions] = useState<IVariableSuggestion[]>([]);
    const [cursorPosition, setCursorPosition] = useState(0);
    const [suggestionPosition, setSuggestionPosition] = useState({ top: 0, left: 0 });
    const inputRef = useRef<HTMLInputElement>(null);
    const suggestionRef = useRef<HTMLDivElement>(null);

    const errorMessage = validator ? (validator(value).isValid ? undefined : validator(value).error) : undefined;

    // Update internal value when prop changes
    useEffect(() => {
        setInputValue(value);
    }, [value]);

    const activeVariables = variables && variables.length > 0 ? variables : DEFAULT_VARIABLES;

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value;
        const cursorPos = e.target.selectionStart || 0;

        setInputValue(newValue);
        setCursorPosition(cursorPos);

        // Check for mention trigger
        const textBeforeCursor = newValue.substring(0, cursorPos);
        const mentionMatch = textBeforeCursor.match(/\{\{([^}]*)$/);

        if (mentionMatch) {
            const query = mentionMatch[1];
            const filteredSuggestions = activeVariables.filter(variable =>
                variable.label.toLowerCase().includes(query.toLowerCase())
            ).slice(0, 5);

            if (filteredSuggestions.length > 0) {
                setSuggestions(filteredSuggestions);
                setShowSuggestions(true);

                // Calculate position for suggestions
                if (inputRef.current) {
                    const inputRect = inputRef.current.getBoundingClientRect();
                    const cursorX = getCursorPosition(inputRef.current, cursorPos);
                    setSuggestionPosition({
                        top: inputRect.bottom + 4,
                        left: inputRect.left + cursorX,
                    });
                }
            } else {
                setShowSuggestions(false);
            }
        } else {
            setShowSuggestions(false);
        }

        // Apply sanitization and call onChange
        const sanitizedValue = sanitize ? sanitize(newValue) : newValue;
        onChange(sanitizedValue);
    };

    const handleSuggestionSelect = (suggestion: IVariableSuggestion) => {
        const textBeforeCursor = inputValue.substring(0, cursorPosition);
        const textAfterCursor = inputValue.substring(cursorPosition);

        // Find the {{ trigger and replace it with the selected variable
        const mentionMatch = textBeforeCursor.match(/\{\{[^}]*$/);
        if (mentionMatch) {
            const beforeMention = textBeforeCursor.substring(0, mentionMatch.index);
            const newValue = beforeMention + `{{${suggestion.label}}}` + textAfterCursor;

            setInputValue(newValue);
            setShowSuggestions(false);

            // Apply sanitization and call onChange
            const sanitizedValue = sanitize ? sanitize(newValue) : newValue;
            onChange(sanitizedValue);

            // Focus back to input and set cursor position
            setTimeout(() => {
                if (inputRef.current) {
                    inputRef.current.focus();
                    const newCursorPos = beforeMention.length + `{{${suggestion.label}}}`.length;
                    inputRef.current.setSelectionRange(newCursorPos, newCursorPos);
                }
            }, 0);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (showSuggestions) {
            if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter' || e.key === 'Escape') {
                e.preventDefault();
                // Handle in suggestion component
                return;
            }
        }
    };

    // Helper function to get cursor position in pixels
    const getCursorPosition = (input: HTMLInputElement, position: number): number => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return 0;

        const computedStyle = window.getComputedStyle(input);
        ctx.font = `${computedStyle.fontSize} ${computedStyle.fontFamily}`;

        const textBeforeCursor = input.value.substring(0, position);
        return ctx.measureText(textBeforeCursor).width;
    };

    return (
        <Input.Wrapper
            key={fieldId}
            label={label}
            description={description}
            required={required}
            error={errorMessage}
        >
            <div style={{ position: 'relative' }}>
                <Input
                    ref={inputRef}
                    value={inputValue}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder || 'Start typing...'}
                    disabled={disabled}
                    style={{ width: '100%' }}
                />

                {showSuggestions && (
                    <div
                        ref={suggestionRef}
                        style={{
                            position: 'fixed',
                            top: suggestionPosition.top,
                            left: suggestionPosition.left,
                            zIndex: 1000,
                        }}
                    >
                        <VariableList
                            items={suggestions}
                            command={handleSuggestionSelect}
                        />
                    </div>
                )}
            </div>
        </Input.Wrapper>
    );
}
