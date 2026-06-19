/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import React, { useState, useEffect, useContext } from 'react';
import { Input } from '@mantine/core';
import { RichTextEditor as MantineRichTextEditor, Link, getTaskListExtension } from '@mantine/tiptap';
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

import { BubbleMenu } from '@tiptap/react/menus';
import styles from './RichTextEditorStyle.module.css';
import { type IRichTextEditorStyle } from '../../../../../../../types/common/styles.types';
import { FormFieldValueContext } from '../../../FormStyle';
import parse from "html-react-parser";
import { sanitizeHtmlForInline } from '../../../../../../../utils/html-sanitizer.utils';
import LanguageTabsWrapper from '../../../shared/LanguageTabsWrapper';
import { getSpacingProps } from '../../../BasicStyle';
/**
 * Props interface for IRichTextEditorStyle component
 */
interface IRichTextEditorStyleProps {
    style: IRichTextEditorStyle;
    styleProps: Record<string, string>;
    cssClass: string;
}

/**
 * Props for the per-language Tiptap editor field.
 */
interface IRichTextEditorFieldProps {
    currentValue: string;
    onValueChange: (value: string) => void;
    name?: string;
    translatable: boolean;
    label?: string;
    description: string;
    required: boolean;
    disabled: boolean;
    variant: string;
    editorPlaceholder: string;
    bubbleMenuEnabled: boolean;
    textColorEnabled: boolean;
    taskListEnabled: boolean;
    styleProps: Record<string, string>;
    spacingProps: Record<string, string>;
    cssClass: string;
}

/**
 * Per-language Tiptap editor extracted into its own component so the Tiptap
 * hooks (`useEditor`, `useEffect`) run inside a real component fiber. Previously
 * this body was a render-prop function that `LanguageTabsWrapper` invoked in a
 * `.map()` loop, which called hooks in a loop (rules-of-hooks). Rendering it as
 * JSX gives each language tab its own fiber and stable hook order.
 */
const RichTextEditorField: React.FC<IRichTextEditorFieldProps> = ({
    currentValue,
    onValueChange,
    name,
    translatable,
    label,
    description,
    required,
    disabled,
    variant,
    editorPlaceholder,
    bubbleMenuEnabled,
    textColorEnabled,
    taskListEnabled,
    styleProps,
    spacingProps,
    cssClass,
}) => {
    // Create Tiptap editor instance for this language
    const languageEditor = useEditor({
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
        content: currentValue, // Use dynamic value for initial content
        onUpdate: ({ editor }) => {
            const html = editor.getHTML();
            onValueChange(html);
        },
        editable: !disabled,
        immediatelyRender: false, // Fix SSR hydration mismatch
    });

    // Update editor content when currentValue changes (for controlled behavior).
    // Guard against a destroyed editor (Tiptap nulls its schema on destroy):
    // calling getHTML() on it throws "Cannot read properties of null (reading 'cached')",
    // which can happen while language tabs remount the editor.
    useEffect(() => {
        if (languageEditor && !languageEditor.isDestroyed && currentValue !== languageEditor.getHTML()) {
            languageEditor.commands.setContent(currentValue);
        }
    }, [languageEditor, currentValue]);

    if (!languageEditor) {
        return <div>Loading editor...</div>;
    }

    return (
        <Input.Wrapper
            label={label}
            description={parse(sanitizeHtmlForInline(description))}
            required={required}
            {...(translatable ? undefined : { ...styleProps, ...spacingProps })} className={translatable ? undefined : cssClass}
        >
            <MantineRichTextEditor
                editor={languageEditor}
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
                {bubbleMenuEnabled && languageEditor && (
                    <BubbleMenu editor={languageEditor}>
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

            {/* Hidden input for form submission - only for non-translatable fields */}
            {!translatable && (
                <input
                    type="hidden"
                    name={name}
                    value={currentValue}
                    required={required}
                />
            )}
        </Input.Wrapper>
    );
};

const RichTextEditorStyle: React.FC<IRichTextEditorStyleProps> = ({ style, styleProps, cssClass }) => {
    const name = style.name?.content;
    const translatable = style.translatable?.content === '1';
    const label = style.label?.content;
    const description = style.description?.content || '';    const initialValue = style.value?.content || '';
    const required = style.is_required?.content === '1';
    const disabled = style.disabled?.content === '1';

    // Mantine styling fields
    const variant = style.web_rich_text_editor_variant?.content || 'default';

    // New advanced fields
    const editorPlaceholder = style.rich_text_editor_placeholder?.content || 'Start writing...';
    const bubbleMenuEnabled = style.web_rich_text_editor_bubble_menu?.content === '1';
    const textColorEnabled = style.web_rich_text_editor_text_color?.content === '1';
    const taskListEnabled = style.web_rich_text_editor_task_list?.content === '1';

    // Handle CSS field - use direct property from API response


    // Get form context for pre-populated values
    const formContext = useContext(FormFieldValueContext);
    const formValue = formContext && name ? formContext.getFieldValue(name) : null;

    // Use form value if available, otherwise use initial value from style
    const [value, setValue] = useState<string | Array<{ language_id: number; value: string }> | null>(formValue || initialValue || '');

    // Keep state in sync with the (async) form value via a render-phase update
    // instead of an effect; the sentinel initial runs it on first render too.
    const [prevFormValue, setPrevFormValue] = useState<unknown>(() => ({}));
    if (prevFormValue !== formValue) {
        setPrevFormValue(formValue);
        if (formValue !== null) {
            setValue(formValue);
        }
    }

    // Handle value change - for LanguageTabsWrapper
    const handleValueChange = (fieldName: string, newValue: string | Array<{ language_id: number; value: string }> | null) => {
        // Update local state
        setValue(newValue);
        // The LanguageTabsWrapper handles the actual form submission via hidden inputs
    };

    // Extract spacing props
    const spacingProps = getSpacingProps(style);

    // Render the per-language editor through a real component (defined above) so
    // the Tiptap hooks run inside their own fiber instead of a render-prop
    // function invoked in a loop (rules-of-hooks).
    const renderRichTextEditor = (_language: unknown, currentValue: string, onValueChange: (value: string) => void) => (
        <RichTextEditorField
            currentValue={currentValue}
            onValueChange={onValueChange}
            name={name}
            translatable={translatable}
            label={label}
            description={description}
            required={required}
            disabled={disabled}
            variant={variant}
            editorPlaceholder={editorPlaceholder}
            bubbleMenuEnabled={bubbleMenuEnabled}
            textColorEnabled={textColorEnabled}
            taskListEnabled={taskListEnabled}
            styleProps={styleProps}
            spacingProps={spacingProps}
            cssClass={cssClass}
        />
    );

    return (
        <LanguageTabsWrapper
            translatable={translatable}
            name={name || ''}
            value={value}
            onChange={handleValueChange}
            className={translatable ? cssClass : undefined}
            styleProps={translatable ? { ...styleProps, ...spacingProps } : styleProps}
        >
            {renderRichTextEditor}
        </LanguageTabsWrapper>
    );
};

export default RichTextEditorStyle;
