/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
'use client';

/**
 * LivePreview — the full-screen CMS **Live Preview** surface.
 *
 * Opened in a NEW TAB from the page-sections toolbar ("Live preview"), this is
 * the "test the real flow" experience: browse the whole site, side-by-side with
 * the mobile app, and watch a navigation in EITHER pane move the other.
 *
 *   - the WEB pane is rendered **inline** (NOT an iframe) by the real public
 *     renderer (`LivePreviewWebPane` → `DynamicPageClient`) plus the real
 *     website chrome (header menu + in-app theme/language/profile controls +
 *     footer). It reuses the admin shell's providers + React Query cache, so it
 *     is cheap in dev (no second app instance) and always available;
 *   - the MOBILE pane is the real `selfhelp-mobile-preview` web image in a
 *     device frame (phone / tablet × portrait / landscape); changing the
 *     device/orientation RESIZES the column via CSS only (no reload);
 *   - FREE NAVIGATION: the mobile one-time code is minted WITHOUT a keyword
 *     scope, so the token may render any page (still GET-only, still the
 *     read-only render allowlist);
 *   - SYNCHRONIZED NAVIGATION: the shell owns the canonical page. In-pane web
 *     links/buttons are intercepted via `PreviewNavigationContext` (no admin
 *     navigation); the mobile frame runs the `@selfhelp/shared` postMessage
 *     bridge and reports its navigations. Either source updates the canonical
 *     keyword → the web pane re-renders + the mobile frame gets a SOFT navigate
 *     command (no reload), with a per-frame "expected keyword" loop guard;
 *   - the canonical keyword is mirrored into the shell's own address bar
 *     (`/admin/preview/<keyword>`, history API only) so the URL is shareable and
 *     a manual reload restarts at the page you navigated to — in BOTH directions
 *     (a mobile navigation updates the URL too);
 *   - the Draft toggle drives the shared `PreviewModeContext` (which the inline
 *     web reads) AND re-mints the mobile pane. Language is changed IN-APP from
 *     each pane's own controls (web header selector / mobile profile), not the
 *     toolbar.
 *
 * This component is the ORCHESTRATION shell: it owns the canonical preview state
 * (current page, draft, device/orientation, reload keys) and composes the
 * presentational `LivePreviewToolbar` + `LivePreviewStage` with the behaviour
 * hooks (`useMobilePreviewAvailability`, `usePageVisibilityUnmount`,
 * `useMobilePreviewSession`, `usePreviewPreferenceSync`,
 * `usePreviewNavigationSync`, `usePreviewUrlMirror`). The mobile-iframe lifecycle
 * (unload while the TAB IS HIDDEN, fresh-code remount on resume/reload) lives in
 * those hooks.
 *
 * Gated by the `admin.mobile_preview.view` permission (server-checked in the
 * route, client-checked for the editor entry point). The admin JWT never
 * reaches the mobile iframe — only the opaque one-time code does.
 *
 * @module components/cms/live-preview/LivePreview
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { Box, useMantineColorScheme } from '@mantine/core';
import { useElementSize } from '@mantine/hooks';
import { REACT_QUERY_CONFIG } from '../../../../config/react-query.config';
import { API_CONFIG } from '../../../../config/api.config';
import { useAppNavigation } from '../../../../hooks/useAppNavigation';
import { usePublicLanguages } from '../../../../hooks/useLanguages';
import { useLanguageContext } from '../../contexts/LanguageContext';
import { usePreviewMode } from '../../contexts/PreviewModeContext';
import {
    buildMobilePreviewUrl,
    isAbsolutePreviewOrigin,
    type TPreviewModalMode,
} from '../pages/mobile-preview/mobilePreviewUrl';
import { computeFrameLayout, LIVE_PREVIEW_STAGE_PADDING } from './livePreviewLayout';
import { useLivePreviewToolbarStore } from '../../../store/livePreview.store';
import { LivePreviewToolbar } from './LivePreviewToolbar';
import { LivePreviewStage } from './LivePreviewStage';
import { useMobilePreviewAvailability } from './hooks/useMobilePreviewAvailability';
import { usePageVisibilityUnmount } from './hooks/usePageVisibilityUnmount';
import { useMobilePreviewSession } from './hooks/useMobilePreviewSession';
import { usePreviewPreferenceSync } from './hooks/usePreviewPreferenceSync';
import { usePreviewNavigationSync } from './hooks/usePreviewNavigationSync';
import { usePreviewUrlMirror } from './hooks/usePreviewUrlMirror';

/**
 * localStorage flag: the live preview defaults to DRAFT only the FIRST time it
 * is ever opened in a browser. After that the user's saved choice (the
 * `sh_preview` cookie) wins, so a deliberate "published" preview is no longer
 * reset to draft on every reload.
 */
