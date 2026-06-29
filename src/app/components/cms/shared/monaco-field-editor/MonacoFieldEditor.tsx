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

export type TMonacoLanguage = 'css' | 'json' | 'markdown' | 'sql' | 'html';

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
     * Interpolation variables (`token => label`) for the `{{` completion. Same
     * map the Tiptap mention picker uses, so the picker stays consistent across
     * every editor — Monaco markdown, CSS and JSON fields included (issue #56
     * v2). Omit it for editors that should not offer interpolation.
     */
    dataVariables?: Record<string, string>;
}

// The `{{` completion is a SINGLE global provider per language keyed by model
// URI, so several editors can be mounted without stacking duplicate providers.
// Each editor registers its own variable map under its model URI and removes it
// on unmount; the provider resolves the right map from the triggering model.
// Coverage spans every Monaco-backed CMS field (markdown, custom CSS, JSON) so
// `{{ }}` works wherever code is authored (issue #56 v2).
const modelVariables = new Map<string, Record<string, string>>();
const registeredProviderLanguages = new Set<string>();

function ensureVariableProvider(monaco: Monaco, language: TMonacoLanguage): void {
    if (registeredProviderLanguages.has(language)) {
        return;
    }
    registeredProviderLanguages.add(language);
    const provider: languages.CompletionItemProvider = {
        triggerCharacters: ['{'],
        provideCompletionItems(model, position) {
            const variables = modelVariables.get(model.uri.toString());
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
    monaco.languages.registerCompletionItemProvider(language, provider);
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
    },
    sql: {
        language: 'sql',
        defaultValue: '',
        editorOptions: {
            // Raw SQL filter fragments are short and line-numbers/minimap add
            // noise in the compact data-config field; wrap long WHERE clauses.
            wordWrap: 'on',
            lineNumbers: 'off',
            folding: false,
        }
    },
    html: {
        language: 'html',
        defaultValue: '',
        editorOptions: {
            wordWrap: 'on',
            formatOnPaste: true,
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
        if (modelUriRef.current && dataVariables) {
            modelVariables.set(modelUriRef.current, dataVariables);
        }
    }, [dataVariables]);

    // Drop this model's variables when the field unmounts.
    useEffect(() => {
        return () => {
            if (modelUriRef.current) {
                modelVariables.delete(modelUriRef.current);
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

        // Register the `{{` variable completion. Only editors handed a variable
        // map opt in, but the provider itself spans markdown / CSS / JSON so
        // interpolation works wherever code is authored (issue #56 v2).
        if (dataVariables) {
            const model = editor.getModel();
            if (model) {
                modelUriRef.current = model.uri.toString();
                modelVariables.set(modelUriRef.current, dataVariables);
                ensureVariableProvider(monaco, language);
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