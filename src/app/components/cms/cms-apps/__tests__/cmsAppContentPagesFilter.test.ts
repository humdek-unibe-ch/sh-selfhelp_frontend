/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { describe, expect, it } from 'vitest';
import type { IAdminPage } from '../../../../../types/responses/admin/admin.types';
import {
    groupRootPagesByCmsApp,
    isCmsSurfaceAdminPage,
    isContentPagesCandidate,
    resolveButtonHref,
    shouldShowCmsAppPageGroups,
} from '../cmsAppPages.utils';

function makePage(partial: Partial<IAdminPage> & Pick<IAdminPage, 'id_pages' | 'keyword'>): IAdminPage {
    return {
        url: `/${partial.keyword}`,
        id_parent_page: null,
        is_headless: false,
        is_open_access: true,
        id_page_access_types: 1,
        id_page_types: 1,
        is_system: false,
        crud: 0,
        cms_app_id: null,
        ...partial,
    };
}

describe('groupRootPagesByCmsApp', () => {
    it('groups root pages by cms_app_id with ungrouped public website bucket', () => {
        const pages = [
            makePage({ id_pages: 1, keyword: 'home' }),
            makePage({
                id_pages: 2,
                keyword: 'team-public',
                cms_app_id: 9,
                cms_app_role: 'public_list',
            }),
            makePage({
                id_pages: 3,
                keyword: 'team-detail',
                cms_app_id: 9,
                cms_app_role: 'public_detail',
            }),
            makePage({ id_pages: 4, keyword: 'about' }),
        ];
        const appNames = new Map<number, string>([[9, 'Team members']]);

        const groups = groupRootPagesByCmsApp(pages, appNames);

        expect(groups).toHaveLength(2);
        expect(groups[0]).toMatchObject({
            appId: null,
            label: 'Public website',
            pages: [expect.objectContaining({ keyword: 'home' }), expect.objectContaining({ keyword: 'about' })],
        });
        expect(groups[1]).toMatchObject({
            appId: 9,
            label: 'Team members',
            pages: [
                expect.objectContaining({ keyword: 'team-public' }),
                expect.objectContaining({ keyword: 'team-detail' }),
            ],
        });
        expect(shouldShowCmsAppPageGroups(groups)).toBe(true);
    });

    it('keeps a flat list when no page carries cms_app_id', () => {
        const pages = [makePage({ id_pages: 1, keyword: 'home' })];
        const groups = groupRootPagesByCmsApp(pages, new Map());

        expect(groups).toHaveLength(1);
        expect(groups[0].appId).toBeNull();
        expect(shouldShowCmsAppPageGroups(groups)).toBe(false);
    });
});

describe('CMS app Content Pages filtering', () => {
    it('drops cms-surface admin pages but keeps public CMS-app pages', () => {
        const pages = [
            makePage({ id_pages: 1, keyword: 'home' }),
            makePage({
                id_pages: 2,
                keyword: 'cms-team',
                cms_app_id: 9,
                cms_app_role: 'cms_list',
                page_surface: 'cms',
            }),
            makePage({
                id_pages: 3,
                keyword: 'team-public',
                cms_app_id: 9,
                cms_app_role: 'public_list',
                page_surface: 'public',
            }),
            makePage({
                id_pages: 4,
                keyword: 'cms-team-form',
                cms_app_id: 9,
                cms_app_role: 'form',
                page_surface: 'cms',
            }),
        ];

        const content = pages.filter(isContentPagesCandidate);
        expect(content.map((p) => p.keyword)).toEqual(['home', 'team-public']);
    });

    it('treats page_surface=cms as admin surface even without role', () => {
        expect(
            isCmsSurfaceAdminPage(makePage({ id_pages: 1, keyword: 'x', page_surface: 'cms' })),
        ).toBe(true);
    });
});

describe('resolveButtonHref', () => {
    it('ignores empty and # page_keyword so url wins', () => {
        expect(resolveButtonHref('#', '/team-members')).toBe('/team-members');
        expect(resolveButtonHref('', '/team-members')).toBe('/team-members');
        expect(resolveButtonHref(null, '/team-members')).toBe('/team-members');
    });

    it('prefers a real page_keyword over url', () => {
        expect(resolveButtonHref('home', '/elsewhere')).toBe('home');
    });
});
