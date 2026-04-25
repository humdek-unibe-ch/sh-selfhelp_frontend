'use client';

import { ActionIcon, Menu, useMantineColorScheme } from '@mantine/core';
import { IconSun, IconMoon, IconDeviceDesktop } from '@tabler/icons-react';

type ColorSchemeType = 'light' | 'dark' | 'auto';

const ICONS: Record<ColorSchemeType, React.JSX.Element> = {
    light: <IconSun size="1.2rem" stroke={1.5} />,
    dark: <IconMoon size="1.2rem" stroke={1.5} />,
    auto: <IconDeviceDesktop size="1.2rem" stroke={1.5} />,
};

/**
 * Color-scheme toggle.
 *
 * ## Why there is no `mounted` gate anymore
 * Historically this component delayed rendering the real icon until after
 * `useEffect` ran, because Mantine's default (`localStorageColorSchemeManager`)
 * returned `defaultColorScheme` on SSR and the stored value on the client —
 * creating a hydration mismatch and a visible sun→moon flicker.
 *
 * We now use a cookie-backed `MantineColorSchemeManager` (see
 * `src/utils/cookie-color-scheme-manager.ts`) that reads the **same**
 * `sh_color_scheme` cookie on both server and client. The server resolves it
 * via `resolveColorSchemeSSR` and threads it into `MantineProvider` as
 * `defaultColorScheme`; the client manager returns the cookie value, which
 * matches. No mismatch, no `mounted` dance, no flicker.
 *
 * `suppressHydrationWarning` on the icon span is kept as a defensive net for
 * the one remaining case we cannot control — a user whose OS changes the
 * `prefers-color-scheme` media query between the SSR and the first client
 * render while in `'auto'` mode. The icon itself is always rendered from the
 * user's explicit choice (`light` / `dark` / `auto`), not the computed scheme,
 * so the UI intent stays stable.
 */
export function ThemeToggle(): React.JSX.Element {
    const { setColorScheme, colorScheme } = useMantineColorScheme();

    const activeIcon = ICONS[colorScheme as ColorSchemeType] ?? ICONS.auto;

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
