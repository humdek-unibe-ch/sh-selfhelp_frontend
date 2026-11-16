/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/

import { describe, expect, it } from 'vitest';
import type { IFormListColumn } from '../../shared';
import {
    buildFormListSsrValue,
    cellOf,
    collectFormListSeeds,
    formListHref,
    formatEntryDate,
    formatListCell,
    isSearchTermUsable,
    normalizedOwnQuery,
    ownListQuery,
    readFormListUrlStateOrEmpty,
    rowLabel,
    searchParamsToQueryString,
    stripFormListState,
} from '../form-list.utils';

const text: IFormListColumn = { field: 'title', label: 'Title', format: 'text', sortable: true, searchable: true };
const note: IFormListColumn = { field: 'note', label: 'Note', format: 'text', sortable: false, searchable: false };

describe('a list reads only its own part of the page URL', () => {
    it('keeps the parameters of its key and nothing else, malformed ones included', () => {
        const search = '?utm=spring&news.q=sleep&other.q=x&news.page=2&news.bogus=1';

        expect(ownListQuery(search, 'news')).toBe('news.q=sleep&news.page=2&news.bogus=1');
        expect(ownListQuery(search, 'other')).toBe('other.q=x');
        expect(ownListQuery('', 'news')).toBe('');
    });

    it('reads a percent-encoded parameter name the way the server does', () => {
        expect(ownListQuery('?news%2Eq=sleep', 'news')).toBe('news%2Eq=sleep');
    });

    it('gives two spellings of one state the same normalized form', () => {
        const one = normalizedOwnQuery('?news.sort=title:asc&news.page=2', 'news');
        const other = normalizedOwnQuery('?news.page=2&utm=1&news.sort=title%3Aasc', 'news');

        expect(one).toBe(other);
        expect(one).not.toBe('');
    });

    it('is empty for a page that says nothing about the list', () => {
        expect(normalizedOwnQuery('?utm=1', 'news')).toBe('');
    });

    it('builds the link of a state and keeps every unrelated parameter', () => {
        const state = readFormListUrlStateOrEmpty('?news.page=3', 'news');

        expect(formListHref('/events', '?utm=spring&news.q=old', 'news', { ...state, page: 2 })).toBe('/events?utm=spring&news.page=2');
        expect(formListHref('/events', '?news.page=3', 'news', { ...state, page: 1 })).toBe('/events');
    });

    it('answers with the empty state, not an error, for a URL that is not a list state', () => {
        const state = readFormListUrlStateOrEmpty('?news.page=zero', 'news');

        expect(state.page).toBe(1);
        expect(state.q).toBeNull();
    });
});

describe('what a visitor may search for', () => {
    it.each([
        ['', false],
        ['a', false],
        [' a ', false],
        ['ab', true],
        ['  ab  ', true],
        ['x'.repeat(100), true],
        ['x'.repeat(101), false],
    ])('the term %j is %s', (term, usable) => {
        expect(isSearchTermUsable(term)).toBe(usable);
    });
});

describe('a cell is drawn from the text the server sent, in the same way on server and client', () => {
    it('draws booleans as Yes and No', () => {
        expect(formatListCell('1', 'boolean')).toBe('Yes');
        expect(formatListCell('true', 'boolean')).toBe('Yes');
        expect(formatListCell('0', 'boolean')).toBe('No');
        expect(formatListCell('nope', 'boolean')).toBe('No');
    });

    it('draws a date and a date with time without a time zone', () => {
        expect(formatListCell('2026-11-13 09:12:00', 'date')).toBe('2026-11-13');
        expect(formatListCell('2026-11-13 09:12:00', 'datetime')).toBe('2026-11-13 09:12');
        expect(formatListCell('2026-11-13', 'datetime')).toBe('2026-11-13');
        expect(formatListCell('2026-11-13T09:12:59', 'datetime')).toBe('2026-11-13 09:12');
        expect(formatEntryDate('2026-11-13 09:12:00')).toBe('2026-11-13 09:12');
    });

    it('keeps text that is not a date as it is', () => {
        expect(formatListCell('next week', 'date')).toBe('next week');
    });

    it('draws nothing for an empty cell, a missing cell and a file cell', () => {
        expect(formatListCell(null, 'text')).toBe('');
        expect(formatListCell(undefined, 'text')).toBe('');
        expect(formatListCell('', 'text')).toBe('');
        expect(formatListCell([{ name: 'a.pdf', size: 1, mime_type: 'application/pdf' }] as never, 'file')).toBe('');
    });

    it('reads a value by the field of its column, never by a label', () => {
        expect(cellOf({ title: 'Write report', Title: 'wrong' }, text)).toBe('Write report');
        expect(cellOf({}, text)).toBeUndefined();
    });
});

