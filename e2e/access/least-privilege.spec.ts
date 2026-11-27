/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
/**
 * Least-privilege walk (F239, task `2026-11-19-access-check-tooling`).
 *
 * Seeded restricted personas (backend `QaBaselineFixture`) sign in through the
 * real login form and open every admin screen from the menu. The walk fails on:
 *   - a menu that shows a screen the persona may not open, or misses one it may;
 *   - a visible, enabled write control (add, edit, delete, ...) without its
 *     right, on the screen or in a row-action menu;
 *   - any `/api/` answer 400 or 403 during normal use.
 *
 * Personas come from the screen registry (`src/config/admin-screens.ts`) by the
 * persona contract, see `e2e/utils/access.ts`:
 *   - one read-only persona per distinct `admin.<area>.read`;
 *   - `qa.readupdate`: every read and update right, the view bit only on the QA
 *     items (page `qa-feedback`, group `qa_access_group`);
 *   - `qa.roleupdate`: `admin.role.read` and `admin.role.update` only (no
 *     `admin.permission.read`); it opens the role form from the Roles screen.
 *
 * Screens are opened by clicking the menu entry, never by URL: the only
 * `page.goto` of the walk is `/admin` after the sign-in.
 *
 * One test per persona; the problems of one persona are collected and reported
 * together at the end. Run: `npm run test:access` (needs the QA stack).
 */
import { test, expect, type Locator, type Page } from '@playwright/test';
import { ADMIN_SCREENS, type IAdminScreen } from '../../src/config/admin-screens';
import {
    ApiRecorder,
    MENU_GROUP_LABEL,
    READ_UPDATE_EMAIL,
    ROLE_UPDATE_EMAIL,
    ROLE_UPDATE_PERMISSIONS,
    UPDATE_ONLY_ALLOWED_VERBS,
    collectControls,
    collectMenuItems,
    expandNestedMenuGroups,
    matchWriteControls,
    menuEntry,
    openMenuGroup,
    pageEntry,
    pathBelongsToScreen,
    personaPassword,
    readPersonaEmail,
    readPersonas,
    readUpdatePermissions,
    visibleMenuGroupLabels,
    writeVerbOf,
    type TWriteVerb,
} from '../utils/access';
import { loginAs } from '../utils/loginAs';
import { qaEnv } from '../utils/env';

const SCREENS = ADMIN_SCREENS as readonly IAdminScreen[];
const MENU_SCREENS = SCREENS.filter((s) => s.in_menu);

// ---------------------------------------------------------------------------
// The helpers' own checks (no stack needed)
// ---------------------------------------------------------------------------

