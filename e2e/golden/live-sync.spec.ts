/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
/**
 * Live sync golden spec (task `2026-11-20-live-sync-and-edit-lock`, part 7).
 *
 * What two or three real browsers show while somebody else changes the data, across the whole stack:
 * backend change notice -> Mercure hub -> Next.js BFF re-stream -> shared SSE -> tag map -> refetch.
 *
 *   1. Grant:         a group gets `select` on a page; the member's open site shows it in the header menu.
 *   2. Role grant:    a role gets update on a page (F250); the holder's open admin page list shows it.
 *   3. Publish:       an editor publishes; a member and a guest viewing the page see the new text.
 *   4. Delayed result: a record is saved for the member by somebody else; the page that reads it through
 *                     `{{...}}` shows it and the half-typed input elsewhere on the page keeps its text.
 *   5. Lock:          editor A holds the page, B opens it read-only with A's name and takes over, A's
 *                     editor turns read-only, A's write is refused.
 *   6. Version:       two writes based on one draft version; the second one is refused as stale.
 *
 * Each change must show in the observer within 3 s, without a reload (the brief's bound).
 *
 * The stack must publish for real: the QA backend swaps the Mercure hub for a recorder in
 * `APP_ENV=test`, and `SELFHELP_E2E_REAL_HUB=1` (set by `scripts/e2e-stack.mjs`) makes the recorder
 * forward every update to the test hub.
 *
 * Run: `node scripts/e2e-stack.mjs golden --grep live.sync`. On Windows the harness starts Playwright
 * through a shell, which splits a quoted `"live sync"` into two arguments and runs every test whose
 * title has "live"; the dot matches the space and keeps the pattern one word.
 *
 * The describe is serial: the backend of the stack (`php -S`) answers one request at a time on
 * Windows, and the scenarios share the accounts, the group and the role created once for the run.
 */
import { test, expect, type BrowserContext, type Locator, type Page } from '@playwright/test';
import { expandNestedMenuGroups, pageEntry } from '../utils/access';
import { loginAs } from '../utils/loginAs';
import { qaEnv } from '../utils/env';
import {
    BackendPersona,
    CRUD_READ_UPDATE,
    addSection,
    createAccount,
    createEditorRole,
    createGroup,
    createPage,
    openSession,
    publishPage,
    setGroupPages,
    setRolePages,
    setSectionText,
    syncTag,
    watchLiveConnection,
    SYNC_PASSWORD,
    type IMadePage,
} from '../utils/liveSync';

/** The brief's bound: a change shows in an open page within 3 s. */
const LIVE_MS = 3_000;
/**
 * A single-threaded backend (`php -S` on Windows) answers the several requests of one refetch one after
 * the other. The e2e harness relaxes its hard limits by this factor there (`SELFHELP_E2E_PERF_HARD_MULTIPLIER`,
 * 3 on Windows, 1 on CI); a change that shows later than 3 s is still recorded as a warning.
 */
const HARD_MULTIPLIER = Math.max(1, Number(process.env.SELFHELP_E2E_PERF_HARD_MULTIPLIER ?? 1));
const HARD_LIVE_MS = LIVE_MS * HARD_MULTIPLIER;

/**
 * Expect a locator to show within the bound, counted from `since` (the moment the change was
 * answered). The measured latency is recorded as an annotation of the test, and so is a latency over
 * 3 s on a stack that is allowed more. When the hard limit is missed the spec still waits a little
 * longer, so the failure says how late the page really was.
 */
