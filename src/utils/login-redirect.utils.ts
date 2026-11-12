/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
/**
 * "Where to go after signing in" travels in ONE query parameter, written by
 * every redirect to the login page (proxy admin gate, expired session,
 * cross-tab logout, 404 sign-in link) and read by the login and 2FA screens.
 * Writers and readers share this name so they cannot drift apart again: the
 * admin gate used to write `redirect` while the login screen only read
 * `redirectTo`, so an expired admin session always landed on the home page.
 */
export const LOGIN_REDIRECT_PARAM = 'redirectTo';

/** `<path>?redirectTo=<target, URL-encoded>`, e.g. the login URL for a return address. */
export function withRedirectTo(path: string, target: string): string {
    return `${path}?${LOGIN_REDIRECT_PARAM}=${encodeURIComponent(target)}`;
}

/** A tab, a line feed or any other control character in the target, or a backslash. */
const UNSAFE_CHARACTERS = /[\u0000-\u001f\u007f\\]/;

/** Throwaway origin used only to see whether a target stays on the site that resolves it. */
const PROBE_ORIGIN = 'http://return-address.invalid';

/**
 * The return address comes from the URL, so anyone can put anything there
 * (`/login?redirectTo=https://evil.example`): it may only ever be a path on THIS
 * site. Returns the target unchanged when it is, `null` otherwise, so the caller
 * keeps its own fallback (`?? ROUTES.HOME`).
 *
 * Refused: absolute and `javascript:` URLs, protocol-relative `//host`, `/\host`
 * (browsers read the backslash as a slash), and tabs/line feeds (URL parsers
 * strip them, which turns `/<tab>/host` into `//host`).
 */
export function safeRedirectTarget(target: string | null | undefined): string | null {
    if (!target || !target.startsWith('/') || target.startsWith('//')) {
        return null;
    }
    if (UNSAFE_CHARACTERS.test(target)) {
        return null;
    }
    try {
        if (new URL(target, PROBE_ORIGIN).origin !== PROBE_ORIGIN) {
            return null;
        }
    } catch {
        return null;
    }

    return target;
}
