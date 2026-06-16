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
    authStatus: { isAuthenticated: true },
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
