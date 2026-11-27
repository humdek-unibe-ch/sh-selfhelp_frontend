/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { describe, expect, it } from 'vitest';
import { formatContentRef } from '../content-ref.utils';

describe('formatContentRef (C19)', () => {
    it('shows the stored reference and unknown for a missing one', () => {
        expect(formatContentRef('page:7@v3')).toBe('page:7@v3');
        expect(formatContentRef(null)).toBe('unknown');
        expect(formatContentRef(undefined)).toBe('unknown');
        expect(formatContentRef('')).toBe('unknown');
    });
});
