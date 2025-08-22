'use client';

import { Group, Text, useMantineColorScheme } from '@mantine/core';
import Image from 'next/image';

interface SelfHelpLogoProps {
  size?: number;
}

export function SelfHelpLogo({ size = 30 }: SelfHelpLogoProps) {
  const { colorScheme } = useMantineColorScheme();
  
  const logoSrc = colorScheme === 'dark' ? '/assets/images/logo_negative.svg' : '/assets/images/logo.svg';

  return (
    <Group gap="xs">
      <Image 
        src={logoSrc}
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