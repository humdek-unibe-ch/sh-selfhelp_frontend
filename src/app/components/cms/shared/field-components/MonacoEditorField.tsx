/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
'use client';

import { useMantineColorScheme } from '@mantine/core';
import { MonacoFieldEditor, type TMonacoLanguage } from '../monaco-field-editor/MonacoFieldEditor';

interface IMonacoEditorFieldProps {
    fieldId: number;
    value: string;
    onChange: (value: string) => void;
    language: TMonacoLanguage;
    height?: number;
    disabled?: boolean;
    /** Interpolation variables for the `{{` completion (markdown only). */
    dataVariables?: Record<string, string>;
}

export function MonacoEditorField({
    fieldId,
    value,
    onChange,
    language,
    height = 250,
    disabled = false,
    dataVariables
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
            dataVariables={dataVariables}
        />
    );
}