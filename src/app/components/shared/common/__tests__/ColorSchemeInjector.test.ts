/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { afterEach, describe, expect, it, vi } from 'vitest';

import { COLOR_SCHEME_BOOTSTRAP } from '../ColorSchemeInjector';

/**
 * Runs the pre-hydration color-scheme bootstrap exactly as the browser would
 * (synchronous IIFE in <head>) against the current jsdom document. Returns the
 * resolved `data-mantine-color-scheme` attribute.
 *
 * Regression guard for the "auto + OS dark → light flash on reload" bug: the
 * resolution used to depend on an EXTERNAL `<script src>` that was fetched after
 * first paint, so the body painted light before the script applied dark. The
 * script is now inlined, but its logic must still resolve the scheme correctly.
 */
function runBootstrap(opts: {
    serverAttr?: 'light' | 'dark' | null;
    cookie?: string;
    prefersDark?: boolean;
}): string | null {
    const { serverAttr = null, cookie = '', prefersDark = false } = opts;

    document.documentElement.removeAttribute('data-mantine-color-scheme');
    if (serverAttr) {
        document.documentElement.setAttribute('data-mantine-color-scheme', serverAttr);
    }
    Object.defineProperty(document, 'cookie', { value: cookie, configurable: true, writable: true });
    vi.stubGlobal('matchMedia', (query: string) => ({
        matches: query.includes('dark') ? prefersDark : false,
        media: query,
        addEventListener: () => undefined,
        removeEventListener: () => undefined,
    }));

    // Intentionally executing the exact bootstrap string the browser runs.
    eval(COLOR_SCHEME_BOOTSTRAP);

    return document.documentElement.getAttribute('data-mantine-color-scheme');
}

describe('color scheme bootstrap (pre-hydration)', () => {
    afterEach(() => {
        vi.unstubAllGlobals();
        document.documentElement.removeAttribute('data-mantine-color-scheme');
    });

    it('resolves auto to dark when the OS prefers dark (the reported flash case)', () => {
        expect(runBootstrap({ cookie: 'sh_color_scheme=auto', prefersDark: true })).toBe('dark');
    });

    it('resolves auto to light when the OS prefers light', () => {
        expect(runBootstrap({ cookie: 'sh_color_scheme=auto', prefersDark: false })).toBe('light');
    });

    it('honours an explicit dark cookie regardless of OS preference', () => {
        expect(runBootstrap({ cookie: 'sh_color_scheme=dark', prefersDark: false })).toBe('dark');
    });

    it('does not override a scheme already stamped server-side', () => {
        // Explicit light/dark users get the attribute on the SSR <html>; the
        // bootstrap must leave it untouched (no work, no flash).
        expect(runBootstrap({ serverAttr: 'dark', cookie: 'sh_color_scheme=dark', prefersDark: false })).toBe('dark');
    });

    it('with no cookie, follows the OS preference (default auto) — dark when OS is dark', () => {
        // Regression for the "nothing selected → light-then-dark blink": a
        // first-time OS-dark visitor must paint dark pre-hydration so it matches
        // MantineProvider's defaultColorScheme="auto" resolution (no flip).
        expect(runBootstrap({ cookie: '', prefersDark: true })).toBe('dark');
    });

    it('with no cookie and OS light, resolves to light', () => {
        expect(runBootstrap({ cookie: '', prefersDark: false })).toBe('light');
    });
});
