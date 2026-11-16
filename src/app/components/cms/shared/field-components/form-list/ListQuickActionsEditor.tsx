/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
'use client';

import { ActionIcon, Button, Group, Select, Stack, Switch, Text, TextInput } from '@mantine/core';
import { IconPlus, IconTrash } from '@tabler/icons-react';
import type { IFormListSource } from '../../../../../../types/responses/admin/admin.types';
import { FilterGroupEditor } from './FormListFilterEditor';
import { FormListItemFrame } from './FormListItemFrame';
import { FormListJsonShell } from './FormListJsonShell';
import {
    FORM_LIST_LIMITS,
    countConditions,
    emptyGroup,
    fieldOptions,
    isObject,
    isTranslatedLabel,
    moveItem,
    parseObjectList,
    removeItem,
    replaceItem,
    slugId,
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

const WHEN_LIMITS = { conditions: FORM_LIST_LIMITS.whenConditions, depth: FORM_LIST_LIMITS.whenDepth };

/**
 * `quick_actions`: one-click buttons on a record that set fields of the form
 * ("Approve", "Mark done"), optionally only for records that match a condition.
 */
export function ListQuickActionsEditor({ value, onChange, disabled = false }: IEditorProps) {
    const source = useFormListSource();

    return (
        <FormListJsonShell
            value={value}
            onChange={onChange}
            disabled={disabled}
            parse={parseObjectList}
            hasSource={source !== null}
            noun="quick actions"
            render={(items) => <ActionRows items={items} source={source} disabled={disabled} onItems={(next) => onChange(stringifyList(next))} />}
        />
    );
}

interface IActionRowsProps {
    items: TJsonObject[];
    source: IFormListSource | null;
    disabled: boolean;
    onItems: (items: TJsonObject[]) => void;
}

function ActionRows({ items, source, disabled, onItems }: IActionRowsProps) {
    const ids = items.map((item) => textOf(item.id));
    const columns = fieldOptions(source, 'assign');
    const atLimit = items.length >= FORM_LIST_LIMITS.quickActions;

    return (
        <Stack gap="xs">
            {items.length === 0 && (
                <Text size="sm" c="dimmed">
                    No quick actions.
                </Text>
            )}

            {items.map((item, index) => {
                const labelIsMap = isTranslatedLabel(item.label);
                const title = `Action ${labelIsMap ? textOf(item.id) : textOf(item.label) || textOf(item.id) || index + 1}`;
                const set = isObject(item.set) ? item.set : {};
                const when = isObject(item.when) ? item.when : null;

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
                            <TextInput
                                label="Button label"
                                size="xs"
                                value={labelIsMap ? '' : textOf(item.label)}
                                placeholder={labelIsMap ? 'Translated per language (edit as JSON)' : 'Approve'}
                                onChange={(event) => onItems(replaceItem(items, index, { ...item, label: event.currentTarget.value }))}
                                disabled={disabled || labelIsMap}
                            />
                            <TextInput
                                label="Id"
                                size="xs"
                                value={textOf(item.id)}
                                error={/^[a-z][a-z0-9_]{0,31}$/.test(textOf(item.id)) && ids.indexOf(textOf(item.id)) === index ? undefined : 'Unique, starts with a letter'}
                                onChange={(event) => onItems(replaceItem(items, index, { ...item, id: event.currentTarget.value }))}
                                disabled={disabled}
                            />
                        </Group>
                        <TextInput
                            label="Ask first"
                            description="Leave empty to act at once"
                            size="xs"
                            value={textOf(item.confirm)}
                            placeholder="Approve this entry?"
                            onChange={(event) => onItems(replaceItem(items, index, withKey(item, 'confirm', event.currentTarget.value)))}
                            disabled={disabled}
                        />

                        <Text size="xs" fw={600}>
                            Sets
                        </Text>
                        <Assignments
                            set={set}
                            source={source}
                            columns={columns.map((option) => ({ value: option.value, label: option.label }))}
                            disabled={disabled}
                            title={title}
                            onSet={(next) => onItems(replaceItem(items, index, { ...item, set: next }))}
                        />

                        <Switch
                            size="xs"
                            label="Offer it only for records that match"
                            checked={when !== null}
                            onChange={(event) => {
                                const next: TJsonObject = { ...item };
                                if (event.currentTarget.checked) {
                                    next.when = emptyGroup();
                                } else {
                                    delete next.when;
                                }
                                onItems(replaceItem(items, index, next));
                            }}
                            disabled={disabled}
                        />
                        {when !== null && (
                            <FilterGroupEditor
                                group={when}
                                source={source}
                                limits={WHEN_LIMITS}
                                depth={1}
                                total={countConditions(when)}
                                disabled={disabled}
                                label={`${title}: only when`}
                                onChange={(next) => onItems(replaceItem(items, index, { ...item, when: next }))}
                            />
                        )}
                    </FormListItemFrame>
                );
            })}

            <Group>
                <Button
                    size="xs"
                    variant="light"
                    leftSection={<IconPlus size={14} />}
                    disabled={disabled || atLimit || columns.length === 0}
                    onClick={() => {
                        const first = columns[0];
                        if (first !== undefined) {
                            onItems([...items, { id: slugId('action', ids), label: '', set: { [first.value]: first.type === 'boolean' ? '1' : '' } }]);
                        }
                    }}
                >
                    Add a quick action
                </Button>
                {atLimit && (
                    <Text size="xs" c="dimmed">
                        At most {FORM_LIST_LIMITS.quickActions} quick actions.
                    </Text>
                )}
            </Group>
        </Stack>
    );
}

