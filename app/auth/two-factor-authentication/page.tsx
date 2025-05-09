'use client';

import { useEffect, useState } from 'react';
import { TextInput, Button, Paper, Title, Container, Text, Group, Loader, Center } from '@mantine/core';
import { useRouter, useSearchParams } from 'next/navigation';
import { notifications } from '@mantine/notifications';
import { AuthApi } from '@/api/auth.api';
import { ITwoFactorRequest, ITwoFactorResponse } from '@/types/api/auth.type';

export default function TwoFactorAuthenticationPage() {
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirectTo') || '/home';
  
  // For demonstration purposes, we'll use a temporary session ID
  // In a real implementation, this would come from the login response
  const tempSessionId = 'temp-session-id';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // In a real implementation, we would use the actual session ID from the login response
      const twoFactorData: ITwoFactorRequest = {
        code,
        session: tempSessionId
      };
      
      const response = await AuthApi.verifyTwoFactor(twoFactorData);
      
      notifications.show({
        title: 'Success',
        message: 'Successfully authenticated',
        color: 'green',
      });
      
      // Redirect to the specified page or default to home
      const redirectPath = response.data.redirect_to || redirectTo;
      router.push(redirectPath);
    } catch (error) {
      console.error('2FA verification error:', error);
      notifications.show({
        title: 'Error',
        message: error instanceof Error ? error.message : 'Invalid verification code',
        color: 'red',
      });
    } finally {
      setIsLoading(false);
    }
  };



  return (
    <Container size={420} my={40}>
      <Title ta="center">Two-Factor Authentication</Title>

      <Paper withBorder shadow="md" p={30} mt={30} radius="md">
        <Text size="sm" mb="md">
          Enter the verification code to complete your login.
        </Text>

        <form onSubmit={handleSubmit}>
          <TextInput
            label="Verification Code"
            placeholder="Enter your 6-digit code"
            required
            value={code}
            onChange={(e) => setCode(e.currentTarget.value)}
            maxLength={6}
          />
          
          <Group justify="space-between" mt="md">
            <Button variant="subtle" onClick={() => router.push('/auth/login')}>
              Back to Login
            </Button>
            <Button type="submit" loading={isLoading}>
              Verify
            </Button>
          </Group>
        </form>
      </Paper>
    </Container>
  );
}
