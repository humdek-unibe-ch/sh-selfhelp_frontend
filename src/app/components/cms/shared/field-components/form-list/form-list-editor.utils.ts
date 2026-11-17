/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/

/**
 * Pure helpers of the entry-list editors (`entry-form-list`, `data-view`).
 *
 * The five JSON fields of a list (`list_columns`, `list_sort`, `list_controls`,
 * `list_fixed_filter`, `quick_actions`) are edited as rows, not as text. The
 * editors work on the decoded JSON itself and change only the keys they own, so
 * a property they do not know (a label translated per language, say) survives
 * every edit; nothing is rebuilt from a model that could lose it.
 *
 * The server stays the judge: it checks every value when the section is saved
 * (`FormListConfigValidator`). These helpers only keep the editor from offering
 * what the server would refuse (a number range on a text column, an operator a
 * type does not have).
 */
import type { IFormListSource } from '../../../../../../types/responses/admin/admin.types';

export type TJsonObject = Record<string, unknown>;

/** Where a field is going to be used; the server allows different row fields in each place. */
export type TFormListFieldUse = 'column' | 'sort' | 'filter' | 'assign';

export interface IFormListFieldOption {
    value: string;
    label: string;
    type: string;
}

export const FORM_LIST_LIMITS = {
    columns: 30,
    sorts: 3,
    controls: 12,
    quickActions: 8,
    assignments: 10,
    fixedFilterConditions: 15,
    fixedFilterDepth: 3,
    whenConditions: 10,
    whenDepth: 2,
    choices: 50,
} as const;

export const FORM_LIST_COLUMN_FORMATS: ReadonlyArray<{ value: string; label: string }> = [
    { value: 'text', label: 'Text' },
    { value: 'number', label: 'Number' },
    { value: 'date', label: 'Date' },
    { value: 'datetime', label: 'Date and time' },
    { value: 'boolean', label: 'Yes / no' },
    { value: 'badge', label: 'Badge' },
    { value: 'file', label: 'File link' },
];

export const FORM_LIST_CONTROL_TYPES: ReadonlyArray<{ value: string; label: string }> = [
    { value: 'text', label: 'Text search' },
    { value: 'select', label: 'Choose one' },
    { value: 'multi_select', label: 'Choose several' },
    { value: 'boolean', label: 'Yes / no' },
    { value: 'date_range', label: 'Date range' },
    { value: 'number_range', label: 'Number range' },
];

export const FORM_LIST_TEXT_MATCHES: ReadonlyArray<{ value: string; label: string }> = [
    { value: 'contains', label: 'Contains' },
    { value: 'eq', label: 'Is exactly' },
    { value: 'starts_with', label: 'Starts with' },
];

const OPERATOR_LABELS: Readonly<Record<string, string>> = {
    eq: 'is',
    neq: 'is not',
    gt: 'is greater than',
    gte: 'is at least',
    lt: 'is less than',
    lte: 'is at most',
    between: 'is between',
    in: 'is one of',
    not_in: 'is none of',
    contains: 'contains',
    starts_with: 'starts with',
    ends_with: 'ends with',
    empty: 'is empty',
    not_empty: 'is not empty',
};

