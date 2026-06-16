/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
/**
 * Regression for transient-error classification.
 *
 * A manager-driven service restart (plugin / system operation) makes the
 * backend briefly unavailable (network error or 5xx). Those are transient and
 * must be retried + shown as "reconnecting", never surfaced as a fatal error
 * and never treated as a logout. A 4xx (incl. a real 401) is a deliberate
 * verdict and is NOT transient.
 */
import { describe, it, expect } from 'vitest';
import { isTransientApiError, makeTransientRetry, transientRetryDelay } from '../transient-error.utils';

/** Minimal axios-error shape — `axios.isAxiosError` only checks this flag. */
function axiosError(status?: number): unknown {
    return status === undefined
        ? { isAxiosError: true } // no response → network error / timeout
        : { isAxiosError: true, response: { status, data: {} } };
}

describe('isTransientApiError', () => {
    it('treats a network error (no response) as transient', () => {
        expect(isTransientApiError(axiosError())).toBe(true);
    });

    it('treats 5xx (502/503/504 gateway, 500 mid-boot) as transient', () => {
        for (const status of [500, 502, 503, 504]) {
            expect(isTransientApiError(axiosError(status))).toBe(true);
        }
    });

    it('does NOT treat 4xx (incl. a real 401) as transient', () => {
        for (const status of [400, 401, 403, 404, 409, 422]) {
            expect(isTransientApiError(axiosError(status))).toBe(false);
        }
    });

    it('treats a raw network-ish Error as transient, other errors not', () => {
        expect(isTransientApiError(new Error('Network Error'))).toBe(true);
        expect(isTransientApiError(new TypeError('Failed to fetch'))).toBe(true);
        expect(isTransientApiError(new Error('validation failed'))).toBe(false);
        expect(isTransientApiError('nope')).toBe(false);
        expect(isTransientApiError(null)).toBe(false);
    });
});

describe('makeTransientRetry', () => {
    it('retries transient errors up to the cap, then stops', () => {
        const retry = makeTransientRetry(3);
        expect(retry(0, axiosError(503))).toBe(true);
        expect(retry(2, axiosError(503))).toBe(true);
        expect(retry(3, axiosError(503))).toBe(false); // cap reached
    });

    it('never retries a non-transient error (e.g. 401/403)', () => {
        const retry = makeTransientRetry(8);
        expect(retry(0, axiosError(401))).toBe(false);
        expect(retry(0, axiosError(403))).toBe(false);
    });
});

describe('transientRetryDelay', () => {
    it('backs off exponentially but caps at 5s', () => {
        expect(transientRetryDelay(0)).toBe(1000);
        expect(transientRetryDelay(1)).toBe(2000);
        expect(transientRetryDelay(2)).toBe(4000);
        expect(transientRetryDelay(3)).toBe(5000); // capped
        expect(transientRetryDelay(10)).toBe(5000);
    });
});
