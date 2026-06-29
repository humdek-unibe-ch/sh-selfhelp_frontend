/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
'use client';

import { Box, LoadingOverlay } from '@mantine/core';
import { useEffect, useRef, useState } from 'react';
import type { BeforeMount, EditorProps, Monaco, OnMount } from '@monaco-editor/react';
import type { languages } from 'monaco-editor';

// Dynamic import for Monaco Editor to avoid SSR issues
import dynamic from 'next/dynamic';
const MonacoEditor = dynamic(() => import('@monaco-editor/react'), { 
    ssr: false,
    loading: () => <LoadingOverlay visible />
});

export type TMonacoLanguage = 'css' | 'json' | 'markdown';

/** The Monaco editor instance handed to `onMount`. */
type TMonacoEditorInstance = Parameters<OnMount>[0];

interface IMonacoFieldEditorProps {
    value: string;
    onChange: (value: string) => void;
    language: TMonacoLanguage;
    height?: number | string;
    readOnly?: boolean;
    theme?: 'vs' | 'vs-dark' | 'hc-black';
    className?: string;
    /**
     * Interpolation variables (`token => label`) for the `{{` completion in
     * markdown fields. Same map the Tiptap mention picker uses, so the picker
     * stays consistent across editors (issue #56 v2). Ignored for `json`/`css`.
     */
    dataVariables?: Record<string, string>;
}

// Markdown `{{` completion is a SINGLE global provider keyed by model URI, so
// several markdown editors can be mounted without stacking duplicate providers.
// Each editor registers its own variable map under its model URI and removes it
// on unmount; the provider resolves the right map from the triggering model.
const markdownModelVariables = new Map<string, Record<string, string>>();
let markdownVariableProvider: { dispose(): void } | null = null;

