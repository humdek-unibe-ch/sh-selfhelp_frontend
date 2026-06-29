/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
'use client';

import React from 'react';
import { Input } from '@mantine/core';
import { RichTextEditor, Link } from '@mantine/tiptap';
import { useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TextAlign from '@tiptap/extension-text-align';
import Placeholder from '@tiptap/extension-placeholder';

import { TextStyle } from '@tiptap/extension-text-style';
import Mention from '@tiptap/extension-mention';
import { Extension, type Extensions } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { buildVariableSuggestions, createMentionConfig, sanitizeForDatabase, tokensToMentionHtml, type IVariableSuggestion } from '../../../../config/mentions.config';
import { MentionSuggestionList } from './MentionSuggestionList';
import { PreserveSpaces } from './PreserveSpacesExtension';
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
    autoFocus = false,
    onKeyDown,
    enableRichTextShortcuts = false,
}: IMentionEditorProps) {
    const isUpdatingRef = React.useRef(false);

    // Convert the `data_variables` token=>label map into picker items: the id is
    // the stable token that gets inserted as `{{token}}`, the label is the human
    // display text the admin sees and searches (issue #56).
    const variables: IVariableSuggestion[] = React.useMemo(
        () => buildVariableSuggestions(dataVariables),
        [dataVariables],
    );

    // Live mirror of the picker items. The Mention extension reads this ref
    // lazily on each `{{` keystroke, so variables that load AFTER the editor
    // mounts appear in the dropdown without rebuilding the editor (issue #56 v2:
    // the section variable map is fetched async, so on first paint it is empty).
    const variablesRef = React.useRef<IVariableSuggestion[]>(variables);
    React.useEffect(() => {
        variablesRef.current = variables;
    }, [variables]);

    // Build extensions array based on mode
    const extensions = React.useMemo(() => {
        const exts: Extensions = [
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
            // Add space preservation for single-line mode
            ...(singleLineMode ? [PreserveSpaces] : []),
        ];

        // Add rich text extensions if not in single line mode OR if rich text shortcuts are enabled
        if (!singleLineMode || enableRichTextShortcuts) {
            exts.push(
                Link,
                TextAlign.configure({ types: ['heading', 'paragraph'] }),
                TextStyle
            );
        }

        // Always register the Mention node so the schema can render label chips
        // even before the variable map has loaded (issue #56 v2). Suggestions are
        // read live from `variablesRef`, so a still-loading or later-updated map
        // never requires recreating the editor.
        exts.push(
            Mention.configure(
                createMentionConfig(() => variablesRef.current, MentionSuggestionList, maxVisibleRows, maxItems)
            )
        );

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
        // `variables` is intentionally excluded: suggestions read `variablesRef`
        // live, so the editor must NOT be rebuilt when the map loads/changes.
    }, [maxVisibleRows, maxItems, singleLineMode, placeholder, enableRichTextShortcuts]);

    const editor = useEditor({
        extensions,
        // Hydrate stored `{{token}}` into label chips for the initial paint
        // (issue #56 v2); the value-sync effect keeps it in step afterwards.
        content: tokensToMentionHtml(value, dataVariables),
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

    // Tracks the variable map last used to hydrate, so we can detect the
    // empty -> loaded transition (the section map is fetched async). Initialised
    // to the mount-time map so an already-cached map doesn't trigger a redundant
    // re-hydrate on the first effect run.
    const lastHydratedVarsRef = React.useRef<Record<string, string> | undefined>(dataVariables);

    // Update editor content when value prop changes externally.
    // The editor can be torn down (Tiptap nulls its schema on destroy) while a
    // stale instance is still referenced here — e.g. when the section inspector
    // remounts the field on a language switch. Reading editor.getHTML() on a
    // destroyed editor throws "Cannot read properties of null (reading 'cached')",
    // so we mirror Tiptap's own bindings and bail out when it is destroyed.
    React.useEffect(() => {
        if (!editor || editor.isDestroyed) {
            return;
        }
        // Compare against the STORED (token) form, not the rendered chip HTML:
        // the editor shows `display_name` chips while `value` holds `{{token}}`.
        // `sanitizeForDatabase`/`getText` are the exact inverse of
        // `tokensToMentionHtml`, so once the editor already holds this value the
        // serialized form equals it and we skip setContent — no caret jump, no
        // re-hydrate loop (issue #56 v2).
        const serialized = (singleLineMode && !enableRichTextShortcuts)
            ? editor.getText()
            : sanitizeForDatabase(editor.getHTML());
        const varsChanged = lastHydratedVarsRef.current !== dataVariables;
        lastHydratedVarsRef.current = dataVariables;

        if (serialized === value) {
            // Value is already in sync. But when the variable map first arrives
            // (empty -> loaded), any stored `{{token}}` is still raw text in the
            // editor — re-hydrate it into chips. Never do this while the admin is
            // typing, so the caret is never yanked (issue #56 v2 first-paint fix).
            if (varsChanged && !editor.isFocused) {
                isUpdatingRef.current = true;
                editor.commands.setContent(tokensToMentionHtml(value, dataVariables));
                setTimeout(() => {
                    isUpdatingRef.current = false;
                }, 0);
            }
            return;
        }
        isUpdatingRef.current = true;
        editor.commands.setContent(tokensToMentionHtml(value, dataVariables));
        setTimeout(() => {
            isUpdatingRef.current = false;
        }, 0);
    }, [editor, value, dataVariables, singleLineMode, enableRichTextShortcuts]);

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

