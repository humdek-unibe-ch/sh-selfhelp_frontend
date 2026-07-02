/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { describe, it, expect } from 'vitest';
import {
    NAVIGATION_TAB_VALUES,
    isNavigationTab,
    navigationTabFromSearchParam,
} from '../navigation-builder.constants';

describe('navigation-builder.constants export/import tab', () => {
    it('includes export_import in navigation tabs', () => {
        expect(NAVIGATION_TAB_VALUES).toContain('export_import');
        expect(isNavigationTab('export_import')).toBe(true);
        expect(navigationTabFromSearchParam('export_import')).toBe('export_import');
    });
});
