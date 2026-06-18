/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { describe, expect, it } from 'vitest';

import { buildStaticFallbackPath, keywordFromSlug } from './slug-routing';

describe('slug routing helpers', () => {
    it('maps reset token URLs to the reset_password CMS keyword', () => {
        expect(keywordFromSlug(['reset'])).toBe('reset_password');
        expect(keywordFromSlug(['reset', '123', 'tok-abc'])).toBe('reset_password');
    });

    it('keeps validate token URLs on the validate CMS keyword', () => {
        expect(keywordFromSlug(['validate', '123', 'tok-abc'])).toBe('validate');
    });

    // Regression: CMS error-page keywords are kebab-case (no-access, no-access-guest).
    // Aliasing them to underscores (no_access) made the by-keyword lookup 404 and
    // bounced /no-access -> /auth/no-access. The slug must resolve to the kebab
    // keyword that actually exists in the CMS so the page renders in place.
    it('resolves the no-access slugs to their kebab CMS keywords (no underscore alias)', () => {
        expect(keywordFromSlug(['no-access'])).toBe('no-access');
        expect(keywordFromSlug(['no-access-guest'])).toBe('no-access-guest');
        expect(keywordFromSlug(['missing'])).toBe('missing');
    });

    it('keeps the kebab no-access keywords as the static fallback targets', () => {
        // The fallback only fires when the CMS page is genuinely missing; it must
        // be keyed by the same kebab keyword keywordFromSlug now produces.
        expect(buildStaticFallbackPath('no-access', ['no-access'])).toBe('/auth/no-access');
        expect(buildStaticFallbackPath('no-access-guest', ['no-access-guest'])).toBe('/auth/no-access-guest');
        // The stale underscore keyword must no longer resolve to a fallback path.
        expect(buildStaticFallbackPath('no_access', ['no-access'])).toBeNull();
    });

    it('preserves reset tokens on the static fallback route', () => {
        expect(buildStaticFallbackPath('reset_password', ['reset', '123', 'tok-abc'])).toBe('/auth/reset-password/123/tok-abc');
        expect(buildStaticFallbackPath('reset_password', ['reset'])).toBe('/auth/reset-password');
    });
});
