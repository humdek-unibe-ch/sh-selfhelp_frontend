/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
/**
 * Admin screen: CMS Apps Host Admin surface.
 *
 * Verifies the `/admin/cms-apps` index is reachable and exposes the primary
 * operator controls (create, list, manage-content links) for qa.admin.
 */
import { test, expect } from '@playwright/test';
import { loginAs } from '../utils/loginAs';
import { cmsAppsE2eEnv, isCmsAppsE2eConfigured } from '../utils/cmsApps';

test.describe('admin: CMS Apps screen', () => {
    test.skip(
        !isCmsAppsE2eConfigured(),
        'Set QA_ADMIN_EMAIL + QA_ADMIN_PASSWORD (and run a QA stack) to execute the CMS Apps admin E2E.',
    );

    test('index lists apps and primary actions', async ({ page }) => {
        const env = cmsAppsE2eEnv();
        await loginAs(page, env.email, env.password, env.loginKeyword);
        await page.goto('/admin/cms-apps');

        await expect(page.getByRole('heading', { name: /cms apps/i })).toBeVisible({ timeout: 15_000 });
        await expect(page.getByRole('button', { name: /create app/i })).toBeVisible();
        await expect(page.getByRole('columnheader', { name: /manage content/i })).toBeVisible();
        await expect(page.getByRole('link', { name: /all apps/i })).toBeVisible();
    });

    test('sidebar exposes CMS Apps import template action', async ({ page }) => {
        const env = cmsAppsE2eEnv();
        await loginAs(page, env.email, env.password, env.loginKeyword);
        await page.goto('/admin/cms-apps');

        await page.getByRole('button', { name: 'Import template' }).click();
        await expect(page.getByRole('dialog', { name: /page export \/ import/i })).toBeVisible();
        await expect(page.getByRole('tab', { name: /start from template/i })).toBeVisible();
    });
});
