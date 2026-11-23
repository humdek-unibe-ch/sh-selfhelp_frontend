/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
/**
 * Helpers of the live-sync golden spec (`e2e/golden/live-sync.spec.ts`).
 *
 * The spec watches what two or three real browsers show while somebody else changes the data. The
 * *changes* are made here, straight against the backend with a bearer token of a QA persona: the
 * browser under test must not be the one that causes the change it is supposed to hear about. The
 * *observers* are real logins in real browser contexts.
 *
 * Everything the spec creates carries its run tag (`qa-sync-<tag>`), so a rerun never meets the
 * rows of an earlier run and the cleanup removes only what the run made.
 */
import { expect, type Browser, type BrowserContext, type Page } from '@playwright/test';

export const SYNC_PASSWORD = process.env.QA_USER_PASSWORD ?? 'QaPassw0rd!2026';
const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://127.0.0.1:8000';
const API = `${BACKEND_URL}/cms-api/v1`;

/** `pages` in the lookup group `resourceTypes` of the QA database (used by role grants). */
const RESOURCE_TYPE_PAGES = 85;
const CRUD_READ = 2;
const CRUD_UPDATE = 4;
export const CRUD_READ_UPDATE = CRUD_READ | CRUD_UPDATE;

/** The `text` style and its content field `text` (seeded core data; ids are looked up, not assumed). */
const TEXT_STYLE_NAME = 'text';
const TEXT_FIELD_NAME = 'text';
const LANGUAGE_LOCALES = ['de-CH', 'en-GB'];

export interface IApiResult {
    status: number;
    json: { data?: unknown; error?: unknown } | null;
    headers: Headers;
}

/** Fresh tag for one run. */
export function syncTag(): string {
    return `qa-sync-${Date.now().toString(36)}`;
}

/** A signed-in persona that changes data through the backend API. */
export class BackendPersona {
    private constructor(
        readonly email: string,
        private readonly token: string,
    ) {}

    static async login(email: string, password: string = SYNC_PASSWORD): Promise<BackendPersona> {
        const result = await rawCall('POST', '/auth/login', { email, password });
        expect(result.status, `log in as ${email}: ${JSON.stringify(result.json)}`).toBe(200);
        return new BackendPersona(email, (result.json?.data as { access_token: string }).access_token);
    }

    call(method: string, path: string, body?: unknown, headers: Record<string, string> = {}): Promise<IApiResult> {
        return rawCall(method, path, body, this.token, headers);
    }

    /** A call that must succeed; returns its `data`. */
    async ok<T = Record<string, unknown>>(method: string, path: string, body?: unknown, headers: Record<string, string> = {}): Promise<T> {
        const result = await this.call(method, path, body, headers);
        expect(result.status, `${method} ${path} as ${this.email}: ${JSON.stringify(result.json)}`).toBeLessThan(300);
        return (result.json?.data ?? {}) as T;
    }

    /** The draft version of a page (`pages.draft_version`, live-sync contract C8). */
    async draftVersion(pageId: number): Promise<number> {
        const page = await this.ok<{ draft_version: number }>('GET', `/admin/pages/${pageId}`);
        return page.draft_version;
    }

    /** A page draft write at the page's current draft version. */
    async draftWrite(pageId: number, method: string, path: string, body?: unknown): Promise<IApiResult> {
        const version = await this.draftVersion(pageId);
        return this.call(method, path, body, { 'X-Page-Version': String(version) });
    }

    async draftWriteOk<T = Record<string, unknown>>(pageId: number, method: string, path: string, body?: unknown): Promise<T> {
        const result = await this.draftWrite(pageId, method, path, body);
        expect(result.status, `${method} ${path} as ${this.email}: ${JSON.stringify(result.json)}`).toBeLessThan(300);
        return (result.json?.data ?? {}) as T;
    }

    releaseLock(pageId: number): Promise<IApiResult> {
        return this.call('DELETE', `/admin/pages/${pageId}/lock`);
    }
}

async function rawCall(method: string, path: string, body?: unknown, token?: string, headers: Record<string, string> = {}): Promise<IApiResult> {
    const response = await fetch(`${API}${path}`, {
        method,
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...headers,
        },
        body: body === undefined ? undefined : JSON.stringify(body),
    });
    let json: IApiResult['json'] = null;
    try {
        json = (await response.json()) as IApiResult['json'];
    } catch {
        json = null;
    }
    return { status: response.status, json, headers: response.headers };
}

