"use client";

import { Group, Text, Title, Badge, Container } from '@mantine/core';
import { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  badge?: ReactNode;
  children?: ReactNode;
}

export function PageHeader({ 
  title, 
  subtitle, 
  badge, 
  children 
}: PageHeaderProps) {
  return (
    <Group justify="space-between" align="center" wrap="wrap" gap="lg">
      {/* Left side */}
      <Group>
        <Container pl={0}>
          <Group gap={8} align="center">
            <Title order={2}>{title}</Title>
            {badge && (
              <Badge variant="light" color="gray" size="sm">
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