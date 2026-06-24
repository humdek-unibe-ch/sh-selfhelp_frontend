/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
/**
 * Pure helpers for the full-screen CMS **Live Preview** surface.
 *
 * Kept free of React / Next imports so the device-frame math and the web-pane
 * URL building are unit-testable in isolation (mirrors the
 * `mobile-preview/mobilePreviewUrl.ts` pure-builder split). The mobile-pane
 * iframe URL itself is built by the shared `buildMobilePreviewUrl` from
 * `../pages/mobile-preview/mobilePreviewUrl`.
 *
 * @module components/cms/live-preview/livePreviewLayout
 */

import {
    PREVIEW_PARENT_ORIGIN_PARAM,
    PREVIEW_SHELL_PARAM,
    type IPreviewPreferences,
    type TPreviewColorScheme,
} from '@selfhelp/shared';
import type {
    TPreviewDevice,
    TPreviewOrientation,
} from '../pages/mobile-preview/mobilePreviewUrl';

/** Native logical frame sizes per device, portrait (swapped for landscape). */
export const LIVE_PREVIEW_FRAME_SIZES: Record<TPreviewDevice, { width: number; height: number }> = {
    phone: { width: 390, height: 844 },
    tablet: { width: 834, height: 1112 },
};

/**
 * Live-preview preference messages are deliberately theme-only.
 *
 * Language is bound to the mobile iframe URL and applied by remounting with a
 * freshly minted language-scoped session. Keeping `locale` null here prevents a
 * future caller from reintroducing the token-rotation/query-invalidation loop
 * caused by applying language over the live postMessage bridge.
 */
export function livePreviewThemePreferences(
    colorScheme: TPreviewColorScheme,
): IPreviewPreferences {
    return { colorScheme, locale: null };
}

/** Native (un-scaled) frame size for a device + orientation. */
export function nativeFrameSize(
    device: TPreviewDevice,
    orientation: TPreviewOrientation,
): { width: number; height: number } {
    const base = LIVE_PREVIEW_FRAME_SIZES[device];
    return orientation === 'landscape'
        ? { width: base.height, height: base.width }
        : { width: base.width, height: base.height };
}

export interface ILivePreviewFrameLayout {
    /** Native frame width (px) passed to the iframe element. */
    width: number;
    /** Native frame height (px) passed to the iframe element. */
    height: number;
    /** Scale factor applied via CSS transform to fit the available area. */
    scale: number;
    /** On-screen width after scaling — this is what drives the column size. */
    displayWidth: number;
    /** On-screen height after scaling. */
    displayHeight: number;
}

/**
 * Whether the expensive preview iframes should stay mounted.
 *
 * Tied to real tab visibility ONLY: a hidden tab unloads the frames so a
 * backgrounded preview never starves the dev servers, but a merely unfocused
 * window does NOT (opening DevTools, alt-tabbing to the IDE, or clicking another
 * window must not tear the preview down — that was the old "DevTools pauses the
 * preview" bug). Manual control stays available via the Stop button.
 */
export function isPreviewPageActive(options: {
    visibilityState: DocumentVisibilityState;
}): boolean {
    return options.visibilityState === 'visible';
}

/**
 * Compute the scaled on-screen layout of the mobile device frame so it fits the
 * available area while the device's native aspect ratio is preserved. The
 * resulting `displayWidth` is what makes the mobile column grow/shrink as the
 * device / orientation changes (the web pane takes the remaining space).
 *
 * `available*` are the body area dimensions (from a ResizeObserver). When they
 * are 0 (first paint before measure) we fall back to the native size so the
 * frame is never collapsed to nothing.
 */
export function computeFrameLayout(opts: {
    device: TPreviewDevice;
    orientation: TPreviewOrientation;
    availableWidth: number;
    availableHeight: number;
    /** Hard cap on the column width so a landscape tablet never eats the whole screen. */
    maxWidthRatio?: number;
}): ILivePreviewFrameLayout {
    const { width, height } = nativeFrameSize(opts.device, opts.orientation);
    const maxRatio = opts.maxWidthRatio ?? 0.75;

    const usableWidth = opts.availableWidth > 0 ? opts.availableWidth * maxRatio : width;
    const usableHeight = opts.availableHeight > 0 ? opts.availableHeight : height;

    const scale = Math.min(1, usableWidth / width, usableHeight / height);
    const safeScale = Number.isFinite(scale) && scale > 0 ? scale : 1;

    return {
        width,
        height,
        scale: safeScale,
        displayWidth: Math.round(width * safeScale),
        displayHeight: Math.round(height * safeScale),
    };
}

export interface IBuildWebPreviewUrlOptions {
    /**
     * Append `previewShell=1` so the embedded page activates its
     * `PreviewShellBridge` (reports navigations to the Live Preview shell and
     * accepts "navigate to keyword" commands). Omit for a plain "open in new
     * tab" link.
     */
    previewShell?: boolean;
    /**
     * The shell's `window.location.origin`, forwarded so the bridge targets its
     * `postMessage` precisely. The web pane is same-origin, but this keeps the
     * web + mobile bridges symmetric.
     */
    parentOrigin?: string | null;
}

/**
 * Build the same-origin web-frontend URL for the desktop comparison pane. The
 * public renderer resolves a page by its keyword, so this is just `/<keyword>`
 * (empty keyword → home `/`). Language + published/draft are owned by the web
 * app's own session state (`LanguageContext` / `PreviewModeContext`), so they
 * are intentionally NOT encoded here. When `previewShell` is set, the bridge
 * activation params (shared with the mobile builder) are appended.
 */
export function buildWebPreviewUrl(
    keyword: string | null | undefined,
    options?: IBuildWebPreviewUrlOptions,
): string {
    const kw = (keyword ?? '').trim().replace(/^\/+/, '');
    const path = kw === '' ? '/' : `/${kw.split('/').map((seg) => encodeURIComponent(seg)).join('/')}`;

    // `parentOrigin` is only meaningful while the bridge is active, so both
    // params are gated on `previewShell` — a plain "open in new tab" link
    // (no `previewShell`) never carries bridge query params.
    if (!options?.previewShell) return path;

    const params = new URLSearchParams();
    params.set(PREVIEW_SHELL_PARAM, '1');
    const parentOrigin = options.parentOrigin?.trim();
    if (parentOrigin) params.set(PREVIEW_PARENT_ORIGIN_PARAM, parentOrigin);

    return `${path}?${params.toString()}`;
}
