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
const { pushMock } = vi.hoisted(() => ({ pushMock: vi.fn() }));

vi.mock('next/navigation', () => ({
    useRouter: () => ({ push: pushMock, replace: vi.fn(), prefetch: vi.fn() }),
    useSearchParams: () => ({ get: () => null }),
}));
vi.mock('@mantine/notifications', () => ({ notifications: { show: vi.fn() } }));
vi.mock('../../api/auth.api', () => ({ AuthApi: { verifyTwoFactor: vi.fn() } }));

import { useTwoFactorAuth, TWO_FACTOR_CONSTANTS } from '../useTwoFactorAuth';

const { TIMER_KEY, TIMER_LAST_UPDATE_KEY, TIMER_FRESH_LOGIN_KEY, USER_ID_KEY } = TWO_FACTOR_CONSTANTS;

describe('useTwoFactorAuth', () => {
    beforeEach(() => {
        pushMock.mockClear();
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
});
