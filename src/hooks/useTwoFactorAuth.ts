/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { notifications } from '@mantine/notifications';
import { AuthApi } from '../api/auth.api';
import { ROUTES } from '../config/routes.config';
import { ITwoFactorVerifyRequest } from '../types/requests/auth/auth.types';

export const TWO_FACTOR_CONSTANTS = {
    TIMER_KEY: '2fa_time_remaining',
    TIMER_LAST_UPDATE_KEY: '2fa_last_update',
    TIMER_FRESH_LOGIN_KEY: '2fa_fresh_login',
    USER_ID_KEY: 'two_factor_id_users',
    INITIAL_TIME: 600, // 10 minutes
    CODE_LENGTH: 6,
} as const;

const { TIMER_KEY, TIMER_LAST_UPDATE_KEY, TIMER_FRESH_LOGIN_KEY, USER_ID_KEY, INITIAL_TIME, CODE_LENGTH } =
    TWO_FACTOR_CONSTANTS;

const EMPTY_CODE: string[] = new Array(CODE_LENGTH).fill('');

export const formatTime = (seconds: number) =>
    `${Math.floor(seconds / 60)}:${(seconds % 60).toString().padStart(2, '0')}`;

interface UseTwoFactorAuthOptions {
    /** Fallback message used when a thrown error has no `.message` */
    fallbackErrorMessage?: string;
}

/**
 * Stateful UI hook backing both the `/auth/two-factor-authentication`
 * fallback page and the CMS-rendered `TwoFactorAuthStyle`. Owns the
 * 6-digit code state, the 10-minute expiration timer (persisted in
 * `sessionStorage`), the verification call, and the redirect on success.
 *
 * All `sessionStorage` / `document` access is guarded with
 * `typeof window` so the hook is safe during Next.js' server render of
 * the client boundary.
 */
