/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
/**
 * Functional E2E: the auth pages must never render on top of a live session.
 *
 * Regression origin: activating a second account while signed in as admin
 * dropped the user on `/login` with the admin session still active, which reads
 * as a silent logout. The root cause was general — `/login` had no
 * already-authenticated guard, so a typed URL or stale bookmark did the same.
 *
 * These run against a real stack, so they exercise what the Vitest specs mock:
 * the actual httpOnly `sh_auth` cookie, the real `useUserData` round-trip, and
 * the real Next.js client-side navigation.
 *
 * Anonymous cases use a fresh `browser.newContext()` rather than a logout, so a
 * stale auth cookie can never silently put the test on the authenticated
 * branch (the trap called out in the manual test notes).
 */
import { test, expect, type Page } from '@playwright/test';
import { loginAs } from '../utils/loginAs';
import { adminCreds, isAdminConfigured } from '../utils/targets';

const loginKeyword = process.env.QA_LOGIN_KEYWORD ?? 'login';
const loginPath = `/${loginKeyword}`;

/** Matches the login URL, so "did we stay on login?" reads the same everywhere. */
const loginUrlPattern = new RegExp(`/${loginKeyword}(\\b|/|$)`);

/** True when the sign-in form is actually rendered (not just the URL). */
async function isLoginFormVisible(page: Page): Promise<boolean> {
    return page.locator('input[type="password"]').first().isVisible().catch(() => false);
}

test.describe('auth pages: already-authenticated guard', () => {
    test.skip(
        !isAdminConfigured(),
        'Set QA_ADMIN_EMAIL + QA_ADMIN_PASSWORD (and run a QA stack) to execute the auth redirect E2E.',
    );

    test('an authenticated visitor opening /login is redirected away and never sees the form', async ({ page }) => {
        const admin = adminCreds();
        await loginAs(page, admin.email, admin.password, admin.loginKeyword);

        await page.goto(loginPath);

        // The guard must win: no login form, and we must not be sitting on /login.
        await expect(page, 'authenticated /login must redirect away').not.toHaveURL(loginUrlPattern, {
            timeout: 15_000,
        });
        expect(await isLoginFormVisible(page), 'login form must not render over a live session').toBe(false);
    });

    test('the session survives the redirect — the visitor is still signed in afterwards', async ({ page }) => {
        const admin = adminCreds();
        await loginAs(page, admin.email, admin.password, admin.loginKeyword);

        await page.goto(loginPath);
        await expect(page).not.toHaveURL(loginUrlPattern, { timeout: 15_000 });

        // The bug made this look like a logout. Prove the session is intact by
        // reaching an admin-only route that an anonymous visitor cannot load.
        await page.goto('/admin/pages');
        await expect(page, 'admin route must still be reachable after the redirect').toHaveURL(/\/admin\/pages/, {
            timeout: 15_000,
        });
        expect(await isLoginFormVisible(page), 'admin route must not fall back to a login form').toBe(false);
    });

    test('an authenticated visitor is sent to an explicit redirectTo target', async ({ page }) => {
        const admin = adminCreds();
        await loginAs(page, admin.email, admin.password, admin.loginKeyword);

        await page.goto(`${loginPath}?redirectTo=/admin/pages`);

        // The guard honours redirectTo rather than always dumping on home, so a
        // deep link the user was bounced off still resolves.
        await expect(page, 'redirectTo target must be honoured').toHaveURL(/\/admin\/pages/, { timeout: 15_000 });
    });

    test('an anonymous visitor still gets the login form', async ({ browser }) => {
        // Fresh context: no cookies, so this is genuinely the signed-out path
        // and cannot be contaminated by a previous test's session.
        const context = await browser.newContext();
        const page = await context.newPage();

        try {
            await page.goto(loginPath);

            await expect(page, 'anonymous visitor must stay on the login page').toHaveURL(loginUrlPattern);
            await expect(
                page.locator('input[type="password"]').first(),
                'the login form must still render for signed-out users',
            ).toBeVisible({ timeout: 15_000 });
        } finally {
            await context.close();
        }
    });

    test('an authenticated visitor opening /register is redirected away', async ({ page }) => {
        // Same guard class, pre-existing in RegisterStyle: pinned here so the
        // two auth entry points cannot drift apart.
        const admin = adminCreds();
        await loginAs(page, admin.email, admin.password, admin.loginKeyword);

        await page.goto('/register');

        await expect(page, 'authenticated /register must redirect away').not.toHaveURL(/\/register(\b|\/|$)/, {
            timeout: 15_000,
        });
    });
});

test.describe('reset-password: session-aware exits', () => {
    test.skip(
        !isAdminConfigured(),
        'Set QA_ADMIN_EMAIL + QA_ADMIN_PASSWORD (and run a QA stack) to execute the reset-password redirect E2E.',
    );

    test('offers the way home instead of a sign-in link when a session is active', async ({ page }) => {
        const admin = adminCreds();
        await loginAs(page, admin.email, admin.password, admin.loginKeyword);

        await page.goto('/reset');

        // Signed in, the "back" link must not point at a sign-in page the user
        // is already past.
        await expect(page.getByRole('link', { name: /back to home/i })).toBeVisible({ timeout: 15_000 });
        await expect(page.getByRole('link', { name: /back to sign in/i })).toHaveCount(0);
    });

    test('offers "Back to sign in" to an anonymous visitor', async ({ browser }) => {
        const context = await browser.newContext();
        const page = await context.newPage();

        try {
            await page.goto('/reset');

            await expect(page.getByRole('link', { name: /back to sign in/i })).toBeVisible({ timeout: 15_000 });
        } finally {
            await context.close();
        }
    });
});
