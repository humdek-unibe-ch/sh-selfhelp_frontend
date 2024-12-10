'use client';

import { Container, Group, Text } from '@mantine/core';
import classes from './AdminHeader.module.css';

export function AdminHeader() {
  return (
    <header className={classes.header}>
      <Container size="md">
        <div className={classes.inner}>
          <Text size="xl" fw={700}>Admin Panel</Text>
          <Group gap={5} visibleFrom="sm">
            {/* Add admin navigation items here */}
            <Text>Dashboard</Text>
            <Text>Users</Text>
            <Text>Settings</Text>
          </Group>
        </div>
      </Container>
    </header>
  );
}
