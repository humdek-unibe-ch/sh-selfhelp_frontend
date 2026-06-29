/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
/**
 * Cross-tab SHARED Server-Sent Events.
 *
 * ## Why
 *
 * Every authenticated tab used to open its OWN `EventSource` to each BFF SSE
 * route (`/api/auth/events` for ACL/impersonation/system-update, and
 * `/api/plugins/events` for the plugin manager). An SSE connection is held open
 * for the lifetime of the tab, and browsers cap concurrent connections at
 * ~6 per origin **shared across all tabs** on HTTP/1.1 (which is what
 * `next dev` serves). An admin therefore burned TWO of those six slots per tab,
 * so ~3 tabs exhausted the pool and every further same-origin request — page
 * loads, the Data Browser's parallel queries, even RSC navigations — queued
 * forever and the tabs appeared to "hang". (In production behind HTTP/2 the
 * limit is ~100 multiplexed streams, so the symptom is dev-dominant.)
 *
 * ## What this does
 *
 * For a given SSE endpoint, only ONE tab in the browser ("the leader") holds the
 * real network `EventSource`. The leader rebroadcasts every event it receives
 * over a same-origin `BroadcastChannel`; all OTHER tabs ("followers") hold no
 * network connection and simply react to those broadcasts. Net effect: ONE
 * connection per stream for the whole browser, regardless of tab count.
 *
 *   - **Leader election** uses the Web Locks API (`navigator.locks.request`):
 *     whichever tab holds the exclusive lock is the leader. When the leader tab
 *     closes the lock auto-releases and a waiting tab instantly takes over and
 *     opens a fresh `EventSource` — no gap, no thundering herd.
 *   - **Fan-out + control** travel over `BroadcastChannel`: data events
 *     (`evt`), feed up/down (`status`), reconcile-after-drop (`reopen`), session
 *     expiry (`expired`), and a late-joiner status `ping`.
 *   - **Visibility**: followers already hold nothing, so background tabs cost
 *     zero connections. In the no-Web-Locks FALLBACK (old browsers / jsdom)
 *     each tab keeps its own `EventSource` but RELEASES it while the tab is
 *     hidden and reopens on focus, so background tabs still stop stacking.
 *   - **Graceful degradation**: without `BroadcastChannel` + Web Locks the
 *     module falls back to a per-tab `EventSource` (today's behaviour) so
 *     realtime never silently breaks.
 *
 * The module is framework-agnostic; React hooks (`useAclEventStream`,
 * `useAdminPluginsRealtime`) subscribe through {@link subscribeSharedSse} and
 * keep their own cache-invalidation logic. No-op on the server and where
 * `EventSource` is unavailable, so callers never need to guard.
 */
'use client';

import { previewDiagLog, previewDiagTrackSse } from './preview-diag';

/** Callbacks a subscriber supplies. All optional except {@link onEvent}. */
export interface SharedSseSubscriber {
    /** A named SSE event arrived (in this tab, whether via the leader's socket or a sibling's broadcast). */
    onEvent: (type: string, data: string) => void;
    /** The shared feed went up (`true`) or down (`false`). Runs in every tab. */
    onStatus?: (connected: boolean) => void;
    /** The feed RECONNECTED after a drop — events were likely missed, so reconcile. Runs in every tab. */
    onReopen?: () => void;
    /**
     * Leader-only: the socket closed (4xx / network). Return `true` to STOP
     * auto-reconnect (e.g. the session expired and the caller redirected to
     * login). Other tabs are told via the `expired` control message.
     */
    onLeaderClosed?: () => Promise<boolean> | boolean;
    /** A sibling leader reported the session expired. Runs in follower tabs. */
    onSessionExpired?: () => void;
    /** This tab became visible again after being hidden — light reconcile. */
    onResume?: () => void;
}

/** Configuration for a shared subscription. */
export interface SharedSseConfig extends SharedSseSubscriber {
    /** Same-origin SSE URL, e.g. `/api/auth/events`. Also derives the lock + channel names. */
    endpoint: string;
    /** Named SSE events to listen for and fan out. */
    events: readonly string[];
}

/** Wire format on the BroadcastChannel. Kept terse — it is hot-ish on bursts. */
type SharedSseMessage =
    | { k: 'evt'; type: string; data: string }
    | { k: 'status'; connected: boolean }
    | { k: 'reopen' }
    | { k: 'expired' }
    | { k: 'ping' };

const MAX_RECONNECT_DELAY_MS = 30_000;
const INITIAL_RECONNECT_DELAY_MS = 1_000;
/**
 * Defer coordinator teardown so React 18 StrictMode's dev-only
 * unmount→remount (and fast route transitions) reuse the SAME connection
 * instead of tearing it down and racing a new leader election.
 */
