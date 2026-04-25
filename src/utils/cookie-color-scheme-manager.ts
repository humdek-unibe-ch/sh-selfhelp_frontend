/**
 * Cookie-backed Mantine `ColorSchemeManager`.
 *
 * Replaces Mantine's default `localStorageColorSchemeManager` so the server
 * and the client read the active color scheme from the **same** source — the
 * `sh_color_scheme` cookie.
 *
 * Why this matters: Mantine initialises its React state from the manager on
 * first render (`useState(() => manager.get(defaultValue))`). With the
 * default localStorage manager, SSR can only return `defaultColorScheme`
 * because `localStorage` isn't available server-side. On the client, the
 * manager reads `localStorage`, which can differ from whatever we resolved
 * on the server from the cookie. That mismatch triggered the
 * light→dark icon flicker on the `ThemeToggle` (server rendered the "auto"
 * placeholder icon, then the client re-rendered with the real scheme).
 *
 * By having the manager read the cookie on both sides, the manager always
 * returns the same value on server and client, Mantine's React state is
 * already correct on first paint, and no `mounted` guard is needed.
 *
 * Auto scheme: the cookie stores the user's *explicit* choice (`'auto'`,
 * `'light'`, or `'dark'`). When the user picks "auto", Mantine still
 * resolves it to light/dark via `prefers-color-scheme` for CSS purposes —
 * that resolution is done inside Mantine and mirrored by our pre-hydration
 * bootstrap script (`public/mantine-color-scheme.js`) so the HTML attribute
 * is correct before React renders.
 *
 * `subscribe` is intentionally a no-op: Mantine already keeps its React state
 * in sync internally when `setColorScheme` is called, so we do NOT want to
 * fan out our own change events from `set` (that would re-enter `set` via
 * `onUpdate` and produce an infinite recursion — the
 * `Maximum call stack size exceeded` users hit when toggling the theme).
 *
 * Cross-tab sync from cookies isn't a feature of the platform anyway; if we
 * ever need it we'd have to poll or use a `BroadcastChannel`, separately.
 */

import type { MantineColorScheme, MantineColorSchemeManager } from '@mantine/core';
import { COLOR_SCHEME_COOKIE, LONG_LIVED_COOKIE_MAX_AGE } from '../config/cookie-names';
import { writeBrowserCookie } from './auth.utils';

function isValidScheme(value: unknown): value is MantineColorScheme {
    return value === 'light' || value === 'dark' || value === 'auto';
}

function readCookie(): MantineColorScheme | null {
    if (typeof document === 'undefined') return null;
    const match = document.cookie.match(
        new RegExp(`(?:^|;\\s*)${COLOR_SCHEME_COOKIE}=([^;]+)`)
    );
    if (!match) return null;
    try {
        const raw = decodeURIComponent(match[1]);
        return isValidScheme(raw) ? raw : null;
    } catch {
        return null;
    }
}

export function cookieColorSchemeManager(): MantineColorSchemeManager {
    return {
        get: (defaultValue) => readCookie() ?? defaultValue,
        set: (value) =>
            writeBrowserCookie(COLOR_SCHEME_COOKIE, value, LONG_LIVED_COOKIE_MAX_AGE),
        subscribe: () => undefined,
        unsubscribe: () => undefined,
        clear: () => writeBrowserCookie(COLOR_SCHEME_COOKIE, '', 0),
    };
}
