/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
/**
 * Golden workflow (web): an author builds an entry list from an empty page with the builders of the
 * page editor, and a participant uses the list.
 *
 * Everything the author does goes through the real page editor, nothing is seeded:
 *
 *   1. create a page for the group `subject` (the wizard of "Create page");
 *   2. add an Entry List with Form section and two inputs directly inside it;
 *   3. open the list: the builders offer the inputs by name (`list_source` from own children);
 *   4. a column the list does not have is refused by the server with a message that names it, and the
 *      list is not saved;
 *   5. columns (header, sort, search), a filter control, a quick action that is offered only for records
 *      that match, the page size, the list name and the title are set with the builders, and saved;
 *   6. the page editor is reopened: the builders show what was saved (the round trip).
 *
 * A participant of the group then uses that page: adds entries in the modal, sees them in the columns the
 * author chose, filters them with the control, runs the quick action (which disappears for the records it
 * no longer fits), searches and pages. The page and every record are removed again at the end.
 *
 * Requires a prepared QA stack, the QA env (see `e2e/utils/env.ts`) and the admin persona.
 */
import { test, expect, type Browser, type BrowserContext, type Locator, type Page } from '@playwright/test';
import { qaEnv } from '../utils/env';
import {
    apiDelete,
    apiGet,
    apiPost,
    createRecord,
    expectNoPageOverflow,
    formListEnv,
    listRoot,
    listRows,
    listTarget,
    runTag,
    waitUntilSettled,
    type IListTarget,
} from '../utils/formList';
import { loginAs } from '../utils/loginAs';
import { adminCreds, isAdminConfigured } from '../utils/targets';

const env = formListEnv();
const admin = adminCreds();
const SUFFIX = Date.now().toString(36);
const KEYWORD = `qa_e2e_builder_${SUFFIX}`;
const PATH = `/${KEYWORD}`;
const LIST_KEY = 'builder_items';
const LIST_TITLE = 'Builder items';
const TAG = runTag();
const BASE_URL = qaEnv().baseUrl;
const LOCALE = 'en-GB';

/** The Entry List with Form section and the two inputs, by the names the author gives them. */
const LIST_SECTION = 'qa-builder-list';
const TITLE_INPUT = 'qa-builder-title';
const STATUS_INPUT = 'qa-builder-status';
const ADMIN_KEYWORD = `qa_e2e_builder_admin_${SUFFIX}`;
const ADMIN_PATH = `/${ADMIN_KEYWORD}`;
const ADMIN_LIST_SECTION = 'qa-builder-admin-list';
const ADMIN_LIST_KEY = 'builder_admin';

interface ISaved {
    status: number;
    text: string;
}

/** Open the section in the tree of the page editor. */
async function openSection(page: Page, name: string): Promise<void> {
    await page.getByRole('link', { name: new RegExp(`${name} `) }).first().click();
    await expect(page.getByRole('heading', { level: 3, name })).toBeVisible();
}

async function expandTree(page: Page): Promise<void> {
    const expand = page.getByRole('button', { name: 'Expand all' });
    if ((await expand.count()) > 0) {
        await expand.click();
    }
}

/** Save the section that is open and return what the server answered. */
async function saveSection(page: Page): Promise<ISaved> {
    const [response] = await Promise.all([
        page.waitForResponse((candidate) => candidate.request().method() === 'PUT' && /\/admin\/pages\/\d+\/sections\/\d+$/.test(candidate.url())),
        page.getByRole('button', { name: 'Save', exact: true }).first().click(),
    ]);
    return { status: response.status(), text: await response.text() };
}

/** The container that holds a translatable field, with its language buttons. */
function translatedField(page: Page, label: string): { container: Locator; box: Locator } {
    const box = page.getByRole('textbox', { name: label, exact: true });
    return { box, container: box.locator('xpath=ancestor::*[.//button[contains(@aria-label,"English")]][1]') };
}

/**
 * Type the text of a translatable field of the open section in both languages of the install: the
 * editor opens on the first (German), and a visitor reads the language of their own account.
 */
