'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Textarea } from '@mantine/core';
import { VariableList, IVariableSuggestion, formatVariable } from '../../../../../utils/mentions.utils';

interface ITextareaWithMentionsProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    disabled?: boolean;
    minRows?: number;
    maxRows?: number;
    error?: string;
    variables?: IVariableSuggestion[];
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
}: ITextareaWithMentionsProps) {
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [suggestions, setSuggestions] = useState<IVariableSuggestion[]>([]);
    const [cursorPosition, setCursorPosition] = useState(0);
    const [suggestionPosition, setSuggestionPosition] = useState({ top: 0, left: 0 });
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const variableListRef = useRef<any>(null);

    // Default variables for testing
    const defaultVariables: IVariableSuggestion[] = [
        { id: 'user_name', label: 'user_name' },
        { id: 'user_email', label: 'user_email' },
        { id: 'user_id', label: 'user_id' },
        { id: 'page_title', label: 'page_title' },
        { id: 'page_url', label: 'page_url' },
        { id: 'current_date', label: 'current_date' },
        { id: 'site_name', label: 'site_name' },
        { id: 'site_url', label: 'site_url' },
        { id: 'current_year', label: 'current_year' },
    ];

    const activeVariables = variables && variables.length > 0 ? variables : defaultVariables;

    const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const newValue = e.target.value;
        const cursorPos = e.target.selectionStart || 0;

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
                if (textareaRef.current) {
                    const textareaRect = textareaRef.current.getBoundingClientRect();
                    const cursorCoords = getCursorCoordinates(textareaRef.current, cursorPos);
                    setSuggestionPosition({
                        top: textareaRect.top + cursorCoords.top + 20,
                        left: textareaRect.left + cursorCoords.left,
                    });
                }
            } else {
                setShowSuggestions(false);
            }
        } else {
            setShowSuggestions(false);
        }

        onChange(newValue);
    };

    const handleSuggestionSelect = (suggestion: IVariableSuggestion) => {
        if (!textareaRef.current) return;

        const textBeforeCursor = value.substring(0, cursorPosition);
        const textAfterCursor = value.substring(cursorPosition);

        // Find the {{ trigger and replace it with the selected variable
        const mentionMatch = textBeforeCursor.match(/\{\{[^}]*$/);
        if (mentionMatch) {
            const beforeMention = textBeforeCursor.substring(0, mentionMatch.index);
            const newValue = beforeMention + formatVariable(suggestion.label) + textAfterCursor;

            setShowSuggestions(false);
            onChange(newValue);

            // Focus back to textarea and set cursor position
            setTimeout(() => {
                if (textareaRef.current) {
                    textareaRef.current.focus();
                    const newCursorPos = beforeMention.length + formatVariable(suggestion.label).length;
                    textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
                }
            }, 0);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
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

    // Helper function to get cursor coordinates in textarea
    const getCursorCoordinates = (textarea: HTMLTextAreaElement, position: number): { top: number; left: number } => {
        const div = document.createElement('div');
        const style = window.getComputedStyle(textarea);

        // Copy textarea styles to div
        ['fontSize', 'fontFamily', 'lineHeight', 'padding', 'border', 'wordWrap', 'whiteSpace', 'overflowWrap'].forEach(prop => {
            div.style[prop as any] = style[prop as any];
        });

        div.style.position = 'absolute';
        div.style.visibility = 'hidden';
        div.style.whiteSpace = 'pre-wrap';
        div.style.wordWrap = 'break-word';
        div.style.overflowWrap = 'break-word';
        div.style.width = textarea.clientWidth + 'px';
        div.style.height = textarea.clientHeight + 'px';

        // Create a span to measure cursor position
        const textBeforeCursor = textarea.value.substring(0, position);
        const textAfterCursor = textarea.value.substring(position);
        div.textContent = textBeforeCursor;
        const span = document.createElement('span');
        span.textContent = textAfterCursor;
        div.appendChild(span);

        document.body.appendChild(div);

        const cursorRect = span.getBoundingClientRect();
        const textareaRect = textarea.getBoundingClientRect();

        document.body.removeChild(div);

        return {
            top: cursorRect.top - textareaRect.top,
            left: cursorRect.left - textareaRect.left,
        };
    };

    return (
        <div style={{ position: 'relative' }}>
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
                <div
                    style={{
                        position: 'fixed',
                        top: suggestionPosition.top,
                        left: suggestionPosition.left,
                        zIndex: 1000,
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
    );
}
