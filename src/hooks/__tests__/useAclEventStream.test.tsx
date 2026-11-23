/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
/**
 * Regression for the SSE-driven (no-polling) system-update wiring added to the
 * auth-events stream:
 *
 *  - a `system-update` event invalidates the System Maintenance queries so the
 *    step tracker repaints live (never a timer poll);
 *  - the FIRST `open` does NOT reconcile (SSR already gave fresh data), but a
 *    RE-connect after a drop DOES — so a state change missed while the stream
 *    was down (e.g. the manager restarted the backend mid-update) is picked up
 *    without a manual full-page refresh;
 *  - the shared `auth-sse-status` store tracks connect/disconnect so the page's
 *    fallback poll only runs while the stream is down.
 *
 * Driven by a fake `EventSource` (the browser API) + mocked auth/router so the
 * test pins the hook's event handlers, not a real Mercure connection.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { type ReactNode } from 'react';
import { renderHook, act } from '@testing-library/react';
import { QueryClientProvider, type QueryClient } from '@tanstack/react-query';
import { createTestQueryClient } from '../../test-utils/renderWithProviders';
import { getAuthSseConnected, __resetAuthSseStatusForTests } from '../auth-sse-status';

const { authStatus, router } = vi.hoisted(() => ({
    authStatus: { isAuthenticated: true, user: null as { id: number } | null },
    router: { replace: vi.fn() },
}));

vi.mock('next/navigation', () => ({ useRouter: () => router }));
vi.mock('../useUserData', () => ({ useAuthStatus: () => authStatus }));
vi.mock('../../app/store/impersonation.store', () => ({
    useImpersonationStore: { getState: () => ({ setActive: vi.fn(), clear: vi.fn() }) },
}));

import { useAclEventStream } from '../useAclEventStream';

/** Minimal stand-in for the browser `EventSource`. */
class FakeEventSource {
    static readonly CONNECTING = 0;
    static readonly OPEN = 1;
    static readonly CLOSED = 2;
    static instances: FakeEventSource[] = [];

    readyState = FakeEventSource.CONNECTING;
    private readonly listeners: Record<string, Array<(e: unknown) => void>> = {};

    constructor(public readonly url: string) {
        FakeEventSource.instances.push(this);
    }

    addEventListener(type: string, cb: (e: unknown) => void): void {
        (this.listeners[type] ??= []).push(cb);
    }

    removeEventListener(): void {}

    close(): void {
        this.readyState = FakeEventSource.CLOSED;
    }

    emit(type: string, data?: string): void {
        for (const cb of this.listeners[type] ?? []) cb({ data });
    }
}

function makeWrapper(client: QueryClient) {
    return function Wrapper({ children }: { children: ReactNode }) {
        return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
    };
}

const SYSTEM_KEYS = [['systemUpdateStatus'], ['systemVersion'], ['systemHealth']];

function invalidatedKeys(invalidate: { mock: { calls: unknown[][] } }): string[] {
    return invalidate.mock.calls.map((call) =>
        JSON.stringify((call[0] as { queryKey?: unknown } | undefined)?.queryKey)
    );
}

beforeEach(() => {
    authStatus.isAuthenticated = true;
    authStatus.user = null;
    FakeEventSource.instances = [];
    vi.stubGlobal('EventSource', FakeEventSource);
    __resetAuthSseStatusForTests();
});

afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
});

