/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
'use client';

import { Button, Checkbox, Group, Select, Stack, Text, TextInput } from '@mantine/core';
import { IconPlus } from '@tabler/icons-react';
import type { IFormListSource } from '../../../../../../types/responses/admin/admin.types';
import { FormListItemFrame } from './FormListItemFrame';
import { FormListJsonShell } from './FormListJsonShell';
import {
    FORM_LIST_COLUMN_FORMATS,
    FORM_LIST_LIMITS,
    defaultFormatFor,
    fieldOptions,
    flagOf,
    isTranslatedLabel,
    labelOfField,
    moveItem,
    parseObjectList,
    removeItem,
    replaceItem,
    stringifyList,
    textOf,
    typeOfField,
    withKey,
    type TJsonObject,
} from './form-list-editor.utils';
import { useFormListSource } from './FormListSourceContext';

interface IEditorProps {
    value: string;
    onChange: (value: string) => void;
    disabled?: boolean;
}

/**
 * The columns of a list: which fields of the table are shown, under which header,
 * in which order, and which of them visitors can sort and search by.
 */
export function ListColumnsEditor({ value, onChange, disabled = false }: IEditorProps) {
    const source = useFormListSource();

    return (
        <FormListJsonShell
            value={value}
            onChange={onChange}
            disabled={disabled}
            parse={parseObjectList}
            hasSource={source !== null}
            noun="columns"
            render={(items) => <ColumnRows items={items} source={source} disabled={disabled} onItems={(next) => onChange(stringifyList(next))} />}
        />
    );
}

interface IColumnRowsProps {
    items: TJsonObject[];
    source: IFormListSource | null;
    disabled: boolean;
    onItems: (items: TJsonObject[]) => void;
}

function ColumnRows({ items, source, disabled, onItems }: IColumnRowsProps) {
    const used = items.map((item) => textOf(item.field));
    const free = fieldOptions(source, 'column').filter((option) => !used.includes(option.value));
    const atLimit = items.length >= FORM_LIST_LIMITS.columns;

    const addColumn = (field: string) => {
        const type = typeOfField(source, field);
        const format = defaultFormatFor(type, field);
        onItems([...items, withKey(withKey(withKey({ field }, 'label', labelOfField(source, field)), 'sortable', true), 'format', format === 'text' ? '' : format)]);
    };

    const addAll = () => {
        const next = [...items];
        for (const option of free) {
            if (next.length >= FORM_LIST_LIMITS.columns) {
                break;
            }
            const format = defaultFormatFor(option.type, option.value);
            next.push(withKey(withKey(withKey({ field: option.value }, 'label', option.label), 'sortable', true), 'format', format === 'text' ? '' : format));
        }
        onItems(next);
    };

    return (
        <Stack gap="xs">
            {items.length === 0 && (
                <Text size="sm" c="dimmed">
                    No columns: an own-entries list then shows every field of the table; a list of other people&apos;s records needs columns.
                </Text>
            )}

            {items.map((item, index) => {
                const field = textOf(item.field);
                const type = typeOfField(source, field);
                const isRowField = source?.row_fields.some((row) => row.field === field) ?? false;
                const labelIsMap = isTranslatedLabel(item.label);
                const title = `Column ${labelIsMap ? field : textOf(item.label) || field || index + 1}`;
                const options = fieldOptions(source, 'column', [field]).filter((option) => option.value === field || !used.includes(option.value));
                const format = textOf(item.format) || 'text';

                return (
                    <FormListItemFrame
                        key={index}
                        title={title}
                        index={index}
                        count={items.length}
                        disabled={disabled}
                        onMove={(from, to) => onItems(moveItem(items, from, to))}
                        onRemove={() => onItems(removeItem(items, index))}
                    >
                        <Group grow align="flex-start" gap="xs">
                            <Select
                                label="Field"
                                size="xs"
                                data={options.map((option) => ({ value: option.value, label: option.label }))}
                                value={field === '' ? null : field}
                                onChange={(next) => {
                                    if (next === null) {
                                        return;
                                    }
                                    const nextType = typeOfField(source, next);
                                    let updated = withKey(item, 'field', next);
                                    // A column still carrying the readable name of its old field takes the new one.
                                    if (!labelIsMap && (textOf(item.label) === '' || textOf(item.label) === labelOfField(source, field))) {
                                        updated = withKey(updated, 'label', labelOfField(source, next));
                                    }
                                    const nextFormat = defaultFormatFor(nextType, next);
                                    updated = withKey(updated, 'format', nextFormat === 'text' ? '' : nextFormat);
                                    if (source?.row_fields.some((row) => row.field === next)) {
                                        updated = withKey(updated, 'searchable', false);
                                    }
                                    onItems(replaceItem(items, index, updated));
                                }}
                                searchable
                                allowDeselect={false}
                                disabled={disabled}
                            />
                            <Select
                                label="Shown as"
                                size="xs"
                                data={FORM_LIST_COLUMN_FORMATS.map((entry) => ({ value: entry.value, label: entry.label }))}
                                value={format}
                                onChange={(next) => onItems(replaceItem(items, index, withKey(item, 'format', next === null || next === 'text' ? '' : next)))}
                                allowDeselect={false}
                                disabled={disabled}
                            />
                        </Group>
                        <TextInput
                            label="Header"
                            size="xs"
                            value={labelIsMap ? '' : textOf(item.label)}
                            placeholder={labelIsMap ? 'Translated per language (edit as JSON)' : labelOfField(source, field)}
                            onChange={(event) => onItems(replaceItem(items, index, withKey(item, 'label', event.currentTarget.value)))}
                            disabled={disabled || labelIsMap}
                        />
                        <Group gap="md">
                            <Checkbox
                                size="xs"
                                label="Visitors can sort by it"
                                checked={flagOf(item.sortable)}
                                onChange={(event) => onItems(replaceItem(items, index, withKey(item, 'sortable', event.currentTarget.checked)))}
                                disabled={disabled}
                            />
                            <Checkbox
                                size="xs"
                                label="Search looks in it"
                                checked={flagOf(item.searchable)}
                                onChange={(event) => onItems(replaceItem(items, index, withKey(item, 'searchable', event.currentTarget.checked)))}
                                disabled={disabled || isRowField || type === 'boolean'}
                            />
                        </Group>
                    </FormListItemFrame>
                );
            })}

            <Group gap="xs">
                <Select
                    size="xs"
                    placeholder={free.length === 0 ? 'Every field is a column' : 'Add a column…'}
                    aria-label="Add a column"
                    data={free.map((option) => ({ value: option.value, label: option.label }))}
                    value={null}
                    onChange={(next) => {
                        if (next !== null) {
                            addColumn(next);
                        }
                    }}
                    searchable
                    disabled={disabled || atLimit || free.length === 0}
                    style={{ flex: 1 }}
                />
                <Button
                    size="xs"
                    variant="light"
                    leftSection={<IconPlus size={14} />}
                    onClick={addAll}
                    disabled={disabled || atLimit || free.length === 0}
                >
                    Add all
                </Button>
            </Group>
            {atLimit && (
                <Text size="xs" c="dimmed">
                    A list shows at most {FORM_LIST_LIMITS.columns} columns.
                </Text>
            )}
        </Stack>
    );
}
