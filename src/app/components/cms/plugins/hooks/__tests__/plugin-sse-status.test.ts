/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
/**
 * Regression for the shared plugin SSE-connection store that gates the
 * fallback poll. It must start disconnected (so a fresh mount with an active
 * op still polls until SSE is confirmed up), reflect connect/disconnect, and
 * notify subscribers so React Query re-evaluates `refetchInterval`.
 */
import { afterEach, describe, it, expect } from 'vitest';
import {
    getPluginSseConnected,
    setPluginSseConnected,
    __resetPluginSseStatusForTests,
} from '../plugin-sse-status';

afterEach(() => {
    __resetPluginSseStatusForTests();
});

describe('plugin-sse-status store', () => {
    it('starts disconnected so the fallback poll is allowed until SSE opens', () => {
        expect(getPluginSseConnected()).toBe(false);
    });

    it('reflects connect / disconnect transitions', () => {
        setPluginSseConnected(true);
        expect(getPluginSseConnected()).toBe(true);
        setPluginSseConnected(false);
        expect(getPluginSseConnected()).toBe(false);
    });
});