describe('useAclEventStream — system-update SSE wiring', () => {
    it('invalidates the System Maintenance queries on a system-update event, and the first open does not reconcile', () => {
        const client = createTestQueryClient();
        const invalidate = vi.spyOn(client, 'invalidateQueries');

        renderHook(() => useAclEventStream(), { wrapper: makeWrapper(client) });
        const es = FakeEventSource.instances[0];
        expect(es).toBeDefined();

        act(() => es.emit('open'));
        // First connect must NOT reconcile (SSR already provided fresh data).
        expect(invalidate).not.toHaveBeenCalled();
        expect(getAuthSseConnected()).toBe(true);

        act(() => es.emit('system-update'));
        const keys = invalidatedKeys(invalidate);
        for (const key of SYSTEM_KEYS) {
            expect(keys).toContain(JSON.stringify(key));
        }
    });

    it('reconciles on RE-connect and tracks disconnect in the shared store', async () => {
        vi.useFakeTimers();
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ status: 200 }));

        const client = createTestQueryClient();
        const invalidate = vi.spyOn(client, 'invalidateQueries');

        renderHook(() => useAclEventStream(), { wrapper: makeWrapper(client) });
        const first = FakeEventSource.instances[0];

        act(() => first.emit('open'));
        expect(getAuthSseConnected()).toBe(true);
        expect(invalidate).not.toHaveBeenCalled();

        // Stream drops: error on a CLOSED source → disconnect + scheduled reconnect.
        first.readyState = FakeEventSource.CLOSED;
        await act(async () => {
            first.emit('error');
            await vi.runAllTimersAsync();
        });
        expect(getAuthSseConnected()).toBe(false);

        // The scheduled reconnect opened a fresh source.
        const second = FakeEventSource.instances[1];
        expect(second).toBeDefined();

        act(() => second.emit('open'));
        // RE-connect reconciles the update views that may have changed while down.
        const keys = invalidatedKeys(invalidate);
        for (const key of SYSTEM_KEYS) {
            expect(keys).toContain(JSON.stringify(key));
        }
        expect(getAuthSseConnected()).toBe(true);
    });

    it('closes the stream and reports disconnected on unmount', () => {
        const client = createTestQueryClient();
        const { unmount } = renderHook(() => useAclEventStream(), { wrapper: makeWrapper(client) });
        const es = FakeEventSource.instances[0];

        act(() => es.emit('open'));
        expect(getAuthSseConnected()).toBe(true);

        unmount();
        expect(es.readyState).toBe(FakeEventSource.CLOSED);
        expect(getAuthSseConnected()).toBe(false);
    });
});

const PAGE_PATH_KEY = ['page-by-keyword', '__path__', '/news', 1, 'published'];

function seedPage(client: QueryClient, key: readonly unknown[], id: number, dependsOn: string[]): void {
    // The test client drops unobserved queries at once (`gcTime: 0`); a page on screen is observed.
    client
        .getQueryCache()
        .build(client, { queryKey: key, gcTime: Infinity })
        .setData({ id, sections: [], sync: { depends_on: dependsOn, valid_until: null } });
}

