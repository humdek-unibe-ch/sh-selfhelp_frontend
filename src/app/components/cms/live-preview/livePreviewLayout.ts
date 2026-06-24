/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
/**
 * Pure helpers for the full-screen CMS **Live Preview** surface.
 *
 * Kept free of React / Next imports so the device-frame math is unit-testable in
 * isolation. The mobile-pane iframe URL itself is built by the shared
 * `buildMobilePreviewUrl` from `../pages/mobile-preview/mobilePreviewUrl`.
 *
 * @module components/cms/live-preview/livePreviewLayout
 */

import type { IPreviewPreferences, TPreviewColorScheme } from '@selfhelp/shared';
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
 * Padding (px) the Live Preview **stage** body insets its panes by. Shared
 * between the stage's CSS and the device-frame math: `useElementSize` reports the
 * body's padding-INCLUSIVE size, so the frame layout must subtract this on both
 * axes or the mobile bezel renders the full body height and escapes its column
 * (the web pane, being `flex: 1`, already respects the inset). Keeping it a single
 * constant stops the two from drifting.
 */
export const LIVE_PREVIEW_STAGE_PADDING = 16;

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
