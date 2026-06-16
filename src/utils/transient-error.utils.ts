/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
/**
 * Transient-error classification for the BFF/API layer.
 *
 * A SelfHelp instance is briefly unavailable whenever the manager restarts its
 * Symfony services — exactly what happens while a plugin install / uninstall /
 * update or a system update is applied. During that window requests come back
 * as network errors or 5xx (Traefik 502/503/504, or a 500 from a backend that
 * is mid-boot). These are TRANSIENT: the right reaction is to retry and show a
 * quiet "reconnecting" state, never to surface a dead error screen and never to
 * log the operator out (the BFF already keeps the session — see
 * `callSymfonyRefreshToken`).
 *
 * Shared by the Axios client (safe-method retry), the plugin/admin React Query
 * reads (retry policy) and the UI (reconnecting vs. fatal classification) so
 * "what counts as transient" is defined once.
 */
import { isAxiosError } from 'axios';

/**
 * True when an error is a transient backend-availability blip rather than a
 * genuine failure the operator must act on.
 *
 *   - no HTTP response at all → network error / timeout / aborted connection;
 *   - any 5xx → gateway (502/503/504) while restarting, or a 500 from a backend
 *     that is briefly mid-boot.
 *
 * 4xx (incl. a real `401 logged_in:false`) is NEVER transient — it is a
 * deliberate verdict from a backend that was reached.
 */
export function isTransientApiError(error: unknown): boolean {
    if (isAxiosError(error)) {
        if (!error.response) return true; // network error / timeout / no response
        return error.response.status >= 500;
    }
    // A raw fetch/TypeError (e.g. "Failed to fetch") is a network blip too.
    if (error instanceof Error) {
        return /network|fetch|timeout|ECONNREFUSED|ECONNRESET|EAI_AGAIN/i.test(error.message);
    }
    return false;
}

/** Exponential backoff (ms) for transient retries, capped so it stays snappy. */
export function transientRetryDelay(attemptIndex: number): number {
    return Math.min(1000 * 2 ** attemptIndex, 5000);
}

/**
 * React Query `retry` predicate: keep retrying ONLY transient errors, up to
 * `maxRetries`, so a restart window is ridden out automatically while a genuine
 * error still surfaces promptly. Defaults tuned to cover a typical
 * service-restart window (~30s) without hammering forever.
 */
export function makeTransientRetry(maxRetries = 8) {
    return (failureCount: number, error: unknown): boolean =>
        failureCount < maxRetries && isTransientApiError(error);
}
