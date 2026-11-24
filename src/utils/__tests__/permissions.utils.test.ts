/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { describe, it, expect } from 'vitest';
import {
    createPermissionChecker,
    parseCrudPermissions,
    stringifyCrudPermissions,
    hasAnyCrudPermission,
    hasAllCrudPermissions,
    setCrudTick,
    DEFAULT_CRUD_PERMISSIONS,
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

describe('hasAnyCrudPermission / hasAllCrudPermissions', () => {
    it('reports any vs all correctly', () => {
        expect(hasAnyCrudPermission({ view: true })).toBe(true);
        expect(hasAnyCrudPermission({ view: false, create: false })).toBe(false);
        expect(hasAllCrudPermissions({ view: true, create: true })).toBe(true);
        expect(hasAllCrudPermissions({ view: true, create: false })).toBe(false);
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

describe('setCrudTick', () => {
    const none = { ...DEFAULT_CRUD_PERMISSIONS };

    it('ticks view along with update, delete or create, because none works without it', () => {
        for (const right of ['update', 'delete', 'create'] as const) {
            expect(setCrudTick(none, right, true)).toMatchObject({ view: true, [right]: true });
        }
    });

    it('clears every right when view is unticked', () => {
        const full = { ...none, view: true, create: true, update: true, delete: true };
        expect(stringifyCrudPermissions(setCrudTick(full, 'view', false))).toBe(0);
    });

    it('gives back the stored row unchanged after unticking and reticking, so it no longer shows as changed', () => {
        const stored = parseCrudPermissions(6); // view + update, in the order the modals parse it
        const cleared = setCrudTick(stored, 'view', false);
        const back = setCrudTick(setCrudTick(cleared, 'view', true), 'update', true);
        expect(JSON.stringify(back)).toBe(JSON.stringify(stored));
    });

    it('keeps view when another right is unticked', () => {
        const viewUpdate = { ...none, view: true, update: true };
        expect(setCrudTick(viewUpdate, 'update', false)).toMatchObject({ view: true, update: false });
    });
});
