/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { describe, it, expect } from 'vitest';
import {
    createPermissionChecker,
    parseCrudPermissions,
    stringifyCrudPermissions,
    hasAnyPermission,
    hasAllPermissions,
} from '../permissions.utils';
import { PERMISSIONS } from '../../types/auth/jwt-payload.types';

describe('parseCrudPermissions', () => {
    it('decodes the CREATE|READ|UPDATE|DELETE bit flags', () => {
        expect(parseCrudPermissions(0)).toMatchObject({ create: false, view: false, update: false, delete: false });
        expect(parseCrudPermissions(2)).toMatchObject({ view: true, create: false });
        expect(parseCrudPermissions(15)).toMatchObject({ create: true, view: true, update: true, delete: true });
    });
});

describe('stringifyCrudPermissions', () => {
    it('round-trips every CRUD bit combination (0..15)', () => {
        for (let n = 0; n <= 15; n++) {
            expect(stringifyCrudPermissions(parseCrudPermissions(n))).toBe(n);
        }
    });
});

describe('hasAnyPermission / hasAllPermissions', () => {
    it('reports any vs all correctly', () => {
        expect(hasAnyPermission({ view: true })).toBe(true);
        expect(hasAnyPermission({ view: false, create: false })).toBe(false);
        expect(hasAllPermissions({ view: true, create: true })).toBe(true);
        expect(hasAllPermissions({ view: true, create: false })).toBe(false);
    });
});

describe('PermissionChecker', () => {
    it('grants only the permissions the user actually holds', () => {
        const checker = createPermissionChecker([PERMISSIONS.ADMIN_ACCESS, PERMISSIONS.ADMIN_PLUGINS_EXECUTE]);
        expect(checker.canAccessAdmin()).toBe(true);
        expect(checker.canExecutePlugins()).toBe(true);
        expect(checker.canPurgePlugins()).toBe(false);
    });

    it('treats a missing permission list as no access', () => {
        const checker = createPermissionChecker([]);
        expect(checker.canAccessAdmin()).toBe(false);
        expect(checker.hasAnyPermission(PERMISSIONS.ADMIN_USER_READ, PERMISSIONS.ADMIN_USER_CREATE)).toBe(false);
    });

    it('separates registration-code read (list/export) from create (generate)', () => {
        const reader = createPermissionChecker([PERMISSIONS.ADMIN_REGISTRATION_CODE_READ]);
        expect(reader.canReadRegistrationCodes()).toBe(true);
        expect(reader.canCreateRegistrationCodes()).toBe(false);

        const creator = createPermissionChecker([
            PERMISSIONS.ADMIN_REGISTRATION_CODE_READ,
            PERMISSIONS.ADMIN_REGISTRATION_CODE_CREATE,
        ]);
        expect(creator.canReadRegistrationCodes()).toBe(true);
        expect(creator.canCreateRegistrationCodes()).toBe(true);
    });
});