async function fillBothLanguages(page: Page, label: string, text: string): Promise<void> {
    const { box, container } = translatedField(page, label);
    await container.getByRole('button', { name: /Deutsch/ }).click();
    await box.fill(text);
    await container.getByRole('button', { name: /English/ }).click();
    await box.fill(text);
}

/** Add a section from the dialog of "Add Section": to the page, or as the child of a section. */
async function addSection(page: Page, style: string, name: string, parent: string | null): Promise<void> {
    if (parent === null) {
        await page.getByRole('button', { name: 'Add Section' }).first().click();
    } else {
        await page.getByRole('button', { name: `Add a section near ${parent}` }).click();
        await page.getByRole('menuitem', { name: 'Add child' }).click();
    }
    const dialog = page.getByRole('dialog');
    await dialog.getByRole('textbox', { name: 'Search styles' }).fill(style);
    await dialog.getByText(style, { exact: true }).first().click();
    await dialog.getByRole('textbox', { name: 'Section Name (Optional)' }).fill(name);
    await dialog.getByRole('button', { name: 'Add Section' }).click();
    // The new section opens in the editor.
    await expect(page.getByRole('heading', { level: 3, name })).toBeVisible({ timeout: 20_000 });
}

/** The wizard of "Create page": a page for the group `subject` only. */
async function createPage(page: Page): Promise<number> {
    await page.goto('/admin/pages');
    await page.getByRole('button', { name: /create page/i }).first().click();
    const dialog = page.getByRole('dialog');
    await dialog.getByRole('textbox', { name: 'Keyword' }).fill(KEYWORD);
    await dialog.getByRole('button', { name: 'Next' }).click();
    await dialog.getByRole('combobox', { name: 'Additional access groups' }).click();
    await page.getByRole('option', { name: 'subject' }).click();
    await page.keyboard.press('Escape');
    await dialog.getByRole('button', { name: 'Next' }).click();
    await dialog.getByRole('button', { name: 'Next' }).click();
    const [response] = await Promise.all([
        page.waitForResponse((candidate) => candidate.request().method() === 'POST' && /\/admin\/pages$/.test(candidate.url())),
        dialog.getByRole('button', { name: 'Create Page' }).click(),
    ]);
    expect(response.status(), 'create the page').toBe(201);
    const id = ((await response.json()) as { data?: { id?: number } }).data?.id;
    expect(id, 'the new page has an id').toEqual(expect.any(Number));
    await page.waitForURL(`**/admin/pages/${KEYWORD}`);
    await expect(page.getByRole('heading', { level: 1, name: KEYWORD })).toBeVisible();
    return id as number;
}

/** An input of the form: its label, the name it stores under and whether it is required. */
async function authorInput(page: Page, label: string, name: string, required: boolean): Promise<void> {
    await fillBothLanguages(page, 'Label', label);
    await page.getByRole('textbox', { name: 'Name', exact: true }).fill(name);
    if (required) {
        await page.getByRole('checkbox', { name: /^Required/ }).check();
    }
    const saved = await saveSection(page);
    expect(saved.status, `save the input ${name}: ${saved.text}`).toBe(200);
}

function columnsRows(page: Page): Locator {
    return page.getByRole('group', { name: /^Column [^:]+$/ });
}

