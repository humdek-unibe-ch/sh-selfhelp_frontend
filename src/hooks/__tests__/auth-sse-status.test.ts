/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
/**
 * Regression for the shared auth-events SSE-connection store that gates the
 * System Maintenance page's fallback update-status poll. It must start
 * disconnected (so a fresh mount with an active operation still polls until SSE
 * is confirmed up), reflect connect/disconnect, and notify subscribers so React
 * re-evaluates the fallback interval.
 */
import { afterEach, describe, it, expect } from 'vitest';
import {
    getAuthSseConnected,
    setAuthSseConnected,
    __resetAuthSseStatusForTests,
} from '../auth-sse-status';

afterEach(() => {
    __resetAuthSseStatusForTests();
});

describe('auth-sse-status store', () => {
    it('starts disconnected so the fallback poll is allowed until SSE opens', () => {
        expect(getAuthSseConnected()).toBe(false);
    });

    it('reflects connect / disconnect transitions', () => {
        setAuthSseConnected(true);
        expect(getAuthSseConnected()).toBe(true);
        setAuthSseConnected(false);
        expect(getAuthSseConnected()).toBe(false);
    });

    it('is idempotent for repeated identical sets', () => {
        setAuthSseConnected(true);
        setAuthSseConnected(true);
        expect(getAuthSseConnected()).toBe(true);
    });
});
