/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { describe, it, expect } from 'vitest';
import type { NextResponse } from 'next/server';
import { clearAuthCookies } from '../proxy';
import { AUTH_COOKIE, REFRESH_COOKIE, PREVIEW_COOKIE } from '../../../../config/cookie-names';

/**
 * Security regression test: logout / session-expiry must clear the long-lived,
 * admin-set `sh_preview` cookie alongside the auth cookies. Both flows funnel
 * through `clearAuthCookies`. A stale preview flag left on an anonymous visitor
 * makes the backend (core >= 0.1.18) reject the draft request with 401.
 */
interface ICookieSet {
    name: string;
    value: string;
    opts: { maxAge?: number; httpOnly?: boolean };
}

function fakeResponse(): { res: NextResponse; sets: ICookieSet[] } {
    const sets: ICookieSet[] = [];
    const res = {
        cookies: {
            set: (name: string, value: string, opts: ICookieSet['opts']) => {
                sets.push({ name, value, opts });
            },
        },
    } as unknown as NextResponse;
    return { res, sets };
}

describe('clearAuthCookies', () => {
    it('expires the preview cookie together with the auth + refresh cookies', () => {
        const { res, sets } = fakeResponse();
        clearAuthCookies(res);

        const byName = (name: string): ICookieSet | undefined => sets.find((s) => s.name === name);

        // The fix: sh_preview is expired so an anonymous visitor never inherits
        // a stale preview flag.
        expect(byName(PREVIEW_COOKIE)).toBeDefined();
        expect(byName(PREVIEW_COOKIE)?.value).toBe('');
        expect(byName(PREVIEW_COOKIE)?.opts.maxAge).toBe(0);

        // Existing behaviour preserved.
        expect(byName(AUTH_COOKIE)?.opts.maxAge).toBe(0);
        expect(byName(REFRESH_COOKIE)?.opts.maxAge).toBe(0);
    });
});
