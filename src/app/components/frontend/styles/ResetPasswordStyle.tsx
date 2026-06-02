/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
'use client';

import React, { useState } from 'react';
import { Box, Card, TextInput, Button, Alert } from '@mantine/core';
import { IconCheck, IconMail } from '@tabler/icons-react';
import { IResetPasswordStyle } from '../../../../types/common/styles.types';
import DOMPurify from 'isomorphic-dompurify';

interface IResetPasswordStyleProps {
    style: IResetPasswordStyle;
    styleProps: Record<string, any>;
    cssClass: string;
}

const ResetPasswordStyle: React.FC<IResetPasswordStyleProps> = ({ style, styleProps, cssClass }) => {
    const [email, setEmail] = useState('');
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [error, setError] = useState('');

    const labelPwReset = style.label_pw_reset?.content || 'Reset Password';
    const mantineColor = ((style as any).mantine_color?.content as string | undefined) || 'blue';
    const alertSuccess = style.alert_success?.content || 'Password reset email sent successfully';
    const placeholder = DOMPurify.sanitize(style.placeholder?.content || 'Enter your email address', { ALLOWED_TAGS: [] });
    const isHtml = style.is_html?.content === '1';
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        try {
            // await resetPassword(email);
            setIsSubmitted(true);
        } catch (err) {
            setError('Failed to send reset email. Please try again.');
        }
    };

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

    return (
        <Box {...styleProps} className={cssClass}>
            <Card shadow="sm" padding="lg" radius="md" withBorder>
                <form onSubmit={handleSubmit}>
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

                    <Button type="submit" fullWidth color={mantineColor} variant="filled">
                        {labelPwReset}
                    </Button>
                </form>
            </Card>
        </Box>
    );
};

export default ResetPasswordStyle;
