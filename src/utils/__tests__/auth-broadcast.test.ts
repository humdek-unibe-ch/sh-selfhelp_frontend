/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
/**
 * Regression for the cross-tab auth sync (`utils/auth-broadcast.ts`).
 *
 * Verifies a sibling tab's `logged-out` / `logged-in` message reaches the
 * subscriber, that unknown payloads are ignored, and that unsubscribe stops
 * delivery. The module uses a single channel instance per tab (so it never
 * receives its OWN posts); the test simulates the "other tab" with a second
 * `BroadcastChannel` of the same name.
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { subscribeAuthBroadcast, broadcastAuthChange, type AuthBroadcastMessage } from '../auth-broadcast';

const CHANNEL_NAME = 'selfhelp-auth';
const hasBroadcastChannel = typeof BroadcastChannel !== 'undefined';

/** Let queued BroadcastChannel messages flush. */
const flush = () => new Promise((resolve) => setTimeout(resolve, 20));

describe('auth-broadcast', () => {
    const openChannels: BroadcastChannel[] = [];
    const unsubscribers: Array<() => void> = [];

    afterEach(() => {
        while (unsubscribers.length) unsubscribers.pop()?.();
        while (openChannels.length) openChannels.pop()?.close();
    });

    it('never throws and returns an unsubscribe function even without BroadcastChannel', () => {
        const unsub = subscribeAuthBroadcast(() => {});
        unsubscribers.push(unsub);
        expect(typeof unsub).toBe('function');
        expect(() => broadcastAuthChange({ type: 'logged-out' })).not.toThrow();
    });

    it.runIf(hasBroadcastChannel)('delivers a sibling tab logged-out to the subscriber', async () => {
        const received: AuthBroadcastMessage[] = [];
        unsubscribers.push(subscribeAuthBroadcast((m) => received.push(m)));

        const otherTab = new BroadcastChannel(CHANNEL_NAME);
        openChannels.push(otherTab);
        otherTab.postMessage({ type: 'logged-out' });
        await flush();

        expect(received).toEqual([{ type: 'logged-out' }]);
    });

    it.runIf(hasBroadcastChannel)('ignores unknown message shapes', async () => {
        const handler = vi.fn();
        unsubscribers.push(subscribeAuthBroadcast(handler));

        const otherTab = new BroadcastChannel(CHANNEL_NAME);
        openChannels.push(otherTab);
        otherTab.postMessage({ type: 'something-else' });
        otherTab.postMessage('garbage');
        otherTab.postMessage(null);
        await flush();

        expect(handler).not.toHaveBeenCalled();
    });

    it.runIf(hasBroadcastChannel)('stops delivering after unsubscribe', async () => {
        const handler = vi.fn();
        const unsub = subscribeAuthBroadcast(handler);
        unsub();

        const otherTab = new BroadcastChannel(CHANNEL_NAME);
        openChannels.push(otherTab);
        otherTab.postMessage({ type: 'logged-in' });
        await flush();

        expect(handler).not.toHaveBeenCalled();
    });
});
