/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
/**
 * Shared connection state for the auth-events Mercure/SSE stream owned by
 * {@link useAclEventStream}.
 *
 * The policy (operator-chosen) is SSE-driven with NO time-based background
 * polling: a short fallback poll runs ONLY while the SSE stream is disconnected
 * AND an action is in flight, and stops the moment SSE reconnects. The auth
 * stream multiplexes `acl-changed`, `impersonation-status` and `system-update`,
 * so the System Maintenance page reads {@link useAuthSseConnected} to decide
 * whether its fallback update-status poll is allowed to run.
 *
 * Kept as a tiny external store (not React context) so the producer (mounted
 * once in the client shell) and the consumers stay decoupled.
 */
'use client';

import { useSyncExternalStore } from 'react';

let connected = false;
const listeners = new Set<() => void>();

function emit(): void {
    for (const listener of listeners) listener();
}

/** Report the live auth-SSE connection state (called by `useAclEventStream`). */
export function setAuthSseConnected(next: boolean): void {
    if (connected === next) return;
    connected = next;
    emit();
}

/** Current auth-SSE connection state (non-reactive read). */
export function getAuthSseConnected(): boolean {
    return connected;
}

function subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => {
        listeners.delete(listener);
    };
}

/**
 * Reactive auth-SSE connection state. `false` until the stream opens, so a
 * fresh mount with an in-flight operation still gets fallback polling until SSE
 * is confirmed up. On the server we report `true` (EventSource is browser-only)
 * so SSR never schedules a client-only fallback poll.
 */
export function useAuthSseConnected(): boolean {
    return useSyncExternalStore(subscribe, getAuthSseConnected, () => true);
}

/** Test-only: reset the module state between unit tests. */
export function __resetAuthSseStatusForTests(): void {
    connected = false;
    listeners.clear();
}
