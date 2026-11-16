/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
/**
 * Golden workflow (web): the CMS Apps operator path from the user guide, through to real records.
 *
 *   1. import the Team members template (its own keywords and routes, unique per run);
 *   2. open Manage content: the CMS list shows the sample members;
 *   3. add a member in the modal, with a portrait: the list and the public page show it;
 *   4. edit the member and read its history;
 *   5. reach Live preview (the public list as visitors see it);
 *   6. delete the member after a confirmation: the list and the public page lose it;
 *   7. remove the app and its pages again, so a rerun starts clean.
 *
 * One logical dataset: the CMS list holds the form (the only place its inputs are defined) and
 * the public pages read the same table. Requires a prepared QA stack and the admin persona
 * (`QA_ADMIN_EMAIL` + `QA_ADMIN_PASSWORD`); the spec skips cleanly only when those are absent.
 */
import { test, expect, type BrowserContext, type Page } from '@playwright/test';
import { cmsAppsE2eEnv, isCmsAppsE2eConfigured, removeCmsApp, selectLocale, setLanguage } from '../utils/cmsApps';
import { qaEnv } from '../utils/env';
import { listRoot, waitUntilSettled } from '../utils/formList';
import { loginAs } from '../utils/loginAs';

const env = cmsAppsE2eEnv();
const MEMBER = `QA E2E ${env.suffix}`;
const MEMBER_EMAIL = `qa.e2e.${env.suffix}@example.org`;
const MEMBER_EMAIL_EDITED = `qa.e2e.edited.${env.suffix}@example.org`;
const BIO_DE = `Von Playwright hinzugefuegt ${env.suffix}.`;
const BIO_EN = `Added by the golden workflow ${env.suffix}.`;
const BASE_URL = qaEnv().baseUrl;

/** A 1x1 transparent PNG: a real image the upload and the public delivery can handle. */
const PORTRAIT_PNG = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
    'base64',
);

interface IImportedPage {
    keyword: string;
    page_id: number;
}

