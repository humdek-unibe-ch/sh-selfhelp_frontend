/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import type { IAdminNavigationMenuItem, TPublicVisibilityReason } from '../../../../api/admin/navigation.api';
import type { IAdminPage } from '../../../../types/responses/admin/admin.types';
import { isMobileMenuKey, type TMenuKey } from './navigation-builder.constants';

export interface INavigationItemDisplay {
    primary: string;
    secondary?: string;
}

/** Normalize a CMS page route for display (avoids `//keyword` when url already starts with `/`). */
export function formatPageRoutePath(url: string | null | undefined, keyword?: string): string | undefined {
    const raw = (url ?? keyword ?? '').trim();
    if (raw === '') {
        return undefined;
    }
    if (raw.startsWith('http://') || raw.startsWith('https://')) {
        return raw;
    }
    return raw.startsWith('/') ? raw : `/${raw}`;
}

export function nestStoredMenuItems(
    items: IAdminNavigationMenuItem[],
): Array<IAdminNavigationMenuItem & { depth: number; orphaned?: boolean }> {
    const itemIds = new Set(items.map((item) => item.id));
    const byParent = new Map<number | 'root', IAdminNavigationMenuItem[]>();

    for (const item of items) {
        const parentId = item.parent_item_id;
        const parentKey = parentId === null || !itemIds.has(parentId) ? 'root' : parentId;
        const bucket = byParent.get(parentKey) ?? [];
        bucket.push(item);
        byParent.set(parentKey, bucket);
    }

    const output: Array<IAdminNavigationMenuItem & { depth: number; orphaned?: boolean }> = [];
    const walk = (parentKey: number | 'root', depth: number): void => {
        const siblings = (byParent.get(parentKey) ?? []).sort((a, b) => a.position - b.position);
        for (const sibling of siblings) {
            const orphaned = sibling.parent_item_id !== null
                && !itemIds.has(sibling.parent_item_id);
            output.push({ ...sibling, depth, ...(orphaned ? { orphaned: true } : {}) });
            walk(sibling.id, depth + 1);
        }
    };
    walk('root', 0);

    return output;
}

export function flattenPreviewItems(
    items: Array<Record<string, unknown>>,
    depth = 0,
): Array<Record<string, unknown> & { depth: number }> {
    const rows: Array<Record<string, unknown> & { depth: number }> = [];
    for (const item of items) {
        rows.push({ ...item, depth });
        const children = item.children;
        if (Array.isArray(children)) {
            rows.push(...flattenPreviewItems(children as Array<Record<string, unknown>>, depth + 1));
        }
    }
    return rows;
}

export function buildPageLookup(pages: IAdminPage[] | undefined): Map<number, IAdminPage> {
    const lookup = new Map<number, IAdminPage>();
    for (const page of pages ?? []) {
        lookup.set(page.id_pages, page);
    }
    return lookup;
}

/**
 * Human title for a page in the given admin UI language, falling back to the
 * default-language `title` the backend attaches to the admin pages list.
 */
export function pageDisplayTitle(page: IAdminPage, languageId?: number | null): string | null {
    if (languageId != null) {
        const match = page.titles?.find((entry) => entry.language_id === languageId)?.title;
        if (match && match.trim() !== '') {
            return match;
        }
    }
    const fallback = page.title ?? null;
    return fallback && fallback.trim() !== '' ? fallback : null;
}

export function getDirectCmsChildPages(pages: IAdminPage[], parentPageId: number): IAdminPage[] {
    return pages
        .filter((page) => page.id_parent_page === parentPageId)
        .sort((a, b) => a.id_pages - b.id_pages);
}

export function buildResolvedLabelByItemId(
    previewItems: Array<Record<string, unknown> & { depth: number }>,
): Map<number, string> {
    const labels = new Map<number, string>();
    for (const row of previewItems) {
        if (typeof row.id !== 'number') {
            continue;
        }
        const label = String(
            row.label
            ?? (row.page && typeof row.page === 'object'
                ? ((row.page as { title?: string | null; keyword?: string }).title
                    || (row.page as { keyword?: string }).keyword
                    || '')
                : ''),
        ).trim();
        if (label !== '') {
            labels.set(row.id, label);
        }
    }
    return labels;
}

export interface IPresetGap {
    /** Chip text, e.g. "No description". */
    label: string;
    /** Tooltip explaining what the active preset does with it. */
    reason: string;
}

/**
 * Ways this item under-delivers for the active header preset — the fields the
 * preset renders but the item leaves empty, so a preset switch looks like a
 * no-op. Empty array when the item gives the preset everything it can use.
 */
