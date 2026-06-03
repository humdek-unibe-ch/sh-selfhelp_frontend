/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { expect, type Page } from '@playwright/test';

/**
 * Open the real CMS login page (LoginStyle). Kept separate from the
 * authentication action so callers can time the login itself (the canonical
 * "login" perf budget is the auth round-trip, NOT navigating to / rendering
 * the login page).
 */
export async function gotoLogin(page: Page, loginKeyword = 'login'): Promise<void> {
    await page.goto(`/${loginKeyword}`);
}

/**
 * Authenticate on an already-open login page: fill the credentials, submit,
 * and resolve once the app has navigated away from the login page (success).
 * Uses input-type selectors so it survives CMS label changes.
 */
export async function submitLogin(
    page: Page,
    email: string,
    password: string,
    loginKeyword = 'login',
): Promise<void> {
    await page.locator('input[type="email"]').first().fill(email);
    await page.locator('input[type="password"]').first().fill(password);
    await page.getByRole('button', { name: /sign in|log ?in/i }).click();
    await expect(page, 'login should navigate away from the login page').not.toHaveURL(
        new RegExp(`/${loginKeyword}(\\b|/|$)`),
        { timeout: 10_000 },
    );
}

/**
 * Log in through the real CMS login page (navigate + authenticate). Convenience
 * wrapper for specs that do not need to time the two phases separately.
 */
export async function loginAs(page: Page, email: string, password: string, loginKeyword = 'login'): Promise<void> {
    await gotoLogin(page, loginKeyword);
    await submitLogin(page, email, password, loginKeyword);
}
