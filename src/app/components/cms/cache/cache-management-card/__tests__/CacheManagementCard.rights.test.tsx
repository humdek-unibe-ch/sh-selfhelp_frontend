/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '../../../../../../test-utils/renderWithProviders';
import { PERMISSIONS } from '../../../../../../types/auth/jwt-payload.types';

/**
 * The cache controls follow their routes' rights: the clear buttons need
 * admin.cache.clear, Reset Statistics needs admin.cache.manage.
 */
const state = vi.hoisted(() => ({ held: new Set<string>() }));

vi.mock('../../../../../../hooks/useUserData', () => ({
    useAuthUser: () => ({ permissionChecker: { hasPermission: (name: string) => state.held.has(name) } }),
}));
vi.mock('../../../../../../hooks/useCache', () => {
    const mutation = () => ({ mutate: vi.fn(), isPending: false });
    return {
        useClearAllCachesMutation: mutation,
        useClearCacheCategoryMutation: mutation,
        useClearUserCacheMutation: mutation,
        useResetCacheStatsMutation: mutation,
    };
});
vi.mock('../../../../../../hooks/useSectionUtility', () => ({
    useClearApiRoutesCacheMutation: () => ({ mutate: vi.fn(), isPending: false }),
}));
vi.mock('../../../../../../hooks/useUsers', () => ({ useUsers: () => ({ data: { users: [] } }) }));

import { CacheManagementCard } from '../CacheManagementCard';

describe('CacheManagementCard rights', () => {
    beforeEach(() => {
        state.held = new Set([PERMISSIONS.ADMIN_CACHE_READ]);
    });

    it('shows only Reset Statistics with admin.cache.manage', () => {
        state.held.add(PERMISSIONS.ADMIN_CACHE_MANAGE);
        renderWithProviders(<CacheManagementCard />);

        expect(screen.getByRole('button', { name: /Reset Statistics/ })).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: /Clear All Caches/ })).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: /Clear API Routes Cache/ })).not.toBeInTheDocument();
    });

    it('shows the clear buttons with admin.cache.clear, without Reset Statistics', () => {
        state.held.add(PERMISSIONS.ADMIN_CACHE_CLEAR);
        renderWithProviders(<CacheManagementCard />);

        expect(screen.getByRole('button', { name: /Clear All Caches/ })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Clear Category/ })).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: /Reset Statistics/ })).not.toBeInTheDocument();
    });
});
