/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
/**
 * Helpers of the least-privilege walk (`e2e/access/least-privilege.spec.ts`).
 *
 * - Personas come from the screen registry by the persona contract of the
 *   backend fixture (`QaBaselineFixture`): one read-only user per distinct
 *   `admin.<area>.read`, `qa.read.<area-with-dashes>@selfhelp.test`, plus
 *   `qa.readupdate@selfhelp.test` and `qa.roleupdate@selfhelp.test`. No list of
 *   screens is copied here.
 * - One write-control matcher (verbs below) used for every screen.
 * - A recorder for every `/api/` response of a walk (400 and 403 fail it).
 */
import { type Locator, type Page } from '@playwright/test';
import {
    ADMIN_SCREENS,
    type IAdminScreen,
    type TAdminScreenGroup,
} from '../../src/config/admin-screens';
import { PERMISSIONS } from '../../src/types/auth/jwt-payload.types';
import { qaEnv } from './env';

// ---------------------------------------------------------------------------
// Personas
// ---------------------------------------------------------------------------

/** The user of the read/update persona (view bit only on the QA items). */
export const READ_UPDATE_EMAIL = 'qa.readupdate@selfhelp.test';

/**
 * The user of the role-editor persona: `admin.access`, `admin.role.read` and
 * `admin.role.update` and nothing else, so no `admin.permission.read`. It
 * proves the role form works for a role editor (fixture `qa_role_update`).
 */
export const ROLE_UPDATE_EMAIL = 'qa.roleupdate@selfhelp.test';

/** Permissions the role-editor persona holds (contract of `QaBaselineFixture`). */
export const ROLE_UPDATE_PERMISSIONS: ReadonlySet<string> = new Set([
    'admin.access',
    'admin.role.read',
    'admin.role.update',
]);

export interface IReadPersona {
    /** The one read permission it holds besides `admin.access`, e.g. `admin.page_version.read`. */
    permission: string;
    email: string;
    /** Every registry screen that this permission opens. */
    screens: IAdminScreen[];
}

/** `admin.page_version.read` -> `qa.read.page-version@selfhelp.test` (persona contract). */
export function readPersonaEmail(permission: string): string {
    const match = /^admin\.([a-z0-9_]+)\.read$/.exec(permission);
    if (!match) throw new Error(`"${permission}" is not an admin.<area>.read permission`);
    return `qa.read.${match[1].replace(/_/g, '-')}@selfhelp.test`;
}

/** One persona per distinct `admin.<area>.read` of the registry (the dashboard's `admin.access` has none). */
export function readPersonas(): IReadPersona[] {
    const byPermission = new Map<string, IAdminScreen[]>();
    for (const screen of ADMIN_SCREENS as readonly IAdminScreen[]) {
        if (!/^admin\.[a-z0-9_]+\.read$/.test(screen.read_permission)) continue;
        byPermission.set(screen.read_permission, [...(byPermission.get(screen.read_permission) ?? []), screen]);
    }
    return [...byPermission.entries()]
        .sort(([a], [b]) => (a < b ? -1 : 1))
        .map(([permission, screens]) => ({ permission, email: readPersonaEmail(permission), screens }));
}

/** Permissions the read/update persona holds (contract): access, every read and update right the web knows. */
export function readUpdatePermissions(): Set<string> {
    const held = new Set<string>(['admin.access']);
    for (const permission of Object.values(PERMISSIONS)) {
        if (/^admin\.[a-z0-9_]+\.(read|update)$/.test(permission)) held.add(permission);
    }
    return held;
}

/** Same password as the other QA personas (`QA_USER_PASSWORD`, default the fixture value). */
export function personaPassword(): string {
    return qaEnv().password;
}

// ---------------------------------------------------------------------------
// Menu
// ---------------------------------------------------------------------------

/** Accordion group heading of a registry group (`AdminNavbar`); the dashboard is a direct link. */
export const MENU_GROUP_LABEL: Record<TAdminScreenGroup, string | null> = {
    dashboard: null,
    'cms-apps': 'CMS Apps',
    pages: 'Pages',
    menus: 'Menus',
    users: 'Users & Access',
    content: 'Content',
    automation: 'Automation',
    system: 'System',
};

