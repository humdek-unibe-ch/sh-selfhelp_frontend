/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
'use client';

import { ActionIcon, Button, Checkbox, Group, Select, Stack, Text, TextInput } from '@mantine/core';
import { IconPlus, IconTrash } from '@tabler/icons-react';
import type { IFormListSource } from '../../../../../../types/responses/admin/admin.types';
import { FormListItemFrame } from './FormListItemFrame';
import { FormListJsonShell } from './FormListJsonShell';
import {
    FORM_LIST_CONTROL_TYPES,
    FORM_LIST_LIMITS,
    FORM_LIST_TEXT_MATCHES,
    controlTypeFor,
    fieldFitsControl,
    fieldOptions,
    isObject,
    isTranslatedLabel,
    labelOfField,
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

/** The controls visitors filter a list with: a text search, choices, a switch, a date or number range. */
export function ListControlsEditor({ value, onChange, disabled = false }: IEditorProps) {
    const source = useFormListSource();

    return (
        <FormListJsonShell
            value={value}
            onChange={onChange}
            disabled={disabled}
            parse={parseObjectList}
            hasSource={source !== null}
            noun="controls"
            render={(items) => <ControlRows items={items} source={source} disabled={disabled} onItems={(next) => onChange(stringifyList(next))} />}
        />
    );
}

interface IControlRowsProps {
    items: TJsonObject[];
    source: IFormListSource | null;
    disabled: boolean;
    onItems: (items: TJsonObject[]) => void;
}

function ControlRows({ items, source, disabled, onItems }: IControlRowsProps) {
    const ids = items.map((item) => textOf(item.id));
    const fields = fieldOptions(source, 'column');
    const atLimit = items.length >= FORM_LIST_LIMITS.controls;

    const addControl = (field: string) => {
        const type = typeOfField(source, field);
        const label = labelOfField(source, field);
        const control: TJsonObject = {
            id: slugId(label === field ? field : label, ids),
            type: controlTypeFor(type),
            field,
            label,
        };
        if (control.type === 'text') {
            // A short text field is searched by choosing from what was entered; a long one by typing.
            control.type = 'select';
            control.options_from = 'data';
        }
        onItems([...items, control]);
    };

    return (
        <Stack gap="xs">
            {items.length === 0 && (
                <Text size="sm" c="dimmed">
                    No controls: visitors can only search, sort and page.
                </Text>
            )}

            {items.map((item, index) => {
                const field = textOf(item.field);
                const controlType = textOf(item.type) || 'text';
                const fieldType = typeOfField(source, field);
                const labelIsMap = isTranslatedLabel(item.label);
                const options = fieldOptions(source, 'column', [field]).filter(
                    (option) => option.value === field || fieldFitsControl(controlType, option.type),
                );
                const title = `Control ${labelIsMap ? textOf(item.id) : textOf(item.label) || textOf(item.id) || index + 1}`;
                const fits = fieldFitsControl(controlType, fieldType);
                const hasChoices = controlType === 'select' || controlType === 'multi_select';

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
                                label="Type"
                                size="xs"
                                data={FORM_LIST_CONTROL_TYPES.map((entry) => ({ value: entry.value, label: entry.label }))}
                                value={controlType}
                                onChange={(next) => {
                                    if (next === null) {
                                        return;
                                    }
                                    let updated: TJsonObject = { ...item, type: next };
                                    if (next !== 'text') {
                                        delete updated.match;
                                    }
                                    if (next !== 'select' && next !== 'multi_select') {
                                        delete updated.options;
                                        delete updated.options_from;
                                    } else if (updated.options === undefined && updated.options_from === undefined) {
                                        updated = { ...updated, options_from: 'data' };
                                    }
                                    // A field the new type cannot work on is replaced by the first one that fits.
                                    if (!fieldFitsControl(next, fieldType)) {
                                        const replacement = fieldOptions(source, 'column').find((option) => fieldFitsControl(next, option.type));
                                        if (replacement !== undefined) {
                                            updated = { ...updated, field: replacement.value };
                                        }
                                    }
                                    onItems(replaceItem(items, index, updated));
                                }}
                                allowDeselect={false}
                                disabled={disabled}
                            />
                            <Select
                                label="Field"
                                size="xs"
                                data={options.map((option) => ({ value: option.value, label: option.label }))}
                                value={field === '' ? null : field}
                                error={fits ? undefined : 'This type does not fit the field'}
                                onChange={(next) => next !== null && onItems(replaceItem(items, index, { ...item, field: next }))}
                                searchable
                                allowDeselect={false}
                                disabled={disabled}
                            />
                        </Group>
                        <Group grow align="flex-start" gap="xs">
                            <TextInput
                                label="Label"
                                size="xs"
                                value={labelIsMap ? '' : textOf(item.label)}
                                placeholder={labelIsMap ? 'Translated per language (edit as JSON)' : labelOfField(source, field)}
                                onChange={(event) => onItems(replaceItem(items, index, withKey(item, 'label', event.currentTarget.value)))}
                                disabled={disabled || labelIsMap}
                            />
                            <TextInput
                                label="Id"
                                size="xs"
                                description="Used in the link (lowercase letters, digits, _)"
                                value={textOf(item.id)}
                                error={/^[a-z][a-z0-9_]{0,31}$/.test(textOf(item.id)) && ids.indexOf(textOf(item.id)) === index ? undefined : 'Unique, starts with a letter'}
                                onChange={(event) => onItems(replaceItem(items, index, { ...item, id: event.currentTarget.value }))}
                                disabled={disabled}
                            />
                        </Group>

                        {controlType === 'text' && (
                            <Select
                                label="Matches records where the field"
                                size="xs"
                                data={FORM_LIST_TEXT_MATCHES.map((entry) => ({ value: entry.value, label: entry.label }))}
                                value={textOf(item.match) || 'contains'}
                                onChange={(next) => onItems(replaceItem(items, index, withKey(item, 'match', next === null || next === 'contains' ? '' : next)))}
                                allowDeselect={false}
                                disabled={disabled}
                            />
                        )}

                        {hasChoices && <ChoicesEditor item={item} disabled={disabled} onItem={(next) => onItems(replaceItem(items, index, next))} />}
                    </FormListItemFrame>
                );
            })}

            <Select
                size="xs"
                placeholder={atLimit ? `At most ${FORM_LIST_LIMITS.controls} controls` : 'Add a control for a field…'}
                aria-label="Add a control"
                data={fields.map((option) => ({ value: option.value, label: option.label }))}
                value={null}
                onChange={(next) => next !== null && addControl(next)}
                searchable
                disabled={disabled || atLimit || fields.length === 0}
            />
        </Stack>
    );
}