test.describe('golden: CMS Apps Team Members operator workflow', () => {
    test.skip(
        !isCmsAppsE2eConfigured(),
        'Set QA_ADMIN_EMAIL + QA_ADMIN_PASSWORD (and run a QA stack) to execute the CMS Apps golden E2E.',
    );
    test.describe.configure({ mode: 'serial' });

    let context: BrowserContext;
    let page: Page;
    let imported: IImportedPage[] = [];
    let languageBefore: number | null = null;

    const publicListPath = `${env.routePrefix}/team-members`;
    const contentPath = `/admin/cms-apps/${env.appSlug}/content`;

    test.beforeAll(async ({ browser }) => {
        context = await browser.newContext({ baseURL: BASE_URL, locale: 'en-GB' });
        page = await context.newPage();
        await loginAs(page, env.email, env.password, env.loginKeyword);
        // The template texts follow the language of the account; the spec reads the English ones and
        // puts the language back at the end.
        ({ previous: languageBefore } = await selectLocale(page, 'en-GB'));
    });

    test.afterAll(async () => {
        try {
            await page.goto('/admin/cms-apps');
            await removeCmsApp(
                page,
                env.appSlug,
                imported.map((entry) => entry.page_id),
            );
            if (languageBefore !== null) {
                await setLanguage(page, languageBefore);
            }
        } finally {
            await context.close();
        }
    });

    test('imports the Team members template with its sample members', async () => {
        test.setTimeout(120_000);
        await page.goto('/admin/cms-apps');

        await page.getByRole('button', { name: 'Import template' }).click();
        // The dialog title is a plain paragraph, so the dialog has no accessible name to ask for.
        const dialog = page.getByRole('dialog').filter({ hasText: 'Page export / import' });
        await expect(dialog).toBeVisible({ timeout: 15_000 });

        const teamCard = dialog.locator('div').filter({ hasText: /^Team members/i }).first();
        await expect(teamCard).toBeVisible({ timeout: 20_000 });
        await teamCard.getByRole('button', { name: /use this template/i }).click();

        await dialog.getByLabel('Keyword prefix').fill(env.keywordPrefix);
        await dialog.getByLabel('Route prefix').fill(env.routePrefix);

        await dialog.getByRole('button', { name: /^validate$/i }).click();
        await expect(dialog.getByText('Bundle is valid')).toBeVisible({ timeout: 30_000 });

        const [response] = await Promise.all([
            page.waitForResponse(
                (res) =>
                    res.request().method() === 'POST' &&
                    res.url().includes('/admin/pages/import') &&
                    !res.url().includes('/validate'),
            ),
            dialog.getByRole('button', { name: /^import$/i }).click(),
        ]);
        expect(response.status(), `import status: ${await response.text().catch(() => '')}`).toBeLessThan(400);
        const body = (await response.json()) as { data?: { created?: IImportedPage[] } };
        imported = body.data?.created ?? [];
        expect(imported.map((entry) => entry.keyword).sort()).toEqual(
            ['cms-team-members', 'team-members', 'team-members-record'].map((keyword) => `${env.keywordPrefix}${keyword}`),
        );

        // A successful import closes the dialog and shows the CMS Apps list with the new app.
        await expect(page.getByText(/pages imported/i)).toBeVisible({ timeout: 20_000 });
        await expect(dialog).toBeHidden({ timeout: 20_000 });
        await expect(page).toHaveURL(/\/admin\/cms-apps$/);
        await expect(page.getByRole('row').filter({ hasText: env.appSlug })).toBeVisible({ timeout: 20_000 });
    });

    test('Manage content shows the CMS list with the sample members', async () => {
        await page.goto('/admin/cms-apps');
        const appRow = page.getByRole('row').filter({ hasText: env.appSlug });
        await appRow.getByRole('link', { name: /manage content/i }).click();
        await expect(page).toHaveURL(new RegExp(`${contentPath}$`), { timeout: 20_000 });
        await expect(page.getByText('CMS content')).toBeVisible({ timeout: 20_000 });

        const list = listRoot(page, 'team');
        await expect(list).toBeVisible({ timeout: 20_000 });
        await expect(list.getByRole('row').filter({ hasText: 'Ada Lovelace' })).toHaveCount(1);
        await expect(list.getByRole('button', { name: 'Add member' })).toBeVisible();
    });

    test('adds a member with a portrait: the list and the public page show it', async () => {
        await page.goto(contentPath);
        await waitUntilSettled(page);
        const list = listRoot(page, 'team');
        await expect(list).toBeVisible({ timeout: 20_000 });

        await list.getByRole('button', { name: 'Add member' }).click();
        const dialog = page.getByRole('dialog', { name: 'Add member' });
        await expect(dialog).toBeVisible();

        await dialog.getByRole('textbox', { name: 'Name' }).fill(MEMBER);
        await dialog.getByRole('textbox', { name: 'Email' }).fill(MEMBER_EMAIL);
        // The bio is translatable: one text per language, switched with the content-language radios.
        // (Its textarea carries no accessible name of its own, so it is found by its element.)
        const bio = dialog.locator('textarea');
        await bio.fill(BIO_DE);
        await dialog.getByText('EN-GB', { exact: true }).click();
        await bio.fill(BIO_EN);
        await dialog.getByRole('combobox', { name: 'Role' }).click();
        await page.getByRole('option', { name: 'Software Director' }).click();
        await dialog.locator('input[type="file"]').setInputFiles({
            name: 'portrait.png',
            mimeType: 'image/png',
            buffer: PORTRAIT_PNG,
        });

        await dialog.getByRole('button', { name: 'Save', exact: true }).click();
        await expect(dialog).toBeHidden({ timeout: 20_000 });

        const row = list.getByRole('row').filter({ hasText: MEMBER });
        await expect(row).toHaveCount(1);
        await expect(row).toContainText(MEMBER_EMAIL);
        await expect(row).toContainText('Director');
        // Image columns render a thumbnail (alt = file name), not the bare file-name text.
        await expect(row.locator('img[alt="portrait.png"]')).toBeVisible();

        // Public list has status = published; publish the draft before checking the website.
        // Row actions use accessible names like "Publish <member name>".
        const publish = row.getByRole('button', { name: /Publish/i });
        await expect(publish).toBeVisible({ timeout: 10_000 });
        await publish.click();
        const confirm = page.getByRole('dialog');
        if (await confirm.isVisible().catch(() => false)) {
            await confirm.getByRole('button', { name: /publish|confirm|yes|ok/i }).first().click();
        }
        await expect(row).toContainText(/published/i, { timeout: 20_000 });

        // The public list reads the very same table: the card shows the member, the bio in the
        // language of the visitor (never the list of languages it was sent as) and the picture.
        await page.goto(publicListPath);
        await expect(page.getByText(MEMBER, { exact: false }).first()).toBeVisible({ timeout: 20_000 });
        await expect(page.getByText(BIO_EN)).toBeVisible();
        await expect(page.getByText('language_id')).toHaveCount(0);
        await expect(page.getByText('Ada Lovelace').first()).toBeVisible();
        // Contract 1: the portrait URL must load for a guest (naturalWidth > 0).
        const publicImg = page.locator('img[src*="/lists/"][src*="/files/"]').first();
        await expect(publicImg).toBeVisible({ timeout: 20_000 });
        await expect
            .poll(async () => publicImg.evaluate((img: HTMLImageElement) => img.naturalWidth), { timeout: 20_000 })
            .toBeGreaterThan(0);
    });

    test('edits the member and reads its history', async () => {
        await page.goto(contentPath);
        await waitUntilSettled(page);
        const list = listRoot(page, 'team');
        const row = list.getByRole('row').filter({ hasText: MEMBER });
        await expect(row).toHaveCount(1, { timeout: 20_000 });

        await list.getByRole('button', { name: `Edit ${MEMBER}` }).click();
        const dialog = page.getByRole('dialog');
        await expect(dialog.getByRole('textbox', { name: 'Email' })).toHaveValue(MEMBER_EMAIL);
        const bio = dialog.locator('textarea');
        await expect(bio).toHaveValue(BIO_DE);
        await dialog.getByText('EN-GB', { exact: true }).click();
        await expect(bio).toHaveValue(BIO_EN);
        await dialog.getByRole('textbox', { name: 'Email' }).fill(MEMBER_EMAIL_EDITED);
        await dialog.getByRole('button', { name: /^(Save|Update)$/ }).click();
        await expect(dialog).toBeHidden({ timeout: 20_000 });
        await expect(row).toContainText(MEMBER_EMAIL_EDITED);

        await list.getByRole('button', { name: `History ${MEMBER}` }).click();
        const history = page.getByTestId('form-list-history');
        await expect(history).toBeVisible();
        // create + publish + edit → at least three revisions
        await expect(history.locator('[data-version]')).toHaveCount(3);
        await page.keyboard.press('Escape');
        await expect(history).toBeHidden();
    });

    test('Live preview shows the public list', async () => {
        await page.goto('/admin/cms-apps');
        const appRow = page.getByRole('row').filter({ hasText: env.appSlug });
        const previewPopup = page.waitForEvent('popup');
        await appRow.getByRole('link', { name: /live preview team members/i }).click();
        const previewPage = await previewPopup;
        await expect(previewPage).toHaveURL(/\/admin\/preview\//, { timeout: 20_000 });
        await expect(previewPage.getByText(MEMBER, { exact: false }).first()).toBeVisible({ timeout: 30_000 });
        await previewPage.close();
    });

    test('deletes the member after a confirmation: the list and the public page lose it', async () => {
        await page.goto(contentPath);
        await waitUntilSettled(page);
        const list = listRoot(page, 'team');
        const row = list.getByRole('row').filter({ hasText: MEMBER });
        await expect(row).toHaveCount(1, { timeout: 20_000 });

        await list.getByRole('button', { name: `Delete ${MEMBER}` }).click();
        const confirm = page.getByRole('dialog', { name: 'Delete' });
        await expect(confirm).toContainText('Delete this member?');
        await confirm.getByRole('button', { name: 'Delete', exact: true }).click();
        await expect(confirm).toBeHidden({ timeout: 20_000 });
        await expect(row).toHaveCount(0);

        await page.goto(publicListPath);
        await expect(page.getByText('Ada Lovelace').first()).toBeVisible({ timeout: 20_000 });
        await expect(page.getByText(MEMBER, { exact: false })).toHaveCount(0);
    });
});