/** Every accordion heading the menu can show (CMS Apps brings "App configs" with it). */
export const ALL_MENU_GROUP_LABELS = [
    'CMS Apps',
    'App configs',
    'Pages',
    'Menus',
    'Users & Access',
    'Content',
    'Automation',
    'System',
];

/**
 * The menu entry of a screen. Entries are buttons (the dashboard is a link)
 * named like the screen, except two screens whose entry is not named like
 * them: CMS Apps opens from "All apps", Menus from one entry per menu
 * ("Web header" is always first). Pages lists the pages themselves, so it has
 * no entry of its own (see `pageEntry`).
 */
export function menuEntry(page: Page, screen: IAdminScreen): Locator {
    const nav = page.locator('nav').first();
    if (screen.id === 'dashboard') return nav.getByRole('link', { name: 'Dashboard', exact: true });
    if (screen.id === 'cms-apps') return nav.getByRole('button', { name: 'All apps', exact: true });
    if (screen.id === 'menus') return nav.getByRole('button', { name: 'Web header', exact: true });
    return nav.getByRole('button', { name: screen.label, exact: true });
}

/**
 * Open every collapsed nested list of the menu ("Expand Content Pages",
 * "Expand Configuration", ...); the pages sit inside them.
 */
export async function expandNestedMenuGroups(page: Page): Promise<void> {
    const nav = page.locator('nav').first();
    for (let round = 0; round < 5; round += 1) {
        const closed = nav.getByRole('button', { name: /^Expand /i });
        if ((await closed.count()) === 0) return;
        await closed.first().click();
    }
}

/** The menu entry of one content page (the label is its keyword). */
export function pageEntry(page: Page, keyword: string): Locator {
    return page.locator('nav').first().getByRole('link', { name: keyword, exact: true });
}

/** True when the browser path (after a click) belongs to the screen. */
export function pathBelongsToScreen(screen: IAdminScreen, pathname: string): boolean {
    if (screen.id === 'pages') return pathname.startsWith('/admin/pages/');
    return pathname === screen.path;
}

/** Open the accordion group of a screen (a group closed in the menu hides its entries). */
export async function openMenuGroup(page: Page, screen: IAdminScreen): Promise<void> {
    const label = MENU_GROUP_LABEL[screen.group];
    if (!label) return;
    const control = page.getByRole('button', { name: label, exact: true });
    if ((await control.count()) === 0) return;
    if ((await control.first().getAttribute('aria-expanded')) === 'false') await control.first().click();
}

/** Menu groups that must not be there: a heading whose screens the persona may not open. */
export async function visibleMenuGroupLabels(page: Page): Promise<string[]> {
    const shown: string[] = [];
    for (const label of ALL_MENU_GROUP_LABELS) {
        if ((await page.getByRole('button', { name: label, exact: true }).count()) > 0) shown.push(label);
    }
    return shown;
}

// ---------------------------------------------------------------------------
// Write controls
// ---------------------------------------------------------------------------

/** Verbs that start the accessible name of a write control (brief P5 step 2). */
export const WRITE_VERBS = [
    'add',
    'new',
    'create',
    'edit',
    'save',
    'delete',
    'remove',
    'upload',
    'import',
    'publish',
    'unpublish',
    'restore',
    'execute',
    'run',
    'clear',
    'invalidate',
    'assign',
    'duplicate',
    'move',
] as const;

export type TWriteVerb = (typeof WRITE_VERBS)[number];

/** Verbs a persona with update (but not create, delete, publish or execute) may still see. */
export const UPDATE_ONLY_ALLOWED_VERBS: readonly TWriteVerb[] = ['edit', 'save', 'assign', 'move'];

export interface IControl {
    /** Accessible name (aria-label, text, title) as the person would read it. */
    name: string;
    /** `button`, `link` or `menuitem`. */
    kind: string;
}

export interface IWriteControlException {
    /** Registry screen id the exception applies to; `*` for every screen. */
    screen: string;
    /** Matched against the normalised (lower case) accessible name. */
    pattern: RegExp;
    /** Why this control is not a write control. */
    reason: string;
}

/**
 * Controls that start with a write verb but write nothing. Keep this list
 * short; every entry says why.
 */
export const WRITE_CONTROL_EXCEPTIONS: readonly IWriteControlException[] = [
    {
        screen: '*',
        pattern: /^clear (all )?(filters?|search|selection|date|value|input)\b/,
        reason: 'resets the on-screen filter, changes no stored data',
    },
];

