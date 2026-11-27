/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
/**
 * Plugin live sync golden spec (task `2026-11-25-plugin-resource-hooks`, P10).
 *
 * Proves `sh2-qa-live` resource notices → Mercure → BFF → plugin sync maps, within 3 s
 * and without a reload. The QA plugin is installed by `scripts/e2e-stack.mjs` on golden runs.
 *
 * Run: `node scripts/e2e-stack.mjs golden --grep "plugin live sync"`
 */
import { test, expect, type BrowserContext, type Locator, type Page } from '@playwright/test';
import { qaEnv } from '../utils/env';
import { loginAs } from '../utils/loginAs';
import {
    BackendPersona,
    createAccount,
    createGroup,
    createPage,
    openSession,
    publishPage,
    setGroupPages,
    syncTag,
    watchLiveConnection,
    SYNC_PASSWORD,
    type IMadeAccount,
    type IMadePage,
} from '../utils/liveSync';
import {
    QA_LIVE_ADMIN_ITEMS_PATH,
    addQaLiveItemSection,
    attachQaLiveJobAction,
    bindLastRecordText,
    createQaLiveItem,
    createRoleWithNamedPermissions,
    dataTableIdByName,
    deleteQaLiveItem,
    grantGroupUpdate,
    grantQaLiveItemView,
    publishQaLiveItem,
    runQueuedJobs,
    updateQaLiveItemTitle,
    writeForUser,
} from '../utils/qaLivePlugin';

const LIVE_MS = 3_000;
const HARD_MULTIPLIER = Math.max(1, Number(process.env.SELFHELP_E2E_PERF_HARD_MULTIPLIER ?? 1));
const HARD_LIVE_MS = LIVE_MS * HARD_MULTIPLIER;

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
        test.info().annotations.push({
            type: 'over-budget',
            description: `${what}: ${latency} ms is over ${LIVE_MS} ms (allowed up to ${HARD_LIVE_MS} ms on this stack)`,
        });
    }
}

const ADMIN_EMAIL = process.env.QA_ADMIN_EMAIL ?? 'qa.admin@selfhelp.test';
const FEEDBACK_PAGE_ID = Number(process.env.QA_FEEDBACK_PAGE_ID ?? 94);
const FEEDBACK_FORM_ID = Number(process.env.QA_FEEDBACK_FORM_ID ?? 237);

