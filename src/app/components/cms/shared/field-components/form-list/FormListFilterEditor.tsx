/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
'use client';

import { ActionIcon, Box, Button, Group, Paper, SegmentedControl, Select, Stack, TagsInput, Text, TextInput } from '@mantine/core';
import { IconPlus, IconTrash } from '@tabler/icons-react';
import type { IFormListSource } from '../../../../../../types/responses/admin/admin.types';
import { FormListJsonShell } from './FormListJsonShell';
import {
    FORM_LIST_LIMITS,
    countConditions,
    emptyGroup,
    fieldOptions,
    groupDepth,
    isGroup,
    isListOperator,
    isObject,
    isRangeOperator,
    isValuelessOperator,
    labelOfField,
    newCondition,
    operatorOptions,
    parseObject,
    removeItem,
    replaceItem,
    textOf,
    typeOfField,
    valueTexts,
    withField,
    withOperator,
    type TJsonObject,
} from './form-list-editor.utils';
import { useFormListSource } from './FormListSourceContext';

interface IFilterLimits {
    /** Most conditions in the whole filter. */
    conditions: number;
    /** Most group levels, the top group counted. */
    depth: number;
}

interface IEditorProps {
    value: string;
    onChange: (value: string) => void;
    disabled?: boolean;
}

/** `list_fixed_filter`: the records the list is allowed to show at all, whatever a visitor picks. */
export function ListFixedFilterEditor({ value, onChange, disabled = false }: IEditorProps) {
    const source = useFormListSource();
    const limits: IFilterLimits = { conditions: FORM_LIST_LIMITS.fixedFilterConditions, depth: FORM_LIST_LIMITS.fixedFilterDepth };

    return (
        <FormListJsonShell
            value={value}
            onChange={onChange}
            disabled={disabled}
            parse={parseFilter}
            hasSource={source !== null}
            noun="filter"
            render={(group) => (
                <Stack gap="xs">
                    {countConditions(group) === 0 && (
                        <Text size="sm" c="dimmed">
                            No condition: the list shows every record it may show.
                        </Text>
                    )}
                    <FilterGroupEditor
                        group={group}
                        source={source}
                        limits={limits}
                        depth={1}
                        total={countConditions(group)}
                        disabled={disabled}
                        label="Fixed filter"
                        onChange={(next) => onChange(JSON.stringify(next))}
                    />
                </Stack>
            )}
        />
    );
}

/** An empty filter is the seeded default group; anything that is not a group cannot be shown as rows. */
function parseFilter(text: string): TJsonObject | null {
    const parsed = parseObject(text);
    if (parsed === null) {
        return null;
    }
    if (Object.keys(parsed).length === 0) {
        return emptyGroup();
    }
    return isGroup(parsed) && groupDepth(parsed) <= FORM_LIST_LIMITS.fixedFilterDepth ? parsed : null;
}

interface IFilterGroupEditorProps {
    group: TJsonObject;
    source: IFormListSource | null;
    limits: IFilterLimits;
    /** 1 for the top group. */
    depth: number;
    /** Conditions in the whole filter, to stop adding at the limit. */
    total: number;
    disabled: boolean;
    label: string;
    onChange: (group: TJsonObject) => void;
    onRemove?: () => void;
}

/** One group of a filter: all / any of its conditions and nested groups. Used by the fixed filter and the `when` of a quick action. */
export function FilterGroupEditor({ group, source, limits, depth, total, disabled, label, onChange, onRemove }: IFilterGroupEditorProps) {
    const children = (Array.isArray(group.children) ? group.children : []).filter(isObject);
    const mode = textOf(group.mode) === 'or' ? 'or' : 'and';
    const firstField = fieldOptions(source, 'filter')[0];
    const canAddCondition = !disabled && firstField !== undefined && total < limits.conditions;
    const canAddGroup = !disabled && depth < limits.depth && total < limits.conditions;

    const setChildren = (next: TJsonObject[]) => onChange({ ...group, children: next });

    return (
        <Paper withBorder p="xs" radius="sm" role="group" aria-label={label}>
            <Stack gap="xs">
                <Group justify="space-between" gap="xs" wrap="nowrap">
                    <SegmentedControl
                        size="xs"
                        aria-label={`${label}: records must match`}
                        value={mode}
                        onChange={(next) => onChange({ ...group, mode: next })}
                        data={[
                            { value: 'and', label: 'All of' },
                            { value: 'or', label: 'Any of' },
                        ]}
                        disabled={disabled}
                    />
                    {onRemove !== undefined && (
                        <ActionIcon size="sm" variant="subtle" color="red" aria-label={`Remove ${label}`} onClick={onRemove} disabled={disabled}>
                            <IconTrash size={14} />
                        </ActionIcon>
                    )}
                </Group>

                {children.map((child, index) =>
                    isGroup(child) ? (
                        <Box key={index} ml="sm">
                            <FilterGroupEditor
                                group={child}
                                source={source}
                                limits={limits}
                                depth={depth + 1}
                                total={total}
                                disabled={disabled}
                                label={`${label}, group ${index + 1}`}
                                onChange={(next) => setChildren(replaceItem(children, index, next))}
                                onRemove={() => setChildren(removeItem(children, index))}
                            />
                        </Box>
                    ) : (
                        <ConditionRow
                            key={index}
                            condition={child}
                            source={source}
                            disabled={disabled}
                            label={`${label}, condition ${index + 1}`}
                            onChange={(next) => setChildren(replaceItem(children, index, next))}
                            onRemove={() => setChildren(removeItem(children, index))}
                        />
                    ),
                )}

                <Group gap="xs">
                    <Button
                        size="compact-xs"
                        variant="light"
                        leftSection={<IconPlus size={12} />}
                        disabled={!canAddCondition}
                        onClick={() => {
                            if (firstField !== undefined) {
                                setChildren([...children, newCondition(firstField.value, firstField.type)]);
                            }
                        }}
                    >
                        Condition
                    </Button>
                    {depth < limits.depth && (
                        <Button
                            size="compact-xs"
                            variant="subtle"
                            leftSection={<IconPlus size={12} />}
                            disabled={!canAddGroup}
                            onClick={() => setChildren([...children, emptyGroup()])}
                        >
                            Group
                        </Button>
                    )}
                    {total >= limits.conditions && (
                        <Text size="xs" c="dimmed">
                            At most {limits.conditions} conditions.
                        </Text>
                    )}
                </Group>
            </Stack>
        </Paper>
    );
}

