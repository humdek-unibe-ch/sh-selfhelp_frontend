'use client';

import { Group, Text } from '@mantine/core';
import Image from 'next/image';

interface SelfHelpLogoProps {
  size?: number;
}

export function SelfHelpLogo({ size = 30 }: SelfHelpLogoProps) {
  return (
    <Group gap="xs">
      <Image 
        src="/assets/images/logo.svg" 
        alt="SelfHelp Logo" 
        width={size} 
        height={size}
        style={{ objectFit: 'contain' }}
      />
      <Text 
        fw={700} 
        size="xl"
      >
        SelfHelp
      </Text>
    </Group>
  );
} 