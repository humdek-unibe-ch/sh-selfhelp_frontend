/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * The backend answers `{ data: { page, sync } }`. The tag map and the `valid_until` refetch read
 * `sync` from the cached page, so every place that unwraps a page response keeps the block with
 * the page. Found by the cross-stack live-sync check: with `data.page` alone no `changed` message
 * ever matched a cached page.
 */
const { getMock } = vi.hoisted(() => ({ getMock: vi.fn() }));

vi.mock('../../api/base.api', () => ({
    permissionAwareApiClient: { get: getMock },
}));

import { PageApi } from '../../api/page.api';
import { extractSsrPage } from '../../app/_lib/server-fetch';
import { pageFromPayload } from '../page-payload.utils';
import type { IGetPageResponse, IPageContent } from '../../shared';

const page = { id: 12, keyword: 'impressum', sections: [] } as unknown as IPageContent;
const sync = { depends_on: ['page:12', 'table:31', 'global_values'], valid_until: '2026-12-01T00:00:00Z' };

describe('pageFromPayload', () => {
    it('carries the sync block that sits next to the page', () => {
        expect(pageFromPayload({ page, sync })).toEqual({ ...page, sync });
    });

    it('keeps a block that is already on the page when the payload has none next to it', () => {
        const withBlock = { ...page, sync };
        expect(pageFromPayload({ page: withBlock })).toEqual(withBlock);
    });

    it('returns the page itself when there is no block at all, and null when there is no page', () => {
        expect(pageFromPayload({ page })).toBe(page);
        expect(pageFromPayload({ page: null, sync })).toBeNull();
        expect(pageFromPayload(undefined)).toBeNull();
    });
});

describe('the places that unwrap a page response', () => {
    beforeEach(() => {
        getMock.mockReset();
        getMock.mockResolvedValue({ data: { data: { page, sync } } });
    });

    it('resolvePageByPath returns the page with its sync block', async () => {
        const result = await PageApi.resolvePageByPath('/impressum', 1, false);
        expect(result.sync).toEqual(sync);
        expect(result.id).toBe(12);
    });

    it('getPageByKeyword returns the page with its sync block', async () => {
        const result = await PageApi.getPageByKeyword('impressum', 1, false);
        expect(result.sync).toEqual(sync);
    });

    it('the server render seeds the same page, sync block included', () => {
        const envelope = { data: { page, sync } } as unknown as IGetPageResponse;
        expect(extractSsrPage(envelope)?.sync).toEqual(sync);
        expect(extractSsrPage(null)).toBeNull();
    });
});
