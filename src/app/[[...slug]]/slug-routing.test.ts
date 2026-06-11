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

    it('preserves reset tokens on the static fallback route', () => {
        expect(buildStaticFallbackPath('reset_password', ['reset', '123', 'tok-abc'])).toBe('/auth/reset-password/123/tok-abc');
        expect(buildStaticFallbackPath('reset_password', ['reset'])).toBe('/auth/reset-password');
    });
});