export interface IWriteControlRight {
    screen: string;
    pattern: RegExp;
    /** The permission of the route this control calls (backend `api-routes.json`). */
    permission: string;
    reason: string;
}

/**
 * Write controls whose route needs a right that the read/update persona holds
 * although the verb says "create" or "delete": these areas have no separate
 * create or delete right, their writes are `admin.<area>.update`. The control
 * is allowed only for a persona that holds `permission`.
 */
export const WRITE_CONTROL_RIGHTS: readonly IWriteControlRight[] = [
    {
        screen: 'languages',
        pattern: /^(add language|delete language)/,
        permission: 'admin.language.update',
        reason: 'POST and DELETE /admin/languages need admin.language.update',
    },
    {
        screen: 'actions',
        pattern: /^new action/,
        permission: 'admin.action.update',
        reason: 'POST /admin/actions needs admin.action.update (delete needs admin.action.delete)',
    },
    {
        screen: 'menus',
        pattern: /^(add existing (child )?page|remove)$/,
        permission: 'admin.navigation.update',
        reason: 'menu item create and delete need admin.navigation.update',
    },
];

function normaliseName(name: string): string {
    return name.replace(/\s+/g, ' ').trim().toLowerCase();
}

/** Verb that starts the name, or null. */
export function writeVerbOf(name: string): TWriteVerb | null {
    const n = normaliseName(name);
    for (const verb of WRITE_VERBS) {
        if (new RegExp(`^${verb}\\b`).test(n)) return verb;
    }
    return null;
}

/**
 * The controls of `controls` that are write controls on `screenId`, not
 * counting the `allowedVerbs` (empty for a read-only persona) and the controls
 * whose route right is in `held` (`WRITE_CONTROL_RIGHTS`).
 */
export function matchWriteControls(
    controls: readonly IControl[],
    screenId: string,
    allowedVerbs: readonly TWriteVerb[] = [],
    held: ReadonlySet<string> = new Set(),
): IControl[] {
    return controls.filter((control) => {
        const verb = writeVerbOf(control.name);
        if (!verb || allowedVerbs.includes(verb)) return false;
        const n = normaliseName(control.name);
        if (WRITE_CONTROL_EXCEPTIONS.some((e) => (e.screen === '*' || e.screen === screenId) && e.pattern.test(n))) {
            return false;
        }
        return !WRITE_CONTROL_RIGHTS.some(
            (r) => r.screen === screenId && r.pattern.test(n) && held.has(r.permission),
        );
    });
}

/**
 * Collect the visible, enabled buttons, links and menu items of the screen
 * content (`main`, `aside`), or of `scope` (one table row, one card) when given.
 */
export async function collectControls(page: Page, scope?: Locator): Promise<IControl[]> {
    const handle = scope ? await scope.elementHandle() : null;
    return page.evaluate((scopeElement) => {
        const scope = scopeElement ? [scopeElement] : Array.from(document.querySelectorAll('main, aside'));
        const selector = 'button, a[href], [role="button"], [role="menuitem"], input[type="submit"], input[type="button"]';
        const out: Array<{ name: string; kind: string }> = [];
        const seen = new Set<Element>();
        const nameOf = (el: Element): string => {
            const label = el.getAttribute('aria-label');
            if (label && label.trim()) return label;
            const labelledBy = el.getAttribute('aria-labelledby');
            if (labelledBy) {
                const text = labelledBy
                    .split(/\s+/)
                    .map((id) => document.getElementById(id)?.textContent ?? '')
                    .join(' ')
                    .trim();
                if (text) return text;
            }
            const text = (el as HTMLElement).innerText ?? el.textContent ?? '';
            if (text.trim()) return text;
            if (el instanceof HTMLInputElement && el.value) return el.value;
            const title = el.getAttribute('title') ?? el.querySelector('title')?.textContent ?? '';
            return title;
        };
        for (const root of scope) {
            for (const el of Array.from(root.querySelectorAll(selector))) {
                if (seen.has(el)) continue;
                seen.add(el);
                if (el.getClientRects().length === 0) continue;
                if (getComputedStyle(el).visibility === 'hidden') continue;
                if (el.matches(':disabled')) continue;
                if (el.getAttribute('aria-disabled') === 'true' || el.hasAttribute('data-disabled')) continue;
                const name = nameOf(el).trim();
                if (!name) continue;
                const role = el.getAttribute('role');
                const kind = role === 'menuitem' ? 'menuitem' : el.tagName === 'A' ? 'link' : 'button';
                out.push({ name, kind });
            }
        }
        return out;
    }, handle);
}

