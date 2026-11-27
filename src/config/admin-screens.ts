/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
/**
 * Admin screen registry: the one home of "which static core admin screen
 * opens with which read permission" (workspace rules 1.5, 4.13, 4.14).
 *
 * - `AdminNavbar` and `NavigationSearch` take their static entries and gates
 *   from here: each entry shows on its own `read_permission`, a menu group
 *   shows when any of its entries is allowed.
 * - The least-privilege e2e walk derives its personas and expected menu from
 *   here.
 * - `npm run access:screens` exports it to `docs/reference/admin-screens.json`,
 *   which the backend `app:access:export` renders into the permission
 *   catalogue. A Vitest test fails when that file is stale.
 *
 * Only static core screens are listed. Dynamic entries (each content page,
 * each CMS app, plugin pages) are reached from their parent screen. Plugin
 * host screens (`/admin/plugins`, `/admin/plugins-host/...`) are left out
 * until the plugin work (F238).
 *
 * The list is in menu order. `in_menu: false` marks a screen that opens from
 * elsewhere (Live Preview opens in a new tab from the page editor); it is not
 * drawn in the menu or the search. It stays in the list (and in the exported
 * JSON) because it is the named screen of `admin.mobile_preview.read`
 * (rule 4.14). `in_menu` is registry-only and is not part of the JSON.
 */
import { PERMISSIONS } from '../types/auth/jwt-payload.types';

/** A permission name from `PERMISSIONS`. */
export type TAdminScreenPermission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

/** Menu group a screen belongs to (the accordion group id of `AdminNavbar`). */
export type TAdminScreenGroup =
    | 'dashboard'
    | 'cms-apps'
    | 'pages'
    | 'menus'
    | 'users'
    | 'content'
    | 'automation'
    | 'system';

export interface IAdminScreen {
    /** Stable id; the menu entry id is `nav:<id>`. */
    readonly id: string;
    readonly label: string;
    /** Route of the screen under `src/app/admin/`. */
    readonly path: string;
    readonly group: TAdminScreenGroup;
    /** The one permission that opens the screen (rule 4.13). */
    readonly read_permission: TAdminScreenPermission;
    /** False for a screen that is opened from elsewhere, not from the menu. */
    readonly in_menu: boolean;
}

export const ADMIN_SCREENS = [
    { id: 'dashboard', label: 'Dashboard', path: '/admin', group: 'dashboard', read_permission: PERMISSIONS.ADMIN_ACCESS, in_menu: true },
    { id: 'cms-apps', label: 'CMS Apps', path: '/admin/cms-apps', group: 'cms-apps', read_permission: PERMISSIONS.ADMIN_CMS_APP_READ, in_menu: true },
    { id: 'pages', label: 'Pages', path: '/admin/pages', group: 'pages', read_permission: PERMISSIONS.ADMIN_PAGE_READ, in_menu: true },
    { id: 'preview', label: 'Live Preview', path: '/admin/preview', group: 'pages', read_permission: PERMISSIONS.ADMIN_MOBILE_PREVIEW_READ, in_menu: false },
    { id: 'menus', label: 'Menus', path: '/admin/navigation', group: 'menus', read_permission: PERMISSIONS.ADMIN_NAVIGATION_READ, in_menu: true },
    { id: 'users', label: 'Users', path: '/admin/users', group: 'users', read_permission: PERMISSIONS.ADMIN_USER_READ, in_menu: true },
    { id: 'groups', label: 'Groups', path: '/admin/groups', group: 'users', read_permission: PERMISSIONS.ADMIN_GROUP_READ, in_menu: true },
    { id: 'roles', label: 'Roles', path: '/admin/roles', group: 'users', read_permission: PERMISSIONS.ADMIN_ROLE_READ, in_menu: true },
    { id: 'registration-codes', label: 'Registration Codes', path: '/admin/registration-codes', group: 'users', read_permission: PERMISSIONS.ADMIN_REGISTRATION_CODE_READ, in_menu: true },
    { id: 'assets', label: 'Assets', path: '/admin/assets', group: 'content', read_permission: PERMISSIONS.ADMIN_ASSET_READ, in_menu: true },
    { id: 'unused-sections', label: 'Unused Sections', path: '/admin/unused-sections', group: 'content', read_permission: PERMISSIONS.ADMIN_SECTION_READ, in_menu: true },
    { id: 'actions', label: 'Actions', path: '/admin/actions', group: 'automation', read_permission: PERMISSIONS.ADMIN_ACTION_READ, in_menu: true },
    { id: 'scheduled-jobs', label: 'Scheduled Jobs', path: '/admin/scheduled-jobs', group: 'automation', read_permission: PERMISSIONS.ADMIN_SCHEDULED_JOB_READ, in_menu: true },
    { id: 'scheduled-jobs-calendar', label: 'Jobs Calendar', path: '/admin/scheduled-jobs/calendar', group: 'automation', read_permission: PERMISSIONS.ADMIN_SCHEDULED_JOB_READ, in_menu: true },
    { id: 'languages', label: 'Languages', path: '/admin/languages', group: 'system', read_permission: PERMISSIONS.ADMIN_LANGUAGE_READ, in_menu: true },
    { id: 'data-browser', label: 'Data Browser', path: '/admin/data', group: 'system', read_permission: PERMISSIONS.ADMIN_DATA_READ, in_menu: true },
    { id: 'audit-logs', label: 'Audit Logs', path: '/admin/data-access', group: 'system', read_permission: PERMISSIONS.ADMIN_AUDIT_READ, in_menu: true },
    { id: 'cache', label: 'Cache Management', path: '/admin/cache', group: 'system', read_permission: PERMISSIONS.ADMIN_CACHE_READ, in_menu: true },
    { id: 'system', label: 'System Maintenance', path: '/admin/system', group: 'system', read_permission: PERMISSIONS.ADMIN_SYSTEM_READ, in_menu: true },
] as const satisfies readonly IAdminScreen[];

export type TAdminScreenId = (typeof ADMIN_SCREENS)[number]['id'];

/** The registry entry with this id. */
export function getAdminScreen(id: TAdminScreenId): IAdminScreen {
    const screen = ADMIN_SCREENS.find((s) => s.id === id);
    if (!screen) throw new Error(`Unknown admin screen "${id}"`);
    return screen;
}

/** Menu screens of one group, in registry order, that `hasPermission` allows. */
export function allowedMenuScreens(
    group: TAdminScreenGroup,
    hasPermission: (permission: string) => boolean,
): IAdminScreen[] {
    return ADMIN_SCREENS.filter(
        (s) => s.in_menu && s.group === group && hasPermission(s.read_permission),
    );
}

/**
 * The text of `docs/reference/admin-screens.json`: screens sorted by id,
 * fixed key order, 2-space indent, `\n` line ends, trailing newline.
 */
export function renderAdminScreensJson(): string {
    const screens = [...ADMIN_SCREENS]
        .sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0))
        .map((s) => ({
            id: s.id,
            label: s.label,
            path: s.path,
            group: s.group,
            read_permission: s.read_permission,
        }));
    return `${JSON.stringify({ generated_by: 'npm run access:screens', screens }, null, 2)}\n`;
}
