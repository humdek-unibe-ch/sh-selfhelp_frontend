/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { describe, expect, it } from 'vitest';
import { keepPlaceholderWithinAuthScope } from '../navigation-query.utils';

describe('keepPlaceholderWithinAuthScope', () => {
    it('reuses placeholder data within the same auth scope', () => {
        const keep = keepPlaceholderWithinAuthScope<string[]>('user:7');
        expect(
            keep(['about'], {
                queryKey: ['navigation', 1, 'user:7'],
            } as unknown as Parameters<typeof keep>[1]),
        ).toEqual(['about']);
    });

    it('drops placeholder data when auth scope changes', () => {
        const keep = keepPlaceholderWithinAuthScope<string[]>('user:7');
        expect(
            keep(['about'], {
                queryKey: ['navigation', 1, 'guest'],
            } as unknown as Parameters<typeof keep>[1]),
        ).toBeUndefined();
    });
});