interface IChoicesEditorProps {
    item: TJsonObject;
    disabled: boolean;
    onItem: (item: TJsonObject) => void;
}

/** The choices of a select control: the values found in the data, a fixed list, or both (the fixed list wins). */
function ChoicesEditor({ item, disabled, onItem }: IChoicesEditorProps) {
    const fixed = (Array.isArray(item.options) ? item.options : []).filter(isObject);
    const fromData = item.options_from === 'data';
    const setFixed = (next: TJsonObject[]) => onItem(withKey(item, 'options', next.length === 0 ? '' : next));

    return (
        <Stack gap={6}>
            <Checkbox
                size="xs"
                label="Offer the values found in the data"
                checked={fromData}
                onChange={(event) => onItem(withKey(item, 'options_from', event.currentTarget.checked ? 'data' : ''))}
                disabled={disabled}
            />
            {fixed.map((option, position) => (
                <Group key={position} gap="xs" wrap="nowrap" align="flex-end">
                    <TextInput
                        size="xs"
                        style={{ flex: 1 }}
                        aria-label={`Choice ${position + 1} value`}
                        placeholder="Value"
                        value={textOf(option.value)}
                        onChange={(event) => setFixed(replaceItem(fixed, position, { ...option, value: event.currentTarget.value }))}
                        disabled={disabled}
                    />
                    <TextInput
                        size="xs"
                        style={{ flex: 1 }}
                        aria-label={`Choice ${position + 1} label`}
                        placeholder="Shown as"
                        value={textOf(option.label)}
                        onChange={(event) => setFixed(replaceItem(fixed, position, withKey(option, 'label', event.currentTarget.value)))}
                        disabled={disabled}
                    />
                    <ActionIcon size="sm" variant="subtle" color="red" aria-label={`Remove choice ${position + 1}`} onClick={() => setFixed(removeItem(fixed, position))} disabled={disabled}>
                        <IconTrash size={14} />
                    </ActionIcon>
                </Group>
            ))}
            <Group>
                <Button
                    size="compact-xs"
                    variant="subtle"
                    leftSection={<IconPlus size={12} />}
                    onClick={() => setFixed([...fixed, { value: '' }])}
                    disabled={disabled || fixed.length >= FORM_LIST_LIMITS.choices}
                >
                    Add a fixed choice
                </Button>
            </Group>
        </Stack>
    );
}
