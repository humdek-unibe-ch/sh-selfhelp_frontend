/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
/**
 * Tests for the cross-tab shared SSE coordinator (`utils/shared-sse.ts`).
 *
 * The coordinator is what stops every browser tab from opening its own
 * `EventSource` and exhausting the per-origin connection pool (the "Data
 * Browser hangs with a few tabs open" report). These tests pin the four
 * behaviours that matter:
 *
 *   1. LEADER path: the elected tab opens exactly one real `EventSource`,
 *      surfaces its events locally AND fans them out over BroadcastChannel,
 *      and reconnects with backoff on a closed socket.
 *   2. FOLLOWER path: a tab that did NOT win the lock opens NO connection and
 *      reacts purely to a sibling's broadcasts (events, status, reopen, expiry).
 *   3. Teardown grace: a StrictMode-style unmount→remount reuses the same
 *      connection instead of tearing it down and re-electing.
 *   4. FALLBACK path (no Web Locks): a per-tab `EventSource` is released while
 *      the tab is hidden and reopened on focus, so background tabs stop stacking.
 *
 * `EventSource`, `BroadcastChannel`, and `navigator.locks` are replaced with
 * controllable fakes so the leader/follower split and timing are deterministic.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { subscribeSharedSse, __resetSharedSseForTests } from '../shared-sse';

// ── Fakes ──────────────────────────────────────────────────────────────────

interface FakeEvt {
    type: string;
    data?: string;
}

class MockEventSource {
    static instances: MockEventSource[] = [];
    static readonly CONNECTING = 0;
    static readonly OPEN = 1;
    static readonly CLOSED = 2;

    url: string;
    readyState = MockEventSource.CONNECTING;
    closed = false;
    private listeners: Record<string, Set<(e: FakeEvt) => void>> = {};

    constructor(url: string) {
        this.url = url;
        MockEventSource.instances.push(this);
    }

    addEventListener(type: string, cb: (e: FakeEvt) => void): void {
        (this.listeners[type] ??= new Set()).add(cb);
    }

    removeEventListener(type: string, cb: (e: FakeEvt) => void): void {
        this.listeners[type]?.delete(cb);
    }

    close(): void {
        this.closed = true;
        this.readyState = MockEventSource.CLOSED;
    }

    emit(type: string, data?: string): void {
        this.listeners[type]?.forEach((cb) => cb({ type, data }));
    }

    emitOpen(): void {
        this.readyState = MockEventSource.OPEN;
        this.emit('open');
    }

    emitError(): void {
        this.readyState = MockEventSource.CLOSED;
        this.emit('error');
    }
}

class MockBroadcastChannel {
    static registry = new Map<string, Set<MockBroadcastChannel>>();

    name: string;
    closed = false;
    private listeners = new Set<(e: { data: unknown }) => void>();

    constructor(name: string) {
        this.name = name;
        let peers = MockBroadcastChannel.registry.get(name);
        if (!peers) {
            peers = new Set();
            MockBroadcastChannel.registry.set(name, peers);
        }
        peers.add(this);
    }

    addEventListener(_type: 'message', cb: (e: { data: unknown }) => void): void {
        this.listeners.add(cb);
    }

    removeEventListener(_type: 'message', cb: (e: { data: unknown }) => void): void {
        this.listeners.delete(cb);
    }

    postMessage(data: unknown): void {
        const peers = MockBroadcastChannel.registry.get(this.name);
        if (!peers) return;
        for (const ch of peers) {
            if (ch === this || ch.closed) continue;
            ch.listeners.forEach((cb) => cb({ data }));
        }
    }

    close(): void {
        this.closed = true;
        MockBroadcastChannel.registry.get(this.name)?.delete(this);
    }
}

/** Toggle whether `navigator.locks.request` grants leadership to this "tab". */
const lockMode = { grant: true };

const mockLocks = {
    request(
        _name: string,
        opts: { signal?: AbortSignal },
        cb: () => Promise<void>,
    ): Promise<void> {
        if (opts?.signal?.aborted) {
            return Promise.reject(new DOMException('Aborted', 'AbortError'));
        }
        if (lockMode.grant) {
            // Run the leader callback synchronously so the EventSource exists
            // immediately after subscribe (its returned promise never resolves
            // while we hold leadership).
            return Promise.resolve(cb());
        }
        // Never granted: stay a follower until the request is aborted.
        return new Promise<void>((_resolve, reject) => {
            opts?.signal?.addEventListener('abort', () =>
                reject(new DOMException('Aborted', 'AbortError')),
            );
        });
    },
};

