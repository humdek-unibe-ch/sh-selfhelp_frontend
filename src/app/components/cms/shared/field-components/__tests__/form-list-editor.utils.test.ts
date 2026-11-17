/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/

import { describe, expect, it } from 'vitest';
import type { IFormListSource } from '../../../../../../types/responses/admin/admin.types';
import {
    controlTypeFor,
    countConditions,
    defaultFormatFor,
    emptyGroup,
    fieldFitsControl,
    fieldOptions,
    groupDepth,
    isEmptyFilter,
    labelOfField,
    moveItem,
    newCondition,
    operatorFits,
    operatorOptions,
    parseObject,
    parseObjectList,
    removeItem,
    slugId,
    stringifyList,
    typeOfField,
    valueTexts,
    withField,
    withKey,
    withOperator,
} from '../form-list/form-list-editor.utils';

const SOURCE: IFormListSource = {
    data_table: { id: 7, name: '120' },
    form_section_id: 120,
    columns: [
        { field: 'section_121', label: 'title', type: 'text' },
        { field: 'section_122', label: 'seats', type: 'number' },
        { field: 'section_123', label: 'starts', type: 'date' },
        { field: 'section_124', label: 'open', type: 'boolean' },
    ],
    row_fields: [
        { field: 'entry_date', label: 'Entry date', type: 'datetime', column: true, sort: true, filter: true },
        { field: 'record_id', label: 'Record number', type: 'number', column: false, sort: true, filter: true },
        { field: 'user_name', label: 'User name', type: 'text', column: false, sort: false, filter: true },
    ],
};

describe('parsing the stored JSON of a list field', () => {
    it('reads empty text as an empty list and refuses anything that is not a list of objects', () => {
        expect(parseObjectList('')).toEqual([]);
        expect(parseObjectList('  ')).toEqual([]);
        expect(parseObjectList('[{"field":"a"}]')).toEqual([{ field: 'a' }]);
        expect(parseObjectList('{"field":"a"}')).toBeNull();
        expect(parseObjectList('[1,2]')).toBeNull();
        expect(parseObjectList('[{')).toBeNull();
    });

    it('reads an object field and refuses a list', () => {
        expect(parseObject('')).toEqual({});
        expect(parseObject('{"mode":"and","children":[]}')).toEqual({ mode: 'and', children: [] });
        expect(parseObject('[]')).toBeNull();
        expect(parseObject('nope')).toBeNull();
    });

    it('keeps every property it does not own when one key is set', () => {
        const column = { field: 'a', label: { en: 'A', de: 'A' }, unknown: 7 };

        const changed = withKey(column, 'sortable', true);

        expect(changed).toEqual({ field: 'a', label: { en: 'A', de: 'A' }, unknown: 7, sortable: true });
        expect(column).toEqual({ field: 'a', label: { en: 'A', de: 'A' }, unknown: 7 });
        expect(withKey(changed, 'sortable', false)).toEqual(column);
        expect(withKey(changed, 'format', '')).toEqual(changed);
    });

    it('writes the shortest JSON, which is the seeded empty default for no rows', () => {
        expect(stringifyList([])).toBe('[]');
        expect(stringifyList([{ field: 'a', sortable: true }])).toBe('[{"field":"a","sortable":true}]');
    });

    it('moves and removes rows without touching the original', () => {
        const rows = ['a', 'b', 'c'];

        expect(moveItem(rows, 0, 1)).toEqual(['b', 'a', 'c']);
        expect(moveItem(rows, 2, 3)).toEqual(['a', 'b', 'c']);
        expect(moveItem(rows, 1, -1)).toEqual(['a', 'b', 'c']);
        expect(removeItem(rows, 1)).toEqual(['a', 'c']);
        expect(rows).toEqual(['a', 'b', 'c']);
    });
});

