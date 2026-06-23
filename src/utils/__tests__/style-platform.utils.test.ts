/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
/**
 * Unit coverage for the add-section picker's platform predicate.
 *
 * The picker filters styles by `page platform ∩ style platform ∩ manual filter`
 * (parent/child is orthogonal, covered by style-relationship.utils). These
 * tests pin the platform half: a web page hides mobile-only styles, a mobile
 * page hides web-only styles, and a `both` page shows everything. Render target
 * is resolved from the shared registry, with an explicit catalog `renderTarget`
 * taking precedence. Every milestone-one *core* style targets `both`, so
 * single-target registry resolution is asserted with a registered (plugin)
 * mobile-only style — exactly how a plugin mobile-only style behaves at runtime.
 */
import { afterAll, beforeAll, describe, it, expect } from 'vitest';
import {
    extendStyleRegistry,
    _resetPluginStyleRegistry,
    type IStyleRegistryEntry,
    type TStylePlatform,
} from '@selfhelp/shared/registry';
import {
    getStylePlatform,
    getStylePlatformByName,
    isStyleOnPagePlatform,
    isStyleOnPlatform,
    toPagePlatform,
} from '../style-platform.utils';
import type { IStyle } from '../../types/responses/admin/styles.types';

const MOBILE_ONLY: IStyleRegistryEntry = {
    description: 'QA mobile-only plugin style',
    category: 'plugin',
    canHaveChildren: false,
    platforms: ['mobile'],
};

function makeStyle(name: string, renderTarget?: TStylePlatform): IStyle {
    return {
        id: 1,
        name,
        description: null,
        typeId: 1,
        type: 'component',
        renderTarget,
        relationships: { allowedChildren: [], allowedParents: [] },
    };
}

beforeAll(() => {
    extendStyleRegistry({ 'qa-mobile-only': MOBILE_ONLY }, { pluginId: 'qa-shp-platform-utils' });
});
afterAll(() => {
    _resetPluginStyleRegistry();
});

describe('getStylePlatform / getStylePlatformByName', () => {
    it('prefers the explicit catalog platform', () => {
        expect(getStylePlatform(makeStyle('button', 'mobile'))).toBe('mobile');
    });

    it('falls back to the shared registry by style name', () => {
        expect(getStylePlatform(makeStyle('qa-mobile-only'))).toBe('mobile');
        expect(getStylePlatform(makeStyle('button'))).toBe('both');
    });

    it('resolves platform by name for the inspector', () => {
        expect(getStylePlatformByName('qa-mobile-only')).toBe('mobile');
        expect(getStylePlatformByName('button')).toBe('both');
    });
});

describe('toPagePlatform', () => {
    it('passes valid platform codes through', () => {
        expect(toPagePlatform('web')).toBe('web');
        expect(toPagePlatform('mobile')).toBe('mobile');
        expect(toPagePlatform('both')).toBe('both');
    });

    it('defaults unknown / null / undefined to both', () => {
        expect(toPagePlatform(null)).toBe('both');
        expect(toPagePlatform(undefined)).toBe('both');
        expect(toPagePlatform('garbage')).toBe('both');
    });
});

describe('isStyleOnPagePlatform', () => {
    const mobileOnly = makeStyle('m', 'mobile');
    const webOnly = makeStyle('web-widget', 'web');
    const both = makeStyle('button', 'both');

    it('a both page shows web, mobile and both styles', () => {
        for (const s of [mobileOnly, webOnly, both]) {
            expect(isStyleOnPagePlatform(s, 'both')).toBe(true);
        }
    });

    it('a web page shows web + both and hides mobile-only styles', () => {
        expect(isStyleOnPagePlatform(webOnly, 'web')).toBe(true);
        expect(isStyleOnPagePlatform(both, 'web')).toBe(true);
        expect(isStyleOnPagePlatform(mobileOnly, 'web')).toBe(false);
    });

    it('a mobile page shows mobile + both and hides web-only styles', () => {
        expect(isStyleOnPagePlatform(mobileOnly, 'mobile')).toBe(true);
        expect(isStyleOnPagePlatform(both, 'mobile')).toBe(true);
        expect(isStyleOnPagePlatform(webOnly, 'mobile')).toBe(false);
    });

    it('resolves platform from the registry when no explicit catalog platform', () => {
        // qa-mobile-only is registered mobile-only in the shared registry.
        expect(isStyleOnPagePlatform(makeStyle('qa-mobile-only'), 'web')).toBe(false);
        expect(isStyleOnPagePlatform(makeStyle('qa-mobile-only'), 'mobile')).toBe(true);
    });
});

describe('isStyleOnPlatform (manual All/Web/Mobile filter)', () => {
    it('web filter shows web + both, hides mobile-only', () => {
        expect(isStyleOnPlatform(makeStyle('w', 'web'), 'web')).toBe(true);
        expect(isStyleOnPlatform(makeStyle('b', 'both'), 'web')).toBe(true);
        expect(isStyleOnPlatform(makeStyle('m', 'mobile'), 'web')).toBe(false);
    });

    it('mobile filter shows mobile + both, hides web-only', () => {
        expect(isStyleOnPlatform(makeStyle('m', 'mobile'), 'mobile')).toBe(true);
        expect(isStyleOnPlatform(makeStyle('b', 'both'), 'mobile')).toBe(true);
        expect(isStyleOnPlatform(makeStyle('w', 'web'), 'mobile')).toBe(false);
    });
});
