/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
/**
 * Guards the single source of truth for admin-session-lifecycle routes (audit
 * Finding 8). The list previously existed twice — verbatim in the BFF proxy and
 * again in the RSC server-fetch helper — with a "keep both in lock-step"
 * comment as the only safeguard. It now lives once in `server.config.ts`.
 *
 * These tests pin the list contents and assert that the two matching strategies
 * the consumers use (proxy: full upstream URL incl. the API prefix; server
 * fetch: relative path) classify the same logical routes identically, so the
 * lock-step contract is enforced by a test rather than a comment.
 */
import { describe, it, expect } from 'vitest';
import {
    ADMIN_SESSION_ROUTE_PREFIXES,
    SYMFONY_API_PREFIX,
} from '../server.config';

// Mirror of the two consumer strategies (kept tiny on purpose).
const matchesAsUpstreamUrl = (logicalPath: string): boolean =>
    ADMIN_SESSION_ROUTE_PREFIXES.some((prefix) =>
        `http://symfony${SYMFONY_API_PREFIX}${logicalPath}`.includes(`${SYMFONY_API_PREFIX}${prefix}`),
    );

const matchesAsRelativePath = (logicalPath: string): boolean =>
    ADMIN_SESSION_ROUTE_PREFIXES.some((prefix) => logicalPath.startsWith(prefix));

describe('ADMIN_SESSION_ROUTE_PREFIXES', () => {
    it('contains exactly the admin-session lifecycle routes', () => {
        expect([...ADMIN_SESSION_ROUTE_PREFIXES]).toEqual([
            '/auth/login',
            '/auth/logout',
            '/auth/refresh-token',
            '/auth/two-factor',
            '/auth/set-language',
        ]);
    });

    it.each([
        ['/auth/login', true],
        ['/auth/logout', true],
        ['/auth/refresh-token', true],
        ['/auth/two-factor-verify', true],
        ['/auth/set-language', true],
        ['/auth/user-data', false],
        ['/admin/pages', false],
        ['/pages/home', false],
    ])('classifies %s identically under both matching strategies', (path, expected) => {
        expect(matchesAsRelativePath(path)).toBe(expected);
        expect(matchesAsUpstreamUrl(path)).toBe(expected);
    });
});
