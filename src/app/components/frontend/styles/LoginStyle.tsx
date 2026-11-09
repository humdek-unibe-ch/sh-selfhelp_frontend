/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
'use client';

import { useEffect, useState } from 'react';
import { TextInput, PasswordInput, Button, Paper, Title, Text, Anchor, Stack } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useRouter, useSearchParams } from 'next/navigation';
import { type ILoginStyle } from '../../../../types/common/styles.types';
import { AuthApi } from '../../../../api/auth.api';
import { ROUTES } from '../../../../config/routes.config';
import { useAuth } from '../../../../hooks/useAuth';

interface ILoginStyleProps {
    style: ILoginStyle;
    styleProps: Record<string, unknown>;
    cssClass: string;
}

const LoginStyle: React.FC<ILoginStyleProps> = ({ style, styleProps, cssClass }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();
    const searchParams = useSearchParams();
    const { isAuthenticated, isLoading: isAuthLoading } = useAuth();

    const labelUser = style.label_user?.content || 'Email/Username';
    const labelPassword = style.label_pw?.content || 'Password';
    const labelLogin = style.label_login?.content || 'Sign in';
    const labelPasswordReset = style.label_pw_reset?.content || 'Forgot password?';
    const labelRegister = style.label_register?.content ?? (style.fields?.label_register?.content as string | undefined) ?? 'Create account';
    const alertFail = style.alert_fail?.content || 'Invalid email or password.';
    const loginTitle = style.login_title?.content || 'Welcome back!';
    const subtitle = style.subtitle?.content?.trim();
    const mantineColor = style.color?.content || 'blue';
    // `dark`/`black` is the neutral accent (and the seeded login default). A
    // Mantine `filled` button / `c=` link in that colour collapses to
    // black-on-black in dark mode, so the neutral accent is rendered adaptively
    // from the theme text/body vars below. Real palette colours are untouched.
    const isNeutralAccent = mantineColor === 'dark' || mantineColor === 'black';

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
        } catch (err) {
            notifications.show({ title: 'Error', message: (err as { message?: string })?.message || alertFail, color: 'red' });
        } finally {
            setIsLoading(false);
        }
    };

    // An already-signed-in visitor must never see the login form: rendering it
    // on top of a live session reads as a silent logout. Reachable by typing
    // /login, a stale bookmark, or a flow that redirects here (e.g. finishing
    // another account's activation link). Mirrors the RegisterStyle guard;
    // `replace` keeps the login URL out of history, and `isAuthLoading` gates
    // it so the form is not bounced before auth resolves.
    useEffect(() => {
        if (!isAuthLoading && isAuthenticated) {
            router.replace(searchParams.get('redirectTo') || ROUTES.HOME);
        }
    }, [isAuthLoading, isAuthenticated, router, searchParams]);

    if (!isAuthLoading && isAuthenticated) {
        return null;
    }

    return (
        <Paper
            shadow="md"
            p="xl"
            radius="md"
            {...styleProps} className={cssClass}
            style={{ maxWidth: 400, margin: '0 auto' }}
        >
            <Title order={2} ta="center" mb={subtitle ? 'xs' : 'lg'}>
                {loginTitle}
            </Title>

            {subtitle ? (
                <Text c="dimmed" ta="center" size="sm" mb="lg">
                    {subtitle}
                </Text>
            ) : null}

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
                        color={isNeutralAccent ? undefined : mantineColor}
                        variant="filled"
                        // Neutral accent: invert via theme vars so the button is
                        // near-black with a light label in light mode and a light
                        // button with a dark label in dark mode (readable in both).
                        style={
                            isNeutralAccent
                                ? {
                                      backgroundColor: 'var(--mantine-color-text)',
                                      color: 'var(--mantine-color-body)',
                                  }
                                : undefined
                        }
                    >
                        {labelLogin}
                    </Button>

                    {/* Aux links share the configurable `color` with the submit
                        button so the accent stays consistent (mirrors the mobile
                        login). For the neutral accent we drop the explicit colour
                        so the theme's readable link colour is used instead of an
                        invisible black-on-black in dark mode. */}
                    <Anchor
                        ta="center"
                        size="sm"
                        c={isNeutralAccent ? undefined : mantineColor}
                        href={ROUTES.RESET_PASSWORD}
                    >
                        {labelPasswordReset}
                    </Anchor>

                    <Anchor
                        ta="center"
                        size="sm"
                        c={isNeutralAccent ? undefined : mantineColor}
                        href={ROUTES.REGISTER}
                    >
                        {labelRegister}
                    </Anchor>
                </Stack>
            </form>
        </Paper>
    );
};

export default LoginStyle;
