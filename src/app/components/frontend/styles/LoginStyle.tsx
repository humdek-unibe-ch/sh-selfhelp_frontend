'use client';

import React, { useState } from 'react';
import { TextInput, PasswordInput, Button, Paper, Title, Alert, Anchor, Stack } from '@mantine/core';
import { IconExclamationCircle } from '@tabler/icons-react';
import { useLogin } from '@refinedev/core';
import { useRouter, useSearchParams } from 'next/navigation';
import { ILoginStyle } from '../../../../types/common/styles.types';
import { ROUTES } from '../../../../config/routes.config';

/**
 * Props interface for LoginStyle component
 */
/**
 * Props interface for ILoginStyle component
 */
interface ILoginStyleProps {
    style: ILoginStyle;
    styleProps: Record<string, any>;
    cssClass: string;
}

/**
 * LoginStyle component renders a login form with email/username and password fields
 * Uses Mantine UI components for consistent theming and styling
 */
const LoginStyle: React.FC<ILoginStyleProps> = ({ style, styleProps, cssClass }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { mutate: login } = useLogin();
    const router = useRouter();
    const searchParams = useSearchParams();

    // Extract field values
    const labelUser = style.label_user?.content || 'Email/Username';
    const labelPassword = style.label_pw?.content || 'Password';
    const labelLogin = style.label_login?.content || 'Sign in';
    const labelPasswordReset = style.label_pw_reset?.content || 'Forgot password?';
    const alertFail = style.alert_fail?.content || 'Invalid email or password.';
    const loginTitle = style.login_title?.content || 'Welcome back!';
    const formType = style.type?.content || style.fields?.type?.content || 'light';

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        if (!email || !password) {
            setError('Please fill in all fields');
            setIsLoading(false);
            return;
        }

        login(
            { email, password },
            {
                onSuccess: (data) => {
                    setIsLoading(false);
                    // Force redirect if Refine doesn't handle it automatically
                    // This ensures the redirect happens on the first try
                    if (data.success && data.redirectTo) {
                        let redirectUrl = data.redirectTo as string;

                        // No need to preserve language parameters in URL

                        setTimeout(() => {
                            router.push(redirectUrl);
                        }, 100);
                    }
                },
                onError: (error: any) => {
                    setIsLoading(false);
                    // Display the error message from the server or use fallback
                    const errorMessage = error?.message || alertFail;
                    setError(errorMessage);
                }
            }
        );
    };

    return (
        <Paper 
            shadow="md" 
            p="xl" 
            radius="md" 
            {...styleProps} className={cssClass}
            style={{ maxWidth: 400, margin: '0 auto' }}
        >
            <Title order={2} ta="center" mb="lg">
                {loginTitle}
            </Title>
            
            <form onSubmit={handleSubmit}>
                <Stack gap="md">
                    {error && (
                        <Alert 
                            icon={<IconExclamationCircle size={16} />} 
                            color="red" 
                            variant="light"
                        >
                            {error}
                        </Alert>
                    )}
                    
                    <TextInput
                        label={labelUser}
                        placeholder={labelUser}
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        size="md"
                        disabled={isLoading}
                    />
                    
                    <PasswordInput
                        label={labelPassword}
                        placeholder={labelPassword}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        size="md"
                        disabled={isLoading}
                    />
                    
                    <Button 
                        type="submit" 
                        fullWidth 
                        size="md"
                        loading={isLoading}
                        variant={formType === 'dark' ? 'filled' : 'light'}
                    >
                        {labelLogin}
                    </Button>
                    
                    <Anchor 
                        ta="center" 
                        size="sm"
                        href="/auth/reset-password"
                    >
                        {labelPasswordReset}
                    </Anchor>
                </Stack>
            </form>
        </Paper>
    );
};

export default LoginStyle; 