async function expectLive(locator: Locator, what: string, since: number): Promise<void> {
    const assertion = async (timeout: number) => expect(locator).toBeVisible({ timeout });
    try {
        await assertion(Math.max(500, HARD_LIVE_MS - (Date.now() - since)));
    } catch {
        let lateBy = 'never (waited 15 s more)';
        try {
            await assertion(15_000);
            lateBy = `${Date.now() - since} ms`;
        } catch {
            /* reported below */
        }
        throw new Error(`${what}: not within ${HARD_LIVE_MS} ms of the change; it showed after ${lateBy}`);
    }
    const latency = Date.now() - since;
    test.info().annotations.push({ type: 'latency', description: `${what}: ${latency} ms` });
    if (latency > LIVE_MS) {
        test.info().annotations.push({ type: 'over-budget', description: `${what}: ${latency} ms is over ${LIVE_MS} ms (allowed up to ${HARD_LIVE_MS} ms on this stack)` });
    }
}

const ADMIN_EMAIL = process.env.QA_ADMIN_EMAIL ?? 'qa.admin@selfhelp.test';

/** The QA feedback form (fixture `QaFrontendGoldenFixture`): the data store table the delayed-result page reads. */
const FEEDBACK_PAGE_ID = Number(process.env.QA_FEEDBACK_PAGE_ID ?? 94);
const FEEDBACK_FORM_ID = Number(process.env.QA_FEEDBACK_FORM_ID ?? 237);
const FEEDBACK_INPUT_ID = Number(process.env.QA_FEEDBACK_INPUT_ID ?? 238);

