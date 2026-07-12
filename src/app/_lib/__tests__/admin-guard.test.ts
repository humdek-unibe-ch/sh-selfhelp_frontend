/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { type SsrAuthOutcome, getAuthMeSSRResult } from '../server-fetch';

/**
 * Security regression test for the server-side admin authorization guard.
 *
 * Mocks only the boundary: Next's request APIs (`cookies`, `redirect`) and the
 * SSR user-data probe. The `redirect` mock throws like the real one, so a
 * guarded call that must deny access rejects instead of silently continuing —
 * mirroring how an unauthorized admin page never renders server-side.
 *
 * The transient-outage cases are the regression guard for the "installing a
 * plugin bounced me to /auth/login" report: while the manager restarts Symfony
 * the probe answers `unreachable` (5xx / network), and the guard MUST fail open
 * (keep the operator in place) rather than treat it as a logout.
 */
vi.mock('next/navigation', () => ({
    redirect: vi.fn((url: string) => {
        throw new Error(`REDIRECT:${url}`);
    }),
}));
vi.mock('next/headers', () => ({
    cookies: vi.fn(),
}));
vi.mock('../server-fetch', () => ({
    getAuthMeSSRResult: vi.fn(),
}));

import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';

import { requireAdminAccessSSR, requireAdminPermission } from '../admin-guard';
import { PERMISSIONS } from '../../../types/auth/jwt-payload.types';
import { ROUTES } from '../../../config/routes.config';

const redirectMock = vi.mocked(redirect);
const cookiesMock = vi.mocked(cookies);
const getAuthMeResultMock = vi.mocked(getAuthMeSSRResult);

function seed({ loggedIn, outcome }: { loggedIn: boolean; outcome?: SsrAuthOutcome }): void {
    cookiesMock.mockResolvedValue({
        get: () => (loggedIn ? { name: 'sh_auth', value: 'tok' } : undefined),
    } as unknown as Awaited<ReturnType<typeof cookies>>);
    if (outcome) {
        getAuthMeResultMock.mockResolvedValue(outcome);
    }
}

function okWith(permissions: string[]): SsrAuthOutcome {
    return { status: 'ok', data: { data: { permissions } } };
}

beforeEach(() => {
    vi.clearAllMocks();
});

describe('requireAdminAccessSSR', () => {
    it('redirects to login when there is no auth cookie', async () => {
        seed({ loggedIn: false });
        await expect(requireAdminAccessSSR()).rejects.toThrow(`REDIRECT:${ROUTES.LOGIN}`);
        expect(redirectMock).toHaveBeenCalledWith(ROUTES.LOGIN);
    });

    it('redirects to login when the probe reports unauthenticated', async () => {
        seed({ loggedIn: true, outcome: { status: 'unauthenticated' } });
        await expect(requireAdminAccessSSR()).rejects.toThrow(`REDIRECT:${ROUTES.LOGIN}`);
        expect(redirectMock).toHaveBeenCalledWith(ROUTES.LOGIN);
    });

    it('redirects to login when the user-data envelope is empty', async () => {
        seed({ loggedIn: true, outcome: { status: 'ok', data: {} } });
        await expect(requireAdminAccessSSR()).rejects.toThrow(`REDIRECT:${ROUTES.LOGIN}`);
        expect(redirectMock).toHaveBeenCalledWith(ROUTES.LOGIN);
    });

    it('redirects to no-access for a logged-in user without admin.access', async () => {
        seed({ loggedIn: true, outcome: okWith(['admin.user.read']) });
        await expect(requireAdminAccessSSR()).rejects.toThrow(`REDIRECT:${ROUTES.NO_ACCESS}`);
        expect(redirectMock).toHaveBeenCalledWith(ROUTES.NO_ACCESS);
    });

    it('resolves with the permission list when the user can access admin', async () => {
        seed({ loggedIn: true, outcome: okWith([PERMISSIONS.ADMIN_ACCESS]) });
        await expect(requireAdminAccessSSR()).resolves.toEqual([PERMISSIONS.ADMIN_ACCESS]);
        expect(redirectMock).not.toHaveBeenCalled();
    });

    it('fails open (no redirect) during a transient backend outage', async () => {
        // The manager is restarting Symfony for a plugin/system operation: the
        // probe answers `unreachable`. The session is intact — keep the operator
        // in place instead of bouncing them to login.
        seed({ loggedIn: true, outcome: { status: 'unreachable' } });
        await expect(requireAdminAccessSSR()).resolves.toEqual([]);
        expect(redirectMock).not.toHaveBeenCalled();
    });
});