export function getPresetGaps(
    item: IAdminNavigationMenuItem,
    preset: string,
    childCount: number,
    languageId?: number | null,
): IPresetGap[] {
    if (item.item_type !== 'page' && item.item_type !== 'group') {
        return [];
    }

    const isRoot = item.parent_item_id === null;
    const gaps: IPresetGap[] = [];

    // Panel presets only differ from `simple` on root items that open a panel.
    if (isRoot && childCount === 0 && (preset === 'dropdown' || preset === 'mega-menu'
        || preset === 'double-dropdown' || preset === 'double-mega-menu')) {
        gaps.push({
            label: 'No children',
            reason: 'This item opens no panel, so it renders exactly as it would in the Simple preset. Nest pages under it to see the dropdown or mega menu.',
        });
    }

    // Mega cells are icon tile + label + description; without either they
    // collapse to a dot and a label, which reads like a plain dropdown row.
    if (!isRoot && (preset === 'mega-menu' || preset === 'double-mega-menu')) {
        if (!item.icon) {
            gaps.push({
                label: 'No icon',
                reason: 'The mega menu shows an icon tile for each entry. Without one it falls back to a plain dot.',
            });
        }
        if (!hasItemDescription(item, languageId)) {
            gaps.push({
                label: 'No description',
                reason: 'The mega menu shows a description under each entry. Without one the cell is just a label, which looks like a normal dropdown row.',
            });
        }
    }

    // Dropdown rows show the description too, but only as a bonus line.
    if (!isRoot && (preset === 'dropdown' || preset === 'double-dropdown')
        && !hasItemDescription(item, languageId)) {
        gaps.push({
            label: 'No description',
            reason: 'Dropdown rows show a description under the label when one is set.',
        });
    }

    return gaps;
}

/** True when the item has a non-empty description in any language. */
function hasItemDescription(item: IAdminNavigationMenuItem, languageId?: number | null): boolean {
    const rows = item.translations ?? [];
    const scoped = languageId != null
        ? rows.filter((row) => row.language_id === languageId)
        : rows;
    return scoped.some((row) => (row.description ?? '').trim() !== '');
}

/** Builder wording for each backend public-visibility reason code. */
const PUBLIC_EXCLUSION_MESSAGES: Record<TPublicVisibilityReason, string> = {
    headless: 'This page is headless, so the public menu never renders it.',
    page_type_excluded: 'Only core and experiment pages appear in the public menu.',
    page_not_accessible: 'The public menu cannot reach this page — it is restricted or excluded by page type.',
};

/**
 * Why the public menu will drop this item, or `null` when it renders (or when
 * the backend sends no verdict — absent is not the same as excluded).
 */
export function getPublicMenuExclusionReason(
    item: IAdminNavigationMenuItem,
): string | null {
    const visibility = item.public_visibility;
    if (!visibility || visibility.rendered || !visibility.reason) {
        return null;
    }

    return PUBLIC_EXCLUSION_MESSAGES[visibility.reason] ?? null;
}

export function getMenuItemDisplay(
    item: IAdminNavigationMenuItem,
    pageById: Map<number, IAdminPage>,
    resolvedLabelByItemId: Map<number, string>,
): INavigationItemDisplay {
    if (item.item_type === 'page' && item.page_id) {
        const page = pageById.get(item.page_id);
        const resolved = resolvedLabelByItemId.get(item.id);
        return {
            primary: resolved ?? (page ? pageDisplayTitle(page) ?? page.keyword : `Page #${item.page_id}`),
            secondary: page ? formatPageRoutePath(page.url, page.keyword) : undefined,
        };
    }

    if (item.item_type === 'external_url' && item.external_url) {
        return {
            primary: item.label ?? resolvedLabelByItemId.get(item.id) ?? item.external_url,
            secondary: 'External link',
        };
    }

    if (item.item_type === 'group') {
        return {
            primary: resolvedLabelByItemId.get(item.id) ?? 'Group heading',
            secondary: 'Section label',
        };
    }

    return {
        primary: resolvedLabelByItemId.get(item.id) ?? `Item #${item.id}`,
        secondary: item.item_type,
    };
}

export function getPageKeyword(pageById: Map<number, IAdminPage>, pageId: number): string {
    return pageById.get(pageId)?.keyword ?? `Page #${pageId}`;
}

export function getPageEditorPath(pageById: Map<number, IAdminPage>, pageId: number | null): string | null {
    if (pageId === null) {
        return null;
    }
    const keyword = pageById.get(pageId)?.keyword;
    return keyword ? `/admin/pages/${encodeURIComponent(keyword)}` : null;
}

