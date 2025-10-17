import React from 'react';
import { Text, Paper } from '@mantine/core';
import { ReactRenderer } from '@tiptap/react';
import { PluginKey } from '@tiptap/pm/state';
import tippy from 'tippy.js';
import styles from '../app/components/cms/shared/field-components/RichTextField.module.css';

// Types
export interface IVariableSuggestion {
    id: string;
    label: string;
}

export interface IVariableListProps {
    items: IVariableSuggestion[];
    command: (item: IVariableSuggestion) => void;
}

export interface IKeyboardHandler {
    onKeyDown: (params: { event: KeyboardEvent }) => boolean;
}

// Default variables for testing - to be replaced with dynamic data later
export const DEFAULT_VARIABLES: IVariableSuggestion[] = [
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

// Function to sanitize HTML by removing mention styling but keeping text
export const sanitizeForDatabase = (html: string): string => {
    if (!html) return html;

    // Create a temporary DOM element to parse HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;

    // Find all mention spans and replace them with plain text
    const mentionSpans = tempDiv.querySelectorAll('[data-type="mention"]');
    mentionSpans.forEach(span => {
        const textNode = document.createTextNode(span.textContent || '');
        span.parentNode?.replaceChild(textNode, span);
    });

    return tempDiv.innerHTML;
};

// Variable suggestion component - following official TipTap pattern
export const VariableList = React.forwardRef<IKeyboardHandler, IVariableListProps>((props, ref) => {
    const [selectedIndex, setSelectedIndex] = React.useState(0);

    const selectItem = (index: number) => {
        const item = props.items[index];
        if (item) {
            // Wrap with {{ }} when selecting
            const wrappedItem = { ...item, label: `{{${item.label}}}` };
            props.command(wrappedItem);
        }
    };

    const upHandler = () => {
        setSelectedIndex((selectedIndex + props.items.length - 1) % props.items.length);
    };

    const downHandler = () => {
        setSelectedIndex((selectedIndex + 1) % props.items.length);
    };

    const enterHandler = () => {
        selectItem(selectedIndex);
    };

    React.useEffect(() => setSelectedIndex(0), [props.items]);

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

    return (
        <Paper shadow="md" className={styles.suggestionPopup}>
            {props.items.length ? (
                props.items.map((item, index) => (
                    <button
                        key={item.id}
                        className={`${styles.suggestionItem} ${index === selectedIndex ? styles.selected : ''}`}
                        onClick={() => selectItem(index)}
                    >
                        <Text size="sm">{item.label}</Text>
                    </button>
                ))
            ) : (
                <Text size="sm" c="dimmed" p="xs">No result</Text>
            )}
        </Paper>
    );
});

// Mention configuration for TipTap
export const createMentionConfig = (variables: IVariableSuggestion[]) => ({
    HTMLAttributes: {
        class: styles.variable,
    },
    renderText: ({ node }: any) => node.attrs.label || node.attrs.id,
    renderHTML: ({ options, node }: any) => [
        'span',
        options.HTMLAttributes,
        node.attrs.label || node.attrs.id,
    ],
    deleteTriggerWithBackspace: true,
    suggestion: {
        char: '{{',
        pluginKey: new PluginKey('mention'),
        items: ({ query }: { query: string }) => {
            return variables
                .filter(variable =>
                    variable.label.toLowerCase().includes(query.toLowerCase())
                )
                .slice(0, 5);
        },
        render: () => {
            let component: any;
            let popup: any;
            let isDestroyed = false;

            return {
                onStart: (props: any) => {
                    if (isDestroyed) return;

                    component = new ReactRenderer(VariableList, {
                        props,
                        editor: props.editor,
                    });

                    if (!props.clientRect) {
                        return;
                    }

                    popup = tippy('body', {
                        getReferenceClientRect: props.clientRect,
                        appendTo: () => document.body,
                        content: component.element,
                        showOnCreate: true,
                        interactive: true,
                        trigger: 'manual',
                        placement: 'bottom-start',
                    });
                },
                onUpdate: (props: any) => {
                    if (isDestroyed || !component) return;

                    component.updateProps(props);

                    if (!popup || !popup[0] || popup[0].destroyed) {
                        return;
                    }

                    try {
                        popup[0].setProps({
                            getReferenceClientRect: props.clientRect,
                        });
                    } catch (error) {
                        // Silently ignore errors when trying to update destroyed instances
                        console.warn('Failed to update tippy props:', error);
                    }
                },
                onKeyDown: (props: any) => {
                    if (isDestroyed || !popup?.[0]) return false;

                    if (props.event.key === 'Escape') {
                        try {
                            popup[0].hide();
                        } catch (error) {
                            // Silently ignore errors when trying to hide destroyed instances
                        }
                        return true;
                    }

                    return component?.ref?.onKeyDown(props) || false;
                },
                onExit: () => {
                    isDestroyed = true;
                    if (popup?.[0] && !popup[0].destroyed) {
                        try {
                            popup[0].destroy();
                        } catch (error) {
                            // Silently ignore errors when trying to destroy already destroyed instances
                        }
                    }
                    component?.destroy();
                    popup = null;
                    component = null;
                },
            };
        },
    },
});