describe('useAclEventStream — live sync (changed notices)', () => {
    it('subscribes the change notices and refetches only the page that depends on the tag (P4-A1)', async () => {
        vi.useFakeTimers();
        const client = createTestQueryClient();
        seedPage(client, PAGE_PATH_KEY, 12, ['page:12']);
        seedPage(client, ['page-by-keyword', '__path__', '/other', 1, 'published'], 13, ['page:13']);
        const invalidate = vi.spyOn(client, 'invalidateQueries');

        renderHook(() => useAclEventStream(), { wrapper: makeWrapper(client) });
        const es = FakeEventSource.instances[0];
        act(() => es.emit('open'));

        act(() => es.emit('changed', JSON.stringify({ v: 1, tags: ['page:12'] })));
        await act(async () => {
            await vi.advanceTimersByTimeAsync(400);
        });

        expect(invalidate).toHaveBeenCalled();
        expect(client.getQueryState(PAGE_PATH_KEY)?.isInvalidated).toBe(true);
        expect(client.getQueryState(['page-by-keyword', '__path__', '/other', 1, 'published'])?.isInvalidated).toBe(false);
    });

    it('ignores a message it cannot read or a version it does not know', async () => {
        vi.useFakeTimers();
        const client = createTestQueryClient();
        const invalidate = vi.spyOn(client, 'invalidateQueries');

        renderHook(() => useAclEventStream(), { wrapper: makeWrapper(client) });
        const es = FakeEventSource.instances[0];
        act(() => es.emit('open'));

        act(() => {
            es.emit('changed', 'not json');
            es.emit('changed', JSON.stringify({ v: 2, tags: ['navigation'] }));
            es.emit('changed', JSON.stringify({ v: 1, tags: ['unknown:1'] }));
        });
        await act(async () => {
            await vi.advanceTimersByTimeAsync(400);
        });

        expect(invalidate).not.toHaveBeenCalled();
        expect(FakeEventSource.instances).toHaveLength(1);
    });

    it('on an acl notice invalidates user data and the navigation, and opens the stream again (P4-A2, F251)', async () => {
        vi.useFakeTimers();
        const client = createTestQueryClient();
        const invalidate = vi.spyOn(client, 'invalidateQueries');

        renderHook(() => useAclEventStream(), { wrapper: makeWrapper(client) });
        const first = FakeEventSource.instances[0];
        act(() => first.emit('open'));

        act(() => first.emit('changed', JSON.stringify({ v: 1, tags: ['acl'] })));
        // Re-bootstrap: the old socket closes and a new one opens at once (new topic list).
        expect(first.readyState).toBe(FakeEventSource.CLOSED);
        expect(FakeEventSource.instances).toHaveLength(2);

        await act(async () => {
            await vi.advanceTimersByTimeAsync(400);
        });
        const keys = invalidatedKeys(invalidate);
        expect(keys).toContain(JSON.stringify(['user-data']));
        expect(keys).toContain(JSON.stringify(['navigation']));

        // The new socket's first open does not reconcile: nothing was missed.
        const before = invalidate.mock.calls.length;
        act(() => FakeEventSource.instances[1].emit('open'));
        expect(invalidate.mock.calls.length).toBe(before);
    });

    it('a visitor without a session listens too, and a closed stream is not an expired session', async () => {
        vi.useFakeTimers();
        const fetchMock = vi.fn().mockResolvedValue({ status: 401 });
        vi.stubGlobal('fetch', fetchMock);
        authStatus.isAuthenticated = false;

        const client = createTestQueryClient();
        renderHook(() => useAclEventStream(), { wrapper: makeWrapper(client) });
        const first = FakeEventSource.instances[0];
        expect(first).toBeDefined();
        act(() => first.emit('open'));

        first.readyState = FakeEventSource.CLOSED;
        await act(async () => {
            first.emit('error');
            await vi.runAllTimersAsync();
        });

        // Guests are never sent through the session check, and the stream is opened again.
        expect(fetchMock).not.toHaveBeenCalled();
        expect(FakeEventSource.instances.length).toBeGreaterThan(1);
    });

    it('opens the stream again when the signed-in identity changes', () => {
        const client = createTestQueryClient();
        authStatus.user = null;
        authStatus.isAuthenticated = false;
        const { rerender } = renderHook(() => useAclEventStream(), { wrapper: makeWrapper(client) });
        act(() => FakeEventSource.instances[0].emit('open'));
        expect(FakeEventSource.instances).toHaveLength(1);

        authStatus.user = { id: 7 };
        authStatus.isAuthenticated = true;
        rerender();

        // The socket was opened as a guest; now it carries the user's topics.
        expect(FakeEventSource.instances.length).toBeGreaterThan(1);
        expect(FakeEventSource.instances[FakeEventSource.instances.length - 1].readyState).not.toBe(FakeEventSource.CLOSED);
    });

    it('marks queries stale only (no refetch) while the tab is hidden', async () => {
        vi.useFakeTimers();
        const client = createTestQueryClient();
        seedPage(client, PAGE_PATH_KEY, 12, ['page:12']);
        const invalidate = vi.spyOn(client, 'invalidateQueries');

        renderHook(() => useAclEventStream(), { wrapper: makeWrapper(client) });
        const es = FakeEventSource.instances[0];
        // The tab went to the background after the stream was open.
        const visibility = vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('hidden');

        act(() => es.emit('changed', JSON.stringify({ v: 1, tags: ['page:12'] })));
        await act(async () => {
            await vi.advanceTimersByTimeAsync(400);
        });

        const pageCall = invalidate.mock.calls.find(
            (call) => JSON.stringify((call[0] as { queryKey?: unknown }).queryKey) === JSON.stringify(['page-by-keyword']),
        );
        expect((pageCall?.[0] as { refetchType?: string }).refetchType).toBe('none');
        visibility.mockRestore();
    });
});