const TEARDOWN_GRACE_MS = 100;

interface Coordinator {
    endpoint: string;
    events: readonly string[];
    subscribers: Set<SharedSseSubscriber>;
    channel: BroadcastChannel;
    channelListener: (e: MessageEvent) => void;
    visibilityListener: () => void;
    lockAbort: AbortController | null;
    releaseLock: (() => void) | null;
    isLeader: boolean;
    es: EventSource | null;
    reconnectTimer: number | null;
    reconnectDelay: number;
    hasConnectedBefore: boolean;
    stopped: boolean;
    teardownTimer: number | null;
}

const coordinators = new Map<string, Coordinator>();

function lockName(endpoint: string): string {
    return `selfhelp-sse-leader:${endpoint}`;
}

function channelName(endpoint: string): string {
    return `selfhelp-sse:${endpoint}`;
}

/** Web Locks + BroadcastChannel + EventSource are all required for the shared path. */
function supportsSharedSse(): boolean {
    return (
        typeof window !== 'undefined' &&
        typeof EventSource !== 'undefined' &&
        typeof BroadcastChannel !== 'undefined' &&
        typeof navigator !== 'undefined' &&
        'locks' in navigator &&
        Boolean((navigator as Navigator).locks)
    );
}

// ──────────────────────────────────────────────────────────────────────────
// Public API
// ──────────────────────────────────────────────────────────────────────────

/**
 * Subscribe this tab to a shared SSE stream. Returns an unsubscribe function.
 * No-op (returns a no-op cleanup) on the server or where `EventSource` is
 * unavailable.
 */
export function subscribeSharedSse(config: SharedSseConfig): () => void {
    if (typeof window === 'undefined' || typeof EventSource === 'undefined') {
        return () => {};
    }
    const sub: SharedSseSubscriber = {
        onEvent: config.onEvent,
        onStatus: config.onStatus,
        onReopen: config.onReopen,
        onLeaderClosed: config.onLeaderClosed,
        onSessionExpired: config.onSessionExpired,
        onResume: config.onResume,
    };
    if (supportsSharedSse()) {
        return joinSharedCoordinator(config, sub);
    }
    return startOwnEventSource(config, sub);
}

// ──────────────────────────────────────────────────────────────────────────
// Shared (leader-elected) path
// ──────────────────────────────────────────────────────────────────────────

function joinSharedCoordinator(config: SharedSseConfig, sub: SharedSseSubscriber): () => void {
    let coord = coordinators.get(config.endpoint);
    if (!coord) {
        coord = createCoordinator(config);
        coordinators.set(config.endpoint, coord);
        startLeaderElection(coord);
    }
    const active = coord;
    if (active.teardownTimer !== null) {
        window.clearTimeout(active.teardownTimer);
        active.teardownTimer = null;
    }
    active.subscribers.add(sub);
    // Late joiner: ask whoever is leader for the current feed status so this
    // tab's fallback-poll flag starts correct instead of waiting for the next
    // transition.
    postChannel(active, { k: 'ping' });

    return () => {
        active.subscribers.delete(sub);
        if (active.subscribers.size === 0) {
            active.teardownTimer = window.setTimeout(() => {
                if (active.subscribers.size === 0) {
                    stopCoordinator(active);
                    coordinators.delete(active.endpoint);
                }
            }, TEARDOWN_GRACE_MS);
        }
    };
}

function createCoordinator(config: SharedSseConfig): Coordinator {
    const channel = new BroadcastChannel(channelName(config.endpoint));
    const coord: Coordinator = {
        endpoint: config.endpoint,
        events: config.events,
        subscribers: new Set<SharedSseSubscriber>(),
        channel,
        channelListener: () => {},
        visibilityListener: () => {},
        lockAbort: null,
        releaseLock: null,
        isLeader: false,
        es: null,
        reconnectTimer: null,
        reconnectDelay: INITIAL_RECONNECT_DELAY_MS,
        hasConnectedBefore: false,
        stopped: false,
        teardownTimer: null,
    };
    coord.channelListener = (e: MessageEvent) => handleChannelMessage(coord, e.data as SharedSseMessage);
    channel.addEventListener('message', coord.channelListener);
    coord.visibilityListener = () => {
        if (document.visibilityState === 'visible') {
            for (const s of coord.subscribers) {
                try {
                    s.onResume?.();
                } catch {
                    /* subscriber callbacks are best-effort */
                }
            }
        }
    };
    document.addEventListener('visibilitychange', coord.visibilityListener);
    return coord;
}

