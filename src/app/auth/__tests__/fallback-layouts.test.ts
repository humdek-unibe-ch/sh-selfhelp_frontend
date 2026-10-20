/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { existsSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const AUTH_DIR = path.resolve(__dirname, '..');

describe('static auth fallback layouts', () => {
    // The CMS register / reset-password system pages are headless (backend
    // Version20260710093046). Their static fallbacks must not add a route
    // layout that wraps them in WebsiteLayout (header + footer), otherwise a
    // guest sees the full site chrome as if already signed in.
    it.each(['register', 'reset-password'])(
        'renders the %s fallback headless, without a WebsiteLayout route layout',
        (route) => {
            expect(existsSync(path.join(AUTH_DIR, route, 'layout.tsx'))).toBe(false);
        }
    );

    it('keeps the website header and footer on the profile fallback', () => {
        expect(existsSync(path.join(AUTH_DIR, 'profile', 'layout.tsx'))).toBe(true);
    });
});
