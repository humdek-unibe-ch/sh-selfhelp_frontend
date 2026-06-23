/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
'use client';

/**
 * LivePreview — the full-screen CMS **Live Preview** surface.
 *
 * Opened in a NEW TAB from the page editor ("Open live preview"), this is the
 * "test the real flow" experience (as opposed to the inspector's quick-snippet
 * Mobile preview panel):
 *
 *   - a large MOBILE pane rendered by the real `selfhelp-mobile-preview` web
 *     image, in a chosen device frame (phone / tablet × portrait / landscape).
 *     Changing the device/orientation RESIZES the mobile column via CSS only
 *     (no reload), so the right column visibly grows/shrinks and in-app
 *     navigation state is preserved;
 *   - FREE NAVIGATION: the one-time code is minted WITHOUT a keyword scope, so
 *     the exchanged token may render any page (still GET-only, still the
 *     read-only render allowlist) — the admin clicks through the app like a
 *     real user, starting on the page they launched from;
 *   - a published/draft toggle that re-mints the mobile pane to render either
 *     published or unpublished-draft content;
 *   - an optional side-by-side WEB (desktop) pane embedding the same page in the
 *     web frontend for visual comparison.
 *
 * Gated by the `admin.mobile_preview.view` permission (server-checked in the
 * route, client-checked for the editor entry point). The admin JWT never
 * reaches the iframe — only the opaque one-time code does.
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
    Group,
    Loader,
    SegmentedControl,
    Select,
    Stack,
    Switch,
    Text,
    Tooltip,
} from '@mantine/core';
import { useElementSize } from '@mantine/hooks';
import {
    IconAlertTriangle,
    IconArrowLeft,
    IconDeviceMobile,
    IconExternalLink,
    IconRefresh,
} from '@tabler/icons-react';
import { AdminMobilePreviewApi } from '../../../../api/admin/mobile-preview.api';
import { API_CONFIG } from '../../../../config/api.config';
import { useAppNavigation } from '../../../../hooks/useAppNavigation';
import { usePublicLanguages } from '../../../../hooks/useLanguages';
import {
    buildMobilePreviewUrl,
    DEFAULT_MOBILE_PREVIEW_ORIGIN,
    previewOriginCandidates,
    type TPreviewDevice,
    type TPreviewModalMode,
    type TPreviewOrientation,
} from '../pages/mobile-preview/mobilePreviewUrl';
import { buildWebPreviewUrl, computeFrameLayout } from './livePreviewLayout';

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

/** Web-pane responsive test widths (px); `full` fills the pane. */
type TWebWidth = 'full' | 'desktop' | 'tablet' | 'mobile';
const WEB_WIDTH_PX: Record<Exclude<TWebWidth, 'full'>, number> = {
    desktop: 1280,
    tablet: 768,
    mobile: 390,
};

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

    // The CMS knows every page's nav position, so it can decide on/off-menu
    // RELIABLY and tell the mobile app how to present the page (`modal=on|off`).
    // This is authoritative: the GET-only preview token can't always read the
    // nav list itself (it's scope-bound to the session language), so we never
    // leave the on/off-menu decision to the embedded app when we can avoid it.
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
    const [draft, setDraft] = useState(true);
    const [showWeb, setShowWeb] = useState(true);
    const [webWidth, setWebWidth] = useState<TWebWidth>('full');
    const [languageId, setLanguageId] = useState<number | null>(null);
    const [reloadToken, setReloadToken] = useState(0);

    const { ref: bodyRef, width: bodyWidth, height: bodyHeight } = useElementSize();

    useEffect(() => {
        if (languageId === null && languages.length > 0) {
            setLanguageId(languages[0].id);
        }
    }, [languages, languageId]);

    const locale = useMemo(
        () => languages.find((lang) => lang.id === languageId)?.locale ?? null,
        [languages, languageId],
    );
    const languageOptions = useMemo(
        () => languages.map((lang) => ({ value: String(lang.id), label: lang.language })),
        [languages],
    );

    // --- availability probe (React Query owns the state) -----------------------
    const availabilityQuery = useQuery<ILivePreviewAvailability>({
        queryKey: ['live-preview-version', candidates.map((c) => `${c.mode}:${c.origin}`).join('|')],
        queryFn: async () => {
            for (const candidate of candidates) {
                // A cross-origin dev server doesn't serve a CORS-readable
                // version.json, so probing it only logs a console CORS error and
                // never yields info — treat optimistic candidates as available
                // WITHOUT a network probe (the iframe surfaces a real connection
                // error if the dev server is actually down).
                if (candidate.optimistic) {
                    return {
                        available: true,
                        origin: candidate.origin,
                        dev: candidate.mode === 'dev',
                        info: null,
                    };
                }
                // A same-origin installed image is essentially never provisioned
                // in local dev; skip its probe (it would 404 noisily) and fall
                // through to the dev server. Set NEXT_PUBLIC_MOBILE_PREVIEW_ORIGIN
                // to force a specific origin.
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

    // --- mint (keyword-less → free navigation) ---------------------------------
    // No keyword/page_id in the scope, so the exchanged token is NOT pinned to a
    // single page: the admin can navigate the whole app. Only draft + language
    // are bound, so we re-mint when those (or a manual reload) change.
    const mintMutation = useMutation({
        mutationFn: () =>
            AdminMobilePreviewApi.createSession({
                language_id: languageId ?? undefined,
                draft,
            }),
    });
    const { mutate: mintCode } = mintMutation;
    const code = mintMutation.data?.code ?? null;
    const mintError = mintMutation.isError ? toErrorMessage(mintMutation.error) : null;

    // Mint exactly ONCE per distinct intent. The key dedups against React 18
    // StrictMode's double-invoke (dev) and against the two independent initial
    // transitions (availability checking→available AND languageId null→resolved)
    // that previously each fired a mint and caused the visible double reload.
    // It only changes — and thus re-mints — when something that actually affects
    // the token does: language, draft, or a manual reload.
    const lastMintKeyRef = useRef<string | null>(null);
    useEffect(() => {
        if (availability !== 'available') return;
        // Wait for languages to settle so the first mint already carries the
        // resolved language (avoids a mint with no language, then a re-mint).
        if (languagesLoading) return;
        if (languages.length > 0 && languageId === null) return;

        const key = `${previewOrigin}|${languageId ?? ''}|${draft ? 1 : 0}|${reloadToken}`;
        if (lastMintKeyRef.current === key) return;
        lastMintKeyRef.current = key;
        mintCode();
    }, [
        availability,
        languagesLoading,
        languages.length,
        languageId,
        draft,
        reloadToken,
        previewOrigin,
        mintCode,
    ]);

    // Device / orientation are NOT in the URL: the iframe is sized to the device
    // and the app renders responsively, so rotating/resizing never reloads the
    // app (no consumed-code re-mint, navigation state preserved).
    const mobileUrl = useMemo(() => {
        if (!code) return null;
        return buildMobilePreviewUrl({
            origin: previewOrigin,
            code,
            keyword,
            language: locale,
            frame: false,
            banner: false,
            hideDebugPanel: true,
            draft,
            modal: effectiveModal,
            // A cross-origin Expo dev server can't reach the backend through the
            // same-origin `/mobile-preview/api` proxy (that only exists on the
            // installed image), so hand it the backend origin directly. The
            // backend CORS allow-list already covers `localhost:*`, and the
            // production image ignores `backendUrl` (non-dev instance).
            backendUrl: devOrigin ? API_CONFIG.BACKEND_URL : undefined,
        });
    }, [code, previewOrigin, keyword, locale, draft, effectiveModal, devOrigin]);

    const webUrl = useMemo(() => buildWebPreviewUrl(keyword), [keyword]);

    const frame = useMemo(
        () =>
            computeFrameLayout({
                device,
                orientation,
                availableWidth: bodyWidth,
                availableHeight: bodyHeight - 32,
                maxWidthRatio: showWeb ? 0.55 : 0.95,
            }),
        [device, orientation, bodyWidth, bodyHeight, showWeb],
    );

    const handleReload = useCallback(() => setReloadToken((t) => t + 1), []);
    const editorHref = `/admin/pages/${encodeURIComponent(keyword)}`;

    return (
        <Box style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
            {/* Toolbar */}
            <Group
                justify="space-between"
                align="center"
                px="md"
                py="xs"
                wrap="nowrap"
                style={{
                    borderBottom: '1px solid var(--mantine-color-default-border)',
                    background: 'var(--mantine-color-body)',
                }}
            >
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
                        {keyword}
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

                {availability === 'available' && (
                    <Group gap="sm" align="center" wrap="wrap" justify="flex-end">
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
                        {languageOptions.length > 1 && (
                            <Select
                                size="xs"
                                w={150}
                                value={languageId ? String(languageId) : null}
                                onChange={(v) => setLanguageId(v ? Number(v) : null)}
                                data={languageOptions}
                                aria-label="Preview language"
                                comboboxProps={{ withinPortal: true }}
                            />
                        )}
                        <Switch
                            size="xs"
                            checked={draft}
                            onChange={(e) => setDraft(e.currentTarget.checked)}
                            label="Draft"
                            aria-label="Preview unpublished draft content"
                        />
                        <Switch
                            size="xs"
                            checked={showWeb}
                            onChange={(e) => setShowWeb(e.currentTarget.checked)}
                            label="Web"
                            aria-label="Show the web (desktop) comparison pane"
                        />
                        <Tooltip label="Reload preview">
                            <ActionIcon
                                variant="light"
                                onClick={handleReload}
                                loading={mintMutation.isPending}
                                aria-label="Reload live preview"
                            >
                                <IconRefresh size="1rem" />
                            </ActionIcon>
                        </Tooltip>
                    </Group>
                )}
            </Group>

            {mintError && availability === 'available' && (
                <Alert
                    icon={<IconAlertTriangle size="1rem" />}
                    color="red"
                    title="Preview error"
                    radius={0}
                >
                    {mintError}
                </Alert>
            )}

            {/* Body */}
            {availability === 'checking' && (
                <Group gap="xs" justify="center" align="center" style={{ flex: 1 }}>
                    <Loader size="sm" />
                    <Text size="sm" c="dimmed">
                        Checking mobile preview availability…
                    </Text>
                </Group>
            )}

            {availability === 'unavailable' && (
                <Box p="xl" style={{ flex: 1, overflow: 'auto' }}>
                    <Alert
                        icon={<IconAlertTriangle size="1rem" />}
                        color="yellow"
                        title="Mobile preview unavailable"
                    >
                        <Stack gap="xs">
                            <Text size="sm">
                                No mobile preview is running at <code>{previewOrigin}</code>. Enable the{' '}
                                <code>selfhelp-mobile-preview</code> service for this instance from{' '}
                                <strong>System Maintenance → Update / enable mobile preview</strong>
                                {isDev ? (
                                    <>
                                        , or start the Expo dev server (<code>npx expo start --web</code>)
                                        for live-reload development
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
            )}

            {availability === 'available' && (
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
                    {showWeb && (
                        <Box
                            style={{
                                flex: 1,
                                minWidth: 0,
                                display: 'flex',
                                flexDirection: 'column',
                                borderRadius: 12,
                                overflow: 'hidden',
                                border: '1px solid var(--mantine-color-default-border)',
                                background: 'var(--mantine-color-body)',
                            }}
                        >
                            <Group
                                justify="space-between"
                                px="sm"
                                py={6}
                                wrap="nowrap"
                                gap="xs"
                                style={{ borderBottom: '1px solid var(--mantine-color-default-border)' }}
                            >
                                <Text size="xs" c="dimmed" fw={600} style={{ whiteSpace: 'nowrap' }}>
                                    Web
                                </Text>
                                <Group gap="xs" wrap="nowrap">
                                    <SegmentedControl
                                        size="xs"
                                        value={webWidth}
                                        onChange={(v) => setWebWidth(v as TWebWidth)}
                                        data={[
                                            { label: 'Full', value: 'full' },
                                            { label: 'Desktop', value: 'desktop' },
                                            { label: 'Tablet', value: 'tablet' },
                                            { label: 'Mobile', value: 'mobile' },
                                        ]}
                                        aria-label="Web preview width"
                                    />
                                    <Tooltip label="Open in a new tab">
                                        <ActionIcon
                                            size="sm"
                                            variant="subtle"
                                            component="a"
                                            href={webUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            aria-label="Open web page in a new tab"
                                        >
                                            <IconExternalLink size="0.9rem" />
                                        </ActionIcon>
                                    </Tooltip>
                                </Group>
                            </Group>
                            <Box
                                style={{
                                    flex: 1,
                                    minHeight: 0,
                                    display: 'flex',
                                    justifyContent: 'center',
                                    overflow: 'hidden',
                                    background: 'var(--mantine-color-default-hover)',
                                }}
                            >
                                <iframe
                                    title="Web preview"
                                    src={webUrl}
                                    style={{
                                        border: 0,
                                        height: '100%',
                                        width: webWidth === 'full' ? '100%' : `${WEB_WIDTH_PX[webWidth]}px`,
                                        maxWidth: '100%',
                                        background: 'var(--mantine-color-body)',
                                    }}
                                />
                            </Box>
                        </Box>
                    )}

                    {/* Mobile pane: the column width tracks the device frame. */}
                    <Box
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: showWeb ? frame.displayWidth + 2 : '100%',
                            flex: showWeb ? '0 0 auto' : 1,
                        }}
                    >
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
                            {mobileUrl ? (
                                <iframe
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
                            ) : (
                                <Group justify="center" align="center" h="100%">
                                    <Loader size="sm" />
                                </Group>
                            )}
                        </Box>
                    </Box>
                </Box>
            )}
        </Box>
    );
}