function ensureMarkdownVariableProvider(monaco: Monaco): void {
    if (markdownVariableProvider) {
        return;
    }
    const provider: languages.CompletionItemProvider = {
        triggerCharacters: ['{'],
        provideCompletionItems(model, position) {
            const variables = markdownModelVariables.get(model.uri.toString());
            if (!variables || Object.keys(variables).length === 0) {
                return { suggestions: [] };
            }

            const textUntil = model.getValueInRange({
                startLineNumber: position.lineNumber,
                startColumn: 1,
                endLineNumber: position.lineNumber,
                endColumn: position.column,
            });
            // Only suggest once the author has opened a `{{` interpolation.
            const opened = textUntil.match(/\{\{\s*([\w.]*)$/);
            if (!opened) {
                return { suggestions: [] };
            }
            const query = opened[1] ?? '';

            const textAfter = model.getValueInRange({
                startLineNumber: position.lineNumber,
                startColumn: position.column,
                endLineNumber: position.lineNumber,
                endColumn: model.getLineMaxColumn(position.lineNumber),
            });
            // Don't double the closing braces if the editor auto-closed `{{`.
            const closing = textAfter.startsWith('}}') ? '' : '}}';

            const range = {
                startLineNumber: position.lineNumber,
                startColumn: position.column - query.length,
                endLineNumber: position.lineNumber,
                endColumn: position.column,
            };

            const suggestions = Object.entries(variables).map(([token, label]) => ({
                label: label || token,
                kind: monaco.languages.CompletionItemKind.Variable,
                detail: token,
                // Insert the immutable token; the human label is only shown in
                // the dropdown so storage stays `{{token}}` (issue #56 v2).
                insertText: `${token}${closing}`,
                filterText: `${label} ${token}`.trim(),
                range,
            }));

            return { suggestions };
        },
    };
    markdownVariableProvider = monaco.languages.registerCompletionItemProvider('markdown', provider);
}

const languageConfig: Record<TMonacoLanguage, {
    language: string;
    defaultValue: string;
    editorOptions?: EditorProps['options'];
}> = {
    css: {
        language: 'css',
        defaultValue: '/* Enter your CSS here */\n',
        editorOptions: {
            formatOnType: true,
            formatOnPaste: true,
        }
    },
    json: {
        language: 'json',
        defaultValue: '{\n  \n}',
        editorOptions: {
            formatOnType: true,
            formatOnPaste: true,
        }
    },
    markdown: {
        language: 'markdown',
        defaultValue: '# Markdown\n\nEnter your content here...\n',
        editorOptions: {
            wordWrap: 'on',
            wrappingIndent: 'indent',
        }
    }
};

export function MonacoFieldEditor({
    value,
    onChange,
    language,
    height = 300,
    readOnly = false,
    theme = 'vs',
    className,
    dataVariables
}: IMonacoFieldEditorProps) {
    const [isEditorReady, setIsEditorReady] = useState(false);
    const editorRef = useRef<TMonacoEditorInstance | null>(null);
    const monacoRef = useRef<Monaco | null>(null);
    const currentValueRef = useRef<string>(value || '');
    const modelUriRef = useRef<string | null>(null);

    const config = languageConfig[language];

    // Keep the current value ref in sync
    useEffect(() => {
        currentValueRef.current = value || '';
    }, [value]);

    // Keep this model's `{{` completion variables current as they load/change.
    useEffect(() => {
        if (language === 'markdown' && modelUriRef.current && dataVariables) {
            markdownModelVariables.set(modelUriRef.current, dataVariables);
        }
    }, [language, dataVariables]);

    // Drop this model's variables when the field unmounts.
    useEffect(() => {
        return () => {
            if (modelUriRef.current) {
                markdownModelVariables.delete(modelUriRef.current);
            }
        };
    }, []);

    const handleBeforeMount: BeforeMount = (monaco) => {
        monacoRef.current = monaco;
        
        // Set up JSON schema validation if needed
        if (language === 'json') {
            monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
                validate: true,
                schemas: []
            });
        }
    };

    const handleMount: OnMount = (editor, monaco) => {
        editorRef.current = editor;
        monacoRef.current = monaco;
        setIsEditorReady(true);

        // Register the `{{` variable completion for markdown fields only.
        if (language === 'markdown') {
            const model = editor.getModel();
            if (model) {
                modelUriRef.current = model.uri.toString();
                if (dataVariables) {
                    markdownModelVariables.set(modelUriRef.current, dataVariables);
                }
                ensureMarkdownVariableProvider(monaco);
            }
        }

        // Format document on mount for better initial display
        setTimeout(() => {
            void editor.getAction('editor.action.formatDocument')?.run();
        }, 100);
    };

    const handleChange = (newValue: string | undefined) => {
        const value = newValue || '';
        currentValueRef.current = value; // Keep ref in sync
        
        // Ensure the onChange is called immediately with the new value
        onChange(value);
    };

    // Expose a method to get the current value (in case form needs it)
    useEffect(() => {
        if (isEditorReady && editorRef.current) {
            // Add a custom method to get current value
            (editorRef.current as TMonacoEditorInstance & { getCurrentValue?: () => string }).getCurrentValue = () => {
                return editorRef.current?.getValue() || currentValueRef.current;
            };
        }
    }, [isEditorReady]);

    const editorOptions: EditorProps['options'] = {
        selectOnLineNumbers: true,
        minimap: {
            enabled: false
        },
        scrollBeyondLastLine: false,
        automaticLayout: true,
        fontSize: 14,
        lineNumbers: 'on',
        renderWhitespace: 'selection',
        readOnly,
        ...config.editorOptions
    };

    return (
        <Box className={className} style={{ position: 'relative' }}>
            <MonacoEditor
                height={height}
                language={config.language}
                theme={theme}
                value={value !== undefined && value !== null ? value : config.defaultValue}
                options={editorOptions}
                onChange={handleChange}
                beforeMount={handleBeforeMount}
                onMount={handleMount}
            />
        </Box>
    );
} 