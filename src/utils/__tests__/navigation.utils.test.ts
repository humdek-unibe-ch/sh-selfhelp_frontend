/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { describe, it, expect } from 'vitest';
import { selectProfilePages } from '../navigation.utils';
import type { IPageItem } from '../../shared';

function page(partial: Partial<IPageItem>): IPageItem {
    return {
        id: 0,
        keyword: 'k',
        url: null,
        parent_page_id: null,
        is_headless: false,
        ...partial,
    };
}

describe('selectProfilePages', () => {
    it('returns profile-link system pages', () => {
        const result = selectProfilePages([
            page({ keyword: 'home', is_system: false }),
            page({ keyword: 'profile-link', is_system: true, title: 'Profil' }),
        ]);
        expect(result).toHaveLength(1);
        expect(result[0].keyword).toBe('profile-link');
    });
});