const TEXT_OPERATORS = ['eq', 'neq', 'contains', 'starts_with', 'ends_with', 'in', 'not_in', 'empty', 'not_empty'];
const ORDERED_OPERATORS = ['eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'between', 'in', 'not_in', 'empty', 'not_empty'];
const BOOLEAN_OPERATORS = ['eq', 'neq', 'empty', 'not_empty'];

/** Operators that need no value. */
const VALUELESS_OPERATORS = new Set(['empty', 'not_empty']);
const LIST_OPERATORS = new Set(['in', 'not_in']);

// ---------------------------------------------------------------------------
// JSON in and out

/**
 * The decoded array of objects of a stored field; empty text is an empty list,
 * anything that is not a list of objects is null (the editor then offers the raw text).
 */
export function parseObjectList(text: string): TJsonObject[] | null {
    if (text.trim() === '') {
        return [];
    }
    try {
        const decoded: unknown = JSON.parse(text);
        if (!Array.isArray(decoded)) {
            return null;
        }
        const items: TJsonObject[] = [];
        for (const item of decoded) {
            if (!isObject(item)) {
                return null;
            }
            items.push(item);
        }
        return items;
    } catch {
        return null;
    }
}

/** The decoded object of a stored field; empty text is `{}`, anything else that is not an object is null. */
export function parseObject(text: string): TJsonObject | null {
    if (text.trim() === '') {
        return {};
    }
    try {
        const decoded: unknown = JSON.parse(text);
        return isObject(decoded) ? decoded : null;
    } catch {
        return null;
    }
}

export function isObject(value: unknown): value is TJsonObject {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** The stored text of a list of rows: the shortest JSON, `[]` for none (the seeded default). */
export function stringifyList(items: ReadonlyArray<TJsonObject>): string {
    return JSON.stringify(items);
}

/** A copy of `item` with `key` set, or removed when the value is empty / the default. */
export function withKey(item: TJsonObject, key: string, value: unknown): TJsonObject {
    const next: TJsonObject = { ...item };
    if (value === undefined || value === null || value === '' || value === false) {
        delete next[key];
    } else {
        next[key] = value;
    }
    return next;
}

export function textOf(value: unknown): string {
    return typeof value === 'string' ? value : typeof value === 'number' ? String(value) : '';
}

export function flagOf(value: unknown): boolean {
    return value === true || value === 1 || value === '1' || value === 'true';
}

/** A label is a text or a map locale to text; the editor edits the text and leaves a map alone. */
export function isTranslatedLabel(value: unknown): boolean {
    return isObject(value);
}

export function moveItem<T>(items: ReadonlyArray<T>, from: number, to: number): T[] {
    if (to < 0 || to >= items.length || from === to) {
        return [...items];
    }
    const next = [...items];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved as T);
    return next;
}

export function replaceItem<T>(items: ReadonlyArray<T>, index: number, item: T): T[] {
    return items.map((existing, position) => (position === index ? item : existing));
}

export function removeItem<T>(items: ReadonlyArray<T>, index: number): T[] {
    return items.filter((_, position) => position !== index);
}

// ---------------------------------------------------------------------------
// Fields the list may name

/**
 * The fields of the table a list may name in one place. The server decides which
 * row fields fit where (a person is never a column, only the author may filter on one).
 * A field that is stored but unknown (written by hand, or its input was deleted) stays
 * selectable so an existing list is never silently rewritten.
 */
export function fieldOptions(
    source: IFormListSource | null,
    use: TFormListFieldUse,
    current: ReadonlyArray<string> = [],
): IFormListFieldOption[] {
    const options: IFormListFieldOption[] = [];
    if (source !== null) {
        for (const column of source.columns) {
            options.push({ value: column.field, label: column.label, type: column.type });
        }
        if (use !== 'assign') {
            for (const row of source.row_fields) {
                const allowed = use === 'column' ? row.column : use === 'sort' ? row.sort : row.filter;
                if (allowed) {
                    options.push({ value: row.field, label: row.label, type: row.type });
                }
            }
        }
    }

    const known = new Set(options.map((option) => option.value));
    for (const field of current) {
        if (field !== '' && !known.has(field)) {
            known.add(field);
            options.push({ value: field, label: `${field} (not in the table)`, type: 'text' });
        }
    }

    return options;
}

export function typeOfField(source: IFormListSource | null, field: string): string {
    if (source === null) {
        return 'text';
    }
    const column = source.columns.find((candidate) => candidate.field === field);
    if (column !== undefined) {
        return column.type;
    }
    return source.row_fields.find((candidate) => candidate.field === field)?.type ?? 'text';
}

/** The default label of a new column or control: the readable name of its field. */
export function labelOfField(source: IFormListSource | null, field: string): string {
    if (source === null) {
        return field;
    }
    return (
        source.columns.find((candidate) => candidate.field === field)?.label ??
        source.row_fields.find((candidate) => candidate.field === field)?.label ??
        field
    );
}

/** How a column of this type is best drawn. */
export function defaultFormatFor(type: string, field: string): string {
    if (field === 'entry_date') {
        return 'datetime';
    }
    switch (type) {
        case 'number':
            return 'number';
        case 'date':
            return 'date';
        case 'datetime':
            return 'datetime';
        case 'boolean':
            return 'boolean';
        default:
            return 'text';
    }
}

/** Which fields fit a control: a number range needs numbers, a date range dates, a switch a boolean. */
export function fieldFitsControl(controlType: string, fieldType: string): boolean {
    switch (controlType) {
        case 'number_range':
            return fieldType === 'number';
        case 'date_range':
            return fieldType === 'date' || fieldType === 'datetime';
        case 'boolean':
            return fieldType === 'boolean';
        default:
            return true;
    }
}

/** The control type that suits a field best. */
export function controlTypeFor(fieldType: string): string {
    switch (fieldType) {
        case 'number':
            return 'number_range';
        case 'date':
        case 'datetime':
            return 'date_range';
        case 'boolean':
            return 'boolean';
        default:
            return 'text';
    }
}

/** `^[a-z][a-z0-9_]{0,31}$`: an id for a control or a quick action, made from a readable text. */
export function slugId(text: string, taken: ReadonlyArray<string>): string {
    const base =
        text
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '_')
            .replace(/^_+|_+$/g, '')
            .replace(/^[^a-z]+/, '')
            .slice(0, 28) || 'item';
    let candidate = base;
    let counter = 2;
    while (taken.includes(candidate)) {
        candidate = `${base}_${counter}`;
        counter += 1;
    }
    return candidate;
}

