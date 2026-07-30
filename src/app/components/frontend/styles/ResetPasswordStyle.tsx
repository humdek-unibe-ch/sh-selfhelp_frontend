/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
'use client';

import React, { useEffect, useState } from 'react';
import { Anchor, Box, Paper, TextInput, PasswordInput, Button, Alert, Text, Title } from '@mantine/core';
import { IconCheck, IconMail, IconX } from '@tabler/icons-react';
import { useRouter } from 'next/navigation';
import { type IResetPasswordStyle } from '../../../../types/common/styles.types';
import { ROUTES } from '../../../../config/routes.config';
import { AuthApi } from '../../../../api/auth.api';
import { usePageContentValue } from '../../../../hooks/usePageContentValue';
import { useAuth } from '../../../../hooks/useAuth';
import DOMPurify from 'isomorphic-dompurify';

interface IResetPasswordStyleProps {
    style: IResetPasswordStyle;
    styleProps: Record<string, unknown>;
    cssClass: string;
}

/** Seconds shown in the post-reset countdown before navigating away. */
const REDIRECT_SECONDS = 3;

type TResetPasswordStyleFields = IResetPasswordStyle & {
    reset_title?: { content?: string };
    reset_label_pw?: { content?: string };
    reset_pw_placeholder?: { content?: string };
    reset_label_pw_confirm?: { content?: string };
    reset_pw_confirm_placeholder?: { content?: string };
    reset_label_submit?: { content?: string };
    reset_success_title?: { content?: string };
    reset_alert_success?: { content?: string };
    reset_redirect_text?: { content?: string };
    reset_error_invalid_token?: { content?: string };
    reset_error_pw_short?: { content?: string };
    reset_error_pw_mismatch?: { content?: string };
    // Request-link mode copy. These were hardcoded English while the
    // set-password mode above was fully localisable; they read from the
    // dynamically typed `fields` bag so a backend seed can supply them
    // without a shared-type change.
    request_title?: { content?: string };
    request_subtitle?: { content?: string };
    request_label_email?: { content?: string };
    request_success_title?: { content?: string };
    label_back_to_login?: { content?: string };
    label_back_home?: { content?: string };
};

