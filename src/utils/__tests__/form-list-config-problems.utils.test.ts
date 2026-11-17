/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/

import { describe, expect, it } from 'vitest';
import { formListFieldLabel, getFormListConfigProblems } from '../form-list-config-problems.utils';

function refused(status: number, data: unknown) {
    return { response: { status, data: { data } } };
}

describe('the problems of a refused list save', () => {
    it('lists every field the server named, in the server order', () => {
        const error = refused(400, {
            reason: 'invalid_list_config',
            errors: [
                { field: 'list_columns', message: 'Column "x" does not exist.' },
                { field: 'quick_actions', message: 'Action "done" sets a field that is not in the form.' },
            ],
        });

        expect(getFormListConfigProblems(error)).toEqual([
            { field: 'list_columns', message: 'Column "x" does not exist.' },
            { field: 'quick_actions', message: 'Action "done" sets a field that is not in the form.' },
        ]);
    });

    it('skips entries that are not a field with a message', () => {
        const error = refused(400, { reason: 'invalid_list_config', errors: [null, 'x', { field: 1, message: 'a' }, { field: 'list_sort' }, { field: 'list_sort', message: 'ok' }] });

        expect(getFormListConfigProblems(error)).toEqual([{ field: 'list_sort', message: 'ok' }]);
    });

    it.each([
        ['another status', refused(422, { reason: 'invalid_list_config', errors: [{ field: 'a', message: 'b' }] })],
        ['another reason', refused(400, { reason: 'other', errors: [{ field: 'a', message: 'b' }] })],
        ['no errors list', refused(400, { reason: 'invalid_list_config' })],
        ['no data', refused(400, null)],
        ['no response', new Error('network')],
        ['nothing', null],
    ])('says nothing for %s', (_name, error) => {
        expect(getFormListConfigProblems(error)).toEqual([]);
    });
});

describe('the names of the fields a problem can name', () => {
    it('uses the words the editor shows, and the field itself when it has no name', () => {
        expect(formListFieldLabel('list_columns')).toBe('Columns');
        expect(formListFieldLabel('list_fixed_filter')).toBe('Fixed filter');
        expect(formListFieldLabel('allow_create')).toBe('Allow add');
        expect(formListFieldLabel('allow_update')).toBe('Allow edit');
        expect(formListFieldLabel('something_new')).toBe('something_new');
    });
});
