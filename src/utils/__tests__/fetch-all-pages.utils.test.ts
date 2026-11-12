/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { describe, expect, it, vi } from 'vitest';
import { ADMIN_LIST_MAX_PAGE_SIZE, fetchAllPages } from '../fetch-all-pages.utils';

describe('fetchAllPages', () => {
    it('reads every page at the largest page size the backend serves and keeps the server order', async () => {
        const pages = [[1, 2, 3], [4, 5, 6], [7]];
        const fetchPage = vi.fn(async (page: number) => ({ items: pages[page - 1], totalPages: pages.length }));

        const rows = await fetchAllPages(fetchPage);

        expect(rows).toEqual([1, 2, 3, 4, 5, 6, 7]);
        expect(fetchPage.mock.calls).toEqual([
            [1, ADMIN_LIST_MAX_PAGE_SIZE],
            [2, ADMIN_LIST_MAX_PAGE_SIZE],
            [3, ADMIN_LIST_MAX_PAGE_SIZE],
        ]);
        // The backend resets any larger page size to 20 instead of clamping it.
        expect(ADMIN_LIST_MAX_PAGE_SIZE).toBe(100);
    });

    it('makes one request when everything fits in one page', async () => {
        const fetchPage = vi.fn(async () => ({ items: ['a', 'b'], totalPages: 1 }));

        expect(await fetchAllPages(fetchPage)).toEqual(['a', 'b']);
        expect(fetchPage).toHaveBeenCalledTimes(1);
    });

    it('returns an empty list for an empty table', async () => {
        const fetchPage = vi.fn(async () => ({ items: [], totalPages: 0 }));

        expect(await fetchAllPages(fetchPage)).toEqual([]);
        expect(fetchPage).toHaveBeenCalledTimes(1);
    });

    it('fails when a page fails instead of returning a silently truncated list', async () => {
        const fetchPage = vi.fn(async (page: number) => {
            if (page === 2) throw new Error('boom');
            return { items: [page], totalPages: 3 };
        });

        await expect(fetchAllPages(fetchPage)).rejects.toThrow('boom');
    });
});
