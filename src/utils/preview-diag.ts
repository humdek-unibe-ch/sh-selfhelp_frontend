/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
/**
 * Opt-in client diagnostics for the live-preview / auth-SSE investigation
 * (companion to `src/app/api/_lib/preview-diag.ts`).
 *
 * NON-BEHAVIORAL: every export is a no-op unless the build was made with
 * `NEXT_PUBLIC_PREVIEW_DIAG=1`. It exists to answer two questions during a
 * repro session:
 *   - how many `EventSource` connections to `/api/auth/events` are live at
 *     once (a healthy session has exactly ONE per tab; >1 or a climbing count
 *     points at duplicate streams / a reconnect leak), and
 *   - when the ACL SSE connects / errors / reconnects, and when the Live
 *     Preview shell mounts / unmounts, so the browser timeline can be lined
 *     up against the server `bff-diag` log.
 *
 * Enable: `NEXT_PUBLIC_PREVIEW_DIAG=1 npm run dev` and read the browser console.
 */

const ENABLED = process.env.NEXT_PUBLIC_PREVIEW_DIAG === '1';

export function previewDiagEnabled(): boolean {
    return ENABLED;
}

/** Live `EventSource` count for `/api/auth/events` in THIS tab. */
let liveSseCount = 0;

/** Adjust the live-SSE counter (+1 on open, -1 on close); returns the total. */
export function previewDiagTrackSse(delta: number): number {
    if (!ENABLED) return 0;
    liveSseCount = Math.max(0, liveSseCount + delta);
    return liveSseCount;
}

/** One-line structured log on the opt-in diagnostics channel. */
export function previewDiagLog(scope: string, message: string, fields?: Record<string, unknown>): void {
    if (!ENABLED) return;
    const stamp = typeof performance !== 'undefined' ? `${performance.now().toFixed(0)}ms` : '';
    // eslint-disable-next-line no-console -- opt-in diagnostics channel, gated by build flag
    console.info(`[preview-diag ${stamp}] ${scope} ${message}`, fields ?? '');
}
