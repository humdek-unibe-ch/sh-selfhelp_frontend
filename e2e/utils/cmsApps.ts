/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
/**
 * CMS Apps E2E helpers — QA-prefixed import prefixes and admin credentials.
 */

import { adminCreds, isAdminConfigured } from './targets';

export interface ICmsAppsE2eEnv {
    email: string;
    password: string;
    loginKeyword: string;
    /** Safe keyword prefix for template imports (Rule 9: qa_ prefix). */
    keywordPrefix: string;
    /** Matching route prefix for the imported demo app. */
    routePrefix: string;
    /** Example gallery id for the Team Members template. */
    teamMembersExampleId: string;
}

export function cmsAppsE2eEnv(): ICmsAppsE2eEnv {
    const admin = adminCreds();
    const keywordPrefix = process.env.QA_CMS_APP_KEYWORD_PREFIX ?? 'qa_e2e_team_members_';
    const routePrefix = process.env.QA_CMS_APP_ROUTE_PREFIX ?? '/qa-e2e-team-members';
    return {
        email: admin.email,
        password: admin.password,
        loginKeyword: admin.loginKeyword,
        keywordPrefix,
        routePrefix,
        teamMembersExampleId: process.env.QA_CMS_APP_TEAM_EXAMPLE_ID ?? 'team-members',
    };
}

export function isCmsAppsE2eConfigured(): boolean {
    return isAdminConfigured();
}
