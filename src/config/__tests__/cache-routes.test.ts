/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
/**
 * Regression guard (canonical Testing Rule 2) for the cache-management 404s:
 * the admin cache endpoints had drifted to paths the Symfony backend never
 * registers (`/admin/cache/clear`, `/admin/cache/reset-stats`,
 * `/admin/cache/clear-api-routes`), so "Clear cache" from the admin Cache
 * Management screen returned `404 No route found`.
 *
 * These tests pin every admin cache route to the path the backend actually
 * exposes (see backend `AdminCacheControllerTest` + `docs/reference/api/11-admin-cache.md`).
 */
import { describe, it, expect } from 'vitest';
import { API_CONFIG } from '../api.config';

const E = API_CONFIG.ENDPOINTS;

describe('admin cache endpoint routes match the backend contract', () => {
    it('uses the real /admin/cache/* paths the Symfony backend registers', () => {
        expect(E.ADMIN_CACHE_STATS.route).toBe('/admin/cache/stats');
        expect(E.ADMIN_CACHE_HEALTH.route).toBe('/admin/cache/health');
        expect(E.ADMIN_CACHE_CLEAR_ALL.route).toBe('/admin/cache/clear/all');
        expect(E.ADMIN_CACHE_CLEAR_CATEGORY.route).toBe('/admin/cache/clear/category');
        expect(E.ADMIN_CACHE_CLEAR_USER.route).toBe('/admin/cache/clear/user');
        expect(E.ADMIN_CACHE_RESET_STATS.route).toBe('/admin/cache/stats/reset');
        expect(E.ADMIN_CACHE_CLEAR_API_ROUTES.route).toBe('/admin/cache/api-routes/clear');
    });

    it('never falls back to the dead /admin/cache/clear path that 404ed', () => {
        const dead = '/admin/cache/clear';
        expect(E.ADMIN_CACHE_CLEAR_ALL.route).not.toBe(dead);
        expect(E.ADMIN_CACHE_CLEAR_CATEGORY.route).not.toBe(dead);
        expect(E.ADMIN_CACHE_CLEAR_USER.route).not.toBe(dead);
    });
});
