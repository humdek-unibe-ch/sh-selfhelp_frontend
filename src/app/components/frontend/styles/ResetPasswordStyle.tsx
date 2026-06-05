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

/**
 * Pull `/reset/{userId}/{token}` out of the `[[...slug]]` catch-all. Returns
 * zero/empty when the URL is just the request page (`/reset`), which switches
 * the component to "request a reset link" mode.
 */
function extractResetTarget(slug: string | string[] | undefined): { userId: number; token: string } {
    if (!Array.isArray(slug)) {
        return { userId: 0, token: '' };
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
            setError('Your new password must be at least 8 characters long.');
            return;
        }
        if (password !== passwordConfirm) {
            setError('The two passwords do not match.');
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
            setError(err?.message || 'This reset link is invalid or has expired. Please request a new one.');
        } finally {
            setSubmitting(false);
        }
    };

    // Set-password success screen
    if (isSetMode && resetDone) {
        return (
            <Box {...styleProps} className={cssClass}>
                <Card shadow="sm" padding="lg" radius="md" withBorder>
                    <Alert icon={<IconCheck size={16} />} color="green" title="Password updated">
                        Your password has been reset.
                        <Text size="sm" mt="xs">Redirecting to sign in in {redirectCountdown}s...</Text>
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
                        {error && (
                            <Alert icon={<IconX size={16} />} color="red" mb="md" withCloseButton onClose={() => setError('')}>
                                {error}
                            </Alert>
                        )}

                        <TextInput
                            label="New password"
                            placeholder="Choose a new password"
                            leftSection={<IconLock size={16} />}
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            mb="md"
                        />

                        <TextInput
                            label="Confirm new password"
                            leftSection={<IconLock size={16} />}
                            type="password"
                            value={passwordConfirm}
                            onChange={(e) => setPasswordConfirm(e.target.value)}
                            required
                            mb="md"
                        />

                        <Button type="submit" fullWidth color={mantineColor} variant="filled" loading={submitting}>
                            Set new password
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