test.describe('access walk helpers', () => {
    test('persona emails follow the persona contract', () => {
        expect(readPersonaEmail('admin.page_version.read')).toBe('qa.read.page-version@selfhelp.test');
        expect(readPersonaEmail('admin.section.read')).toBe('qa.read.section@selfhelp.test');
        const emails = readPersonas().map((p) => p.email);
        expect(emails).toContain('qa.read.section@selfhelp.test');
        expect(emails).not.toContain(READ_UPDATE_EMAIL);
        expect(new Set(emails).size).toBe(emails.length);
    });

    test('the matcher names write verbs and spares filter resets', () => {
        expect(writeVerbOf('Add language')).toBe('add');
        expect(writeVerbOf('  DELETE   group ')).toBe('delete');
        expect(writeVerbOf('Unpublish')).toBe('unpublish');
        expect(writeVerbOf('Running jobs')).toBeNull();
        expect(writeVerbOf('News')).toBeNull();
        const controls = [
            { name: 'Create Group', kind: 'button' },
            { name: 'Edit group', kind: 'button' },
            { name: 'Clear filters', kind: 'button' },
            { name: 'View members', kind: 'menuitem' },
        ];
        expect(matchWriteControls(controls, 'groups').map((c) => c.name)).toEqual(['Create Group', 'Edit group']);
        const allowed: TWriteVerb[] = ['edit'];
        expect(matchWriteControls(controls, 'groups', allowed).map((c) => c.name)).toEqual(['Create Group']);
    });

    test('a create or delete control whose route needs a right the persona holds is not a problem; without the right it is', () => {
        const controls = [
            { name: 'Add language', kind: 'button' },
            { name: 'Delete language', kind: 'menuitem' },
            { name: 'Create Group', kind: 'button' },
        ];
        const held = new Set(['admin.language.update']);
        expect(matchWriteControls(controls, 'languages', [], held).map((c) => c.name)).toEqual(['Create Group']);
        expect(matchWriteControls(controls, 'languages', [], new Set()).map((c) => c.name)).toEqual([
            'Add language',
            'Delete language',
            'Create Group',
        ]);
        // The exception is tied to its screen.
        expect(matchWriteControls([{ name: 'Add language', kind: 'button' }], 'groups', [], held)).toHaveLength(1);
    });

    test('the scan sees an enabled write button and a write item inside a row-action menu, not a disabled one', async ({
        page,
    }) => {
        await page.setContent(`
            <main>
              <button>Add language</button>
              <button disabled>Delete language</button>
              <button aria-label="Edit row">pencil</button>
              <button style="display:none">Save hidden</button>
              <a href="/x">Open</a>
              <button aria-haspopup="menu" id="kebab" aria-label="More actions">...</button>
              <div id="host"></div>
            </main>
            <script>
              document.getElementById('kebab').addEventListener('click', () => {
                document.getElementById('host').innerHTML =
                  '<div role="menu"><button role="menuitem">Delete group</button><button role="menuitem" disabled>Remove</button></div>';
              });
              document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') document.getElementById('host').innerHTML = '';
              });
            </script>`);
        const visible = matchWriteControls(await collectControls(page), 'test').map((c) => c.name);
        expect(visible.sort()).toEqual(['Add language', 'Edit row']);
        const inMenus = matchWriteControls(await collectMenuItems(page), 'test').map((c) => c.name);
        expect(inMenus).toEqual(['Delete group']);
    });

    test('the recorder fails on 400 and 403 of /api/ and ignores everything else', () => {
        const recorder = new ApiRecorder();
        recorder.screen = 'Languages';
        recorder.record(200, 'GET', 'http://127.0.0.1:3100/api/admin/languages');
        recorder.record(403, 'POST', 'http://127.0.0.1:3100/api/admin/languages');
        recorder.record(400, 'GET', 'http://127.0.0.1:3100/api/admin/pages?x=1');
        recorder.record(404, 'GET', 'http://127.0.0.1:3100/api/admin/missing');
        recorder.record(403, 'GET', 'http://127.0.0.1:3100/_next/static/x.js');
        expect(recorder.responses).toBe(4);
        expect(recorder.describeFailures()).toEqual([
            'HTTP 403 POST /api/admin/languages (screen: Languages)',
            'HTTP 400 GET /api/admin/pages?x=1 (screen: Languages)',
        ]);
    });
});

// ---------------------------------------------------------------------------
// The walk
// ---------------------------------------------------------------------------

interface IWalkResult {
    walked: string[];
    notes: string[];
}

/** Sign in, land on `/admin`, and start recording. */
async function startWalk(page: Page, email: string, recorder: ApiRecorder): Promise<void> {
    recorder.attach(page);
    recorder.screen = 'sign-in';
    await loginAs(page, email, personaPassword(), qaEnv().loginKeyword);
    recorder.screen = 'dashboard';
    await page.goto('/admin');
    await expect(page.locator('nav').first()).toBeVisible({ timeout: 20_000 });
    await recorder.settle(page);
}

/** Open every group that has a heading (a closed group hides its entries). */
async function openAllMenuGroups(page: Page): Promise<void> {
    for (const screen of MENU_SCREENS) await openMenuGroup(page, screen);
}

/**
 * The menu shows exactly the screens in `held` (a set of read permissions) and
 * their group headings. Pages lists pages, not a link to `/admin/pages`, so for
 * it only the group heading is compared.
 */
