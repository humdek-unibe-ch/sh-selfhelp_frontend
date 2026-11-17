/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
/**
 * Helpers of the entry-list golden specs (`e2e/golden/form-list.spec.ts`).
 *
 * The pages and personas are the backend QA fixtures
 * (`QaFormListFixture`, `QaBaselineFixture`, seeded by `composer test:reset-db`);
 * every value is env-driven with the fixture's canonical default, like
 * `env.ts`. Records are created and removed through the same BFF endpoints the
 * pages use (`/api/forms/submit`, `/api/forms/delete`, `/api/lists/{id}/state`),
 * with the CSRF double-submit header the BFF demands, so a spec can set up many
 * rows quickly without a second write path.
 *
 * The calls are made by the page itself (`fetch` in the page, same origin, the
 * browser's own cookies): the cookies of the BFF are `Secure`, and Playwright's
 * separate request client does not send a `Secure` cookie to `http://127.0.0.1`.
 */
import { expect, type Locator, type Page, type Request } from '@playwright/test';

export interface IQaPersona {
    email: string;
    password: string;
}

export interface IFormListQaEnv {
    loginKeyword: string;
    /** Private page with the `entries` list (modal) and the `tasks` list (page). */
    entriesKeyword: string;
    /** Public page with the read-only `events` data view. */
    eventsKeyword: string;
    /** Private page with the `wide` (modal) and `widepage` (page) lists: 24 inputs, very long labels. */
    wideKeyword: string;
    /** `subject` group member; owns the records the spec creates. */
    user: IQaPersona;
    /** `subject` group member; sees none of the user's records. */
    editor: IQaPersona;
    /** Authenticated but in no group: may not open the private page. */
    guest: IQaPersona;
}

export function formListEnv(): IFormListQaEnv {
    const password = process.env.QA_USER_PASSWORD ?? 'QaPassw0rd!2026';
    return {
        loginKeyword: process.env.QA_LOGIN_KEYWORD ?? 'login',
        entriesKeyword: process.env.QA_LIST_PAGE_KEYWORD ?? 'qa-entries',
        eventsKeyword: process.env.QA_EVENTS_PAGE_KEYWORD ?? 'qa-events',
        wideKeyword: process.env.QA_WIDE_PAGE_KEYWORD ?? 'qa-wide',
        user: { email: process.env.QA_USER_EMAIL ?? 'qa.user@selfhelp.test', password },
        editor: { email: process.env.QA_LIST_EDITOR_EMAIL ?? 'qa.editor@selfhelp.test', password: process.env.QA_LIST_EDITOR_PASSWORD ?? password },
        guest: { email: process.env.QA_LIST_GUEST_EMAIL ?? 'qa.guest@selfhelp.test', password: process.env.QA_LIST_GUEST_PASSWORD ?? password },
    };
}

/**
 * Every record one run creates carries this tag in its title. A rerun on the
 * same database never meets the records of an earlier run, and a spec removes
 * only what carries its own tag.
 */
export function runTag(): string {
    return `qa-e2e-${Date.now().toString(36)}`;
}

/** The root element of one list on the page. */
export function listRoot(page: Page, key: string): Locator {
    return page.locator(`[data-form-list="${key}"]`);
}

/** Where a list lives: its page, its section, and the form section id (the list itself for entry-form-list). */
export interface IListTarget {
    key: string;
    pageId: number;
    listId: number;
    formId: number | null;
}

interface IListRow {
    record_id: number;
    version: number;
    values: Record<string, unknown>;
}

interface IApiResult {
    status: number;
    json: unknown;
}

/** `fetch` from inside the page: same origin, the browser's cookies, JSON in and out. */
type THttpVerb = 'GET' | 'POST' | 'PUT' | 'DELETE';

async function browserFetch(page: Page, method: THttpVerb, path: string, data?: unknown): Promise<IApiResult> {
    return page.evaluate(
        async ({ method: verb, path: url, data: body }) => {
            const headers: Record<string, string> = {};
            const readToken = () => document.cookie.split('; ').find((cookie) => cookie.startsWith('sh_csrf='))?.slice('sh_csrf='.length);
            if (verb !== 'GET') {
                let token = readToken();
                if (!token) {
                    await fetch('/api/csrf', { credentials: 'same-origin' });
                    token = readToken();
                }
                if (token) {
                    headers['X-CSRF-Token'] = token;
                }
                headers['Content-Type'] = 'application/json';
            }
            const response = await fetch(url, {
                method: verb,
                headers,
                credentials: 'same-origin',
                body: body === undefined ? undefined : JSON.stringify(body),
            });
            let json: unknown = null;
            try {
                json = await response.json();
            } catch {
                json = null;
            }
            return { status: response.status, json };
        },
        { method, path, data },
    );
}

export async function apiGet(page: Page, path: string): Promise<IApiResult> {
    return browserFetch(page, 'GET', path);
}

export async function apiPost(page: Page, path: string, data: unknown): Promise<IApiResult> {
    return browserFetch(page, 'POST', path, data);
}

export async function apiPut(page: Page, path: string, data: unknown): Promise<IApiResult> {
    return browserFetch(page, 'PUT', path, data);
}

export async function apiDelete(page: Page, path: string, data: unknown): Promise<IApiResult> {
    return browserFetch(page, 'DELETE', path, data);
}

/** The server-rendered HTML of a page as the signed-in (or anonymous) visitor of `page` receives it. */
export async function fetchHtml(page: Page, path: string): Promise<string> {
    return page.evaluate(async (url) => (await fetch(url, { credentials: 'same-origin' })).text(), path);
}

