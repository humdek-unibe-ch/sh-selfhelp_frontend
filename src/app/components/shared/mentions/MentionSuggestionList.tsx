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

        return (
            <Paper
                shadow="md"
                style={{
                    padding: 0,
                    backgroundColor: 'white',
                    borderRadius: '4px',
                    minWidth: '200px',
                    maxWidth: '400px',
                }}
                withBorder
            >
                <ScrollArea
                    viewportRef={viewportRef}
                    style={{
                        height: Math.max(36, Math.min(displayItems.length * 36, maxVisibleRows * 36)),
                        minHeight: '36px',
                    }}
                    scrollbarSize={6}
                >
                    <List spacing="xs" size="sm" style={{ padding: '8px 0' }}>
                        {displayItems.map((item, index) => (
                            <List.Item
                                key={item.id}
                                ref={(el) => {
                                    itemRefs.current[index] = el;
                                }}
                                style={{
                                    padding: '8px 16px',
                                    cursor: 'pointer',
                                    backgroundColor:
                                        selectedIndex === index
                                            ? 'var(--mantine-color-blue-0)'
                                            : 'transparent',
                                    transition: 'background-color 0.15s ease',
                                }}
                                onClick={() => selectItem(index)}
                                onMouseEnter={() => {
                                    setSelectedIndex(index);
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor =
                                        selectedIndex === index
                                            ? 'var(--mantine-color-blue-0)'
                                            : 'transparent';
                                }}
                            >
                                <Text
                                    size="sm"
                                    style={{
                                        fontFamily: 'monospace',
                                        color:
                                            selectedIndex === index
                                                ? 'var(--mantine-color-blue-9)'
                                                : 'inherit',
                                    }}
                                >
                                    {item.label}
                                </Text>
                            </List.Item>
                        ))}
                    </List>
                </ScrollArea>
            </Paper>
        );
    }
);

MentionSuggestionList.displayName = 'MentionSuggestionList';

