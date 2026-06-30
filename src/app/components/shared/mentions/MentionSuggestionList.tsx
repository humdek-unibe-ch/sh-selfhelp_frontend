/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
'use client';

import React from 'react';
import { Paper, ScrollArea, List, Text } from '@mantine/core';
import type { IVariableSuggestion } from '../../../../config/mentions.config';

/**
 * Props for the variable suggestion list component
 */
export interface IVariableListProps {
    items: IVariableSuggestion[];
    command: (item: IVariableSuggestion) => void;
    maxVisibleRows?: number;
    maxItems?: number;
}

/**
 * Keyboard handler interface for suggestion lists
 */
export interface IKeyboardHandler {
    onKeyDown: (params: { event: KeyboardEvent }) => boolean;
}

/**
 * MentionSuggestionList Component
 * 
 * A Mantine-based suggestion list for Tiptap mention functionality.
 * Follows official Tiptap patterns with keyboard navigation and visual feedback.
 */
export const MentionSuggestionList = React.forwardRef<IKeyboardHandler, IVariableListProps>(
    ({ items, command, maxVisibleRows = 5, maxItems = 50 }, ref) => {
        const [selectedIndex, setSelectedIndex] = React.useState(0);
        const itemRefs = React.useRef<(HTMLLIElement | null)[]>([]);
        const viewportRef = React.useRef<HTMLDivElement>(null);

        // Limit items to maxItems
        const displayItems = items.slice(0, maxItems);

        // Scroll selected item into view when selectedIndex changes
        React.useEffect(() => {
            // Use requestAnimationFrame to ensure DOM has updated
            requestAnimationFrame(() => {
                const item = itemRefs.current[selectedIndex];
                const viewport = viewportRef.current;

                if (!item || !viewport) return;
                
                // Calculate relative positions
                const itemTop = item.offsetTop;
                const itemBottom = itemTop + item.offsetHeight;
                const containerScrollTop = viewport.scrollTop;
                const containerVisibleBottom = containerScrollTop + viewport.clientHeight;

                // Scroll up if item is above visible area
                if (itemTop < containerScrollTop) {
                    viewport.scrollTop = itemTop - 8; // 8px padding
                } 
                // Scroll down if item is below visible area
                else if (itemBottom > containerVisibleBottom) {
                    viewport.scrollTop = itemBottom - viewport.clientHeight + 8; // 8px padding
                }
            });
        }, [selectedIndex]);

        const selectItem = (index: number) => {
            const item = displayItems[index];
            if (item) {
                command(item);
            }
        };

        const upHandler = () => {
            setSelectedIndex((selectedIndex + displayItems.length - 1) % displayItems.length);
        };

        const downHandler = () => {
            setSelectedIndex((selectedIndex + 1) % displayItems.length);
        };

        const enterHandler = () => {
            selectItem(selectedIndex);
        };

        // Reset selected index when items change
        React.useEffect(() => setSelectedIndex(0), [displayItems.length]);

        // Expose keyboard handler to parent
        React.useImperativeHandle(ref, () => ({
            onKeyDown: ({ event }: { event: KeyboardEvent }) => {
                if (event.key === 'ArrowUp') {
                    upHandler();
                    return true;
                }

                if (event.key === 'ArrowDown') {
                    downHandler();
                    return true;
                }

                if (event.key === 'Enter') {
                    enterHandler();
                    return true;
                }

                return false;
            },
        }));

        // Don't render if no items (after all hooks)
        if (displayItems.length === 0) {
            return null;
        }

        const ROW_HEIGHT = 34;
        const totalCount = items.length;
        const isScrollable = displayItems.length > maxVisibleRows;

        return (
            <Paper
                shadow="md"
                radius="md"
                withBorder
                // Theme-aware: Paper defaults to var(--mantine-color-body), so the
                // dropdown reads correctly in both light and dark schemes
                // (the old hardcoded white broke dark mode — issue #56 v2).
                style={{ padding: 0, minWidth: 220, maxWidth: 420, overflow: 'hidden' }}
            >
                <ScrollArea
                    viewportRef={viewportRef}
                    // `type="always"` keeps the scrollbar visible so the operator
                    // can see at a glance how many variables are available.
                    type="always"
                    scrollbarSize={8}
                    style={{
                        height: Math.max(ROW_HEIGHT, Math.min(displayItems.length * ROW_HEIGHT, maxVisibleRows * ROW_HEIGHT)),
                        minHeight: ROW_HEIGHT,
                    }}
                >
                    <List listStyleType="none" style={{ padding: 4, margin: 0 }}>
                        {displayItems.map((item, index) => {
                            const selected = selectedIndex === index;
                            // Show the human label as the primary text; when the
                            // inserted token differs, show it dimmed so the admin
                            // knows exactly what `{{ }}` will be stored.
                            const showToken = item.label !== item.id;
                            return (
                                <List.Item
                                    key={item.id}
                                    ref={(el) => {
                                        itemRefs.current[index] = el;
                                    }}
                                    style={{
                                        padding: '6px 10px',
                                        borderRadius: 'var(--mantine-radius-sm)',
                                        cursor: 'pointer',
                                        backgroundColor: selected
                                            ? 'var(--mantine-primary-color-light)'
                                            : 'transparent',
                                        color: selected
                                            ? 'var(--mantine-primary-color-light-color)'
                                            : 'var(--mantine-color-text)',
                                        transition: 'background-color 0.1s ease',
                                    }}
                                    onClick={() => selectItem(index)}
                                    onMouseEnter={() => setSelectedIndex(index)}
                                >
                                    <Text size="sm" fw={500} style={{ lineHeight: 1.2 }}>
                                        {item.label}
                                    </Text>
                                    {showToken && (
                                        <Text size="xs" c="dimmed" style={{ fontFamily: 'monospace', lineHeight: 1.2 }}>
                                            {`{{${item.id}}}`}
                                        </Text>
                                    )}
                                </List.Item>
                            );
                        })}
                    </List>
                </ScrollArea>
                <Text
                    size="xs"
                    c="dimmed"
                    ta="center"
                    style={{
                        padding: '4px 8px',
                        borderTop: '1px solid var(--mantine-color-default-border)',
                    }}
                >
                    {isScrollable
                        ? `${displayItems.length} of ${totalCount} variables — scroll for more`
                        : `${totalCount} variable${totalCount === 1 ? '' : 's'}`}
                </Text>
            </Paper>
        );
    }
);

MentionSuggestionList.displayName = 'MentionSuggestionList';