test.describe.serial('live sync', () => {
    const tag = syncTag();
    const baseURL = qaEnv().baseUrl;

    let admin: BackendPersona;
    let groupId: number;
    let roleId: number;
    let member: { id: number; email: string };
    let editor: { id: number; email: string };
    const pages: IMadePage[] = [];
    const sessions: BrowserContext[] = [];

    const emailOf = (who: string): string => `${tag}-${who}@selfhelp.test`;

    async function makePage(suffix: string, options: Omit<Parameters<typeof createPage>[1], 'keyword'>): Promise<IMadePage> {
        const made = await createPage(admin, { keyword: `${tag}-${suffix}`, ...options });
        pages.push(made);
        return made;
    }

    async function openAs(browser: Parameters<typeof openSession>[0], email: string | null, path: string): Promise<Page> {
        const { context, page } = await openSession(browser, baseURL);
        sessions.push(context);
        if (email !== null) {
            await loginAs(page, email, SYNC_PASSWORD);
        }
        // The stream of the page being opened (not the one of the login page before it) is the one to wait for.
        const connected = watchLiveConnection(page);
        await page.goto(path);
        await connected;
        return page;
    }

    test.beforeAll(async () => {
        test.setTimeout(120_000);
        admin = await BackendPersona.login(ADMIN_EMAIL);
        groupId = await createGroup(admin, tag);
        roleId = await createEditorRole(admin, `${tag}-editors`);
        member = await createAccount(admin, emailOf('member'), { groupIds: [groupId] });
        editor = await createAccount(admin, emailOf('editor'), { roleIds: [roleId] });
    });

    test.afterAll(async () => {
        test.setTimeout(120_000);
        for (const context of sessions) {
            await context.close().catch(() => undefined);
        }
        const attempt = async (step: () => Promise<unknown>): Promise<void> => {
            try {
                await step();
            } catch {
                /* the cleanup goes on; a leftover carries the run tag */
            }
        };
        for (const made of pages) {
            await attempt(async () => {
                await admin.call('POST', `/admin/pages/${made.id}/lock/take-over`);
                await admin.draftWrite(made.id, 'DELETE', `/admin/pages/${made.id}`);
            });
        }
        for (const account of [member, editor]) {
            if (account) {
                await attempt(() => admin.call('POST', `/admin/users/${account.id}/clean-data`, {}));
                await attempt(() => admin.call('DELETE', `/admin/users/${account.id}`));
            }
        }
        if (roleId) {
            await attempt(() => admin.call('DELETE', `/admin/roles/${roleId}`));
        }
        if (groupId) {
            await attempt(() => admin.call('DELETE', `/admin/groups/${groupId}`));
        }
    });

    test('grant: a group right shows the page in the member\'s open header menu', async ({ browser }) => {
        const page = await makePage('grant', { inHeaderMenu: true, text: 'qa grant text', publish: true });
        const observer = await openAs(browser, member.email, '/');
        const menuLink = observer.getByRole('link', { name: page.keyword, exact: true });
        await expect(menuLink, 'the member does not see the page before the grant').toHaveCount(0);

        await setGroupPages(admin, groupId, [page.id]);
        const since = Date.now();

        await expectLive(menuLink.first(), 'grant: the header menu shows the page', since);
    });

    test('role grant (F250): update on a page shows it in the open admin page list of the holder', async ({ browser }) => {
        const page = await makePage('role', { text: 'qa role text', publish: true });
        const observer = await openAs(browser, editor.email, '/admin/pages');
        const nav = observer.locator('nav').first();
        // The pages the holder may open sit in the "Content Pages" group of the menu; without a grant there is none.
        const group = nav.getByText('Content Pages', { exact: true });
        await expect(nav.getByText('Pages', { exact: true }), 'the admin menu is open').toBeVisible();
        await expect(group, 'the holder has no page before the grant').toHaveCount(0);

        await setRolePages(admin, roleId, [{ pageId: page.id, crud: CRUD_READ_UPDATE }]);
        const since = Date.now();

        await expectLive(group, 'role grant: the admin page list shows the page group', since);
        await expandNestedMenuGroups(observer);
        await expect(pageEntry(observer, page.keyword), 'the page is in the list').toBeVisible();
    });

    test('publish: a member and a guest viewing the page see the new text', async ({ browser }) => {
        const page = await makePage('publish', { openAccess: true, text: 'qa text one', publish: true });
        const memberView = await openAs(browser, member.email, `/${page.keyword}`);
        const guestView = await openAs(browser, null, `/${page.keyword}`);
        await expect(memberView.getByText('qa text one')).toBeVisible();
        await expect(guestView.getByText('qa text one')).toBeVisible();

        await setSectionText(admin, page, 'qa text two');
        await publishPage(admin, page);
        const since = Date.now();

        await expectLive(memberView.getByText('qa text two'), 'publish: the member sees the published text', since);
        await expectLive(guestView.getByText('qa text two'), 'publish: the guest sees the published text', since);
        await expect(memberView.getByText('qa text one')).toHaveCount(0);
    });

    test('delayed result: a record saved for the member shows on the open page and keeps the half-typed input', async ({ browser }) => {
        // The feedback form saves into the generic data store (its table is named after the form section);
        // the page reads the member's last record from it. The form belongs to the default group.
        const memberApi = await BackendPersona.login(member.email);
        const groups = await admin.ok<{ groups: Array<{ id: number; name: string }> }>('GET', '/admin/groups?pageSize=100');
        const subjectId = groups.groups.find((group) => group.name === 'subject')?.id;
        expect(subjectId, 'the default group exists').toBeDefined();
        await admin.ok('POST', '/admin/users/bulk-add-to-group', { user_ids: [member.id], group_ids: [subjectId] });

        const seed = `${tag}-seed`;
        const first = await memberApi.call('POST', '/forms/submit', { page_id: FEEDBACK_PAGE_ID, section_id: FEEDBACK_FORM_ID, form_data: { qa_message: seed } });
        expect(first.status, `the member saves a first record: ${JSON.stringify(first.json)}`).toBeLessThan(300);
        const tableName = String(FEEDBACK_FORM_ID);

        const page = await makePage('delayed', {
            accessGroupIds: [groupId],
            text: `Result: {{fb.section_${FEEDBACK_INPUT_ID}}}`,
            dataConfig: [{ table: tableName, retrieve: 'last', current_user: true, scope: 'fb', all_fields: true }],
            publish: true,
        });
        // Another input on the same page, outside the data, keeps what is typed while the data changes.
        await addSection(admin, page, 'text-input', 'qa_sync_input', { label: 'qa sync input' });
        await publishPage(admin, page);
        await admin.releaseLock(page.id);

        const observer = await openAs(browser, member.email, `/${page.keyword}`);
        await expect(observer.getByText(`Result: ${seed}`)).toBeVisible();
        const input = observer.getByLabel('qa sync input');
        const typed = 'half typed';
        await input.fill(typed);

        const result = `${tag}-result`;
        const saved = await memberApi.call('POST', '/forms/submit', { page_id: FEEDBACK_PAGE_ID, section_id: FEEDBACK_FORM_ID, form_data: { qa_message: result } });
        expect(saved.status, `the result is saved for the member: ${JSON.stringify(saved.json)}`).toBeLessThan(300);
        const since = Date.now();

        await expectLive(observer.getByText(`Result: ${result}`), 'delayed result: the page shows the new value', since);
        await expect(input, 'the half-typed text stays').toHaveValue(typed);
    });

    test('lock: the second editor takes over, the first turns read-only and its write is refused', async ({ browser }) => {
        const page = await makePage('lock', { text: 'qa lock text', publish: true });
        await setRolePages(admin, roleId, [{ pageId: page.id, crud: CRUD_READ_UPDATE }]);

        const editorA = await openAs(browser, ADMIN_EMAIL, `/admin/pages/${page.keyword}`);
        const lockOf = async () => admin.ok<{ held: boolean; holder: { name: string } | null }>('GET', `/admin/pages/${page.id}/lock`);
        await expect.poll(async () => (await lockOf()).held, { timeout: 10_000, message: 'editor A holds the lock' }).toBe(true);
        await expect(editorA.getByTestId('page-lock-banner')).toHaveCount(0);

        const editorB = await openAs(browser, editor.email, `/admin/pages/${page.keyword}`);
        const bannerB = editorB.getByTestId('page-lock-banner');
        await expect(bannerB, 'editor B opens the page read-only, with the name of A').toContainText('is editing this page', { timeout: 10_000 });
        await expect(bannerB).toContainText('QA Admin');

        await bannerB.getByRole('button', { name: 'Take over' }).click();
        const confirmed = editorB.waitForResponse((response) => /\/lock\/take-over/.test(response.url()) && response.request().method() === 'POST');
        await editorB.getByRole('dialog').getByRole('button', { name: 'Take over' }).click();
        await confirmed;
        const tookOverAt = Date.now();
        await expect(bannerB, 'B edits now').toHaveCount(0, { timeout: 10_000 });

        const bannerA = editorA.getByTestId('page-lock-banner');
        await expectLive(bannerA.filter({ hasText: 'took over editing this page' }), 'lock: A is told that B took over', tookOverAt);

        const refused = await admin.draftWrite(page.id, 'PUT', `/admin/pages/${page.id}`, { pageData: { headless: false }, fields: [] });
        expect(refused.status, 'A\'s write is refused while B holds the lock').toBe(409);
        expect(refused.json?.error).toBe('page_locked');
    });

    test('version: two writes based on one draft version, the second is refused as stale', async () => {
        const page = await makePage('version', { text: 'qa version text', publish: true });
        await setRolePages(admin, roleId, [{ pageId: page.id, crud: CRUD_READ_UPDATE }]);
        const editorApi = await BackendPersona.login(editor.email);

        const base = await admin.draftVersion(page.id);
        const body = { pageData: { headless: false }, fields: [] };
        const first = await admin.call('PUT', `/admin/pages/${page.id}`, body, { 'X-Page-Version': String(base) });
        expect(first.status, `the first write at version ${base}`).toBe(200);
        await admin.releaseLock(page.id);

        const second = await editorApi.call('PUT', `/admin/pages/${page.id}`, body, { 'X-Page-Version': String(base) });
        expect(second.status, 'the second write, based on the same version').toBe(409);
        expect(second.json?.error).toBe('stale_page_version');

        const missing = await editorApi.call('PUT', `/admin/pages/${page.id}`, body);
        expect(missing.status, 'a draft write without a version').toBe(400);
        expect(missing.json?.error).toBe('page_version_required');
    });
});
