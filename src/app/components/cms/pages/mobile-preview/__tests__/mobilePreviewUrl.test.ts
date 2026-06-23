/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { describe, it, expect } from 'vitest';
import {
    buildMobilePreviewUrl,
    DEFAULT_MOBILE_PREVIEW_ORIGIN,
    DEV_EXPO_PREVIEW_ORIGIN,
    isAbsolutePreviewOrigin,
    normalizePreviewOrigin,
    previewOriginCandidates,
} from '../mobilePreviewUrl';

/** Parse the query string of a built preview URL into a plain map for asserting. */
function queryOf(url: string): Record<string, string> {
    const qs = url.slice(url.indexOf('?') + 1);
    return Object.fromEntries(new URLSearchParams(qs).entries());
}

describe('normalizePreviewOrigin', () => {
    it('strips trailing slashes', () => {
        expect(normalizePreviewOrigin('/mobile-preview/')).toBe('/mobile-preview');
        expect(normalizePreviewOrigin('http://localhost:8081///')).toBe('http://localhost:8081');
    });

    it('falls back to the default when empty', () => {
        expect(normalizePreviewOrigin('')).toBe(DEFAULT_MOBILE_PREVIEW_ORIGIN);
        expect(normalizePreviewOrigin('   ')).toBe(DEFAULT_MOBILE_PREVIEW_ORIGIN);
    });
});

describe('isAbsolutePreviewOrigin', () => {
    it('detects absolute (live-reload dev) origins', () => {
        expect(isAbsolutePreviewOrigin('http://localhost:8081')).toBe(true);
        expect(isAbsolutePreviewOrigin('https://preview.example.test')).toBe(true);
        expect(isAbsolutePreviewOrigin('/mobile-preview')).toBe(false);
    });
});

describe('previewOriginCandidates (auto-resolution precedence)', () => {
    it('an explicit same-origin path wins outright and must serve version.json (not optimistic)', () => {
        const candidates = previewOriginCandidates({ explicitOrigin: '/mp/', isDev: true });
        expect(candidates).toEqual([{ origin: '/mp', mode: 'explicit', optimistic: false }]);
    });

    it('an explicit absolute origin wins outright and is treated as an optimistic dev server', () => {
        const candidates = previewOriginCandidates({ explicitOrigin: 'http://localhost:9000', isDev: false });
        expect(candidates).toEqual([{ origin: 'http://localhost:9000', mode: 'dev', optimistic: true }]);
    });

    it('without an explicit origin in dev: installed image first, then the Expo dev server', () => {
        const candidates = previewOriginCandidates({ explicitOrigin: null, isDev: true });
        expect(candidates).toEqual([
            { origin: DEFAULT_MOBILE_PREVIEW_ORIGIN, mode: 'installed', optimistic: false },
            { origin: DEV_EXPO_PREVIEW_ORIGIN, mode: 'dev', optimistic: true },
        ]);
    });

    it('without an explicit origin in production: only the installed image (no dev fallback)', () => {
        const candidates = previewOriginCandidates({ explicitOrigin: '   ', isDev: false });
        expect(candidates).toEqual([{ origin: DEFAULT_MOBILE_PREVIEW_ORIGIN, mode: 'installed', optimistic: false }]);
    });
});

describe('buildMobilePreviewUrl', () => {
    it('emits the embed contract for a same-origin path', () => {
        const url = buildMobilePreviewUrl({
            origin: '/mobile-preview',
            code: 'CODE123',
            keyword: 'home',
            language: 'de-CH',
            device: 'phone',
            orientation: 'portrait',
            draft: true,
        });
        expect(url.startsWith('/mobile-preview/?')).toBe(true);
        expect(queryOf(url)).toMatchObject({
            embed: '1',
            preview: 'true',
            device: 'phone',
            orientation: 'portrait',
            frame: '1',
            hideDebugPanel: 'true',
            banner: '0',
            keyword: 'home',
            language: 'de-CH',
            previewSession: 'CODE123',
        });
    });

    it('reflects draft=false as preview=false and frame=false as frame=0', () => {
        const q = queryOf(
            buildMobilePreviewUrl({
                origin: '/mobile-preview',
                device: 'tablet',
                orientation: 'landscape',
                draft: false,
                frame: false,
            }),
        );
        expect(q.preview).toBe('false');
        expect(q.frame).toBe('0');
        expect(q.device).toBe('tablet');
        expect(q.orientation).toBe('landscape');
    });

    it('omits optional params when absent', () => {
        const q = queryOf(buildMobilePreviewUrl({ origin: '/mobile-preview' }));
        expect(q.keyword).toBeUndefined();
        expect(q.language).toBeUndefined();
        expect(q.previewSession).toBeUndefined();
        expect(q.backendUrl).toBeUndefined();
    });

    it('supports an absolute live-reload dev origin and a dev backendUrl override', () => {
        const url = buildMobilePreviewUrl({
            origin: 'http://localhost:8081/',
            code: 'C',
            keyword: 'page',
            backendUrl: 'http://localhost/symfony',
        });
        expect(url.startsWith('http://localhost:8081/?')).toBe(true);
        expect(queryOf(url).backendUrl).toBe('http://localhost/symfony');
    });
});
