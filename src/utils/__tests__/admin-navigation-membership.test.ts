/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { describe, expect, it } from 'vitest';
import { pageHasMenuMembership } from '../admin-navigation-membership';

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
