/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright config for the SelfHelp frontend E2E suite (Slice 7).
 *
 * Specs live under `e2e/`:
 *   - `e2e/golden/`  — golden business-workflow specs (the form→action→job
 *     chain). Slower than 10s ⇒ golden tier (canonical Testing Rule 19).
 *   - `e2e/utils/`   — shared helpers (loginAs, perf budgets, env).
 *
 * The suite runs against a real running stack (frontend + backend + test
 * DB + Mercure). `BASE_URL` selects the target; CI (`e2e-golden.yml`)
 * brings the stack up first. On failure we keep traces, screenshots and
 * video as CI artifacts (canonical Testing Rule 26).
 *
 * Vitest owns `src/**` unit/component tests; this config is isolated to
 * `e2e/` so the two runners never collide.
 */
export default defineConfig({
    testDir: './e2e',
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    workers: process.env.CI ? 1 : undefined,
    timeout: 60_000,
    expect: {
        timeout: 10_000,
        // Deterministic visual diffs (Slice 11): disable animations + hide the
        // text caret so screenshots are stable, with a small tolerance for
        // sub-pixel font rendering. Baselines are Linux (CI) — see the
        // visual-snapshots workflow.
        toHaveScreenshot: {
            animations: 'disabled',
            caret: 'hide',
            maxDiffPixelRatio: 0.02,
        },
    },
    reporter: process.env.CI
        ? [['list'], ['html', { open: 'never' }], ['junit', { outputFile: 'playwright-report/results.xml' }]]
        : [['list']],
    use: {
        baseURL: process.env.BASE_URL ?? 'http://localhost:3000',
        trace: 'on-first-retry',
        screenshot: 'only-on-failure',
        video: 'retain-on-failure',
    },
    projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
