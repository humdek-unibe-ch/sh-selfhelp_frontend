/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { describe, it, expect } from 'vitest';
import { convertAclsToApiFormat, convertApiAclsToUiFormat } from '../acl-conversion.utils';

describe('convertAclsToApiFormat', () => {
    it('maps UI ACL pages to the API request shape', () => {
        const result = convertAclsToApiFormat([
            {
                id: 12,
                keyword: 'home',
                title: 'Home',
                type: 3,
                isSystem: false,
                isConfiguration: false,
                permissions: { select: true, insert: false, update: true, delete: false },
            },
        ]);
        expect(result).toEqual([
            { page_id: 12, acl_select: true, acl_insert: false, acl_update: true, acl_delete: false },
        ]);
    });
});

describe('convertApiAclsToUiFormat', () => {
    it('maps API ACLs to UI shape and applies defaults for missing fields', () => {
        const result = convertApiAclsToUiFormat([
            {
                page_id: 7,
                page_keyword: 'contact',
                acl_select: true,
                acl_insert: true,
            } as never,
        ]);
        expect(result[0]).toMatchObject({
            id: 7,
            keyword: 'contact',
            title: null,
            type: 3,
            isSystem: false,
            isConfiguration: false,
            permissions: { select: true, insert: true, update: false, delete: false },
        });
    });

    it('round-trips UI -> API -> UI permissions', () => {
        const ui = convertApiAclsToUiFormat([
            { page_id: 1, page_keyword: 'k', acl_select: true, acl_update: true } as never,
        ]);
        const api = convertAclsToApiFormat(ui);
        expect(api[0]).toMatchObject({ page_id: 1, acl_select: true, acl_update: true, acl_insert: false, acl_delete: false });
    });
});