describe('requireAdminPermission', () => {
    it('redirects to no-access when the specific permission is missing', async () => {
        seed({ loggedIn: true, outcome: okWith([PERMISSIONS.ADMIN_ACCESS]) });
        await expect(requireAdminPermission(PERMISSIONS.ADMIN_SCHEDULED_JOB_READ)).rejects.toThrow(
            `REDIRECT:${ROUTES.NO_ACCESS}`,
        );
        expect(redirectMock).toHaveBeenCalledWith(ROUTES.NO_ACCESS);
    });

    it('resolves when the user holds admin.access and the specific permission', async () => {
        seed({
            loggedIn: true,
            outcome: okWith([PERMISSIONS.ADMIN_ACCESS, PERMISSIONS.ADMIN_SCHEDULED_JOB_READ]),
        });
        await expect(
            requireAdminPermission(PERMISSIONS.ADMIN_SCHEDULED_JOB_READ),
        ).resolves.toBeUndefined();
        expect(redirectMock).not.toHaveBeenCalled();
    });

    it('accepts any one of a list of permissions', async () => {
        seed({
            loggedIn: true,
            outcome: okWith([PERMISSIONS.ADMIN_ACCESS, PERMISSIONS.ADMIN_PLUGINS_EXECUTE]),
        });
        await expect(
            requireAdminPermission([
                PERMISSIONS.ADMIN_PLUGINS_MANAGE,
                PERMISSIONS.ADMIN_PLUGINS_EXECUTE,
                PERMISSIONS.ADMIN_PLUGINS_PURGE,
            ]),
        ).resolves.toBeUndefined();
        expect(redirectMock).not.toHaveBeenCalled();
    });

    it('passes with only admin.access when no specific permission is required', async () => {
        seed({ loggedIn: true, outcome: okWith([PERMISSIONS.ADMIN_ACCESS]) });
        await expect(requireAdminPermission()).resolves.toBeUndefined();
        expect(redirectMock).not.toHaveBeenCalled();
    });

    it('redirects to login when there is no auth cookie', async () => {
        seed({ loggedIn: false });
        await expect(requireAdminPermission(PERMISSIONS.ADMIN_SCHEDULED_JOB_READ)).rejects.toThrow(
            `REDIRECT:${ROUTES.LOGIN}`,
        );
        expect(redirectMock).toHaveBeenCalledWith(ROUTES.LOGIN);
    });

    it('fails open (no redirect) during a transient backend outage even with a required permission', async () => {
        seed({ loggedIn: true, outcome: { status: 'unreachable' } });
        await expect(
            requireAdminPermission(PERMISSIONS.ADMIN_SCHEDULED_JOB_READ),
        ).resolves.toBeUndefined();
        expect(redirectMock).not.toHaveBeenCalled();
    });

    it('redirects to no-access when admin.access is present but CMS app read is missing', async () => {
        seed({ loggedIn: true, outcome: okWith([PERMISSIONS.ADMIN_ACCESS]) });
        await expect(requireAdminPermission(PERMISSIONS.ADMIN_CMS_APP_READ)).rejects.toThrow(
            `REDIRECT:${ROUTES.NO_ACCESS}`,
        );
        expect(redirectMock).toHaveBeenCalledWith(ROUTES.NO_ACCESS);
    });

    it('resolves when the user holds admin.access and CMS app read', async () => {
        seed({
            loggedIn: true,
            outcome: okWith([PERMISSIONS.ADMIN_ACCESS, PERMISSIONS.ADMIN_CMS_APP_READ]),
        });
        await expect(requireAdminPermission(PERMISSIONS.ADMIN_CMS_APP_READ)).resolves.toBeUndefined();
        expect(redirectMock).not.toHaveBeenCalled();
    });
});
