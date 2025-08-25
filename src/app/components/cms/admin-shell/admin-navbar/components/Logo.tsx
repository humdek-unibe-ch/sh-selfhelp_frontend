'use client';

import { Group, useMantineColorScheme, Image } from '@mantine/core';

interface ILogoProps {
  style?: React.CSSProperties;
}

export function Logo({ style }: ILogoProps) {
  const { colorScheme } = useMantineColorScheme();
  const logoSrc = colorScheme === 'dark' ? '/assets/images/logo_negative.svg' : '/assets/images/logo.svg';

  return (
    <Group gap="xs" style={style}>
      <Image
        src={logoSrc}
        alt="SelfHelp CMS Logo"
        w={28}
        h={28}
      />
    </Group>
  );
}