describe('the fields a list may name', () => {
    it('offers the columns and the row fields the server allows in each place', () => {
        expect(fieldOptions(SOURCE, 'column').map((option) => option.value)).toEqual([
            'section_121',
            'section_122',
            'section_123',
            'section_124',
            'entry_date',
        ]);
        expect(fieldOptions(SOURCE, 'sort').map((option) => option.value)).toContain('record_id');
        expect(fieldOptions(SOURCE, 'sort').map((option) => option.value)).not.toContain('user_name');
        expect(fieldOptions(SOURCE, 'filter').map((option) => option.value)).toContain('user_name');
        // A quick action sets fields of the form, never a row field.
        expect(fieldOptions(SOURCE, 'assign').map((option) => option.value)).toEqual(['section_121', 'section_122', 'section_123', 'section_124']);
    });

    it('keeps a stored field that is not in the table selectable so nothing is silently rewritten', () => {
        const options = fieldOptions(SOURCE, 'column', ['title', 'section_121']);

        expect(options.find((option) => option.value === 'title')).toEqual({ value: 'title', label: 'title (not in the table)', type: 'text' });
        expect(options.filter((option) => option.value === 'section_121')).toHaveLength(1);
    });

    it('offers nothing without a table, only what is already stored', () => {
        expect(fieldOptions(null, 'column')).toEqual([]);
        expect(fieldOptions(null, 'column', ['a']).map((option) => option.value)).toEqual(['a']);
    });

    it('knows the type and the readable name of a field', () => {
        expect(typeOfField(SOURCE, 'section_122')).toBe('number');
        expect(typeOfField(SOURCE, 'entry_date')).toBe('datetime');
        expect(typeOfField(SOURCE, 'gone')).toBe('text');
        expect(typeOfField(null, 'anything')).toBe('text');
        expect(labelOfField(SOURCE, 'section_121')).toBe('title');
        expect(labelOfField(SOURCE, 'record_id')).toBe('Record number');
        expect(labelOfField(SOURCE, 'gone')).toBe('gone');
    });

    it('suggests how a column is drawn and which control suits it', () => {
        expect(defaultFormatFor('number', 'x')).toBe('number');
        expect(defaultFormatFor('boolean', 'x')).toBe('boolean');
        expect(defaultFormatFor('text', 'entry_date')).toBe('datetime');
        expect(defaultFormatFor('text', 'x')).toBe('text');
        expect(controlTypeFor('number')).toBe('number_range');
        expect(controlTypeFor('date')).toBe('date_range');
        expect(controlTypeFor('boolean')).toBe('boolean');
        expect(controlTypeFor('text')).toBe('text');
    });

    it('only lets a control work on a field of the type it needs', () => {
        expect(fieldFitsControl('number_range', 'number')).toBe(true);
        expect(fieldFitsControl('number_range', 'text')).toBe(false);
        expect(fieldFitsControl('date_range', 'datetime')).toBe(true);
        expect(fieldFitsControl('date_range', 'number')).toBe(false);
        expect(fieldFitsControl('boolean', 'boolean')).toBe(true);
        expect(fieldFitsControl('select', 'number')).toBe(true);
    });

    it('makes a valid id from a readable text and keeps ids unique', () => {
        expect(slugId('Event status', [])).toBe('event_status');
        expect(slugId('Event status', ['event_status'])).toBe('event_status_2');
        expect(slugId('  42 apples!  ', [])).toBe('apples');
        expect(slugId('!!!', [])).toBe('item');
        expect(slugId('x'.repeat(60), [])).toHaveLength(28);
        expect(slugId('Ünïcode', [])).toMatch(/^[a-z][a-z0-9_]*$/);
    });
});

describe('filter conditions', () => {
    it('offers the operators of a type and no others', () => {
        expect(operatorOptions('text').map((option) => option.value)).toContain('contains');
        expect(operatorOptions('text').map((option) => option.value)).not.toContain('gt');
        expect(operatorOptions('number').map((option) => option.value)).toContain('between');
        expect(operatorOptions('number').map((option) => option.value)).not.toContain('contains');
        expect(operatorOptions('boolean').map((option) => option.value)).toEqual(['eq', 'neq', 'empty', 'not_empty']);
        expect(operatorFits('date', 'lte')).toBe(true);
        expect(operatorFits('boolean', 'gt')).toBe(false);
    });

    it('reshapes the value when the operator changes', () => {
        const base = { column: 'c', operator: 'eq', value: 'x' };

        expect(withOperator(base, 'between')).toEqual({ column: 'c', operator: 'between', value: ['x', ''] });
        expect(withOperator(base, 'in')).toEqual({ column: 'c', operator: 'in', value: ['x'] });
        expect(withOperator({ ...base, value: ['a', 'b'] }, 'eq')).toEqual({ column: 'c', operator: 'eq', value: 'a' });
        expect(withOperator(base, 'empty')).toEqual({ column: 'c', operator: 'empty' });
        expect(valueTexts({ value: ['1', 2, null] })).toEqual(['1', '2', '']);
    });

    it('moves a condition to a field and drops an operator the new type does not have', () => {
        const condition = { column: 'a', operator: 'contains', value: 'x' };

        expect(withField(condition, 'section_122', 'number')).toEqual({ column: 'section_122', operator: 'eq', value: 'x' });
        expect(withField({ column: 'a', operator: 'eq', value: 'x' }, 'b', 'text')).toEqual({ column: 'b', operator: 'eq', value: 'x' });
    });

    it('makes a boolean condition start on yes', () => {
        expect(newCondition('section_124', 'boolean')).toEqual({ column: 'section_124', operator: 'eq', value: '1' });
        expect(newCondition('section_121', 'text')).toEqual({ column: 'section_121', operator: 'eq', value: '' });
    });

    it('counts the conditions and the levels of a nested filter', () => {
        const filter = {
            mode: 'and',
            children: [
                { column: 'a', operator: 'eq', value: '1' },
                { mode: 'or', children: [{ column: 'b', operator: 'eq', value: '2' }, { mode: 'and', children: [{ column: 'c', operator: 'eq', value: '3' }] }] },
            ],
        };

        expect(countConditions(filter)).toBe(3);
        expect(groupDepth(filter)).toBe(3);
        expect(countConditions(emptyGroup())).toBe(0);
        expect(groupDepth(emptyGroup())).toBe(1);
        expect(isEmptyFilter(emptyGroup())).toBe(true);
        expect(isEmptyFilter(null)).toBe(true);
        expect(isEmptyFilter(filter)).toBe(false);
    });
});
