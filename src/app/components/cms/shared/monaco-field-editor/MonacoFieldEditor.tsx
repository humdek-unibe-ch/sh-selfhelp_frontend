/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
'use client';

import { Box, LoadingOverlay } from '@mantine/core';
import { useEffect, useRef, useState } from 'react';
import type { BeforeMount, EditorProps, Monaco, OnMount } from '@monaco-editor/react';

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
    className
}: IMonacoFieldEditorProps) {
    const [isEditorReady, setIsEditorReady] = useState(false);
    const editorRef = useRef<TMonacoEditorInstance | null>(null);
    const monacoRef = useRef<Monaco | null>(null);
    const currentValueRef = useRef<string>(value || '');

    const config = languageConfig[language];

    // Keep the current value ref in sync
    useEffect(() => {
        currentValueRef.current = value || '';
    }, [value]);

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