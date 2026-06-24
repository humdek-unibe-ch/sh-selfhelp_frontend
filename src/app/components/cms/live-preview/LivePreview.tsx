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
 * MOBILE IFRAME LIFECYCLE (smooth in dev + prod). The mobile iframe is its own
 * HMR client in dev, so a backgrounded preview tab can starve the Expo dev
 * server. It is unloaded while the TAB IS HIDDEN; merely losing window focus
 * (DevTools, the IDE, another window) keeps it live. Returning remounts it with
 * a fresh code. Reload-resilience for the one-time code lives in the mobile
 * image (sessionStorage keyed by the code).
 *
 * Gated by the `admin.mobile_preview.view` permission (server-checked in the
 * route, client-checked for the editor entry point). The admin JWT never
 * reaches the mobile iframe — only the opaque one-time code does.
 *
 * @module components/cms/live-preview/LivePreview
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
    ActionIcon,
    Alert,
    Badge,
    Box,
    Button,
    Divider,
    Group,
    Loader,
    Paper,
    SegmentedControl,
    Stack,
    Switch,
    Text,
    Tooltip,
    useMantineColorScheme,
} from '@mantine/core';
import { useElementSize } from '@mantine/hooks';
import {
    IconAlertTriangle,
    IconArrowLeft,
    IconDeviceMobile,
    IconExternalLink,
    IconRefresh,
} from '@tabler/icons-react';
import {
    PREVIEW_BRIDGE_MESSAGE,
    arePreviewPreferencesEqual,
    isPreviewBridgeMessage,
    type IPreviewPreferences,
    type TPreviewBridgeMessage,
} from '@selfhelp/shared';
import { AdminMobilePreviewApi } from '../../../../api/admin/mobile-preview.api';
import { API_CONFIG } from '../../../../config/api.config';
import { useAppNavigation } from '../../../../hooks/useAppNavigation';
import { usePublicLanguages } from '../../../../hooks/useLanguages';
import { useLanguageContext } from '../../contexts/LanguageContext';
import { usePreviewMode } from '../../contexts/PreviewModeContext';
import {
    buildMobilePreviewUrl,
    DEFAULT_MOBILE_PREVIEW_ORIGIN,
    isAbsolutePreviewOrigin,
    previewOriginCandidates,
    type TPreviewDevice,
    type TPreviewModalMode,
    type TPreviewOrientation,
} from '../pages/mobile-preview/mobilePreviewUrl';
import { computeFrameLayout, isPreviewPageActive } from './livePreviewLayout';
import { LivePreviewWebPane } from './LivePreviewWebPane';

interface IMobilePreviewVersionInfo {
    version?: string | null;
    mobileRendererVersion?: string | null;
}

interface ILivePreviewAvailability {
    available: boolean;
    origin: string;
    dev: boolean;
    info: IMobilePreviewVersionInfo | null;
}

/**
 * Probe a candidate origin's `<origin>/version.json`. An `optimistic` candidate
 * (a cross-origin dev server that may not serve it) is treated as available
 * even on a non-200; a same-origin installed image requires the 200. Mirrors
 * the inspector panel's probe.
 */
async function probeCandidate(
    origin: string,
    optimistic: boolean,
): Promise<{ available: boolean; info: IMobilePreviewVersionInfo | null }> {
    try {
        const res = await fetch(`${origin}/version.json`, { cache: 'no-store' });
        if (res.ok) {
            try {
                return { available: true, info: (await res.json()) as IMobilePreviewVersionInfo };
            } catch {
                return { available: true, info: null };
            }
        }
        return { available: optimistic, info: null };
    } catch {
        return { available: optimistic, info: null };
    }
}

function toErrorMessage(error: unknown): string {
    if (error instanceof Error && error.message) return error.message;
    return 'Failed to start the live preview. Please retry.';
}

