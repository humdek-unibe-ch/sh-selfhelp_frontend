'use client';

import { ActionIcon, Menu, useMantineColorScheme } from '@mantine/core';
import { IconSun, IconMoon, IconDeviceDesktop } from '@tabler/icons-react';
import { useEffect, useState } from 'react';

type ColorSchemeType = 'light' | 'dark' | 'auto';

const ICONS: Record<ColorSchemeType, React.JSX.Element> = {
    light: <IconSun size="1.2rem" stroke={1.5} />,
    dark: <IconMoon size="1.2rem" stroke={1.5} />,
    auto: <IconDeviceDesktop size="1.2rem" stroke={1.5} />,
};

/**
 * Color-scheme toggle.
 *
 * ## Hydration-mismatch background
 * Mantine's `useMantineColorScheme()` reads the persisted scheme from
 * `localStorage` (`mantine-color-scheme-value`). On SSR, `localStorage`
 * does not exist, so Mantine falls back to `defaultColorScheme` — in our
 * app that's `'auto'`. On the client, `useState` initialises with the
 * **stored** scheme (e.g. `'light'`). As a result the SSR tree renders
 * `IconDeviceDesktop` but the client renders `IconSun`, and React's
 * hydrator walks into a mismatch on the inner `<path>` children of the
 * tabler SVG.
 *
 * We defuse this with two belt-and-suspenders mechanisms:
 *
 *   1. A `mounted` flag that gates the icon lookup so server + client's
 *      *first* render both produce `ICONS.auto`. The flag flips
 *      `true` only after `useEffect` fires (post-commit), at which
 *      point the client picks the real icon.
 *
 *   2. `suppressHydrationWarning` on the wrapper so that, even if a
 *      browser extension or upstream Mantine change introduces a
 *      sub-element difference, React won't regenerate the whole subtree
 *      over what is purely a visual cosmetic.
 */
export function ThemeToggle(): React.JSX.Element {
    const { setColorScheme, colorScheme } = useMantineColorScheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (colorScheme !== 'auto') return;
        const mq = window.matchMedia('(prefers-color-scheme: dark)');
        setColorScheme(mq.matches ? 'dark' : 'light');
        const onChange = (e: MediaQueryListEvent) => {
            setColorScheme(e.matches ? 'dark' : 'light');
        };
        mq.addEventListener('change', onChange);
        return () => mq.removeEventListener('change', onChange);
    }, [colorScheme, setColorScheme]);

    const activeIcon = mounted
        ? ICONS[colorScheme as ColorSchemeType] ?? ICONS.auto
        : ICONS.auto;

    return (
        <Menu shadow="md" width={200} position="bottom-end">
            <Menu.Target>
                <ActionIcon variant="default" size="lg" aria-label="Toggle color scheme">
                    <span suppressHydrationWarning style={{ display: 'inline-flex' }}>
                        {activeIcon}
                    </span>
                </ActionIcon>
            </Menu.Target>

            <Menu.Dropdown>
                <Menu.Label>Color Scheme</Menu.Label>
                <Menu.Item leftSection={ICONS.light} onClick={() => setColorScheme('light')}>
                    Light
                </Menu.Item>
                <Menu.Item leftSection={ICONS.dark} onClick={() => setColorScheme('dark')}>
                    Dark
                </Menu.Item>
                <Menu.Item leftSection={ICONS.auto} onClick={() => setColorScheme('auto')}>
                    Auto (System)
                </Menu.Item>
            </Menu.Dropdown>
        </Menu>
    );
}
