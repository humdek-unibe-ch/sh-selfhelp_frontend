/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
/**
 * Golden workflow (web): News template with image replace, draft/publish and history.
 *
 * Requires a prepared QA stack and QA_ADMIN_EMAIL + QA_ADMIN_PASSWORD.
 * Create / edit / replace go through the Add/Edit dialog (rule 23 / F173).
 */
import { test, expect, type BrowserContext, type Page } from '@playwright/test';
import { cmsAppsE2eEnv, isCmsAppsE2eConfigured, removeCmsApp, selectLocale, setLanguage } from '../utils/cmsApps';
import { qaEnv } from '../utils/env';
import { apiPut, formListEnv, waitUntilSettled } from '../utils/formList';
import { loginAs } from '../utils/loginAs';

const env = cmsAppsE2eEnv(`n${Date.now().toString(36)}`);
const TITLE = `QA News ${env.suffix}`;
const BASE_URL = qaEnv().baseUrl;
const APP_SLUG = env.keywordPrefix.replace(/_+$/, '').toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-news';
const qaUser = formListEnv().user;

const COVER_A = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
    'base64',
);
const COVER_B = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAEklEQVR42mNk+M9Qz0AEYBxVSF+FAP5IDvcfFHZZAAAAAElFTkSuQmCC',
    'base64',
);
const ATTACH_PDF_A = Buffer.from('%PDF-1.1\n1 0 obj<< /Title (note-a) >>endobj\ntrailer<<>>\n%%EOF\n', 'utf8');
const ATTACH_PDF_B = Buffer.from('%PDF-1.1\n1 0 obj<< /Title (note-b) >>endobj\ntrailer<<>>\n%%EOF\n', 'utf8');

interface IImportedPage {
    keyword: string;
    page_id: number;
}

async function fillTitle(form: ReturnType<Page['getByRole']>, title: string): Promise<void> {
    const titleBox = form.locator('.mantine-TextInput-input').first();
    await expect(titleBox).toBeVisible({ timeout: 10_000 });
    await titleBox.fill(title);
    const titleLang = form.getByRole('radiogroup', { name: /content language/i }).first();
    if (await titleLang.count()) {
        await titleLang.getByText('EN-GB', { exact: true }).click();
        await titleBox.fill(title);
    }
}

async function setStatusDraft(page: Page, form: ReturnType<Page['getByRole']>): Promise<void> {
    const status = form.getByRole('combobox', { name: 'Status', exact: true });
    await expect(status).toBeVisible({ timeout: 10_000 });
    // Do not re-click Draft when it is already selected: a clearable Select used
    // to deselect and leave the searchable input showing "Draft" while the
    // hidden value was empty (F173). Assert the hidden field, not only the label.
    const hidden = form.locator('input[type="hidden"][name="status"]');
    if ((await hidden.inputValue()) !== 'draft') {
        await status.click();
        await page.getByRole('option', { name: 'Draft', exact: true }).click();
    }
    await expect(hidden).toHaveValue('draft');
}