export const FORM_LIST_ID_PATTERN = /^[a-z][a-z0-9_]{0,31}$/;

// ---------------------------------------------------------------------------
// Filter trees (the fixed filter and the `when` of a quick action)

export interface IFilterOperatorOption {
    value: string;
    label: string;
}

export function operatorOptions(fieldType: string): IFilterOperatorOption[] {
    const operators = fieldType === 'boolean' ? BOOLEAN_OPERATORS : fieldType === 'text' ? TEXT_OPERATORS : ORDERED_OPERATORS;
    return operators.map((value) => ({ value, label: OPERATOR_LABELS[value] ?? value }));
}

export function operatorFits(fieldType: string, operator: string): boolean {
    return operatorOptions(fieldType).some((option) => option.value === operator);
}

export function isGroup(node: TJsonObject): boolean {
    return Array.isArray(node.children);
}

export function isValuelessOperator(operator: string): boolean {
    return VALUELESS_OPERATORS.has(operator);
}

export function isListOperator(operator: string): boolean {
    return LIST_OPERATORS.has(operator);
}

export function isRangeOperator(operator: string): boolean {
    return operator === 'between';
}

/** A new, empty group. */
export function emptyGroup(): TJsonObject {
    return { mode: 'and', children: [] };
}

/** A new condition on `field`, in the form the field's type suggests. */
export function newCondition(field: string, fieldType: string): TJsonObject {
    return { column: field, operator: 'eq', value: fieldType === 'boolean' ? '1' : '' };
}

/** How many conditions a filter holds, groups not counted. */
export function countConditions(node: TJsonObject): number {
    if (!isGroup(node)) {
        return 1;
    }
    let total = 0;
    for (const child of node.children as unknown[]) {
        if (isObject(child)) {
            total += countConditions(child);
        }
    }
    return total;
}

/** How many group levels a filter has; the top group is level 1. */
export function groupDepth(node: TJsonObject): number {
    if (!isGroup(node)) {
        return 0;
    }
    let deepest = 0;
    for (const child of node.children as unknown[]) {
        if (isObject(child)) {
            deepest = Math.max(deepest, groupDepth(child));
        }
    }
    return deepest + 1;
}

/** The value of a condition as the editor edits it: a list for `in` / `between`, a text otherwise. */
export function valueTexts(condition: TJsonObject): string[] {
    const value = condition.value;
    if (Array.isArray(value)) {
        return value.map((entry) => textOf(entry));
    }
    return value === undefined || value === null ? [] : [textOf(value)];
}

/** A condition with its operator changed to one the field's type has, and the value reshaped to fit. */
export function withOperator(condition: TJsonObject, operator: string): TJsonObject {
    const next: TJsonObject = { ...condition, operator };
    const values = valueTexts(condition);
    if (isValuelessOperator(operator)) {
        delete next.value;
    } else if (isRangeOperator(operator)) {
        next.value = [values[0] ?? '', values[1] ?? ''];
    } else if (isListOperator(operator)) {
        next.value = values.filter((entry) => entry !== '');
    } else {
        next.value = values[0] ?? '';
    }
    return next;
}

/** A condition moved to another field; an operator the new type does not have falls back to "is". */
export function withField(condition: TJsonObject, field: string, fieldType: string): TJsonObject {
    const operator = textOf(condition.operator);
    const next: TJsonObject = { ...condition, column: field };
    if (!operatorFits(fieldType, operator)) {
        return withOperator(next, 'eq');
    }
    return next;
}

/** Whether a filter holds anything the server would count. */
export function isEmptyFilter(node: TJsonObject | null): boolean {
    return node === null || countConditions(node) === 0 || (isGroup(node) && (node.children as unknown[]).length === 0);
}
