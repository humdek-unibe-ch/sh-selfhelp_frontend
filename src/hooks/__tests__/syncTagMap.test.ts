/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
/**
 * The tag map of live sync (`utils/sync-tags.utils.ts`): which queries a `changed` message
 * refetches. Each case mounts a real observer on real queries and counts the refetches, so the
 * test pins what the person would see refreshed, not which functions were called.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { QueryClient, QueryObserver, type QueryKey } from '@tanstack/react-query';
import {
    applySyncTags,
    handleSyncMessage,
    reconcileAfterReopen,
    refetchInvalidatedQueries,
    registerSyncTagIgnore,
    subscribeSyncTags,
} from '../../utils/sync-tags.utils';

let client: QueryClient;
let unsubscribes: Array<() => void> = [];

beforeEach(() => {
    client = new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: Infinity } } });
    unsubscribes = [];
});

afterEach(() => {
    unsubscribes.forEach((unsubscribe) => unsubscribe());
    client.clear();
    vi.useRealTimers();
});

/** A query on screen: it has an observer, and `fetch` counts how often it was read. */
function onScreen(key: QueryKey, data: unknown): ReturnType<typeof vi.fn> {
    const fetch = vi.fn().mockResolvedValue(data);
    client.setQueryData(key, data);
    const observer = new QueryObserver(client, { queryKey: key, queryFn: fetch, staleTime: Infinity });
    unsubscribes.push(observer.subscribe(() => undefined));
    return fetch;
}

function page(id: number, dependsOn: string[]) {
    return { id, sections: [], sync: { depends_on: dependsOn, valid_until: null } };
}

const settle = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

