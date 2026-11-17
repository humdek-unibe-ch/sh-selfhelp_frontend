/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * The admin "Referrers" card needs the outside site a visitor came from. The
 * server fetch carries it for a normal visit. The browser keeps a fallback only
 * when that server render did not deliver the landing page; once the SSR-seeded
 * query hydrates, the snapshot is dismissed so a later refetch cannot
 * double-count. The mobile app has no referrer and never sends the header.
 */
const { getMock } = vi.hoisted(() => ({ getMock: vi.fn() }));

vi.mock('../base.api', () => ({
    permissionAwareApiClient: { get: getMock },
}));

import { PageApi } from '../page.api';
import { dismissLandingReferrerHost, resetLandingReferrerForTests } from '../../utils/referrer-host.utils';

const page = { id: 1, keyword: 'impressum' };

function landOn(path: string, referrer: string): void {
    window.history.pushState({}, '', path);
    Object.defineProperty(document, 'referrer', { value: referrer, configurable: true });
    resetLandingReferrerForTests();
}

/** The second argument of a `get` call is the axios config, when there is one. */
function configOf(call: number): { headers?: Record<string, string> } | undefined {
    return getMock.mock.calls[call]?.[1];
}

describe('PageApi.resolvePageByPath and the outside referrer', () => {
    beforeEach(() => {
        getMock.mockReset();
        getMock.mockResolvedValue({ data: { data: { page } } });
    });

    afterEach(() => {
        landOn('/', '');
    });

    it('sends the outside referrer host when the browser itself loads the landing page', async () => {
        landOn('/impressum', 'https://News.Example.org/story');

        const result = await PageApi.resolvePageByPath('/impressum', 1, false);

        expect(result).toEqual(page);
        expect(getMock).toHaveBeenCalledTimes(1);
        expect(configOf(0)).toEqual({ headers: { 'X-Referrer-Host': 'news.example.org' } });
        // The request still goes to the resolve endpoint for that path.
        expect(getMock.mock.calls[0][0]).toMatchObject({
            route: expect.stringContaining('/pages/resolve?path=%2Fimpressum'),
            permissions: [],
        });
    });

    it('sends it once: the next request, even for the same page, carries nothing', async () => {
        landOn('/impressum', 'https://news.example.org/');

        await PageApi.resolvePageByPath('/impressum', 1, false);
        await PageApi.resolvePageByPath('/impressum', 1, false);

        expect(configOf(0)).toEqual({ headers: { 'X-Referrer-Host': 'news.example.org' } });
        expect(configOf(1)).toBeUndefined();
    });

    it('sends nothing for another page, such as clicking on or a hover prefetch', async () => {
        landOn('/impressum', 'https://news.example.org/');

        await PageApi.resolvePageByPath('/contact', 1, false);
        await PageApi.resolvePageByPath('/impressum', 1, false);

        expect(configOf(0)).toBeUndefined();
        expect(configOf(1)).toBeUndefined();
    });

    it('sends nothing when the visitor did not come from an outside site', async () => {
        landOn('/impressum', '');

        await PageApi.resolvePageByPath('/impressum', 1, false);

        expect(getMock).toHaveBeenCalledTimes(1);
        expect(configOf(0)).toBeUndefined();
    });

    it('keeps the keyword route free of the header: it is not the public landing request', async () => {
        landOn('/impressum', 'https://news.example.org/');

        await PageApi.getPageByKeyword('impressum', 1, false);

        const config = getMock.mock.calls[0][2] as { headers?: Record<string, string> };
        expect(config.headers).toBeUndefined();
    });

    it('after the landing query is seeded from the server, a later browser fetch carries no header', async () => {
        landOn('/impressum', 'https://news.example.org/story');
        // Same effect as DynamicPageClient when the SSR-seeded PAGE_BY_PATH entry hydrates.
        dismissLandingReferrerHost('/impressum');

        await PageApi.resolvePageByPath('/impressum', 1, false);
        await PageApi.resolvePageByPath('/impressum', 2, false);

        expect(getMock).toHaveBeenCalledTimes(2);
        expect(configOf(0)).toBeUndefined();
        expect(configOf(1)).toBeUndefined();
    });

});
