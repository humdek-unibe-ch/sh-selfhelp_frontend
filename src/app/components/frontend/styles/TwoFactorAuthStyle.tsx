import React, { useState } from 'react';
import { Box, Card, Title, TextInput, Button, Alert, Text, Group } from '@mantine/core';
import { IconLock, IconX } from '@tabler/icons-react';
import { ITwoFactorAuthStyle } from '../../../../types/common/styles.types';

/**
 * Props interface for ITwoFactorAuthStyle component
 */
interface ITwoFactorAuthStyleProps {
    style: ITwoFactorAuthStyle;
    styleProps: Record<string, any>;
    cssClass: string;
}

const TwoFactorAuthStyle: React.FC<ITwoFactorAuthStyleProps> = ({ style, styleProps, cssClass }) => {
    const [code, setCode] = useState('');
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const labelCode = style.label_code?.content || 'Verification Code';
    const labelSubmit = style.label_submit?.content || 'Verify';
    const alertFail = style.alert_fail?.content || 'Invalid verification code';
    const title = style.title?.content || 'Two-Factor Authentication';
    const textMd = style.text_md?.content;
    const labelExpiration2fa = style.label_expiration_2fa?.content;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsSubmitting(true);

        if (!code.trim()) {
            setError('Verification code is required');
            setIsSubmitting(false);
            return;
        }

        if (code.length < 6) {
            setError('Verification code must be at least 6 characters');
            setIsSubmitting(false);
            return;
        }

        try {
            // In a real implementation, you would make an API call here
            // await verifyTwoFactorCode(code);
            
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // For demo purposes, accept any 6-digit code starting with "123"
            if (code.startsWith('123') && code.length === 6) {
                // Success - redirect or update state

            } else {
                setError(alertFail);
            }
        } catch (err) {
            setError(alertFail);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCodeChange = (value: string) => {
        // Only allow numbers and limit to reasonable length
        const cleanValue = value.replace(/\D/g, '').slice(0, 8);
        setCode(cleanValue);
        if (error) {
            setError('');
        }
    };

    return (
        <Box className={style.css ?? ""}>
            <Card shadow="sm" padding="lg" radius="md" withBorder>
                <Title order={2} ta="center" mb="md">
                    {title}
                </Title>

                {textMd && (
                    <Box mb="lg">
                        {textMd}
                    </Box>
                )}

                <form onSubmit={handleSubmit}>
                    {error && (
                        <Alert icon={<IconX size={16} />} color="red" mb="md">
                            {error}
                        </Alert>
                    )}

                    <TextInput
                        label={labelCode}
                        placeholder="Enter 6-digit code"
                        leftSection={<IconLock size={16} />}
                        value={code}
                        onChange={(e) => handleCodeChange(e.target.value)}
                        required
                        mb="md"
                        size="lg"
                        ta="center"
                        styles={{
                            input: {
                                fontSize: '1.5rem',
                                letterSpacing: '0.5rem',
                                textAlign: 'center'
                            }
                        }}
                    />

                    {labelExpiration2fa && (
                        <Text size="sm" c="dimmed" ta="center" mb="md">
                            {labelExpiration2fa}
                        </Text>
                    )}

                    <Button 
                        type="submit" 
                        fullWidth 
                        size="lg"
                        loading={isSubmitting}
                        disabled={code.length < 6}
                    >
                        {labelSubmit}
                    </Button>
                </form>

                <Group justify="center" mt="lg">
                    <Button variant="subtle" size="sm">
                        Resend Code
                    </Button>
                    <Button variant="subtle" size="sm">
                        Use Backup Code
                    </Button>
                </Group>
            </Card>
        </Box>
    );
};

export default TwoFactorAuthStyle; 