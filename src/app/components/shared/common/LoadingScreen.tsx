'use client';

import { Center, Loader, Stack, Text } from '@mantine/core';

export function LoadingScreen() {
  return (
    <Center h="100vh">
      <Stack align="center" gap="xs">
        <Loader size="lg" />
        <Text size="sm" c="dimmed">Loading application...</Text>
      </Stack>
    </Center>
  );
}
