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

    /**
     * Regression: in manager-local mode the iframe's `/mobile-preview/?…`
     * (trailing slash, the Expo `baseUrl` canonical) must reach the rewrite
     * untouched. Next's default 308 slash-strip made Expo boot on the
     * non-canonical no-slash URL, flooding `history.replaceState` until the pane
     * stalled on "Starting up…" with Chromium's navigation-throttling warning.
     */
    it('does not 308-strip the trailing slash so the Expo baseUrl canonical is served', () => {
        const config = createNextConfig('phase-production-build');

        expect(config.skipTrailingSlashRedirect).toBe(true);
    });
});
