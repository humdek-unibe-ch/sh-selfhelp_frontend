/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { describe, it, expect } from 'vitest';
import {
    matchesPagePropertyGroup,
    collectPageSearchableFields,
    pageFieldToSearchable,
} from '../pageInspectorSearch';
import { matchesFieldQuery, countMatchingFields } from '../../../shared/inspector-search';
import type { IPageField } from '../../../../../../types/common/pages.type';

function field(partial: Partial<IPageField> & Pick<IPageField, 'id' | 'name'>): IPageField {
    return {
        title: null,
        type: 'text',
        default_value: null,
        help: '',
        display: false,
        translations: [],
        ...partial,
    };
}

describe('pageInspectorSearch', () => {
    it('matches the URL basic-info group on "url"', () => {
        expect(matchesPagePropertyGroup('basic', 'url')).toBe(true);
        expect(matchesPagePropertyGroup('basic', 'keyword')).toBe(true);
        expect(matchesPagePropertyGroup('access', 'url')).toBe(false);
        expect(matchesPagePropertyGroup('access', 'access')).toBe(true);
    });

    it('counts content + property matches and hides empty groups via helpers', () => {
        const contentFields = [
            field({ id: 1, name: 'title', title: 'Title', display: true, help: 'Page title' }),
            field({ id: 2, name: 'body', title: 'Body', display: true }),
        ];
        const propertyFields = [
            field({ id: 3, name: 'search_visibility', title: 'Search visibility', help: 'Show in search' }),
        ];

        const catalog = collectPageSearchableFields({
            contentFields,
            propertyFields,
            includeProperties: true,
            includeRoutes: true,
            includeConfiguration: false,
        });

        expect(countMatchingFields(catalog, 'url')).toBeGreaterThan(0);
        expect(countMatchingFields(catalog, 'zzz')).toBe(0);

        const urlMatches = contentFields.filter((f) =>
            matchesFieldQuery(pageFieldToSearchable(f), 'url'),
        );
        expect(urlMatches).toHaveLength(0);
        expect(matchesPagePropertyGroup('basic', 'url')).toBe(true);
    });
});
