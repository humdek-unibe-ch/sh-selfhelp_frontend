/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

/**
 * `getAssetUrl` depends on `API_CONFIG.BACKEND_URL`, which is frozen from
 * `process.env.NEXT_PUBLIC_API_URL` at module import. We reset modules per
 * test so we can exercise both wirings:
 *   - production Docker/BFF mode: `NEXT_PUBLIC_API_URL=/api` (same-origin),
 *   - dev mode: an absolute Symfony origin.
 */
async function loadGetAssetUrl(apiUrl: string | undefined) {
    vi.resetModules();
    if (apiUrl === undefined) {
        delete process.env.NEXT_PUBLIC_API_URL;
    } else {
        process.env.NEXT_PUBLIC_API_URL = apiUrl;
    }
    const mod = await import('../asset-url.utils');
    return mod.getAssetUrl;
}

const ORIGINAL = process.env.NEXT_PUBLIC_API_URL;

afterEach(() => {
    if (ORIGINAL === undefined) delete process.env.NEXT_PUBLIC_API_URL;
    else process.env.NEXT_PUBLIC_API_URL = ORIGINAL;
});

describe('getAssetUrl — production BFF mode (NEXT_PUBLIC_API_URL=/api)', () => {
    let getAssetUrl: (p: string) => string;
    beforeEach(async () => {
        getAssetUrl = await loadGetAssetUrl('/api');
    });

    it('emits a same-origin /uploads path the frontend can proxy to the private backend', () => {
        // Browser must never hit the internal backend directly; the next.config
        // /uploads rewrite forwards this to SYMFONY_INTERNAL_URL.
        expect(getAssetUrl('uploads/avatar.png')).toBe('/uploads/avatar.png');
    });

    it('defaults bare relative paths under uploads/, same-origin', () => {
        expect(getAssetUrl('avatar.png')).toBe('/uploads/avatar.png');
    });

    it('keeps frontend-served assets/ paths same-origin (Next public/)', () => {
        expect(getAssetUrl('assets/logo.svg')).toBe('/assets/logo.svg');
    });

    it('never bakes the internal backend host into a browser URL', () => {
        expect(getAssetUrl('uploads/x.png')).not.toContain('backend');
        expect(getAssetUrl('uploads/x.png')).not.toContain('http');
    });
});

describe('getAssetUrl — dev mode (absolute Symfony origin)', () => {
    let getAssetUrl: (p: string) => string;
    beforeEach(async () => {
        getAssetUrl = await loadGetAssetUrl('http://localhost/symfony');
    });

    it('points relative uploads at the absolute dev backend', () => {
        expect(getAssetUrl('uploads/avatar.png')).toBe('http://localhost/symfony/uploads/avatar.png');
    });
});

describe('getAssetUrl — shared behaviour', () => {
    let getAssetUrl: (p: string) => string;
    beforeEach(async () => {
        getAssetUrl = await loadGetAssetUrl('/api');
    });

    it('returns empty string for empty/invalid input', () => {
        expect(getAssetUrl('')).toBe('');
        // @ts-expect-error exercising the runtime guard
        expect(getAssetUrl(null)).toBe('');
    });

    it('passes through absolute http(s) and data URLs untouched', () => {
        expect(getAssetUrl('https://cdn.example.com/a.png')).toBe('https://cdn.example.com/a.png');
        expect(getAssetUrl('data:image/png;base64,AAAA')).toBe('data:image/png;base64,AAAA');
    });

    it('normalises legacy admin/uploads/ and admin/ prefixes', () => {
        expect(getAssetUrl('admin/uploads/x.png')).toBe('/uploads/x.png');
        expect(getAssetUrl('admin/css/x.css')).toBe('/uploads/css/x.css');
    });
});
