/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/

import type { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { REACT_QUERY_CONFIG } from '../../config/react-query.config';
import { useAclVersionWatcher } from '../useAclVersionWatcher';

const auth = vi.hoisted(() => ({ user: null as { id: number; aclVersion: number } | null }));

vi.mock('../useUserData', () => ({ useAuthUser: () => ({ user: auth.user }) }));

const { FORM_LIST_ALL, FORM_LIST_HISTORY_ALL } = REACT_QUERY_CONFIG.QUERY_KEYS;
const LIST_KEY = [...FORM_LIST_ALL, 'account-5', 21, 'news.page=2'];
const HISTORY_KEY = [...FORM_LIST_HISTORY_ALL, 'account-5', 21, 1];

function mount() {
    const queryClient = new QueryClient();
    queryClient.setQueryData(LIST_KEY, { rows: ['mine'] });
    queryClient.setQueryData(HISTORY_KEY, { versions: [1] });
    queryClient.setQueryData(['unrelated'], 'keep');
    const wrapper = ({ children }: { children: ReactNode }) => <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
    const view = renderHook(() => useAclVersionWatcher(), { wrapper });

    return { queryClient, ...view };
}

function stale(queryClient: QueryClient, key: readonly unknown[]): boolean | undefined {
    return queryClient.getQueryState(key)?.isInvalidated;
}

beforeEach(() => {
    auth.user = { id: 5, aclVersion: 1 };
});

describe('what a change of the signed-in person does to the cached entry lists', () => {
    it('leaves them alone while the person and their roles are the same', () => {
        const { queryClient, rerender } = mount();

        rerender();

        expect(stale(queryClient, LIST_KEY)).toBe(false);
        expect(stale(queryClient, HISTORY_KEY)).toBe(false);
    });

    it('marks every list and history stale when the person\'s roles change, so buttons and rows are read again', () => {
        const { queryClient, rerender } = mount();

        auth.user = { id: 5, aclVersion: 2 };
        rerender();

        expect(stale(queryClient, LIST_KEY)).toBe(true);
        expect(stale(queryClient, HISTORY_KEY)).toBe(true);
        expect(queryClient.getQueryData(LIST_KEY)).toEqual({ rows: ['mine'] });
        expect(stale(queryClient, ['unrelated'])).toBe(false);
    });

    it('does the same when another person is signed in', () => {
        const { queryClient, rerender } = mount();

        auth.user = { id: 9, aclVersion: 1 };
        rerender();

        expect(stale(queryClient, LIST_KEY)).toBe(true);
        expect(stale(queryClient, HISTORY_KEY)).toBe(true);
    });
});
