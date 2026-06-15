/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/

import { afterEach, describe, expect, it, vi } from 'vitest';

/**
 * The per-instance cookie suffix is computed once at module evaluation from
 * `SELFHELP_INSTANCE_ID`, so every case re-imports the module after setting the
 * env var. This is the regression guard for the shared-host logout cascade:
 * many instances on `localhost:<port>` must NOT share the httpOnly session
 * cookies (cookies are scoped by host, not port).
 */
async function loadWithInstanceId(id: string | undefined): Promise<typeof import('./cookie-names')> {
    if (id === undefined) delete process.env.SELFHELP_INSTANCE_ID;
    else process.env.SELFHELP_INSTANCE_ID = id;
    vi.resetModules();
    return import('./cookie-names');
}

describe('per-instance cookie names', () => {
    const ORIGINAL = process.env.SELFHELP_INSTANCE_ID;

    afterEach(() => {
        if (ORIGINAL === undefined) delete process.env.SELFHELP_INSTANCE_ID;
        else process.env.SELFHELP_INSTANCE_ID = ORIGINAL;
        vi.resetModules();
    });

    it('suffixes the httpOnly, server-only session cookies with the instance id', async () => {
        const m = await loadWithInstanceId('dddddd');
        expect(m.AUTH_COOKIE).toBe('sh_auth_dddddd');
        expect(m.REFRESH_COOKIE).toBe('sh_refresh_dddddd');
        expect(m.IMPERSONATE_COOKIE).toBe('sh_impersonate_dddddd');
    });

    it('keeps the browser-readable cookies stable (CSRF + impersonation display hint)', async () => {
        const m = await loadWithInstanceId('dddddd');
        expect(m.CSRF_COOKIE).toBe('sh_csrf');
        expect(m.IMPERSONATE_TARGET_EMAIL_COOKIE).toBe('sh_impersonate_target_email');
        expect(m.LANG_COOKIE).toBe('sh_lang');
    });

    it('gives two instances different session cookie names so one never reads the other', async () => {
        const ttt = await loadWithInstanceId('ttt');
        const tttAuth = ttt.AUTH_COOKIE;
        const tttRefresh = ttt.REFRESH_COOKIE;
        const ddd = await loadWithInstanceId('dddddd');
        expect(tttAuth).not.toBe(ddd.AUTH_COOKIE);
        expect(tttRefresh).not.toBe(ddd.REFRESH_COOKIE);
    });

    it('falls back to the historical single-instance names when no id is set', async () => {
        const m = await loadWithInstanceId(undefined);
        expect(m.AUTH_COOKIE).toBe('sh_auth');
        expect(m.REFRESH_COOKIE).toBe('sh_refresh');
        expect(m.IMPERSONATE_COOKIE).toBe('sh_impersonate');
    });

    it('exposes the legacy (pre-suffix) names so logout can flush the old shared cookie', async () => {
        const m = await loadWithInstanceId('dddddd');
        expect(m.LEGACY_AUTH_COOKIE).toBe('sh_auth');
        expect(m.LEGACY_REFRESH_COOKIE).toBe('sh_refresh');
    });

    it('strips characters that are not valid in a cookie name from the instance id', async () => {
        const m = await loadWithInstanceId('a.b:c/d 1');
        expect(m.AUTH_COOKIE).toBe('sh_auth_abcd1');
    });
});