const ACL_ENDPOINT = '/api/auth/events';
const ACL_CHANNEL = `selfhelp-sse:${ACL_ENDPOINT}`;

let visibility: 'visible' | 'hidden' = 'visible';

function setVisibility(state: 'visible' | 'hidden'): void {
    visibility = state;
    document.dispatchEvent(new Event('visibilitychange'));
}

// ── Setup / teardown ─────────────────────────────────────────────────────────

const originalEventSource = globalThis.EventSource;
const originalBroadcastChannel = globalThis.BroadcastChannel;
const locksDescriptor = Object.getOwnPropertyDescriptor(navigator, 'locks');

beforeEach(() => {
    MockEventSource.instances = [];
    MockBroadcastChannel.registry.clear();
    lockMode.grant = true;
    visibility = 'visible';

    globalThis.EventSource = MockEventSource as unknown as typeof EventSource;
    globalThis.BroadcastChannel = MockBroadcastChannel as unknown as typeof BroadcastChannel;
    Object.defineProperty(navigator, 'locks', { value: mockLocks, configurable: true });
    Object.defineProperty(document, 'visibilityState', {
        configurable: true,
        get: () => visibility,
    });
});

afterEach(() => {
    __resetSharedSseForTests();
    globalThis.EventSource = originalEventSource;
    globalThis.BroadcastChannel = originalBroadcastChannel;
    if (locksDescriptor) {
        Object.defineProperty(navigator, 'locks', locksDescriptor);
    } else {
        delete (navigator as { locks?: unknown }).locks;
    }
    vi.useRealTimers();
});

// ── 1. Leader path ───────────────────────────────────────────────────────────

describe('shared-sse · leader', () => {
    it('opens exactly one EventSource and dispatches + fans out events', () => {
        const onEvent = vi.fn();
        const onStatus = vi.fn();

        const observer = new MockBroadcastChannel(ACL_CHANNEL);
        const broadcasts: unknown[] = [];
        observer.addEventListener('message', (e) => broadcasts.push(e.data));

        subscribeSharedSse({
            endpoint: ACL_ENDPOINT,
            events: ['acl-changed', 'system-update'],
            onEvent,
            onStatus,
        });

        expect(MockEventSource.instances).toHaveLength(1);
        expect(MockEventSource.instances[0].url).toBe(ACL_ENDPOINT);

        MockEventSource.instances[0].emitOpen();
        expect(onStatus).toHaveBeenCalledWith(true);
        expect(broadcasts).toContainEqual({ k: 'status', connected: true });

        MockEventSource.instances[0].emit('acl-changed', '{"aclVersion":"v2"}');
        expect(onEvent).toHaveBeenCalledWith('acl-changed', '{"aclVersion":"v2"}');
        expect(broadcasts).toContainEqual({ k: 'evt', type: 'acl-changed', data: '{"aclVersion":"v2"}' });

        observer.close();
    });

    it('does not reconcile on the FIRST connect but does on a RE-connect', async () => {
        vi.useFakeTimers();
        const onReopen = vi.fn();
        const onLeaderClosed = vi.fn().mockResolvedValue(false);

        subscribeSharedSse({
            endpoint: ACL_ENDPOINT,
            events: ['acl-changed'],
            onEvent: vi.fn(),
            onReopen,
            onLeaderClosed,
        });

        const first = MockEventSource.instances[0];
        first.emitOpen();
        expect(onReopen).not.toHaveBeenCalled(); // SSR already had fresh data

        // Socket drops → leader checks the session, then reconnects with backoff.
        first.emitError();
        await vi.advanceTimersByTimeAsync(1_000);
        expect(onLeaderClosed).toHaveBeenCalledTimes(1);
        expect(MockEventSource.instances).toHaveLength(2);

        // The reconnect IS a re-connect → reconcile fires this time.
        MockEventSource.instances[1].emitOpen();
        expect(onReopen).toHaveBeenCalledTimes(1);
    });

    it('stops reconnecting when the session is reported expired', async () => {
        vi.useFakeTimers();
        const onLeaderClosed = vi.fn().mockResolvedValue(true);

        const observer = new MockBroadcastChannel(ACL_CHANNEL);
        const broadcasts: unknown[] = [];
        observer.addEventListener('message', (e) => broadcasts.push(e.data));

        subscribeSharedSse({
            endpoint: ACL_ENDPOINT,
            events: ['acl-changed'],
            onEvent: vi.fn(),
            onLeaderClosed,
        });

        MockEventSource.instances[0].emitOpen();
        MockEventSource.instances[0].emitError();
        await vi.advanceTimersByTimeAsync(5_000);

        expect(onLeaderClosed).toHaveBeenCalledTimes(1);
        expect(MockEventSource.instances).toHaveLength(1); // no reconnect
        expect(broadcasts).toContainEqual({ k: 'expired' });

        observer.close();
    });
});

