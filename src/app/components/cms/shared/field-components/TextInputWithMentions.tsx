'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Input } from '@mantine/core';
import { IVariableSuggestion, VariableList, VariableSuggestionsPopup } from '../../../../../utils/mentions.utils';

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
    variables,
    dataVariables,
    maxVisibleRows = 5,
    maxItems = 50,
}: ITextInputWithMentionsProps) {
    const [inputValue, setInputValue] = useState(value);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [suggestions, setSuggestions] = useState<IVariableSuggestion[]>([]);
    const [cursorPosition, setCursorPosition] = useState(0);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);
    const suggestionRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const errorMessage = validator ? (validator(value).isValid ? undefined : validator(value).error) : undefined;

    // Update internal value when prop changes
    useEffect(() => {
        setInputValue(value);
    }, [value]);

    // Reset selected index when suggestions change
    useEffect(() => {
        setSelectedIndex(0);
    }, [suggestions]);

    // Reset suggestions state when popup is hidden
    useEffect(() => {
        if (!showSuggestions) {
            setSuggestions([]);
            setSelectedIndex(0);
        }
    }, [showSuggestions]);

    // Handle clicks outside to hide popup
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setShowSuggestions(false);
            }
        };

        if (showSuggestions) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showSuggestions]);

    // Convert dataVariables object to IVariableSuggestion array
    const dataVariablesArray: IVariableSuggestion[] = React.useMemo(() => {
        if (!dataVariables) return [];
        return Object.values(dataVariables).map(variableName => ({
            id: variableName,
            label: variableName,
        }));
    }, [dataVariables]);

    // Combine all available variables: custom variables, then data variables from section context
    const activeVariables = React.useMemo(() => {
        const allVariables: IVariableSuggestion[] = [];

        // Add custom variables first (highest priority)
        if (variables && variables.length > 0) {
            allVariables.push(...variables);
        }

        // Add data variables from section API
        if (dataVariablesArray.length > 0) {
            allVariables.push(...dataVariablesArray);
        }

        // Remove duplicates based on label
        const uniqueVariables = allVariables.filter((variable, index, self) =>
            index === self.findIndex(v => v.label === variable.label)
        );

        return uniqueVariables;
    }, [variables, dataVariablesArray]);

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
        if (showSuggestions && suggestions.length > 0) {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSelectedIndex((prevIndex) =>
                    prevIndex < suggestions.length - 1 ? prevIndex + 1 : 0
                );
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSelectedIndex((prevIndex) =>
                    prevIndex > 0 ? prevIndex - 1 : suggestions.length - 1
                );
            } else if (e.key === 'Enter') {
                e.preventDefault();
                if (suggestions[selectedIndex]) {
                    handleSuggestionSelect(suggestions[selectedIndex]);
                }
            } else if (e.key === 'Escape') {
                e.preventDefault();
                setShowSuggestions(false);
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
            <div ref={containerRef} style={{ position: 'relative' }}>
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
                    <VariableSuggestionsPopup
                        suggestions={suggestions}
                        selectedIndex={selectedIndex}
                        maxVisibleRows={maxVisibleRows}
                        maxItems={maxItems}
                        onSelect={handleSuggestionSelect}
                        useAbsolutePositioning={true}
                    />
                )}
            </div>
        </Input.Wrapper>
    );
}
