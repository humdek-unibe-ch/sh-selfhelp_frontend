/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { describe, it, expect } from 'vitest';
import type { IPermission } from '../../../../../../api/admin/permission.api';
import {
    LOCKED_IMPLIED_READ,
    LOCKED_NOT_HELD,
    buildPermissionOptions,
    filterPermissionAreas,
    groupPermissionsByArea,
    impliedReadIds,
    withImpliedReads,
} from '../permission-picker.utils';

const permission = (overrides: Partial<IPermission> & Pick<IPermission, 'id' | 'name'>): IPermission => ({
    description: null,
    can_assign: true,
    implied_read: null,
    ...overrides,
});

const READ = permission({ id: 1, name: 'admin.group.read', description: 'See groups' });
const ACL = permission({ id: 2, name: 'admin.group.acl', description: 'Change page access of groups', implied_read: 'admin.group.read' });
const UPDATE = permission({ id: 3, name: 'admin.group.update', description: 'Change groups', implied_read: 'admin.group.read' });
const LOOSE = permission({ id: 4, name: 'plugin.custom.use', description: '   ' });
const POINTING_NOWHERE = permission({ id: 5, name: 'admin.ghost.update', implied_read: 'admin.ghost.read' });
const ALL = [READ, ACL, UPDATE, LOOSE, POINTING_NOWHERE];

describe('impliedReadIds', () => {
    it('names the read right of every area that has another right ticked', () => {
        expect([...impliedReadIds(['2'], ALL)]).toEqual(['1']);
        expect([...impliedReadIds(['2', '3'], ALL)]).toEqual(['1']);
    });

    it('is empty for a read right, a right without an area, and a read right that is not in the list', () => {
        expect(impliedReadIds(['1'], ALL).size).toBe(0);
        expect(impliedReadIds(['4'], ALL).size).toBe(0);
        expect(impliedReadIds(['5'], ALL).size).toBe(0);
        expect(impliedReadIds([], ALL).size).toBe(0);
    });
});

describe('withImpliedReads', () => {
    it('adds the read right once and keeps the order of the ticked ones', () => {
        expect(withImpliedReads(['3', '2'], ALL)).toEqual(['3', '2', '1']);
    });

    it('leaves a selection alone that already holds the read right, and is idempotent', () => {
        expect(withImpliedReads(['1', '2'], ALL)).toEqual(['1', '2']);
        const once = withImpliedReads(['2'], ALL);
        expect(withImpliedReads(once, ALL)).toEqual(once);
    });
});

describe('buildPermissionOptions', () => {
    it('labels an option with the description and keeps the key beside it', () => {
        const [read] = buildPermissionOptions(ALL, []);
        expect(read).toMatchObject({ value: '1', label: 'See groups', name: 'admin.group.read', disabled: false, lockedReason: null });
    });

    it('uses the key as the label when the description is missing or blank', () => {
        const options = buildPermissionOptions([LOOSE, permission({ id: 6, name: 'plugin.other.use', description: null })], []);
        expect(options.map((option) => option.label)).toEqual(['plugin.custom.use', 'plugin.other.use']);
    });

    it('locks a permission the caller does not hold', () => {
        const [option] = buildPermissionOptions([permission({ id: 7, name: 'admin.user.impersonate', can_assign: false })], []);
        expect(option).toMatchObject({ disabled: true, lockedReason: LOCKED_NOT_HELD });
    });

    it('locks the read right while another right of its area is ticked, and frees it afterwards', () => {
        const locked = buildPermissionOptions(ALL, ['2']);
        expect(locked[0]).toMatchObject({ value: '1', disabled: true, lockedReason: LOCKED_IMPLIED_READ });
        // The right that asks for it stays free to untick.
        expect(locked[1]).toMatchObject({ value: '2', disabled: false, lockedReason: null });

        const freed = buildPermissionOptions(ALL, ['1']);
        expect(freed[0]).toMatchObject({ disabled: false, lockedReason: null });
    });

    it('gives the not-held reason first when a read right is both', () => {
        const notHeldRead = permission({ id: 1, name: 'admin.group.read', can_assign: false });
        const [read] = buildPermissionOptions([notHeldRead, ACL], ['2']);
        expect(read.lockedReason).toBe(LOCKED_NOT_HELD);
    });
});

describe('groupPermissionsByArea', () => {
    const ACCESS = permission({ id: 6, name: 'admin.access', description: 'Enter the admin' });
    const VERSION_READ = permission({ id: 7, name: 'admin.page_version.read', description: 'See versions' });
    const areas = groupPermissionsByArea(buildPermissionOptions([...ALL, ACCESS, VERSION_READ], []));
    const byKey = (key: string) => areas.find((area) => area.key === key);

    it('puts each permission in the column of its action, and other actions under Other', () => {
        const group = byKey('admin.group');
        expect(group?.label).toBe('Group');
        expect(group?.actions.read?.name).toBe('admin.group.read');
        expect(group?.actions.update?.name).toBe('admin.group.update');
        expect(group?.actions.create).toBeUndefined();
        expect(group?.other.map((item) => [item.action, item.option.name])).toEqual([['acl', 'admin.group.acl']]);
    });

    it('names areas for people and keeps plugin areas apart', () => {
        expect(byKey('admin.page_version')?.label).toBe('Page version');
        expect(byKey('plugin.custom')?.label).toBe('Plugin custom');
        expect(byKey('admin')?.label).toBe('Admin area');
        expect(byKey('admin')?.other[0].option.name).toBe('admin.access');
    });

    it('lists the admin area first and the rest by label', () => {
        expect(areas.map((area) => area.label)).toEqual(['Admin area', 'Ghost', 'Group', 'Page version', 'Plugin custom']);
    });
});

describe('filterPermissionAreas', () => {
    const areas = groupPermissionsByArea(buildPermissionOptions(ALL, []));
    const keys = (search: string) => filterPermissionAreas(areas, search).map((area) => area.key);

    it('returns every area for an empty or blank search', () => {
        expect(keys('')).toHaveLength(areas.length);
        expect(keys('   ')).toHaveLength(areas.length);
    });

    it('matches the area name, a description or a key, ignoring case and surrounding spaces', () => {
        expect(keys('group')).toEqual(['admin.group']);
        expect(keys('page access')).toEqual(['admin.group']);
        expect(keys('  PLUGIN.CUSTOM.USE ')).toEqual(['plugin.custom']);
        expect(keys('nothing like this')).toEqual([]);
    });
});
