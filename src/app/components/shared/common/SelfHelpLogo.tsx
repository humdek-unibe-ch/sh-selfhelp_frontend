/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
'use client';

import { Group, Text, useMantineColorScheme } from '@mantine/core';
import Image from 'next/image';

interface SelfHelpLogoProps {
  size?: number;
  /**
   * Compact renders a small logo mark + small product name on one tight row —
   * used in the admin navbar header where vertical space is precious.
   */
  variant?: 'default' | 'compact';
}

export function SelfHelpLogo({ size = 30, variant = 'default' }: SelfHelpLogoProps) {
  const { colorScheme } = useMantineColorScheme();

  const logoSrc = colorScheme === 'dark' ? '/assets/images/logo_negative.svg' : '/assets/images/logo.svg';
  const isCompact = variant === 'compact';
  const markSize = isCompact ? Math.min(size, 24) : size;

  return (
    <Group gap={isCompact ? 8 : 'xs'} wrap="nowrap">
      <Image
        src={logoSrc}
        alt="SelfHelp Logo"
        width={markSize}
        height={markSize}
        className="object-contain"
      />
      <Text fw={isCompact ? 600 : 700} size={isCompact ? 'sm' : 'xl'} lh={1}>
        SelfHelp
      </Text>
    </Group>
  );
}