function startLeaderElection(coord: Coordinator): void {
    const ac = new AbortController();
    coord.lockAbort = ac;
    void navigator.locks
        .request(lockName(coord.endpoint), { signal: ac.signal }, () =>
            new Promise<void>((resolve) => {
                if (coord.stopped) {
                    resolve();
                    return;
                }
                coord.isLeader = true;
                coord.releaseLock = resolve;
                previewDiagLog('shared-sse', 'became leader', { endpoint: coord.endpoint });
                openLeaderEventSource(coord);
            }),
        )
        .catch(() => {
            // AbortError when we cancel a still-pending request during teardown.
        });
}

function openLeaderEventSource(coord: Coordinator): void {
    if (coord.stopped) return;
    let es: EventSource;
    try {
        es = new EventSource(coord.endpoint);
    } catch {
        return;
    }
    coord.es = es;
    previewDiagLog('shared-sse', 'leader open ES', {
        endpoint: coord.endpoint,
        live: previewDiagTrackSse(1),
    });

    es.addEventListener('open', () => {
        coord.reconnectDelay = INITIAL_RECONNECT_DELAY_MS;
        dispatchStatus(coord, true);
        postChannel(coord, { k: 'status', connected: true });
        if (coord.hasConnectedBefore) {
            // Reconnected after a drop: every tab missed events while the
            // single shared socket was down, so reconcile everywhere.
            dispatchReopen(coord);
            postChannel(coord, { k: 'reopen' });
        }
        coord.hasConnectedBefore = true;
    });

    for (const name of coord.events) {
        es.addEventListener(name, (evt) => {
            const data = (evt as MessageEvent<string>).data ?? '';
            dispatchEvent(coord, name, data);
            postChannel(coord, { k: 'evt', type: name, data });
        });
    }

    es.addEventListener('error', () => {
        void (async () => {
            const current = coord.es;
            if (!current) return;
            dispatchStatus(coord, false);
            postChannel(coord, { k: 'status', connected: false });
            if (current.readyState === EventSource.CLOSED && !coord.stopped) {
                current.close();
                previewDiagTrackSse(-1);
                coord.es = null;
                const stop = await runLeaderClosed(coord);
                if (stop) {
                    postChannel(coord, { k: 'expired' });
                    return;
                }
                if (coord.stopped) return;
                coord.reconnectTimer = window.setTimeout(
                    () => openLeaderEventSource(coord),
                    coord.reconnectDelay,
                );
                coord.reconnectDelay = Math.min(coord.reconnectDelay * 2, MAX_RECONNECT_DELAY_MS);
            }
        })();
    });
}

async function runLeaderClosed(coord: Coordinator): Promise<boolean> {
    let stop = false;
    for (const s of coord.subscribers) {
        if (!s.onLeaderClosed) continue;
        try {
            if (await s.onLeaderClosed()) stop = true;
        } catch {
            /* best-effort */
        }
    }
    return stop;
}

function handleChannelMessage(coord: Coordinator, msg: SharedSseMessage | undefined): void {
    if (!msg || typeof msg !== 'object') return;
    switch (msg.k) {
        case 'evt':
            dispatchEvent(coord, msg.type, msg.data);
            break;
        case 'status':
            dispatchStatus(coord, msg.connected);
            break;
        case 'reopen':
            dispatchReopen(coord);
            break;
        case 'expired':
            for (const s of coord.subscribers) {
                try {
                    s.onSessionExpired?.();
                } catch {
                    /* best-effort */
                }
            }
            break;
        case 'ping':
            // Only a connected leader answers, so a late joiner learns the feed
            // is live and disables its fallback poll.
            if (coord.isLeader && coord.es) {
                postChannel(coord, {
                    k: 'status',
                    connected: coord.es.readyState === EventSource.OPEN,
                });
            }
            break;
        default:
            break;
    }
}

function dispatchEvent(coord: Coordinator, type: string, data: string): void {
    for (const s of coord.subscribers) {
        try {
            s.onEvent(type, data);
        } catch {
            /* best-effort */
        }
    }
}

function dispatchStatus(coord: Coordinator, connected: boolean): void {
    for (const s of coord.subscribers) {
        try {
            s.onStatus?.(connected);
        } catch {
            /* best-effort */
        }
    }
}

function dispatchReopen(coord: Coordinator): void {
    for (const s of coord.subscribers) {
        try {
            s.onReopen?.();
        } catch {
            /* best-effort */
        }
    }
}

