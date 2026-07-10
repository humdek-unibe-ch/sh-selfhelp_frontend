/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { describe, expect, it } from 'vitest';
import type { INavigationBranding } from '@selfhelp/shared';
import {
    resolveSingleRowHeaderHeight,
    resolveWebHeaderHeight,
    WEB_DOUBLE_HEADER_HEIGHT,
    WEB_HEADER_MIN_HEIGHT,
} from '../headerLayout.utils';

const branding = (overrides: Partial<INavigationBranding>): INavigationBranding => ({
    logo_url: '',
    logo_alt: 'Test',
    link_url: '/',
    ...overrides,
});

describe('headerLayout.utils', () => {
    it('keeps the medium baseline height for default branding', () => {
        expect(resolveSingleRowHeaderHeight(null)).toBe(WEB_HEADER_MIN_HEIGHT);
    });

    it('grows the header for extra-large logos', () => {
        expect(resolveSingleRowHeaderHeight(branding({ logo_size: 'xl' }))).toBe(72);
    });

    it('uses the double preset height regardless of branding', () => {
        expect(resolveWebHeaderHeight(true, branding({ logo_size: 'xl' }))).toBe(WEB_DOUBLE_HEADER_HEIGHT);
    });

    it('uses single-row height for non-double presets', () => {
        expect(resolveWebHeaderHeight(false, branding({ logo_size: 'lg' }))).toBe(60);
    });
});