describe('a short name for a record', () => {
    it('uses the first column that has text', () => {
        expect(rowLabel({ record_id: 4, values: { title: '', note: 'Call back' } }, [text, note])).toBe('Call back');
    });

    it('cuts long text to 60 characters', () => {
        const label = rowLabel({ record_id: 4, values: { title: 'x'.repeat(80) } }, [text]);

        expect(label).toHaveLength(60);
        expect(label.endsWith('...')).toBe(true);
    });

    it('falls back to the record number', () => {
        expect(rowLabel({ record_id: 4, values: {} }, [text])).toBe('Entry 4');
    });
});

describe('server rendering', () => {
    const state = { list: { key: 'news' } };

    it('pairs every rendered list with the URL state it was rendered for, at any depth', () => {
        const sections = [
            { id: 1, style_name: 'container', children: [{ id: 2, style_name: 'entry-form-list', list_state: state, children: [] }] },
            { id: 3, style_name: 'data-view', list_key: { content: 'events' }, list_error: { status: 403, message: 'no' }, children: [] },
            { id: 4, style_name: 'entry-form-list', children: [] },
            { id: 5, style_name: 'markdown', list_state: state, children: [] },
        ];

        const seeds = collectFormListSeeds(sections, '?news.page=2&events.q=ab&utm=1');

        expect(seeds).toEqual([
            { sectionId: 2, query: normalizedOwnQuery('?news.page=2', 'news'), state, error: null },
            { sectionId: 3, query: normalizedOwnQuery('?events.q=ab', 'events'), state: null, error: { status: 403, message: 'no' } },
        ]);
    });

    it('ignores anything that is not a list of sections', () => {
        expect(collectFormListSeeds(null, '')).toEqual([]);
        expect(collectFormListSeeds([null, 1, 'x', { id: 'one', style_name: 'entry-form-list' }], '')).toEqual([]);
    });

    it('stamps the render time next to the seeds', () => {
        const before = Date.now();
        const value = buildFormListSsrValue([{ id: 2, style_name: 'entry-form-list', list_state: state }], '');

        expect(value.renderedAt).toBeGreaterThanOrEqual(before);
        expect(value.seeds).toHaveLength(1);
    });

    it('removes the states from a page payload so they travel once, and changes nothing else', () => {
        const page = {
            id: 11,
            keyword: 'events',
            sections: [
                { id: 1, style_name: 'container', children: [{ id: 2, style_name: 'entry-form-list', list_state: state, list_error: null, title: { content: 'News' }, children: [] }] },
            ],
        };

        const stripped = stripFormListState(page);

        expect(JSON.stringify(stripped)).not.toContain('list_state');
        expect(JSON.stringify(stripped)).not.toContain('list_error');
        expect(stripped.sections[0]?.children[0]?.title).toEqual({ content: 'News' });
        // The original is untouched.
        expect(page.sections[0]?.children[0]?.list_state).toBe(state);
    });
});

describe('the query string of a Next.js searchParams object', () => {
    it('keeps a repeated parameter as repeated pairs, so the server sees the duplicate', () => {
        expect(searchParamsToQueryString({ 'news.page': ['1', '2'], utm: 'x', gone: undefined })).toBe('news.page=1&news.page=2&utm=x');
    });

    it('is empty for nothing', () => {
        expect(searchParamsToQueryString(undefined)).toBe('');
        expect(searchParamsToQueryString(null)).toBe('');
        expect(searchParamsToQueryString({})).toBe('');
    });
});