function dataOf(result: IApiResult): Record<string, unknown> {
    const json = result.json as { data?: unknown } | null;
    return (json?.data ?? {}) as Record<string, unknown>;
}

interface ISectionNode {
    id: number;
    style_name: string;
    list_key?: { content?: string } | null;
    children?: ISectionNode[];
}

/** Find a list in the payload of a page. An entry-form-list is its own form (`formId = listId`). */
export async function listTarget(page: Page, keyword: string, key: string): Promise<IListTarget> {
    const result = await apiGet(page, `/api/pages/by-keyword/${encodeURIComponent(keyword)}`);
    expect(result.status, `GET page ${keyword}`).toBe(200);
    const payload = dataOf(result).page as { id: number; sections: ISectionNode[] };

    const find = (nodes: ISectionNode[]): ISectionNode | null => {
        for (const node of nodes) {
            if ((node.style_name === 'entry-form-list' || node.style_name === 'data-view') && node.list_key?.content === key) {
                return node;
            }
            const inner = find(node.children ?? []);
            if (inner !== null) {
                return inner;
            }
        }
        return null;
    };
    const list = find(payload.sections);
    expect(list, `list "${key}" on page ${keyword}`).not.toBeNull();
    const listNode = list as ISectionNode;
    // One model: the list writes as itself. A data-view has no form.
    const formId = listNode.style_name === 'entry-form-list' ? listNode.id : null;

    return { key, pageId: payload.id, listId: listNode.id, formId };
}

/** The rows of a list as the server returns them, optionally narrowed by a search term. */
export async function listRows(page: Page, target: IListTarget, search = '', pageNumber = 1): Promise<{ rows: IListRow[]; total: number }> {
    const query = new URLSearchParams({ page_id: String(target.pageId) });
    if (search !== '') {
        query.set(`${target.key}.q`, search);
    }
    if (pageNumber > 1) {
        query.set(`${target.key}.page`, String(pageNumber));
    }
    const result = await apiGet(page, `/api/lists/${target.listId}/state?${query.toString()}`);
    expect(result.status, `GET list state of ${target.key}`).toBe(200);
    const state = dataOf(result) as { rows?: IListRow[]; pagination?: { total?: number } };
    return { rows: state.rows ?? [], total: state.pagination?.total ?? 0 };
}

/** Create one record through the form endpoint of an entry list. */
export async function createRecord(page: Page, target: IListTarget, fields: Record<string, string>): Promise<void> {
    expect(target.formId, `list ${target.key} has a form`).not.toBeNull();
    const result = await apiPost(page, '/api/forms/submit', { page_id: target.pageId, section_id: target.formId, form_data: fields });
    expect(result.status, `create a record in ${target.key}: ${JSON.stringify(result.json)}`).toBeLessThan(400);
}

/** Delete every record of a list whose cells carry the tag (the spec's own records). */
export async function deleteTagged(page: Page, target: IListTarget, tag: string): Promise<void> {
    for (let round = 0; round < 10; round++) {
        const { rows } = await listRows(page, target, tag);
        if (rows.length === 0) {
            return;
        }
        for (const row of rows) {
            const result = await apiDelete(page, '/api/forms/delete', {
                record_id: row.record_id,
                page_id: target.pageId,
                section_id: target.listId,
                expected_version: row.version,
            });
            expect(result.status, `delete record ${row.record_id}: ${JSON.stringify(result.json)}`).toBeLessThan(400);
        }
    }
}

/** Count the requests a page makes that match a URL pattern (and, optionally, a method). */
export function watchRequests(page: Page, pattern: RegExp, method?: string): { count: () => number; urls: () => string[] } {
    const urls: string[] = [];
    page.on('request', (request) => {
        if (pattern.test(request.url()) && (method === undefined || request.method() === method)) {
            urls.push(request.url());
        }
    });
    return { count: () => urls.length, urls: () => [...urls] };
}

/** The page itself must never scroll sideways; a wide table scrolls inside its own container. */
export async function expectNoPageOverflow(page: Page, label: string): Promise<void> {
    const sizes = await page.evaluate(() => ({
        scroll: document.documentElement.scrollWidth,
        client: document.documentElement.clientWidth,
    }));
    expect(sizes.scroll, `${label}: the page is ${sizes.scroll}px wide in a ${sizes.client}px window`).toBeLessThanOrEqual(sizes.client);
}

/**
 * Wait until the page has finished reading itself.
 *
 * The first load after signing in draws the page and then re-reads it in the account's own language
 * a moment later (page content, navigation, the list state); whatever is open at that moment is drawn
 * again. A browser test that types into a form in that window would lose its input, as a very fast
 * person would. The page is settled when the requests that read it have been quiet for a while.
 */
export async function waitUntilSettled(page: Page, quietMs = 1200, timeoutMs = 30_000): Promise<void> {
    const reads = /\/api\/(pages|navigation|auth\/user-data|lists\/|plugins\/manifest)/;
    let pending = 0;
    let lastActivity = Date.now();
    const started = (request: Request) => {
        if (reads.test(request.url())) {
            pending += 1;
            lastActivity = Date.now();
        }
    };
    const finished = (request: Request) => {
        if (reads.test(request.url())) {
            pending = Math.max(0, pending - 1);
            lastActivity = Date.now();
        }
    };
    page.on('request', started);
    page.on('requestfinished', finished);
    page.on('requestfailed', finished);
    try {
        const deadline = Date.now() + timeoutMs;
        while (Date.now() < deadline) {
            if (pending === 0 && Date.now() - lastActivity >= quietMs) {
                return;
            }
            await page.waitForTimeout(100);
        }
    } finally {
        page.off('request', started);
        page.off('requestfinished', finished);
        page.off('requestfailed', finished);
    }
}
