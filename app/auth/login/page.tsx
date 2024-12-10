'use client';

import { useState } from 'react';
import { TextInput, PasswordInput, Button, Paper, Title, Container } from '@mantine/core';
import { useLogin } from "@refinedev/core";
import { useRouter } from 'next/navigation';
import { notifications } from '@mantine/notifications';
import { ILoginRequest } from '@/types/api/auth.type';

export default function LoginPage() {
  const [user, setUser] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();
  
  const { mutateAsync: login, isLoading } = useLogin<ILoginRequest>();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await login({ user, password });
      notifications.show({
        title: 'Success',
        message: 'Successfully logged in',
        color: 'green',
      });
      router.push('/home');
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Invalid credentials',
        color: 'red',
      });
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
