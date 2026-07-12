/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { describe, expect, it } from 'vitest';

import { buildStaticFallbackPath, pathFromSlug } from './slug-routing';

describe('slug routing helpers (DB-driven routing, issue #30)', () => {
    it('joins catch-all slug segments back into the public URL path', () => {
        expect(pathFromSlug(undefined)).toBe('/');
        expect(pathFromSlug([])).toBe('/');
        expect(pathFromSlug(['home'])).toBe('/home');
        expect(pathFromSlug(['reset'])).toBe('/reset');
        expect(pathFromSlug(['reset', '123', 'tok-abc'])).toBe('/reset/123/tok-abc');
        expect(pathFromSlug(['team', '7'])).toBe('/team/7');
    });

    it('encodes individual slug segments', () => {
        expect(pathFromSlug(['a b', 'c/d'])).toBe('/a%20b/c%2Fd');
    });

    it('maps resolved system-page keywords to their static fallback routes', () => {
        expect(buildStaticFallbackPath('no-access')).toBe('/auth/no-access');
        expect(buildStaticFallbackPath('no-access-guest')).toBe('/auth/no-access-guest');
        expect(buildStaticFallbackPath('missing')).toBe('/auth/missing');
        expect(buildStaticFallbackPath('reset-password')).toBe('/auth/reset-password');
    });

    it('returns null for keywords without a static fallback', () => {
        expect(buildStaticFallbackPath('home')).toBeNull();
        expect(buildStaticFallbackPath('team')).toBeNull();
        // The stale underscore keyword must no longer resolve to a fallback path.
        expect(buildStaticFallbackPath('reset_password')).toBeNull();
    });

    it('appends snake_case reset route params to the static fallback route', () => {
        expect(
            buildStaticFallbackPath('reset-password', { user_id: '123', token: 'tok-abc' })
        ).toBe('/auth/reset-password/123/tok-abc');
        // Plain /reset (no params) keeps the bare fallback (request-a-link mode).
        expect(buildStaticFallbackPath('reset-password', {})).toBe('/auth/reset-password');
    });
});