async function assertMenu(page: Page, held: ReadonlySet<string>, problems: string[]): Promise<void> {
    await openAllMenuGroups(page);
    for (const screen of MENU_SCREENS) {
        const allowed = held.has(screen.read_permission);
        if (screen.id === 'pages') continue;
        const present = (await menuEntry(page, screen).count()) > 0;
        if (allowed && !present) problems.push(`menu: "${screen.label}" is missing (${screen.read_permission} held)`);
        if (!allowed && present) problems.push(`menu: "${screen.label}" is shown without ${screen.read_permission}`);
    }
    const expectedGroups = new Set<string>();
    for (const screen of MENU_SCREENS) {
        if (!held.has(screen.read_permission)) continue;
        const label = MENU_GROUP_LABEL[screen.group];
        if (label) expectedGroups.add(label);
        if (screen.group === 'cms-apps') expectedGroups.add('App configs');
    }
    const shown = await visibleMenuGroupLabels(page);
    for (const label of shown) {
        if (!expectedGroups.has(label)) problems.push(`menu: group "${label}" is shown, no screen of it may be opened`);
    }
    for (const label of expectedGroups) {
        if (!shown.includes(label)) problems.push(`menu: group "${label}" is missing`);
    }
}

/** Write controls (on the screen and in row-action menus) not allowed for the persona. */
async function scanScreen(
    page: Page,
    screenId: string,
    allowedVerbs: readonly TWriteVerb[],
    label: string,
    problems: string[],
    held: ReadonlySet<string> = new Set(),
    scope?: Locator,
): Promise<void> {
    const found = [
        ...matchWriteControls(await collectControls(page, scope), screenId, allowedVerbs, held),
        ...matchWriteControls(await collectMenuItems(page, scope ? 5 : 3, scope), screenId, allowedVerbs, held),
    ];
    for (const control of found) {
        problems.push(`${label}: write control shown without its right: ${control.kind} "${control.name}"`);
    }
}

/** Open one screen from the menu and scan it. Returns true when the screen was opened and scanned. */
async function openFromMenuAndScan(
    page: Page,
    recorder: ApiRecorder,
    screen: IAdminScreen,
    allowedVerbs: readonly TWriteVerb[],
    problems: string[],
    result: IWalkResult,
    held: ReadonlySet<string> = new Set(),
): Promise<boolean> {
    if (screen.id === 'pages') {
        // The Pages entry is a heading over the page list, not a link to a screen.
        result.notes.push('Pages: heading only (pages are opened one by one)');
        return false;
    }
    await openMenuGroup(page, screen);
    const link = menuEntry(page, screen).first();
    if ((await link.count()) === 0) {
        problems.push(`${screen.label}: no menu entry to open it from`);
        return false;
    }
    recorder.screen = screen.label;
    await link.click();
    try {
        await page.waitForURL((url) => pathBelongsToScreen(screen, url.pathname), { timeout: 20_000 });
    } catch {
        problems.push(`${screen.label}: clicking the menu entry did not open ${screen.path} (now at ${new URL(page.url()).pathname})`);
        return false;
    }
    await recorder.settle(page);
    result.walked.push(screen.label);
    await scanScreen(page, screen.id, allowedVerbs, screen.label, problems, held);
    return true;
}

function summarise(email: string, recorder: ApiRecorder, result: IWalkResult): void {
    // eslint-disable-next-line no-console -- the walk summary (screens walked and checked /api/ responses) is the evidence of a run
    console.log(
        `[access] ${email}: screens walked: ${result.walked.join(', ') || 'none'}; ` +
            `/api/ responses checked: ${recorder.responses}` +
            (result.notes.length ? `; notes: ${result.notes.join('; ')}` : ''),
    );
}

function assertNoProblems(problems: string[], recorder: ApiRecorder): void {
    const all = [...problems, ...recorder.describeFailures()];
    expect(all, `\n${all.join('\n')}\n`).toEqual([]);
}

