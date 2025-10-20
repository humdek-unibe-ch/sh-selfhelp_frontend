'use client';

import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { Textarea } from '@mantine/core';
import { VariableList, IVariableSuggestion, formatVariable, VariableSuggestionsPopup } from '../../../../../utils/mentions.utils';

interface ITextareaWithMentionsProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    disabled?: boolean;
    minRows?: number;
    maxRows?: number;
    error?: string;
    variables?: IVariableSuggestion[];
    dataVariables?: Record<string, string>;
    maxVisibleRows?: number;
    maxItems?: number;
}

export function TextareaWithMentions({
    value,
    onChange,
    placeholder,
    disabled = false,
    minRows = 3,
    maxRows = 6,
    error,
    variables,
    dataVariables,
    maxVisibleRows = 5,
    maxItems = 50,
}: ITextareaWithMentionsProps) {
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [suggestions, setSuggestions] = useState<IVariableSuggestion[]>([]);
    const [cursorPosition, setCursorPosition] = useState(0);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const suggestionRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

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

    const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const newValue = e.target.value;
        const cursorPos = e.target.selectionStart || 0;

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

        onChange(newValue);
    };

    const handleSuggestionSelect = (suggestion: IVariableSuggestion) => {
        const textBeforeCursor = value.substring(0, cursorPosition);
        const textAfterCursor = value.substring(cursorPosition);

        // Find the {{ trigger and replace it with the selected variable
        const mentionMatch = textBeforeCursor.match(/\{\{[^}]*$/);
        if (mentionMatch) {
            const beforeMention = textBeforeCursor.substring(0, mentionMatch.index);
            const newValue = beforeMention + `{{${suggestion.label}}}` + textAfterCursor;

            // Update value
            setShowSuggestions(false);
            onChange(newValue);

            // Focus back to textarea
            setTimeout(() => {
                if (textareaRef.current) {
                    textareaRef.current.focus();
                }
            }, 0);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
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
        <div ref={containerRef} style={{ position: 'relative' }}>
            <Textarea
                ref={textareaRef}
                value={value}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                disabled={disabled}
                minRows={minRows}
                maxRows={maxRows}
                error={error}
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
    );
}
