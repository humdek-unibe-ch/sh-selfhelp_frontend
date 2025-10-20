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
import styles from './RichTextField.module.css';
import { IVariableSuggestion, IVariableListProps, IKeyboardHandler, sanitizeForDatabase, VariableList, formatVariable, createMentionConfigWithMantine } from '../../../../../utils/mentions.utils';

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
    dataVariables?: Record<string, string>;
    textInputMode?: boolean;
    maxVisibleRows?: number;
    maxItems?: number;
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
    dataVariables,
    textInputMode = false,
    maxVisibleRows = 5,
    maxItems = 50,
}: IRichTextFieldProps) {
    const [sourceMode, setSourceMode] = useState(false);
    const [rawHtml, setRawHtml] = useState('');
    const isUpdatingRef = React.useRef(false);

    const errorMessage = validator ? (validator(value).isValid ? undefined : validator(value).error) : undefined;

    // Build base extensions array conditionally (memoized for stable reference)
    const baseExtensions = React.useMemo(() => {
        const exts: any[] = [
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
            exts.push(
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
            exts.push(
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

        return exts;
    }, [textInputMode, placeholder]);

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

    // Recreate extensions when activeVariables change to ensure mention extension gets updated
    const editorExtensions = React.useMemo(() => {
        const exts = [...baseExtensions];
        
        // Add mention extension only if we have variables to suggest
        if (activeVariables && activeVariables.length > 0) {
            exts.push(
                Mention.configure(
                    createMentionConfigWithMantine(activeVariables, maxVisibleRows, maxItems)
                )
            );
        }
        
        return exts;
    }, [activeVariables, maxVisibleRows, maxItems, baseExtensions]);

    const editor = useEditor({
        extensions: editorExtensions,
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
                        className={`${styles.removePadding} ${textInputMode ? styles.textInputMode : ''}`}
                    />
                </RichTextEditor>
            )}
        </Input.Wrapper>
    );
}
