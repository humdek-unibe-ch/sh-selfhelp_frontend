import React from 'react';
import { Text, Paper, ScrollArea, List, MantineProvider } from '@mantine/core';
import { ReactRenderer } from '@tiptap/react';
import { PluginKey } from '@tiptap/pm/state';
import tippy from 'tippy.js';
import { createPortal } from 'react-dom';
import { createRoot, Root } from 'react-dom/client';
import { theme } from '../../theme';
import styles from '../app/components/cms/shared/field-components/RichTextField.module.css';

// Tippy instance type for mention popups
export interface ITippyMentionInstance {
    show: (triggerElement: HTMLElement, getReferenceClientRect: () => DOMRect, initialSuggestions?: IVariableSuggestion[]) => void;
    hide: () => void;
    destroy: () => void;
    updateSuggestions: (suggestions: IVariableSuggestion[], selectedIndex?: number) => void;
    handleKeyDown: (event: KeyboardEvent) => boolean;
}

// Wrapper component to provide Mantine context for tippy-rendered components
interface IMantineProviderWrapperProps {
    suggestions: IVariableSuggestion[];
    selectedIndex: number;
    maxVisibleRows: number;
    maxItems: number;
    onSelect: (suggestion: IVariableSuggestion) => void;
}

const MantineProviderWrapper: React.FC<IMantineProviderWrapperProps> = ({
    suggestions,
    selectedIndex,
    maxVisibleRows,
    maxItems,
    onSelect,
}) => {
    return (
        <MantineProvider theme={theme} defaultColorScheme="auto">
            <VariableSuggestionsPopup
                suggestions={suggestions}
                selectedIndex={selectedIndex}
                maxVisibleRows={maxVisibleRows}
                maxItems={maxItems}
                onSelect={onSelect}
                useAbsolutePositioning={false}
            />
        </MantineProvider>
    );
};

// Types
export interface IVariableSuggestion {
    id: string;
    label: string;
}

export interface IVariableListProps {
    items: IVariableSuggestion[];
    command: (item: IVariableSuggestion) => void;
    maxVisibleRows?: number; // How many items to show before scrolling (default: 5)
    maxItems?: number; // Maximum items to display in the list (default: 50)
}

export interface IKeyboardHandler {
    onKeyDown: (params: { event: KeyboardEvent }) => boolean;
}

export interface IVariableSuggestionsPopupProps {
    suggestions: IVariableSuggestion[];
    selectedIndex: number;
    maxVisibleRows?: number; // How many items to show before scrolling (default: 5)
    maxItems?: number; // Maximum items to display in the list (default: 50)
    onSelect: (suggestion: IVariableSuggestion) => void;
    onKeyDown?: (event: KeyboardEvent) => boolean;
    useAbsolutePositioning?: boolean;
}

// Removed DEFAULT_VARIABLES - all variables now come from section context

// Centralized variable formatting functions
export const VARIABLE_BRACKET_FORMAT = '{{}}';

/**
 * Formats a variable ID into the standard bracket format
 * @param variableId - The variable identifier (e.g., 'user_email')
 * @returns Formatted variable (e.g., '{{user_email}}')
 */
export const formatVariable = (variableId: string): string => {
    return `${VARIABLE_BRACKET_FORMAT.slice(0, 2)}${variableId}${VARIABLE_BRACKET_FORMAT.slice(2)}`;
};

/**
 * Extracts the variable ID from a formatted variable string
 * @param formattedVariable - The formatted variable (e.g., '{{user_email}}')
 * @returns The variable ID (e.g., 'user_email') or null if not a valid format
 */
export const extractVariableId = (formattedVariable: string): string | null => {
    const match = formattedVariable.match(/^\{\{([^}]+)\}\}$/);
    return match ? match[1] : null;
};

/**
 * Checks if a string is a properly formatted variable
 * @param str - The string to check
 * @returns True if the string matches {{variable_id}} format
 */
export const isFormattedVariable = (str: string): boolean => {
    return /^\{\{[^}]+\}\}$/.test(str);
};

