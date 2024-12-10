'use client';

import { Container, Title, Text, Button, Group } from '@mantine/core';
import { useRouter } from 'next/navigation';

export default function NotFound() {
  const router = useRouter();

  return (
    <Container size="md" style={{ textAlign: 'center', paddingTop: '100px' }}>
      <Title order={1} size="3.5rem" mb="xl">404</Title>
      <Text size="xl" mb="xl">Page not found</Text>
      <Text color="dimmed" mb="xl">
        The page you are looking for does not exist or has been moved.
      </Text>
      <Group justify="center">
        <Button onClick={() => router.push('/home')}>
          Take me back home
        </Button>
      </Group>
    </Container>
  );
}
