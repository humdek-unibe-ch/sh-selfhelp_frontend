/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { describe, it, expect } from 'vitest';
import { convertAclsToApiFormat, convertApiAclsToUiFormat } from '../acl-conversion.utils';

describe('convertAclsToApiFormat', () => {
    it('maps selected pages to C1 { page_id, acl_select } only', () => {
        const result = convertAclsToApiFormat([
            {
                id: 12,
                keyword: 'home',
                title: 'Home',
                type: 3,
                isSystem: false,
                isConfiguration: false,
                permissions: { select: true },
            },
            {
                id: 99,
                keyword: 'hidden',
                title: null,
                type: 3,
                isSystem: false,
                isConfiguration: false,
                permissions: { select: false },
            },
        ]);
        expect(result).toEqual([{ page_id: 12, acl_select: true }]);
        expect(JSON.stringify(result)).not.toMatch(/acl_(insert|update|delete)/);
    });
});

describe('convertApiAclsToUiFormat', () => {
    it('maps API ACLs with acl_select to UI shape', () => {
        const result = convertApiAclsToUiFormat([
            {
                page_id: 7,
                page_keyword: 'contact',
                page_title: null,
                page_type: 3,
                is_system: false,
                is_configuration: false,
                acl_select: true,
            },
        ]);
        expect(result[0]).toMatchObject({
            id: 7,
            keyword: 'contact',
            title: null,
            type: 3,
            isSystem: false,
            isConfiguration: false,
            permissions: { select: true },
        });
        expect(Object.keys(result[0].permissions)).toEqual(['select']);
    });

    it('round-trips UI -> API -> UI with select only', () => {
        const ui = convertApiAclsToUiFormat([
            {
                page_id: 1,
                page_keyword: 'k',
                page_title: null,
                page_type: 3,
                is_system: false,
                is_configuration: false,
                acl_select: true,
            },
        ]);
        const api = convertAclsToApiFormat(ui);
        expect(api).toEqual([{ page_id: 1, acl_select: true }]);
        expect(Object.keys(api[0])).toEqual(['page_id', 'acl_select']);
    });
});
