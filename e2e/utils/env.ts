/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
/**
 * Environment configuration for the golden E2E suite.
 *
 * Everything is driven by env so the same spec runs against any QA stack
 * without hard-coded hosts/paths (canonical Testing Rule 14: no
 * developer-machine absolute paths). All identifiers use the QA prefix
 * (canonical Testing Rule 9). The golden spec is skipped unless the
 * required QA env is present, so `npm run test:e2e` is safe to run on a
 * machine without a stack.
 *
 * The defaults below are the CANONICAL QA values owned by the backend
 * fixture {@link
 * https://github.com/humdek-unibe-ch/sh-selfhelp_backend `QaFrontendGoldenFixture`}
 * (seeded by `composer test:reset-db`). The one-command harness
 * (`scripts/e2e-stack.mjs`, invoked by `npm run test:golden`) exports the
 * same values so a developer never has to set QA_* by hand. Keep them in
 * sync with that fixture and with `scripts/e2e-stack.mjs`.
 */

export interface IQaE2eEnv {
    baseUrl: string;
    loginKeyword: string;
    email: string;
    password: string;
    formPageKeyword: string;
    submitLabel: string;
    /** Map of form field `name` → value to type. */
    formFields: Record<string, string>;
}

export function qaEnv(): IQaE2eEnv {
    return {
        baseUrl: process.env.BASE_URL ?? 'http://localhost:3000',
        loginKeyword: process.env.QA_LOGIN_KEYWORD ?? 'login',
        email: process.env.QA_USER_EMAIL ?? 'qa.user@selfhelp.test',
        password: process.env.QA_USER_PASSWORD ?? 'QaPassw0rd!2026',
        formPageKeyword: process.env.QA_FORM_PAGE_KEYWORD ?? 'qa-feedback',
        submitLabel: process.env.QA_FORM_SUBMIT_LABEL ?? 'Save',
        formFields: parseFields(process.env.QA_FORM_FIELDS),
    };
}

function parseFields(raw: string | undefined): Record<string, string> {
    if (!raw) return { qa_message: 'qa automated golden entry' };
    try {
        const parsed = JSON.parse(raw) as Record<string, string>;
        return parsed && typeof parsed === 'object' ? parsed : {};
    } catch {
        return {};
    }
}

/** The golden E2E only runs when explicitly pointed at a prepared QA stack. */
export function isQaConfigured(): boolean {
    return Boolean(process.env.QA_USER_EMAIL && process.env.QA_USER_PASSWORD && process.env.QA_FORM_PAGE_KEYWORD);
}
