/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { describe, it, expect } from 'vitest';
import type { INavigationBundle } from '../../../../../types/requests/admin/navigation-export-import.types';
import {
    countBundleMenuItems,
    hasReplaceMenuPolicy,
    isNavigationBundle,
    summarizeNavigationImportPreview,
} from '../navigation-export-import.utils';

const sampleBundle: INavigationBundle = {
    format: 'selfhelp/navigation-bundle',
    version: '2.0',
    menus: {
        web_header: {
            items: [
                { ref: 'a', parent_ref: null, item_type: 'page', position: 10, page_keyword: 'demo-home' },
                { ref: 'b', parent_ref: null, item_type: 'page', position: 20, page_keyword: 'demo-about' },
            ],
        },
        mobile_drawer: {
            items: [
                { ref: 'c', parent_ref: null, item_type: 'page', position: 10, page_keyword: 'demo-home' },
            ],
        },
    },
    pages: [{ keyword: 'demo-home' }],
};

describe('navigation-export-import.utils', () => {
    it('detects strict v2.0 navigation bundles only', () => {
        expect(isNavigationBundle(sampleBundle)).toBe(true);
        expect(isNavigationBundle({ pages: [] })).toBe(false);
        expect(isNavigationBundle({ ...sampleBundle, version: '1.0' })).toBe(false);
        expect(isNavigationBundle({ ...sampleBundle, format: 'other' })).toBe(false);
    });

    it('counts menu items across menus', () => {
        expect(countBundleMenuItems(sampleBundle)).toBe(3);
    });

    it('summarizes validation issues for preview', () => {
        const summary = summarizeNavigationImportPreview(sampleBundle, [
            { level: 'error', code: 'missing_page', message: 'Page missing', menu_key: 'web_header' },
            { level: 'warning', code: 'version_mismatch', message: 'Version', menu_key: null },
        ]);
        expect(summary.menusAffected).toEqual(['web_header', 'mobile_drawer']);
        expect(summary.itemsInBundle).toBe(3);
        expect(summary.pagesIncluded).toBe(1);
        expect(summary.errors).toHaveLength(1);
        expect(summary.warnings).toHaveLength(1);
        expect(summary.missingPages).toHaveLength(1);
    });

    it('detects replace menu policies', () => {
        expect(hasReplaceMenuPolicy({ web_header: 'merge' })).toBe(false);
        expect(hasReplaceMenuPolicy({ web_footer: 'replace' })).toBe(true);
    });
});
