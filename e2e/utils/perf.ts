/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
/**
 * Performance budgets for critical flows (canonical Testing Rule 29).
 *
 * In the test env: login < 500 ms, admin pages list < 1000 ms, form
 * submit < 1000 ms. A run slower than 2× the budget BLOCKS; between 1.5×
 * and 2× it warns. `measure` wraps the timed action and asserts the hard
 * limit, logging timing so regressions are visible in CI output.
 *
 * Hard-limit scaling: `SELFHELP_E2E_PERF_HARD_MULTIPLIER` (default 1) scales
 * ONLY the blocking limit — never the warn threshold, so slow runs are always
 * visible. The harness sets it > 1 when the backend runs on a single-threaded
 * `php -S` (Windows has no `PHP_CLI_SERVER_WORKERS` fork), where the browser's
 * concurrent requests serialise and inflate end-to-end timings even though the
 * backend API itself is fast (~100 ms). CI runs a multi-worker server, so it
 * keeps the strict default and still gates real regressions.
 */
import { expect } from '@playwright/test';

export const PERF_BUDGETS = {
    loginMs: 500,
    adminPagesListMs: 1000,
    formSubmitMs: 1000,
} as const;

function hardLimitMultiplier(): number {
    const raw = Number(process.env.SELFHELP_E2E_PERF_HARD_MULTIPLIER ?? '1');
    return Number.isFinite(raw) && raw >= 1 ? raw : 1;
}

export async function measure<T>(label: string, budgetMs: number, action: () => Promise<T>): Promise<T> {
    const start = Date.now();
    const result = await action();
    const elapsed = Date.now() - start;

    const multiplier = hardLimitMultiplier();
    const hardLimit = budgetMs * 2 * multiplier; // > 2× (×multiplier) blocks
    const warnLimit = budgetMs * 1.5; // 1.5× of the strict budget always warns
    const scaled = multiplier > 1 ? ` ×${multiplier} single-threaded` : '';

    // eslint-disable-next-line no-console
    console.log(`[perf] ${label}: ${elapsed}ms (budget ${budgetMs}ms, block > ${hardLimit}ms${scaled})`);
    if (elapsed > warnLimit) {
        // eslint-disable-next-line no-console
        console.warn(`[perf][WARN] ${label} ${elapsed}ms exceeds 1.5× budget (${warnLimit}ms)`);
    }

    expect(elapsed, `${label} exceeded perf budget (block > ${hardLimit}ms)`).toBeLessThanOrEqual(hardLimit);
    return result;
}