describe('sync tag map', () => {
    it('page:12 refetches the page that depends on it and leaves page:13 alone (P4-A1)', async () => {
        const twelve = onScreen(['page-by-keyword', '__path__', '/twelve', 1, 'published'], page(12, ['page:12']));
        const thirteen = onScreen(['page-by-keyword', '__path__', '/thirteen', 1, 'published'], page(13, ['page:13']));
        const byKeyword = onScreen(['page-by-keyword', 'twelve', 1, 'published'], page(12, ['page:12', 'table:5']));

        applySyncTags(client, ['page:12']);
        await settle();

        expect(twelve).toHaveBeenCalledTimes(1);
        expect(byKeyword).toHaveBeenCalledTimes(1);
        expect(thirteen).not.toHaveBeenCalled();
    });

    it('a page without a sync block (an older server) is never matched', async () => {
        const legacy = onScreen(['page-by-keyword', '__path__', '/legacy', 1, 'published'], { id: 12, sections: [] });

        applySyncTags(client, ['page:12', 'global_values']);
        await settle();

        expect(legacy).not.toHaveBeenCalled();
    });

    it('global_values and page_draft refetch the pages that name them', async () => {
        const published = onScreen(['page-by-keyword', '__path__', '/a', 1, 'published'], page(1, ['page:1', 'global_values']));
        const draft = onScreen(['page-by-keyword', '__path__', '/a', 1, 'preview'], page(1, ['page_draft:1']));

        applySyncTags(client, ['page_draft:1']);
        await settle();
        expect(draft).toHaveBeenCalledTimes(1);
        expect(published).not.toHaveBeenCalled();

        applySyncTags(client, ['global_values']);
        await settle();
        expect(published).toHaveBeenCalledTimes(1);
    });

    it('table:31 refetches the form lists of the pages that read table 31, not other lists (P4-A1)', async () => {
        onScreen(['page-by-keyword', '__path__', '/orders', 1, 'published'], page(12, ['page:12', 'table:31']));
        onScreen(['page-by-keyword', '__path__', '/other', 1, 'published'], page(13, ['page:13', 'table:99']));
        // form-list key: root, apiBase, account, language, platform, pageId, sectionId, route, own, version
        const orders = onScreen(['form-list', '/api', 7, 1, 'web', 12, 40, '', '', 'published'], { rows: [] });
        const other = onScreen(['form-list', '/api', 7, 1, 'web', 13, 41, '', '', 'published'], { rows: [] });

        applySyncTags(client, ['table:31']);
        await settle();

        expect(orders).toHaveBeenCalledTimes(1);
        expect(other).not.toHaveBeenCalled();
    });

    it('table:31 marks every list when no cached page can be matched to it', async () => {
        const first = onScreen(['form-list', '/api', 7, 1, 'web', 12, 40, '', '', 'published'], { rows: [] });
        const second = onScreen(['form-list', '/api', 7, 1, 'web', 13, 41, '', '', 'published'], { rows: [] });

        applySyncTags(client, ['table:31']);
        await settle();

        expect(first).toHaveBeenCalledTimes(1);
        expect(second).toHaveBeenCalledTimes(1);
    });

    it('navigation refetches the navigation and the page list (P4-A1)', async () => {
        const navigation = onScreen(['navigation', 1], { items: [] });
        const pages = onScreen(['frontend-pages', 1], []);
        const unrelated = onScreen(['groups', 'all'], []);

        applySyncTags(client, ['navigation']);
        await settle();

        expect(navigation).toHaveBeenCalledTimes(1);
        expect(pages).toHaveBeenCalledTimes(1);
        expect(unrelated).not.toHaveBeenCalled();
    });

    it('acl refetches user data and the navigation (P4-A2, F251)', async () => {
        const user = onScreen(['user-data'], { data: { id: 7 } });
        const navigation = onScreen(['navigation', 1], { items: [] });

        applySyncTags(client, ['acl']);
        await settle();

        expect(user).toHaveBeenCalledTimes(1);
        expect(navigation).toHaveBeenCalledTimes(1);
    });

    it('section:<id> refreshes that section\'s details only (F56)', async () => {
        const open = onScreen(['admin', 'sections', 'details', 12, 55], { id: 55 });
        const otherSection = onScreen(['admin', 'sections', 'details', 12, 56], { id: 56 });

        applySyncTags(client, ['section:55']);
        await settle();

        expect(open).toHaveBeenCalledTimes(1);
        expect(otherSection).not.toHaveBeenCalled();
    });

    it('asset:<id> refreshes the asset lists and tells the asset selection (F121)', async () => {
        const assets = onScreen(['assets', 'list', { page: 1 }], { items: [] });
        const heard = vi.fn();
        unsubscribes.push(subscribeSyncTags(heard));

        applySyncTags(client, ['asset:9']);
        await settle();

        expect(assets).toHaveBeenCalledTimes(1);
        expect(heard).toHaveBeenCalledWith(['asset:9']);
    });

    it('a tag the editor chose to ignore never reaches the cache (hook point for the page lock)', async () => {
        const draft = onScreen(['page-by-keyword', '__path__', '/a', 1, 'preview'], page(12, ['page_draft:12']));
        const heard = vi.fn();
        unsubscribes.push(subscribeSyncTags(heard));
        const unregister = registerSyncTagIgnore((tag) => tag === 'page_draft:12');
        unsubscribes.push(unregister);

        applySyncTags(client, ['page_draft:12']);
        await settle();

        expect(draft).not.toHaveBeenCalled();
        expect(heard).not.toHaveBeenCalled();

        unregister();
        applySyncTags(client, ['page_draft:12']);
        await settle();
        expect(draft).toHaveBeenCalledTimes(1);
    });

    it('a hidden tab only marks queries stale and reads them when it is visible again', async () => {
        const visibility = vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('hidden');
        const navigation = onScreen(['navigation', 1], { items: [] });

        applySyncTags(client, ['navigation']);
        await settle();
        expect(navigation).not.toHaveBeenCalled();
        expect(client.getQueryState(['navigation', 1])?.isInvalidated).toBe(true);

        visibility.mockReturnValue('visible');
        refetchInvalidatedQueries(client);
        await settle();
        expect(navigation).toHaveBeenCalledTimes(1);
        visibility.mockRestore();
    });

    it('waits 0 to 300 ms before it applies a message, and the wait can be cancelled', async () => {
        vi.useFakeTimers();
        const navigation = onScreen(['navigation', 1], { items: [] });

        handleSyncMessage(client, ['navigation']);
        expect(navigation).not.toHaveBeenCalled();
        await vi.advanceTimersByTimeAsync(300);
        expect(navigation).toHaveBeenCalledTimes(1);

        const cancel = handleSyncMessage(client, ['navigation']);
        cancel();
        await vi.advanceTimersByTimeAsync(1000);
        expect(navigation).toHaveBeenCalledTimes(1);
    });

    it('after a dropped stream comes back it marks pages, navigation and lists stale', async () => {
        const navigation = onScreen(['navigation', 1], { items: [] });
        const pageQuery = onScreen(['page-by-keyword', '__path__', '/a', 1, 'published'], page(1, []));
        const list = onScreen(['form-list', '/api', 7, 1, 'web', 1, 40, '', '', 'published'], { rows: [] });
        const admin = onScreen(['admin-pages'], []);

        reconcileAfterReopen(client);
        await settle();

        expect(navigation).toHaveBeenCalledTimes(1);
        expect(pageQuery).toHaveBeenCalledTimes(1);
        expect(list).toHaveBeenCalledTimes(1);
        expect(admin).not.toHaveBeenCalled();
    });
});
