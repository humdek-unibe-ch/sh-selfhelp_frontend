'use client';

import { useEffect, useRef, useState } from 'react';
import { Button, Paper, Title, Container, Text, Group, Box } from '@mantine/core';
import { useRouter, useSearchParams } from 'next/navigation';
import { notifications } from '@mantine/notifications';
import { AuthApi } from '@/api/auth.api';
import { ITwoFactorRequest, ITwoFactorResponse } from '@/types/api/auth.type';

export default function TwoFactorAuthenticationPage() {
    const [code, setCode] = useState<string[]>(['', '', '', '', '', '']);
    const [isLoading, setIsLoading] = useState(false);
    const [timer, setTimer] = useState(600); // 10 minutes in seconds
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    // Timer initialization and management
    useEffect(() => {
        const TIMER_KEY = '2fa_time_remaining';
        const TIMER_LAST_UPDATE_KEY = '2fa_last_update';
        const TIMER_FRESH_LOGIN_KEY = '2fa_fresh_login';
        const INITIAL_TIME = 600; // 10 minutes in seconds

        // Check if this is a fresh login (redirected from login page)
        const isFreshLogin = sessionStorage.getItem(TIMER_FRESH_LOGIN_KEY) === 'true';
        let initialTimeValue: number;

        if (isFreshLogin) {
            // Fresh login - start a new timer
            initialTimeValue = INITIAL_TIME;
            sessionStorage.removeItem(TIMER_FRESH_LOGIN_KEY); // Reset the flag
        } else if (sessionStorage.getItem(TIMER_KEY)) {
            // Resume existing timer
            const storedTime = parseInt(sessionStorage.getItem(TIMER_KEY) || '0', 10);
            const lastUpdate = parseInt(sessionStorage.getItem(TIMER_LAST_UPDATE_KEY) || '0', 10);
            const now = Date.now();

            // Calculate elapsed time since last update (in seconds)
            const elapsedSeconds = lastUpdate ? Math.floor((now - lastUpdate) / 1000) : 0;
            initialTimeValue = Math.max(0, storedTime - elapsedSeconds);
        } else {
            // No timer exists, start a new one
            initialTimeValue = INITIAL_TIME;
        }

        // Set initial timer value
        setTimer(initialTimeValue);

        // Store initial value
        sessionStorage.setItem(TIMER_KEY, initialTimeValue.toString());
        sessionStorage.setItem(TIMER_LAST_UPDATE_KEY, Date.now().toString());

        // Clear any existing timer
        if (timerRef.current) {
            clearInterval(timerRef.current);
        }

        // Use setInterval for more reliable timing
        const intervalId = setInterval(() => {
            setTimer(prevTime => {
                if (prevTime <= 0) {
                    clearInterval(intervalId);
                    return 0;
                }

                const newTime = prevTime - 1;

                // Update storage with new time
                sessionStorage.setItem(TIMER_KEY, newTime.toString());
                sessionStorage.setItem(TIMER_LAST_UPDATE_KEY, Date.now().toString());

                return newTime;
            });
        }, 1000);

        // Store the interval ID for cleanup
        timerRef.current = intervalId as unknown as NodeJS.Timeout;

        // Cleanup on unmount
        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current as unknown as NodeJS.Timeout);
            }
        };
    }, []);

    // Set fresh login flag when component mounts
    useEffect(() => {
        // Check if we came from login page
        const referrer = document.referrer;
        if (referrer.includes('/auth/login')) {
            sessionStorage.setItem('2fa_fresh_login', 'true');
        }
    }, []);


    const router = useRouter();
    const searchParams = useSearchParams();
    const redirectTo = searchParams.get('redirectTo') || '/home';

    // Get id_users from URL or sessionStorage
    const userId = searchParams.get('user') || sessionStorage.getItem('two_factor_id_users') || '';

    // Ensure we have a userId, otherwise redirect to login
    useEffect(() => {
        if (!userId) {
            router.replace('/auth/login');
        }
    }, [userId, router]);

    // Original handleSubmit function - now just calls submitCode with current state
    const handleSubmit = async () => {
        console.log('handleSubmit called with current code state:', code);
        submitCode(code);
    };
    
    // New function to submit with specific code value
    const submitCode = async (codeArray: string[]) => {
        // Validate the code array
        if (codeArray.some(d => !d) || timer === 0) {
            console.log('Not submitting - code incomplete or timer expired', codeArray);
            return;
        }
        
        const codeString = codeArray.join('');
        console.log('Submitting code:', codeString);
        
        setIsLoading(true);

        try {
            const twoFactorData: ITwoFactorRequest = {
                code: codeString,
                id_users: userId
            };
            console.log('twoFactorData', twoFactorData);


            const response = await AuthApi.verifyTwoFactor(twoFactorData);
            console.log('response', response);

            notifications.show({
                title: 'Success',
                message: 'Successfully authenticated',
                color: 'green',
            });

            const redirectPath = response.data.redirect_to || redirectTo;
            router.push(redirectPath);
        } catch (error) {
            notifications.show({
                title: 'Invalid code',
                message: error instanceof Error ? error.message : 'The verification code is incorrect. Please try again.',
                color: 'red',
            });

            // Clear the code and refocus first input
            setCode(['', '', '', '', '', '']);
            setTimeout(() => inputsRef.current[0]?.focus(), 100);
        } finally {
            setIsLoading(false);
        }
    };


    // 6-digit code input logic
    const inputsRef = useRef<Array<HTMLInputElement | null>>([null, null, null, null, null, null]);
    function handleInputChange(index: number, value: string) {
        // Only allow digits
        if (!/^[0-9]?$/.test(value)) return;

        // Update the code array
        const newCode = [...code];
        newCode[index] = value;
        console.log(`Setting digit ${index} to ${value}`);
        console.log('New code array:', newCode);
        
        // Important: Update state first, then check if complete
        setCode(newCode);

        // Auto-tab to next input if value is entered
        if (value && index < 5) {
            inputsRef.current[index + 1]?.focus();
        }

        // Check if all fields are filled after this update
        const allFilled = newCode.every(d => d);
        console.log('All digits filled?', allFilled);

        // Auto-submit if all filled and timer is running
        if (allFilled && timer > 0) {
            console.log('All fields filled and timer running, submitting with code:', newCode.join(''));
            // Use setTimeout to ensure state is updated before submitting
            setTimeout(() => {
                console.log('Current code state before submit:', code);
                // Use the newCode directly instead of the state variable
                submitCode(newCode);
            }, 100);
        }
    }
    function handleKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
        if (e.key === 'Backspace') {
            if (code[index]) {
                const newCode = [...code];
                newCode[index] = '';
                setCode(newCode);
            } else if (index > 0) {
                inputsRef.current[index - 1]?.focus();
                const newCode = [...code];
                newCode[index - 1] = '';
                setCode(newCode);
            }
        }
    }
    function handlePaste(e: React.ClipboardEvent<HTMLInputElement>) {
        e.preventDefault();

        // Get pasted text, remove non-digits, limit to 6 characters
        const pastedData = e.clipboardData.getData('text');
        console.log('Pasted data:', pastedData);
        const digits = pastedData.replace(/\D/g, '').split('').slice(0, 6);
        console.log('Extracted digits:', digits);

        if (!digits.length) return;

        // Update each input with the corresponding digit
        const newCode = [...code];
        digits.forEach((digit, index) => {
            if (index < 6) {
                newCode[index] = digit;
            }
        });

        console.log('Setting code after paste:', newCode);
        setCode(newCode);

        // Auto-submit if all 6 digits were pasted and timer is running
        if (digits.length === 6 && newCode.every(d => d) && timer > 0) {
            console.log('All 6 digits pasted, submitting with code:', newCode.join(''));
            // Use a longer delay for paste to ensure state is fully updated
            setTimeout(() => {
                // Use the newCode directly instead of the state variable
                submitCode(newCode);
            }, 500);
        } else {
            // Otherwise, focus the next empty input
            const firstEmpty = newCode.findIndex(d => !d);
            if (firstEmpty !== -1) {
                setTimeout(() => inputsRef.current[firstEmpty]?.focus(), 10);
            }
        }
    }



    return (
        <Container size={420} my={40}>
            <Paper withBorder shadow="md" p={30} radius="md">
                <Title order={3} ta="center" mb="lg">Two-Factor Authentication</Title>

                <Text size="sm" mb="lg" ta="center">
                    Please enter the 6-digit code sent to your email
                </Text>

                <form autoComplete="off" onSubmit={e => e.preventDefault()}>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '16px' }}>
                        {[0, 1, 2, 3, 4, 5].map((i) => (
                            <input
                                key={i}
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                maxLength={1}
                                ref={(el) => { inputsRef.current[i] = el; }}
                                value={code[i]}
                                onChange={e => handleInputChange(i, e.target.value)}
                                onKeyDown={e => handleKeyDown(i, e)}
                                onPaste={i === 0 ? handlePaste : undefined}
                                disabled={timer === 0 || isLoading}
                                style={{
                                    width: 45,
                                    height: 45,
                                    fontSize: 20,
                                    textAlign: 'center',
                                    border: '1px solid #ddd',
                                    borderRadius: 4,
                                    outline: 'none',
                                    background: timer === 0 ? '#f5f5f5' : '#fff',
                                    color: timer === 0 ? '#aaa' : undefined,
                                }}
                                autoFocus={i === 0}
                                aria-label={`Digit ${i + 1}`}
                            />
                        ))}
                    </div>

                    <Text size="sm" color="dimmed" ta="center" mb="lg">
                        {timer > 0 ? (
                            <>Code expires in {Math.floor(timer / 60)}:{(timer % 60).toString().padStart(2, '0')}</>
                        ) : (
                            <span style={{ color: 'red' }}>Expired. Please request a new code.</span>
                        )}
                    </Text>

                    <Group justify="center">
                        <Button
                            variant="subtle"
                            type="button"
                            onClick={(e) => {
                                e.preventDefault();
                                router.push('/auth/login');
                            }}
                            color="blue"
                        >
                            Back to Login
                        </Button>
                    </Group>
                </form>
            </Paper>
        </Container>
    );
}
