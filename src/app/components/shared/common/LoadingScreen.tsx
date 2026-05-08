/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
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
