'use client';

import { ActionIcon, Menu, useMantineColorScheme } from '@mantine/core';
import { IconSun, IconMoon, IconDeviceDesktop } from '@tabler/icons-react';
import { useEffect } from 'react';

type ColorSchemeType = 'light' | 'dark' | 'auto';

export function ThemeToggle(): React.JSX.Element {
    const { setColorScheme, colorScheme } = useMantineColorScheme();

    // Function to check system preference
    const getSystemPreference = (): 'light' | 'dark' => {
        if (typeof window === 'undefined') return 'light';
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    };

    // Handle auto mode
    useEffect(() => {
        if (colorScheme === 'auto') {
            const systemScheme = getSystemPreference();
            setColorScheme(systemScheme);
        }
    }, [colorScheme, setColorScheme]);

    // Listen for system theme changes when in auto mode
    useEffect(() => {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

        const handleChange = (e: MediaQueryListEvent) => {
            if (colorScheme === 'auto') {
                setColorScheme(e.matches ? 'dark' : 'light');
            }
        };

        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
    }, [colorScheme, setColorScheme]);

    const icons: Record<ColorSchemeType, React.JSX.Element> = {
        light: <IconSun size="1.2rem" stroke={1.5} />,
        dark: <IconMoon size="1.2rem" stroke={1.5} />,
        auto: <IconDeviceDesktop size="1.2rem" stroke={1.5} />
    };

    return (
        <Menu shadow="md" width={200} position="bottom-end">
            <Menu.Target>
                <ActionIcon 
                    variant="default" 
                    size="lg"
                    aria-label="Toggle color scheme"
                >
                    {icons[colorScheme as ColorSchemeType] || icons.auto}
                </ActionIcon>
            </Menu.Target>

            <Menu.Dropdown>
                <Menu.Label>Color Scheme</Menu.Label>
                <Menu.Item
                    leftSection={icons.light}
                    onClick={() => setColorScheme('light')}
                >
                    Light
                </Menu.Item>
                <Menu.Item
                    leftSection={icons.dark}
                    onClick={() => setColorScheme('dark')}
                >
                    Dark
                </Menu.Item>
                <Menu.Item
                    leftSection={icons.auto}
                    onClick={() => setColorScheme('auto')}
                >
                    Auto (System)
                </Menu.Item>
            </Menu.Dropdown>
        </Menu>
    );
} 