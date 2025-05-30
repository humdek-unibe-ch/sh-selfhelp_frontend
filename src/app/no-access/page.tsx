'use client';

import { Button, Container, Group, Text, Title } from '@mantine/core';
import { IconArrowLeft, IconLock } from '@tabler/icons-react';
import { useRouter } from 'next/navigation';

/**
 * No Access page shown when a user attempts to access a restricted area
 * without the proper permissions
 */
export default function NoAccessPage() {
  const router = useRouter();

  return (
    <Container size="md" py="xl">
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <IconLock size={80} className="text-red-500 mb-6" />
        
        <Title order={1} className="mb-4">Access Denied</Title>
        
        <Text size="lg" className="mb-8 max-w-md">
          You don&apos;t have permission to access this area. 
          Please contact your administrator if you believe this is an error.
        </Text>
        
        <Group>
          <Button 
            leftSection={<IconArrowLeft size={16} />}
            onClick={() => router.push('/')}
            variant="outline"
          >
            Return to Home
          </Button>
        </Group>
      </div>
    </Container>
  );
}
