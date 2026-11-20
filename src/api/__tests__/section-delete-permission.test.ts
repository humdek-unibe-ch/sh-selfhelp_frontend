/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { describe, it, expect } from 'vitest';
import { API_CONFIG } from '../../config/api.config';
import { PERMISSIONS } from '../../types/auth/jwt-payload.types';

/**
 * The client gate must ask for the same right as the backend route row:
 * deleting a section for good (`admin_sections_destroy`) needs admin.page.delete,
 * not admin.section.delete (which only covers the Unused sections cleanup);
 * deleting a page version needs admin.page_version.delete (F235).
 */
describe('destructive section and version routes declare the backend right', () => {
    it('section delete needs admin.page.delete', () => {
        expect(API_CONFIG.ENDPOINTS.ADMIN_SECTIONS_DELETE.permissions).toEqual([PERMISSIONS.ADMIN_PAGE_DELETE]);
    });

    it('version delete needs admin.page_version.delete', () => {
        expect(API_CONFIG.ENDPOINTS.ADMIN_PAGE_VERSIONS_DELETE.permissions).toEqual([PERMISSIONS.ADMIN_PAGE_VERSION_DELETE]);
    });

    it('importing and restoring sections need admin.page.update, not export (F237)', () => {
        for (const endpoint of [
            API_CONFIG.ENDPOINTS.ADMIN_SECTIONS_IMPORT_TO_PAGE,
            API_CONFIG.ENDPOINTS.ADMIN_SECTIONS_IMPORT_TO_SECTION,
            API_CONFIG.ENDPOINTS.ADMIN_PAGE_VERSIONS_RESTORE_FROM_VERSION,
        ]) {
            expect(endpoint.permissions).toEqual([PERMISSIONS.ADMIN_PAGE_UPDATE]);
        }
    });

    it('permissions that guard nothing are gone (2026-11-19)', () => {
        for (const removed of [
            'admin.page.insert',
            'admin.action_translation.read',
            'admin.page_version.create',
            'admin.page_version.unpublish',
            'admin.user.unblock',
            'admin.cms_preferences.update',
        ]) {
            expect(Object.values(PERMISSIONS)).not.toContain(removed);
        }
    });

    it('user group/role links and the activation mail declare the users rights', () => {
        expect(API_CONFIG.ENDPOINTS.ADMIN_USERS_GROUPS_GET.permissions).toEqual([PERMISSIONS.ADMIN_USER_READ]);
        expect(API_CONFIG.ENDPOINTS.ADMIN_USERS_ROLES_GET.permissions).toEqual([PERMISSIONS.ADMIN_USER_READ]);
        for (const endpoint of [
            API_CONFIG.ENDPOINTS.ADMIN_USERS_GROUPS_ADD,
            API_CONFIG.ENDPOINTS.ADMIN_USERS_GROUPS_REMOVE,
            API_CONFIG.ENDPOINTS.ADMIN_USERS_ROLES_ADD,
            API_CONFIG.ENDPOINTS.ADMIN_USERS_ROLES_REMOVE,
            API_CONFIG.ENDPOINTS.ADMIN_USERS_SEND_ACTIVATION,
        ]) {
            expect(endpoint.permissions).toEqual([PERMISSIONS.ADMIN_USER_UPDATE]);
        }
    });

    it('action translations are read with admin.action.read', () => {
        expect(API_CONFIG.ENDPOINTS.ADMIN_ACTIONS_TRANSLATIONS_GET_ALL.permissions).toEqual([PERMISSIONS.ADMIN_ACTION_READ]);
    });
});
