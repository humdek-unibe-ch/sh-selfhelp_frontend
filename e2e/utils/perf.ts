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
 */
import { expect } from '@playwright/test';

export const PERF_BUDGETS = {
    loginMs: 500,
    adminPagesListMs: 1000,
    formSubmitMs: 1000,
} as const;

export async function measure<T>(label: string, budgetMs: number, action: () => Promise<T>): Promise<T> {
    const start = Date.now();
    const result = await action();
    const elapsed = Date.now() - start;

    const hardLimit = budgetMs * 2; // > 2× blocks
    const warnLimit = budgetMs * 1.5; // 1.5×–2× warns

    // eslint-disable-next-line no-console
    console.log(`[perf] ${label}: ${elapsed}ms (budget ${budgetMs}ms, block > ${hardLimit}ms)`);
    if (elapsed > warnLimit && elapsed <= hardLimit) {
        // eslint-disable-next-line no-console
        console.warn(`[perf][WARN] ${label} ${elapsed}ms exceeds 1.5× budget (${warnLimit}ms)`);
    }

    expect(elapsed, `${label} exceeded 2× perf budget (${hardLimit}ms)`).toBeLessThanOrEqual(hardLimit);
    return result;
}
