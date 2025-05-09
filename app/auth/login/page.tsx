'use client';

import { useState } from 'react';
import { TextInput, PasswordInput, Button, Paper, Title, Container } from '@mantine/core';
import { useRouter, useSearchParams } from 'next/navigation';
import { notifications } from '@mantine/notifications';
import { ILoginRequest, ILoginResponse } from '@/types/api/auth.type';
import { AuthApi } from '@/api/auth.api';
import { API_CONFIG } from '@/config/api.config';
import { ROUTES } from '@/config/routes.config';

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
      const response = await AuthApi.login({ user, password });
      console.log('Login response:', response);
      
      // Check if 2FA is required
      if (response.data && response.data.two_factor?.required) {
        notifications.show({
          title: 'Two-Factor Authentication',
          message: 'Please verify your identity',
          color: 'blue',
        });
        // Save id_users for the 2FA verification step
        sessionStorage.setItem('two_factor_id_users', response.data.two_factor.id_users);
        // Redirect to 2FA page with id_users in URL using API_CONFIG.ENDPOINTS
        router.push(`${ROUTES.TWO_FACTOR_AUTH}?user=${response.data.two_factor.id_users}&redirectTo=${encodeURIComponent(redirectTo)}`);
        return;
      }
      
      notifications.show({
        title: 'Success',
        message: 'Successfully logged in',
        color: 'green',
      });
      router.push(redirectTo);
    } catch (error) {
      console.error('Login error:', error);
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