test.describe.serial('plugin live sync', () => {
    const tag = syncTag();
    const baseURL = qaEnv().baseUrl;

    let admin: BackendPersona;
    let groupId: number;
    let readerRoleId: number;
    let therapistRoleId: number;
    let participant: IMadeAccount;
    let reader: IMadeAccount;
    let therapist: IMadeAccount;
    let stranger: IMadeAccount;
    const pages: IMadePage[] = [];
    const sessions: BrowserContext[] = [];
    const itemIds: number[] = [];

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
        const connected = watchLiveConnection(page);
        await page.goto(path);
        await connected;
        return page;
    }

    test.beforeAll(async () => {
        test.setTimeout(180_000);
        admin = await BackendPersona.login(ADMIN_EMAIL);
        groupId = await createGroup(admin, tag);
        readerRoleId = await createRoleWithNamedPermissions(admin, `${tag}-qa-live-read`, [
            'admin.access',
            'qa_live.items.read',
        ]);
        therapistRoleId = await createRoleWithNamedPermissions(admin, `${tag}-qa-live-write`, [
            'admin.access',
            'qa_live.items.update',
        ]);
        participant = await createAccount(admin, emailOf('participant'), { groupIds: [groupId] });
        reader = await createAccount(admin, emailOf('reader'), { roleIds: [readerRoleId] });
        therapist = await createAccount(admin, emailOf('therapist'), { roleIds: [therapistRoleId] });
        stranger = await createAccount(admin, emailOf('stranger'), {});
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
                /* cleanup best-effort */
            }
        };
        for (const made of pages) {
            await attempt(async () => {
                await admin.call('POST', `/admin/pages/${made.id}/lock/take-over`);
                await admin.draftWrite(made.id, 'DELETE', `/admin/pages/${made.id}`);
            });
        }
        for (const id of itemIds) {
            await attempt(() => deleteQaLiveItem(admin, id));
        }
        for (const account of [participant, reader, therapist, stranger]) {
            await attempt(() => admin.call('DELETE', `/admin/users/${account.id}`));
        }
        for (const roleId of [readerRoleId, therapistRoleId]) {
            await attempt(() => admin.call('DELETE', `/admin/roles/${roleId}`));
        }
        await attempt(() => admin.call('DELETE', `/admin/groups/${groupId}`));
    });

    test('grants: item row appears in the plugin admin list after a resource grant', async ({ browser }) => {
        const item = await createQaLiveItem(admin, `${tag} grant item`);
        itemIds.push(item.id);

        const observer = await openAs(browser, reader.email, QA_LIVE_ADMIN_ITEMS_PATH);
        const row = observer.locator(`[data-testid="qa-live-item-row"][data-id="${item.id}"]`);
        // Without a per-item grant the list should stay empty for this reader (C9; admin bypasses).
        await expect(row, 'reader does not see the item before the grant').toHaveCount(0);

        const since = Date.now();
        await grantQaLiveItemView(admin, readerRoleId, item.id);
        const visibleRow = observer.locator(`[data-testid="qa-live-item-row"][data-id="${item.id}"]`);
        await expectLive(visibleRow, 'grants: granted item row appears', since);
    });

    test('visitor refresh: published title updates on the open participant page', async ({ browser }) => {
        const item = await createQaLiveItem(admin, `${tag} visitor one`);
        itemIds.push(item.id);
        await publishQaLiveItem(admin, item.id);

        const page = await makePage('visitor', { accessGroupIds: [groupId], text: 'anchor', publish: false });
        await addQaLiveItemSection(admin, page, item.id);
        await publishPage(admin, page);
        await setGroupPages(admin, groupId, [page.id]);
        await admin.releaseLock(page.id);

        const observer = await openAs(browser, participant.email, `/${page.keyword}`);
        const itemBlock = observer.locator('[data-testid="qa-live-item"]');
        await expect(itemBlock).toHaveText(`${tag} visitor one`);
        await expect(itemBlock).toHaveAttribute('data-version', '1');

        await updateQaLiveItemTitle(admin, item.id, `${tag} visitor two`);
        const since = Date.now();
        await publishQaLiveItem(admin, item.id);

        await expectLive(itemBlock.filter({ hasText: `${tag} visitor two` }), 'visitor: new title', since);
        await expect(itemBlock).toHaveAttribute('data-version', '2');
    });

    test('pinning: unfinished record keeps v2 while a new publish is v3', async ({ browser }) => {
        await grantGroupUpdate(admin, therapistRoleId, groupId);
        const therapistApi = await BackendPersona.login(therapist.email);

        const item = await createQaLiveItem(admin, `${tag} pin v1`);
        itemIds.push(item.id);
        await publishQaLiveItem(admin, item.id);
        await updateQaLiveItemTitle(admin, item.id, `${tag} pin v2`);
        await publishQaLiveItem(admin, item.id);

        // Unfinished started record pins the participant to published v2.
        const pinWrite = await writeForUser(therapistApi, participant.id, 'started pin', {
            table: 'qa_live_runs',
            triggerType: 'started',
            contentRef: `res:qa_live_item:${item.id}@v2`,
        });
        expect(pinWrite.status, `pin start write: ${JSON.stringify(pinWrite)}`).toBeLessThan(300);
        const pinTableId = await dataTableIdByName(admin, 'qa_live_runs');

        const page = await makePage('pin', { accessGroupIds: [groupId], text: 'x', publish: false });
        await addQaLiveItemSection(admin, page, item.id, pinTableId);
        await publishPage(admin, page);
        await setGroupPages(admin, groupId, [page.id]);
        await admin.releaseLock(page.id);

        const observer = await openAs(browser, participant.email, `/${page.keyword}`);
        const itemBlock = observer.locator('[data-testid="qa-live-item"]');
        await expect(itemBlock).toHaveText(`${tag} pin v2`);
        await expect(itemBlock).toHaveAttribute('data-version', '2');

        await updateQaLiveItemTitle(admin, item.id, `${tag} pin v3`);
        await publishQaLiveItem(admin, item.id);
        // Pinned observer must keep v2 (a res: notice must not flip the title).
        await observer.waitForTimeout(1_500);
        await expect(itemBlock).toHaveText(`${tag} pin v2`);
        await expect(itemBlock).toHaveAttribute('data-version', '2');

        // Finish the pinned run, then a reload (no unfinished pin) gets v3.
        const pinRecordId = pinWrite.data?.record_id;
        expect(pinRecordId, 'pin start record id').toBeTruthy();
        await writeForUser(therapistApi, participant.id, 'finished pin', {
            table: 'qa_live_runs',
            triggerType: 'finished',
            contentRef: `res:qa_live_item:${item.id}@v2`,
            recordId: pinRecordId as number,
        });
        await observer.reload();
        await expect(itemBlock).toHaveText(`${tag} pin v3`, { timeout: 15_000 });
        await expect(itemBlock).toHaveAttribute('data-version', '3');
    });

    test('job path: form submit plans qa_live_job and the result row shows on a page', async ({ browser }) => {
        const participantApi = await BackendPersona.login(participant.email);
        // Feedback form ACL is on the default `subject` group (same as live-sync.spec).
        const groups = await admin.ok<{ groups: Array<{ id: number; name: string }> }>('GET', '/admin/groups?pageSize=100');
        const subjectId = groups.groups.find((group) => group.name === 'subject')?.id;
        expect(subjectId, 'the default subject group exists').toBeDefined();
        await admin.ok('POST', '/admin/users/bulk-add-to-group', {
            user_ids: [participant.id],
            group_ids: [subjectId as number],
        });

        const tableId = await dataTableIdByName(admin, String(FEEDBACK_FORM_ID));
        await attachQaLiveJobAction(admin, tableId, `from action ${tag}`);

        // Seed the result table so the page's sync.depends_on includes its table: tag
        // before the live write (getOrCreate would otherwise happen only when the job runs).
        await grantGroupUpdate(admin, therapistRoleId, groupId);
        const therapistApi = await BackendPersona.login(therapist.email);
        const seeded = await writeForUser(therapistApi, participant.id, 'seed job table', {
            table: 'qa_live_job_results',
        });
        expect(seeded.status, `seed qa_live_job_results: ${JSON.stringify(seeded)}`).toBeLessThan(300);

        const resultPage = await makePage('job-result', {
            accessGroupIds: [groupId],
            text: 'Job: {{jr.note}}',
            dataConfig: [
                {
                    table: 'qa_live_job_results',
                    retrieve: 'last',
                    current_user: true,
                    scope: 'jr',
                    all_fields: true,
                },
            ],
            publish: true,
        });
        await setGroupPages(admin, groupId, [resultPage.id]);
        await admin.releaseLock(resultPage.id);

        const observer = await openAs(browser, participant.email, `/${resultPage.keyword}`);
        await expect(observer.getByText(/Job:/)).toBeVisible();

        const saved = await participantApi.call('POST', '/forms/submit', {
            page_id: FEEDBACK_PAGE_ID,
            section_id: FEEDBACK_FORM_ID,
            form_data: { qa_message: `job ${tag}` },
        });
        expect(saved.status, `form submit: ${JSON.stringify(saved.json)}`).toBeLessThan(300);
        await runQueuedJobs(admin);
        const since = Date.now();

        await expectLive(observer.getByText(`Job: from action ${tag}`), 'job path: result note on page', since);
    });

    test('delete: participant page shows not found after admin deletes the item', async ({ browser }) => {
        const item = await createQaLiveItem(admin, `${tag} delete me`);
        itemIds.push(item.id);
        await publishQaLiveItem(admin, item.id);
        await grantQaLiveItemView(admin, readerRoleId, item.id);

        const page = await makePage('delete', { accessGroupIds: [groupId], text: 'x', publish: false });
        await addQaLiveItemSection(admin, page, item.id);
        await publishPage(admin, page);
        await setGroupPages(admin, groupId, [page.id]);
        await admin.releaseLock(page.id);

        const observer = await openAs(browser, participant.email, `/${page.keyword}`);
        await expect(observer.locator('[data-testid="qa-live-item"]')).toHaveText(`${tag} delete me`);

        await deleteQaLiveItem(admin, item.id);
        itemIds.pop();
        const since = Date.now();
        await expectLive(
            observer.locator('[data-testid="qa-live-item"]').filter({ hasText: 'not found' }),
            'delete: not found',
            since,
        );

        const grants = await admin.ok<{ permissions: Array<{ resource_id: number }> }>(
            'GET',
            `/admin/data-access/roles/${readerRoleId}/effective-permissions`,
        );
        const stillGranted = (grants.permissions ?? []).some((row) => row.resource_id === item.id);
        expect(stillGranted, 'grants on the deleted item are removed').toBe(false);
    });

    test('write for user: therapist reply shows on the participant page; stranger gets 403', async ({ browser }) => {
        await grantGroupUpdate(admin, therapistRoleId, groupId);
        const therapistApi = await BackendPersona.login(therapist.email);
        const seeded = await writeForUser(therapistApi, participant.id, 'seed replies table', {
            table: 'qa_live_replies',
        });
        expect(seeded.status, `seed qa_live_replies: ${JSON.stringify(seeded)}`).toBeLessThan(300);

        const page = await makePage('write-for', { accessGroupIds: [groupId], text: 'Reply: {{wr.message}}', publish: false });
        await bindLastRecordText(admin, page, 'qa_live_replies', 'wr', 'Reply: {{wr.message}}');
        await publishPage(admin, page);
        await setGroupPages(admin, groupId, [page.id]);
        await admin.releaseLock(page.id);

        const observer = await openAs(browser, participant.email, `/${page.keyword}`);

        const strangerApi = await BackendPersona.login(stranger.email);
        const denied = await writeForUser(strangerApi, participant.id, 'nope');
        expect(denied.status, 'stranger write-for refused').toBe(403);

        const since = Date.now();
        const allowed = await writeForUser(therapistApi, participant.id, `${tag} therapist reply`);
        expect(allowed.status, 'therapist write-for').toBeLessThan(300);
        await expectLive(observer.getByText(`Reply: ${tag} therapist reply`), 'write-for: participant sees reply', since);
    });

    test('after-commit event: record.saved queues qa_live_job; manifest lists record.saved', async ({ browser }) => {
        const therapistApi = await BackendPersona.login(therapist.email);
        await grantGroupUpdate(admin, therapistRoleId, groupId);
        expect(
            (await writeForUser(therapistApi, participant.id, 'seed replies for listener', { table: 'qa_live_replies' }))
                .status,
        ).toBeLessThan(300);
        expect(
            (await writeForUser(therapistApi, participant.id, 'seed results for listener', {
                table: 'qa_live_job_results',
            })).status,
        ).toBeLessThan(300);

        const jobPage = await makePage('listener-job', {
            accessGroupIds: [groupId],
            text: 'Listener: {{lj.note}}',
            dataConfig: [
                {
                    table: 'qa_live_job_results',
                    retrieve: 'last',
                    current_user: true,
                    scope: 'lj',
                    all_fields: true,
                },
            ],
            publish: true,
        });
        await setGroupPages(admin, groupId, [jobPage.id]);
        await admin.releaseLock(jobPage.id);

        const observer = await openAs(browser, participant.email, `/${jobPage.keyword}`);

        const wrote = await therapistApi.call('POST', '/admin/plugins/sh2-qa-live/write-for', {
            owner_user_id: participant.id,
            message: `${tag} trigger save`,
        });
        expect(wrote.status).toBeLessThan(300);
        await runQueuedJobs(admin);
        // Clock starts after the job write: live budget covers Mercure → page, not queue drain.
        const since = Date.now();
        await expectLive(observer.getByText('Listener: queued from record.saved'), 'listener: job result note', since);

        const plugin = await admin.ok<{ manifest?: { listens?: string[] }; listens?: string[] }>(
            'GET',
            '/admin/plugins/sh2-qa-live',
        );
        const listed =
            plugin.manifest?.listens ??
            plugin.listens ??
            (plugin as { manifest_json?: { listens?: string[] } }).manifest_json?.listens ??
            [];
        expect(listed, `plugin detail listens: ${JSON.stringify(plugin).slice(0, 400)}`).toContain('record.saved');

        await observer.close();
        const detail = await openAs(browser, ADMIN_EMAIL, '/admin/plugins/sh2-qa-live');
        await expect(detail.getByRole('heading', { name: /QA Live/i })).toBeVisible({ timeout: 20_000 });
        await expect(detail.getByRole('tab', { name: 'Events' })).toBeVisible({ timeout: 15_000 });
        await detail.getByRole('tab', { name: 'Events' }).click();
        await expect(detail.getByTestId('plugin-listens')).toContainText('record.saved', { timeout: 15_000 });
    });
});