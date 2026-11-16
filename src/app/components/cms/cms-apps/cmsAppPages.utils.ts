/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/

/**
 * CMS-app page classification helpers for admin nav and content hosting.
 *
 * CMS-surface roles (`cms_list`, `cms_detail`, `form`) are admin-only snippets.
 * Public roles (`public_list`, `public_detail`) stay on the public site and in
 * Content Pages for structure editing.
 *
 * An app made by the scaffold wizard (or a shipped template) has one CMS page,
 * the `cms_list`: an `entry-form-list` that holds the form and adds, edits,
 * deletes and restores the records itself. `cms_detail` and `form` pages remain
 * valid roles for apps that were assembled by hand or imported from older bundles.
 */

import type { IAdminPage } from '../../../../types/responses/admin/admin.types';
import type { TCmsAppRole } from '../../../../types/requests/admin/cms-app.types';

export const CMS_SURFACE_ROLES: ReadonlySet<TCmsAppRole> = new Set([
    'cms_list',
    'cms_detail',
    'form',
]);

export const PUBLIC_CMS_APP_ROLES: ReadonlySet<TCmsAppRole> = new Set([
    'public_list',
    'public_detail',
]);

/** True when the page is an admin-only CMS-app surface (not shown on the public site). */
export function isCmsSurfaceAdminPage(
    page: Pick<IAdminPage, 'page_surface' | 'cms_app_role'>,
): boolean {
    if (page.page_surface === 'cms') {
        return true;
    }
    const role = page.cms_app_role;
    return role != null && (CMS_SURFACE_ROLES as ReadonlySet<string>).has(role);
}

/**
 * Content Pages list: ordinary public pages, including public CMS-app list/detail.
 * Excludes system/config elsewhere; excludes admin CMS-surface pages.
 */
export function isContentPagesCandidate(
    page: Pick<IAdminPage, 'page_surface' | 'cms_app_role' | 'cms_app_id'>,
): boolean {
    return !isCmsSurfaceAdminPage(page);
}

/** Admin URL that hosts the CMS list (an entry-form-list, or an older entry-table) inside AdminShell. */
export function cmsAppContentPath(slug: string): string {
    return `/admin/cms-apps/${encodeURIComponent(slug)}/content`;
}

/** Admin URL for create (blank form) inside the app content host. */
export function cmsAppContentFormPath(slug: string): string {
    return `${cmsAppContentPath(slug)}/form`;
}

/** Admin URL for edit (record form) inside the app content host. */
export function cmsAppContentRecordPath(slug: string, recordId: string | number): string {
    return `${cmsAppContentPath(slug)}/${encodeURIComponent(String(recordId))}`;
}

/** One page the scaffold wizard creates, as shown in its preview table. */
export interface IScaffoldRoutePlan {
    role: TCmsAppRole;
    surface: 'public' | 'cms';
    pattern: string;
    /** What the page does, in a few plain words. */
    description: string;
}

export interface IScaffoldRouteChoices {
    base: string;
    recordIdParam: string;
    createForm: boolean;
    createPublic: boolean;
    createAdmin: boolean;
}

/**
 * The pages the scaffold wizard creates for a set of choices; it mirrors
 * `CmsAppWizardService` of the backend, which stays the authority.
 *
 *  - the CMS list `/cms/<base>`: one entry list. With a new form it also adds, edits,
 *    deletes and restores records; over an existing table it shows and deletes them;
 *  - the public list `/<base>`: a read-only data view of the same records;
 *  - the public detail page `/<base>/{param}`: one record.
 */
export function plannedScaffoldRoutes(choices: IScaffoldRouteChoices): IScaffoldRoutePlan[] {
    const base = choices.base.trim();
    if (base === '') {
        return [];
    }
    const param = choices.recordIdParam || 'record_id';
    const routes: IScaffoldRoutePlan[] = [];
    if (choices.createAdmin) {
        routes.push({
            role: 'cms_list',
            surface: 'cms',
            pattern: `/cms/${base}`,
            description: choices.createForm
                ? 'Entry list with its form: add, edit, delete and restore records'
                : 'Entry list of the table: view and delete records',
        });
    }
    if (choices.createPublic) {
        routes.push({
            role: 'public_list',
            surface: 'public',
            pattern: `/${base}`,
            description: 'Read-only list of the same records',
        });
        routes.push({
            role: 'public_detail',
            surface: 'public',
            pattern: `/${base}/{${param}}`,
            description: 'One record',
        });
    }
    return routes;
}

/** A new form lives inside the CMS list, so it cannot be created without that list. */
export function scaffoldFormNeedsCmsList(choices: Pick<IScaffoldRouteChoices, 'createForm' | 'createAdmin'>): boolean {
    return choices.createForm && !choices.createAdmin;
}

/** Admin URL for app structure / metadata config. */
export function cmsAppConfigPath(slug: string): string {
    return `/admin/cms-apps/${encodeURIComponent(slug)}`;
}

/** Admin page-sections editor for a CMS page keyword. */
export function adminPageEditorPath(pageKeyword: string): string {
    return `/admin/pages/${encodeURIComponent(pageKeyword.trim())}`;
}

/** One accordion section in the Content Pages list (ungrouped or per CMS app). */
export interface ICmsAppPageGroup<T extends { cms_app_id?: number | null }> {
    appId: number | null;
    label: string;
    pages: T[];
}

/**
 * Group root-level Content Pages tree items by `cms_app_id`.
 * Ungrouped pages use `appId: null` and the {@link ungroupedLabel} heading.
 */
export function groupRootPagesByCmsApp<T extends { cms_app_id?: number | null }>(
    rootPages: readonly T[],
    appNameById: ReadonlyMap<number, string>,
    ungroupedLabel = 'Public website',
): ICmsAppPageGroup<T>[] {
    const ungrouped: T[] = [];
    const byAppId = new Map<number, T[]>();

    for (const page of rootPages) {
        const appId = page.cms_app_id ?? null;
        if (appId == null) {
            ungrouped.push(page);
            continue;
        }
        const bucket = byAppId.get(appId) ?? [];
        bucket.push(page);
        byAppId.set(appId, bucket);
    }

    const groups: ICmsAppPageGroup<T>[] = [];
    if (ungrouped.length > 0) {
        groups.push({ appId: null, label: ungroupedLabel, pages: ungrouped });
    }

    const sortedAppIds = [...byAppId.keys()].sort((left, right) => {
        const leftName = appNameById.get(left) ?? '';
        const rightName = appNameById.get(right) ?? '';
        return leftName.localeCompare(rightName, undefined, { sensitivity: 'base' });
    });

    for (const appId of sortedAppIds) {
        groups.push({
            appId,
            label: appNameById.get(appId) ?? `CMS app #${appId}`,
            pages: byAppId.get(appId) ?? [],
        });
    }

    return groups;
}

/** True when the list should render CMS-app group headings (not a flat tree). */
export function shouldShowCmsAppPageGroups<T extends { cms_app_id?: number | null }>(
    groups: readonly ICmsAppPageGroup<T>[],
): boolean {
    return groups.some((group) => group.appId != null);
}

/**
 * Resolve a usable button / link href.
 * Treats unset / `#` page_keyword as empty so the path `url` field wins.
 */
export function resolveButtonHref(
    pageKeyword: string | null | undefined,
    url: string | null | undefined,
): string | undefined {
    const keyword = (pageKeyword ?? '').trim();
    const external = (url ?? '').trim();
    if (keyword !== '' && keyword !== '#') {
        return keyword;
    }
    if (external !== '') {
        return external;
    }
    return undefined;
}