export interface IMadePage {
    id: number;
    keyword: string;
    sectionId: number;
    textFieldId: number;
}

export interface IPageOptions {
    keyword: string;
    /** Anyone may open it, signed in or not. */
    openAccess?: boolean;
    /** Show it in the header menu (the menu keeps only what the viewer may see). */
    inHeaderMenu?: boolean;
    /** Groups that may see it from the start. */
    accessGroupIds?: number[];
    /** Content of the page's one `text` section, in every language. */
    text?: string;
    /** `data_config` of that section. */
    dataConfig?: unknown;
    /** Publish the page after it was made. */
    publish?: boolean;
}

/** Create a `qa-` page with one text section (and publish it when asked). */
export async function createPage(admin: BackendPersona, options: IPageOptions): Promise<IMadePage> {
    const body: Record<string, unknown> = {
        keyword: options.keyword,
        pageAccessTypeCode: 'web',
        url: `/${options.keyword}`,
        openAccess: options.openAccess ?? false,
    };
    if (options.inHeaderMenu) {
        body.navigationAssignments = [{ menuKey: 'web_header' }];
    }
    if (options.accessGroupIds && options.accessGroupIds.length > 0) {
        body.accessGroups = options.accessGroupIds;
    }
    const created = await admin.ok<{ id: number }>('POST', '/admin/pages', body);

    const styleId = await styleIdOf(admin, TEXT_STYLE_NAME);
    const section = await admin.draftWriteOk<{ id: number }>(created.id, 'POST', `/admin/pages/${created.id}/sections/create`, {
        styleId,
        position: 0,
        name: 'qa_sync_text',
    });
    const detail = await admin.ok<{ fields: Array<{ id: number; name: string }> }>('GET', `/admin/pages/${created.id}/sections/${section.id}`);
    const textField = detail.fields.find((field) => field.name === TEXT_FIELD_NAME);
    expect(textField, 'the text style has a "text" field').toBeDefined();

    const made: IMadePage = { id: created.id, keyword: options.keyword, sectionId: section.id, textFieldId: (textField as { id: number }).id };
    if (options.text !== undefined || options.dataConfig !== undefined) {
        await setSectionText(admin, made, options.text ?? '', options.dataConfig);
    }
    if (options.publish) {
        await publishPage(admin, made);
    }
    await admin.releaseLock(made.id);
    return made;
}

let languageIds: number[] | null = null;

async function languagesOf(admin: BackendPersona): Promise<number[]> {
    if (languageIds === null) {
        const list = await admin.ok<Array<{ id: number; locale: string }>>('GET', '/admin/languages');
        languageIds = list.filter((language) => LANGUAGE_LOCALES.includes(language.locale)).map((language) => language.id);
        expect(languageIds.length, 'the QA database has the two seeded languages').toBeGreaterThan(0);
    }
    return languageIds;
}

const styleIds = new Map<string, number>();

async function styleIdOf(admin: BackendPersona, name: string): Promise<number> {
    const known = styleIds.get(name);
    if (known !== undefined) {
        return known;
    }
    const groups = await admin.ok<Array<{ styles?: Array<{ id: number; name: string }> }>>('GET', '/admin/styles');
    for (const group of groups) {
        for (const style of group.styles ?? []) {
            styleIds.set(style.name, style.id);
        }
    }
    const found = styleIds.get(name);
    expect(found, `style ${name}`).toBeDefined();
    return found as number;
}

/** Write the content (and optionally the `data_config`) of the page's text section into the draft. */
export async function setSectionText(admin: BackendPersona, page: IMadePage, text: string, dataConfig?: unknown): Promise<void> {
    const languages = await languagesOf(admin);
    const body: Record<string, unknown> = {
        contentFields: languages.map((languageId) => ({ fieldId: page.textFieldId, languageId, value: text })),
        propertyFields: [],
    };
    if (dataConfig !== undefined) {
        body.globalFields = { data_config: JSON.stringify(dataConfig) };
    }
    await admin.draftWriteOk(page.id, 'PUT', `/admin/pages/${page.id}/sections/${page.sectionId}`, body);
}

/**
 * Add one more section of a style to the page's draft and fill its content fields (every language).
 * `fields` maps a content field name of the style (for instance `label`) to its text.
 */
