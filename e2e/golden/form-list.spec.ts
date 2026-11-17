/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
/**
 * Golden workflow (web): the entry lists (`entry-form-list`, `data-view`).
 *
 * The pages are the backend QA fixture `QaFormListFixture` (`/qa-entries` with
 * the `entries` list in a modal and the `tasks` list on a page; `/qa-events`
 * with the public read-only `events` view) and the personas of
 * `QaBaselineFixture` (`qa.user` and `qa.editor` share the `subject` group,
 * `qa.guest` is in no group). Everything runs through the real UI and the real
 * BFF; the only shortcut is creating many rows or reading state through the
 * same BFF endpoints the pages use (`e2e/utils/formList.ts`).
 *
 * Mandatory cases (none may be skipped in a recorded run):
 *   - add / view / edit / quick action / history / restore / delete in the modal
 *   - the page presentation next to a second, independent list
 *   - validation errors and unsaved input, a double click, Back with unsaved input
 *   - the URL as the state: direct link, reload, Back/Forward, search, sort, paging
 *   - the server-rendered first paint and no duplicate initial fetch
 *   - a stale save keeps the draft; saving over theirs is a choice
 *   - another account never sees the records of the first
 *   - the read-only view has no write control and forged writes are refused
 *   - desktop 1366x768 and phone 390x844: overflow, axe, keyboard focus
 *
 * Requires a prepared QA stack and the QA env (see `e2e/utils/env.ts`); the
 * spec skips cleanly only when that env is absent.
 */
import { test, expect, type Browser, type BrowserContext, type Page } from '@playwright/test';
import { expectNoSeriousA11yViolations, expectNoSeriousA11yViolationsIn } from '../utils/a11y';
import { isQaConfigured, qaEnv } from '../utils/env';
import {
    apiDelete,
    apiPost,
    apiPut,
    createRecord,
    deleteTagged,
    expectNoPageOverflow,
    fetchHtml,
    formListEnv,
    listRoot,
    listRows,
    listTarget,
    runTag,
    waitUntilSettled,
    watchRequests,
    type IListTarget,
} from '../utils/formList';
import { loginAs } from '../utils/loginAs';

const env = formListEnv();
const TAG = runTag();
/**
 * Contexts made by hand (`browser.newContext`) do not inherit the project's options: they need the `baseURL`
 * and a locale. Without an `Accept-Language` the site answers in its first language (German), and the
 * labels these specs read are the English ones.
 */
const BASE_URL = qaEnv().baseUrl;
const LOCALE = 'en-GB';
const ENTRIES_PATH = `/${env.entriesKeyword}`;
const EVENTS_PATH = `/${env.eventsKeyword}`;

async function signedIn(
    browser: Browser,
    persona: { email: string; password: string },
    viewport?: { width: number; height: number },
): Promise<{ context: BrowserContext; page: Page }> {
    const context = await browser.newContext({ baseURL: BASE_URL, locale: LOCALE, ...(viewport ? { viewport } : {}) });
    const page = await context.newPage();
    await loginAs(page, persona.email, persona.password, env.loginKeyword);
    // The first page after signing in is drawn twice (see waitUntilSettled); get that over with
    // before a test starts typing into a form.
    await page.goto(ENTRIES_PATH);
    await waitUntilSettled(page);
    return { context, page };
}

function searchParam(page: Page, name: string): string | null {
    return new URL(page.url()).searchParams.get(name);
}