/** Normalise an (origin-stripped) preview path to a CMS keyword (`null` → home). */
function keywordFromPreviewPath(path: string): string | null {
    const cleaned = path.split('#')[0].split('?')[0].replace(/^\/+/, '').replace(/\/+$/, '');
    return cleaned === '' ? null : cleaned;
}

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
    const candidates = useMemo(
        () => previewOriginCandidates({ explicitOrigin, isDev }),
        [explicitOrigin, isDev],
    );

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
    const { currentLanguageId, setCurrentLanguageId, languages: ctxLanguages } = useLanguageContext();
    const currentLocale = ctxLanguages.find((l) => l.id === currentLanguageId)?.locale ?? null;

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

    const [device, setDevice] = useState<TPreviewDevice>('phone');
    const [orientation, setOrientation] = useState<TPreviewOrientation>('portrait');
    const [showMobile, setShowMobile] = useState(true);
    // `languageId` is the MOBILE pane's mint language; the user switches each
    // pane's language in-app afterwards (web header selector / mobile profile).
    const [languageId] = useState<number | null>(null);
    // Bumping a reload key is the ONLY thing that remounts a frame. The inline
    // web pane remounts on `webReloadKey`; the mobile iframe on `mobileReloadKey`.
    const [webReloadKey, setWebReloadKey] = useState(0);
    const [mobileReloadKey, setMobileReloadKey] = useState(0);
    // The shell owns the canonical preview page. `currentKeyword` follows the
    // user's navigation in EITHER pane; `mobileLoadKeyword` is the keyword the
    // mobile frame last (re)loaded with — it only changes on a reload so soft
    // sync navigation never remounts the frame.
    const [currentKeyword, setCurrentKeyword] = useState<string | null>(keyword);
    const [mobileLoadKeyword, setMobileLoadKeyword] = useState<string | null>(keyword);
    // `pageActive` follows ONLY page visibility (the tab being hidden). The
    // mobile iframe mounts while active, so a hidden tab releases its HMR client
    // instead of starving the Expo dev server.
    const [pageActive, setPageActive] = useState(true);
    // Remount latch for the mobile frame: a reload UNMOUNTS it and the remount
    // effect brings it back only once a FRESH code is minted — remounting onto the
    // old (already-consumed) code, or an in-place `src` swap, can wedge the
    // cross-origin Expo dev frame on a perpetual loading state.
    const [mobileMounted, setMobileMounted] = useState(true);
    const [mobileReloadPending, setMobileReloadPending] = useState(false);

    const mobileIframeRef = useRef<HTMLIFrameElement>(null);
    const currentKeywordRef = useRef<string | null>(keyword);
    const pageActiveRef = useRef(true);
    // Latest minted code (ref so the reload helpers read it without re-creating
    // callbacks every mint) + the code we are replacing on the current reload.
    const codeRef = useRef<string | null>(null);
    const reloadFromCodeRef = useRef<string | null>(null);
    // Loop guard: when the shell pushes a NAVIGATE to the mobile frame it records
    // the keyword here; that frame's echoed NAVIGATED is then swallowed instead
    // of bounced back (no ping-pong).
    const expectedRef = useRef<{ mobile: string | null | undefined }>({ mobile: undefined });
    // Loop guard for prefs sync (the theme/language analogue of expectedRef): the
    // last prefs the shell pushed to OR received from the mobile frame. Plus a
    // live snapshot of the web pane's prefs so the mobile READY handler can push
    // them without the listener depending on (and re-subscribing to) them.
    const lastSyncedPrefsRef = useRef<IPreviewPreferences | null>(null);
    const currentPrefsRef = useRef<IPreviewPreferences>({ colorScheme: 'auto', locale: null });

    useEffect(() => {
        currentKeywordRef.current = currentKeyword;
    }, [currentKeyword]);

    useEffect(() => {
        currentPrefsRef.current = { colorScheme, locale: currentLocale };
    }, [colorScheme, currentLocale]);

    // Default the preview to DRAFT on open (parity with the old default), without
    // permanently forcing it — once on, the user can switch it off.
    const draftDefaultedRef = useRef(false);
    useEffect(() => {
        if (draftDefaultedRef.current) return;
        draftDefaultedRef.current = true;
        if (!isPreviewMode) togglePreviewMode();
    }, [isPreviewMode, togglePreviewMode]);

    const { ref: bodyRef, width: bodyWidth, height: bodyHeight } = useElementSize();

    const selectedLanguageId = languageId ?? languages[0]?.id ?? null;

    // Unload the mobile iframe only while the TAB IS HIDDEN. A merely unfocused
    // window (DevTools, the IDE) keeps it mounted, so DevTools no longer tears
    // the preview down. On return, remount the mobile frame at the canonical page
    // with a fresh code.
    useEffect(() => {
        const applyPageActive = (active: boolean) => {
            if (pageActiveRef.current === active) return;
            pageActiveRef.current = active;
            setPageActive(active);
            if (active) {
                // Remount the mobile frame fresh on return — same safe path as a
                // manual reload (unmount, re-mint, remount only once code is ready).
                reloadFromCodeRef.current = codeRef.current;
                setMobileLoadKeyword(currentKeywordRef.current);
                setMobileMounted(false);
                setMobileReloadPending(true);
                setMobileReloadKey((k) => k + 1);
            }
        };

        const onVisibility = () => {
            applyPageActive(isPreviewPageActive({ visibilityState: document.visibilityState }));
        };

        onVisibility();
        document.addEventListener('visibilitychange', onVisibility);
        return () => {
            document.removeEventListener('visibilitychange', onVisibility);
        };
    }, []);

    // Mirror the synced page into the shell's own address bar
    // (`/admin/preview/<keyword>`), WITHOUT a Next navigation (history API only,
    // so the LivePreview component never remounts). Makes a manual reload restart
    // at the page you navigated to, and the URL shareable — in BOTH directions
    // (web in-pane nav AND mobile-reported nav both update `currentKeyword`).
    useEffect(() => {
        if (typeof window === 'undefined') return;
        const kw = currentKeyword?.trim() ? currentKeyword.trim().replace(/^\/+/, '') : '';
        const path = kw === ''
            ? '/admin/preview'
            : `/admin/preview/${kw.split('/').map((seg) => encodeURIComponent(seg)).join('/')}`;
        const next = `${path}${window.location.search}${window.location.hash}`;
        const current = `${window.location.pathname}${window.location.search}${window.location.hash}`;
        if (next !== current) {
            window.history.replaceState(window.history.state, '', next);
        }
    }, [currentKeyword]);

    const locale = useMemo(
        () => languages.find((lang) => lang.id === selectedLanguageId)?.locale ?? null,
        [languages, selectedLanguageId],
    );

    // --- availability probe (React Query owns the state) -----------------------
    const availabilityQuery = useQuery<ILivePreviewAvailability>({
        queryKey: ['live-preview-version', candidates.map((c) => `${c.mode}:${c.origin}`).join('|')],
        queryFn: async () => {
            for (const candidate of candidates) {
                if (candidate.optimistic) {
                    return {
                        available: true,
                        origin: candidate.origin,
                        dev: candidate.mode === 'dev',
                        info: null,
                    };
                }
                if (isDev && candidate.mode === 'installed') {
                    continue;
                }
                const result = await probeCandidate(candidate.origin, candidate.optimistic);
                if (result.available) {
                    return {
                        available: true,
                        origin: candidate.origin,
                        dev: candidate.mode === 'dev',
                        info: result.info,
                    };
                }
            }
            const fallback = candidates[0]?.origin ?? DEFAULT_MOBILE_PREVIEW_ORIGIN;
            return { available: false, origin: fallback, dev: false, info: null };
        },
        staleTime: 30_000,
        retry: false,
    });

    const availability: 'checking' | 'available' | 'unavailable' = availabilityQuery.isLoading
        ? 'checking'
        : availabilityQuery.data?.available
          ? 'available'
          : 'unavailable';
    const previewOrigin = availabilityQuery.data?.origin ?? candidates[0]?.origin ?? DEFAULT_MOBILE_PREVIEW_ORIGIN;
    const devOrigin = availabilityQuery.data?.dev ?? false;
    const versionInfo = availabilityQuery.data?.info ?? null;

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

    // --- mint (keyword-less → free navigation) ---------------------------------
    const mintMutation = useMutation({
        mutationFn: () =>
            AdminMobilePreviewApi.createSession({
                language_id: selectedLanguageId ?? undefined,
                draft,
            }),
        // Auto-recover from a transient failure (cold dev route-compile can exceed
        // the client timeout on the first mint; the backend may briefly 503
        // mid-restart). Minted codes are single-use + cheap; the error UI is the
        // fallback once these are exhausted.
        retry: 2,
        retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 4000),
    });
    const { mutate: mintCode } = mintMutation;
    const code = mintMutation.data?.code ?? null;
    const mintError = mintMutation.isError ? toErrorMessage(mintMutation.error) : null;

    useEffect(() => {
        codeRef.current = code;
    }, [code]);

    // Remount the mobile iframe ONLY once a FRESH code has been minted after a
    // reload/refresh/resume. Bringing it back on the old, already-consumed code —
    // or swapping the `src` in place — wedges the cross-origin Expo dev frame on a
    // perpetual loading spinner (the symptom: it only "unsticks" after the tab is
    // hidden + shown). Waiting for the new code means a single clean mount.
    useEffect(() => {
        if (!mobileReloadPending) return;
        if (!code || code === reloadFromCodeRef.current) return;
        setMobileReloadPending(false);
        setMobileMounted(true);
    }, [mobileReloadPending, code]);

    // Mint exactly ONCE per distinct intent (dedup against StrictMode double
    // invoke + independent availability/language transitions). Re-mints only when
    // something that affects the token changes: language, draft, or a reload.
    const lastMintKeyRef = useRef<string | null>(null);
    useEffect(() => {
        if (!previewActive) return undefined;
        if (languagesLoading) return undefined;
        if (languages.length > 0 && selectedLanguageId === null) return undefined;

        const key = `${previewOrigin}|${selectedLanguageId ?? ''}|${draft ? 1 : 0}|${mobileReloadKey}`;
        if (lastMintKeyRef.current === key) return undefined;
        lastMintKeyRef.current = key;
        mintCode();
        return undefined;
    }, [
        previewActive,
        languagesLoading,
        languages.length,
        selectedLanguageId,
        draft,
        mobileReloadKey,
        previewOrigin,
        mintCode,
    ]);

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

    const frame = useMemo(
        () =>
            computeFrameLayout({
                device,
                orientation,
                availableWidth: bodyWidth,
                availableHeight: bodyHeight - 32,
                // The inline web pane always shares the row, so cap the mobile
                // device frame to roughly half the body width.
                maxWidthRatio: 0.5,
            }),
        [device, orientation, bodyWidth, bodyHeight],
    );

    // Reload the mobile frame the SAFE way: unmount it, mint a FRESH code, and let
    // the remount effect bring it back only once that new code is ready (avoids the
    // perpetual-loading wedge of remounting onto a consumed code / in-place swap).
    const reloadMobileFresh = useCallback(() => {
        reloadFromCodeRef.current = codeRef.current;
        setMobileLoadKeyword(currentKeywordRef.current);
        setMobileMounted(false);
        setMobileReloadPending(true);
        setMobileReloadKey((k) => k + 1);
    }, []);
    const handleReloadMobile = reloadMobileFresh;
    const handleRefresh = useCallback(() => {
        // Remount the inline web pane (refetch the current page) + clean-remount
        // the mobile frame at the current page with a fresh mint.
        setWebReloadKey((k) => k + 1);
        reloadMobileFresh();
    }, [reloadMobileFresh]);
    const handleToggleMobile = useCallback(
        (checked: boolean) => {
            if (checked) reloadMobileFresh();
            setShowMobile(checked);
        },
        [reloadMobileFresh],
    );

    // Push a soft "navigate to keyword" to the mobile frame (no reload) and record
    // it as expected so its echoed NAVIGATED isn't bounced back (loop guard).
    const sendNavigateMobile = useCallback(
        (kw: string | null) => {
            const win = mobileIframeRef.current?.contentWindow;
            if (!win || !mobileMessageOrigin) return;
            expectedRef.current.mobile = kw;
            const message: TPreviewBridgeMessage = {
                type: PREVIEW_BRIDGE_MESSAGE.NAVIGATE,
                keyword: kw,
            };
            win.postMessage(message, mobileMessageOrigin);
        },
        [mobileMessageOrigin],
    );

    // Push the shared theme + language down to the mobile frame (no reload) and
    // record it as the last synced value so the frame's echoed PREFERENCES_CHANGED
    // isn't bounced back (loop guard, mirror of sendNavigateMobile).
    const sendPreferencesMobile = useCallback(
        (prefs: IPreviewPreferences) => {
            const win = mobileIframeRef.current?.contentWindow;
            if (!win || !mobileMessageOrigin) return;
            lastSyncedPrefsRef.current = prefs;
            const message: TPreviewBridgeMessage = {
                type: PREVIEW_BRIDGE_MESSAGE.SET_PREFERENCES,
                preferences: prefs,
            };
            win.postMessage(message, mobileMessageOrigin);
        },
        [mobileMessageOrigin],
    );

    // Web pane → mobile: when the web pane's theme/language changes (its header
    // ThemeToggle / LanguageSelector), relay it to the mobile frame. The guard
    // skips the echo of a value the mobile just reported up.
    useEffect(() => {
        if (!previewActive) return;
        const prefs: IPreviewPreferences = { colorScheme, locale: currentLocale };
        if (arePreviewPreferencesEqual(lastSyncedPrefsRef.current, prefs)) return;
        sendPreferencesMobile(prefs);
    }, [colorScheme, currentLocale, previewActive, sendPreferencesMobile]);

    // In-pane web navigation (intercepted links/buttons) → make it the canonical
    // page and drive the mobile frame to match.
    const handleWebNavigate = useCallback(
        (path: string) => {
            const kw = keywordFromPreviewPath(path);
            if (kw === currentKeywordRef.current) return;
            currentKeywordRef.current = kw;
            setCurrentKeyword(kw);
            sendNavigateMobile(kw);
        },
        [sendNavigateMobile],
    );

    // Synchronized navigation FROM mobile: when the mobile frame reports it
    // navigated, make it the canonical page (which re-renders the inline web pane
    // and mirrors the URL). The loop guard stops our own pushed command's echo
    // from bouncing.
    useEffect(() => {
        if (!previewActive) return undefined;
        const onMessage = (event: MessageEvent) => {
            if (event.origin !== mobileMessageOrigin) return;
            if (!isPreviewBridgeMessage(event.data)) return;
            const data = event.data;
            // The mobile frame announces READY after a (re)load → push the
            // canonical page AND the current theme/language so it syncs to
            // wherever the web pane already is (web pane wins the initial sync).
            if (data.type === PREVIEW_BRIDGE_MESSAGE.READY) {
                sendNavigateMobile(currentKeywordRef.current);
                sendPreferencesMobile(currentPrefsRef.current);
                return;
            }
            if (data.type !== PREVIEW_BRIDGE_MESSAGE.NAVIGATED) return;
            if (data.source !== 'mobile') return;

            // Echo of a command we pushed → consume + stop.
            if (expectedRef.current.mobile === data.keyword) {
                expectedRef.current.mobile = undefined;
                return;
            }
            // Already on this page (covers the initial boot echo) → no update.
            if (data.keyword === currentKeywordRef.current) return;

            currentKeywordRef.current = data.keyword;
            setCurrentKeyword(data.keyword);
        };
        window.addEventListener('message', onMessage);
        return () => {
            window.removeEventListener('message', onMessage);
        };
    }, [previewActive, mobileMessageOrigin, sendNavigateMobile, sendPreferencesMobile]);

    // Mobile → web pane: a theme/language change reported BY the mobile frame is
    // applied to the SAME Mantine + LanguageContext the web pane uses, so the web
    // pane follows. Separate listener so it can depend on the live prefs/setters
    // without re-subscribing the navigation listener. The guard skips the echo of
    // a value the shell just pushed down.
    useEffect(() => {
        if (!previewActive) return undefined;
        const onPrefsMessage = (event: MessageEvent) => {
            if (event.origin !== mobileMessageOrigin) return;
            if (!isPreviewBridgeMessage(event.data)) return;
            if (event.data.type !== PREVIEW_BRIDGE_MESSAGE.PREFERENCES_CHANGED) return;
            if (event.data.source !== 'mobile') return;
            const prefs = event.data.preferences;
            if (arePreviewPreferencesEqual(lastSyncedPrefsRef.current, prefs)) return;
            lastSyncedPrefsRef.current = prefs;
            if (prefs.colorScheme !== colorScheme) setColorScheme(prefs.colorScheme);
            if (prefs.locale) {
                const match = ctxLanguages.find((l) => l.locale === prefs.locale);
                if (match && match.id !== currentLanguageId) setCurrentLanguageId(match.id);
            }
        };
        window.addEventListener('message', onPrefsMessage);
        return () => window.removeEventListener('message', onPrefsMessage);
    }, [
        previewActive,
        mobileMessageOrigin,
        colorScheme,
        currentLanguageId,
        ctxLanguages,
        setColorScheme,
        setCurrentLanguageId,
    ]);

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
            {/* Top control bar: identity + shared controls only. The mobile device
                controls live on a floating pill OVER the mobile pane (below), so it
                is clear they belong to the phone. The web pane is inline below. */}
            <Stack
                gap={0}
                style={{
                    borderBottom: '1px solid var(--mantine-color-default-border)',
                    background: 'var(--mantine-color-body)',
                }}
            >
                <Group justify="space-between" align="center" px="md" py="xs" wrap="nowrap">
                    <Group gap="sm" align="center" wrap="nowrap">
                        <Tooltip label="Back to editor">
                            <ActionIcon
                                variant="subtle"
                                onClick={() => router.push(editorHref)}
                                aria-label="Back to page editor"
                            >
                                <IconArrowLeft size="1.1rem" />
                            </ActionIcon>
                        </Tooltip>
                        <IconDeviceMobile size="1.1rem" />
                        <Text fw={600} size="sm">
                            Live preview
                        </Text>
                        <Badge size="sm" variant="light" color="blue">
                            {currentKeyword || 'home'}
                        </Badge>
                        {versionInfo?.version && (
                            <Badge size="sm" variant="light" color="grape">
                                preview v{versionInfo.version}
                            </Badge>
                        )}
                        {devOrigin && (
                            <Badge size="sm" variant="light" color="teal">
                                live-reload dev
                            </Badge>
                        )}
                    </Group>

                    <Group gap="sm" align="center" wrap="nowrap" justify="flex-end">
                        <Switch
                            size="xs"
                            checked={showMobile}
                            onChange={(e) => handleToggleMobile(e.currentTarget.checked)}
                            label="Mobile"
                            aria-label="Show the mobile pane"
                        />
                        <Divider orientation="vertical" />
                        <Switch
                            size="xs"
                            checked={draft}
                            onChange={() => togglePreviewMode()}
                            label="Draft"
                            aria-label="Preview unpublished draft content (web and mobile)"
                        />
                        <Tooltip label="Refresh both previews">
                            <ActionIcon
                                size="md"
                                variant="light"
                                onClick={handleRefresh}
                                loading={mintMutation.isPending}
                                aria-label="Refresh all previews"
                            >
                                <IconRefresh size="1rem" />
                            </ActionIcon>
                        </Tooltip>
                        <Tooltip label="Open the current page in a new tab">
                            <ActionIcon
                                size="md"
                                variant="subtle"
                                component="a"
                                href={webOpenUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                aria-label="Open the current page in a new tab"
                            >
                                <IconExternalLink size="1rem" />
                            </ActionIcon>
                        </Tooltip>
                    </Group>
                </Group>
            </Stack>

            {/* Body — inline web pane (always) + optional mobile device frame. */}
            <Box
                ref={bodyRef}
                style={{
                    flex: 1,
                    display: 'flex',
                    gap: 16,
                    padding: 16,
                    overflow: 'hidden',
                    background: 'var(--mantine-color-default-hover)',
                }}
            >
                <Box style={{ flex: 1, minWidth: 0 }}>
                    <LivePreviewWebPane
                        key={`web-${webReloadKey}`}
                        keyword={currentKeyword}
                        onNavigate={handleWebNavigate}
                    />
                </Box>

                {showMobile && (
                    <Box
                        style={{
                            flex: '0 0 auto',
                            minWidth: 0,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: 10,
                        }}
                    >
                        {/* Floating controls that clearly belong to the phone:
                            device, orientation, and a mobile-only reload. */}
                        {availability === 'available' && (
                            <Paper
                                withBorder
                                shadow="sm"
                                radius="xl"
                                px="xs"
                                py={5}
                                style={{ background: 'var(--mantine-color-body)' }}
                            >
                                <Group gap="xs" align="center" wrap="nowrap">
                                    <SegmentedControl
                                        size="xs"
                                        value={device}
                                        onChange={(v) => setDevice(v as TPreviewDevice)}
                                        data={[
                                            { label: 'Phone', value: 'phone' },
                                            { label: 'Tablet', value: 'tablet' },
                                        ]}
                                        aria-label="Preview device"
                                    />
                                    <SegmentedControl
                                        size="xs"
                                        value={orientation}
                                        onChange={(v) => setOrientation(v as TPreviewOrientation)}
                                        data={[
                                            { label: 'Portrait', value: 'portrait' },
                                            { label: 'Landscape', value: 'landscape' },
                                        ]}
                                        aria-label="Preview orientation"
                                    />
                                    <Tooltip label="Reload the mobile preview only">
                                        <ActionIcon
                                            size="md"
                                            variant="subtle"
                                            radius="xl"
                                            onClick={handleReloadMobile}
                                            loading={mintMutation.isPending}
                                            aria-label="Reload mobile preview"
                                        >
                                            <IconRefresh size="1rem" />
                                        </ActionIcon>
                                    </Tooltip>
                                </Group>
                            </Paper>
                        )}

                        {availability === 'checking' ? (
                            <Group gap="xs" align="center" h="100%" px="md">
                                <Loader size="sm" />
                                <Text size="sm" c="dimmed">
                                    Checking mobile preview…
                                </Text>
                            </Group>
                        ) : availability === 'unavailable' ? (
                            <Box maw={340}>
                                <Alert
                                    icon={<IconAlertTriangle size="1rem" />}
                                    color="yellow"
                                    title="Mobile preview unavailable"
                                >
                                    <Stack gap="xs">
                                        <Text size="sm">
                                            No mobile preview is running at <code>{previewOrigin}</code>.
                                            Enable the <code>selfhelp-mobile-preview</code> service
                                            {isDev ? (
                                                <>
                                                    , or start the Expo dev server (
                                                    <code>npx expo start --web</code>)
                                                </>
                                            ) : null}
                                            .
                                        </Text>
                                        <Group>
                                            <ActionIcon
                                                variant="light"
                                                onClick={() => void availabilityQuery.refetch()}
                                                aria-label="Retry mobile preview"
                                            >
                                                <IconRefresh size="1rem" />
                                            </ActionIcon>
                                        </Group>
                                    </Stack>
                                </Alert>
                            </Box>
                        ) : (
                            <Box
                                style={{
                                    width: frame.displayWidth,
                                    height: frame.displayHeight,
                                    overflow: 'hidden',
                                    borderRadius: 24,
                                    border: '1px solid var(--mantine-color-default-border)',
                                    boxShadow: 'var(--mantine-shadow-md)',
                                    background: 'var(--mantine-color-body)',
                                }}
                            >
                                {mobileUrl && mobileMounted && previewActive ? (
                                    <iframe
                                        key={mobileUrl}
                                        ref={mobileIframeRef}
                                        title="Mobile live preview"
                                        src={mobileUrl}
                                        sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                                        style={{
                                            width: frame.width,
                                            height: frame.height,
                                            border: 0,
                                            transform: `scale(${frame.scale})`,
                                            transformOrigin: 'top left',
                                        }}
                                    />
                                ) : mintError ? (
                                    <Stack align="center" justify="center" h="100%" gap="xs" p="md">
                                        <IconAlertTriangle
                                            size="1.4rem"
                                            color="var(--mantine-color-red-6)"
                                        />
                                        <Text size="sm" fw={600} ta="center">
                                            Could not start the mobile preview
                                        </Text>
                                        <Text size="xs" c="dimmed" ta="center">
                                            {mintError}
                                        </Text>
                                        <Button
                                            size="xs"
                                            variant="light"
                                            leftSection={<IconRefresh size="0.9rem" />}
                                            onClick={handleReloadMobile}
                                            loading={mintMutation.isPending}
                                        >
                                            Retry
                                        </Button>
                                    </Stack>
                                ) : (
                                    <Stack align="center" justify="center" h="100%" gap="xs" p="md">
                                        <Loader size="sm" />
                                        <Text size="xs" c="dimmed" ta="center">
                                            {isDev
                                                ? 'Starting the mobile preview… the first load compiles the Expo dev bundle and can take a moment.'
                                                : 'Starting the mobile preview…'}
                                        </Text>
                                    </Stack>
                                )}
                            </Box>
                        )}
                    </Box>
                )}
            </Box>
        </Box>
    );
}
