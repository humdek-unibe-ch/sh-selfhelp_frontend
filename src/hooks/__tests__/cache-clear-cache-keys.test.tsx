/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
/**
 * Regression guard (canonical Testing Rule 2) for the cache-key drift the audit
 * flagged: `useClearApiRoutesCacheMutation` invalidated an ad-hoc
 * `['admin', 'cache']` key that no view subscribed to, so the cache stats/health
 * cards (which read `['cache-stats']` / `['cache-health']`) stayed stale after
 * clearing the API-routes cache.
 *
 * These tests pin that the mutation now invalidates exactly the registry keys
 * the `useCacheStats` / `useCacheHealth` readers use, and never the dead literal.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { type ReactNode } from 'react';
import { renderHook } from '@testing-library/react';
import { QueryClientProvider, type QueryClient } from '@tanstack/react-query';
import { createTestQueryClient } from '../../test-utils/renderWithProviders';
import { REACT_QUERY_CONFIG } from '../../config/react-query.config';

const { clearApiRoutesCache } = vi.hoisted(() => ({
    clearApiRoutesCache: vi.fn(),
}));

vi.mock('../../api/admin/cache.api', () => ({
    AdminCacheApi: { clearApiRoutesCache },
}));

vi.mock('@mantine/notifications', () => ({
    notifications: { show: vi.fn() },
}));

import { useClearApiRoutesCacheMutation } from '../useSectionUtility';

const QK = REACT_QUERY_CONFIG.QUERY_KEYS;

/** Collect every queryKey passed to `invalidateQueries`, JSON-encoded for set comparison. */
function invalidatedKeys(calls: unknown[][]): string[] {
    return calls.map((call) => {
        const arg = call[0] as { queryKey?: unknown } | undefined;
        return JSON.stringify(arg?.queryKey);
    });
}

function makeWrapper(queryClient: QueryClient) {
    return function Wrapper({ children }: { children: ReactNode }) {
        return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
    };
}

describe('clear-api-routes-cache invalidation keys', () => {
    beforeEach(() => {
        clearApiRoutesCache.mockReset();
    });

    it('cache registry keys match the keys the cache read hooks subscribe to', () => {
        // `useCacheStats` / `useCacheHealth` read these exact shapes.
        expect(QK.CACHE_STATS).toEqual(['cache-stats']);
        expect(QK.CACHE_HEALTH).toEqual(['cache-health']);
        // The buggy literal must never equal the real keys.
        expect(QK.CACHE_STATS).not.toEqual(['admin', 'cache']);
        expect(QK.CACHE_HEALTH).not.toEqual(['admin', 'cache']);
    });

    it('invalidates the cache stats + health keys, never the dead admin/cache literal', async () => {
        clearApiRoutesCache.mockResolvedValue({ message: 'cleared' });
        const queryClient = createTestQueryClient();
        const spy = vi.spyOn(queryClient, 'invalidateQueries');

        const { result } = renderHook(() => useClearApiRoutesCacheMutation(), {
            wrapper: makeWrapper(queryClient),
        });

        await result.current.mutateAsync();

        const keys = invalidatedKeys(spy.mock.calls);
        expect(keys).toContain(JSON.stringify(QK.CACHE_STATS));
        expect(keys).toContain(JSON.stringify(QK.CACHE_HEALTH));
        expect(keys).not.toContain(JSON.stringify(['admin', 'cache']));
    });
});
