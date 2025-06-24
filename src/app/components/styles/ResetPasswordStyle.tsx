import React, { useState } from 'react';
import type { IResetPasswordStyle } from '../../../types/common/styles.types';
import { Box, Card, TextInput, Button, Alert, Text } from '@mantine/core';
import { IconCheck, IconMail } from '@tabler/icons-react';
import MarkdownStyle from './MarkdownStyle';

interface IResetPasswordStyleProps {
    style: IResetPasswordStyle;
}

const ResetPasswordStyle: React.FC<IResetPasswordStyleProps> = ({ style }) => {
    const [email, setEmail] = useState('');
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [error, setError] = useState('');

    const labelPwReset = style.label_pw_reset?.content || 'Reset Password';
    const textMd = style.text_md?.content;
    const type = style.type?.content || 'primary';
    const alertSuccess = style.alert_success?.content || 'Password reset email sent successfully';
    const placeholder = style.placeholder?.content || 'Enter your email address';
    const emailUser = style.email_user?.content;
    const subjectUser = style.subject_user?.content;
    const isHtml = style.is_html?.content === '1';

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!email.trim()) {
            setError('Email address is required');
            return;
        }

        if (!/\S+@\S+\.\S+/.test(email)) {
            setError('Please enter a valid email address');
            return;
        }

        try {
            // In a real implementation, you would make an API call here
            // await resetPassword(email);
            setIsSubmitted(true);
        } catch (err) {
            setError('Failed to send reset email. Please try again.');
        }
    };

    if (isSubmitted) {
        return (
            <Box className={style.css}>
                <Card shadow="sm" padding="lg" radius="md" withBorder>
                    <Alert icon={<IconCheck size={16} />} color="green" title="Email Sent">
                        {alertSuccess}
                    </Alert>
                    
                    {textMd && (
                        <Box mt="md">
                            <MarkdownStyle style={{
                                ...style,
                                style_name: 'markdown',
                                text_md: { content: textMd }
                            } as any} />
                        </Box>
                    )}
                </Card>
            </Box>
        );
    }

    return (
        <Box className={style.css}>
            <Card shadow="sm" padding="lg" radius="md" withBorder>
                {textMd && (
                    <Box mb="lg">
                        <MarkdownStyle style={{
                            ...style,
                            style_name: 'markdown',
                            text_md: { content: textMd }
                        } as any} />
                    </Box>
                )}

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

                    <Button type="submit" fullWidth color={type}>
                        {labelPwReset}
                    </Button>
                </form>
            </Card>
        </Box>
    );
};

export default ResetPasswordStyle; 