// Function to sanitize HTML by removing mention styling but keeping properly formatted variables
export const sanitizeForDatabase = (html: string): string => {
    if (!html) return html;

    // Create a temporary DOM element to parse HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;

    // Find all mention spans and replace them with formatted variables
    const mentionSpans = tempDiv.querySelectorAll('[data-type="mention"]');
    mentionSpans.forEach(span => {
        const variableId = span.textContent || '';
        // Ensure the variable is properly formatted with brackets
        const formattedVariable = isFormattedVariable(variableId) ? variableId : formatVariable(variableId);
        const textNode = document.createTextNode(formattedVariable);
        span.parentNode?.replaceChild(textNode, span);
    });

    return tempDiv.innerHTML;
};

// Variable suggestion component - following official TipTap pattern with unified styling
export const VariableList = React.forwardRef<IKeyboardHandler, IVariableListProps>((props, ref) => {
    const [selectedIndex, setSelectedIndex] = React.useState(0);
    const itemRefs = React.useRef<(HTMLLIElement | null)[]>([]);
    const scrollAreaRef = React.useRef<HTMLDivElement>(null);
    const { items, command, maxVisibleRows = 5, maxItems = 50 } = props;

    // Limit items to maxItems and apply filtering based on maxItems
    const displayItems = items.slice(0, maxItems);

    // Don't render if no items
    if (displayItems.length === 0) {
        return null;
    }

    // Scroll selected item into view when selectedIndex changes
    React.useEffect(() => {
        // Use requestAnimationFrame to ensure DOM is ready
        requestAnimationFrame(() => {
            if (itemRefs.current[selectedIndex] && scrollAreaRef.current) {
                const item = itemRefs.current[selectedIndex];
                const container = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
                
                if (item && container) {
                    const itemTop = item.offsetTop;
                    const itemBottom = itemTop + item.offsetHeight;
                    const containerTop = container.scrollTop;
                    const containerBottom = containerTop + container.clientHeight;

                    if (itemTop < containerTop) {
                        // Scroll up to show item
                        container.scrollTop = itemTop - 8; // Add padding
                    } else if (itemBottom > containerBottom) {
                        // Scroll down to show item
                        container.scrollTop = itemBottom - container.clientHeight + 8; // Add padding
                    }
                }
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

    React.useEffect(() => setSelectedIndex(0), [displayItems]);

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
                ref={scrollAreaRef}
                style={{
                    height: Math.max(36, Math.min(displayItems.length * 36, maxVisibleRows * 36)),
                    minHeight: '36px',
                }}
                scrollbarSize={6}
            >
                <List
                    spacing="xs"
                    size="sm"
                    style={{ padding: '8px 0' }}
                >
                    {displayItems.map((item, index) => (
                        <List.Item
                            key={item.id}
                            ref={(el) => { itemRefs.current[index] = el; }}
                            style={{
                                padding: '8px 16px',
                                cursor: 'pointer',
                                backgroundColor: selectedIndex === index ? 'var(--mantine-color-blue-0)' : 'transparent',
                                transition: 'background-color 0.15s ease',
                            }}
                            onClick={() => selectItem(index)}
                            onMouseEnter={(e) => {
                                if (selectedIndex !== index) {
                                    e.currentTarget.style.backgroundColor = 'var(--mantine-color-gray-0)';
                                }
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = selectedIndex === index ? 'var(--mantine-color-blue-0)' : 'transparent';
                            }}
                        >
                            <Text
                                size="sm"
                                style={{
                                    fontFamily: 'monospace',
                                    color: selectedIndex === index ? 'var(--mantine-color-blue-9)' : 'inherit'
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
});

// Unified variable suggestions popup component for both TipTap and direct DOM usage
export const VariableSuggestionsPopup: React.FC<IVariableSuggestionsPopupProps> = ({
    suggestions,
    selectedIndex,
    maxVisibleRows = 5,
    maxItems = 50,
    onSelect,
    useAbsolutePositioning = false,
}) => {
    const itemRefs = React.useRef<(HTMLLIElement | null)[]>([]);
    const scrollAreaRef = React.useRef<HTMLDivElement>(null);

    // Limit suggestions to maxItems
    const displaySuggestions = suggestions.slice(0, maxItems);

    // Don't render if no suggestions
    if (displaySuggestions.length === 0) {
        return null;
    }

    // Scroll selected item into view when selectedIndex changes
    React.useEffect(() => {
        // Use requestAnimationFrame to ensure DOM is ready
        requestAnimationFrame(() => {
            if (itemRefs.current[selectedIndex] && scrollAreaRef.current) {
                const item = itemRefs.current[selectedIndex];
                const container = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');

                if (item && container) {
                    const itemTop = item.offsetTop;
                    const itemBottom = itemTop + item.offsetHeight;
                    const containerTop = container.scrollTop;
                    const containerBottom = containerTop + container.clientHeight;

                    if (itemTop < containerTop) {
                        // Scroll up to show item
                        container.scrollTop = itemTop - 8; // Add padding
                    } else if (itemBottom > containerBottom) {
                        // Scroll down to show item
                        container.scrollTop = itemBottom - container.clientHeight + 8; // Add padding
                    }
                }
            }
        });
    }, [selectedIndex]);

    const positioningStyles = useAbsolutePositioning ? {
        position: 'absolute' as const,
        top: '100%',
        left: '0',
        right: '0',
        zIndex: 999999, // Extremely high z-index for mentions
        maxWidth: '400px',
    } : {
        minWidth: '200px',
        maxWidth: '400px',
    };

    return (
        <Paper
            shadow="md"
            style={{
                ...positioningStyles,
                padding: 0,
                backgroundColor: 'white',
                borderRadius: '4px',
            }}
            withBorder
        >
            <ScrollArea
                ref={scrollAreaRef}
                style={{
                    height: Math.max(36, Math.min(displaySuggestions.length * 36, maxVisibleRows * 36)), // At least 36px, max based on maxVisibleRows
                    minHeight: '36px',
                }}
                scrollbarSize={6}
            >
                <List
                    spacing="xs"
                    size="sm"
                    style={{ padding: '8px 0' }}
                >
                    {displaySuggestions.map((suggestion, index) => (
                        <List.Item
                            key={suggestion.id}
                            ref={(el) => { itemRefs.current[index] = el; }}
                            style={{
                                padding: '8px 16px',
                                cursor: 'pointer',
                                backgroundColor: selectedIndex === index ? 'var(--mantine-color-blue-0)' : 'transparent',
                                transition: 'background-color 0.15s ease',
                            }}
                            onClick={() => onSelect(suggestion)}
                            onMouseEnter={(e) => {
                                if (selectedIndex !== index) {
                                    e.currentTarget.style.backgroundColor = 'var(--mantine-color-gray-0)';
                                }
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = selectedIndex === index ? 'var(--mantine-color-blue-0)' : 'transparent';
                            }}
                        >
                            <Text
                                size="sm"
                                style={{
                                    fontFamily: 'monospace',
                                    color: selectedIndex === index ? 'var(--mantine-color-blue-9)' : 'inherit'
                                }}
                            >
                                {suggestion.label}
                            </Text>
                        </List.Item>
                    ))}
                </List>
            </ScrollArea>
        </Paper>
    );
};

// Alias for backward compatibility with TipTap integration
export const SimpleVariableSuggestions = VariableSuggestionsPopup;

// Create tippy-based mention handler for regular input/textarea elements
export const createTippyMentionHandler = (
    variables: IVariableSuggestion[],
    onSelect: (suggestion: IVariableSuggestion) => void,
    maxVisibleRows: number = 5,
    maxItems: number = 50
): ITippyMentionInstance => {
    let tippyInstance: any = null;
    let root: Root | null = null;
    let contentElement: HTMLDivElement | null = null;
    let currentSuggestions: IVariableSuggestion[] = [];
    let selectedIndex = 0;

    const cleanup = () => {
        if (tippyInstance?.[0]) {
            try {
                if (!tippyInstance[0].state.isDestroyed) {
                    tippyInstance[0].destroy();
                }
            } catch (error) {
                // Tippy already destroyed
            }
        }
        // Don't synchronously unmount root - let React handle it
        // Just clean up references
        tippyInstance = null;
        root = null;
        contentElement = null;
        currentSuggestions = [];
        selectedIndex = 0;
    };

    const updateSuggestions = (suggestions: IVariableSuggestion[], newSelectedIndex: number = 0) => {
        if (!root || !contentElement) return;

        currentSuggestions = suggestions.slice(0, maxItems);
        selectedIndex = Math.min(newSelectedIndex, currentSuggestions.length - 1);

        root.render(
            React.createElement('div', null,
                React.createElement(MantineProviderWrapper, {
                    suggestions: currentSuggestions,
                    selectedIndex: selectedIndex,
                    maxVisibleRows: maxVisibleRows,
                    maxItems: maxItems,
                    onSelect: onSelect,
                })
            )
        );
    };

    const handleKeyDown = (event: KeyboardEvent): boolean => {
        if (currentSuggestions.length === 0) return false;

        switch (event.key) {
            case 'ArrowDown':
                event.preventDefault();
                selectedIndex = selectedIndex < currentSuggestions.length - 1 ? selectedIndex + 1 : 0;
                updateSuggestions(currentSuggestions, selectedIndex);
                return true;

            case 'ArrowUp':
                event.preventDefault();
                selectedIndex = selectedIndex > 0 ? selectedIndex - 1 : currentSuggestions.length - 1;
                updateSuggestions(currentSuggestions, selectedIndex);
                return true;

            case 'Enter':
                event.preventDefault();
                if (currentSuggestions[selectedIndex]) {
                    onSelect(currentSuggestions[selectedIndex]);
                    hide();
                }
                return true;

            case 'Escape':
                event.preventDefault();
                hide();
                return true;

            case 'Backspace':
                // Check if Backspace would remove the {{ trigger
                // This will be handled by the input change handler, but we can let it pass through
                return false;
        }

        return false;
    };

    const show = (triggerElement: HTMLElement, getReferenceClientRect: () => DOMRect, initialSuggestions?: IVariableSuggestion[]) => {
        // Clean up any existing instances first
        cleanup();

        // Use provided initial suggestions or default to variables
        currentSuggestions = initialSuggestions || variables.slice(0, maxItems);
        selectedIndex = 0;


        // Create a container element
        contentElement = document.createElement('div');
        contentElement.className = 'tippy-mentions-content';

        // Create React root and render the component with MantineProvider
        root = createRoot(contentElement);
        root.render(
            React.createElement('div', null,
                React.createElement(MantineProviderWrapper, {
                    suggestions: currentSuggestions,
                    selectedIndex: selectedIndex,
                    maxVisibleRows: maxVisibleRows,
                    maxItems: maxItems,
                    onSelect: onSelect,
                })
            )
        );

        tippyInstance = tippy(triggerElement, {
            getReferenceClientRect: getReferenceClientRect,
            appendTo: () => document.body,
            content: contentElement,
            showOnCreate: true,
            interactive: true,
            trigger: 'manual',
            placement: 'bottom-start',
            zIndex: 999999,
            arrow: false,
            theme: 'light',
            maxWidth: '400px',
            popperOptions: {
                modifiers: [
                    { name: 'flip', options: { fallbackPlacements: ['top-start', 'bottom-end', 'top-end'] } },
                    { name: 'preventOverflow', options: { boundary: 'viewport' } },
                ],
            },
            onHidden: () => {
                // Clean up when hidden but allow reopening
                cleanup();
            },
        });
    };

    const hide = () => {
        if (tippyInstance?.[0] && !tippyInstance[0].state.isDestroyed) {
            tippyInstance[0].hide();
        }
    };

    const destroy = () => {
        cleanup();
    };

    return {
        show,
        hide,
        destroy,
        updateSuggestions,
        handleKeyDown,
    };
};

// Mention configuration for TipTap with Mantine-based popup
export const createMentionConfigWithMantine = (variables: IVariableSuggestion[], maxVisibleRows: number = 5, maxItems: number = 50) => ({
    HTMLAttributes: {
        class: styles.variable,
    },
    renderText: ({ node }: any) => formatVariable(node.attrs.label || node.attrs.id),
    renderHTML: ({ options, node }: any): any => [
        'span',
        options.HTMLAttributes,
        formatVariable(node.attrs.label || node.attrs.id),
    ],
    deleteTriggerWithBackspace: true,
    suggestion: {
        char: '{{',
        pluginKey: new PluginKey('mention-mantine'),
        items: ({ query }: { query: string }) => {
            if (query.length > 0) {
                // After typing a letter, show all matching suggestions (up to maxItems)
                return variables.filter(variable =>
                    variable.label.toLowerCase().includes(query.toLowerCase())
                ).slice(0, maxItems);
            } else {
                // When just {{ is typed, show all available suggestions (up to maxItems)
                return variables.slice(0, maxItems);
            }
        },
        render: () => {
            let component: any = null;
            let popup: any = null;
            let selectedIndex = 0;
            let currentSuggestions: IVariableSuggestion[] = [];
            let currentCommand: ((item: IVariableSuggestion) => void) | null = null;

            const cleanup = () => {
                if (popup?.[0]) {
                    try {
                        if (!popup[0].state.isDestroyed) {
                            popup[0].destroy();
                        }
                    } catch (error) {
                        // Popup already destroyed
                    }
                }
                if (component) {
                    try {
                        component.destroy();
                    } catch (error) {
                        // Component already destroyed
                    }
                }
                popup = null;
                component = null;
                selectedIndex = 0;
                currentSuggestions = [];
                currentCommand = null;
            };

            const handleKeyDown = (event: KeyboardEvent) => {
                if (!component || currentSuggestions.length === 0 || !currentCommand) return false;

                if (event.key === 'ArrowDown') {
                    event.preventDefault();
                    selectedIndex = (selectedIndex + 1) % currentSuggestions.length;
                    component.updateProps({
                        suggestions: currentSuggestions,
                        selectedIndex: selectedIndex,
                        maxVisibleRows: maxVisibleRows,
                        maxItems: maxItems,
                        onSelect: currentCommand,
                    });
                    return true;
                } else if (event.key === 'ArrowUp') {
                    event.preventDefault();
                    selectedIndex = selectedIndex > 0 ? selectedIndex - 1 : currentSuggestions.length - 1;
                    component.updateProps({
                        suggestions: currentSuggestions,
                        selectedIndex: selectedIndex,
                        maxVisibleRows: maxVisibleRows,
                        maxItems: maxItems,
                        onSelect: currentCommand,
                    });
                    return true;
                } else if (event.key === 'Enter') {
                    event.preventDefault();
                    if (currentSuggestions[selectedIndex] && currentCommand) {
                        currentCommand(currentSuggestions[selectedIndex]);
                    }
                    return true;
                } else if (event.key === 'Escape') {
                    event.preventDefault();
                    cleanup();
                    return true;
                }
                return false;
            };

            return {
                onStart: (props: any) => {
                    // Clean up any existing instances first
                    cleanup();

                    currentSuggestions = props.items || [];
                    currentCommand = props.command;
                    selectedIndex = 0;

                    component = new ReactRenderer(VariableSuggestionsPopup, {
                        props: {
                            suggestions: currentSuggestions,
                            selectedIndex: selectedIndex,
                            maxVisibleRows: maxVisibleRows,
                            maxItems: maxItems,
                            onSelect: currentCommand,
                        },
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
                        zIndex: 999999,
                        arrow: false,
                        theme: 'light',
                        maxWidth: '400px',
                        popperOptions: {
                            modifiers: [
                                { name: 'flip', options: { fallbackPlacements: ['top-start', 'bottom-end', 'top-end'] } },
                                { name: 'preventOverflow', options: { boundary: 'viewport' } },
                            ],
                        },
                        onHidden: () => {
                            // Clean up when hidden but allow reopening
                            cleanup();
                        },
                    });
                },
                onUpdate: (props: any) => {
                    if (!component) return;

                    currentSuggestions = props.items || [];
                    currentCommand = props.command;
                    
                    // Reset selected index if suggestions changed significantly
                    if (selectedIndex >= currentSuggestions.length) {
                        selectedIndex = 0;
                    }

                    component.updateProps({
                        suggestions: currentSuggestions,
                        selectedIndex: selectedIndex,
                        maxVisibleRows: maxVisibleRows,
                        maxItems: maxItems,
                        onSelect: currentCommand,
                    });

                    if (popup?.[0] && !popup[0].state.isDestroyed) {
                        try {
                            popup[0].setProps({
                                getReferenceClientRect: props.clientRect,
                            });
                        } catch (error) {
                            // Popup destroyed, ignore
                        }
                    }
                },
                onKeyDown: (props: any) => {
                    return handleKeyDown(props.event);
                },
                onExit: () => {
                    cleanup();
                },
            };
        },
    },
});