const LIVE_PREVIEW_DRAFT_DEFAULTED_KEY = 'sh:live-preview:draft-defaulted';

export interface ILivePreviewProps {
    /** Keyword of the page the preview is launched on (initial route). */
    keyword: string;
    /**
     * Optional modal-presentation override forwarded to the mobile app. Omit for
     * the default (`auto` — off-menu pages open as a modal over home); pass `on`
     * / `off` to force. Surfaced via the route's `?modal=` query.
     */
    modal?: TPreviewModalMode;
}

export function LivePreview({ keyword, modal }: ILivePreviewProps) {
    const router = useRouter();
    const explicitOrigin = process.env.NEXT_PUBLIC_MOBILE_PREVIEW_ORIGIN ?? null;
    const isDev = process.env.NODE_ENV !== 'production';

    const { languages, isLoading: languagesLoading } = usePublicLanguages();

    // Draft / published is owned by the shared PreviewModeContext (the same one
    // the inline web pane + public site read). The toolbar switch toggles it and
    // the mobile mint binds it; `togglePreviewMode` also writes the `sh_preview`
    // cookie so a manual reload keeps the choice.
    const { isPreviewMode, togglePreviewMode } = usePreviewMode();
    const draft = isPreviewMode;

    // Shared theme + language for cross-pane sync. These are the SAME Mantine +
    // LanguageContext the inline web pane uses (its header ThemeToggle /
    // LanguageSelector drive them), so READING them mirrors the web pane and
    // WRITING them re-renders it; the shell relays both to the mobile iframe.
    const { colorScheme, setColorScheme } = useMantineColorScheme();
    const { currentLanguageId, languages: ctxLanguages } = useLanguageContext();
    const queryClient = useQueryClient();

    // The CMS knows every page's nav position, so it can decide on/off-menu
    // RELIABLY and tell the mobile app how to present the page (`modal=on|off`).
    const { routes: navRoutes, isLoading: navLoading } = useAppNavigation();
    const isOnMenu = useMemo(() => {
        const page = navRoutes.find((p) => p.keyword === keyword);
        if (!page) return false;
        return page.navPosition !== null && page.navPosition !== undefined && !page.is_headless;
    }, [navRoutes, keyword]);
    const effectiveModal: TPreviewModalMode = useMemo(() => {
        if (modal) return modal; // explicit route override (?modal=) wins
        if (navLoading || navRoutes.length === 0) return 'auto'; // let the app fall back
        return isOnMenu ? 'off' : 'on';
    }, [modal, navLoading, navRoutes.length, isOnMenu]);

    // Device / orientation / mobile-pane visibility persist across a reload of
    // the preview tab (see `livePreview.store`), so the chosen layout survives a
    // refresh instead of resetting to phone / portrait / shown.
    const device = useLivePreviewToolbarStore((s) => s.device);
    const setDevice = useLivePreviewToolbarStore((s) => s.setDevice);
    const orientation = useLivePreviewToolbarStore((s) => s.orientation);
    const setOrientation = useLivePreviewToolbarStore((s) => s.setOrientation);
    const showMobile = useLivePreviewToolbarStore((s) => s.showMobile);
    const setShowMobile = useLivePreviewToolbarStore((s) => s.setShowMobile);

    // Bumping the web reload key remounts the inline web pane (a hard refresh);
    // the mobile iframe's own remount lifecycle lives in `useMobilePreviewSession`.
    const [webReloadKey, setWebReloadKey] = useState(0);
    // The shell owns the canonical preview page. `currentKeyword` follows the
    // user's navigation in EITHER pane; `mobileLoadKeyword` is the keyword the
    // mobile frame last (re)loaded with — it only changes on a reload so soft
    // sync navigation never remounts the frame.
    const [currentKeyword, setCurrentKeyword] = useState<string | null>(keyword);
    const [mobileLoadKeyword, setMobileLoadKeyword] = useState<string | null>(keyword);

    const mobileIframeRef = useRef<HTMLIFrameElement>(null);
    const currentKeywordRef = useRef<string | null>(keyword);

    useEffect(() => {
        currentKeywordRef.current = currentKeyword;
    }, [currentKeyword]);

    // Default the preview to DRAFT the FIRST time it is ever opened (parity with
    // the old default), then RESPECT the user's saved choice. The `sh_preview`
    // cookie already persists draft across reloads, so forcing it on every open
    // would reset a deliberate "published" preview on refresh — the localStorage
    // flag makes the default a one-time thing.
    const draftDefaultedRef = useRef(false);
    useEffect(() => {
        if (draftDefaultedRef.current) return;
        draftDefaultedRef.current = true;
        if (typeof window === 'undefined') return;
        if (window.localStorage.getItem(LIVE_PREVIEW_DRAFT_DEFAULTED_KEY)) return;
        window.localStorage.setItem(LIVE_PREVIEW_DRAFT_DEFAULTED_KEY, '1');
        if (!isPreviewMode) togglePreviewMode();
    }, [isPreviewMode, togglePreviewMode]);

    const { ref: bodyRef, width: bodyWidth, height: bodyHeight } = useElementSize<HTMLDivElement>();

    // The mobile iframe is minted in — and bound to — the WEB pane's current
    // language. When the web header language selector changes it, the mint key
    // changes and the iframe cleanly REMOUNTS at the new language. Language is thus
    // driven one-way (web → mobile) by a remount, NOT a live postMessage sync: the
    // latter had to call the mobile's token-rotating, query-invalidating
    // `setLanguage`, which under the cross-frame echo looped into an invalidation
    // storm (the symptom: flooded console + an empty drawer/tab menu).
    const selectedLanguageId = currentLanguageId ?? languages[0]?.id ?? null;
    const locale = useMemo(
        () =>
            ctxLanguages.find((lang) => lang.id === selectedLanguageId)?.locale ??
            languages.find((lang) => lang.id === selectedLanguageId)?.locale ??
            null,
        [ctxLanguages, languages, selectedLanguageId],
    );

    // --- availability probe (React Query owns the state) -----------------------
    const { availability, previewOrigin, devOrigin, versionInfo, refetch } =
        useMobilePreviewAvailability({ explicitOrigin, isDev });

    // `pageActive` follows ONLY page visibility (the tab being hidden); a hidden
    // tab unmounts the mobile iframe so it stops starving the Expo dev server.
    const { pageActive } = usePageVisibilityUnmount();

    // The mobile iframe mounts (and the code is minted) only while the preview is
    // available and the page is active. The WEB pane is inline → always rendered.
    const previewActive = availability === 'available' && pageActive;

    // Origins for the mobile bridge: the shell's own origin (handed to the mobile
    // frame so it can post back), and the origin we trust mobile messages from.
    const parentOrigin = typeof window !== 'undefined' ? window.location.origin : null;
    const mobileMessageOrigin = useMemo(() => {
        if (typeof window === 'undefined') return null;
        if (!isAbsolutePreviewOrigin(previewOrigin)) return window.location.origin;
        try {
            return new URL(previewOrigin).origin;
        } catch {
            return window.location.origin;
        }
    }, [previewOrigin]);

    // --- mobile session: mint (keyword-less → free navigation) + remount --------
    const { code, mintError, mintPending, mobileMounted, reloadMobileFresh } =
        useMobilePreviewSession({
            previewActive,
            pageActive,
            languagesLoading,
            languagesCount: languages.length,
            selectedLanguageId,
            draft,
            previewOrigin,
            currentKeywordRef,
            setMobileLoadKeyword,
        });

    // --- cross-pane theme sync + synchronized navigation -----------------------
    const { sendPreferencesMobile, currentPrefsRef } = usePreviewPreferenceSync({
        previewActive,
        colorScheme,
        setColorScheme,
        mobileMessageOrigin,
        mobileIframeRef,
    });
    const { handleWebNavigate } = usePreviewNavigationSync({
        previewActive,
        mobileMessageOrigin,
        mobileIframeRef,
        currentKeywordRef,
        setCurrentKeyword,
        currentPrefsRef,
        sendPreferencesMobile,
    });

    // Mirror the canonical page into the shell's own address bar (history only).
    usePreviewUrlMirror(currentKeyword);

    // Device / orientation are NOT in the URL: the iframe is sized to the device
    // and the app renders responsively, so rotating/resizing never reloads it.
    const mobileUrl = useMemo(() => {
        if (!code) return null;
        return buildMobilePreviewUrl({
            origin: previewOrigin,
            code,
            keyword: mobileLoadKeyword,
            language: locale,
            frame: false,
            banner: false,
            hideDebugPanel: false,
            draft,
            modal: effectiveModal,
            backendUrl: devOrigin ? API_CONFIG.BACKEND_URL : undefined,
            // Activate the mobile bridge so it reports navigations + accepts soft
            // "navigate to keyword" commands from this shell.
            previewShell: true,
            parentOrigin,
        });
    }, [code, previewOrigin, mobileLoadKeyword, locale, draft, effectiveModal, devOrigin, parentOrigin]);

    // The "open in new tab" link uses the CURRENT page on the real public site.
    const webOpenUrl = useMemo(() => {
        const kw = currentKeyword?.trim() ? currentKeyword.trim().replace(/^\/+/, '') : '';
        return kw === '' ? '/' : `/${kw}`;
    }, [currentKeyword]);

    // Size the device frame to the stage's REAL inner slot so the bezel sits
    // inside the same 16px inset as the web pane (and never escapes its column):
    //   - `useElementSize` reports the body's padding-INCLUSIVE size, so subtract
    //     the stage padding on both axes (`bodyPadding`), and
    //   - subtract the bezel's own chrome (`frameChromeHeight`, the dark frame
    //     padding top + bottom) so the bezel + screen shrink to FIT rather than
    //     overflow — i.e. the device bottom (incl. the mobile tab bar) is never
    //     clipped and the top/bottom margins match the web pane.
    const bezelPadding = device === 'phone' ? 10 : 12;
    const frameChromeHeight = bezelPadding * 2;
    const bodyPadding = LIVE_PREVIEW_STAGE_PADDING * 2;
    const frame = useMemo(
        () =>
            computeFrameLayout({
                device,
                orientation,
                availableWidth: bodyWidth - bodyPadding,
                availableHeight: bodyHeight - bodyPadding - frameChromeHeight,
                // The inline web pane always shares the row, so cap the mobile
                // device frame to roughly half the body width.
                maxWidthRatio: 0.5,
            }),
        [device, orientation, bodyWidth, bodyHeight, bodyPadding, frameChromeHeight],
    );

    const handleReloadMobile = reloadMobileFresh;
    const handleRefresh = useCallback(() => {
        // The web pane renders cached page content, so a remount alone replays the
        // cache. Invalidate the page-content cache first (same key the editor's own
        // mutations use) so the remounted pane refetches, then clean-remount the
        // mobile frame at the current page with a fresh mint.
        void queryClient.invalidateQueries({
            queryKey: REACT_QUERY_CONFIG.QUERY_KEYS.PAGE_BY_KEYWORD_ALL,
        });
        setWebReloadKey((k) => k + 1);
        reloadMobileFresh();
    }, [queryClient, reloadMobileFresh]);
    const handleToggleMobile = useCallback(
        (checked: boolean) => {
            if (checked) reloadMobileFresh();
            setShowMobile(checked);
        },
        [reloadMobileFresh, setShowMobile],
    );

    // Back-to-editor targets the page you are CURRENTLY viewing — synced
    // navigation can move the preview off the launch keyword.
    const editorKeyword = (currentKeyword?.trim()?.replace(/^\/+/, '') || keyword) || 'home';
    const editorHref = `/admin/pages/${encodeURIComponent(editorKeyword)}`;
    // PRODUCTION: prefetch the editor route's RSC payload so the return is
    // instant. (`router.prefetch` is intentionally a no-op in dev.)
    useEffect(() => {
        router.prefetch(editorHref);
    }, [editorHref, router]);
    // DEVELOPMENT: Turbopack compiles a route on its FIRST request, so the cold
    // "back to editor" pays a one-time multi-second compile. Warm it ONCE in the
    // background while previewing (the editor is one catch-all module, so any
    // keyword warms it). Best-effort same-origin GET; errors ignored.
    const editorWarmedRef = useRef(false);
    useEffect(() => {
        if (process.env.NODE_ENV === 'production') return undefined;
        if (editorWarmedRef.current) return undefined;
        editorWarmedRef.current = true;
        const controller = new AbortController();
        void fetch(editorHref, { signal: controller.signal, credentials: 'same-origin' }).catch(
            () => {},
        );
        return () => controller.abort();
    }, [editorHref]);

    return (
        <Box style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
            <LivePreviewToolbar
                onBack={() => router.push(editorHref)}
                currentKeyword={currentKeyword}
                versionInfo={versionInfo}
                devOrigin={devOrigin}
                showMobile={showMobile}
                onToggleMobile={handleToggleMobile}
                draft={draft}
                onToggleDraft={() => togglePreviewMode()}
                onRefresh={handleRefresh}
                refreshing={mintPending}
                webOpenUrl={webOpenUrl}
                availability={availability}
                device={device}
                onDeviceChange={setDevice}
                orientation={orientation}
                onOrientationChange={setOrientation}
                onReloadMobile={handleReloadMobile}
            />
            <LivePreviewStage
                bodyRef={bodyRef}
                web={{ webReloadKey, keyword: currentKeyword, onNavigate: handleWebNavigate }}
                showMobile={showMobile}
                mobile={{
                    availability,
                    previewOrigin,
                    isDev,
                    onRetryAvailability: refetch,
                    frame,
                    bezelPadding,
                    device,
                    mobileUrl,
                    mobileMounted,
                    previewActive,
                    mobileIframeRef,
                    mintError,
                    onReloadMobile: handleReloadMobile,
                    mintPending,
                }}
            />
        </Box>
    );
}