test.describe('golden: CMS Apps News media + publish', () => {
    test.skip(
        !isCmsAppsE2eConfigured(),
        'Set QA_ADMIN_EMAIL + QA_ADMIN_PASSWORD (and run a QA stack) to execute the CMS Apps golden E2E.',
    );
    test.describe.configure({ mode: 'serial' });

    let context: BrowserContext;
    let page: Page;
    let imported: IImportedPage[] = [];
    let languageBefore: number | null = null;
    let contentPath = '';
    let publicListPath = '';

    test.beforeAll(async ({ browser }) => {
        context = await browser.newContext({ baseURL: BASE_URL, locale: 'en-GB' });
        page = await context.newPage();
        await loginAs(page, env.email, env.password, env.loginKeyword);
        ({ previous: languageBefore } = await selectLocale(page, 'en-GB'));
    });

    test.afterAll(async () => {
        try {
            await page.goto('/admin/cms-apps');
            if (imported.length > 0) {
                await removeCmsApp(
                    page,
                    APP_SLUG,
                    imported.map((entry) => entry.page_id),
                );
            }
            if (languageBefore !== null) {
                await setLanguage(page, languageBefore);
            }
        } finally {
            await context.close();
        }
    });

    test('imports News, adds draft with image, publishes, replaces image, history has two versions', async () => {
        test.setTimeout(240_000);
        await page.goto('/admin/cms-apps');
        await page.getByRole('button', { name: 'Import template' }).click();
        const dialog = page.getByRole('dialog').filter({ hasText: 'Page export / import' });
        await expect(dialog).toBeVisible({ timeout: 15_000 });

        const newsCard = dialog.locator('div').filter({ hasText: /^News/i }).first();
        await expect(newsCard).toBeVisible({ timeout: 20_000 });
        await newsCard.getByRole('button', { name: /use this template/i }).click();

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
        expect(imported.length).toBeGreaterThan(0);

        // Public list/detail are closed in the bundle; open them so qa.user can see the page.
        for (const entry of imported) {
            if (!/news/i.test(entry.keyword) || /cms/i.test(entry.keyword)) {
                continue;
            }
            const opened = await apiPut(page, `/api/admin/pages/${entry.page_id}`, {
                pageData: { openAccess: true },
                fields: [],
            });
            expect(opened.status, `open_access ${entry.keyword}: ${JSON.stringify(opened.json)}`).toBeLessThan(400);
        }

        await expect(page.getByText(/pages imported/i)).toBeVisible({ timeout: 20_000 });
        await expect(dialog).toBeHidden({ timeout: 20_000 });

        const appRow = page.getByRole('row').filter({ hasText: env.keywordPrefix.replace(/_+$/, '') }).filter({ hasText: /news/i }).first();
        if (await appRow.count()) {
            await appRow.getByRole('link', { name: /manage content/i }).click();
        } else {
            await page.getByRole('row').filter({ hasText: env.suffix }).getByRole('link', { name: /manage content/i }).first().click();
        }
        await waitUntilSettled(page);
        contentPath = page.url().replace(BASE_URL, '');
        publicListPath = `${env.routePrefix}/news`;

        // -- Add draft with image + two attachments through the dialog (F173) ------------
        await page.getByRole('button', { name: /add/i }).first().click();
        const form = page.getByRole('dialog').first();
        await expect(form).toBeVisible({ timeout: 20_000 });
        await fillTitle(form, TITLE);
        const fileInputs = form.locator('input[type="file"]');
        await expect(fileInputs).toHaveCount(2, { timeout: 10_000 });
        await fileInputs.nth(0).setInputFiles({ name: 'cover-a.png', mimeType: 'image/png', buffer: COVER_A });
        await fileInputs.nth(1).setInputFiles([
            { name: 'note-a.pdf', mimeType: 'application/pdf', buffer: ATTACH_PDF_A },
            { name: 'note-b.pdf', mimeType: 'application/pdf', buffer: ATTACH_PDF_B },
        ]);
        await setStatusDraft(page, form);
        await form.getByRole('button', { name: /^(Save|Add)$/i }).click();
        await expect(form).toBeHidden({ timeout: 30_000 });

        const row = page.getByRole('row').filter({ hasText: TITLE }).first();
        await expect(row).toBeVisible({ timeout: 20_000 });
        await expect(row).toContainText(/draft/i, { timeout: 10_000 });
        await expect(row.locator('img[alt="cover-a.png"]')).toBeVisible({ timeout: 20_000 });

        // Draft absent for qa.user after the public list has rendered (another card visible).
        const userCtx = await page.context().browser()!.newContext({ baseURL: BASE_URL, locale: 'en-GB' });
        const userPage = await userCtx.newPage();
        await loginAs(userPage, qaUser.email, qaUser.password, env.loginKeyword);
        await userPage.goto(publicListPath);
        // Positive check first: at least one sample card from the template is on the page.
        await expect(userPage.locator('img, article, [class*="card"]').first()).toBeVisible({ timeout: 20_000 });
        await expect(userPage.getByText(TITLE)).toHaveCount(0);
        await userCtx.close();

        await page.goto(contentPath);
        await waitUntilSettled(page);
        const draftRow = page.getByRole('row').filter({ hasText: TITLE }).first();
        const publish = draftRow.getByRole('button', { name: /Publish/i });
        await expect(publish).toBeVisible({ timeout: 10_000 });
        await publish.click();
        const confirm = page.getByRole('dialog');
        if (await confirm.isVisible().catch(() => false)) {
            await confirm.getByRole('button', { name: /publish|confirm|yes|ok/i }).first().click();
        }
        await expect(draftRow).toContainText(/published/i, { timeout: 20_000 });

        // Public list: card shows the loaded cover (F175 — scope is news_item).
        await page.goto(publicListPath);
        await expect(page.getByText(TITLE)).toBeVisible({ timeout: 20_000 });
        const listImg = page.locator('img[src*="/lists/"][src*="/files/"]').first();
        await expect(listImg).toBeVisible({ timeout: 20_000 });
        await expect
            .poll(async () => listImg.evaluate((el: HTMLImageElement) => el.naturalWidth), { timeout: 20_000 })
            .toBeGreaterThan(0);
        const listSrc = await listImg.getAttribute('src');
        expect(listSrc ?? '', 'list image src').toMatch(/\/lists\/\d+\/records\/\d+\/files\//);

        // Public detail: image + both downloads as clickable links (__links HTML).
        const recordId = (listSrc ?? '').match(/\/records\/(\d+)\//)?.[1];
        expect(recordId, 'record id on list image src').toBeTruthy();
        await page.goto(`${publicListPath}/${recordId}`);
        await expect(page.getByText(TITLE).first()).toBeVisible({ timeout: 20_000 });
        const detailPic = page.locator('img[src*="/lists/"][src*="/files/"]').first();
        await expect(detailPic).toBeVisible({ timeout: 20_000 });
        await expect
            .poll(async () => detailPic.evaluate((el: HTMLImageElement) => el.naturalWidth), { timeout: 20_000 })
            .toBeGreaterThan(0);

        const linkA = page.getByRole('link', { name: 'note-a.pdf' });
        const linkB = page.getByRole('link', { name: 'note-b.pdf' });
        await expect(linkA).toBeVisible({ timeout: 15_000 });
        await expect(linkB).toBeVisible({ timeout: 15_000 });
        for (const [link, expected] of [
            [linkA, ATTACH_PDF_A],
            [linkB, ATTACH_PDF_B],
        ] as const) {
            const href = await link.getAttribute('href');
            expect(href ?? '', 'download href').toMatch(/\/api\/lists\/\d+\/records\/\d+\/files\//);
            const result = await page.evaluate(async (url) => {
                const res = await fetch(url!, { credentials: 'same-origin' });
                const bytes = Array.from(new Uint8Array(await res.arrayBuffer()));
                return { status: res.status, bytes };
            }, href);
            expect(result.status, `download ${href}`).toBe(200);
            expect(Buffer.from(result.bytes).equals(expected), `bytes for ${href}`).toBe(true);
        }

        await page.goto(contentPath);
        await waitUntilSettled(page);

        // -- Edit: current image with Replace/Remove, then replace cover ------------------
        const editRow = page.getByRole('row').filter({ hasText: TITLE }).first();
        await editRow.getByRole('button', { name: /Edit/i }).click();
        const edit = page.getByRole('dialog').first();
        // Image and attachments each show a "current file" card.
        await expect(edit.getByTestId('file-input-existing').first()).toBeVisible({ timeout: 20_000 });
        await expect(edit.getByRole('button', { name: /Remove/i }).first()).toBeVisible();
        await expect(edit.locator('input[type="file"]').first()).toBeAttached();
        await edit.locator('input[type="file"]').first().setInputFiles({
            name: 'cover-b.png',
            mimeType: 'image/png',
            buffer: COVER_B,
        });
        await edit.getByRole('button', { name: /^(Save|Update)$/i }).click();
        await expect(edit).toBeHidden({ timeout: 30_000 });
        await expect(editRow.locator('img[alt="cover-b.png"]')).toBeVisible({ timeout: 20_000 });

        // After replace: public card shows the new image (different URL).
        await page.goto(publicListPath);
        await expect(page.getByText(TITLE)).toBeVisible({ timeout: 20_000 });
        const listImg2 = page.locator('img[src*="/lists/"][src*="/files/"]').first();
        await expect
            .poll(async () => listImg2.evaluate((el: HTMLImageElement) => el.naturalWidth), { timeout: 20_000 })
            .toBeGreaterThan(0);
        const listSrc2 = await listImg2.getAttribute('src');
        expect(listSrc2 ?? '').toMatch(/\/lists\/\d+\/records\/\d+\/files\//);
        // URL path stays the same after replace; bytes must change (COVER_B ≠ COVER_A).
        const replacedBytes = Buffer.from(
            await page.evaluate(async (url) => {
                const res = await fetch(url!, { cache: 'no-store', credentials: 'same-origin' });
                return Array.from(new Uint8Array(await res.arrayBuffer()));
            }, listSrc2),
        );
        expect(replacedBytes.equals(COVER_A), 'public card still serves the old cover').toBe(false);
        expect(replacedBytes.equals(COVER_B), 'public card serves the replaced cover').toBe(true);

        await page.goto(contentPath);
        await waitUntilSettled(page);
        await editRow.getByRole('button', { name: /History/i }).click();
        const history = page.getByTestId('form-list-history');
        await expect(history).toBeVisible({ timeout: 15_000 });
        // create (draft+files) + publish + replace cover = three versions
        await expect(history.locator('[data-version]')).toHaveCount(3, { timeout: 15_000 });
        void APP_SLUG;
    });
});
