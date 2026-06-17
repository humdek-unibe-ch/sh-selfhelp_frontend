/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { type ReactNode } from 'react';
import { renderHook, act } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { createTestQueryClient } from '../../test-utils/renderWithProviders';

/**
 * Regression guard (canonical Testing Rule 2) for the "installing a plugin
 * signs me out" report. While the manager restarts Symfony for a plugin /
 * system operation, `/auth/user-data` answers with a transient 5xx / network
 * error for a few seconds. The auth status hook must:
 *
 *   1. RIDE OUT the transient error (retry it) rather than settle to a logout, and
 *   2. once it does settle with no user, classify it as `isBackendUnavailable`
 *      (so the admin shell stays put) — NEVER for a genuine `401`.
 *
 * Timers are faked and flushed with `vi.runAllTimersAsync()` so the retry chain
 * is exercised deterministically and instantly (no real waiting, no flakiness).
 */
const { getUserData } = vi.hoisted(() => ({ getUserData: vi.fn() }));

vi.mock('../../api/auth.api', () => ({
    AuthApi: { getUserData },
}));
vi.mock('../../api/permission-wrapper.api', () => ({
    permissionManager: { setPermissions: vi.fn(), clearPermissions: vi.fn() },
}));

import { useAuthStatus } from '../useUserData';

function wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={createTestQueryClient()}>{children}</QueryClientProvider>;
}

const transientError = { isAxiosError: true, response: { status: 503 } };
const sessionExpiredError = { isAxiosError: true, response: { status: 401 } };

beforeEach(() => {
    vi.useFakeTimers();
    getUserData.mockReset();
});

afterEach(() => {
    vi.useRealTimers();
});

describe('useAuthStatus — transient backend outage vs. genuine logout', () => {
    it('retries a transient 5xx and reports isBackendUnavailable (not a logout)', async () => {
        getUserData.mockRejectedValue(transientError);

        const { result } = renderHook(() => useAuthStatus(), { wrapper });

        await act(async () => {
            await vi.runAllTimersAsync();
        });

        // The probe was retried (not a one-shot failure) so the restart window
        // is ridden out...
        expect(getUserData.mock.calls.length).toBeGreaterThan(1);
        // ...and once it finally settles with no user, the outage is flagged as
        // transient so the shell stays put instead of bouncing to login.
        expect(result.current.isAuthenticated).toBe(false);
        expect(result.current.isBackendUnavailable).toBe(true);
    });

    it('does NOT retry a genuine 401 and does NOT flag it as a transient outage', async () => {
        getUserData.mockRejectedValue(sessionExpiredError);

        const { result } = renderHook(() => useAuthStatus(), { wrapper });

        await act(async () => {
            await vi.runAllTimersAsync();
        });

        expect(getUserData).toHaveBeenCalledTimes(1);
        expect(result.current.isAuthenticated).toBe(false);
        expect(result.current.isBackendUnavailable).toBe(false);
    });

    it('reports an authenticated session and no outage when user-data resolves', async () => {
        getUserData.mockResolvedValue({
            data: { id: 1, email: 'qa.admin@selfhelp.test', permissions: ['admin.access'] },
        });

        const { result } = renderHook(() => useAuthStatus(), { wrapper });

        await act(async () => {
            await vi.runAllTimersAsync();
        });

        expect(result.current.isAuthenticated).toBe(true);
        expect(result.current.isBackendUnavailable).toBe(false);
    });
});
