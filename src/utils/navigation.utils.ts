/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
/**
 * Shared navigation transforms for the page tree (profile links, SSR helpers).
 */
import { transformPageData } from '../api/navigation.api';
import { type IPageItem } from '../shared';

export function transformNavigationPages(rawPages: Parameters<typeof transformPageData>[0][]): IPageItem[] {
    if (!Array.isArray(rawPages)) return [];
    return rawPages.map(transformPageData);
}

/**
 * Profile dropdown pages (`profile-link` system tree).
 */
export function selectProfilePages(pages: IPageItem[]): IPageItem[] {
    return pages
        .filter((page) => page.is_system === true && page.keyword === 'profile-link')
        .sort((a, b) => a.keyword.localeCompare(b.keyword));
}

export interface IPageTitleSource {
    keyword: string;
    title?: string | null;
}

export function getPageTitle(page: IPageTitleSource): string {
    if (page.title && page.title.trim()) {
        return page.title;
    }
    return (
        page.keyword.charAt(0).toUpperCase() +
        page.keyword.slice(1).replace(/_/g, ' ').replace(/-/g, ' ')
    );
}
