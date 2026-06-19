/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { afterEach, describe, expect, it } from 'vitest';
import { type IStyle, type IStyleGroup } from '../../../../../../../types/responses/admin/styles.types';
import {
    extendStyleRegistry,
    _resetPluginStyleRegistry,
    type IStyleRegistryEntry,
    type TStylePlatform,
} from '@selfhelp/shared/registry';
import { filterStyleGroupsForAdd } from '../addSectionModal.utils';

/** Build a minimal catalog style. Render target is resolved from the registry
 *  by name unless an explicit `renderTarget` is provided. The milestone-one
 *  core catalog targets every style at `both`, so single-platform behaviour is
 *  asserted with explicit render targets (exactly how the backend catalog marks
 *  a `web`/`mobile` style). */
function makeStyle(name: string, renderTarget?: TStylePlatform): IStyle {
    return {
        id: name.length,
        name,
        description: `${name} description`,
        typeId: 1,
        type: 'component',
        renderTarget,
        relationships: { allowedChildren: [], allowedParents: [] },
    };
}

function group(styles: IStyle[]): IStyleGroup {
    return { id: 1, name: 'Group', description: null, position: 0, styles };
}

const names = (groups: IStyleGroup[]): string[] =>
    groups.flatMap((g) => g.styles.map((s) => s.name));

const allowAll = (): boolean => true;

describe('filterStyleGroupsForAdd', () => {
    afterEach(() => {
        _resetPluginStyleRegistry();
    });

    const catalog = [
        group([
            makeStyle('container'), // registry: both
            makeStyle('qa-mobile-widget', 'mobile'), // explicit mobile-only
            makeStyle('login'), // registry: both
            makeStyle('qa-web-widget', 'web'), // explicit web-only
        ]),
    ];

    it('web page shows web + both styles, hides mobile-only styles', () => {
        const result = filterStyleGroupsForAdd({
            styleGroups: catalog,
            isRoot: true,
            pagePlatform: 'web',
            platformFilter: 'all',
            searchQuery: '',
            isStyleAllowedAsChild: allowAll,
        });
        const got = names(result);
        expect(got).toContain('container');
        expect(got).toContain('login');
        expect(got).toContain('qa-web-widget');
        // mobile-only style must NOT appear on a web page
        expect(got).not.toContain('qa-mobile-widget');
    });

    it('mobile page shows mobile + both styles, hides web-only', () => {
        const result = filterStyleGroupsForAdd({
            styleGroups: catalog,
            isRoot: true,
            pagePlatform: 'mobile',
            platformFilter: 'all',
            searchQuery: '',
            isStyleAllowedAsChild: allowAll,
        });
        const got = names(result);
        expect(got).toContain('container');
        expect(got).toContain('qa-mobile-widget');
        expect(got).not.toContain('qa-web-widget');
    });

    it('both page shows all compatible styles', () => {
        const result = filterStyleGroupsForAdd({
            styleGroups: catalog,
            isRoot: true,
            pagePlatform: 'both',
            platformFilter: 'all',
            searchQuery: '',
            isStyleAllowedAsChild: allowAll,
        });
        const got = names(result);
        expect(got).toEqual(
            expect.arrayContaining(['container', 'qa-mobile-widget', 'login', 'qa-web-widget']),
        );
    });

    it('placement: a root-only style is hidden inside a container (not root)', () => {
        const rootOnly: IStyleRegistryEntry = {
            description: 'QA root-only style',
            category: 'plugin',
            frontendOnly: true,
            canHaveChildren: false,
            placement: 'rootOnly',
        };
        extendStyleRegistry({ 'qa-overlay': rootOnly }, { pluginId: 'qa-shp-addsection' });

        const result = filterStyleGroupsForAdd({
            styleGroups: [group([makeStyle('qa-overlay', 'both'), makeStyle('container')])],
            isRoot: false, // adding as a child
            pagePlatform: 'both',
            platformFilter: 'all',
            searchQuery: '',
            isStyleAllowedAsChild: allowAll,
        });
        const got = names(result);
        // rootOnly style hidden as a child
        expect(got).not.toContain('qa-overlay');
        expect(got).toContain('container');
    });

    it('manual platform filter narrows further (mobile filter on both page)', () => {
        const result = filterStyleGroupsForAdd({
            styleGroups: catalog,
            isRoot: true,
            pagePlatform: 'both',
            platformFilter: 'mobile',
            searchQuery: '',
            isStyleAllowedAsChild: allowAll,
        });
        const got = names(result);
        expect(got).toContain('qa-mobile-widget');
        expect(got).toContain('container'); // both supports mobile
        expect(got).not.toContain('qa-web-widget'); // web-only filtered out
    });

    it('search filters by name/description', () => {
        const result = filterStyleGroupsForAdd({
            styleGroups: catalog,
            isRoot: true,
            pagePlatform: 'both',
            platformFilter: 'all',
            searchQuery: 'qa-mobile',
            isStyleAllowedAsChild: allowAll,
        });
        expect(names(result)).toEqual(['qa-mobile-widget']);
    });

    it('parent/child relationship predicate still excludes disallowed children', () => {
        const result = filterStyleGroupsForAdd({
            styleGroups: catalog,
            isRoot: false,
            pagePlatform: 'both',
            platformFilter: 'all',
            searchQuery: '',
            isStyleAllowedAsChild: (style) => style.name === 'login',
        });
        expect(names(result)).toEqual(['login']);
    });

    it('drops groups that become empty after filtering', () => {
        const result = filterStyleGroupsForAdd({
            styleGroups: [group([makeStyle('qa-mobile-widget', 'mobile')])],
            isRoot: true,
            pagePlatform: 'web', // mobile-only not allowed -> group empty
            platformFilter: 'all',
            searchQuery: '',
            isStyleAllowedAsChild: allowAll,
        });
        expect(result).toHaveLength(0);
    });
});