const ResetPasswordStyle: React.FC<IResetPasswordStyleProps> = ({ style, styleProps, cssClass }) => {
    const resetStyle = style as TResetPasswordStyleFields;
    const router = useRouter();
    // DB-driven routing (issue #30): the reset target comes from the resolved
    // page's snake_case `route_params` (`/reset/{user_id}/{token}`), not from
    // parsing the URL. Plain `/reset` has no params -> "request a link" mode.
    const pageContent = usePageContentValue();
    const userId = Number.parseInt(pageContent?.route_params?.user_id ?? '', 10) || 0;
    const token = pageContent?.route_params?.token ?? '';
    const isSetMode = userId > 0 && token !== '';

    // A reset link can be opened in a browser that already holds a session
    // (another account, or the same one). Sending an authenticated visitor to
    // the login form would render a sign-in page on top of a live session, so
    // the post-reset destination and the "back" links follow the session.
    // Unlike /login and /register this page stays reachable while signed in —
    // setting a new password from an emailed link is legitimate either way.
    const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
    const backRoute = !isAuthLoading && isAuthenticated ? ROUTES.HOME : ROUTES.LOGIN;

    const mantineColor = ((style as { color?: { content?: string } }).color?.content as string | undefined) || 'blue';
    const labelPwReset = style.label_pw_reset?.content || 'Send reset link';
    const alertSuccess = style.alert_success?.content
        || 'If an account exists for that email, a reset link is on its way. Check your inbox (and your spam folder).';
    const placeholder = DOMPurify.sanitize(style.placeholder?.content || 'Enter your email address', { ALLOWED_TAGS: [] });
    const resetTitle = resetStyle.reset_title?.content || 'Set a new password';
    const resetLabelPw = resetStyle.reset_label_pw?.content || 'New password';
    const resetPwPlaceholder = resetStyle.reset_pw_placeholder?.content || 'Choose a new password';
    const resetLabelPwConfirm = resetStyle.reset_label_pw_confirm?.content || 'Confirm new password';
    const resetPwConfirmPlaceholder = resetStyle.reset_pw_confirm_placeholder?.content || 'Repeat your new password';
    const resetLabelSubmit = resetStyle.reset_label_submit?.content || 'Set new password';
    const resetSuccessTitle = resetStyle.reset_success_title?.content || 'Password updated';
    const resetAlertSuccess = resetStyle.reset_alert_success?.content || 'Your password has been reset.';
    const resetRedirectText = resetStyle.reset_redirect_text?.content || 'Redirecting to sign in in {seconds}s...';
    const resetErrorInvalidToken = resetStyle.reset_error_invalid_token?.content
        || 'This reset link is invalid or has expired. Please request a new one.';
    const resetErrorPwShort = resetStyle.reset_error_pw_short?.content || 'Your new password must be at least 8 characters long.';
    const resetErrorPwMismatch = resetStyle.reset_error_pw_mismatch?.content || 'The two passwords do not match.';
    const requestTitle = resetStyle.request_title?.content || 'Reset password';
    const requestSubtitle = resetStyle.request_subtitle?.content || 'Enter your email address and we will send you a reset link.';
    const requestLabelEmail = resetStyle.request_label_email?.content || 'Email Address';
    const requestSuccessTitle = resetStyle.request_success_title?.content || 'Email Sent';
    // The "back" link follows the session: an authenticated visitor is offered
    // the way home, not a sign-in page they are already past.
    const backLabel = !isAuthLoading && isAuthenticated
        ? (resetStyle.label_back_home?.content || 'Back to home')
        : (resetStyle.label_back_to_login?.content || 'Back to sign in');

    // "request a reset link" mode
    const [email, setEmail] = useState('');
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    // "set a new password" mode (reached from the emailed link)
    const [password, setPassword] = useState('');
    const [passwordConfirm, setPasswordConfirm] = useState('');
    const [resetDone, setResetDone] = useState(false);
    const [redirectCountdown, setRedirectCountdown] = useState(REDIRECT_SECONDS);

    // Post-reset countdown. Lives in an effect so navigating away mid-countdown
    // cancels it, instead of firing a stray push that yanks the user off the
    // page they moved to. The tick updater stays pure (no navigation inside it)
    // so a StrictMode double-invoke cannot double-navigate.
    useEffect(() => {
        if (!resetDone) {
            return undefined;
        }
        const interval = setInterval(() => {
            setRedirectCountdown((count) => Math.max(0, count - 1));
        }, 1000);
        const redirect = setTimeout(() => {
            router.push(backRoute);
        }, REDIRECT_SECONDS * 1000);
        return () => {
            clearInterval(interval);
            clearTimeout(redirect);
        };
    }, [resetDone, backRoute, router]);

    const handleRequestSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSubmitting(true);
        try {
            await AuthApi.requestPasswordReset(email);
        } catch {
            // Intentionally ignored: the response is always generic so the form
            // can never reveal whether the email belongs to a known account.
        } finally {
            setSubmitting(false);
            setIsSubmitted(true);
        }
    };

    const handleSetSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (password.length < 8) {
            setError(resetErrorPwShort);
            return;
        }
        if (password !== passwordConfirm) {
            setError(resetErrorPwMismatch);
            return;
        }

        setSubmitting(true);
        try {
            await AuthApi.resetPassword(userId, token, password);
            // Starts the countdown effect below; the token is now consumed so
            // revisiting this link would fail, hence we always navigate away.
            setResetDone(true);
            setRedirectCountdown(REDIRECT_SECONDS);
        } catch (err) {
            setError((err as { message?: string })?.message || resetErrorInvalidToken);
        } finally {
            setSubmitting(false);
        }
    };

    // Shared card shell so /reset visually matches the login page (headless,
    // centered, same Paper elevation and width).
    const cardShell = (content: React.ReactNode) => (
        <Box {...styleProps} className={cssClass}>
            <Paper shadow="md" p="xl" radius="md" style={{ maxWidth: 400, margin: '0 auto' }}>
                {content}
            </Paper>
        </Box>
    );

    // Set-password success screen
    if (isSetMode && resetDone) {
        return cardShell(
            <Alert icon={<IconCheck size={16} />} color="green" title={resetSuccessTitle}>
                {resetAlertSuccess}
                <Text size="sm" mt="xs">
                    {resetRedirectText.replace('{seconds}', String(redirectCountdown))}
                </Text>
            </Alert>,
        );
    }

    // Set-password form (came from the emailed /reset/{id}/{token} link)
    if (isSetMode) {
        return cardShell(
            <form onSubmit={handleSetSubmit}>
                <Title order={2} ta="center" mb="lg">
                    {resetTitle}
                </Title>

                {error && (
                    <Alert icon={<IconX size={16} />} color="red" mb="md" withCloseButton onClose={() => setError('')}>
                        {error}
                    </Alert>
                )}

                <PasswordInput
                    label={resetLabelPw}
                    placeholder={resetPwPlaceholder}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    size="md"
                    mb="md"
                />

                <PasswordInput
                    label={resetLabelPwConfirm}
                    placeholder={resetPwConfirmPlaceholder}
                    value={passwordConfirm}
                    onChange={(e) => setPasswordConfirm(e.target.value)}
                    required
                    size="md"
                    mb="md"
                />

                <Button type="submit" fullWidth size="md" color={mantineColor} variant="filled" loading={submitting}>
                    {resetLabelSubmit}
                </Button>
            </form>,
        );
    }

    // Request success screen
    if (isSubmitted) {
        return cardShell(
            <>
                <Alert icon={<IconCheck size={16} />} color="green" title={requestSuccessTitle}>
                    {alertSuccess}
                </Alert>
                <Anchor ta="center" display="block" size="sm" mt="md" c={mantineColor} href={backRoute}>
                    {backLabel}
                </Anchor>
            </>,
        );
    }

    // Request form (default /reset)
    return cardShell(
        <form onSubmit={handleRequestSubmit}>
            <Title order={2} ta="center" mb="xs">
                {requestTitle}
            </Title>
            <Text c="dimmed" ta="center" size="sm" mb="lg">
                {requestSubtitle}
            </Text>

            {error && (
                <Alert color="red" mb="md">
                    {error}
                </Alert>
            )}

            <TextInput
                label={requestLabelEmail}
                placeholder={placeholder}
                leftSection={<IconMail size={16} />}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                size="md"
                mb="md"
            />

            <Button type="submit" fullWidth size="md" color={mantineColor} variant="filled" loading={submitting}>
                {labelPwReset}
            </Button>

            <Anchor ta="center" display="block" size="sm" mt="md" c={mantineColor} href={backRoute}>
                {backLabel}
            </Anchor>
        </form>,
    );
};

export default ResetPasswordStyle;
