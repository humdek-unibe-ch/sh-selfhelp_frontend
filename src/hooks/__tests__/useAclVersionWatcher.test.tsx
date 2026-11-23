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

const auth = vi.hoisted(() => ({ user: null as { id: number; aclVersion: number; aclStamp?: string | null } | null }));

vi.mock('../useUserData', () => ({ useAuthUser: () => ({ user: auth.user }) }));

const { FORM_LIST_ALL, FORM_LIST_HISTORY_ALL, ROLES_ALL, PERMISSIONS_ALL, NAVIGATION_ALL } = REACT_QUERY_CONFIG.QUERY_KEYS;
const NAVIGATION_KEY = [...NAVIGATION_ALL, 1];
const LIST_KEY = [...FORM_LIST_ALL, 'account-5', 21, 'news.page=2'];
const HISTORY_KEY = [...FORM_LIST_HISTORY_ALL, 'account-5', 21, 1];
// What the viewer may do with a role (`can_update`, `can_delete`) and which permissions
// they may hand out (`can_assign`) are read for one person: both keys belong to them.
const ROLES_KEY = [...ROLES_ALL, 'list', { page: 1 }];
const PERMISSIONS_KEY = [...PERMISSIONS_ALL, 'list'];

function mount() {
    const queryClient = new QueryClient();
    queryClient.setQueryData(LIST_KEY, { rows: ['mine'] });
    queryClient.setQueryData(HISTORY_KEY, { versions: [1] });
    queryClient.setQueryData(ROLES_KEY, { roles: [{ id: 7, can_update: true, can_delete: true }] });
    queryClient.setQueryData(PERMISSIONS_KEY, { permissions: [{ id: 3, can_assign: true }] });
    queryClient.setQueryData(NAVIGATION_KEY, { items: [] });
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
        expect(stale(queryClient, ROLES_KEY)).toBe(false);
        expect(stale(queryClient, PERMISSIONS_KEY)).toBe(false);
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

    it('reads the roles and the hand-out flags again for another person or after their roles change', () => {
        const { queryClient, rerender } = mount();

        auth.user = { id: 9, aclVersion: 1 };
        rerender();

        expect(stale(queryClient, ROLES_KEY)).toBe(true);
        expect(stale(queryClient, PERMISSIONS_KEY)).toBe(true);
        // The copy is kept until the new one arrives; only its age is marked.
        expect(queryClient.getQueryData(ROLES_KEY)).toEqual({ roles: [{ id: 7, can_update: true, can_delete: true }] });
        expect(stale(queryClient, ['unrelated'])).toBe(false);

        queryClient.setQueryData(ROLES_KEY, { roles: [] });
        queryClient.setQueryData(PERMISSIONS_KEY, { permissions: [] });
        auth.user = { id: 9, aclVersion: 2 };
        rerender();

        expect(stale(queryClient, ROLES_KEY)).toBe(true);
        expect(stale(queryClient, PERMISSIONS_KEY)).toBe(true);
    });

    it("marks the navigation stale when the person's access changes, it is filtered like the page list (F251)", () => {
        const { queryClient, rerender } = mount();
        // The first mount already read the navigation again; this one is up to date.
        queryClient.setQueryData(NAVIGATION_KEY, { items: [] });
        expect(stale(queryClient, NAVIGATION_KEY)).toBe(false);

        auth.user = { id: 5, aclVersion: 2 };
        rerender();

        expect(stale(queryClient, NAVIGATION_KEY)).toBe(true);
        expect(queryClient.getQueryData(NAVIGATION_KEY)).toEqual({ items: [] });
    });

    it('treats a new access stamp as a change of access although the version stayed (C5)', () => {
        auth.user = { id: 5, aclVersion: 1, aclStamp: 'aaaaaaaaaaaaaaaa' };
        const { queryClient, rerender } = mount();
        queryClient.setQueryData(NAVIGATION_KEY, { items: [] });

        // The same stamp again, as every refetch of the user data brings it: nothing happens.
        auth.user = { id: 5, aclVersion: 1, aclStamp: 'aaaaaaaaaaaaaaaa' };
        rerender();
        expect(stale(queryClient, LIST_KEY)).toBe(false);
        expect(stale(queryClient, NAVIGATION_KEY)).toBe(false);

        // A group of the person changed: their own version did not move, the stamp did.
        auth.user = { id: 5, aclVersion: 1, aclStamp: 'bbbbbbbbbbbbbbbb' };
        rerender();

        expect(stale(queryClient, LIST_KEY)).toBe(true);
        expect(stale(queryClient, ROLES_KEY)).toBe(true);
        expect(stale(queryClient, NAVIGATION_KEY)).toBe(true);
    });
});
