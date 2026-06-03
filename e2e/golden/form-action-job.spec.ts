/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
/**
 * Golden workflow (web): a finished form submission triggers the
 * action → scheduled-job chain.
 *
 * This is the frontend twin of the backend `FormActionJobChainTest`. It
 * exercises the real stack end-to-end through the UI:
 *   1. A QA user logs in (perf budget: login).
 *   2. They open the QA form page and fill it.
 *   3. They submit (perf budget: form submit).
 *   4. The public effect — a success Alert — is asserted (canonical
 *      Testing Rule 17: assert public/domain-visible effects first).
 *
 * The scheduled-job side of the chain is verified by the backend golden
 * test against the DB/queue; here we assert the user-visible outcome.
 *
 * Requires a prepared QA stack + QA env (see e2e/utils/env.ts). The spec
 * skips cleanly when that env is absent so it never fails on a machine
 * without a running stack.
 */
import { test, expect } from '@playwright/test';
import { qaEnv, isQaConfigured } from '../utils/env';
import { gotoLogin } from '../utils/loginAs';
import { measure, PERF_BUDGETS } from '../utils/perf';

test.describe('golden: finished form submission triggers the action→job chain', () => {
    test.skip(
        !isQaConfigured(),
        'Set QA_USER_EMAIL + QA_USER_PASSWORD + QA_FORM_PAGE_KEYWORD (and run a QA stack) to execute the golden E2E.',
    );

    test('submitting the QA form shows the success alert within the perf budget', async ({ page }) => {
        const env = qaEnv();

        // Open the login page + enter credentials (page-load + data entry are
        // NOT part of the canonical "login" budget, which is the auth round-trip).
        await gotoLogin(page, env.loginKeyword);
        await page.locator('input[type="email"]').first().fill(env.email);
        await page.locator('input[type="password"]').first().fill(env.password);

        // Budget the actual login: submit → auth response. The post-login home
        // navigation/render is a separate page-load concern, not "login".
        await measure('login', PERF_BUDGETS.loginMs, async () => {
            await Promise.all([
                page.waitForResponse(
                    (res) =>
                        res.url().includes('/api/auth/login') &&
                        res.request().method() === 'POST' &&
                        res.status() < 400,
                ),
                page.getByRole('button', { name: /sign in|log ?in/i }).click(),
            ]);
        });

        // Correctness gate (untimed): the app must leave the login page.
        await expect(page, 'login should navigate away from the login page').not.toHaveURL(
            new RegExp(`/${env.loginKeyword}(\\b|/|$)`),
            { timeout: 10_000 },
        );

        await page.goto(`/${env.formPageKeyword}`);

        const fieldEntries = Object.entries(env.formFields);
        expect(fieldEntries.length, 'QA_FORM_FIELDS must define at least one field').toBeGreaterThan(0);
        for (const [name, value] of fieldEntries) {
            await page.locator(`[name="${name}"]`).first().fill(String(value));
        }

        // Budget the submit round-trip (the canonical "form submit" latency);
        // the success-alert render below is the correctness assertion.
        await measure('formSubmit', PERF_BUDGETS.formSubmitMs, async () => {
            await Promise.all([
                page.waitForResponse(
                    (res) =>
                        res.url().includes('/forms/submit') &&
                        res.request().method() === 'POST' &&
                        res.status() < 400,
                ),
                page.getByRole('button', { name: new RegExp(env.submitLabel, 'i') }).click(),
            ]);
        });

        // Public effect (canonical Testing Rule 17): the FormStyle success Alert.
        await expect(page.getByText('Success', { exact: false })).toBeVisible();
        // No error alert should be present after a successful submission.
        await expect(page.getByText(/failed to submit/i)).toHaveCount(0);
    });
});