export async function addSection(admin: BackendPersona, page: IMadePage, styleName: string, name: string, fields: Record<string, string>): Promise<number> {
    const styleId = await styleIdOf(admin, styleName);
    const section = await admin.draftWriteOk<{ id: number }>(page.id, 'POST', `/admin/pages/${page.id}/sections/create`, { styleId, position: 10, name });
    const detail = await admin.ok<{ fields: Array<{ id: number; name: string }> }>('GET', `/admin/pages/${page.id}/sections/${section.id}`);
    const languages = await languagesOf(admin);
    const contentFields = Object.entries(fields).flatMap(([fieldName, value]) => {
        const field = detail.fields.find((candidate) => candidate.name === fieldName);
        expect(field, `${styleName} has a "${fieldName}" field`).toBeDefined();
        return languages.map((languageId) => ({ fieldId: (field as { id: number }).id, languageId, value }));
    });
    await admin.draftWriteOk(page.id, 'PUT', `/admin/pages/${page.id}/sections/${section.id}`, { contentFields, propertyFields: [] });
    return section.id;
}

export async function publishPage(admin: BackendPersona, page: IMadePage): Promise<void> {
    await admin.draftWriteOk(page.id, 'POST', `/admin/pages/${page.id}/versions/publish`, {});
}

export interface IMadeAccount {
    id: number;
    email: string;
}

export async function createGroup(admin: BackendPersona, name: string): Promise<number> {
    const created = await admin.ok<{ id: number }>('POST', '/admin/groups', { name, description: 'qa live-sync run' });
    return created.id;
}

/** Group members see exactly the pages given here (`select`); the list replaces the group's earlier rights. */
export async function setGroupPages(admin: BackendPersona, groupId: number, pageIds: number[]): Promise<void> {
    await admin.ok('PUT', `/admin/groups/${groupId}/acls`, { acls: pageIds.map((pageId) => ({ page_id: pageId, acl_select: true })) });
}

/** A role that holds every core read and update right, as `qa.readupdate` does (the admin screens open for it). */
export async function createEditorRole(admin: BackendPersona, name: string): Promise<number> {
    const roles = await admin.ok<{ roles: Array<{ id: number; name: string }> }>('GET', '/admin/roles?pageSize=200&search=qa_read_update');
    const model = roles.roles.find((role) => role.name === 'qa_read_update');
    expect(model, 'the QA fixture role qa_read_update').toBeDefined();
    const held = await admin.ok<{ permissions: Array<{ id: number }> }>('GET', `/admin/roles/${(model as { id: number }).id}/permissions`);
    const created = await admin.ok<{ id: number }>('POST', '/admin/roles', {
        name,
        description: 'qa live-sync run',
        permission_ids: held.permissions.map((permission) => permission.id),
    });
    return created.id;
}

/** What the role may do with these pages (the list replaces the role's earlier page grants). */
export async function setRolePages(admin: BackendPersona, roleId: number, grants: Array<{ pageId: number; crud: number }>): Promise<void> {
    await admin.ok('POST', `/admin/data-access/roles/${roleId}/permissions`, {
        permissions: grants.map((grant) => ({ resource_type_id: RESOURCE_TYPE_PAGES, resource_id: grant.pageId, crud_permissions: grant.crud })),
    });
}

export async function createAccount(
    admin: BackendPersona,
    email: string,
    options: { groupIds?: number[]; roleIds?: number[] },
): Promise<IMadeAccount> {
    const created = await admin.ok<{ id: number }>('POST', '/admin/users', {
        email,
        name: email.split('@')[0],
        user_name: email.split('@')[0],
        password: SYNC_PASSWORD,
        group_ids: options.groupIds ?? [],
        role_ids: options.roleIds ?? [],
    });
    return { id: created.id, email };
}

/** A real login in its own browser context (cookies of its own). */
export async function openSession(browser: Browser, baseURL: string): Promise<{ context: BrowserContext; page: Page }> {
    const context = await browser.newContext({ baseURL });
    return { context, page: await context.newPage() };
}

/**
 * Resolves once the page's live connection (the BFF re-stream of the Mercure hub) answered. A change
 * published before the connection is up would be lost to this page, so the spec waits for it before it
 * changes anything.
 */
export function watchLiveConnection(page: Page): Promise<void> {
    return page
        .waitForResponse((response) => /\/api\/auth\/events/.test(response.url()) && response.status() === 200, { timeout: 20_000 })
        .then(() => page.waitForTimeout(1_000))
        .then(() => undefined);
}
