/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
/**
 * Regression: the Refine auth `check()` must NOT log the operator out when the
 * backend is briefly unavailable.
 *
 * When the manager applies a plugin / system operation it restarts Symfony, so
 * `/api/auth/user-data` answers with a transient network error or 5xx (the BFF
 * deliberately keeps the httpOnly session and replies 503 `logged_in:true`).
 * The previous `check()` collapsed every failure to "not authenticated", so
 * Refine bounced the operator to `/auth/login` mid plugin-install — the
 * "I got kicked out and had to log in again when the backend restarted"
 * report. A transient failure now keeps the session; only a genuine
 * 401 `logged_in:false` (a deliberate verdict from a backend that WAS reached)
 * still signs the operator out.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

const getUserData = vi.fn();

vi.mock('../query-client', () => ({
    // Bypass the React Query cache entirely: call the query function directly so
    // the test drives exactly what the backend returns for this `check()`.
    getQueryClient: () => ({
        fetchQuery: (options: { queryFn: () => unknown }) => options.queryFn(),
        removeQueries: vi.fn(),
    }),
}));

vi.mock('../../api/auth.api', () => ({
    AuthApi: { getUserData: (...args: unknown[]) => getUserData(...args) },
}));

import { authProvider } from '../auth.provider';

/** Minimal axios-error shape — `axios.isAxiosError` only checks this flag. */
function axiosError(status?: number, data: Record<string, unknown> = {}): unknown {
    return status === undefined
        ? { isAxiosError: true } // no response → network error / timeout
        : { isAxiosError: true, response: { status, data } };
}

describe('authProvider.check (transient backend outage)', () => {
    beforeEach(() => {
        getUserData.mockReset();
        if (typeof window !== 'undefined') window.localStorage.clear();
    });

    it('keeps the session authenticated on a transient 503 (backend restarting)', async () => {
        getUserData.mockRejectedValue(axiosError(503, { logged_in: true }));
        await expect(authProvider.check!({})).resolves.toMatchObject({ authenticated: true });
    });

    it('keeps the session authenticated on a network error (no response)', async () => {
        getUserData.mockRejectedValue(axiosError());
        await expect(authProvider.check!({})).resolves.toMatchObject({ authenticated: true });
    });

    it('signs the operator out on a genuine 401 logged_in:false (not transient)', async () => {
        getUserData.mockRejectedValue(axiosError(401, { logged_in: false }));
        await expect(authProvider.check!({})).resolves.toMatchObject({ authenticated: false });
    });

    it('stays authenticated when the backend returns the user', async () => {
        getUserData.mockResolvedValue({ data: { id: 1, email: 'admin@selfhelp.test' } });
        await expect(authProvider.check!({})).resolves.toMatchObject({ authenticated: true });
    });

    it('treats an empty user payload as not authenticated', async () => {
        getUserData.mockResolvedValue({ data: null });
        await expect(authProvider.check!({})).resolves.toMatchObject({ authenticated: false });
    });
});
