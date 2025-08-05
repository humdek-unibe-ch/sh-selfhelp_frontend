'use client';

import { useMantineColorScheme } from '@mantine/core';
import { MonacoFieldEditor, TMonacoLanguage } from '../monaco-field-editor/MonacoFieldEditor';

interface IMonacoEditorFieldProps {
    fieldId: number;
    value: string;
    onChange: (value: string) => void;
    language: TMonacoLanguage;
    height?: number;
    disabled?: boolean;
}

export function MonacoEditorField({
    fieldId,
    value,
    onChange,
    language,
    height = 250,
    disabled = false
}: IMonacoEditorFieldProps) {
    const { colorScheme } = useMantineColorScheme();

    return (
        <MonacoFieldEditor
            key={fieldId}
            value={value}
            onChange={(newValue) => {
                // Ensure the change is propagated immediately
                onChange(newValue);
            }}
            language={language}
            height={height}
            readOnly={disabled}
            theme={colorScheme === 'dark' ? 'vs-dark' : 'vs'}
        />
    );
}