function postChannel(coord: Coordinator, msg: SharedSseMessage): void {
    try {
        coord.channel.postMessage(msg);
    } catch {
        /* channel closed / unsupported — fan-out is best-effort */
    }
}

function stopCoordinator(coord: Coordinator): void {
    coord.stopped = true;
    if (coord.reconnectTimer !== null) {
        window.clearTimeout(coord.reconnectTimer);
        coord.reconnectTimer = null;
    }
    if (coord.es) {
        coord.es.close();
        previewDiagTrackSse(-1);
        coord.es = null;
    }
    // Release leadership (so a sibling takes over) or cancel a pending request.
    if (coord.releaseLock) {
        coord.releaseLock();
        coord.releaseLock = null;
    } else if (coord.lockAbort) {
        try {
            coord.lockAbort.abort();
        } catch {
            /* ignore */
        }
    }
    document.removeEventListener('visibilitychange', coord.visibilityListener);
    coord.channel.removeEventListener('message', coord.channelListener);
    try {
        coord.channel.close();
    } catch {
        /* ignore */
    }
}

// ──────────────────────────────────────────────────────────────────────────
// Fallback path: per-tab EventSource with visibility release
// ──────────────────────────────────────────────────────────────────────────

function startOwnEventSource(config: SharedSseConfig, sub: SharedSseSubscriber): () => void {
    let es: EventSource | null = null;
    let reconnectTimer: number | null = null;
    let reconnectDelay = INITIAL_RECONNECT_DELAY_MS;
    let cancelled = false;
    let hidden = typeof document !== 'undefined' && document.visibilityState === 'hidden';
    let hasConnectedBefore = false;

    const open = (): void => {
        if (cancelled || hidden || es) return;
        try {
            es = new EventSource(config.endpoint);
        } catch {
            return;
        }
        const current = es;
        previewDiagLog('shared-sse', 'own ES (fallback)', {
            endpoint: config.endpoint,
            live: previewDiagTrackSse(1),
        });

        current.addEventListener('open', () => {
            reconnectDelay = INITIAL_RECONNECT_DELAY_MS;
            try {
                sub.onStatus?.(true);
            } catch {
                /* best-effort */
            }
            if (hasConnectedBefore) {
                try {
                    sub.onReopen?.();
                } catch {
                    /* best-effort */
                }
            }
            hasConnectedBefore = true;
        });

        for (const name of config.events) {
            current.addEventListener(name, (evt) => {
                try {
                    sub.onEvent(name, (evt as MessageEvent<string>).data ?? '');
                } catch {
                    /* best-effort */
                }
            });
        }

        current.addEventListener('error', () => {
            void (async () => {
                if (!es) return;
                try {
                    sub.onStatus?.(false);
                } catch {
                    /* best-effort */
                }
                if (es.readyState === EventSource.CLOSED && !cancelled) {
                    es.close();
                    previewDiagTrackSse(-1);
                    es = null;
                    let stop = false;
                    if (sub.onLeaderClosed) {
                        try {
                            stop = Boolean(await sub.onLeaderClosed());
                        } catch {
                            /* best-effort */
                        }
                    }
                    if (stop || cancelled || hidden) return;
                    reconnectTimer = window.setTimeout(open, reconnectDelay);
                    reconnectDelay = Math.min(reconnectDelay * 2, MAX_RECONNECT_DELAY_MS);
                }
            })();
        });
    };

    const closeEs = (): void => {
        if (reconnectTimer !== null) {
            window.clearTimeout(reconnectTimer);
            reconnectTimer = null;
        }
        if (es) {
            es.close();
            previewDiagTrackSse(-1);
            es = null;
        }
    };

    const onVisibility = (): void => {
        if (document.visibilityState === 'hidden') {
            hidden = true;
            closeEs();
            try {
                sub.onStatus?.(false);
            } catch {
                /* best-effort */
            }
        } else {
            hidden = false;
            try {
                sub.onResume?.();
            } catch {
                /* best-effort */
            }
            open();
        }
    };

    document.addEventListener('visibilitychange', onVisibility);
    open();

    return () => {
        cancelled = true;
        document.removeEventListener('visibilitychange', onVisibility);
        closeEs();
        try {
            sub.onStatus?.(false);
        } catch {
            /* best-effort */
        }
    };
}

// ──────────────────────────────────────────────────────────────────────────
// Test support
// ──────────────────────────────────────────────────────────────────────────

/** Test-only: tear down every coordinator and clear the registry. */
export function __resetSharedSseForTests(): void {
    for (const coord of coordinators.values()) {
        stopCoordinator(coord);
    }
    coordinators.clear();
}