interface IAssignmentsProps {
    set: TJsonObject;
    source: IFormListSource | null;
    columns: Array<{ value: string; label: string }>;
    disabled: boolean;
    title: string;
    onSet: (set: TJsonObject) => void;
}

/** The fields a quick action sets, each to a fixed value. */
function Assignments({ set, source, columns, disabled, title, onSet }: IAssignmentsProps) {
    const entries = Object.entries(set);
    const used = entries.map(([field]) => field);
    const free = columns.filter((column) => !used.includes(column.value));

    const rebuild = (next: Array<[string, unknown]>): TJsonObject => Object.fromEntries(next);

    return (
        <Stack gap={6}>
            {entries.map(([field, assigned], position) => {
                const type = typeOfField(source, field);
                const options = fieldOptions(source, 'assign', [field]).filter((option) => option.value === field || !used.includes(option.value));
                const text = typeof assigned === 'boolean' ? (assigned ? '1' : '0') : textOf(assigned);
                const replaceValue = (next: string) => onSet(rebuild(entries.map(([key, current], at) => (at === position ? [key, next] : [key, current]))));

                return (
                    <Group key={`${field}-${position}`} gap="xs" wrap="nowrap" align="flex-end">
                        <Select
                            size="xs"
                            style={{ flex: 1 }}
                            aria-label={`${title}: field ${position + 1}`}
                            data={options.map((option) => ({ value: option.value, label: option.label }))}
                            value={field}
                            onChange={(next) => {
                                if (next !== null) {
                                    onSet(rebuild(entries.map(([key, current], at) => (at === position ? [next, typeOfField(source, next) === 'boolean' ? '1' : ''] : [key, current]))));
                                }
                            }}
                            searchable
                            allowDeselect={false}
                            disabled={disabled}
                        />
                        {type === 'boolean' ? (
                            <Select
                                size="xs"
                                style={{ flex: 1 }}
                                aria-label={`${title}: value ${position + 1}`}
                                data={[
                                    { value: '1', label: 'Yes' },
                                    { value: '0', label: 'No' },
                                ]}
                                value={text === '0' ? '0' : '1'}
                                onChange={(next) => replaceValue(next ?? '1')}
                                allowDeselect={false}
                                disabled={disabled}
                            />
                        ) : (
                            <TextInput
                                size="xs"
                                style={{ flex: 1 }}
                                type={type === 'number' ? 'number' : type === 'date' ? 'date' : 'text'}
                                aria-label={`${title}: value ${position + 1}`}
                                placeholder="Value"
                                value={text}
                                onChange={(event) => replaceValue(event.currentTarget.value)}
                                disabled={disabled}
                            />
                        )}
                        <ActionIcon
                            size="sm"
                            variant="subtle"
                            color="red"
                            aria-label={`${title}: remove assignment ${position + 1}`}
                            onClick={() => onSet(rebuild(entries.filter((_, at) => at !== position)))}
                            disabled={disabled || entries.length <= 1}
                        >
                            <IconTrash size={14} />
                        </ActionIcon>
                    </Group>
                );
            })}
            <Group>
                <Button
                    size="compact-xs"
                    variant="subtle"
                    leftSection={<IconPlus size={12} />}
                    disabled={disabled || free.length === 0 || entries.length >= FORM_LIST_LIMITS.assignments}
                    onClick={() => {
                        const first = free[0];
                        if (first !== undefined) {
                            onSet({ ...set, [first.value]: typeOfField(source, first.value) === 'boolean' ? '1' : '' });
                        }
                    }}
                >
                    Set another field
                </Button>
            </Group>
        </Stack>
    );
}
