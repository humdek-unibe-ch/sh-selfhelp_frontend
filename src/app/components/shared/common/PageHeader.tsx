/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
"use client";

import { Group, Text, Title, Badge, Container } from '@mantine/core';
import { type ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  /** Item count pilled next to the title. Shown even when 0; omit for no badge. */
  badge?: number;
  /** Names what `badge` counts for screen readers, e.g. "groups" reads as
   *  "248 groups". Defaults to the title. */
  badgeAriaLabel?: string;
  children?: ReactNode;
}

export function PageHeader({
  title,
  subtitle,
  badge,
  badgeAriaLabel,
  children
}: PageHeaderProps) {
  return (
    <Group justify="space-between" align="center" wrap="wrap" gap="lg">
      {/* Left side */}
      <Group>
        <Container pl={0}>
          <Group gap={8} align="center">
            <Title order={2}>{title}</Title>
            {badge !== undefined && (
              <Badge
                variant="light"
                color="blue"
                size="lg"
                radius="xl"
                aria-label={`${badge} ${badgeAriaLabel ?? title}`}
              >
                {badge}
              </Badge>
            )}
          </Group>
          {subtitle && (
            <Text size="sm" c="dimmed" mt={4}>
              {subtitle}
            </Text>
          )}
        </Container>
      </Group>

      {/* Right side - Legend, buttons, etc. */}
      {children && (
        <Group gap="sm" align="center">
          {children}
        </Group>
      )}
    </Group>
  );
}