/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { NextRequest } from 'next/server';
import { proxy } from '../proxy';
import { LOGIN_REDIRECT_PARAM, safeRedirectTarget } from '../utils/login-redirect.utils';

/**
 * The admin gate bounces a visitor without a session to the login page. It must
 * write the return address under the name the login screen READS: it used to
 * write `redirect` while the login and 2FA screens read `redirectTo`, so an
 * expired admin session always landed on the home page after signing in.
 */
describe('proxy admin gate', () => {
    it('sends an anonymous /admin request to the login page with the return address in redirectTo', async () => {
        const response = await proxy(new NextRequest('http://localhost/admin/pages?page=2&search=a%20b'));

        expect(response.status).toBe(307);
        const location = new URL(response.headers.get('location') ?? '');
        expect(location.pathname).toBe('/login');
        expect(location.searchParams.get('redirectTo')).toBe('/admin/pages?page=2&search=a%20b');
        expect(location.searchParams.has('redirect')).toBe(false);
    });

    it('writes a return address the login screen accepts', async () => {
        const response = await proxy(new NextRequest('http://localhost/admin/users?page=2'));

        const location = new URL(response.headers.get('location') ?? '');
        expect(safeRedirectTarget(location.searchParams.get(LOGIN_REDIRECT_PARAM))).toBe('/admin/users?page=2');
    });

    it('leaves public pages alone', async () => {
        const response = await proxy(new NextRequest('http://localhost/home'));

        expect(response.status).toBe(200);
        expect(response.headers.get('location')).toBeNull();
    });
});
