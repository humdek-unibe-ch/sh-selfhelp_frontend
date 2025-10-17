'use client';

import React, { useState } from 'react';
import { Input, Button, Paper, Text } from '@mantine/core';
import { RichTextEditor, Link } from '@mantine/tiptap';
import { IconCode } from '@tabler/icons-react';
import { useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Placeholder from '@tiptap/extension-placeholder';
import { TextStyle } from '@tiptap/extension-text-style';
import Mention from '@tiptap/extension-mention';
import { PluginKey, Plugin } from '@tiptap/pm/state';
import { Extension } from '@tiptap/core';
import { ReactRenderer } from '@tiptap/react';
import tippy from 'tippy.js';
import styles from './RichTextField.module.css';

interface IVariableSuggestion {
    id: string;
    label: string;
}

interface IVariableListProps {
    items: IVariableSuggestion[];
    command: (item: IVariableSuggestion) => void;
}

interface IKeyboardHandler {
    onKeyDown: (params: { event: KeyboardEvent }) => boolean;
}

// Function to sanitize HTML by removing mention styling but keeping text
const sanitizeForDatabase = (html: string): string => {
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
const VariableList = React.forwardRef<IKeyboardHandler, IVariableListProps>((props, ref) => {
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

interface IRichTextFieldProps {
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
    textInputMode?: boolean;
}

export function RichTextField({
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
    textInputMode = false,
}: IRichTextFieldProps) {
    const [sourceMode, setSourceMode] = useState(false);
    const [rawHtml, setRawHtml] = useState('');
    const isUpdatingRef = React.useRef(false);

    const errorMessage = validator ? (validator(value).isValid ? undefined : validator(value).error) : undefined;

    // Build extensions array conditionally
    const extensions: any[] = [
        StarterKit.configure({
            underline: false,
            link: false,
            // Disable multi-line content in textInputMode
            heading: textInputMode ? false : undefined,
            blockquote: textInputMode ? false : undefined,
            bulletList: textInputMode ? false : undefined,
            orderedList: textInputMode ? false : undefined,
            listItem: textInputMode ? false : undefined,
            codeBlock: textInputMode ? false : undefined,
            horizontalRule: textInputMode ? false : undefined,
        }),
        Underline,
        Link,
        TextAlign.configure({ types: textInputMode ? [] : ['heading', 'paragraph'] }),
        TextStyle,
        Placeholder.configure({
            placeholder: placeholder || 'Start writing...',
        }),
    ];

    // Add keyboard handling for text input mode to prevent Enter
    if (textInputMode) {
        extensions.push(
            Extension.create({
                name: 'preventNewLines',
                addProseMirrorPlugins() {
                    return [
                        new Plugin({
                            key: new PluginKey('preventNewLines'),
                            props: {
                                handleKeyDown: (view, event) => {
                                    // Prevent Enter and Shift+Enter from creating new lines
                                    if (event.key === 'Enter') {
                                        event.preventDefault();
                                        return true;
                                    }
                                    return false;
                                },
                            },
                        }),
                    ];
                },
            })
        );
    }

    // Add paste handling for text input mode to convert multiline to single line
    if (textInputMode) {
        extensions.push(
            Extension.create({
                name: 'singleLinePaste',
                addProseMirrorPlugins() {
                    return [
                        new Plugin({
                            key: new PluginKey('singleLinePaste'),
                            props: {
                                handlePaste: (view, event) => {
                                    const text = event.clipboardData?.getData('text/plain');
                                    if (text && text.includes('\n')) {
                                        // Convert multiline text to single line
                                        const singleLineText = text.replace(/\n/g, ' ').replace(/\r/g, ' ');
                                        // Insert the cleaned text
                                        const { tr } = view.state;
                                        const transaction = tr.insertText(singleLineText);
                                        view.dispatch(transaction);
                                        return true; // Prevent default paste behavior
                                    }
                                    return false; // Allow normal paste for single-line text
                                },
                            },
                        }),
                    ];
                },
            })
        );
    }

    // Default variables for quick testing - replace with dynamic data later
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

    // Use provided variables or fall back to defaults for testing
    // const activeVariables = variables && variables.length > 0 ? variables : defaultVariables;
    const activeVariables = variables;
    // Add mention extension only if we have variables to suggest
    if (activeVariables && activeVariables.length > 0) {
        extensions.push(
            Mention.configure({
                HTMLAttributes: {
                    class: styles.variable,
                },
                renderText: ({ node }) => node.attrs.label || node.attrs.id,
                renderHTML: ({ options, node }) => [
                    'span',
                    options.HTMLAttributes,
                    node.attrs.label || node.attrs.id,
                ],
                deleteTriggerWithBackspace: true,
                suggestion: {
                    char: '{{',
                    pluginKey: new PluginKey('mention'),
                    items: ({ query }) => {
                        return activeVariables
                            .filter(variable =>
                                variable.label.toLowerCase().includes(query.toLowerCase())
                            )
                            .slice(0, 5);
                    },
                    render: () => {
                        let component: any;
                        let popup: any;

                        return {
                            onStart: (props: any) => {
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
                                component?.updateProps(props);

                                if (!popup || !popup[0] || popup[0].destroyed) {
                                    return;
                                }

                                popup[0].setProps({
                                    getReferenceClientRect: props.clientRect,
                                });
                            },
                            onKeyDown: (props: any) => {
                                if (props.event.key === 'Escape') {
                                    popup?.[0]?.hide();
                                    return true;
                                }

                                return component.ref?.onKeyDown(props);
                            },
                            onExit: () => {
                                if (popup?.[0] && !popup[0].destroyed) {
                                    popup[0].destroy();
                                }
                                component?.destroy();
                            },
                        };
                    },
                },
            })
        );
    }

    const editor = useEditor({
        extensions,
        content: value,
        onUpdate: ({ editor }) => {
            // Skip if we're currently updating content programmatically
            if (isUpdatingRef.current) return;

            const html = editor.getHTML();
            // First apply any custom sanitization
            const sanitizedHtml = sanitize ? sanitize(html) : html;
            // Then remove mention styling for database storage
            const dbReadyHtml = sanitizeForDatabase(sanitizedHtml);
            onChange(dbReadyHtml);
        },
        editable: !disabled,
        immediatelyRender: false, // Fix SSR hydration mismatch
    });

    // Update editor content when value prop changes externally
    React.useEffect(() => {
        if (editor && editor.getHTML() !== value) {
            isUpdatingRef.current = true;
            editor.commands.setContent(value);
            // Reset the flag after a short delay to allow the update to complete
            setTimeout(() => {
                isUpdatingRef.current = false;
            }, 0);
        }
    }, [editor, value]);

    const toggleSourceMode = () => {
        if (!sourceMode) {
            // Entering source mode → load HTML into textarea
            setRawHtml(editor?.getHTML() || value);
        } else {
            // Leaving source mode → update editor with raw HTML
            if (editor) {
                isUpdatingRef.current = true;
                editor.commands.setContent(rawHtml, { parseOptions: { preserveWhitespace: true } });
                setTimeout(() => {
                    isUpdatingRef.current = false;
                }, 0);
            }
            const sanitizedHtml = sanitize ? sanitize(rawHtml) : rawHtml;
            const dbReadyHtml = sanitizeForDatabase(sanitizedHtml);
            onChange(dbReadyHtml);
        }
        setSourceMode(!sourceMode);
    };

    return (
        <Input.Wrapper
            key={fieldId}
            label={label}
            description={description}
            required={required}
            error={errorMessage}
        >
            {sourceMode ? (
                <>
                    <Button
                        variant="light"
                        size="xs"
                        onClick={toggleSourceMode}
                        disabled={disabled}
                        mb="xs"
                    >
                        Back to Editor
                    </Button>
                    <textarea
                    value={rawHtml}
                    onChange={(e) => setRawHtml(e.target.value)}
                    disabled={disabled}
                    style={{
                        width: '100%',
                        minHeight: '200px',
                        fontFamily: 'monospace',
                        fontSize: '14px',
                        padding: '8px',
                        border: '1px solid #ced4da',
                        borderRadius: '4px',
                        resize: 'vertical'
                    }}
                    placeholder={placeholder || 'Start writing...'}
                    />
                </>
            ) : (
                <RichTextEditor editor={editor}>
                    {!textInputMode && (
                        <RichTextEditor.Toolbar>
                            <RichTextEditor.ControlsGroup>
                                <RichTextEditor.Bold />
                                <RichTextEditor.Italic />
                                <RichTextEditor.Underline />
                                <RichTextEditor.Strikethrough />
                            <RichTextEditor.ClearFormatting />
                            <RichTextEditor.Highlight />
                            <RichTextEditor.Control
                                onClick={toggleSourceMode}
                                active={sourceMode}
                                disabled={disabled}
                                aria-label="Toggle source mode"
                                title="Toggle source mode"
                            >
                                <IconCode size={16} />
                            </RichTextEditor.Control>
                            </RichTextEditor.ControlsGroup>

                            <RichTextEditor.ControlsGroup>
                                <RichTextEditor.H1 />
                                <RichTextEditor.H2 />
                                <RichTextEditor.H3 />
                                <RichTextEditor.H4 />
                            </RichTextEditor.ControlsGroup>

                            <RichTextEditor.ControlsGroup>
                                <RichTextEditor.Hr />
                                <RichTextEditor.BulletList />
                                <RichTextEditor.OrderedList />
                            </RichTextEditor.ControlsGroup>

                            <RichTextEditor.ControlsGroup>
                                <RichTextEditor.Link />
                                <RichTextEditor.Unlink />
                            </RichTextEditor.ControlsGroup>

                        <RichTextEditor.ControlsGroup>
                            <RichTextEditor.AlignLeft />
                            <RichTextEditor.AlignCenter />
                            <RichTextEditor.AlignJustify />
                            <RichTextEditor.AlignRight />
                            <RichTextEditor.Undo />
                            <RichTextEditor.Redo />
                        </RichTextEditor.ControlsGroup>
                        </RichTextEditor.Toolbar>
                    )}

                    <RichTextEditor.Content
                        style={textInputMode ? {
                            minHeight: '36px',
                            maxHeight: '36px',
                            overflow: 'hidden'
                        } : { minHeight: '200px' }}
                        className={textInputMode ? styles.textInputMode : undefined}
                    />
                </RichTextEditor>
            )}
        </Input.Wrapper>
    );
}