interface IConditionRowProps {
    condition: TJsonObject;
    source: IFormListSource | null;
    disabled: boolean;
    label: string;
    onChange: (condition: TJsonObject) => void;
    onRemove: () => void;
}

function ConditionRow({ condition, source, disabled, label, onChange, onRemove }: IConditionRowProps) {
    const column = textOf(condition.column);
    const operator = textOf(condition.operator) || 'eq';
    const type = typeOfField(source, column);
    const fields = fieldOptions(source, 'filter', [column]);
    const values = valueTexts(condition);

    return (
        <Stack gap={6}>
            <Group gap="xs" align="flex-end" wrap="nowrap">
                <Select
                    label="Field"
                    size="xs"
                    style={{ flex: 1 }}
                    data={fields.map((option) => ({ value: option.value, label: option.label }))}
                    value={column === '' ? null : column}
                    onChange={(next) => next !== null && onChange(withField(condition, next, typeOfField(source, next)))}
                    searchable
                    allowDeselect={false}
                    disabled={disabled}
                    aria-label={`${label}: field`}
                />
                <ActionIcon size="sm" variant="subtle" color="red" aria-label={`Remove ${label}`} onClick={onRemove} disabled={disabled} mb={4}>
                    <IconTrash size={14} />
                </ActionIcon>
            </Group>
            <Select
                size="xs"
                data={operatorOptions(type)}
                value={operatorOptions(type).some((option) => option.value === operator) ? operator : null}
                onChange={(next) => next !== null && onChange(withOperator(condition, next))}
                allowDeselect={false}
                disabled={disabled}
                aria-label={`${label}: ${labelOfField(source, column)} operator`}
            />
            <ConditionValue
                operator={operator}
                type={type}
                values={values}
                disabled={disabled}
                label={`${label}: value`}
                onChange={(next) => onChange({ ...condition, value: next })}
            />
        </Stack>
    );
}

interface IConditionValueProps {
    operator: string;
    type: string;
    values: string[];
    disabled: boolean;
    label: string;
    onChange: (value: string | string[]) => void;
}

function inputTypeOf(type: string): 'text' | 'number' | 'date' {
    return type === 'number' ? 'number' : type === 'date' ? 'date' : 'text';
}

function ConditionValue({ operator, type, values, disabled, label, onChange }: IConditionValueProps) {
    if (isValuelessOperator(operator)) {
        return null;
    }

    if (isListOperator(operator)) {
        return (
            <TagsInput
                size="xs"
                aria-label={label}
                placeholder="Type a value and press Enter"
                value={values.filter((entry) => entry !== '')}
                onChange={onChange}
                maxTags={FORM_LIST_LIMITS.choices}
                disabled={disabled}
            />
        );
    }

    if (isRangeOperator(operator)) {
        return (
            <Group gap="xs" grow>
                <TextInput
                    size="xs"
                    type={inputTypeOf(type)}
                    aria-label={`${label} from`}
                    placeholder="From"
                    value={values[0] ?? ''}
                    onChange={(event) => onChange([event.currentTarget.value, values[1] ?? ''])}
                    disabled={disabled}
                />
                <TextInput
                    size="xs"
                    type={inputTypeOf(type)}
                    aria-label={`${label} to`}
                    placeholder="To"
                    value={values[1] ?? ''}
                    onChange={(event) => onChange([values[0] ?? '', event.currentTarget.value])}
                    disabled={disabled}
                />
            </Group>
        );
    }

    if (type === 'boolean') {
        return (
            <Select
                size="xs"
                aria-label={label}
                data={[
                    { value: '1', label: 'Yes' },
                    { value: '0', label: 'No' },
                ]}
                value={values[0] === '0' ? '0' : '1'}
                onChange={(next) => onChange(next ?? '1')}
                allowDeselect={false}
                disabled={disabled}
            />
        );
    }

    return (
        <TextInput
            size="xs"
            type={inputTypeOf(type)}
            aria-label={label}
            placeholder={type === 'datetime' ? '2026-01-31 08:00:00' : 'Value'}
            value={values[0] ?? ''}
            onChange={(event) => onChange(event.currentTarget.value)}
            disabled={disabled}
        />
    );
}
