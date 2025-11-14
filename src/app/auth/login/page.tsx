'use client';

import { useState } from 'react';
import { TextInput, PasswordInput, Button, Paper, Title, Container } from '@mantine/core';
import { useRouter, useSearchParams } from 'next/navigation';
import { notifications } from '@mantine/notifications';
import { AuthApi } from '../../../api/auth.api';
import { ROUTES } from '../../../config/routes.config';

export default function LoginPage() {
  const [user, setUser] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirectTo') || '/home';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await AuthApi.login({ email: user, password });
      
      // Check if 2FA is required
      if (response.data && 'requires_2fa' in response.data && response.data.requires_2fa) {
        notifications.show({
          title: 'Two-Factor Authentication',
          message: 'Please verify your identity',
          color: 'blue',
        });
        // Save id_users for the 2FA verification step
        sessionStorage.setItem('two_factor_id_users', response.data.id_users.toString());
        
        // Reset 2FA timer by clearing the storage keys
        sessionStorage.removeItem('2fa_time_remaining');
        sessionStorage.removeItem('2fa_last_update');
        
        // Set flag to indicate a fresh login with new 2FA code
        sessionStorage.setItem('2fa_fresh_login', 'true');
        
        // Redirect to 2FA page
        router.push(`${ROUTES.TWO_FACTOR_AUTH}`);
        return;
      }
      
      notifications.show({
        title: 'Success',
        message: 'Successfully logged in',
        color: 'green',
      });
      router.push(redirectTo);
    } catch (error) {

      notifications.show({
        title: 'Error',
        message: error instanceof Error ? error.message : 'Invalid credentials',
        color: 'red',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container size={420} my={40}>
      <Title ta="center">Welcome back!</Title>

      <Paper withBorder shadow="md" p={30} mt={30} radius="md">
        <form onSubmit={handleSubmit}>
          <TextInput
            label="Email/Username"
            placeholder="your@email.com or username"
            required
            value={user}
            onChange={(e) => setUser(e.currentTarget.value)}
          />
          <PasswordInput
            label="Password"
            placeholder="Your password"
            required
            mt="md"
            value={password}
            onChange={(e) => setPassword(e.currentTarget.value)}
          />
          <Button fullWidth mt="xl" type="submit" loading={isLoading}>
            Sign in
          </Button>
        </form>
      </Paper>
    </Container>
  );
}
