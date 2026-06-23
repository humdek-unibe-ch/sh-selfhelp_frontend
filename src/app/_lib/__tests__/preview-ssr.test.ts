/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * Security regression test for the anonymous-preview gate.
 *
 * The backend (core >= 0.1.18) returns 401 for an anonymous `preview=true`.
 * The long-lived, admin-set `sh_preview` cookie can outlive the session (admin
 * enables preview, then logs out or the session expires), so `resolvePreviewSSR`
 * MUST only report preview when a session cookie is also present — otherwise an
 * anonymous SSR render would request the draft and the public page would
 * 401-loop instead of showing published content. Mirrors the mobile client's
 * `services/previewPolicy.ts` gate.
 */

// react's `cache()` wraps the resolver; pass the fn straight through so the
// test exercises the real implementation without an RSC request scope.
vi.mock('react', async (importOriginal) => {
    const actual = await importOriginal<Record<string, unknown>>();
    return { ...actual, cache: <T,>(fn: T): T => fn };
});
vi.mock('next/headers', () => ({
    cookies: vi.fn(),
}));

import { cookies } from 'next/headers';
import { resolvePreviewSSR } from '../server-fetch';
import { AUTH_COOKIE, REFRESH_COOKIE, PREVIEW_COOKIE } from '../../../config/cookie-names';

const cookiesMock = vi.mocked(cookies);

function seedJar(values: Record<string, string | undefined>): void {
    cookiesMock.mockResolvedValue({
        get: (name: string) => {
            const value = values[name];
            return value === undefined ? undefined : { name, value };
        },
    } as unknown as Awaited<ReturnType<typeof cookies>>);
}

beforeEach(() => {
    vi.clearAllMocks();
});

describe('resolvePreviewSSR', () => {
    it('does NOT preview for an anonymous caller even with a stale sh_preview cookie', async () => {
        seedJar({ [PREVIEW_COOKIE]: '1' });
        await expect(resolvePreviewSSR()).resolves.toBe(false);
    });

    it('previews for an authenticated session (access cookie present)', async () => {
        seedJar({ [PREVIEW_COOKIE]: '1', [AUTH_COOKIE]: 'tok' });
        await expect(resolvePreviewSSR()).resolves.toBe(true);
    });

    it('previews when only the refresh cookie is present (access expired, session alive)', async () => {
        seedJar({ [PREVIEW_COOKIE]: 'true', [REFRESH_COOKIE]: 'rtok' });
        await expect(resolvePreviewSSR()).resolves.toBe(true);
    });

    it('is published when the preview cookie is absent, even when logged in', async () => {
        seedJar({ [AUTH_COOKIE]: 'tok' });
        await expect(resolvePreviewSSR()).resolves.toBe(false);
    });

    it('is published for a non-truthy preview cookie value', async () => {
        seedJar({ [PREVIEW_COOKIE]: '0', [AUTH_COOKIE]: 'tok' });
        await expect(resolvePreviewSSR()).resolves.toBe(false);
    });
});
