'use client';

import { ActionIcon, useMantineColorScheme } from '@mantine/core';
import { IconSun, IconMoon } from '@tabler/icons-react';

/**
 * Client Component for Theme Toggle
 * Handles interactive theme switching between light and dark modes
 */
export function ThemeToggleClient() {
    const { colorScheme, toggleColorScheme } = useMantineColorScheme();

    return (
        <ActionIcon
            onClick={() => toggleColorScheme()}
            variant="default"
            size="lg"
            aria-label="Toggle theme"
        >
            {colorScheme === 'dark' ? <IconSun size="1.2rem" /> : <IconMoon size="1.2rem" />}
        </ActionIcon>
    );
}