export function menuIconForItem(item: IAdminNavigationMenuItem, menuKey: TMenuKey): string | null {
    if (isMobileMenuKey(menuKey)) {
        return item.mobile_icon;
    }

    return item.icon;
}

export function buildSiblingReorderPayload(
    items: IAdminNavigationMenuItem[],
    draggedId: number,
    targetId: number,
    edge: 'top' | 'bottom',
): Array<{ item_id: number; position: number; parent_item_id?: number | null }> {
    const dragged = items.find((row) => row.id === draggedId);
    const target = items.find((row) => row.id === targetId);
    if (!dragged || !target || draggedId === targetId) {
        return [];
    }

    const siblings = items
        .filter((row) => row.parent_item_id === target.parent_item_id && row.id !== draggedId)
        .sort((a, b) => a.position - b.position);

    const targetIndex = siblings.findIndex((row) => row.id === targetId);
    const insertIndex = edge === 'top' ? Math.max(targetIndex, 0) : Math.max(targetIndex + 1, 0);
    siblings.splice(insertIndex, 0, { ...dragged, parent_item_id: target.parent_item_id });

    return siblings.map((row, index) => ({
        item_id: row.id,
        position: (index + 1) * 10,
        parent_item_id: row.parent_item_id,
    }));
}

export function buildSiblingStepPayload(
    items: IAdminNavigationMenuItem[],
    itemId: number,
    direction: 'up' | 'down',
    sameLayerOnly = false,
): Array<{ item_id: number; position: number; parent_item_id?: number | null }> {
    const item = items.find((row) => row.id === itemId);
    if (!item) {
        return [];
    }

    const siblings = items
        .filter((row) => row.parent_item_id === item.parent_item_id
            // Layer mode: root items step within their own top/main row only.
            && (!sameLayerOnly || item.parent_item_id !== null || (row.layer ?? null) === (item.layer ?? null)))
        .sort((a, b) => a.position - b.position);
    const index = siblings.findIndex((row) => row.id === itemId);
    if (index < 0) {
        return [];
    }

    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= siblings.length) {
        return [];
    }

    const reordered = [...siblings];
    const current = reordered[index];
    const swapWith = reordered[swapIndex];
    reordered[index] = swapWith;
    reordered[swapIndex] = current;

    return reordered.map((row, positionIndex) => ({
        item_id: row.id,
        position: (positionIndex + 1) * 10,
        parent_item_id: row.parent_item_id,
    }));
}

export function isMenuItemDescendant(
    items: IAdminNavigationMenuItem[],
    ancestorId: number,
    candidateId: number,
): boolean {
    let current = items.find((row) => row.id === candidateId);
    while (current?.parent_item_id != null) {
        if (current.parent_item_id === ancestorId) {
            return true;
        }
        current = items.find((row) => row.id === current?.parent_item_id);
    }

    return false;
}

export function buildChildDropPayload(
    items: IAdminNavigationMenuItem[],
    draggedId: number,
    parentItemId: number,
): Array<{ item_id: number; position: number; parent_item_id: number | null }> {
    const dragged = items.find((row) => row.id === draggedId);
    if (!dragged || draggedId === parentItemId) {
        return [];
    }
    if (isMenuItemDescendant(items, draggedId, parentItemId)) {
        return [];
    }

    const updates: Array<{ item_id: number; position: number; parent_item_id: number | null }> = [];
    const oldParentId = dragged.parent_item_id;

    if (oldParentId !== parentItemId) {
        const oldSiblings = items
            .filter((row) => row.parent_item_id === oldParentId && row.id !== draggedId)
            .sort((a, b) => a.position - b.position);
        oldSiblings.forEach((row, index) => {
            updates.push({
                item_id: row.id,
                position: (index + 1) * 10,
                parent_item_id: oldParentId,
            });
        });
    }

    const newSiblings = items
        .filter((row) => row.parent_item_id === parentItemId && row.id !== draggedId)
        .sort((a, b) => a.position - b.position);
    newSiblings.push({ ...dragged, parent_item_id: parentItemId });
    newSiblings.forEach((row, index) => {
        updates.push({
            item_id: row.id,
            position: (index + 1) * 10,
            parent_item_id: parentItemId,
        });
    });

    return updates;
}

export function parentItemOptions(
    items: IAdminNavigationMenuItem[],
    pageById: Map<number, IAdminPage>,
    resolvedLabelByItemId: Map<number, string>,
    excludeId?: number,
): Array<{ value: string; label: string }> {
    return items
        .filter((item) => item.id !== excludeId)
        .map((item) => {
            const display = getMenuItemDisplay(item, pageById, resolvedLabelByItemId);
            return {
                value: String(item.id),
                label: display.primary,
            };
        });
}
