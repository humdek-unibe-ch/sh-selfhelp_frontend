import React, { useState } from 'react';
import { TextInput, PasswordInput, Button, Paper, Title, Alert, Anchor, Stack } from '@mantine/core';
import { IconExclamationCircle } from '@tabler/icons-react';
import { ILoginStyle } from '../../../types/common/styles.types';

/**
 * Props interface for LoginStyle component
 */
interface ILoginStyleProps {
    style: ILoginStyle;
}

/**
 * LoginStyle component renders a login form with email/username and password fields
 * Uses Mantine UI components for consistent theming and styling
 */
const LoginStyle: React.FC<ILoginStyleProps> = ({ style }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    // Extract field values
    const labelUser = style.label_user?.content || 'Email/Username';
    const labelPassword = style.label_pw?.content || 'Password';
    const labelLogin = style.label_login?.content || 'Sign in';
    const labelPasswordReset = style.label_pw_reset?.content || 'Forgot password?';
    const alertFail = style.alert_fail?.content || 'Invalid email or password.';
    const loginTitle = style.login_title?.content || 'Welcome back!';
    const formType = style.type?.content || style.fields?.type?.content || 'light';
    const cssClass = style.css || '';

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        
        try {
            // TODO: Implement actual login logic here
            // For now, simulate login attempt
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Simulate failure for demo - in real implementation, this would handle the API call
            if (email && password) {
                // Success case would redirect or update app state
                console.log('Login attempt:', { email, password });
            } else {
                setError(alertFail);
            }
        } catch (err) {
            setError(alertFail);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Paper 
            shadow="md" 
            p="xl" 
            radius="md" 
            className={cssClass}
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
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        size="md"
                    />
                    
                    <PasswordInput
                        label={labelPassword}
                        placeholder={labelPassword}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        size="md"
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