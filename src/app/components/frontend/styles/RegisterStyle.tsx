'use client';

import React, { useState } from 'react';
import { TextInput, Button, Paper, Title, Alert, Stack, Text } from '@mantine/core';
import { IconCheck, IconExclamationCircle } from '@tabler/icons-react';
import { IRegisterStyle } from '../../../../types/common/styles.types';

/**
 * Props interface for RegisterStyle component
 */
/**
 * Props interface for IRegisterStyle component
 */
interface IRegisterStyleProps {
    style: IRegisterStyle;
    styleProps: Record<string, any>;
    cssClass: string;
}

/**
 * RegisterStyle component renders a registration form with email and validation code fields
 * Uses Mantine UI components for consistent theming and styling
 */
const RegisterStyle: React.FC<IRegisterStyleProps> = ({ style, styleProps, cssClass }) => {
    const [email, setEmail] = useState('');
    const [validationCode, setValidationCode] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    // Extract field values from style props
    const title = style.title?.content || 'Registration';
    const labelUser = style.label_user?.content || 'Email';
    const labelPassword = style.label_pw?.content || 'Validation Code';
    const labelSubmit = style.label_submit?.content || 'Register';
    const alertFail = style.alert_fail?.content || 'Invalid email or validation code.';
    const alertSuccess = style.alert_success?.content || 'Registration successful! Please check your email for activation link.';
    const successMessage = style.success?.content || 'Registration completed successfully';
    const formType = style.fields?.type?.content || 'success';
    
    // Check if open registration is enabled
    const openRegistration = style.fields?.open_registration?.content === '1';

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        setSuccess(false);
        
        try {
            // TODO: Implement actual registration logic here
            // For now, simulate registration attempt
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Simulate success for demo - in real implementation, this would handle the API call
            if (email && (validationCode || openRegistration)) {
                setSuccess(true);
                setEmail('');
                setValidationCode('');
            } else {
                setError(alertFail);
            }
        } catch (err) {
            setError(alertFail);
        } finally {
            setIsLoading(false);
        }
    };

    if (success) {
        return (
            <Paper 
                shadow="md" 
                p="xl" 
                radius="md" 
                {...styleProps} className={cssClass}
                style={{ maxWidth: 400, margin: '0 auto' }}
            >
                <Alert 
                    icon={<IconCheck size={16} />} 
                    color="green" 
                    title={successMessage}
                    variant="light"
                >
                    {alertSuccess}
                </Alert>
            </Paper>
        );
    }

    return (
        <Paper 
            shadow="md" 
            p="xl" 
            radius="md" 
            {...styleProps} className={cssClass}
            style={{ maxWidth: 400, margin: '0 auto' }}
        >
            <Title order={2} ta="center" mb="lg">
                {title}
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
                    />
                    
                    {!openRegistration && (
                        <TextInput
                            label={labelPassword}
                            placeholder={labelPassword}
                            value={validationCode}
                            onChange={(e) => setValidationCode(e.target.value)}
                            required
                            size="md"
                        />
                    )}
                    
                    {openRegistration && (
                        <Text size="sm" c="dimmed">
                            {style.fields?.anonymous_users_registration?.content || 
                             'Open registration is enabled. You will receive an activation email after registration.'}
                        </Text>
                    )}
                    
                    <Button 
                        type="submit" 
                        fullWidth 
                        size="md"
                        loading={isLoading}
                        variant={formType === 'success' ? 'filled' : 'light'}
                        color={formType === 'success' ? 'green' : 'blue'}
                    >
                        {labelSubmit}
                    </Button>
                </Stack>
            </form>
        </Paper>
    );
};

export default RegisterStyle; 