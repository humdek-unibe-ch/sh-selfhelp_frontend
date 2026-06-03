/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
/**
 * Page targets for the visual-regression + accessibility suites (Slice 11).
 *
 * Everything is env-driven so the same specs run against any QA stack without
 * hard-coded hosts/paths (canonical Testing Rule 14) and all identifiers use
 * the QA prefix (Rule 9). Admin-scoped checks need admin credentials; when
 * those (or an optional path such as the plugin admin page / SurveyJS runtime)
 * are absent, the relevant spec skips cleanly so the suite is safe to run on a
 * machine without a fully-seeded stack.
 */

export interface IAdminCreds {
    email: string;
    password: string;
    loginKeyword: string;
}

/** Admin persona used for admin-scoped visual + a11y checks (defaults to the QA baseline admin). */
export function adminCreds(): IAdminCreds {
    return {
        email: process.env.QA_ADMIN_EMAIL ?? 'qa.admin@selfhelp.test',
        password: process.env.QA_ADMIN_PASSWORD ?? '',
        loginKeyword: process.env.QA_LOGIN_KEYWORD ?? 'login',
    };
}

/** Admin-scoped checks only run when an admin password is supplied. */
export function isAdminConfigured(): boolean {
    return Boolean(process.env.QA_ADMIN_EMAIL && process.env.QA_ADMIN_PASSWORD);
}

function csv(raw: string | undefined, fallback: string[]): string[] {
    if (!raw) return fallback;
    return raw
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
}

export interface IVisualTargets {
    /** Genuinely public routes (no auth). */
    publicPaths: string[];
    /** 3 admin routes (auth required). */
    adminPaths: string[];
    /** Optional SurveyJS runtime page (public). Empty string ⇒ skip. */
    surveyRuntimePath: string;
}

export function visualTargets(): IVisualTargets {
    const loginKeyword = process.env.QA_LOGIN_KEYWORD ?? 'login';
    return {
        // Public defaults: home + login. The QA form page is ACL-gated (the
        // golden flow logs in before opening it), so it is captured as an
        // authenticated shot in the spec, not here. Override with
        // QA_VISUAL_PUBLIC_PATHS (comma-separated) for a real stack.
        publicPaths: csv(process.env.QA_VISUAL_PUBLIC_PATHS, ['/', `/${loginKeyword}`]),
        adminPaths: csv(process.env.QA_VISUAL_ADMIN_PATHS, ['/admin', '/admin/pages', '/admin/users']),
        surveyRuntimePath: process.env.QA_SURVEY_RUNTIME_PATH ?? '',
    };
}

export interface IA11yTargets {
    loginPath: string;
    /** Admin page editor (auth required). */
    adminEditorPath: string;
    /** Optional plugin admin page (auth required). Empty string ⇒ skip. */
    pluginAdminPath: string;
}

export function a11yTargets(): IA11yTargets {
    return {
        loginPath: `/${process.env.QA_LOGIN_KEYWORD ?? 'login'}`,
        adminEditorPath: process.env.QA_ADMIN_EDITOR_PATH ?? '/admin/pages',
        pluginAdminPath: process.env.QA_PLUGIN_ADMIN_PATH ?? '',
    };
}