test.describe('least privilege: one read-only persona per area', () => {
    test.setTimeout(240_000);

    for (const persona of readPersonas()) {
        test(`${persona.email} (${persona.permission}) sees and opens only its own screens`, async ({ page }) => {
            const recorder = new ApiRecorder();
            const problems: string[] = [];
            const result: IWalkResult = { walked: [], notes: [] };
            const held = new Set<string>(['admin.access', persona.permission]);

            await startWalk(page, persona.email, recorder);
            await assertMenu(page, held, problems);

            // The dashboard first (opens with `admin.access`), then each screen of this area.
            recorder.screen = 'Dashboard';
            await scanScreen(page, 'dashboard', [], 'Dashboard', problems, held);
            result.walked.push('Dashboard');
            for (const screen of persona.screens.filter((s) => s.in_menu)) {
                await openFromMenuAndScan(page, recorder, screen, [], problems, result, held);
            }
            if (persona.screens.every((s) => !s.in_menu)) {
                result.notes.push(`${persona.screens.map((s) => s.label).join(', ')}: not in the menu, opened from elsewhere`);
            }

            summarise(persona.email, recorder, result);
            assertNoProblems(problems, recorder);
        });
    }
});

test.describe('least privilege: read and update, view grant only on the QA items', () => {
    test.setTimeout(480_000);

    test(`${READ_UPDATE_EMAIL} sees every screen and no write control its rights do not allow`, async ({ page }) => {
        const recorder = new ApiRecorder();
        const problems: string[] = [];
        const result: IWalkResult = { walked: [], notes: [] };
        const heldPermissions = readUpdatePermissions();
        const heldReads = new Set<string>(['admin.access', ...SCREENS.map((s) => s.read_permission)]);

        await startWalk(page, READ_UPDATE_EMAIL, recorder);
        await assertMenu(page, heldReads, problems);

        for (const screen of MENU_SCREENS) {
            if (screen.id === 'dashboard') {
                recorder.screen = 'Dashboard';
                await scanScreen(page, 'dashboard', UPDATE_ONLY_ALLOWED_VERBS, 'Dashboard', problems, heldPermissions);
                result.walked.push('Dashboard');
                continue;
            }
            // Pages are opened one by one below (the QA page).
            if (screen.id === 'pages') continue;
            const opened = await openFromMenuAndScan(
                page,
                recorder,
                screen,
                UPDATE_ONLY_ALLOWED_VERBS,
                problems,
                result,
                heldPermissions,
            );

            // Groups: the persona holds `admin.group.update` but only the view bit on the QA group (rule 4.11).
            if (opened && screen.id === 'groups') {
                const row = page.getByRole('row', { name: /qa_access_group/ });
                if ((await row.count()) === 0) {
                    problems.push('Groups: the QA group "qa_access_group" is not listed although the persona holds its view grant');
                } else {
                    await scanScreen(page, 'groups', [], 'Groups (qa_access_group)', problems, heldPermissions, row.first());
                    result.walked.push('Groups (qa_access_group)');
                }
            }
        }

        // Pages: the persona holds `admin.page.update` but only the view grant on `qa-feedback` (F234).
        const pagesScreen = SCREENS.find((s) => s.id === 'pages');
        if (!pagesScreen) throw new Error('registry has no pages screen');
        await openMenuGroup(page, pagesScreen);
        await expandNestedMenuGroups(page);
        const pageLink = pageEntry(page, 'qa-feedback').first();
        // The nested list opens with a short animation and the page list loads on its own request.
        await pageLink.waitFor({ state: 'visible', timeout: 10_000 }).catch(() => undefined);
        if ((await pageLink.count()) === 0) {
            problems.push('Pages: the QA page "qa-feedback" is not in the menu although the persona holds its view grant');
        } else {
            recorder.screen = 'Pages (qa-feedback)';
            await pageLink.click();
            await page.waitForURL((url) => url.pathname === '/admin/pages/qa-feedback', { timeout: 20_000 });
            await recorder.settle(page);
            result.walked.push('Pages (qa-feedback)');
            const banner = page.getByText('You can view this page but not change it.');
            if (!(await banner.isVisible().catch(() => false))) {
                problems.push('Pages (qa-feedback): the read-only banner is not shown for a view-only grant');
            }
            await scanScreen(page, 'pages', [], 'Pages (qa-feedback)', problems, heldPermissions);
        }

        summarise(READ_UPDATE_EMAIL, recorder, result);
        assertNoProblems(problems, recorder);
    });
});

