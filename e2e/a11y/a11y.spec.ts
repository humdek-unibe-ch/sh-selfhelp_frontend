/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
/**
 * Accessibility checks (canonical Testing Rule 34, Slice 11).
 *
 * Runs axe-core on the four surfaces the rule names:
 *   1. the login page (public),
 *   2. the public form page (the QA form the golden flow drives),
 *   3. the admin page editor (auth required),
 *   4. a plugin admin page (auth required, optional).
 *
 * Each test fails only on `serious`/`critical` WCAG A/AA violations (see
 * `expectNoSeriousA11yViolations`). The suite is env-gated: the public checks
 * need a running stack (`isQaConfigured`), the admin checks need admin
 * credentials (`isAdminConfigured`), and the plugin check additionally needs
 * `QA_PLUGIN_ADMIN_PATH`. Anything not configured skips cleanly so the suite
 * never fails on a machine without that part of the stack.
 */
import { test } from '@playwright/test';
import { qaEnv, isQaConfigured } from '../utils/env';
import { adminCreds, isAdminConfigured, a11yTargets } from '../utils/targets';
import { loginAs } from '../utils/loginAs';
import { expectNoSeriousA11yViolations } from '../utils/a11y';

test.describe('a11y: core public + admin surfaces have no serious/critical violations', () => {
    test.skip(!isQaConfigured(), 'Set the QA_* env (and run a QA stack) to execute the accessibility suite.');

    test('login page is accessible', async ({ page }) => {
        await page.goto(a11yTargets().loginPath);
        await expectNoSeriousA11yViolations(page, 'login page');
    });

    test('public form page is accessible', async ({ page }) => {
        await page.goto(`/${qaEnv().formPageKeyword}`);
        await expectNoSeriousA11yViolations(page, 'public form page');
    });

    test('admin page editor is accessible', async ({ page }) => {
        test.skip(!isAdminConfigured(), 'Set QA_ADMIN_EMAIL + QA_ADMIN_PASSWORD to execute admin a11y checks.');
        const admin = adminCreds();
        await loginAs(page, admin.email, admin.password, admin.loginKeyword);
        await page.goto(a11yTargets().adminEditorPath);
        await expectNoSeriousA11yViolations(page, 'admin page editor');
    });

    test('plugin admin page is accessible', async ({ page }) => {
        const { pluginAdminPath } = a11yTargets();
        test.skip(
            !isAdminConfigured() || pluginAdminPath === '',
            'Set QA_ADMIN_EMAIL + QA_ADMIN_PASSWORD + QA_PLUGIN_ADMIN_PATH to execute the plugin admin a11y check.',
        );
        const admin = adminCreds();
        await loginAs(page, admin.email, admin.password, admin.loginKeyword);
        await page.goto(pluginAdminPath);
        await expectNoSeriousA11yViolations(page, 'plugin admin page');
    });
});
