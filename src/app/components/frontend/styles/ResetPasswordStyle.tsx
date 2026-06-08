/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
'use client';

import React, { useState } from 'react';
import { Box, Card, TextInput, Button, Alert, Text } from '@mantine/core';
import { IconCheck, IconMail, IconLock, IconX } from '@tabler/icons-react';
import { useParams, useRouter } from 'next/navigation';
import { IResetPasswordStyle } from '../../../../types/common/styles.types';
import { ROUTES } from '../../../../config/routes.config';
import { AuthApi } from '../../../../api/auth.api';
import DOMPurify from 'isomorphic-dompurify';

interface IResetPasswordStyleProps {
    style: IResetPasswordStyle;
    styleProps: Record<string, any>;
    cssClass: string;
}

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
};

/**
 * Pull `/reset/{userId}/{token}` out of the `[[...slug]]` catch-all. Returns
 * zero/empty when the URL is just the request page (`/reset`), which switches
 * the component to "request a reset link" mode.
 */
function extractResetTarget(slug: string | string[] | undefined): { userId: number; token: string } {
    if (!Array.isArray(slug)) {
        return { userId: 0, token: '' };
    }

    // Static fallback route (`/auth/reset-password/[...slug]`) receives only
    // the trailing `[userId, token]` segments, not the public `reset` prefix.
    if (slug.length >= 2 && slug[0] !== 'reset') {
        return {
            userId: parseInt(slug[0], 10) || 0,
            token: slug[1] || '',
        };
    }

    const idx = slug.indexOf('reset');
    if (idx === -1 || slug.length <= idx + 2) {
        return { userId: 0, token: '' };
    }
    return {
        userId: parseInt(slug[idx + 1], 10) || 0,
        token: slug[idx + 2] || '',
    };
}

const ResetPasswordStyle: React.FC<IResetPasswordStyleProps> = ({ style, styleProps, cssClass }) => {
    const resetStyle = style as TResetPasswordStyleFields;
    const params = useParams();
    const router = useRouter();
    const { userId, token } = extractResetTarget(params?.slug as string | string[] | undefined);
    const isSetMode = userId > 0 && token !== '';

    const mantineColor = ((style as any).mantine_color?.content as string | undefined) || 'blue';
    const isHtml = style.is_html?.content === '1';
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

    // "request a reset link" mode
    const [email, setEmail] = useState('');
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    // "set a new password" mode (reached from the emailed link)
    const [password, setPassword] = useState('');
    const [passwordConfirm, setPasswordConfirm] = useState('');
    const [resetDone, setResetDone] = useState(false);
    const [redirectCountdown, setRedirectCountdown] = useState(3);

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
            setResetDone(true);

            let count = 3;
            setRedirectCountdown(count);
            const interval = setInterval(() => {
                count -= 1;
                setRedirectCountdown(count);
                if (count <= 0) {
                    clearInterval(interval);
                    router.push(ROUTES.LOGIN);
                }
            }, 1000);
        } catch (err: any) {
            setError(err?.message || resetErrorInvalidToken);
        } finally {
            setSubmitting(false);
        }
    };

    // Set-password success screen
    if (isSetMode && resetDone) {
        return (
            <Box {...styleProps} className={cssClass}>
                <Card shadow="sm" padding="lg" radius="md" withBorder>
                    <Alert icon={<IconCheck size={16} />} color="green" title={resetSuccessTitle}>
                        {resetAlertSuccess}
                        <Text size="sm" mt="xs">
                            {resetRedirectText.replace('{seconds}', String(redirectCountdown))}
                        </Text>
                    </Alert>
                </Card>
            </Box>
        );
    }

    // Set-password form (came from the emailed /reset/{id}/{token} link)
    if (isSetMode) {
        return (
            <Box {...styleProps} className={cssClass}>
                <Card shadow="sm" padding="lg" radius="md" withBorder>
                    <form onSubmit={handleSetSubmit}>
                        <Text size="lg" fw={600} mb="md">
                            {resetTitle}
                        </Text>

                        {error && (
                            <Alert icon={<IconX size={16} />} color="red" mb="md" withCloseButton onClose={() => setError('')}>
                                {error}
                            </Alert>
                        )}

                        <TextInput
                            label={resetLabelPw}
                            placeholder={resetPwPlaceholder}
                            leftSection={<IconLock size={16} />}
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            mb="md"
                        />

                        <TextInput
                            label={resetLabelPwConfirm}
                            placeholder={resetPwConfirmPlaceholder}
                            leftSection={<IconLock size={16} />}
                            type="password"
                            value={passwordConfirm}
                            onChange={(e) => setPasswordConfirm(e.target.value)}
                            required
                            mb="md"
                        />

                        <Button type="submit" fullWidth color={mantineColor} variant="filled" loading={submitting}>
                            {resetLabelSubmit}
                        </Button>
                    </form>
                </Card>
            </Box>
        );
    }

    // Request success screen
    if (isSubmitted) {
        return (
            <Box {...styleProps} className={cssClass}>
                <Card shadow="sm" padding="lg" radius="md" withBorder>
                    <Alert icon={<IconCheck size={16} />} color="green" title="Email Sent">
                        {isHtml
                            ? <span dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(alertSuccess) }} />
                            : alertSuccess
                        }
                    </Alert>
                </Card>
            </Box>
        );
    }

    // Request form (default /reset)
    return (
        <Box {...styleProps} className={cssClass}>
            <Card shadow="sm" padding="lg" radius="md" withBorder>
                <form onSubmit={handleRequestSubmit}>
                    {error && (
                        <Alert color="red" mb="md">
                            {error}
                        </Alert>
                    )}

                    <TextInput
                        label="Email Address"
                        placeholder={placeholder}
                        leftSection={<IconMail size={16} />}
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        mb="md"
                    />

                    <Button type="submit" fullWidth color={mantineColor} variant="filled" loading={submitting}>
                        {labelPwReset}
                    </Button>
                </form>
            </Card>
        </Box>
    );
};

export default ResetPasswordStyle;
