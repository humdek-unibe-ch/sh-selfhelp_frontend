/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
/**
 * Golden workflow (web): CMS Apps operator path from the user guide —
 * import Team Members template → manage content → live preview.
 */
import { test, expect } from '@playwright/test';
import { loginAs } from '../utils/loginAs';
import { cmsAppsE2eEnv, isCmsAppsE2eConfigured } from '../utils/cmsApps';

test.describe('golden: CMS Apps Team Members operator workflow', () => {
    test.skip(
        !isCmsAppsE2eConfigured(),
        'Set QA_ADMIN_EMAIL + QA_ADMIN_PASSWORD (and run a QA stack) to execute the CMS Apps golden E2E.',
    );

    test('imports Team Members, opens manage content, and reaches live preview', async ({ page }) => {
        const env = cmsAppsE2eEnv();

        await loginAs(page, env.email, env.password, env.loginKeyword);
        await page.goto('/admin/cms-apps');

        await page.getByRole('button', { name: 'Import template' }).click();
        const dialog = page.getByRole('dialog', { name: /page export \/ import/i });
        await expect(dialog).toBeVisible({ timeout: 15_000 });

        const teamCard = dialog.locator('div').filter({ hasText: /^Team members/i }).first();
        await expect(teamCard).toBeVisible({ timeout: 20_000 });
        await teamCard.getByRole('button', { name: /use this template/i }).click();

        await dialog.getByLabel('Keyword prefix').fill(env.keywordPrefix);
        await dialog.getByLabel('Route prefix').fill(env.routePrefix);

        await dialog.getByRole('button', { name: /^validate$/i }).click();
        await expect(dialog.getByText('Bundle is valid')).toBeVisible({ timeout: 30_000 });

        await Promise.all([
            page.waitForResponse(
                (res) =>
                    res.url().includes('/admin/pages/import') &&
                    res.request().method() === 'POST' &&
                    res.status() < 400,
            ),
            dialog.getByRole('button', { name: /^import$/i }).click(),
        ]);

        await expect(page.getByText(/pages imported/i)).toBeVisible({ timeout: 20_000 });
        await dialog.getByRole('button', { name: /^close$/i }).click();

        await page.goto('/admin/cms-apps');
        const appRow = page.getByRole('row').filter({ hasText: /team members/i }).first();
        await expect(appRow).toBeVisible({ timeout: 20_000 });

        await appRow.getByRole('link', { name: /manage content/i }).click();
        await expect(page.getByRole('heading', { name: /team members/i })).toBeVisible({ timeout: 20_000 });
        await expect(page.getByText('CMS content')).toBeVisible();

        await page.goto('/admin/cms-apps');
        const previewRow = page.getByRole('row').filter({ hasText: /team members/i }).first();
        const previewPopup = page.waitForEvent('popup');
        await previewRow.getByRole('button', { name: /live preview team members/i }).click();
        const previewPage = await previewPopup;
        await expect(previewPage).toHaveURL(/\/admin\/preview\//, { timeout: 20_000 });
        await previewPage.close();
    });
});
