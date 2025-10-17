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
    const inputRef = useRef<HTMLInputElement>(null);
    const suggestionRef = useRef<HTMLDivElement>(null);
    const variableListRef = useRef<any>(null);

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

            // Update input value
            setInputValue(newValue);
            setShowSuggestions(false);

            // Apply sanitization and call onChange
            const sanitizedValue = sanitize ? sanitize(newValue) : newValue;
            onChange(sanitizedValue);

            // Focus back to input
            setTimeout(() => {
                if (inputRef.current) {
                    inputRef.current.focus();
                }
            }, 0);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (showSuggestions && variableListRef.current) {
            if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter' || e.key === 'Escape') {
                e.preventDefault();
                const result = variableListRef.current.onKeyDown({ event: e });
                if (result) {
                    return;
                }
            }
        }
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
                            position: 'absolute',
                            top: '100%',
                            left: '0',
                            right: '0',
                            zIndex: 20000, // Very high z-index for modal contexts
                            maxHeight: '200px',
                            overflowY: 'auto',
                            background: 'white',
                            border: '1px solid #ccc',
                            borderRadius: '4px',
                            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                        }}
                    >
                        <VariableList
                            ref={variableListRef}
                            items={suggestions}
                            command={handleSuggestionSelect}
                        />
                    </div>
                )}
            </div>
        </Input.Wrapper>
    );
}
