/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
/**
 * Opt-in BFF diagnostics for the live-preview / auth-SSE investigation.
 *
 * The reported symptom is: after using the full-screen Live Preview (opened in
 * a NEW TAB), `/api/auth/events` "breaks" and every subsequent request becomes
 * slow / the session looks broken. The most likely mechanisms are
 *   (a) same-origin connection pile-up — each tab holds a long-lived SSE that
 *       keeps an UPSTREAM Mercure fetch alive on the Node side; if those do not
 *       tear down (tab close / reconnect leak) they exhaust the dev server's
 *       request concurrency and queue everything else, and
 *   (b) token-rotation / silent-refresh races in the catch-all proxy.
 *
 * This module measures BOTH without changing any behaviour: every export is a
 * no-op unless `PREVIEW_DIAG=1` (or `NEXT_PUBLIC_PREVIEW_DIAG=1`) is set, so it
 * is safe to leave in place and ships dark in production.
 *
 * Enable for a repro session (then read the dev-server console):
 *
 *   PREVIEW_DIAG=1 npm run dev
 *
 * Look for `auth-events stream open/close` with a climbing `active` count that
 * never drops back to ~1 per open tab (→ leak / exhaustion), or `proxy` lines
 * whose `ms` balloons once a preview tab is open (→ queuing), plus
 * `401 -> refresh` storms.
 */

const ENABLED =
    process.env.PREVIEW_DIAG === '1' || process.env.NEXT_PUBLIC_PREVIEW_DIAG === '1';

export function bffDiagEnabled(): boolean {
    return ENABLED;
}

/** Concurrency counters keyed by name, scoped to this Node process. */
const counters = new Map<string, number>();

/** Increment a named counter; returns the new value (0 when diag is off). */
export function bffDiagInc(key: string): number {
    if (!ENABLED) return 0;
    const next = (counters.get(key) ?? 0) + 1;
    counters.set(key, next);
    return next;
}

/** Decrement a named counter; returns the new value (0 when diag is off). */
export function bffDiagDec(key: string): number {
    if (!ENABLED) return 0;
    const next = Math.max(0, (counters.get(key) ?? 0) - 1);
    counters.set(key, next);
    return next;
}

/** One-line structured log on the opt-in diagnostics channel. */
export function bffDiagLog(scope: string, message: string, fields?: Record<string, unknown>): void {
    if (!ENABLED) return;
    const suffix = fields ? ` ${JSON.stringify(fields)}` : '';
    // eslint-disable-next-line no-console -- opt-in diagnostics channel, gated by env flag
    console.info(`[bff-diag ${new Date().toISOString()}] ${scope} ${message}${suffix}`);
}
