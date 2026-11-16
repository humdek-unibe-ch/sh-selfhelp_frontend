/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
/**
 * An entry list shows the same address to different people differently. Signing
 * in, signing out and impersonating must therefore never leave the cached rows,
 * buttons or history of the previous person behind.
 */
import { QueryClient } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { REACT_QUERY_CONFIG } from '../../config/react-query.config';

const mocks = vi.hoisted(() => ({
    client: null as unknown as QueryClient,
    login: vi.fn(),
    logout: vi.fn(),
    getUserData: vi.fn(),
    getPages: vi.fn(),
    getNavigation: vi.fn(),
}));

vi.mock('../query-client', () => ({ getQueryClient: () => mocks.client }));
vi.mock('../../api/auth.api', () => ({
    AuthApi: {
        login: (...args: unknown[]) => mocks.login(...args),
        logout: (...args: unknown[]) => mocks.logout(...args),
        getUserData: (...args: unknown[]) => mocks.getUserData(...args),
    },
}));
vi.mock('../../api/navigation.api', () => ({
    NavigationApi: {
        getPagesWithLanguage: (...args: unknown[]) => mocks.getPages(...args),
        getNavigation: (...args: unknown[]) => mocks.getNavigation(...args),
    },
}));
vi.mock('../../utils/auth-broadcast', () => ({ broadcastAuthChange: vi.fn(), subscribeAuthBroadcast: vi.fn() }));
vi.mock('../../api/permission-wrapper.api', () => ({ permissionManager: { clearPermissions: vi.fn() } }));

import { authProvider } from '../auth.provider';

const { FORM_LIST_ALL, FORM_LIST_HISTORY_ALL } = REACT_QUERY_CONFIG.QUERY_KEYS;

function seedLists(client: QueryClient): void {
    client.setQueryData([...FORM_LIST_ALL, 'account-5', 21, ''], { rows: ['the first person'] });
    client.setQueryData([...FORM_LIST_HISTORY_ALL, 'account-5', 21, 1], { versions: [1] });
    client.setQueryData(['unrelated'], 'keep');
}

function expectNoListsLeft(client: QueryClient): void {
    expect(client.getQueriesData({ queryKey: FORM_LIST_ALL })).toEqual([]);
    expect(client.getQueriesData({ queryKey: FORM_LIST_HISTORY_ALL })).toEqual([]);
    expect(client.getQueryData(['unrelated'])).toBe('keep');
}

describe('the entry lists across a change of person', () => {
    beforeEach(() => {
        mocks.client = new QueryClient();
        mocks.login.mockReset().mockResolvedValue({ data: { id: 9 } });
        mocks.logout.mockReset().mockResolvedValue({});
        mocks.getUserData.mockReset().mockResolvedValue({ data: { id: 9, language: { id: 1 } } });
        mocks.getPages.mockReset().mockResolvedValue({ pages: [] });
        mocks.getNavigation.mockReset().mockResolvedValue({ menus: {} });
        seedLists(mocks.client);
    });

    it('are dropped when the person signs out', async () => {
        await expect(authProvider.logout({})).resolves.toMatchObject({ success: true });

        expectNoListsLeft(mocks.client);
    });

    it('are dropped even when the sign-out request fails, because the session is gone either way', async () => {
        mocks.logout.mockRejectedValue(new Error('offline'));

        await authProvider.logout({});

        expectNoListsLeft(mocks.client);
    });

    it('are dropped when another person signs in on the same tab', async () => {
        await expect(authProvider.login({ email: 'b@example.org', password: 'pw' })).resolves.toMatchObject({ success: true });

        expectNoListsLeft(mocks.client);
    });
});
