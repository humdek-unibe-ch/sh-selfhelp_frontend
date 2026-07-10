/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
/**
 * should_fallback: behavioral proof lives in
 * `src/app/[[...slug]]/__tests__/shouldStaticFallback.test.ts`.
 * This file only guards the slug page wiring.
 */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

describe('should_fallback slug wiring', () => {
    it('slug page uses shouldStaticFallback and never empty-sections inference', () => {
        const src = readFileSync(join(process.cwd(), 'src/app/[[...slug]]/page.tsx'), 'utf8');
        expect(src).toContain('shouldStaticFallback');
        expect(src).not.toMatch(/sections\.length === 0/);
        expect(src).not.toMatch(/older BE|older-backend|older backend/i);
    });
});
