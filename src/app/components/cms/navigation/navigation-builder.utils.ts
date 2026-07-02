/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import type { IAdminNavigationMenuItem } from '../../../../api/admin/navigation.api';
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

export function getMenuItemDisplay(
    item: IAdminNavigationMenuItem,
    pageById: Map<number, IAdminPage>,
    resolvedLabelByItemId: Map<number, string>,
): INavigationItemDisplay {
    if (item.item_type === 'page' && item.page_id) {
        const page = pageById.get(item.page_id);
        const resolved = resolvedLabelByItemId.get(item.id);
        return {
            primary: resolved ?? page?.keyword ?? `Page #${item.page_id}`,
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
): Array<{ item_id: number; position: number; parent_item_id?: number | null }> {
    const item = items.find((row) => row.id === itemId);
    if (!item) {
        return [];
    }

    const siblings = items
        .filter((row) => row.parent_item_id === item.parent_item_id)
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
