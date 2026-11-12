/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { describe, expect, it } from 'vitest';
import { LOGIN_REDIRECT_PARAM, safeRedirectTarget, withRedirectTo } from '../login-redirect.utils';

describe('safeRedirectTarget', () => {
    it.each([
        '/admin/pages',
        '/home',
        '/admin/pages?page=2&search=a%20b',
        '/profile#settings',
        '/%2F/looks-protocol-relative-but-is-an-encoded-path',
        '/a//b',
    ])('keeps the same-site path %s unchanged', (target) => {
        expect(safeRedirectTarget(target)).toBe(target);
    });

    it.each([
        ['an absolute URL', 'https://evil.example/phish'],
        ['a protocol-relative URL', '//evil.example'],
        ['a protocol-relative URL with a path', '//evil.example/admin'],
        ['a slash-backslash host', '/\\evil.example'],
        ['a backslash anywhere in the path', '/admin\\..\\evil'],
        ['a javascript: URL', 'javascript:alert(1)'],
        ['a data: URL', 'data:text/html,<script>alert(1)</script>'],
        ['a tab that URL parsers strip', '/\t/evil.example'],
        ['a line feed that URL parsers strip', '/\n/evil.example'],
        ['a carriage return', '/\r/evil.example'],
        ['a NUL byte', '/ok\u0000'],
        ['a path without a leading slash', 'admin/pages'],
        ['a bare host', 'evil.example'],
        ['whitespace before the slash', ' /admin'],
        ['an empty string', ''],
    ])('refuses %s', (_label, target) => {
        expect(safeRedirectTarget(target)).toBeNull();
    });

    it('refuses a missing value', () => {
        expect(safeRedirectTarget(null)).toBeNull();
        expect(safeRedirectTarget(undefined)).toBeNull();
    });
});

describe('withRedirectTo', () => {
    it('writes the one parameter name every reader uses', () => {
        expect(LOGIN_REDIRECT_PARAM).toBe('redirectTo');
        expect(withRedirectTo('/login', '/admin/pages?x=1')).toBe('/login?redirectTo=%2Fadmin%2Fpages%3Fx%3D1');
    });

    it('produces a value the reader accepts again', () => {
        const url = new URL(withRedirectTo('/login', '/admin/users?page=2'), 'http://site.test');

        expect(safeRedirectTarget(url.searchParams.get(LOGIN_REDIRECT_PARAM))).toBe('/admin/users?page=2');
    });
});