test.describe('golden: an entry list built with the builders (web)', () => {
    test.skip(!isAdminConfigured(), 'Set QA_ADMIN_EMAIL + QA_ADMIN_PASSWORD (and run a QA stack) to execute the builder golden E2E.');
    test.describe.configure({ mode: 'serial' });

    let adminContext: BrowserContext;
    let adminPage: Page;
    let pageId: number | null = null;
    let adminPageId: number | null = null;
    let list: IListTarget | null = null;

    test.beforeAll(async ({ browser }) => {
        adminContext = await browser.newContext({ baseURL: BASE_URL, locale: LOCALE, viewport: { width: 1366, height: 900 } });
        adminPage = await adminContext.newPage();
        await loginAs(adminPage, admin.email, admin.password, admin.loginKeyword);
    });

    test.afterAll(async ({ browser }) => {
        try {
            // The participant's records first (the page they live on is about to go).
            if (list !== null) {
                const participant = await signedInParticipant(browser);
                try {
                    await removeTagged(participant.page, list);
                } finally {
                    await participant.context.close();
                }
            }
            if (adminPageId !== null) {
                await adminPage.goto('/admin/pages');
                const removedAdmin = await apiDelete(adminPage, `/api/admin/pages/${adminPageId}`, undefined);
                expect([200, 204, 404], `delete admin page: ${JSON.stringify(removedAdmin.json)}`).toContain(removedAdmin.status);
            }
            if (pageId !== null) {
                await adminPage.goto('/admin/pages');
                const removed = await apiDelete(adminPage, `/api/admin/pages/${pageId}`, undefined);
                expect([200, 204, 404], `delete the page: ${JSON.stringify(removed.json)}`).toContain(removed.status);
            }
        } finally {
            await adminContext.close();
        }
    });

    test('an author builds the list: sections, fields by name, a refused column, then the builders', async () => {
        test.setTimeout(240_000);
        const page = adminPage;

        // 1-2. An empty page, the list, and two inputs directly inside the list.
        pageId = await createPage(page);
        await expect(page.getByText('No sections yet')).toBeVisible();
        await addSection(page, 'entry-form-list', LIST_SECTION, null);
        await expandTree(page);
        await addSection(page, 'text-input', TITLE_INPUT, LIST_SECTION);
        await authorInput(page, 'Title', 'builder_title', true);
        await expandTree(page);
        await addSection(page, 'text-input', STATUS_INPUT, LIST_SECTION);
        await authorInput(page, 'Status', 'builder_status', false);
        await expandTree(page);

        // 3. With inputs already in the list, list_source offers them by name (reload so section details are fresh).
        await page.reload();
        await expandTree(page);
        await openSection(page, LIST_SECTION);
        const addColumn = page.getByRole('combobox', { name: 'Add a column' });
        await expect(addColumn).toBeEnabled();
        await addColumn.click();
        await expect(page.getByRole('option', { name: 'builder_title', exact: true })).toBeVisible();
        await expect(page.getByRole('option', { name: 'builder_status', exact: true })).toBeVisible();
        await page.keyboard.press('Escape');

        // 4. A column the list does not have: the server names it and does not save the list.
        const columns = page.getByRole('radiogroup', { name: 'Edit the columns as rows or as JSON' });
        await columns.getByText('JSON', { exact: true }).click();
        await page.getByRole('textbox', { name: 'Columns', exact: true }).fill('[{"field":"builder_nonexistent","label":"Nope"}]');
        const refused = await saveSection(page);
        expect(refused.status).toBe(400);
        expect(refused.text).toContain('invalid_list_config');
        expect(refused.text).toContain('builder_nonexistent');
        await expect(page.getByText('This list was not saved')).toBeVisible();
        // Shown in the top alert and next to the Columns field.
        await expect(page.getByText('The column "builder_nonexistent" is not a field of the table.').first()).toBeVisible();
        // The rows show the same column, marked as not in the table; the author removes it.
        await columns.getByText('Rows', { exact: true }).click();
        await expect(columnsRows(page)).toHaveCount(1);
        await page.getByRole('button', { name: /^Remove Column / }).click();
        await expect(columnsRows(page)).toHaveCount(0);

        // 5. The builders: two columns, a control, a quick action, the size, the name and the title.
        await addColumn.click();
        await page.getByRole('option', { name: 'builder_title', exact: true }).click();
        await addColumn.click();
        await page.getByRole('option', { name: 'builder_status', exact: true }).click();
        await expect(columnsRows(page)).toHaveCount(2);
        const titleColumn = columnsRows(page).nth(0);
        const statusColumn = columnsRows(page).nth(1);
        // A header starts as the name of the field; the author words them for the page.
        await expect(titleColumn.getByRole('textbox', { name: 'Header' })).toHaveValue('builder_title');
        await titleColumn.getByRole('textbox', { name: 'Header' }).fill('Entry title');
        await titleColumn.getByRole('checkbox', { name: 'Search looks in it' }).check();
        await expect(statusColumn.getByRole('textbox', { name: 'Header' })).toHaveValue('builder_status');
        await statusColumn.getByRole('textbox', { name: 'Header' }).fill('Progress');

        await page.getByRole('combobox', { name: 'Add a control' }).click();
        await page.getByRole('option', { name: 'builder_status', exact: true }).click();
        const control = page.getByRole('group', { name: /^Control [^:]+$/ });
        await expect(control).toHaveCount(1);
        await control.getByRole('textbox', { name: 'Label' }).fill('Filter by progress');

        await page.getByRole('button', { name: 'Add a quick action' }).click();
        // The group of the condition is named "Action ...: only when"; the colon tells them apart.
        const action = page.getByRole('group', { name: /^Action [^:]+$/ });
        await action.getByRole('textbox', { name: 'Button label' }).fill('Mark done');
        await action.getByRole('textbox', { name: 'Id', exact: true }).fill('mark_done');
        await action.getByRole('combobox', { name: /field 1$/ }).click();
        await page.getByRole('option', { name: 'builder_status', exact: true }).click();
        await action.getByRole('textbox', { name: /value 1$/ }).fill('done');
        await action.getByRole('switch', { name: 'Offer it only for records that match' }).check();
        await action.getByRole('button', { name: 'Condition' }).click();
        await action.getByRole('combobox', { name: /condition 1: field$/ }).click();
        await page.getByRole('option', { name: 'builder_status', exact: true }).click();
        await action.getByRole('textbox', { name: /condition 1: value$/ }).fill('open');

        await page.getByRole('spinbutton', { name: 'Records per page' }).fill('2');
        await page.getByRole('textbox', { name: 'List name', exact: true }).fill(LIST_KEY);
        await fillBothLanguages(page, 'Title', LIST_TITLE);

        const saved = await saveSection(page);
        expect(saved.status, `save the list with the builders: ${saved.text}`).toBe(200);
        await expect(page.getByText('This list was not saved')).toHaveCount(0);

        // 6. The round trip: reopen the editor from scratch; the builders show what was saved, and the
        //    server's own copy of the configuration says the same.
        await page.reload();
        await expandTree(page);
        await openSection(page, LIST_SECTION);
        await expect(columnsRows(page)).toHaveCount(2);
        await expect(columnsRows(page).nth(0).getByRole('textbox', { name: 'Header' })).toHaveValue('Entry title');
        await expect(columnsRows(page).nth(1).getByRole('textbox', { name: 'Header' })).toHaveValue('Progress');
        await expect(page.getByRole('group', { name: /^Control [^:]+$/ })).toHaveCount(1);
        await expect(page.getByRole('group', { name: 'Action Mark done', exact: true })).toBeVisible();
        await expect(page.getByRole('spinbutton', { name: 'Records per page' })).toHaveValue('2');

        const target = await listTarget(page, KEYWORD, LIST_KEY);
        const stored = await apiGet(page, `/api/admin/pages/${target.pageId}/sections/${target.listId}`);
        expect(stored.status).toBe(200);
        const config = JSON.stringify(stored.json);
        for (const expected of ['mark_done', 'builder_items', 'Mark done', 'options_from', '"page_size"']) {
            expect(config, `the server holds ${expected}`).toContain(expected);
        }
        expect(config).not.toContain('builder_nonexistent');
    });

    test('a participant uses the list that was built: add, columns, control, quick action, search, paging', async ({ browser }) => {
        test.setTimeout(180_000);
        const participant = await signedInParticipant(browser);
        const page = participant.page;
        try {
            list = await listTarget(page, KEYWORD, LIST_KEY);
            const root = listRoot(page, LIST_KEY);
            await page.goto(PATH);
            await waitUntilSettled(page);
            await expect(root.getByRole('heading', { name: LIST_TITLE })).toBeVisible();
            await expect(root.getByTestId('form-list-empty')).toBeVisible();

            // Add two entries through the form the author built.
            for (const title of [`${TAG} first`, `${TAG} second`]) {
                await root.getByRole('button', { name: 'Add entry' }).click();
                const dialog = page.getByRole('dialog', { name: 'Add entry' });
                await dialog.getByRole('textbox', { name: 'Title' }).fill(title);
                await dialog.getByRole('textbox', { name: 'Status' }).fill('open');
                await dialog.getByRole('button', { name: 'Save', exact: true }).click();
                await expect(page.getByRole('dialog')).toHaveCount(0);
                await expect(root.getByRole('row').filter({ hasText: title })).toBeVisible();
            }
            await createRecord(page, list, { builder_title: `${TAG} third`, builder_status: 'closed' });
            await page.reload();
            await waitUntilSettled(page);

            // The columns are the two the author chose, with the headers they typed; two rows fit a page.
            await expect(root.getByRole('columnheader', { name: /Entry title/ })).toBeVisible();
            await expect(root.getByRole('columnheader', { name: /Progress/ })).toBeVisible();
            await expect(root.getByRole('row').filter({ hasText: TAG })).toHaveCount(2);
            await expect(root.getByRole('button', { name: 'Page 2' })).toBeVisible();
            await expectNoPageOverflow(page, 'the built list');

            // The control the author added filters by the values found in the data.
            await filterStatus(page, root, 'closed');
            await expect(root.getByRole('row').filter({ hasText: TAG })).toHaveCount(1);
            await expect(root.getByRole('row').filter({ hasText: `${TAG} third` })).toBeVisible();
            // The quick action is offered only for records that match: "closed" does not.
            await expect(root.getByRole('button', { name: 'Mark done' })).toHaveCount(0);
            await filterStatus(page, root, 'open');
            await expect(root.getByRole('row').filter({ hasText: TAG })).toHaveCount(2);
            await expect(root.getByRole('button', { name: 'Mark done' })).toHaveCount(2);

            // Running it changes the record, and the action is gone for it.
            await root.getByRole('row').filter({ hasText: `${TAG} first` }).getByRole('button', { name: 'Mark done' }).click();
            await expect(root.getByRole('row').filter({ hasText: `${TAG} first` })).toHaveCount(0);
            await expect(root.getByRole('button', { name: 'Mark done' })).toHaveCount(1);
            // The server's own rows (two to a page, as the author set): both pages.
            const stored = [...(await listRows(page, list, TAG, 1)).rows, ...(await listRows(page, list, TAG, 2)).rows];
            expect(stored.map((row) => Object.values(row.values).join('|')).sort()).toEqual(
                [`${TAG} first|done`, `${TAG} second|open`, `${TAG} third|closed`].sort(),
            );

            // The search column the author ticked is the one search looks in.
            await page.goto(`${PATH}?${LIST_KEY}.q=${encodeURIComponent(`${TAG} third`)}`);
            await waitUntilSettled(page);
            await expect(root.getByRole('row').filter({ hasText: TAG })).toHaveCount(1);
        } finally {
            await participant.context.close();
        }
    });

    test('an admin list over the participant table: Data table + Approve in one inspector save', async ({ browser }) => {
        test.setTimeout(240_000);
        const page = adminPage;
        expect(list, 'participant list exists from the previous test').not.toBeNull();
        const participantList = list as IListTarget;

        // Table of list A (created by the first participant submit).
        const details = await apiGet(page, `/api/admin/pages/${participantList.pageId}/sections/${participantList.listId}`);
        expect(details.status).toBe(200);
        const source = (details.json as { data?: { list_source?: { data_table?: { id?: number; name?: string } | null; columns?: Array<{ field: string; label: string }> } } })
            ?.data?.list_source;
        const tableId = source?.data_table?.id;
        expect(tableId, 'list A has a table after the participant used it').toEqual(expect.any(Number));
        const titleCol = source?.columns?.find((column) => column.label === 'builder_title');
        const statusCol = source?.columns?.find((column) => column.label === 'builder_status');
        expect(titleCol?.field).toBeTruthy();
        expect(statusCol?.field).toBeTruthy();

        // Page B + empty entry-form-list, configured only through the inspector Save.
        adminPageId = await createPageWithKeyword(page, ADMIN_KEYWORD);
        await expect(page.getByText('No sections yet')).toBeVisible();
        await addSection(page, 'entry-form-list', ADMIN_LIST_SECTION, null);

        const tableName = source?.data_table?.name ?? '';
        await page.getByRole('combobox', { name: 'Data table' }).click();
        // Prefer the table's name; fall back to an exact (#id) suffix so a short id
        // does not match another option that merely contains the digits.
        await page.getByRole('option', { name: tableName !== '' ? new RegExp(tableName) : new RegExp(`\\(${tableId}\\)\\s*$|#${tableId}\\b`) }).first().click();
        // Wait until live list_source offers A's input names (before save).
        const addColumn = page.getByRole('combobox', { name: 'Add a column' });
        await expect(addColumn).toBeEnabled({ timeout: 20_000 });
        await addColumn.click();
        await expect(page.getByRole('option', { name: 'builder_title', exact: true })).toBeVisible({ timeout: 20_000 });
        await page.keyboard.press('Escape');

        await addColumn.click();
        await page.getByRole('option', { name: 'builder_title', exact: true }).click();
        await addColumn.click();
        await page.getByRole('option', { name: 'builder_status', exact: true }).click();

        await page.getByRole('button', { name: 'Add a quick action' }).click();
        const action = page.getByRole('group', { name: /^Action [^:]+$/ });
        await action.getByRole('textbox', { name: 'Button label' }).fill('Approve');
        await action.getByRole('textbox', { name: 'Id', exact: true }).fill('approve');
        await action.getByRole('combobox', { name: /field 1$/ }).click();
        await page.getByRole('option', { name: 'builder_status', exact: true }).click();
        await action.getByRole('textbox', { name: /value 1$/ }).fill('approved');

        await page.getByRole('textbox', { name: 'List name', exact: true }).fill(ADMIN_LIST_KEY);
        await fillBothLanguages(page, 'Title', 'Admin builder items');

        // Shared admin list: everyone's records, no add/edit. Set these last so a
        // mid-edit store reset cannot leave Own entries on (empty list for the admin).
        const own = page.getByRole('checkbox', { name: /Own entries only/i });
        const allowAdd = page.getByRole('checkbox', { name: /Allow add/i });
        const allowEdit = page.getByRole('checkbox', { name: /Allow edit/i });
        await own.scrollIntoViewIfNeeded();
        await own.uncheck();
        await allowAdd.uncheck();
        await allowEdit.uncheck();
        await expect(own).not.toBeChecked();
        await expect(allowAdd).not.toBeChecked();
        await expect(allowEdit).not.toBeChecked();

        const saved = await saveSection(page);
        expect(saved.status, `one-pass save of admin list B: ${saved.text}`).toBe(200);
        await expect(page.getByText('This list was not saved')).toHaveCount(0);

        const adminTarget = await listTarget(page, ADMIN_KEYWORD, ADMIN_LIST_KEY);
        const storedB = await apiGet(page, `/api/admin/pages/${adminTarget.pageId}/sections/${adminTarget.listId}`);
        expect(storedB.status).toBe(200);
        const storedFields = ((storedB.json as { data?: { fields?: Array<{ name?: string; translations?: Array<{ content?: string | null }> }> } })
            ?.data?.fields ?? []);
        const storedProp = (name: string): string => {
            const field = storedFields.find((candidate) => candidate.name === name);
            return String(field?.translations?.[0]?.content ?? '');
        };
        expect(storedProp('data_table'), 'B is bound to A\'s table').toBe(String(tableId));
        expect(storedProp('own_entries_only'), 'B has own entries off').toBe('0');
        expect(storedProp('allow_create'), 'B has Allow add off').toBe('0');
        expect(storedProp('allow_update'), 'B has Allow edit off').toBe('0');

        const published = await apiPost(page, `/api/admin/pages/${adminPageId}/versions/publish`, { comment: 'builder admin list' });
        expect([200, 201], `publish admin page: ${JSON.stringify(published.json)}`).toContain(published.status);
        await apiPost(page, `/api/admin/pages/${participantList.pageId}/versions/publish`, { comment: 'builder list A' });

        // Participant adds one more open record on A.
        const participant = await signedInParticipant(browser);
        try {
            await participant.page.goto(PATH);
            await waitUntilSettled(participant.page);
            const rootA = listRoot(participant.page, LIST_KEY);
            await rootA.getByRole('button', { name: 'Add entry' }).click();
            const dialog = participant.page.getByRole('dialog', { name: 'Add entry' });
            await dialog.getByRole('textbox', { name: 'Title' }).fill(`${TAG} admin-case`);
            await dialog.getByRole('textbox', { name: 'Status' }).fill('open');
            await dialog.getByRole('button', { name: 'Save', exact: true }).click();
            await expect(participant.page.getByRole('dialog')).toHaveCount(0);
        } finally {
            await participant.context.close();
        }

        // Admin on B: sees the record, Approves, deletes one.
        await page.goto(ADMIN_PATH);
        await waitUntilSettled(page);
        const rootB = listRoot(page, ADMIN_LIST_KEY);
        const row = rootB.getByRole('row').filter({ hasText: `${TAG} admin-case` });
        await expect(row).toBeVisible({ timeout: 20_000 });
        await row.getByRole('button', { name: 'Approve' }).click();
        await expect(row).toContainText('approved', { timeout: 15_000 });
        await row.getByRole('button', { name: new RegExp(`^Delete ${TAG} admin-case$`) }).click();
        const deleteDialog = page.getByRole('dialog', { name: 'Delete' });
        await expect(deleteDialog).toContainText('Delete this entry?');
        await deleteDialog.getByRole('button', { name: 'Delete', exact: true }).click();
        await expect(rootB.getByRole('row').filter({ hasText: `${TAG} admin-case` })).toHaveCount(0);
    });
});

