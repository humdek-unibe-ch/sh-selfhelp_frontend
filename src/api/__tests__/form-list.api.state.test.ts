/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * The request that reads one list's state. A page with a route (`/team/{record_id}`) lets the layout of a
 * record read `{{route.record_id}}`, so the request repeats the page's declared route parameters as
 * `route[<name>]=<value>`; the server checks them against the routes of the page. Everything else the list
 * sends (page, language, preview, the raw `<key>.*` parameters) stays exactly as before.
 */
const { getMock } = vi.hoisted(() => ({ getMock: vi.fn() }));

vi.mock('../base.api', () => ({
    permissionAwareApiClient: { get: getMock },
}));

import { FormListApi } from '../frontend/form-list.api';

function sentParams(): URLSearchParams {
    const config = getMock.mock.calls[0]?.[2] as { params: URLSearchParams } | undefined;
    expect(config?.params).toBeInstanceOf(URLSearchParams);
    return config!.params;
}

describe('FormListApi.getState', () => {
    beforeEach(() => {
        getMock.mockReset();
        getMock.mockResolvedValue({ data: { data: { rows: [] } } });
    });

    it('names the declared route parameters of the page next to the list parameters', async () => {
        await FormListApi.getState(21, {
            pageId: 11,
            languageId: 3,
            listQuery: 'news.q=basel&news.page=2',
            route: { record_id: '3' },
        });

        const params = sentParams();
        expect(params.get('route[record_id]')).toBe('3');
        expect(params.get('page_id')).toBe('11');
        expect(params.get('language_id')).toBe('3');
        expect(params.get('news.q')).toBe('basel');
        expect(params.get('news.page')).toBe('2');
        // On the wire the brackets are encoded, as the server's own tests send them.
        expect(params.toString()).toContain('route%5Brecord_id%5D=3');
        expect(getMock.mock.calls[0]?.[1]).toBe(21);
    });

    it('sorts and encodes several parameters and leaves out what cannot be a route parameter', async () => {
        await FormListApi.getState(21, {
            pageId: 11,
            listQuery: '',
            route: { token: 'a b', user_id: '42', 'bad name': '1', empty: '' },
        });

        const params = sentParams();
        expect([...params.keys()].filter((key) => key.startsWith('route['))).toEqual(['route[token]', 'route[user_id]']);
        expect(params.get('route[token]')).toBe('a b');
        expect(params.get('route[user_id]')).toBe('42');
    });

    it('sends no route for a page that has none', async () => {
        await FormListApi.getState(21, { pageId: 11, listQuery: 'news.page=2', route: null });
        expect(sentParams().toString()).not.toContain('route');

        getMock.mockClear();
        await FormListApi.getState(21, { pageId: 11, listQuery: '', route: {} });
        expect(sentParams().toString()).toBe('page_id=11');

        getMock.mockClear();
        await FormListApi.getState(21, { pageId: 11, listQuery: '' });
        expect(sentParams().toString()).toBe('page_id=11');
    });

    it('keeps the preview flag and the route together', async () => {
        await FormListApi.getState(21, { pageId: 11, listQuery: '', preview: true, route: { record_id: '3' } });

        const params = sentParams();
        expect(params.get('preview')).toBe('1');
        expect(params.get('route[record_id]')).toBe('3');
    });
});
