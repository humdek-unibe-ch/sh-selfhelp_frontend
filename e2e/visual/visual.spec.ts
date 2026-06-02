/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
/**
 * Visual-regression screenshots (Slice 11).
 *
 * Captures stable full-page screenshots of 3 public pages, 3 admin pages, and
 * the SurveyJS runtime, and compares them against committed baselines
 * (`toHaveScreenshot`). Baselines are platform-specific and are generated /
 * refreshed in CI (Linux) via the labelled `visual-snapshots` workflow — never
 * by blindly running `--update-snapshots` locally to make a diff go away
 * (canonical Testing Rule 18: snapshot updates are intentional and reviewed).
 *
 * Env-gated like the rest of the e2e suite: public shots need a running stack
 * (`isQaConfigured`), admin shots need admin credentials (`isAdminConfigured`),
 * and the SurveyJS shot needs `QA_SURVEY_RUNTIME_PATH`. Animations are disabled
 * and the caret is hidden (playwright.config.ts) so shots are deterministic.
 */
import { test, expect, type Page } from '@playwright/test';
import { isQaConfigured } from '../utils/env';
import { adminCreds, isAdminConfigured, visualTargets } from '../utils/targets';
import { loginAs } from '../utils/loginAs';

/** Stable, filesystem-safe snapshot name for a route path. */
function snapshotName(prefix: string, path: string): string {
    const slug = path.replace(/^\/+/, '').replace(/\/+/g, '-').replace(/[^a-z0-9-]/gi, '_') || 'home';
    return `${prefix}-${slug}.png`;
}

/** Settle the page so the screenshot is deterministic. */
async function settle(page: Page): Promise<void> {
    await page.waitForLoadState('networkidle');
    // A small, fixed delay lets late layout (fonts, Mantine theme) settle
    // without depending on a flaky animation event.
    await page.waitForTimeout(300);
}

test.describe('visual: public pages', () => {
    test.skip(!isQaConfigured(), 'Set the QA_* env (and run a QA stack) to capture visual baselines.');

    for (const path of visualTargets().publicPaths) {
        test(`public page ${path} matches its baseline`, async ({ page }) => {
            await page.goto(path);
            await settle(page);
            await expect(page).toHaveScreenshot(snapshotName('public', path), { fullPage: true });
        });
    }

    test('SurveyJS runtime matches its baseline', async ({ page }) => {
        const { surveyRuntimePath } = visualTargets();
        test.skip(surveyRuntimePath === '', 'Set QA_SURVEY_RUNTIME_PATH to capture the SurveyJS runtime baseline.');
        await page.goto(surveyRuntimePath);
        await settle(page);
        await expect(page).toHaveScreenshot('public-surveyjs-runtime.png', { fullPage: true });
    });
});

test.describe('visual: admin pages', () => {
    test.skip(
        !isQaConfigured() || !isAdminConfigured(),
        'Set the QA_* env + QA_ADMIN_EMAIL/QA_ADMIN_PASSWORD (and run a QA stack) to capture admin baselines.',
    );

    test.beforeEach(async ({ page }) => {
        const admin = adminCreds();
        await loginAs(page, admin.email, admin.password, admin.loginKeyword);
    });

    for (const path of visualTargets().adminPaths) {
        test(`admin page ${path} matches its baseline`, async ({ page }) => {
            await page.goto(path);
            await settle(page);
            await expect(page).toHaveScreenshot(snapshotName('admin', path), { fullPage: true });
        });
    }
});
