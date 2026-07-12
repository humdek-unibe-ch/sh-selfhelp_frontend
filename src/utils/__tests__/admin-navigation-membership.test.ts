/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { describe, expect, it } from 'vitest';
import { buildMenuPreviewSectionLinks, pageHasMenuMembership } from '../admin-navigation-membership';

describe('buildMenuPreviewSectionLinks', () => {
    it('returns preview links when the menu tree is non-empty', () => {
        const links = buildMenuPreviewSectionLinks([
            { label: 'Home', link: '/admin/pages/home', id: 1 },
        ], 'web_header');

        expect(links).toHaveLength(1);
        expect(links[0]?.label).toBe('Home');
    });

    it('returns a menu-builder link when the preview tree is empty', () => {
        const links = buildMenuPreviewSectionLinks([], 'web_footer');

        expect(links).toHaveLength(1);
        expect(links[0]?.label).toContain('menu builder');
        expect(links[0]?.link).toBe('/admin/navigation?menu=web_footer');
    });
});

describe('pageHasMenuMembership', () => {
    it('detects membership badges from the admin API', () => {
        expect(pageHasMenuMembership([
            { menu_key: 'mobile_drawer', menu_item_id: 3, explicit: true },
        ], 'mobile_drawer')).toBe(true);
        expect(pageHasMenuMembership([
            { menu_key: 'mobile_drawer', menu_item_id: 3, explicit: true },
        ], 'web_header')).toBe(false);
    });
});
