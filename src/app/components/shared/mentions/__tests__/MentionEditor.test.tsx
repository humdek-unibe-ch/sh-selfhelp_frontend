/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import type { ReactNode } from 'react';
import { renderWithProviders } from '../../../../../test-utils/renderWithProviders';

/**
 * Regression coverage for the section-inspector crash:
 *   "Cannot read properties of null (reading 'cached')" at MentionEditor.useEffect.
 *
 * Tiptap v3 nulls the editor schema in destroy(), so calling editor.getHTML() on a
 * destroyed-but-still-referenced instance throws. That instance is handed to us while
 * the section inspector remounts the field on a language switch. The value-sync effect
 * must mirror Tiptap's own bindings and bail out when editor.isDestroyed is true.
 *
 * useEditor is stubbed with a fake editor whose getHTML() throws exactly like the real
 * one when destroyed, so the guard is what keeps the render from crashing. @mantine/tiptap
 * is stubbed so the test isolates our effect rather than the Tiptap view lifecycle.
 */
const editorMock = vi.hoisted(() => {
    const setContent = vi.fn();
    const editor: {
        isDestroyed: boolean;
        html: string;
        getHTML: ReturnType<typeof vi.fn>;
        getText: ReturnType<typeof vi.fn>;
        commands: { setContent: ReturnType<typeof vi.fn> };
    } = {
        isDestroyed: false,
        html: '<p></p>',
        getHTML: vi.fn(() => {
            if (editor.isDestroyed) {
                throw new TypeError("Cannot read properties of null (reading 'cached')");
            }
            return editor.html;
        }),
        getText: vi.fn(() => ''),
        commands: { setContent },
    };
    return { editor, setContent };
});

vi.mock('@tiptap/react', () => ({
    useEditor: () => editorMock.editor,
}));

vi.mock('@mantine/tiptap', () => ({
    RichTextEditor: Object.assign(({ children }: { children?: ReactNode }) => <div>{children}</div>, {
        Content: () => <div data-testid="mention-content" />,
    }),
    Link: {},
}));

import { MentionEditor } from '../MentionEditor';

describe('MentionEditor external value sync', () => {
    beforeEach(() => {
        editorMock.editor.isDestroyed = false;
        editorMock.editor.html = '<p></p>';
        editorMock.editor.getHTML.mockClear();
        editorMock.editor.getText.mockClear();
        editorMock.setContent.mockClear();
    });

    afterEach(() => cleanup());

    it('does not read a destroyed editor when the external value changes', () => {
        editorMock.editor.isDestroyed = true;

        expect(() =>
            renderWithProviders(
                <MentionEditor value="hello {{name}}" onChange={() => {}} singleLineMode showToolbar={false} />,
            ),
        ).not.toThrow();

        expect(editorMock.editor.getHTML).not.toHaveBeenCalled();
        expect(editorMock.setContent).not.toHaveBeenCalled();
    });

    it('pushes a changed external value into a live editor', () => {
        editorMock.editor.html = '<p>old</p>';

        renderWithProviders(
            <MentionEditor value="new value" onChange={() => {}} singleLineMode showToolbar={false} />,
        );

        expect(editorMock.setContent).toHaveBeenCalledWith('new value');
    });

    it('leaves a live editor untouched when the value already matches', () => {
        editorMock.editor.html = 'already in sync';

        renderWithProviders(
            <MentionEditor value="already in sync" onChange={() => {}} singleLineMode showToolbar={false} />,
        );

        expect(editorMock.setContent).not.toHaveBeenCalled();
    });
});
