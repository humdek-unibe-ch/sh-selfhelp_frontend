'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { notifications } from '@mantine/notifications';
import { AuthApi } from '../../api/auth.api';
import { ROUTES } from '../../config/routes.config';
import { ITwoFactorVerifyRequest } from '../../types/requests/auth/auth.types';

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

export function useTwoFactorAuth(options: UseTwoFactorAuthOptions = {}) {
    const { fallbackErrorMessage = 'The verification code is incorrect. Please try again.' } = options;

    const [code, setCode] = useState<string[]>(EMPTY_CODE);
    const [isLoading, setIsLoading] = useState(false);
    const [timer, setTimer] = useState<number>(INITIAL_TIME);
    const [errorMessage, setErrorMessage] = useState("");
    const inputsRef = useRef<Array<HTMLInputElement | null>>(new Array(CODE_LENGTH).fill(null));
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    const router = useRouter();
    const searchParams = useSearchParams();
    const redirectTo = searchParams.get('redirectTo') || ROUTES.HOME;
    const userId = searchParams.get('user') || sessionStorage.getItem(USER_ID_KEY) || '';

    // Redirect to login if no userId
    useEffect(() => {
        if (!userId) {
            router.replace(ROUTES.LOGIN);
        }
    }, [userId, router]);

    // Mark fresh login if we came from the login page
    useEffect(() => {
        if (document.referrer.includes(ROUTES.LOGIN)) {
            sessionStorage.setItem(TIMER_FRESH_LOGIN_KEY, 'true');
        }
    }, []);

    // Timer initialization & countdown
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

        setTimer(initialTimeValue);
        sessionStorage.setItem(TIMER_KEY, initialTimeValue.toString());
        sessionStorage.setItem(TIMER_LAST_UPDATE_KEY, Date.now().toString());

        if (timerRef.current) clearInterval(timerRef.current);

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

        timerRef.current = intervalId as unknown as NodeJS.Timeout;

        return () => {
            if (timerRef.current) clearInterval(timerRef.current as unknown as NodeJS.Timeout);
        };
    }, []);

    const submitCode = async (codeArray: string[]) => {
        if (codeArray.some(d => !d) || timer === 0) return;

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
    };

    const handleInputChange = (index: number, value: string) => {
        if (!/^[0-9]?$/.test(value)) return;

        const newCode = [...code];
        newCode[index] = value;
        setCode(newCode);

        if (value && index < CODE_LENGTH - 1) {
            inputsRef.current[index + 1]?.focus();
        }

        if (newCode.every(d => d) && timer > 0) {
            setTimeout(() => submitCode(newCode), 100);
        }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key !== 'Backspace') return;

        const newCode = [...code];
        if (code[index]) {
            newCode[index] = '';
            setCode(newCode);
        } else if (index > 0) {
            inputsRef.current[index - 1]?.focus();
            newCode[index - 1] = '';
            setCode(newCode);
        }
    };

    const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
        e.preventDefault();

        const digits = e.clipboardData.getData('text').replace(/\D/g, '').split('').slice(0, CODE_LENGTH);
        if (!digits.length) return;

        const newCode = [...code];
        digits.forEach((digit, i) => {
            if (i < CODE_LENGTH) newCode[i] = digit;
        });
        setCode(newCode);

        if (digits.length === CODE_LENGTH && newCode.every(d => d) && timer > 0) {
            setTimeout(() => submitCode(newCode), 500);
        } else {
            const firstEmpty = newCode.findIndex(d => !d);
            if (firstEmpty !== -1) {
                setTimeout(() => inputsRef.current[firstEmpty]?.focus(), 10);
            }
        }
    };

    const goToLogin = () => router.push(ROUTES.LOGIN);

    return {
        // state
        code,
        timer,
        isLoading,
        errorMessage,
        userId,
        codeLength: CODE_LENGTH,
        // refs
        inputsRef,
        // handlers
        handleInputChange,
        handleKeyDown,
        handlePaste,
        submitCode,
        goToLogin,
        // helpers
        formatTime,
    };
}