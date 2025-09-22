'use client';

import React, { useState } from 'react';
import { Input, Button } from '@mantine/core';
import { RichTextEditor, Link } from '@mantine/tiptap';
import { IconCode } from '@tabler/icons-react';
import { useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Placeholder from '@tiptap/extension-placeholder';
import { TextStyle } from '@tiptap/extension-text-style';

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
}: IRichTextFieldProps) {
    const [sourceMode, setSourceMode] = useState(false);
    const [rawHtml, setRawHtml] = useState('');

    const errorMessage = validator ? (validator(value).isValid ? undefined : validator(value).error) : undefined;

    const editor = useEditor({
        extensions: [
            StarterKit,
            Underline,
            Link,
            TextAlign.configure({ types: ['heading', 'paragraph'] }),
            TextStyle,
            Placeholder.configure({
                placeholder: placeholder || 'Start writing...',
            }),
        ],
        content: value,
        onUpdate: ({ editor }) => {
            const html = editor.getHTML();
            const nextValue = sanitize ? sanitize(html) : html;
            onChange(nextValue);
        },
        editable: !disabled,
        immediatelyRender: false, // Fix SSR hydration mismatch
    });

    // Update editor content when value prop changes externally
    React.useEffect(() => {
        if (editor && editor.getHTML() !== value) {
            editor.commands.setContent(value);
        }
    }, [editor, value]);

    const toggleSourceMode = () => {
        if (!sourceMode) {
            // Entering source mode → load HTML into textarea
            setRawHtml(editor?.getHTML() || value);
        } else {
            // Leaving source mode → update editor with raw HTML
            if (editor) {
                editor.commands.setContent(rawHtml, { parseOptions: { preserveWhitespace: true } });
            }
            const nextValue = sanitize ? sanitize(rawHtml) : rawHtml;
            onChange(nextValue);
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

                    <RichTextEditor.Content style={{ minHeight: '200px' }} />
                </RichTextEditor>
            )}
        </Input.Wrapper>
    );
}
