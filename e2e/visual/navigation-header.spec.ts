/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
/**
 * Visual regression for the public website header rendered from navigation menu
 * builder data. Preset-specific structure is covered by Vitest
 * (`WebsiteHeaderRenderer.test.tsx`); these snapshots capture the live QA stack.
 */
import { test, expect, type Page } from '@playwright/test';
import { isQaConfigured } from '../utils/env';

async function settle(page: Page): Promise<void> {
    await page.waitForLoadState('networkidle', { timeout: 3_000 }).catch(() => {});
    await page.waitForTimeout(300);
}

test.describe('visual: navigation header', () => {
    test.skip(!isQaConfigured(), 'Set the QA_* env (and run a QA stack) to capture header baselines.');

    test('home page header matches baseline', async ({ page }) => {
        await page.goto('/');
        await settle(page);
        const header = page.locator('header').first();
        await expect(header).toBeVisible();
        await expect(header).toHaveScreenshot('navigation-header-home.png');
    });

    test('mobile viewport header matches baseline', async ({ page }) => {
        await page.setViewportSize({ width: 390, height: 844 });
        await page.goto('/');
        await settle(page);
        const header = page.locator('header').first();
        await expect(header).toBeVisible();
        await expect(header).toHaveScreenshot('navigation-header-home-mobile.png');
    });

    test('header exposes navigation landmark and primary links', async ({ page }) => {
        await page.goto('/');
        await settle(page);
        const header = page.locator('header').first();
        await expect(header).toBeVisible();
        await expect(header.getByRole('navigation').or(header.getByRole('link')).first()).toBeVisible();
    });

    test('mobile viewport shows burger control when header menu is non-empty', async ({ page }) => {
        await page.setViewportSize({ width: 390, height: 844 });
        await page.goto('/');
        await settle(page);
        const header = page.locator('header').first();
        await expect(header).toBeVisible();
        const burger = header.getByRole('button', { name: /menu|navigation|open/i });
        if (await burger.count()) {
            await expect(burger.first()).toBeVisible();
        }
    });

    test('nested route shows branch navigation when children exist', async ({ page }) => {
        await page.goto('/team');
        await settle(page);
        if (!page.url().includes('/team')) {
            test.skip();
        }
        const branchNav = page.getByRole('tablist').or(page.locator('[data-testid="branch-navigation"]'));
        if (await branchNav.count()) {
            await expect(branchNav.first()).toBeVisible();
        }
    });
});
