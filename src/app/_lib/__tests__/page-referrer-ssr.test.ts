/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * The admin "Referrers" card needs the outside site a visitor came from.
 * A visitor is rendered on the server, and one render makes several page-content
 * fetches (metadata, layout prefetch, page body, status check), each of which
 * Symfony records as a page view. The referrer belongs to the visit, so exactly
 * one of those fetches may carry `X-Referrer-Host`.
 *
 * React's `cache()` memoises per server request. The stand-in below does the
 * same, and `request.next()` starts a new request, so "once per request" is
 * tested for real instead of being assumed.
 */
const request = vi.hoisted(() => {
    const memos: Map<string, unknown>[] = [];
    return {
        memos,
        /** Starts a new server request: every `cache()` begins empty again. */
        next(): void {
            memos.forEach((memo) => memo.clear());
        },
        incoming: { values: {} as Record<string, string | undefined>, outsideRequest: false },
    };
});

vi.mock('react', async (importOriginal) => {
    const actual = await importOriginal<Record<string, unknown>>();
    return {
        ...actual,
        cache: <A extends unknown[], R>(fn: (...args: A) => R) => {
            const memo = new Map<string, unknown>();
            request.memos.push(memo);
            return (...args: A): R => {
                const key = JSON.stringify(args);
                if (!memo.has(key)) memo.set(key, fn(...args));
                return memo.get(key) as R;
            };
        },
    };
});

vi.mock('next/headers', () => ({
    cookies: vi.fn(),
    headers: vi.fn(),
}));

import { cookies, headers } from 'next/headers';
import {
    getPageByKeywordSSRCached,
    getPageByKeywordSSRStatus,
    resolvePageByPathSSRCached,
    resolvePageByPathSSRStatus,
} from '../server-fetch';

const fetchMock = vi.fn();

interface ISentRequest {
    url: string;
    headers: Record<string, string>;
}

function sentRequests(): ISentRequest[] {
    return fetchMock.mock.calls.map(([url, init]) => ({
        url: String(url),
        headers: ((init as RequestInit).headers ?? {}) as Record<string, string>,
    }));
}

function fetchesCarryingReferrer(): ISentRequest[] {
    return sentRequests().filter((sent) => sent.headers['X-Referrer-Host'] !== undefined);
}

/** The four page-content fetches one slug-route render can make. */
function renderTheSlugRoute(): Promise<unknown[]> {
    return Promise.all([
        resolvePageByPathSSRCached('/impressum', 1),
        resolvePageByPathSSRStatus('/impressum', 1),
        getPageByKeywordSSRCached('impressum', 1),
        getPageByKeywordSSRStatus('impressum', 1),
    ]);
}

beforeEach(() => {
    request.next();
    request.incoming.values = {};
    request.incoming.outsideRequest = false;

    vi.mocked(cookies).mockResolvedValue({ get: () => undefined } as unknown as Awaited<ReturnType<typeof cookies>>);
    vi.mocked(headers).mockImplementation(async () => {
        if (request.incoming.outsideRequest) throw new Error('headers() was called outside a request scope');
        return {
            get: (name: string) => request.incoming.values[name.toLowerCase()] ?? null,
        } as unknown as Awaited<ReturnType<typeof headers>>;
    });

    fetchMock.mockReset();
    fetchMock.mockResolvedValue({ ok: true, status: 200, json: async () => ({ data: { page: {} } }) });
    vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
    vi.unstubAllGlobals();
});

describe('page-content SSR fetches and the outside referrer', () => {
    it('carries the outside referrer host on exactly one of the four fetches of a visit', async () => {
        request.incoming.values = { referer: 'https://News.Example.org/story?id=1', host: 'site.test' };

        await renderTheSlugRoute();

        expect(fetchMock).toHaveBeenCalledTimes(4);
        const carrying = fetchesCarryingReferrer();
        expect(carrying).toHaveLength(1);
        expect(carrying[0].headers['X-Referrer-Host']).toBe('news.example.org');
    });

    it('lets the first fetch of the request take it, not a later one', async () => {
        request.incoming.values = { referer: 'https://news.example.org/', host: 'site.test' };

        await resolvePageByPathSSRCached('/impressum', 1);
        await resolvePageByPathSSRStatus('/impressum', 1);

        const [first, second] = sentRequests();
        expect(first.headers['X-Referrer-Host']).toBe('news.example.org');
        expect(second.headers['X-Referrer-Host']).toBeUndefined();
    });

    it('starts again with the next request', async () => {
        request.incoming.values = { referer: 'https://news.example.org/', host: 'site.test' };
        await renderTheSlugRoute();
        expect(fetchesCarryingReferrer()).toHaveLength(1);

        request.next();
        fetchMock.mockClear();
        await renderTheSlugRoute();

        expect(fetchMock).toHaveBeenCalledTimes(4);
        expect(fetchesCarryingReferrer()).toHaveLength(1);
    });

    it('does not repeat the referrer when a fetch of the same request is asked for again', async () => {
        request.incoming.values = { referer: 'https://news.example.org/', host: 'site.test' };

        await resolvePageByPathSSRCached('/impressum', 1);
        await resolvePageByPathSSRCached('/impressum', 1);

        // The second call is the per-request cache hit: no second fetch at all.
        expect(fetchMock).toHaveBeenCalledTimes(1);
        expect(fetchesCarryingReferrer()).toHaveLength(1);
    });

    it('sends nothing when the visitor came from the site itself', async () => {
        // Behind the proxy `host` is the internal name; the public host is forwarded.
        request.incoming.values = {
            referer: 'https://site.test/home',
            host: 'frontend:3000',
            'x-forwarded-host': 'site.test',
        };

        await renderTheSlugRoute();

        expect(fetchMock).toHaveBeenCalledTimes(4);
        expect(fetchesCarryingReferrer()).toHaveLength(0);
    });

    it('sends nothing when there is no referrer', async () => {
        request.incoming.values = { host: 'site.test' };

        await renderTheSlugRoute();

        expect(fetchesCarryingReferrer()).toHaveLength(0);
    });

    it('keeps the client type and accept headers next to the referrer', async () => {
        request.incoming.values = { referer: 'https://news.example.org/', host: 'site.test' };

        await resolvePageByPathSSRCached('/impressum', 1);

        expect(sentRequests()[0].headers).toMatchObject({
            Accept: 'application/json',
            'X-Client-Type': 'web',
            'X-Referrer-Host': 'news.example.org',
        });
    });

    it('still fetches the page when the request headers cannot be read', async () => {
        request.incoming.outsideRequest = true;

        const page = await resolvePageByPathSSRCached('/impressum', 1);

        expect(page).not.toBeNull();
        expect(fetchMock).toHaveBeenCalledTimes(1);
        expect(fetchesCarryingReferrer()).toHaveLength(0);
    });
});
