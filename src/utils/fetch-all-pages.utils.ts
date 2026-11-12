/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/

/**
 * Largest page the admin list endpoints (groups, roles, ...) serve. A larger
 * `pageSize` is not clamped by the backend, it is reset to the default of 20, so
 * a picker that asked for `pageSize: 1000` silently saw only the first 20 rows.
 */
export const ADMIN_LIST_MAX_PAGE_SIZE = 100;

/**
 * Reads every page of a paginated admin list, one request per page, and returns
 * the rows in server order. For pickers that must offer every row (group and
 * role pickers); a screen that shows a page at a time keeps using the paged
 * hook.
 */
export async function fetchAllPages<TItem>(
    fetchPage: (page: number, pageSize: number) => Promise<{ items: TItem[]; totalPages: number }>,
): Promise<TItem[]> {
    const rows: TItem[] = [];
    let page = 1;
    let totalPages = 1;

    do {
        const result = await fetchPage(page, ADMIN_LIST_MAX_PAGE_SIZE);
        rows.push(...result.items);
        totalPages = result.totalPages;
        page += 1;
    } while (page <= totalPages);

    return rows;
}
