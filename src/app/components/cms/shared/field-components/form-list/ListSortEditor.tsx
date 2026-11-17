/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
'use client';

import { Button, Group, SegmentedControl, Select, Stack, Text } from '@mantine/core';
import { IconPlus } from '@tabler/icons-react';
import { FormListItemFrame } from './FormListItemFrame';
import { FormListJsonShell } from './FormListJsonShell';
import {
    FORM_LIST_LIMITS,
    fieldOptions,
    labelOfField,
    moveItem,
    parseObjectList,
    removeItem,
    replaceItem,
    stringifyList,
    textOf,
    type TJsonObject,
} from './form-list-editor.utils';
import { useFormListSource } from './FormListSourceContext';

interface IEditorProps {
    value: string;
    onChange: (value: string) => void;
    disabled?: boolean;
}

/** The order a list starts in, before a visitor picks another: up to three fields, each ascending or descending. */
export function ListSortEditor({ value, onChange, disabled = false }: IEditorProps) {
    const source = useFormListSource();

    return (
        <FormListJsonShell
            value={value}
            onChange={onChange}
            disabled={disabled}
            parse={parseObjectList}
            hasSource={source !== null}
            noun="order"
            render={(items) => {
                const used = items.map((item) => textOf(item.field));
                const free = fieldOptions(source, 'sort').filter((option) => !used.includes(option.value));
                const commit = (next: TJsonObject[]) => onChange(stringifyList(next));

                return (
                    <Stack gap="xs">
                        {items.length === 0 && (
                            <Text size="sm" c="dimmed">
                                No order: the newest records come first.
                            </Text>
                        )}
                        {items.map((item, index) => {
                            const field = textOf(item.field);
                            const options = fieldOptions(source, 'sort', [field]).filter((option) => option.value === field || !used.includes(option.value));
                            const title = `Order by ${labelOfField(source, field)}`;

                            return (
                                <FormListItemFrame
                                    key={index}
                                    title={title}
                                    index={index}
                                    count={items.length}
                                    disabled={disabled}
                                    onMove={(from, to) => commit(moveItem(items, from, to))}
                                    onRemove={() => commit(removeItem(items, index))}
                                >
                                    <Group gap="xs" align="flex-end" wrap="nowrap">
                                        <Select
                                            label="Field"
                                            size="xs"
                                            style={{ flex: 1 }}
                                            data={options.map((option) => ({ value: option.value, label: option.label }))}
                                            value={field === '' ? null : field}
                                            onChange={(next) => next !== null && commit(replaceItem(items, index, { ...item, field: next }))}
                                            searchable
                                            allowDeselect={false}
                                            disabled={disabled}
                                        />
                                        <SegmentedControl
                                            size="xs"
                                            aria-label={`Direction of ${title}`}
                                            value={textOf(item.direction) === 'asc' ? 'asc' : 'desc'}
                                            onChange={(next) => commit(replaceItem(items, index, { ...item, direction: next }))}
                                            data={[
                                                { value: 'asc', label: 'Ascending' },
                                                { value: 'desc', label: 'Descending' },
                                            ]}
                                            disabled={disabled}
                                        />
                                    </Group>
                                </FormListItemFrame>
                            );
                        })}
                        <Group>
                            <Button
                                size="xs"
                                variant="light"
                                leftSection={<IconPlus size={14} />}
                                disabled={disabled || free.length === 0 || items.length >= FORM_LIST_LIMITS.sorts}
                                onClick={() => {
                                    const first = free[0];
                                    if (first !== undefined) {
                                        commit([...items, { field: first.value, direction: 'asc' }]);
                                    }
                                }}
                            >
                                Add a field to the order
                            </Button>
                            {items.length >= FORM_LIST_LIMITS.sorts && (
                                <Text size="xs" c="dimmed">
                                    At most {FORM_LIST_LIMITS.sorts} fields.
                                </Text>
                            )}
                        </Group>
                    </Stack>
                );
            }}
        />
    );
}
