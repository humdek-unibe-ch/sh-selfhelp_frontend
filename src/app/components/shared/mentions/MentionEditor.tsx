'use client';

import React from 'react';
import { Input } from '@mantine/core';
import { RichTextEditor } from '@mantine/tiptap';
import { useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Placeholder from '@tiptap/extension-placeholder';
import { Link } from '@mantine/tiptap';
import { TextStyle } from '@tiptap/extension-text-style';
import Mention from '@tiptap/extension-mention';
import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { createMentionConfig, sanitizeForDatabase, IVariableSuggestion } from '../../../../config/mentions.config';
import { MentionSuggestionList } from './MentionSuggestionList';
import styles from './MentionEditor.module.css';

interface IMentionEditorProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    disabled?: boolean;
    label?: string;
    description?: string;
    required?: boolean;
    error?: string;
    dataVariables?: Record<string, string>;
    maxVisibleRows?: number;
    maxItems?: number;
    /** If true, editor acts like a single-line text input without rich text features */
    singleLineMode?: boolean;
    /** If true, shows rich text toolbar (only applies when singleLineMode is false) */
    showToolbar?: boolean;
    /** If true, prevents auto-focus when the editor mounts */
    autoFocus?: boolean;
    /** Callback for key down events */
    onKeyDown?: (event: React.KeyboardEvent) => void;
    /** If true and singleLineMode is true, enables rich text formatting shortcuts (bold, italic, underline) */
    enableRichTextShortcuts?: boolean;
}

/**
 * MentionEditor Component
 * 
 * A unified Tiptap-based editor that supports mentions with two modes:
 * 1. Rich Text Mode: Full rich text editing with mentions
 * 2. Single Line Mode: Plain text input with mentions (no line breaks, no HTML)
 * 
 * Both modes share the same mention configuration for consistency.
 */
export function MentionEditor({
    value,
    onChange,
    placeholder = 'Start typing...',
    disabled = false,
    label,
    description,
    required = false,
    error,
    dataVariables,
    maxVisibleRows = 5,
    maxItems = 50,
    singleLineMode = false,
    showToolbar = true,
    autoFocus = true,
    onKeyDown,
    enableRichTextShortcuts = false,
}: IMentionEditorProps) {
    const isUpdatingRef = React.useRef(false);

    // Convert dataVariables to IVariableSuggestion array
    const variables: IVariableSuggestion[] = React.useMemo(() => {
        if (!dataVariables) return [];
        return Object.values(dataVariables).map((variableName) => ({
            id: variableName,
            label: variableName,
        }));
    }, [dataVariables]);

    // Build extensions array based on mode
    const extensions = React.useMemo(() => {
        const exts: any[] = [
            StarterKit.configure({
                // In single line mode, disable all block-level elements
                heading: singleLineMode ? false : undefined,
                blockquote: singleLineMode ? false : undefined,
                bulletList: singleLineMode ? false : undefined,
                orderedList: singleLineMode ? false : undefined,
                listItem: singleLineMode ? false : undefined,
                codeBlock: singleLineMode ? false : undefined,
                horizontalRule: singleLineMode ? false : undefined,
                paragraph: singleLineMode ? { HTMLAttributes: { class: 'single-line-paragraph' } } : undefined,
                // Explicitly disable extensions that might conflict
                link: false,
            }),
            Placeholder.configure({
                placeholder,
            }),
        ];

        // Add rich text extensions if not in single line mode OR if rich text shortcuts are enabled
        if (!singleLineMode || enableRichTextShortcuts) {
            exts.push(
                Link,
                TextAlign.configure({ types: ['heading', 'paragraph'] }),
                TextStyle
            );
        }

        // Add mention extension if variables are available
        if (variables.length > 0) {
            exts.push(
                Mention.configure(
                    createMentionConfig(variables, MentionSuggestionList, maxVisibleRows, maxItems)
                )
            );
        }

        // In single line mode, prevent Enter key from creating new lines
        if (singleLineMode) {
            exts.push(
                Extension.create({
                    name: 'preventNewLines',
                    addProseMirrorPlugins() {
                        return [
                            new Plugin({
                                key: new PluginKey('preventNewLines'),
                                props: {
                                    handleKeyDown: (view, event) => {
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

            // Prevent multiline paste
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
                                            const singleLineText = text
                                                .replace(/\n/g, ' ')
                                                .replace(/\r/g, ' ');
                                            const { tr } = view.state;
                                            const transaction = tr.insertText(singleLineText);
                                            view.dispatch(transaction);
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

        return exts;
    }, [variables, maxVisibleRows, maxItems, singleLineMode, placeholder, enableRichTextShortcuts]);

    const editor = useEditor({
        extensions,
        content: value,
        onUpdate: ({ editor }) => {
            if (isUpdatingRef.current) return;

            if (singleLineMode && !enableRichTextShortcuts) {
                // In single line mode without rich text shortcuts, extract plain text with mentions
                const text = editor.getText();
                onChange(text);
            } else {
                // In rich text mode or single line with rich text shortcuts, get HTML and sanitize for database
                const html = editor.getHTML();
                const sanitized = sanitizeForDatabase(html);
                onChange(sanitized);
            }
        },
        editable: !disabled,
        immediatelyRender: false,
        autofocus: autoFocus,
    });

    // Update editor content when value prop changes externally
    React.useEffect(() => {
        if (editor && editor.getHTML() !== value) {
            isUpdatingRef.current = true;
            editor.commands.setContent(value);
            setTimeout(() => {
                isUpdatingRef.current = false;
            }, 0);
        }
    }, [editor, value]);

    return (
        <Input.Wrapper label={label} description={description} required={required} error={error}>
            <RichTextEditor editor={editor}>
                {!singleLineMode && showToolbar && (
                    <RichTextEditor.Toolbar>
                        <RichTextEditor.ControlsGroup>
                            <RichTextEditor.Bold />
                            <RichTextEditor.Italic />
                            <RichTextEditor.Underline />
                            <RichTextEditor.Strikethrough />
                            <RichTextEditor.ClearFormatting />
                            <RichTextEditor.Highlight />
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
                        </RichTextEditor.ControlsGroup>
                    </RichTextEditor.Toolbar>
                )}

                <RichTextEditor.Content
                    className={singleLineMode ? styles.singleLineEditor : styles.richTextEditor}
                    onKeyDown={onKeyDown}
                />
            </RichTextEditor>
        </Input.Wrapper>
    );
}

