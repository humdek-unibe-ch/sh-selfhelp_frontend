/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
/**
 * CMS Apps E2E helpers — QA-prefixed import prefixes and admin credentials.
 *
 * Every run imports its own copy of the template under keywords and routes
 * that carry a run suffix, so a rerun on the same database never meets the
 * pages of an earlier run, and a spec removes only what carries its own
 * suffix (`removeCmsApp`).
 */

import { expect, type Page } from '@playwright/test';
import { apiDelete, apiGet, apiPost } from './formList';
import { adminCreds, isAdminConfigured } from './targets';

export interface ICmsAppsE2eEnv {
    email: string;
    password: string;
    loginKeyword: string;
    /** Run-unique suffix (lowercase letters and digits) in every keyword, route and slug below. */
    suffix: string;
    /** Safe keyword prefix for template imports (Rule 9: qa_ prefix), unique per run. */
    keywordPrefix: string;
    /** Matching route prefix for the imported demo app, unique per run. */
    routePrefix: string;
    /** The slug the importer derives for the app of the Team Members template. */
    appSlug: string;
    /** Example gallery id for the Team Members template. */
    teamMembersExampleId: string;
}

/** Same rule as the importer: lowercase, every run of other characters becomes one hyphen. */
function sanitizeSlug(raw: string): string {
    return raw.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

export function cmsAppsE2eEnv(suffix: string = Date.now().toString(36)): ICmsAppsE2eEnv {
    const admin = adminCreds();
    const keywordPrefix = `${process.env.QA_CMS_APP_KEYWORD_PREFIX ?? 'qa_e2e_team_members_'}${suffix}_`;
    const routePrefix = `${process.env.QA_CMS_APP_ROUTE_PREFIX ?? '/qa-e2e-team-members'}-${suffix}`;
    const teamMembersExampleId = process.env.QA_CMS_APP_TEAM_EXAMPLE_ID ?? 'team-members';
    return {
        email: admin.email,
        password: admin.password,
        loginKeyword: admin.loginKeyword,
        suffix,
        keywordPrefix,
        routePrefix,
        appSlug: sanitizeSlug(`${keywordPrefix}team-members`),
        teamMembersExampleId,
    };
}

export function isCmsAppsE2eConfigured(): boolean {
    return isAdminConfigured();
}

interface ICmsAppSummary {
    id: number;
    slug: string;
}

/**
 * Switch the signed-in account to one content language through the endpoint the language selector
 * uses (`POST /auth/set-language`). The admin shell shows the template texts in the language of the
 * account (a cookie alone is not enough: the account's language wins on every page load), and the
 * spec reads the English labels. Returns the language the account had (the install default when it
 * had none of its own), so the spec can put it back: an account can be moved to another language but
 * never back to "no language of its own".
 */
export async function selectLocale(page: Page, locale: string): Promise<{ previous: number; selected: number }> {
    const languages = await apiGet(page, '/api/languages');
    expect(languages.status, 'GET the languages').toBe(200);
    const known = ((languages.json as { data?: Array<{ id: number; locale: string }> } | null)?.data ?? []);
    const wanted = known.find((entry) => entry.locale === locale);
    expect(wanted, `the install carries the language ${locale}`).toBeDefined();

    const account = await apiGet(page, '/api/auth/user-data');
    expect(account.status, 'GET the account').toBe(200);
    const previous = (account.json as { data?: { language?: { id?: number } } } | null)?.data?.language?.id;
    expect(previous, 'the account data names its language').toEqual(expect.any(Number));

    const selected = (wanted as { id: number }).id;
    if (previous !== selected) {
        await setLanguage(page, selected);
    }
    return { previous: previous as number, selected };
}

/** Persist the language preference of the signed-in account. */
export async function setLanguage(page: Page, languageId: number): Promise<void> {
    const changed = await apiPost(page, '/api/auth/set-language', { language_id: languageId });
    expect(changed.status, `set the language ${languageId}: ${JSON.stringify(changed.json)}`).toBeLessThan(400);
}

/**
 * Remove the app of one run: the app shell first (it unassigns its pages), then every page the run
 * imported. Uses the BFF endpoints the admin pages use; a page already gone is not an error.
 */
export async function removeCmsApp(page: Page, appSlug: string, pageIds: readonly number[]): Promise<void> {
    const apps = await apiGet(page, '/api/admin/cms-apps');
    expect(apps.status, 'GET the CMS apps').toBe(200);
    const list = ((apps.json as { data?: ICmsAppSummary[] } | null)?.data ?? []) as ICmsAppSummary[];
    const app = list.find((candidate) => candidate.slug === appSlug);
    if (app !== undefined) {
        const removed = await apiDelete(page, `/api/admin/cms-apps/${app.id}`, undefined);
        expect(removed.status, `delete the shell of ${appSlug}`).toBeLessThan(400);
    }
    for (const pageId of pageIds) {
        const removed = await apiDelete(page, `/api/admin/pages/${pageId}`, undefined);
        expect([200, 204, 404], `delete page ${pageId}: ${JSON.stringify(removed.json)}`).toContain(removed.status);
    }
}
