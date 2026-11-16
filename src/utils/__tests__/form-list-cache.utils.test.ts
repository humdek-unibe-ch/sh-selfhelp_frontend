/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/

import { QueryClient } from '@tanstack/react-query';
import { describe, expect, it } from 'vitest';
import { REACT_QUERY_CONFIG } from '../../config/react-query.config';
import { clearFormListCaches, invalidateFormList } from '../form-list-cache.utils';

const { FORM_LIST_ALL, FORM_LIST_HISTORY_ALL } = REACT_QUERY_CONFIG.QUERY_KEYS;

function client(): QueryClient {
    const queryClient = new QueryClient();
    queryClient.setQueryData([...FORM_LIST_ALL, 'account-5', 21, 'news.page=2'], { rows: ['mine'] });
    queryClient.setQueryData([...FORM_LIST_HISTORY_ALL, 'account-5', 21, 1], { versions: [1] });
    queryClient.setQueryData(['unrelated'], 'keep');
    return queryClient;
}

describe('the cache of the form lists', () => {
    it('drops every cached list and history on login, logout and server switch, and nothing else', () => {
        const queryClient = client();

        clearFormListCaches(queryClient);

        expect(queryClient.getQueriesData({ queryKey: FORM_LIST_ALL })).toEqual([]);
        expect(queryClient.getQueriesData({ queryKey: FORM_LIST_HISTORY_ALL })).toEqual([]);
        expect(queryClient.getQueryData(['unrelated'])).toBe('keep');
    });

    it('marks cached lists stale after a write without dropping what is on screen', async () => {
        const queryClient = client();

        await invalidateFormList(queryClient);

        const [[, data]] = queryClient.getQueriesData({ queryKey: FORM_LIST_ALL });
        expect(data).toEqual({ rows: ['mine'] });
        expect(queryClient.getQueryState([...FORM_LIST_ALL, 'account-5', 21, 'news.page=2'])?.isInvalidated).toBe(true);
        expect(queryClient.getQueryState(['unrelated'])?.isInvalidated).toBe(false);
    });
});
