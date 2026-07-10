/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { describe, expect, it } from 'vitest';
import { publicPageHref } from '../public-page-href.utils';
import type { IPageRouteItem } from '../../types/common/pages.type';

function route(partial: Partial<IPageRouteItem> & Pick<IPageRouteItem, 'path_pattern'>): IPageRouteItem {
    return {
        is_canonical: false,
        is_active: true,
        priority: 0,
        ...partial,
    };
}

describe('publicPageHref', () => {
    it('prefers the canonical active route over pages.url and keyword', () => {
        expect(
            publicPageHref('/stale-url', 'demo_hero_home_4hero-home', [
                route({ path_pattern: '/demo-hero-home/hero-home', is_canonical: true }),
                route({ path_pattern: '/old-alias', is_canonical: false }),
            ]),
        ).toBe('/demo-hero-home/hero-home');
    });

    it('falls back to the first active route when no canonical is marked', () => {
        expect(
            publicPageHref(null, 'kw', [
                route({ path_pattern: '/demo-hero-home-4hero-home', is_canonical: false }),
            ]),
        ).toBe('/demo-hero-home-4hero-home');
    });

    it('prefers pages.url over the keyword when routes are missing', () => {
        expect(publicPageHref('/demo-hero-home-4hero-home', 'demo_hero_home_4hero-home')).toBe(
            '/demo-hero-home-4hero-home',
        );
    });

    it('adds a leading slash when the stored url is relative without one', () => {
        expect(publicPageHref('demo-hero-home/hero-home', 'demo_hero_home_hero-home')).toBe(
            '/demo-hero-home/hero-home',
        );
    });

    it('falls back to keyword only when url and routes are missing', () => {
        expect(publicPageHref(null, 'home')).toBe('/home');
        expect(publicPageHref('', 'login')).toBe('/login');
        expect(publicPageHref('  ', '/login')).toBe('/login');
    });

    it('returns root when neither url nor keyword is usable', () => {
        expect(publicPageHref(null, null)).toBe('/');
        expect(publicPageHref('', '')).toBe('/');
    });
});
