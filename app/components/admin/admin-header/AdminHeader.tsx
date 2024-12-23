'use client';

import { Burger, Group } from '@mantine/core';
import classes from './AdminHeader.module.css';
import { SelfHelpLogo } from '../../common/SelfHelpLogo';

interface AdminHeaderProps {
  opened: boolean;
  onToggle: () => void;
}

export function AdminHeader({ opened, onToggle }: AdminHeaderProps) {
  return (
    <Group h="100%" px="md">
      <Burger opened={opened} onClick={onToggle} hiddenFrom="sm" size="sm" />
      <SelfHelpLogo size={40} />
    </Group>
  );
}
