/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { describe, it, expect } from 'vitest';
import { API_CONFIG } from '../api.config';
import { PERMISSIONS } from '../../types/auth/jwt-payload.types';

/**
 * The route to permission map (`api.config.ts`, F32) is kept by hand, so it can drift
 * from the routes the server guards. This pins the part that the role-scope task
 * (contract C1) changed: one read permission per admin area, the writes behind their own
 * right, and the data-access routes behind the role permissions instead of the
 * audit-style ones.
 */
type Endpoint = { route: string | ((id: number) => string); permissions: readonly string[] };

const E = API_CONFIG.ENDPOINTS;
const pathOf = (endpoint: Endpoint): string => (typeof endpoint.route === 'function' ? endpoint.route(7) : endpoint.route);

const C1_ROUTES: Array<[label: string, endpoint: Endpoint, path: string, permission: string]> = [
    ['GET /admin/languages', E.ADMIN_LANGUAGES_GET_ALL, '/admin/languages', 'admin.language.read'],
    ['GET /admin/languages/{id}', E.ADMIN_LANGUAGES_GET_ONE, '/admin/languages/7', 'admin.language.read'],
    ['POST /admin/languages', E.ADMIN_LANGUAGES_CREATE, '/admin/languages', 'admin.language.update'],
    ['PUT /admin/languages/{id}', E.ADMIN_LANGUAGES_UPDATE, '/admin/languages/7', 'admin.language.update'],
    ['DELETE /admin/languages/{id}', E.ADMIN_LANGUAGES_DELETE, '/admin/languages/7', 'admin.language.update'],
    ['GET /admin/audit/data-access', E.ADMIN_AUDIT_DATA_ACCESS_LIST, '/admin/audit/data-access', 'admin.audit.read'],
    ['GET /admin/audit/data-access/{id}', E.ADMIN_AUDIT_DATA_ACCESS_DETAIL, '/admin/audit/data-access/7', 'admin.audit.read'],
    ['GET /admin/audit/data-access/stats', E.ADMIN_AUDIT_DATA_ACCESS_STATS, '/admin/audit/data-access/stats', 'admin.audit.read'],
    ['GET /admin/sections/unused', E.ADMIN_SECTIONS_UNUSED_GET, '/admin/sections/unused', 'admin.section.read'],
    ['DELETE /admin/sections/unused', E.ADMIN_SECTIONS_UNUSED_DELETE_ALL, '/admin/sections/unused', 'admin.section.delete'],
    ['DELETE /admin/sections/unused/{section_id}', E.ADMIN_SECTIONS_UNUSED_DELETE, '/admin/sections/unused/7', 'admin.section.delete'],
    ['GET /admin/data-access/roles', E.ADMIN_DATA_ACCESS_ROLES_LIST, '/admin/data-access/roles', 'admin.role.read'],
    [
        'GET /admin/data-access/roles/{roleId}/effective-permissions',
        E.ADMIN_DATA_ACCESS_ROLE_EFFECTIVE_PERMISSIONS,
        '/admin/data-access/roles/7/effective-permissions',
        'admin.role.read',
    ],
    [
        'POST /admin/data-access/roles/{roleId}/permissions',
        E.ADMIN_DATA_ACCESS_ROLE_PERMISSIONS_SET,
        '/admin/data-access/roles/7/permissions',
        'admin.role.update',
    ],
];

describe('route permissions of the role-scope task (C1)', () => {
    it.each(C1_ROUTES)('%s asks for exactly its C1 permission', (_label, endpoint, path, permission) => {
        expect(pathOf(endpoint)).toBe(path);
        expect(endpoint.permissions).toEqual([permission]);
    });

    it('names the new permissions in the constants', () => {
        expect(PERMISSIONS).toMatchObject({
            ADMIN_LANGUAGE_READ: 'admin.language.read',
            ADMIN_LANGUAGE_UPDATE: 'admin.language.update',
            ADMIN_AUDIT_READ: 'admin.audit.read',
            ADMIN_SECTION_READ: 'admin.section.read',
            ADMIN_MOBILE_PREVIEW_READ: 'admin.mobile_preview.read',
        });
    });
});