test.describe('golden: entry lists (web)', () => {
    test.skip(!isQaConfigured(), 'Set QA_USER_EMAIL + QA_USER_PASSWORD + QA_FORM_PAGE_KEYWORD (and run a QA stack) to execute the golden E2E.');
    test.describe.configure({ mode: 'serial' });

    let userContext: BrowserContext;
    let page: Page;
    let entries: IListTarget;
    let tasks: IListTarget;
    let events: IListTarget;

    test.beforeAll(async ({ browser }) => {
        ({ context: userContext, page } = await signedIn(browser, env.user));
        entries = await listTarget(page, env.entriesKeyword, 'entries');
        tasks = await listTarget(page, env.entriesKeyword, 'tasks');
        events = await listTarget(page, env.eventsKeyword, 'events');
        await deleteTagged(page, entries, 'qa-e2e-');
        await deleteTagged(page, tasks, 'qa-e2e-');
    });

    test.afterAll(async () => {
        await deleteTagged(page, entries, TAG);
        await deleteTagged(page, tasks, TAG);
        await userContext.close();
    });

    // -- the participant workflow in the modal --------------------------------------

    test('a participant adds, views, edits, acts on, restores and deletes an entry in the modal', async () => {
        const title = `${TAG} modal`;
        await page.goto(ENTRIES_PATH);
        const list = listRoot(page, 'entries');
        await expect(list.getByRole('heading', { name: 'Entries' })).toBeVisible();

        // Add: a required field left empty keeps the dialog open and creates nothing.
        const submits = watchRequests(page, /\/forms\/submit/, 'POST');
        await list.getByRole('button', { name: 'Add entry' }).click();
        const dialog = page.getByRole('dialog', { name: 'Add entry' });
        await expect(dialog).toBeVisible();
        expect(searchParam(page, 'entries.mode')).toBe('create');
        const titleBox = dialog.getByRole('textbox', { name: 'Title' });
        await dialog.getByRole('button', { name: 'Save', exact: true }).click();
        await expect(dialog).toBeVisible();
        expect(await titleBox.evaluate((box) => (box as HTMLInputElement).validity.valueMissing), 'the browser stops an empty required field').toBe(true);
        expect(submits.count()).toBe(0);

        // Only spaces pass the browser's check; the form's own check names the field. Nothing is sent either.
        await titleBox.fill('   ');
        await dialog.getByRole('button', { name: 'Save', exact: true }).click();
        await expect(dialog.getByText('Please fill in the following required fields: Title')).toBeVisible();
        expect(submits.count()).toBe(0);

        // The input survives, a double click makes one record.
        await titleBox.fill(title);
        await dialog.getByRole('textbox', { name: 'Notes' }).fill('first notes');
        await dialog.getByRole('button', { name: 'Save', exact: true }).dblclick();
        await expect(dialog).toBeHidden();
        expect(submits.count(), 'a double click on Save must send one request').toBe(1);
        expect(searchParam(page, 'entries.mode')).toBeNull();
        const row = list.getByRole('row').filter({ hasText: title });
        await expect(row).toHaveCount(1);
        await expect(row).toContainText('first notes');

        // View, and the focus returns to the button that opened the dialog.
        const viewButton = list.getByRole('button', { name: `View ${title}` });
        await viewButton.click();
        const viewDialog = page.getByRole('dialog');
        await expect(viewDialog).toContainText('first notes');
        expect(searchParam(page, 'entries.mode')).toBe('view');
        await page.keyboard.press('Escape');
        await expect(viewDialog).toBeHidden();
        await expect(viewButton).toBeFocused();

        // Edit.
        await list.getByRole('button', { name: `Edit ${title}` }).click();
        const editDialog = page.getByRole('dialog');
        await expect(editDialog.getByRole('textbox', { name: 'Notes' })).toHaveValue('first notes');
        await editDialog.getByRole('textbox', { name: 'Notes' }).fill('second notes');
        await editDialog.getByRole('button', { name: /^(Save|Update)$/ }).click();
        await expect(editDialog).toBeHidden();
        await expect(row).toContainText('second notes');

        // Quick action: offered while the entry is open, asks first, changes the status.
        await list.getByRole('button', { name: `Mark done ${title}` }).click();
        const confirmDialog = page.getByRole('dialog', { name: 'Mark done' });
        await expect(confirmDialog).toContainText('Mark this entry done?');
        await confirmDialog.getByRole('button', { name: 'Mark done', exact: true }).click();
        await expect(confirmDialog).toBeHidden();
        await expect(row).toContainText('done');
        await expect(list.getByRole('button', { name: `Mark done ${title}` })).toHaveCount(0);

        // History: the three versions are there; compare two; restore the first.
        await list.getByRole('button', { name: `History ${title}` }).click();
        const history = page.getByTestId('form-list-history');
        await expect(history).toBeVisible();
        await expect(history.locator('[data-version]')).toHaveCount(3);
        await history.getByRole('checkbox', { name: /version 1$/ }).check();
        await history.getByRole('checkbox', { name: /version 3$/ }).check();
        await history.getByRole('button', { name: 'Compare selected' }).click();
        await expect(page.getByTestId('form-list-history-compare')).toContainText('second notes');
        await history.getByRole('button', { name: 'Restore this version: version 1' }).click();
        const restore = page.getByRole('dialog', { name: /Restore this version \(1\)/ });
        await expect(restore).toContainText('What a restore would change');
        await restore.getByRole('button', { name: 'Restore', exact: true }).click();
        await expect(restore).toBeHidden();
        await page.keyboard.press('Escape');
        await expect(page.getByRole('dialog')).toHaveCount(0);
        await expect(row).toContainText('first notes');
        await expect(list.getByRole('button', { name: `Mark done ${title}` })).toBeVisible();

        // Delete: asks first, then the row is gone.
        await list.getByRole('button', { name: `Delete ${title}` }).click();
        const deleteDialog = page.getByRole('dialog', { name: 'Delete' });
        await expect(deleteDialog).toContainText('Delete this entry?');
        await deleteDialog.getByRole('button', { name: 'Delete', exact: true }).click();
        await expect(deleteDialog).toBeHidden();
        await expect(row).toHaveCount(0);
    });

    // -- unsaved input -------------------------------------------------------------

    test('cancelling and the Back button ask before unsaved input is lost', async () => {
        await page.goto(ENTRIES_PATH);
        const list = listRoot(page, 'entries');
        await list.getByRole('button', { name: 'Add entry' }).click();
        const dialog = page.getByRole('dialog', { name: 'Add entry' });
        await dialog.getByRole('textbox', { name: 'Title' }).fill(`${TAG} unsaved`);

        // Cancel asks; "Keep editing" keeps everything.
        await dialog.getByRole('button', { name: 'Cancel', exact: true }).click();
        const discard = page.getByRole('dialog', { name: 'Discard your changes?' });
        await expect(discard).toBeVisible();
        await discard.getByRole('button', { name: 'Keep editing' }).click();
        await expect(discard).toBeHidden();
        await expect(dialog.getByRole('textbox', { name: 'Title' })).toHaveValue(`${TAG} unsaved`);

        // The browser's Back button asks too, and puts the form's address back.
        await page.goBack();
        await expect(discard).toBeVisible();
        expect(searchParam(page, 'entries.mode')).toBe('create');
        await discard.getByRole('button', { name: 'Keep editing' }).click();
        await expect(dialog.getByRole('textbox', { name: 'Title' })).toHaveValue(`${TAG} unsaved`);

        // Escape asks as well, and the question stays until it is answered: the key press that opened it
        // is not also delivered to the question. Escape on the question is "Keep editing".
        await dialog.getByRole('textbox', { name: 'Title' }).press('Escape');
        await expect(discard).toBeVisible();
        await page.waitForTimeout(600);
        await expect(discard).toBeVisible();
        await page.keyboard.press('Escape');
        await expect(discard).toBeHidden();
        await expect(dialog.getByRole('textbox', { name: 'Title' })).toHaveValue(`${TAG} unsaved`);
        expect(searchParam(page, 'entries.mode')).toBe('create');

        // Discarding closes the form and creates nothing.
        await dialog.getByRole('button', { name: 'Cancel', exact: true }).click();
        await discard.getByRole('button', { name: 'Discard changes' }).click();
        await expect(page.getByRole('dialog')).toHaveCount(0);
        expect(searchParam(page, 'entries.mode')).toBeNull();
        expect((await listRows(page, entries, `${TAG} unsaved`)).total).toBe(0);
    });

    // -- the URL is the state ------------------------------------------------------

    test('search, sort and paging live in the URL and survive a reload and Back', async () => {
        for (let i = 1; i <= 7; i++) {
            await createRecord(page, entries, { qa_entry_title: `${TAG} paging ${String(i).padStart(2, '0')}`, qa_entry_status: 'open', qa_entry_notes: '' });
        }
        await page.goto(`${ENTRIES_PATH}?entries.q=${encodeURIComponent(`${TAG} paging`)}`);
        const list = listRoot(page, 'entries');
        await expect(list.getByRole('row').filter({ hasText: `${TAG} paging` })).toHaveCount(5);

        // Paging: the second page holds the other two.
        await list.getByRole('button', { name: 'Page 2' }).click();
        await expect.poll(() => searchParam(page, 'entries.page')).toBe('2');
        await expect(list.getByRole('row').filter({ hasText: `${TAG} paging` })).toHaveCount(2);
        await page.reload();
        await expect(list.getByRole('row').filter({ hasText: `${TAG} paging` })).toHaveCount(2);

        // Back returns to the first page.
        await page.goBack();
        await expect.poll(() => searchParam(page, 'entries.page')).toBeNull();
        await expect(list.getByRole('row').filter({ hasText: `${TAG} paging` })).toHaveCount(5);
        await page.goForward();
        await expect(list.getByRole('row').filter({ hasText: `${TAG} paging` })).toHaveCount(2);

        // Sort: the header sorts; the order is in the URL.
        await page.goto(`${ENTRIES_PATH}?entries.q=${encodeURIComponent(`${TAG} paging`)}`);
        await list.getByRole('button', { name: 'Sort by Title' }).click();
        await expect.poll(() => searchParam(page, 'entries.sort')).toMatch(/:asc$/);
        await expect(list.getByRole('row').nth(1)).toContainText(`${TAG} paging 01`);
        await list.getByRole('button', { name: 'Sort by Title' }).click();
        await expect.poll(() => searchParam(page, 'entries.sort')).toMatch(/:desc$/);
        await expect(list.getByRole('row').nth(1)).toContainText(`${TAG} paging 07`);

        // Search: typing narrows the list after a pause, once, in the URL.
        await page.goto(ENTRIES_PATH);
        await list.getByRole('searchbox', { name: 'Search' }).fill(`${TAG} paging 03`);
        await expect.poll(() => searchParam(page, 'entries.q')).toBe(`${TAG} paging 03`);
        await expect(list.getByRole('row').filter({ hasText: `${TAG} paging` })).toHaveCount(1);
    });

    test('the first paint is server-rendered and hydration reads nothing again', async () => {
        const title = `${TAG} ssr`;
        await createRecord(page, entries, { qa_entry_title: title, qa_entry_status: 'open', qa_entry_notes: '' });

        // The server's HTML already holds the row, before any script runs.
        const html = await fetchHtml(page, `${ENTRIES_PATH}?entries.q=${encodeURIComponent(title)}`);
        expect(html).toContain(title);

        // The page shows it without a request for the list state.
        const states = watchRequests(page, /\/lists\/\d+\/state/);
        await page.goto(`${ENTRIES_PATH}?entries.q=${encodeURIComponent(title)}`);
        await expect(listRoot(page, 'entries').getByRole('row').filter({ hasText: title })).toHaveCount(1);
        await page.waitForLoadState('networkidle');
        expect(states.urls(), 'hydration must not fetch the first state again').toEqual([]);

        // A change in the list reads exactly once.
        await listRoot(page, 'entries').getByRole('button', { name: 'Sort by Title' }).click();
        await expect.poll(() => states.count()).toBe(1);
    });

    test('two lists on one page are independent, and a list change keeps the rest of the page', async () => {
        const task = `${TAG} task`;
        const group = `${TAG} duo`;
        for (let i = 1; i <= 6; i++) {
            await createRecord(page, entries, { qa_entry_title: `${group} ${String(i).padStart(2, '0')}`, qa_entry_status: 'open', qa_entry_notes: '' });
        }
        await page.goto(`${ENTRIES_PATH}?entries.q=${encodeURIComponent(group)}`);
        const entriesList = listRoot(page, 'entries');
        const tasksList = listRoot(page, 'tasks');
        await expect(entriesList.getByRole('row').filter({ hasText: group })).toHaveCount(5);

        // The tasks list shows its form on its own page, inside the tasks list only.
        await tasksList.getByRole('button', { name: 'Add entry' }).click();
        const record = tasksList.getByTestId('form-list-record-page');
        await expect(record).toBeVisible();
        expect(searchParam(page, 'tasks.mode')).toBe('create');
        expect(searchParam(page, 'entries.q')).toBe(group);
        await expect(entriesList.getByRole('row').filter({ hasText: group })).toHaveCount(5);

        // A draft in the tasks form is kept while the entries list changes.
        await record.getByRole('textbox', { name: 'Task' }).fill(task);
        await entriesList.getByRole('button', { name: 'Sort by Title' }).click();
        await expect.poll(() => searchParam(page, 'entries.sort')).toMatch(/:asc$/);
        await expect(record.getByRole('textbox', { name: 'Task' })).toHaveValue(task);
        expect(searchParam(page, 'tasks.mode')).toBe('create');

        // Saving the task returns the tasks list; the entries list kept its own state.
        await record.getByRole('button', { name: 'Save', exact: true }).click();
        await expect(record).toBeHidden();
        await expect(tasksList.getByRole('row').filter({ hasText: task })).toHaveCount(1);
        expect(searchParam(page, 'tasks.mode')).toBeNull();
        expect(searchParam(page, 'entries.sort')).toMatch(/:asc$/);
        expect(searchParam(page, 'entries.q')).toBe(group);
    });

    test('a direct link to an open record shows it, also after a reload', async () => {
        const title = `${TAG} link`;
        await createRecord(page, entries, { qa_entry_title: title, qa_entry_status: 'open', qa_entry_notes: 'linked notes' });
        const { rows } = await listRows(page, entries, title);
        const id = rows[0]?.record_id;
        expect(id).toBeGreaterThan(0);

        for (const mode of ['view', 'edit'] as const) {
            await page.goto(`${ENTRIES_PATH}?entries.record=${id}&entries.mode=${mode}`);
            const dialog = page.getByRole('dialog');
            await expect(dialog).toBeVisible();
            if (mode === 'view') {
                await expect(dialog).toContainText('linked notes');
            } else {
                await expect(dialog.getByRole('textbox', { name: 'Title' })).toHaveValue(title);
            }
            await page.reload();
            await expect(page.getByRole('dialog')).toBeVisible();
        }

        // A record that is not the visitor's cannot be opened by changing the number.
        await page.goto(`${ENTRIES_PATH}?entries.record=999999&entries.mode=view`);
        await expect(page.getByText('This entry no longer exists or you may not open it.')).toBeVisible();
    });

    // -- conflicts -----------------------------------------------------------------

    test('a stale save keeps the draft and saving over theirs is a choice', async ({ browser }) => {
        const title = `${TAG} conflict`;
        await createRecord(page, entries, { qa_entry_title: title, qa_entry_status: 'open', qa_entry_notes: 'original notes' });
        const { rows } = await listRows(page, entries, title);
        const id = rows[0]?.record_id;

        const other = await signedIn(browser, env.user);
        try {
            const link = `${ENTRIES_PATH}?entries.record=${id}&entries.mode=edit`;
            await page.goto(link);
            await other.page.goto(link);
            const mine = page.getByRole('dialog');
            const theirs = other.page.getByRole('dialog');
            await expect(mine.getByRole('textbox', { name: 'Notes' })).toHaveValue('original notes');
            await expect(theirs.getByRole('textbox', { name: 'Notes' })).toHaveValue('original notes');

            // The other session saves first.
            await theirs.getByRole('textbox', { name: 'Notes' }).fill('their notes');
            await theirs.getByRole('button', { name: /^(Save|Update)$/ }).click();
            await expect(theirs).toBeHidden();

            // This session saves a stale version: nothing is lost, the draft stays.
            await mine.getByRole('textbox', { name: 'Notes' }).fill('my notes');
            await mine.getByRole('button', { name: /^(Save|Update)$/ }).click();
            const conflict = page.getByTestId('form-list-conflict');
            await expect(conflict).toBeVisible();
            await expect(conflict).toContainText('Someone else changed this entry');
            await expect(mine.getByRole('textbox', { name: 'Notes' })).toHaveValue('my notes');

            // What changed can be reviewed.
            await conflict.getByRole('button', { name: 'Review what changed' }).click();
            await expect(conflict).toContainText('their notes');

            // Saving over theirs is explicit.
            await conflict.getByRole('button', { name: 'Keep my changes and save over theirs' }).click();
            await mine.getByRole('button', { name: /^(Save|Update)$/ }).click();
            await expect(mine).toBeHidden();
            await expect(listRoot(page, 'entries').getByRole('row').filter({ hasText: title })).toContainText('my notes');
        } finally {
            await other.context.close();
        }
    });

    // -- other accounts ------------------------------------------------------------

    test('another account never sees the records of the first one', async ({ browser }) => {
        const title = `${TAG} mine`;
        await createRecord(page, entries, { qa_entry_title: title, qa_entry_status: 'open', qa_entry_notes: '' });
        await page.goto(`${ENTRIES_PATH}?entries.q=${encodeURIComponent(TAG)}`);
        await expect(listRoot(page, 'entries').getByRole('row').filter({ hasText: title })).toHaveCount(1);

        // The same address for qa.editor: server-rendered and fetched, never the first user's rows.
        const editor = await signedIn(browser, env.editor);
        try {
            const html = await fetchHtml(editor.page, `${ENTRIES_PATH}?entries.q=${encodeURIComponent(TAG)}`);
            expect(html).not.toContain(title);
            await editor.page.goto(`${ENTRIES_PATH}?entries.q=${encodeURIComponent(TAG)}`);
            await expect(listRoot(editor.page, 'entries').getByRole('heading', { name: 'Entries' })).toBeVisible();
            await expect(editor.page.getByText(title)).toHaveCount(0);
            await expect(listRoot(editor.page, 'entries').getByText('No entries match your search or filters.')).toBeVisible();

            // The first user's record cannot be opened by number either.
            const { rows } = await listRows(page, entries, title);
            await editor.page.goto(`${ENTRIES_PATH}?entries.record=${rows[0]?.record_id}&entries.mode=view`);
            await expect(editor.page.getByText('This entry no longer exists or you may not open it.')).toBeVisible();
        } finally {
            await editor.context.close();
        }

        // A signed-in user outside the group does not get the private page at all.
        const outsider = await signedIn(browser, env.guest);
        try {
            await outsider.page.goto(ENTRIES_PATH);
            await expect(outsider.page.locator('[data-form-list]')).toHaveCount(0);
            await expect(outsider.page.getByText(title)).toHaveCount(0);
        } finally {
            await outsider.context.close();
        }
    });

    // -- the read-only view --------------------------------------------------------

    test('the public view only shows: no write control, and forged writes are refused', async ({ browser }) => {
        const guest = await browser.newContext({ baseURL: BASE_URL, locale: LOCALE });
        const guestPage = await guest.newPage();
        try {
            await guestPage.goto(EVENTS_PATH);
            const html = await fetchHtml(guestPage, EVENTS_PATH);
            expect(html, 'the public view is server-rendered').toContain('QA event 01');

            const view = listRoot(guestPage, 'events');
            await expect(view.getByRole('heading', { name: 'Events' })).toBeVisible();
            await expect(view.getByRole('row').filter({ hasText: 'QA event' })).toHaveCount(5);
            await expect(view.getByRole('button', { name: /^(Add|Edit|Delete|History)/ })).toHaveCount(0);
            await expect(view.getByRole('link', { name: /^(Add|Edit|Delete)/ })).toHaveCount(0);

            // Search and paging work for a visitor.
            await view.getByRole('button', { name: 'Page 3' }).click();
            await expect(view.getByRole('row').filter({ hasText: 'QA event' })).toHaveCount(2);
            await guestPage.goto(EVENTS_PATH);
            await view.getByRole('searchbox', { name: 'Search' }).fill('Zurich');
            await expect.poll(() => searchParam(guestPage, 'events.q')).toBe('Zurich');
            await expect(view.getByRole('row').filter({ hasText: 'Zurich' })).toHaveCount(4);

            // Forged writes against the view are refused, for a visitor and for a signed-in user,
            // with a valid CSRF token so the refusal comes from the server's own rules.
            const before = await listRows(guestPage, events);
            const first = before.rows[0];
            expect(before.total).toBe(12);
            for (const actor of [guestPage, page]) {
                const attempts = [
                    await apiPost(actor, '/api/forms/submit', { page_id: events.pageId, section_id: events.listId, form_data: { title: 'forged' } }),
                    await apiPut(actor, '/api/forms/update', { page_id: events.pageId, section_id: events.listId, form_data: { title: 'forged' }, update_based_on: { record_id: first?.record_id } }),
                    await apiDelete(actor, '/api/forms/delete', { page_id: events.pageId, section_id: events.listId, record_id: first?.record_id }),
                ];
                test.info().annotations.push({
                    type: `forged writes as ${actor === guestPage ? 'a visitor' : 'a signed-in user'}`,
                    description: `submit ${attempts[0]?.status}, update ${attempts[1]?.status}, delete ${attempts[2]?.status}`,
                });
                for (const attempt of attempts) {
                    // A refusal by the rules (not "no such route"): 4xx but never 404/405.
                    expect(attempt.status, JSON.stringify(attempt.json)).toBeGreaterThanOrEqual(400);
                    expect(attempt.status, JSON.stringify(attempt.json)).toBeLessThan(500);
                    expect([404, 405], JSON.stringify(attempt.json)).not.toContain(attempt.status);
                }
            }
            const after = await listRows(guestPage, events);
            expect(after.total).toBe(12);
            expect(after.rows[0]?.values).toEqual(first?.values);
        } finally {
            await guest.close();
        }
    });

    // -- the two screen sizes ------------------------------------------------------

    for (const size of [
        { name: 'desktop 1366x768', width: 1366, height: 768 },
        { name: 'phone 390x844', width: 390, height: 844 },
    ]) {
        test(`${size.name}: no sideways page scroll, keyboard focus, and no serious accessibility violations`, async ({ browser }) => {
            const long = `${TAG} ${'a very long label '.repeat(8)}${'x'.repeat(60)}`;
            await createRecord(page, entries, { qa_entry_title: long, qa_entry_status: 'open', qa_entry_notes: 'n'.repeat(300) });
            for (let i = 1; i <= 5; i++) {
                await createRecord(page, entries, { qa_entry_title: `${TAG} size ${i}`, qa_entry_status: 'open', qa_entry_notes: '' });
            }

            const { context, page: sized } = await signedIn(browser, env.user, { width: size.width, height: size.height });
            try {
                // Many rows with a very long value.
                await sized.goto(`${ENTRIES_PATH}?entries.q=${encodeURIComponent(TAG)}`);
                const list = listRoot(sized, 'entries');
                await expect(list.getByRole('heading', { name: 'Entries' })).toBeVisible();
                await expect(list.getByRole('button', { name: 'Page 2' })).toBeVisible();
                await expectNoPageOverflow(sized, `${size.name} list`);
                await expectNoSeriousA11yViolations(sized, `${size.name}: entries list`);

                // Keyboard: the add button opens the form, focus moves into it and comes back on Escape.
                const add = list.getByRole('button', { name: 'Add entry' });
                await add.focus();
                await sized.keyboard.press('Enter');
                const dialog = sized.getByRole('dialog', { name: 'Add entry' });
                await expect(dialog).toBeVisible();
                await expect(dialog.locator(':focus')).toHaveCount(1);
                await expectNoPageOverflow(sized, `${size.name} form`);
                await expectNoSeriousA11yViolationsIn(sized, '[role="dialog"]', `${size.name}: entry form`);

                // Errors: the message is in the dialog, the dialog does not overflow.
                await dialog.getByRole('textbox', { name: 'Title' }).fill('   ');
                await dialog.getByRole('button', { name: 'Save', exact: true }).click();
                await expect(dialog.getByText('Please fill in the following required fields: Title')).toBeVisible();
                const dialogSizes = await dialog.evaluate((node) => ({ scroll: node.scrollWidth, client: node.clientWidth }));
                expect(dialogSizes.scroll).toBeLessThanOrEqual(dialogSizes.client);
                await expectNoSeriousA11yViolationsIn(sized, '[role="dialog"]', `${size.name}: entry form with an error`);
                // Spaces only count as input worth asking about; leaving asks, and discarding closes.
                await sized.keyboard.press('Escape');
                await sized.getByRole('dialog', { name: 'Discard your changes?' }).getByRole('button', { name: 'Discard changes' }).click();
                await expect(sized.getByRole('dialog')).toHaveCount(0);
                await expect(add).toBeFocused();

                // A page with no rows for this account.
                const emptyAccount = await signedIn(browser, env.editor, { width: size.width, height: size.height });
                try {
                    await emptyAccount.page.goto(ENTRIES_PATH);
                    await expect(listRoot(emptyAccount.page, 'entries').getByTestId('form-list-empty')).toBeVisible();
                    await expectNoPageOverflow(emptyAccount.page, `${size.name} empty list`);
                    await expectNoSeriousA11yViolations(emptyAccount.page, `${size.name}: empty list`);
                } finally {
                    await emptyAccount.context.close();
                }

                // The public view.
                await sized.goto(EVENTS_PATH);
                await expect(listRoot(sized, 'events').getByRole('row').filter({ hasText: 'QA event' })).toHaveCount(5);
                await expectNoPageOverflow(sized, `${size.name} public view`);
                await expectNoSeriousA11yViolations(sized, `${size.name}: public view`);
            } finally {
                await context.close();
            }
        });
    }
});
