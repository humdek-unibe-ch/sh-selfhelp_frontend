/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { describe, expect, it } from 'vitest';
import { plannedScaffoldRoutes, scaffoldFormNeedsCmsList } from '../cmsAppPages.utils';

const all = { base: 'team', recordIdParam: 'record_id', createForm: true, createPublic: true, createAdmin: true };

describe('plannedScaffoldRoutes', () => {
    it('plans one CMS list and a public list with its detail page', () => {
        const routes = plannedScaffoldRoutes(all);

        expect(routes.map((route) => [route.role, route.surface, route.pattern])).toEqual([
            ['cms_list', 'cms', '/cms/team'],
            ['public_list', 'public', '/team'],
            ['public_detail', 'public', '/team/{record_id}'],
        ]);
    });

    it('never plans a separate form page or a CMS detail page', () => {
        const roles = plannedScaffoldRoutes(all).map((route) => route.role as string);

        expect(roles).not.toContain('form');
        expect(roles).not.toContain('cms_detail');
    });

    it('uses the route parameter of the detail page', () => {
        const detail = plannedScaffoldRoutes({ ...all, recordIdParam: 'member_id' }).find((route) => route.role === 'public_detail');

        expect(detail?.pattern).toBe('/team/{member_id}');
    });

    it('describes the CMS list by what it can do', () => {
        const withForm = plannedScaffoldRoutes(all).find((route) => route.role === 'cms_list');
        const overTable = plannedScaffoldRoutes({ ...all, createForm: false }).find((route) => route.role === 'cms_list');

        expect(withForm?.description).toMatch(/add, edit, delete and restore/);
        expect(overTable?.description).toMatch(/view and delete/);
        expect(overTable?.description).not.toMatch(/add|edit|restore/);
    });

    it('leaves out the surface that is switched off', () => {
        expect(plannedScaffoldRoutes({ ...all, createPublic: false }).map((route) => route.role)).toEqual(['cms_list']);
        expect(plannedScaffoldRoutes({ ...all, createAdmin: false, createForm: false }).map((route) => route.role)).toEqual([
            'public_list',
            'public_detail',
        ]);
    });

    it('plans nothing without a base name', () => {
        expect(plannedScaffoldRoutes({ ...all, base: '   ' })).toEqual([]);
    });
});

describe('scaffoldFormNeedsCmsList', () => {
    it('refuses a new form without the CMS list that holds it', () => {
        expect(scaffoldFormNeedsCmsList({ createForm: true, createAdmin: false })).toBe(true);
    });

    it('accepts every other combination', () => {
        expect(scaffoldFormNeedsCmsList({ createForm: true, createAdmin: true })).toBe(false);
        expect(scaffoldFormNeedsCmsList({ createForm: false, createAdmin: false })).toBe(false);
        expect(scaffoldFormNeedsCmsList({ createForm: false, createAdmin: true })).toBe(false);
    });
});