test.describe('least privilege: a role editor without the permission catalogue right', () => {
    test.setTimeout(240_000);

    test(`${ROLE_UPDATE_EMAIL} opens the role form with permission names and edits only the roles it holds`, async ({ page }) => {
        const recorder = new ApiRecorder();
        const problems: string[] = [];
        const result: IWalkResult = { walked: [], notes: [] };
        const rolesScreen = SCREENS.find((s) => s.id === 'roles');
        if (!rolesScreen) throw new Error('registry has no roles screen');
        const heldReads = new Set<string>(['admin.access', rolesScreen.read_permission]);

        await startWalk(page, ROLE_UPDATE_EMAIL, recorder);
        await assertMenu(page, heldReads, problems);

        // Roles from the menu, never by URL.
        const opened = await openFromMenuAndScan(
            page,
            recorder,
            rolesScreen,
            UPDATE_ONLY_ALLOWED_VERBS,
            problems,
            result,
            ROLE_UPDATE_PERMISSIONS,
        );
        expect(opened, 'the Roles screen opens from the menu').toBe(true);

        const search = page.getByRole('textbox', { name: 'Search roles' });
        const roleRow = async (name: string): Promise<Locator> => {
            // The list filters when the filter is applied, not while typing.
            await search.fill(name);
            await page.getByRole('button', { name: 'Apply Filters' }).click();
            await recorder.settle(page);
            const row = page.getByRole('row', { name: new RegExp(`(^|\\s)${name}(\\s|$)`) }).first();
            await row.waitFor({ state: 'visible', timeout: 15_000 });
            await recorder.settle(page);
            return row;
        };

        // A role it holds in full: the edit dialog opens and names every permission.
        recorder.screen = 'Roles (edit qa_read_role)';
        const held = await roleRow('qa_read_role');
        await held.getByRole('button', { name: 'Edit role' }).click();
        const dialog = page.getByRole('dialog');
        await dialog.waitFor({ state: 'visible', timeout: 15_000 });
        await recorder.settle(page);
        const boxes = dialog.getByRole('checkbox');
        await expect(boxes.first()).toBeVisible({ timeout: 15_000 });
        const names = (await boxes.evaluateAll((els) =>
            els.map((el) => el.getAttribute('aria-label') ?? (el as HTMLInputElement).labels?.[0]?.textContent ?? ''),
        )).map((name) => name.trim());
        if (names.length === 0) problems.push('Roles (edit qa_read_role): the form shows no permission boxes');
        for (const name of names) {
            if (name === '' || /^\d+$/.test(name)) problems.push(`Roles (edit qa_read_role): a permission box is named "${name}" (no name, only an id)`);
        }
        const ticked = dialog.getByRole('checkbox', { name: /\(admin\.role\.read\)/ });
        if (!(await ticked.isChecked().catch(() => false))) {
            problems.push('Roles (edit qa_read_role): admin.role.read is not shown ticked by name');
        }
        result.walked.push('Roles (edit qa_read_role)');
        await dialog.getByRole('button', { name: 'Cancel' }).click();
        await dialog.waitFor({ state: 'hidden', timeout: 10_000 });

        // A role it does not hold in full (qa_read_update has every read and update right): no enabled edit (can_update).
        recorder.screen = 'Roles (qa_read_update)';
        const above = await roleRow('qa_read_update');
        await expect(above.getByRole('button', { name: 'Edit role' })).toBeDisabled();
        result.walked.push('Roles (qa_read_update, edit disabled)');

        summarise(ROLE_UPDATE_EMAIL, recorder, result);
        assertNoProblems(problems, recorder);
    });
});
