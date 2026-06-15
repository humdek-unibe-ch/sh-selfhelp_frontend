/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/

import { afterEach, describe, expect, it, vi } from 'vitest';

/**
 * The per-instance cookie suffix is computed once at module evaluation. On the
 * server it comes from `SELFHELP_INSTANCE_ID`; in the browser it is read back
 * from `<html data-sh-instance>` (mirrored there by the root layout). Every
 * case re-imports the module after arranging the relevant source.
 *
 * This is the regression guard for the shared-host bleed: many instances on
 * `localhost:<port>` must NOT share ANY cookie (cookies are scoped by host, not
 * port), or session, locale, theme and preview state mix across instances.
 */

/** Base (suffix-free) name of every cookie that must be namespaced per instance. */
const ALL_COOKIES = [
    ['AUTH_COOKIE', 'sh_auth'],
    ['REFRESH_COOKIE', 'sh_refresh'],
    ['IMPERSONATE_COOKIE', 'sh_impersonate'],
    ['IMPERSONATE_TARGET_EMAIL_COOKIE', 'sh_impersonate_target_email'],
    ['CSRF_COOKIE', 'sh_csrf'],
    ['LANG_COOKIE', 'sh_lang'],
    ['LOCALE_HINT_COOKIE', 'sh_accept_locale'],
    ['PREVIEW_COOKIE', 'sh_preview'],
    ['COLOR_SCHEME_COOKIE', 'sh_color_scheme'],
] as const;

type Mod = typeof import('./cookie-names');

/** Arrange the SERVER source (env var) and re-import the module. */
async function loadWithEnvInstanceId(id: string | undefined): Promise<Mod> {
    delete (globalThis as { document?: unknown }).document;
    if (id === undefined) delete process.env.SELFHELP_INSTANCE_ID;
    else process.env.SELFHELP_INSTANCE_ID = id;
    vi.resetModules();
    return import('./cookie-names');
}

/** Arrange the BROWSER source (`<html data-sh-instance>`) and re-import. */
async function loadWithDomInstanceId(id: string): Promise<Mod> {
    delete process.env.SELFHELP_INSTANCE_ID;
    (globalThis as { document?: unknown }).document = {
        documentElement: { dataset: { shInstance: id } },
    };
    vi.resetModules();
    try {
        return await import('./cookie-names');
    } finally {
        delete (globalThis as { document?: unknown }).document;
    }
}

describe('per-instance cookie names', () => {
    const ORIGINAL = process.env.SELFHELP_INSTANCE_ID;

    afterEach(() => {
        if (ORIGINAL === undefined) delete process.env.SELFHELP_INSTANCE_ID;
        else process.env.SELFHELP_INSTANCE_ID = ORIGINAL;
        delete (globalThis as { document?: unknown }).document;
        vi.resetModules();
    });

    it('suffixes EVERY cookie with the instance id (server env source)', async () => {
        const m = await loadWithEnvInstanceId('dddddd');
        for (const [key, base] of ALL_COOKIES) {
            expect(String(m[key])).toBe(`${base}_dddddd`);
        }
    });

    it('derives the same suffix in the browser from <html data-sh-instance>', async () => {
        const m = await loadWithDomInstanceId('dddddd');
        for (const [key, base] of ALL_COOKIES) {
            expect(String(m[key])).toBe(`${base}_dddddd`);
        }
    });

    it('gives two instances different cookie names so one never reads the other', async () => {
        const ttt = await loadWithEnvInstanceId('ttt');
        const snapshot = ALL_COOKIES.map(([key]) => String(ttt[key]));
        const ddd = await loadWithEnvInstanceId('dddddd');
        ALL_COOKIES.forEach(([key], i) => {
            expect(String(ddd[key])).not.toBe(snapshot[i]);
        });
    });

    it('falls back to the historical single-instance names when no id is set', async () => {
        const m = await loadWithEnvInstanceId(undefined);
        for (const [key, base] of ALL_COOKIES) {
            expect(String(m[key])).toBe(base);
        }
    });

    it('exposes the legacy (pre-suffix) session names so logout can flush the old shared cookie', async () => {
        const m = await loadWithEnvInstanceId('dddddd');
        expect(m.LEGACY_AUTH_COOKIE).toBe('sh_auth');
        expect(m.LEGACY_REFRESH_COOKIE).toBe('sh_refresh');
    });

    it('strips characters that are not valid in a cookie name from the instance id', async () => {
        const m = await loadWithEnvInstanceId('a.b:c/d 1');
        expect(m.AUTH_COOKIE).toBe('sh_auth_abcd1');
    });
});
