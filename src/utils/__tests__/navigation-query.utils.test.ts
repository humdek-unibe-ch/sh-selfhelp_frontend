/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { describe, expect, it } from 'vitest';
import {
    keepPlaceholderWithinAuthScope,
    navigationAuthScopeFromUserId,
} from '../navigation-query.utils';

describe('navigationAuthScopeFromUserId', () => {
    it('returns guest scope when user id is missing', () => {
        expect(navigationAuthScopeFromUserId(null)).toBe('guest');
        expect(navigationAuthScopeFromUserId(undefined)).toBe('guest');
    });

    it('returns user-scoped key when user id is present', () => {
        expect(navigationAuthScopeFromUserId(42)).toBe('user:42');
    });
});

describe('keepPlaceholderWithinAuthScope', () => {
    it('reuses placeholder only when auth scope matches', () => {
        const keep = keepPlaceholderWithinAuthScope('guest');
        const previousData = { menus: {} };

        expect(
            keep(previousData, {
                queryKey: ['navigation', 1, 'guest'],
            } as never),
        ).toBe(previousData);

        expect(
            keep(previousData, {
                queryKey: ['navigation', 1, 'user:7'],
            } as never),
        ).toBeUndefined();
    });
});
