'use client';

import { Box, LoadingOverlay } from '@mantine/core';
import { useEffect, useRef, useState } from 'react';
import { debug } from '../../../../../utils/debug-logger';

// Dynamic import for Monaco Editor to avoid SSR issues
import dynamic from 'next/dynamic';
const MonacoEditor = dynamic(() => import('@monaco-editor/react'), { 
    ssr: false,
    loading: () => <LoadingOverlay visible />
});

export type TMonacoLanguage = 'css' | 'json' | 'markdown';

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
    editorOptions?: any;
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
            validateOnType: true,
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
    const editorRef = useRef<any>(null);
    const monacoRef = useRef<any>(null);

    const config = languageConfig[language];

    useEffect(() => {
        debug('MonacoFieldEditor mounted', 'MonacoFieldEditor', {
            language,
            valueLength: value?.length || 0,
            readOnly
        });
    }, [language, value, readOnly]);

    const handleBeforeMount = (monaco: any) => {
        monacoRef.current = monaco;
        
        // Set up JSON schema validation if needed
        if (language === 'json') {
            monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
                validate: true,
                schemas: []
            });
        }
    };

    const handleMount = (editor: any, monaco: any) => {
        editorRef.current = editor;
        monacoRef.current = monaco;
        setIsEditorReady(true);

        debug('Monaco Editor mounted', 'MonacoFieldEditor', {
            language: config.language
        });

        // Format document on mount for better initial display
        setTimeout(() => {
            editor.getAction('editor.action.formatDocument')?.run();
        }, 100);
    };

    const handleChange = (newValue: string | undefined) => {
        const value = newValue || '';
        debug('Monaco Editor value changed', 'MonacoFieldEditor', {
            language,
            newValueLength: value.length,
            oldValueLength: value.length
        });
        onChange(value);
    };

    const editorOptions = {
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
                value={value || config.defaultValue}
                options={editorOptions}
                onChange={handleChange}
                beforeMount={handleBeforeMount}
                onMount={handleMount}
            />
        </Box>
    );
} 