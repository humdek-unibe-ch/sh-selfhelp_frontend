import React, { useState, useEffect } from 'react';
import { Input } from '@mantine/core';
import { RichTextEditor as MantineRichTextEditor, Link } from '@mantine/tiptap';
import { useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Highlight from '@tiptap/extension-highlight';
import TextAlign from '@tiptap/extension-text-align';
import Superscript from '@tiptap/extension-superscript';
import SubScript from '@tiptap/extension-subscript';
import Underline from '@tiptap/extension-underline';
import Placeholder from '@tiptap/extension-placeholder';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import TaskItem from '@tiptap/extension-task-item';
import TipTapTaskList from '@tiptap/extension-task-list';
import { getTaskListExtension } from '@mantine/tiptap';
import { BubbleMenu } from '@tiptap/react/menus';
import { getFieldContent } from '../../../../../../utils/style-field-extractor';
import { IRichTextEditorStyle } from '../../../../../../types/common/styles.types';
import styles from './RichTextEditorStyle.module.css';

interface IRichTextEditorStyleProps {
    style: IRichTextEditorStyle;
}

const RichTextEditorStyle: React.FC<IRichTextEditorStyleProps> = ({ style }) => {
    // Extract field values
    const use_mantine_style = getFieldContent(style, 'use_mantine_style') === '1';

    const name = getFieldContent(style, 'name');
    const label = getFieldContent(style, 'label');
    const description = getFieldContent(style, 'description');
    const placeholder = getFieldContent(style, 'placeholder');
    const initialValue = getFieldContent(style, 'value') || '';
    const required = getFieldContent(style, 'is_required') === '1';
    const disabled = getFieldContent(style, 'disabled') === '1';

    // Mantine styling fields
    const variant = getFieldContent(style, 'mantine_rich_text_editor_variant') || 'default';

    // New advanced fields
    const editorPlaceholder = getFieldContent(style, 'mantine_rich_text_editor_placeholder') || 'Start writing...';
    const bubbleMenuEnabled = getFieldContent(style, 'mantine_rich_text_editor_bubble_menu') === '1';
    const textColorEnabled = getFieldContent(style, 'mantine_rich_text_editor_text_color') === '1';
    const taskListEnabled = getFieldContent(style, 'mantine_rich_text_editor_task_list') === '1';

    // Handle CSS field - use direct property from API response
    const cssClass = "section-" + style.id + " " + (style.css ?? '');

    // State for controlled input
    const [value, setValue] = useState(initialValue);

    // Create Tiptap editor instance
    const editor = useEditor({
        extensions: [
            StarterKit.configure({ link: false }),
            Link,
            Superscript,
            SubScript,
            Highlight,
            Underline,
            TextAlign.configure({ types: ['heading', 'paragraph'] }),
            Placeholder.configure({
                placeholder: editorPlaceholder,
            }),
            // Conditionally add extensions based on configuration
            ...(textColorEnabled ? [
                TextStyle,
                Color,
            ] : []),
            ...(taskListEnabled ? [
                getTaskListExtension(TipTapTaskList),
                TaskItem.configure({
                    nested: true,
                    HTMLAttributes: {
                        class: 'test-item',
                    },
                }),
            ] : []),
        ],
        content: initialValue, // Use initialValue for initial content
        onUpdate: ({ editor }) => {
            const html = editor.getHTML();
            setValue(html);
        },
        editable: !disabled,
        immediatelyRender: false, // Fix SSR hydration mismatch
    });

    // Update editor content when initialValue changes (for controlled behavior)
    useEffect(() => {
        if (editor && initialValue !== editor.getHTML()) {
            editor.commands.setContent(initialValue);
            setValue(initialValue);
        }
    }, [editor, initialValue]);

    // Fallback: Render basic textarea with only CSS and name when Mantine styling is disabled
    if (!use_mantine_style) {
        return (
            <Input.Wrapper
                label={label}
                description={description}
                required={required}
                className={cssClass}
            >
                <textarea
                    name={name}
                    className="basic-textarea"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    disabled={disabled}
                    required={required}
                    placeholder={placeholder}
                    rows={10}
                    style={{
                        width: '100%',
                        padding: '8px',
                        border: '1px solid #ccc',
                        borderRadius: '4px',
                        fontFamily: 'inherit',
                        minHeight: '200px',
                        resize: 'vertical'
                    }}
                />
            </Input.Wrapper>
        );
    }

    if (!editor) {
        return <div>Loading editor...</div>;
    }

    return (
        <Input.Wrapper
            label={label}
            description={description}
            required={required}
            className={cssClass}
        >
            <MantineRichTextEditor
                editor={editor}
                variant={variant as 'default' | 'subtle'}
            >
                <MantineRichTextEditor.Toolbar sticky stickyOffset="60px">
                    <MantineRichTextEditor.ControlsGroup>
                        <MantineRichTextEditor.Bold />
                        <MantineRichTextEditor.Italic />
                        <MantineRichTextEditor.Underline />
                        <MantineRichTextEditor.Strikethrough />
                        <MantineRichTextEditor.ClearFormatting />
                        <MantineRichTextEditor.Code />
                        <MantineRichTextEditor.Highlight />
                    </MantineRichTextEditor.ControlsGroup>

                    <MantineRichTextEditor.ControlsGroup>
                        <MantineRichTextEditor.H1 />
                        <MantineRichTextEditor.H2 />
                        <MantineRichTextEditor.H3 />
                        <MantineRichTextEditor.H4 />
                    </MantineRichTextEditor.ControlsGroup>

                    <MantineRichTextEditor.ControlsGroup>
                        <MantineRichTextEditor.Blockquote />
                        <MantineRichTextEditor.Hr />
                        <MantineRichTextEditor.BulletList />
                        <MantineRichTextEditor.OrderedList />
                        {taskListEnabled && (
                            <>
                                <MantineRichTextEditor.TaskList />
                                <MantineRichTextEditor.TaskListLift />
                                <MantineRichTextEditor.TaskListSink />
                            </>
                        )}
                    </MantineRichTextEditor.ControlsGroup>

                    <MantineRichTextEditor.ControlsGroup>
                        <MantineRichTextEditor.Link />
                        <MantineRichTextEditor.Unlink />
                    </MantineRichTextEditor.ControlsGroup>

                    <MantineRichTextEditor.ControlsGroup>
                        <MantineRichTextEditor.AlignLeft />
                        <MantineRichTextEditor.AlignCenter />
                        <MantineRichTextEditor.AlignJustify />
                        <MantineRichTextEditor.AlignRight />
                    </MantineRichTextEditor.ControlsGroup>

                    {textColorEnabled && (
                        <MantineRichTextEditor.ControlsGroup>
                            <MantineRichTextEditor.ColorPicker
                                colors={[
                                    '#25262b', '#868e96', '#fa5252', '#e64980', '#be4bdb', '#7950f2', '#4c6ef5',
                                    '#228be6', '#15aabf', '#12b886', '#40c057', '#82c91e', '#fab005', '#fd7e14'
                                ]}
                            />
                            <MantineRichTextEditor.UnsetColor />
                        </MantineRichTextEditor.ControlsGroup>
                    )}

                    <MantineRichTextEditor.ControlsGroup>
                        <MantineRichTextEditor.Undo />
                        <MantineRichTextEditor.Redo />
                    </MantineRichTextEditor.ControlsGroup>
                </MantineRichTextEditor.Toolbar>

                {/* Bubble menu for quick formatting when text is selected */}
                {bubbleMenuEnabled && editor && (
                    <BubbleMenu editor={editor}>
                        <MantineRichTextEditor.ControlsGroup>
                            <MantineRichTextEditor.Bold />
                            <MantineRichTextEditor.Italic />
                            <MantineRichTextEditor.Underline />
                            <MantineRichTextEditor.Strikethrough />
                            {taskListEnabled && <MantineRichTextEditor.TaskList />}
                            {textColorEnabled && <MantineRichTextEditor.ColorPicker colors={['#25262b', '#fa5252', '#e64980', '#7950f2', '#4c6ef5', '#228be6', '#12b886', '#40c057', '#fab005', '#fd7e14']} />}
                            <MantineRichTextEditor.Link />
                        </MantineRichTextEditor.ControlsGroup>
                    </BubbleMenu>
                )}

                <MantineRichTextEditor.Content
                    className={styles.editorContent}
                    style={{
                        minHeight: '200px',
                        padding: '16px'
                    }}
                />
            </MantineRichTextEditor>

            {/* Hidden input for form submission */}
            <input
                type="hidden"
                name={name}
                value={value}
                required={required}
            />
        </Input.Wrapper>
    );
};

export default RichTextEditorStyle;
