/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { expect, type Page } from '@playwright/test';

/**
 * Log in through the real CMS login page (LoginStyle). Uses input-type
 * selectors so it survives CMS label changes. Resolves once the app has
 * navigated away from the login page (the success path).
 */
export async function loginAs(page: Page, email: string, password: string, loginKeyword = 'login'): Promise<void> {
    await page.goto(`/${loginKeyword}`);
    await page.locator('input[type="email"]').first().fill(email);
    await page.locator('input[type="password"]').first().fill(password);
    await page.getByRole('button', { name: /sign in|log ?in/i }).click();
    await expect(page, 'login should navigate away from the login page').not.toHaveURL(
        new RegExp(`/${loginKeyword}(\\b|/|$)`),
        { timeout: 10_000 },
    );
}