/** Create page wizard with an explicit keyword (second page in the same suite). */
async function createPageWithKeyword(page: Page, keyword: string): Promise<number> {
    await page.goto('/admin/pages');
    await page.getByRole('button', { name: /create page/i }).first().click();
    const dialog = page.getByRole('dialog');
    await dialog.getByRole('textbox', { name: 'Keyword' }).fill(keyword);
    await dialog.getByRole('button', { name: 'Next' }).click();
    await dialog.getByRole('combobox', { name: 'Additional access groups' }).click();
    await page.getByRole('option', { name: 'subject' }).click();
    await page.keyboard.press('Escape');
    await dialog.getByRole('button', { name: 'Next' }).click();
    await dialog.getByRole('button', { name: 'Next' }).click();
    const [response] = await Promise.all([
        page.waitForResponse((candidate) => candidate.request().method() === 'POST' && /\/admin\/pages$/.test(candidate.url())),
        dialog.getByRole('button', { name: 'Create Page' }).click(),
    ]);
    expect(response.status(), 'create the admin page').toBe(201);
    const id = ((await response.json()) as { data?: { id?: number } }).data?.id;
    expect(id, 'the admin page has an id').toEqual(expect.any(Number));
    await page.waitForURL(`**/admin/pages/${keyword}`);
    await expect(page.getByRole('heading', { level: 1, name: keyword })).toBeVisible();
    return id as number;
}

