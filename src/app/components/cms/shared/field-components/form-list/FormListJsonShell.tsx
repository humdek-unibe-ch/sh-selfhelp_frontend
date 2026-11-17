/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
'use client';

import { useState, type ReactNode } from 'react';
import { Alert, SegmentedControl, Stack, Text, Textarea } from '@mantine/core';
import { useFieldLabel } from '../../../../shared/common/field-label-context';

interface IFormListJsonShellProps<T> {
    /** The stored text of the field. */
    value: string;
    onChange: (value: string) => void;
    disabled?: boolean;
    /** The decoded value, or null when the stored text is not of the shape the rows can show. */
    parse: (text: string) => T | null;
    /** The rows editor; it gets the decoded value and returns the new stored text through `onChange`. */
    render: (parsed: T) => ReactNode;
    /** The fields of the table are known; without them the rows have nothing to pick from. */
    hasSource: boolean;
    /** What the author is editing, for the notices ("columns", "order", ...). */
    noun: string;
}

/**
 * The frame of every list editor: the rows, and the raw text for the rare thing
 * the rows do not cover (a label translated per language). Never the only way:
 * a value the rows cannot read opens as text with the reason, instead of being hidden.
 */
export function FormListJsonShell<T>({ value, onChange, disabled = false, parse, render, hasSource, noun }: IFormListJsonShellProps<T>) {
    const fieldLabel = useFieldLabel();
    const parsed = parse(value);
    const [mode, setMode] = useState<'rows' | 'text'>('rows');
    const showText = mode === 'text' || parsed === null;

    return (
        <Stack gap="xs">
            {parsed !== null && (
                <SegmentedControl
                    size="xs"
                    value={showText ? 'text' : 'rows'}
                    onChange={(next) => setMode(next === 'text' ? 'text' : 'rows')}
                    data={[
                        { value: 'rows', label: 'Rows' },
                        { value: 'text', label: 'JSON' },
                    ]}
                    disabled={disabled}
                    aria-label={`Edit the ${noun} as rows or as JSON`}
                />
            )}

            {parsed === null && (
                <Alert color="orange" variant="light" title={`The ${noun} are not in a shape the rows can show`}>
                    Fix the text below, or clear it to start again with rows. The section cannot be saved while it is not valid.
                </Alert>
            )}

            {!hasSource && parsed !== null && !showText && (
                <Alert color="blue" variant="light">
                    <Text size="sm">
                        Add the form this list shows records of (inside the list), or choose a data table, then save the
                        section: the fields of the table can then be picked by name here.
                    </Text>
                </Alert>
            )}

            {showText ? (
                <Textarea
                    aria-labelledby={fieldLabel?.id}
                    value={value}
                    onChange={(event) => onChange(event.currentTarget.value)}
                    autosize
                    minRows={4}
                    maxRows={20}
                    spellCheck={false}
                    disabled={disabled}
                    styles={{ input: { fontFamily: 'var(--mantine-font-family-monospace)', fontSize: 12 } }}
                />
            ) : (
                parsed !== null && render(parsed)
            )}
        </Stack>
    );
}