/**
 * Open up to `max` row-action menus (`aria-haspopup="menu"`) of the screen
 * content, read their items, and close them again. A menu only exists in the
 * page while it is open, so a write item inside a kebab is invisible to
 * `collectControls` otherwise.
 */
export async function collectMenuItems(page: Page, max = 3, scope?: Locator): Promise<IControl[]> {
    const triggers: Locator = scope
        ? scope.locator('[aria-haspopup="menu"]:not(:disabled)')
        : page.locator('main [aria-haspopup="menu"]:not(:disabled), aside [aria-haspopup="menu"]:not(:disabled)');
    const total = Math.min(await triggers.count(), max);
    const items: IControl[] = [];
    for (let i = 0; i < total; i += 1) {
        const trigger = triggers.nth(i);
        if (!(await trigger.isVisible())) continue;
        await trigger.click();
        const menu = page.getByRole('menu').first();
        try {
            await menu.waitFor({ state: 'visible', timeout: 2_000 });
        } catch {
            continue;
        }
        const names = await menu.getByRole('menuitem').evaluateAll((els) =>
            els
                .filter((el) => !el.matches(':disabled') && el.getAttribute('aria-disabled') !== 'true' && !el.hasAttribute('data-disabled'))
                .map((el) => ((el as HTMLElement).innerText ?? el.textContent ?? '').trim()),
        );
        for (const name of names) if (name) items.push({ name, kind: 'menuitem' });
        await page.keyboard.press('Escape');
        await menu.waitFor({ state: 'hidden', timeout: 2_000 }).catch(() => undefined);
    }
    return items;
}

// ---------------------------------------------------------------------------
// API recorder
// ---------------------------------------------------------------------------

export interface IApiFailure {
    status: number;
    method: string;
    url: string;
    screen: string;
}

/** Streams that never finish; not counted as pending work. */
const LONG_LIVED = ['/api/auth/events', '/api/plugins/events'];

/**
 * Records every `/api/` response of a walk. A 400 or 403 is a failure: normal
 * use of a screen the persona may open never provokes either.
 */
export class ApiRecorder {
    /** Name of the screen being walked; goes into every failure line. */
    screen = 'start';
    responses = 0;
    readonly failures: IApiFailure[] = [];
    private pending = 0;

    /** Record one response (used by the page listener and by the unit check). */
    record(status: number, method: string, url: string): void {
        const pathname = new URL(url, 'http://localhost').pathname;
        if (!pathname.startsWith('/api/')) return;
        this.responses += 1;
        if (status === 400 || status === 403) {
            this.failures.push({ status, method, url: `${pathname}${new URL(url, 'http://localhost').search}`, screen: this.screen });
        }
    }

    attach(page: Page): void {
        const tracked = (url: string): boolean => {
            const pathname = new URL(url).pathname;
            return pathname.startsWith('/api/') && !LONG_LIVED.some((p) => pathname.startsWith(p));
        };
        page.on('request', (request) => {
            if (tracked(request.url())) this.pending += 1;
        });
        page.on('requestfinished', (request) => {
            if (tracked(request.url())) this.pending = Math.max(0, this.pending - 1);
        });
        page.on('requestfailed', (request) => {
            if (tracked(request.url())) this.pending = Math.max(0, this.pending - 1);
        });
        page.on('response', (response) => {
            this.record(response.status(), response.request().method(), response.url());
        });
    }

    /** Wait until no `/api/` request has been in flight for `quietMs` (a screen has loaded its data). */
    async settle(page: Page, quietMs = 500, timeoutMs = 15_000): Promise<void> {
        const deadline = Date.now() + timeoutMs;
        let quietSince = Date.now();
        while (Date.now() < deadline) {
            if (this.pending > 0) quietSince = Date.now();
            else if (Date.now() - quietSince >= quietMs) return;
            await page.waitForTimeout(100);
        }
    }

    /** One line per failure, for the end-of-walk report. */
    describeFailures(): string[] {
        return this.failures.map((f) => `HTTP ${f.status} ${f.method} ${f.url} (screen: ${f.screen})`);
    }
}
