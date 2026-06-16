/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
/**
 * Shared connection state for the admin plugin Mercure/SSE stream.
 *
 * The policy (operator-chosen) is: SSE-driven, with NO time-based background
 * polling. A short fallback poll runs ONLY while the SSE stream is disconnected
 * AND an operation is in flight, and stops the moment SSE reconnects.
 *
 * `useAdminPluginsRealtime` owns the single `EventSource` and reports its state
 * here; the plugin React Query hooks read {@link usePluginSseConnected} to
 * decide whether the fallback poll is allowed to run. Kept as a tiny external
 * store (not React context) so the producer (mounted once in the shell) and the
 * consumers (the plugin hooks) stay decoupled.
 */
'use client';

import { useSyncExternalStore } from 'react';

let connected = false;
const listeners = new Set<() => void>();

function emit(): void {
    for (const listener of listeners) listener();
}

/** Report the live SSE connection state (called by `useAdminPluginsRealtime`). */
export function setPluginSseConnected(next: boolean): void {
    if (connected === next) return;
    connected = next;
    emit();
}

/** Current SSE connection state (non-reactive read). */
export function getPluginSseConnected(): boolean {
    return connected;
}

function subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => {
        listeners.delete(listener);
    };
}

/**
 * Reactive SSE connection state. `false` until the stream opens, so a fresh
 * mount with an in-flight operation still gets fallback polling until SSE is
 * confirmed up. On the server we report `true` (EventSource is browser-only),
 * so SSR never schedules a client-only fallback poll.
 */
export function usePluginSseConnected(): boolean {
    return useSyncExternalStore(subscribe, getPluginSseConnected, () => true);
}

/** Test-only: reset the module state between unit tests. */
export function __resetPluginSseStatusForTests(): void {
    connected = false;
    listeners.clear();
}