// ── 2. Follower path ─────────────────────────────────────────────────────────

describe('shared-sse · follower', () => {
    beforeEach(() => {
        lockMode.grant = false; // this tab never wins the lock
    });

    it('opens NO EventSource and reacts to sibling broadcasts', () => {
        const onEvent = vi.fn();
        const onStatus = vi.fn();
        const onReopen = vi.fn();
        const onSessionExpired = vi.fn();

        subscribeSharedSse({
            endpoint: ACL_ENDPOINT,
            events: ['acl-changed'],
            onEvent,
            onStatus,
            onReopen,
            onSessionExpired,
        });

        expect(MockEventSource.instances).toHaveLength(0);

        const leaderTab = new MockBroadcastChannel(ACL_CHANNEL);
        leaderTab.postMessage({ k: 'evt', type: 'acl-changed', data: '{}' });
        leaderTab.postMessage({ k: 'status', connected: true });
        leaderTab.postMessage({ k: 'reopen' });
        leaderTab.postMessage({ k: 'expired' });

        expect(onEvent).toHaveBeenCalledWith('acl-changed', '{}');
        expect(onStatus).toHaveBeenCalledWith(true);
        expect(onReopen).toHaveBeenCalledTimes(1);
        expect(onSessionExpired).toHaveBeenCalledTimes(1);

        leaderTab.close();
    });

    it('stops reacting after unsubscribe', () => {
        const onEvent = vi.fn();
        const unsubscribe = subscribeSharedSse({
            endpoint: ACL_ENDPOINT,
            events: ['acl-changed'],
            onEvent,
        });

        unsubscribe();

        const leaderTab = new MockBroadcastChannel(ACL_CHANNEL);
        leaderTab.postMessage({ k: 'evt', type: 'acl-changed', data: '{}' });
        expect(onEvent).not.toHaveBeenCalled();

        leaderTab.close();
    });
});

// ── 3. Teardown grace (StrictMode-style remount) ─────────────────────────────

describe('shared-sse · teardown grace', () => {
    it('reuses the connection across an immediate unmount→remount', () => {
        vi.useFakeTimers();

        const unsubscribe = subscribeSharedSse({
            endpoint: ACL_ENDPOINT,
            events: ['acl-changed'],
            onEvent: vi.fn(),
        });
        expect(MockEventSource.instances).toHaveLength(1);
        const first = MockEventSource.instances[0];

        // StrictMode dev double-invoke: unmount then immediately remount.
        unsubscribe();
        subscribeSharedSse({
            endpoint: ACL_ENDPOINT,
            events: ['acl-changed'],
            onEvent: vi.fn(),
        });

        // Grace window elapses — the connection must NOT have been torn down.
        vi.advanceTimersByTime(500);
        expect(first.closed).toBe(false);
        expect(MockEventSource.instances).toHaveLength(1);
    });

    it('tears the connection down once the last subscriber is gone', () => {
        vi.useFakeTimers();
        const unsubscribe = subscribeSharedSse({
            endpoint: ACL_ENDPOINT,
            events: ['acl-changed'],
            onEvent: vi.fn(),
        });
        const es = MockEventSource.instances[0];

        unsubscribe();
        vi.advanceTimersByTime(500);
        expect(es.closed).toBe(true);
    });
});

// ── 4. Fallback path (no Web Locks): visibility release ──────────────────────

describe('shared-sse · fallback visibility release', () => {
    beforeEach(() => {
        // Remove Web Locks so the module uses the per-tab EventSource fallback.
        Object.defineProperty(navigator, 'locks', { value: undefined, configurable: true });
    });

    it('releases the socket while hidden and reopens on focus', () => {
        const onStatus = vi.fn();
        const onResume = vi.fn();

        const unsubscribe = subscribeSharedSse({
            endpoint: ACL_ENDPOINT,
            events: ['acl-changed'],
            onEvent: vi.fn(),
            onStatus,
            onResume,
        });

        expect(MockEventSource.instances).toHaveLength(1);
        const first = MockEventSource.instances[0];

        setVisibility('hidden');
        expect(first.closed).toBe(true);
        expect(onStatus).toHaveBeenCalledWith(false);

        setVisibility('visible');
        expect(onResume).toHaveBeenCalledTimes(1);
        expect(MockEventSource.instances).toHaveLength(2);
        expect(MockEventSource.instances[1].closed).toBe(false);

        unsubscribe();
        expect(MockEventSource.instances[1].closed).toBe(true);
    });
});
