/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

/**
 * The 2FA challenge keeps its pending state in `sessionStorage` (the user id
 * being verified plus the 10-minute expiry timer). Abandoning the challenge via
 * "Back to Login" must clear that state: leaving the user id behind resumes the
 * PREVIOUS user's challenge on a later visit, and a stale timer makes the next
 * attempt start part-expired.
 */
const { pushMock, searchParamsState } = vi.hoisted(() => ({
    pushMock: vi.fn(),
    searchParamsState: { redirectTo: null as string | null },
}));

vi.mock('next/navigation', () => ({
    useRouter: () => ({ push: pushMock, replace: vi.fn(), prefetch: vi.fn() }),
    // Answers only to `redirectTo`, the one name the login URL is written with.
    useSearchParams: () => ({ get: (name: string) => (name === 'redirectTo' ? searchParamsState.redirectTo : null) }),
}));
vi.mock('@mantine/notifications', () => ({ notifications: { show: vi.fn() } }));
vi.mock('../../api/auth.api', () => ({ AuthApi: { verifyTwoFactor: vi.fn() } }));

import { useTwoFactorAuth, TWO_FACTOR_CONSTANTS } from '../useTwoFactorAuth';
import { AuthApi } from '../../api/auth.api';
import { notifications } from '@mantine/notifications';

const { TIMER_KEY, TIMER_LAST_UPDATE_KEY, TIMER_FRESH_LOGIN_KEY, USER_ID_KEY } = TWO_FACTOR_CONSTANTS;

describe('useTwoFactorAuth', () => {
    beforeEach(() => {
        pushMock.mockClear();
        searchParamsState.redirectTo = null;
        sessionStorage.clear();
    });

    afterEach(() => {
        sessionStorage.clear();
    });

    it('clears the pending challenge state when the user abandons 2FA via "Back to Login"', () => {
        sessionStorage.setItem(USER_ID_KEY, '42');
        sessionStorage.setItem(TIMER_KEY, '120');
        sessionStorage.setItem(TIMER_LAST_UPDATE_KEY, String(Date.now()));
        sessionStorage.setItem(TIMER_FRESH_LOGIN_KEY, 'true');

        const { result } = renderHook(() => useTwoFactorAuth());

        act(() => {
            result.current.goToLogin();
        });

        // No leftovers: a later visit must not resume user 42's challenge, and
        // the next attempt must start from a full timer.
        expect(sessionStorage.getItem(USER_ID_KEY)).toBeNull();
        expect(sessionStorage.getItem(TIMER_KEY)).toBeNull();
        expect(sessionStorage.getItem(TIMER_LAST_UPDATE_KEY)).toBeNull();
        expect(sessionStorage.getItem(TIMER_FRESH_LOGIN_KEY)).toBeNull();
        expect(pushMock).toHaveBeenCalledWith('/login');
    });

    it('sends a verified user to the same-site redirectTo target', async () => {
        sessionStorage.setItem(USER_ID_KEY, '42');
        searchParamsState.redirectTo = '/admin/pages?page=2';
        vi.mocked(AuthApi.verifyTwoFactor).mockResolvedValueOnce(
            {} as Awaited<ReturnType<typeof AuthApi.verifyTwoFactor>>,
        );
        const { result } = renderHook(() => useTwoFactorAuth());

        await act(async () => {
            await result.current.submitCode(['1', '2', '3', '4', '5', '6']);
        });

        expect(pushMock).toHaveBeenCalledWith('/admin/pages?page=2');
    });

    // Critical: a crafted `/two-factor-authentication?redirectTo=https://evil.example`
    // link sent a user who had just entered their code to the attacker's site.
    it.each([
        ['an absolute URL', 'https://evil.example/phish'],
        ['a protocol-relative URL', '//evil.example'],
        ['a slash-backslash host', '/\\evil.example'],
        ['a javascript: URL', 'javascript:alert(1)'],
    ])('never follows %s after a verified code', async (_label, target) => {
        sessionStorage.setItem(USER_ID_KEY, '42');
        searchParamsState.redirectTo = target;
        vi.mocked(AuthApi.verifyTwoFactor).mockResolvedValueOnce(
            {} as Awaited<ReturnType<typeof AuthApi.verifyTwoFactor>>,
        );
        const { result } = renderHook(() => useTwoFactorAuth());

        await act(async () => {
            await result.current.submitCode(['1', '2', '3', '4', '5', '6']);
        });

        expect(pushMock).toHaveBeenCalledTimes(1);
        expect(pushMock).toHaveBeenCalledWith('/home');
    });

    it('shows the wait time instead of "Invalid code" when 2FA attempts are rate-limited (429)', async () => {
        sessionStorage.setItem(USER_ID_KEY, '42');
        vi.mocked(AuthApi.verifyTwoFactor).mockRejectedValueOnce({
            response: { status: 429, data: { data: { retry_after: 120 } } },
        });
        const { result } = renderHook(() =>
            useTwoFactorAuth({ rateLimitMessage: 'Zu viele Versuche. Bitte in {minutes} Min. erneut versuchen.' }),
        );

        await act(async () => {
            await result.current.submitCode(['1', '2', '3', '4', '5', '6']);
        });

        expect(result.current.errorMessage).toBe('Zu viele Versuche. Bitte in 2 Min. erneut versuchen.');
        expect(vi.mocked(notifications.show)).toHaveBeenCalledWith(
            expect.objectContaining({ message: 'Zu viele Versuche. Bitte in 2 Min. erneut versuchen.', color: 'orange' }),
        );
    });
});
