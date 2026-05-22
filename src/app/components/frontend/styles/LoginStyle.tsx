/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
'use client';

import { useState } from 'react';
import { TextInput, PasswordInput, Button, Paper, Title, Anchor, Stack } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useRouter, useSearchParams } from 'next/navigation';
import { ILoginStyle } from '../../../../types/common/styles.types';
import { AuthApi } from '../../../../api/auth.api';
import { ROUTES } from '../../../../config/routes.config';

interface ILoginStyleProps {
    style: ILoginStyle;
    styleProps: Record<string, any>;
    cssClass: string;
}

const LoginStyle: React.FC<ILoginStyleProps> = ({ style, styleProps, cssClass }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();
    const searchParams = useSearchParams();

    const labelUser = style.label_user?.content || 'Email/Username';
    const labelPassword = style.label_pw?.content || 'Password';
    const labelLogin = style.label_login?.content || 'Sign in';
    const labelPasswordReset = style.label_pw_reset?.content || 'Forgot password?';
    const alertFail = style.alert_fail?.content || 'Invalid email or password.';
    const loginTitle = style.login_title?.content || 'Welcome back!';
    const formType = style.type?.content || style.fields?.type?.content || 'light';

    const handleSubmit = async (e: { preventDefault(): void }) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const response = await AuthApi.login({ email, password });

            if (response.data && 'requires_2fa' in response.data && response.data.requires_2fa) {
                notifications.show({ title: 'Two-Factor Authentication', message: 'Please verify your identity', color: 'blue' });
                sessionStorage.setItem('two_factor_id_users', response.data.id_users.toString());
                sessionStorage.removeItem('2fa_time_remaining');
                sessionStorage.removeItem('2fa_last_update');
                sessionStorage.setItem('2fa_fresh_login', 'true');
                router.push(ROUTES.TWO_FACTOR_AUTH);
                return;
            }

            notifications.show({ title: 'Success', message: 'Successfully logged in', color: 'green' });
            const redirectTo = searchParams.get('redirectTo') || ROUTES.HOME;
            router.push(redirectTo);
        } catch (err: any) {
            notifications.show({ title: 'Error', message: err?.message || alertFail, color: 'red' });
        } finally {
            setIsLoading(false);
        }
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

            <form onSubmit={handleSubmit} suppressHydrationWarning>
                <Stack gap="md">
                    <TextInput
                        label={labelUser}
                        placeholder={labelUser}
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        size="md"
                        disabled={isLoading}
                        autoComplete="username"
                        suppressHydrationWarning
                    />

                    <PasswordInput
                        label={labelPassword}
                        placeholder={labelPassword}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        size="md"
                        disabled={isLoading}
                        autoComplete="current-password"
                        suppressHydrationWarning
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
                        href="/reset"
                    >
                        {labelPasswordReset}
                    </Anchor>
                </Stack>
            </form>
        </Paper>
    );
};

export default LoginStyle;
