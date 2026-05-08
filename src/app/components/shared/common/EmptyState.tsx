/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { Center, Stack, Text } from "@mantine/core";

// components/common/EmptyState.tsx
export function EmptyState({ 
  title = "No results found", 
  description = "Try adjusting your filters" 
}) {
  return (
    <Center py="sm">
      <Stack align="center" gap="sm">
        <Text size="lg" c="dimmed" fw={500}>{title}</Text>
        <Text size="sm" c="dimmed" ta="center">{description}</Text>
      </Stack>
    </Center>
  );
}