export function useTwoFactorAuth(options: UseTwoFactorAuthOptions = {}) {
    const { fallbackErrorMessage = 'The verification code is incorrect. Please try again.' } = options;

    const [code, setCode] = useState<string[]>(EMPTY_CODE);
    const [isLoading, setIsLoading] = useState(false);
    // Timer starts at `INITIAL_TIME` on both server and client so the SSR
    // markup matches hydration. The effect below restores the persisted
    // remaining time on mount.
    const [timer, setTimer] = useState<number>(INITIAL_TIME);
    const [errorMessage, setErrorMessage] = useState('');
    const inputsRef = useRef<Array<HTMLInputElement | null>>(new Array(CODE_LENGTH).fill(null));

    const router = useRouter();
    const searchParams = useSearchParams();
    const redirectTo = searchParams.get('redirectTo') || ROUTES.HOME;
    const userIdFromUrl = searchParams.get('user') || '';

    // Derive the user id from URL → sessionStorage. Computed via `useMemo`
    // (not state) so we don't fight the "no setState in effect" lint rule.
    // SSR-safe because the `typeof window` guard returns '' on the server.
    const userId = useMemo<string>(() => {
        if (typeof window === 'undefined') return '';
        return userIdFromUrl || sessionStorage.getItem(USER_ID_KEY) || '';
    }, [userIdFromUrl]);

    // Redirect to login when no user id is resolvable on the client.
    useEffect(() => {
        if (typeof window === 'undefined') return;
        if (!userId) {
            router.replace(ROUTES.LOGIN);
        }
    }, [userId, router]);

    // Mark fresh login if we came from the login page.
    useEffect(() => {
        if (document.referrer.includes(ROUTES.LOGIN)) {
            sessionStorage.setItem(TIMER_FRESH_LOGIN_KEY, 'true');
        }
    }, []);

    // Timer initialization & countdown. We deliberately call `setTimer`
    // here once on mount to restore the persisted remaining time —
    // sessionStorage is an external store with no subscription API, so
    // a one-shot mount sync is the cleanest available pattern.
    useEffect(() => {
        const isFreshLogin = sessionStorage.getItem(TIMER_FRESH_LOGIN_KEY) === 'true';
        let initialTimeValue: number;

        if (isFreshLogin) {
            initialTimeValue = INITIAL_TIME;
            sessionStorage.removeItem(TIMER_FRESH_LOGIN_KEY);
        } else if (sessionStorage.getItem(TIMER_KEY)) {
            const storedTime = parseInt(sessionStorage.getItem(TIMER_KEY) || '0', 10);
            const lastUpdate = parseInt(sessionStorage.getItem(TIMER_LAST_UPDATE_KEY) || '0', 10);
            const elapsedSeconds = lastUpdate ? Math.floor((Date.now() - lastUpdate) / 1000) : 0;
            initialTimeValue = Math.max(0, storedTime - elapsedSeconds);
        } else {
            initialTimeValue = INITIAL_TIME;
        }

        // eslint-disable-next-line react-hooks/set-state-in-effect -- one-shot sync from sessionStorage on mount
        setTimer(initialTimeValue);
        sessionStorage.setItem(TIMER_KEY, initialTimeValue.toString());
        sessionStorage.setItem(TIMER_LAST_UPDATE_KEY, Date.now().toString());

        const intervalId = setInterval(() => {
            setTimer(prev => {
                if (prev <= 0) {
                    clearInterval(intervalId);
                    return 0;
                }
                const next = prev - 1;
                sessionStorage.setItem(TIMER_KEY, next.toString());
                sessionStorage.setItem(TIMER_LAST_UPDATE_KEY, Date.now().toString());
                return next;
            });
        }, 1000);

        return () => clearInterval(intervalId);
    }, []);

    const submitCode = useCallback(async (codeArray: string[]) => {
        if (codeArray.some(d => !d) || timer === 0 || !userId) return;

        setIsLoading(true);
        setErrorMessage('');

        try {
            const payload: ITwoFactorVerifyRequest = {
                code: codeArray.join(''),
                id_users: Number(userId),
            };
            await AuthApi.verifyTwoFactor(payload);

            notifications.show({
                title: 'Success',
                message: 'Successfully authenticated',
                color: 'green',
            });
            router.push(redirectTo);
        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : fallbackErrorMessage;

            notifications.show({
                title: 'Invalid code',
                message: errorMsg,
                color: 'red',
            });

            setErrorMessage(errorMsg);
            setCode(EMPTY_CODE);
            setTimeout(() => inputsRef.current[0]?.focus(), 100);
            setTimeout(() => setErrorMessage(''), 5000);
        } finally {
            setIsLoading(false);
        }
    }, [timer, userId, redirectTo, router, fallbackErrorMessage]);

    const handleInputChange = useCallback((index: number, value: string) => {
        if (!/^[0-9]?$/.test(value)) return;

        setCode(prev => {
            const next = [...prev];
            next[index] = value;

            if (value && index < CODE_LENGTH - 1) {
                inputsRef.current[index + 1]?.focus();
            }

            if (next.every(d => d) && timer > 0) {
                setTimeout(() => submitCode(next), 100);
            }

            return next;
        });
    }, [timer, submitCode]);

    const handleKeyDown = useCallback((index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key !== 'Backspace') return;

        setCode(prev => {
            const next = [...prev];
            if (prev[index]) {
                next[index] = '';
            } else if (index > 0) {
                inputsRef.current[index - 1]?.focus();
                next[index - 1] = '';
            }
            return next;
        });
    }, []);

    const handlePaste = useCallback((e: React.ClipboardEvent<HTMLInputElement>) => {
        e.preventDefault();

        const digits = e.clipboardData.getData('text').replace(/\D/g, '').split('').slice(0, CODE_LENGTH);
        if (!digits.length) return;

        setCode(prev => {
            const next = [...prev];
            digits.forEach((digit, i) => {
                if (i < CODE_LENGTH) next[i] = digit;
            });

            if (digits.length === CODE_LENGTH && next.every(d => d) && timer > 0) {
                setTimeout(() => submitCode(next), 500);
            } else {
                const firstEmpty = next.findIndex(d => !d);
                if (firstEmpty !== -1) {
                    setTimeout(() => inputsRef.current[firstEmpty]?.focus(), 10);
                }
            }

            return next;
        });
    }, [timer, submitCode]);

    const goToLogin = useCallback(() => router.push(ROUTES.LOGIN), [router]);

    return {
        code,
        timer,
        isLoading,
        errorMessage,
        inputsRef,
        handleInputChange,
        handleKeyDown,
        handlePaste,
        submitCode,
        goToLogin,
    };
}
