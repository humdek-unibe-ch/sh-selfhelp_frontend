/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
/**
 * Searchable metadata for the page inspector's fixed property groups and
 * dynamic fields. Used by PageInspector to filter Content / Properties /
 * Routes / Configuration without changing field values.
 */

import type { IPageField } from '../../../../../types/common/pages.type';
import {
    matchesFieldQuery,
    type ISearchableField,
} from '../../shared/inspector-search';

export type TPagePropertyGroupId =
    | 'basic'
    | 'access'
    | 'navigation'
    | 'settings'
    | 'additional'
    | 'hints';

/** Fixed property panels with their visible labels and help text. */
export const PAGE_PROPERTY_GROUP_META: Record<
    TPagePropertyGroupId,
    ISearchableField
> = {
    basic: {
        id: 'basic',
        label: 'Basic Information',
        keywords: [
            'Keyword',
            'URL',
            'Unique identifier for the page',
            'web address path',
        ],
    },
    access: {
        id: 'access',
        label: 'Page Access Type',
        keywords: [
            'Controls who can access this page',
            'web only',
            'mobile only',
            'both platforms',
            'access',
        ],
    },
    navigation: {
        id: 'navigation',
        label: 'Navigation membership',
        keywords: [
            'Web header',
            'Web footer',
            'Mobile drawer',
            'Mobile tabs',
            'menu',
            'Add to menu',
        ],
    },
    settings: {
        id: 'settings',
        label: 'Page Settings',
        keywords: [
            'Surface',
            'Public website',
            'CMS application',
            'Headless Page',
            'Open Access',
            'special page behaviors',
        ],
    },
    additional: {
        id: 'additional',
        label: 'Additional Properties',
        keywords: ['Additional configuration fields'],
    },
    hints: {
        id: 'hints',
        label: 'Navigation hints',
        keywords: [
            'child pages',
            'Menu placement',
            'Navigation builder',
        ],
    },
};

export const PAGE_ROUTES_META: ISearchableField = {
    id: 'routes',
    label: 'Routes',
    keywords: ['public URLs', 'parameterized', 'route'],
};

export function pageFieldToSearchable(field: IPageField): ISearchableField {
    return {
        id: `field-${field.id}`,
        label: field.title,
        name: field.name,
        help: field.help,
    };
}

export function matchesPagePropertyGroup(
    groupId: TPagePropertyGroupId,
    query: string,
    additionalFields: IPageField[] = [],
): boolean {
    if (!query.trim()) {
        return true;
    }
    if (matchesFieldQuery(PAGE_PROPERTY_GROUP_META[groupId], query)) {
        return true;
    }
    if (groupId === 'additional') {
        return additionalFields.some((field) =>
            matchesFieldQuery(pageFieldToSearchable(field), query),
        );
    }
    return false;
}

export function collectPageSearchableFields(options: {
    contentFields: IPageField[];
    propertyFields: IPageField[];
    includeProperties: boolean;
    includeRoutes: boolean;
    includeConfiguration: boolean;
}): ISearchableField[] {
    const items: ISearchableField[] = options.contentFields.map(pageFieldToSearchable);

    if (options.includeProperties) {
        (Object.keys(PAGE_PROPERTY_GROUP_META) as TPagePropertyGroupId[]).forEach((id) => {
            items.push(PAGE_PROPERTY_GROUP_META[id]);
        });
        options.propertyFields.forEach((field) => items.push(pageFieldToSearchable(field)));
        if (options.includeRoutes) {
            items.push(PAGE_ROUTES_META);
        }
    }

    if (options.includeConfiguration) {
        options.propertyFields.forEach((field) => items.push(pageFieldToSearchable(field)));
    }

    return items;
}
