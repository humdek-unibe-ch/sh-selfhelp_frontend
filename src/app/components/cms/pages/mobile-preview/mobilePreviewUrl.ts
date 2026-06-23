/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
/**
 * Pure builder for the `selfhelp-mobile-preview` iframe `src`.
 *
 * The CMS page-editor preview panel embeds the mobile-preview web image (or, in
 * live-reload dev, a running Expo `expo start --web` server) in an iframe and
 * passes the preview intent through the URL query string. The param names +
 * values MUST stay byte-identical to the mobile parser in
 * `sh-selfhelp_mobile/config/webPreviewContract.ts` (`parseWebPreviewParams`):
 *
 *   <origin>/?embed=1&keyword=<kw>&device=phone|tablet
 *     &orientation=portrait|landscape&frame=0|1&preview=true|false
 *     &previewSession=<one-time-code>&hideDebugPanel=true&banner=0
 *     &language=<locale>&backendUrl=<dev-only>
 *
 * Kept free of React / Next imports so it is unit-testable under vitest in
 * isolation (mirrors the mobile contract's own pure-parser split).
 */

export type TPreviewDevice = 'phone' | 'tablet';
export type TPreviewOrientation = 'portrait' | 'landscape';

/**
 * Same-origin path the SelfHelp Manager routes to the installed
 * `selfhelp-mobile-preview` image. Probed (`<path>/version.json` → 200) to
 * detect a provisioned preview during auto-resolution.
 */
export const DEFAULT_MOBILE_PREVIEW_ORIGIN = '/mobile-preview';

/**
 * Expo `expo start --web` dev-server origin used as the live-reload fallback in
 * local development when no preview image is installed. Matches the mobile
 * repo's default web port.
 */
export const DEV_EXPO_PREVIEW_ORIGIN = 'http://localhost:8081';

export interface IBuildMobilePreviewUrlOptions {
    /**
     * Where the preview app is served. Either the same-origin path the manager
     * routes (`/mobile-preview`) or, for live-reload dev, an absolute Expo dev
     * origin (`http://localhost:8081`). Trailing slashes are normalised away.
     */
    origin: string;
    /** One-time preview-session code (exchanged in-app for a scoped JWT). */
    code?: string | null;
    /** CMS page keyword to route to on boot. */
    keyword?: string | null;
    /** Locale to render the preview in (e.g. `de-CH`). */
    language?: string | null;
    /** Simulated device class (drives the in-app layout + frame size). */
    device?: TPreviewDevice;
    /** Simulated orientation. */
    orientation?: TPreviewOrientation;
    /** Render the on-screen device frame (`frame=0` disables it). */
    frame?: boolean;
    /** Preview the unpublished draft (`preview=true`) vs published content. */
    draft?: boolean;
    /** Show the slim "preview" badge. Hidden by default inside the panel. */
    banner?: boolean;
    /** Suppress the floating debug FAB. Suppressed by default inside the panel. */
    hideDebugPanel?: boolean;
    /** Dev-only backend origin override (ignored by the production image). */
    backendUrl?: string | null;
}

/** Strip trailing slashes so we can always append `"/?<query>"` deterministically. */
export function normalizePreviewOrigin(origin: string): string {
    const trimmed = (origin ?? '').trim();
    const base = trimmed === '' ? DEFAULT_MOBILE_PREVIEW_ORIGIN : trimmed;
    return base.replace(/\/+$/, '');
}

/** True for an absolute (cross-origin) preview origin — i.e. a live-reload dev server. */
export function isAbsolutePreviewOrigin(origin: string): boolean {
    return /^https?:\/\//i.test(origin.trim());
}

/** How a resolved preview origin was chosen (drives the panel's badges/copy). */
export type TPreviewOriginMode = 'explicit' | 'installed' | 'dev';

/** One ordered candidate the panel probes during auto-resolution. */
export interface IPreviewOriginCandidate {
    /** Origin to probe + (if available) embed. */
    origin: string;
    /** Why this candidate exists (explicit env / installed image / dev server). */
    mode: TPreviewOriginMode;
    /**
     * When true, a probe that does not yield a 200 `version.json` (a 404, or a
     * CORS/connection failure) is still treated as AVAILABLE. This is the
     * cross-origin dev-server case (the Expo `--web` server does not serve
     * `version.json` and may block the cross-origin read): we cannot reliably
     * probe it, so we optimistically embed it and let the iframe surface a real
     * connection error. A same-origin installed image is NOT optimistic — its
     * `version.json` 404 deterministically means "not provisioned".
     */
    optimistic: boolean;
}

/**
 * Ordered preview-origin candidates for the panel's auto-resolution, per the
 * agreed precedence:
 *
 *   1. explicit `NEXT_PUBLIC_MOBILE_PREVIEW_ORIGIN` ALWAYS wins (no fallback) —
 *      same-origin paths must serve `version.json`; an absolute origin is
 *      treated as a (optimistic) dev server;
 *   2. else the installed image at `/mobile-preview` (probed: `version.json` 200);
 *   3. else, in development only, the Expo dev server at `http://localhost:8081`
 *      (optimistic — live-reload);
 *   4. else nothing → the panel renders the "unavailable" state.
 *
 * Pure (no `fetch`) so the precedence is unit-testable; the panel performs the
 * probes in order and picks the first available candidate.
 */
export function previewOriginCandidates(opts: {
    explicitOrigin?: string | null;
    isDev: boolean;
}): IPreviewOriginCandidate[] {
    const explicit = (opts.explicitOrigin ?? '').trim();
    if (explicit !== '') {
        const origin = normalizePreviewOrigin(explicit);
        // An explicit absolute origin is a dev server (optimistic); an explicit
        // same-origin path must serve version.json to count as available.
        const absolute = isAbsolutePreviewOrigin(origin);
        return [{ origin, mode: absolute ? 'dev' : 'explicit', optimistic: absolute }];
    }

    const candidates: IPreviewOriginCandidate[] = [
        { origin: DEFAULT_MOBILE_PREVIEW_ORIGIN, mode: 'installed', optimistic: false },
    ];
    if (opts.isDev) {
        candidates.push({ origin: DEV_EXPO_PREVIEW_ORIGIN, mode: 'dev', optimistic: true });
    }
    return candidates;
}

/**
 * Build the iframe `src` for the mobile preview from the current panel controls
 * + a freshly-minted one-time code. Always emits the embed flags the panel
 * relies on (`embed=1`, `hideDebugPanel=true`, `banner=0`); booleans the mobile
 * parser reads are emitted explicitly so the URL is deterministic for tests.
 */
export function buildMobilePreviewUrl(options: IBuildMobilePreviewUrlOptions): string {
    const base = normalizePreviewOrigin(options.origin);

    const params = new URLSearchParams();
    params.set('embed', '1');
    params.set('preview', options.draft ? 'true' : 'false');
    params.set('device', options.device ?? 'phone');
    params.set('orientation', options.orientation ?? 'portrait');
    params.set('frame', options.frame === false ? '0' : '1');
    params.set('hideDebugPanel', options.hideDebugPanel === false ? 'false' : 'true');
    params.set('banner', options.banner ? '1' : '0');

    const keyword = options.keyword?.trim();
    if (keyword) params.set('keyword', keyword);

    const language = options.language?.trim();
    if (language) params.set('language', language);

    const code = options.code?.trim();
    if (code) params.set('previewSession', code);

    const backendUrl = options.backendUrl?.trim();
    if (backendUrl) params.set('backendUrl', backendUrl);

    return `${base}/?${params.toString()}`;
}