async function signedInParticipant(browser: Browser): Promise<{ context: BrowserContext; page: Page }> {
    const context = await browser.newContext({ baseURL: BASE_URL, locale: LOCALE });
    const page = await context.newPage();
    await loginAs(page, env.user.email, env.user.password, env.loginKeyword);
    await page.goto(PATH);
    await waitUntilSettled(page);
    return { context, page };
}

/** Choose a value in the control the author added for the status. */
async function filterStatus(page: Page, root: Locator, value: string): Promise<void> {
    const control = root.getByRole('combobox', { name: 'Filter by progress' });
    await control.click();
    // The options carry how many records have the value: "open (2)".
    await page.getByRole('option', { name: new RegExp(`^${value}( \\(\\d+\\))?$`) }).click();
    await waitUntilSettled(page);
}

/** Remove every record of the run (the page is removed afterwards, which removes the list). */
async function removeTagged(page: Page, target: IListTarget): Promise<void> {
    for (let round = 0; round < 5; round += 1) {
        const { rows } = await listRows(page, target, TAG);
        if (rows.length === 0) {
            return;
        }
        for (const row of rows) {
            await apiDelete(page, '/api/forms/delete', {
                record_id: row.record_id,
                page_id: target.pageId,
                section_id: target.listId,
                expected_version: row.version,
            });
        }
    }
}
