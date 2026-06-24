/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { describe, it, expect } from 'vitest';
import {
    buildWebPreviewUrl,
    computeFrameLayout,
    isPreviewPageActive,
    LIVE_PREVIEW_FRAME_SIZES,
    livePreviewThemePreferences,
    nativeFrameSize,
} from '../livePreviewLayout';

describe('livePreviewThemePreferences', () => {
    it('keeps live bridge messages theme-only so language cannot restart mobile queries', () => {
        expect(livePreviewThemePreferences('dark')).toEqual({
            colorScheme: 'dark',
            locale: null,
        });
    });
});

describe('nativeFrameSize', () => {
    it('returns the portrait size as-is', () => {
        expect(nativeFrameSize('phone', 'portrait')).toEqual(LIVE_PREVIEW_FRAME_SIZES.phone);
        expect(nativeFrameSize('tablet', 'portrait')).toEqual(LIVE_PREVIEW_FRAME_SIZES.tablet);
    });

    it('swaps width/height in landscape', () => {
        expect(nativeFrameSize('phone', 'landscape')).toEqual({ width: 844, height: 390 });
        expect(nativeFrameSize('tablet', 'landscape')).toEqual({ width: 1112, height: 834 });
    });
});

describe('computeFrameLayout', () => {
    it('falls back to native size before the body is measured', () => {
        const layout = computeFrameLayout({
            device: 'phone',
            orientation: 'portrait',
            availableWidth: 0,
            availableHeight: 0,
        });
        expect(layout.scale).toBe(1);
        expect(layout.displayWidth).toBe(390);
        expect(layout.displayHeight).toBe(844);
    });

    it('scales down to fit the available height (portrait phone)', () => {
        const layout = computeFrameLayout({
            device: 'phone',
            orientation: 'portrait',
            availableWidth: 2000,
            availableHeight: 422, // half the native 844
        });
        expect(layout.scale).toBeCloseTo(0.5, 5);
        expect(layout.displayWidth).toBe(195);
        expect(layout.displayHeight).toBe(422);
    });

    it('grows the column for a landscape tablet vs a portrait phone', () => {
        const tablet = computeFrameLayout({
            device: 'tablet',
            orientation: 'landscape',
            availableWidth: 4000,
            availableHeight: 4000,
        });
        const phone = computeFrameLayout({
            device: 'phone',
            orientation: 'portrait',
            availableWidth: 4000,
            availableHeight: 4000,
        });
        // With ample room both render at native scale; the landscape tablet is
        // far wider, so its on-screen column is wider — this is what makes the
        // right column "increase or decrease size" when the device changes.
        expect(tablet.displayWidth).toBeGreaterThan(phone.displayWidth);
    });

    it('caps the column width by the maxWidthRatio of the available width', () => {
        const layout = computeFrameLayout({
            device: 'tablet',
            orientation: 'landscape', // native 1112 wide
            availableWidth: 1000,
            availableHeight: 100000,
            maxWidthRatio: 0.5,
        });
        // Width budget is 1000 * 0.5 = 500 → scale 500/1112.
        expect(layout.displayWidth).toBeLessThanOrEqual(500);
        expect(layout.scale).toBeCloseTo(500 / 1112, 5);
    });
});

describe('isPreviewPageActive', () => {
    it('unloads a hidden tab', () => {
        expect(isPreviewPageActive({ visibilityState: 'hidden' })).toBe(false);
    });

    it('keeps a visible tab mounted regardless of window focus (DevTools must not pause it)', () => {
        expect(isPreviewPageActive({ visibilityState: 'visible' })).toBe(true);
    });
});

describe('buildWebPreviewUrl', () => {
    it('maps a keyword to a same-origin path', () => {
        expect(buildWebPreviewUrl('team')).toBe('/team');
        expect(buildWebPreviewUrl('/team')).toBe('/team');
    });

    it('falls back to home for an empty keyword', () => {
        expect(buildWebPreviewUrl('')).toBe('/');
        expect(buildWebPreviewUrl(null)).toBe('/');
        expect(buildWebPreviewUrl(undefined)).toBe('/');
    });

    it('encodes unsafe segments but keeps the path separators', () => {
        expect(buildWebPreviewUrl('a b/c')).toBe('/a%20b/c');
    });

    it('appends the bridge params when previewShell is set (so the iframe syncs)', () => {
        expect(buildWebPreviewUrl('team', { previewShell: true, parentOrigin: 'https://cms.example' })).toBe(
            '/team?previewShell=1&parentOrigin=https%3A%2F%2Fcms.example',
        );
        // home + previewShell, no parentOrigin
        expect(buildWebPreviewUrl(null, { previewShell: true })).toBe('/?previewShell=1');
    });

    it('omits bridge params for a plain (open-in-new-tab) link', () => {
        expect(buildWebPreviewUrl('team', { parentOrigin: 'https://cms.example' })).toBe('/team');
        expect(buildWebPreviewUrl('team', {})).toBe('/team');
    });
});
