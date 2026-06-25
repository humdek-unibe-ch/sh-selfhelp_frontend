/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { describe, expect, it } from 'vitest';
import createNextConfig from '../../../next.config.mjs';

describe('Next.js mobile-preview routing', () => {
    it('proxies the same-origin preview path to the private Docker service', async () => {
        const config = createNextConfig('phase-production-build');
        const rewrites = await config.rewrites?.();

        expect(rewrites).toEqual(
            expect.arrayContaining([
                {
                    source: '/mobile-preview/:path*',
                    destination: 'http://mobile-preview:8080/mobile-preview/:path*',
                },
            ]),
        );
    });
});
