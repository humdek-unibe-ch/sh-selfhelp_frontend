/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
'use client';

/**
 * MobilePreviewPanel — live preview of the current CMS page rendered by the
 * `selfhelp-mobile-preview` web image inside the page editor.
 *
 * How it works:
 *   1. AUTO-RESOLVES the preview origin (a React Query, see
 *      {@link previewOriginCandidates}): an explicit
 *      `NEXT_PUBLIC_MOBILE_PREVIEW_ORIGIN` always wins; otherwise it probes the
 *      installed image at `/mobile-preview` (`version.json` 200) and, in
 *      development only, falls back to a running Expo dev server at
 *      `http://localhost:8081` for live-reload. If none resolve, it renders a
 *      graceful "unavailable" state.
 *   2. A same-origin installed path that 404s means the service is not deployed;
 *      an absolute (cross-origin) dev origin is assumed available even without
 *      `version.json` (the Expo dev server does not serve it).
 *   3. Mints a SHORT-LIVED, single-use code (a React Query mutation against the
 *      protected BFF route) and puts it in the iframe URL (built by
 *      {@link buildMobilePreviewUrl}). Each iframe (re)load consumes one code on
 *      exchange, so we mint afresh on every reload and whenever a control
 *      (device / orientation / language / draft) changes.
 *
 * The admin JWT never reaches the iframe — only the opaque one-time code does.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
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
import {
    IconAlertTriangle,
    IconExternalLink,
    IconRefresh,
} from '@tabler/icons-react';
import { AdminMobilePreviewApi } from '../../../../../api/admin/mobile-preview.api';
import type { ILanguage } from '../../../../../shared';
import {
    buildMobilePreviewUrl,
    DEFAULT_MOBILE_PREVIEW_ORIGIN,
    previewOriginCandidates,
    type TPreviewDevice,
    type TPreviewOrientation,
    type TPreviewOriginMode,
} from './mobilePreviewUrl';

interface IMobilePreviewBundledPlugin {
    id: string;
    version: string;
    mobilePackage?: string | null;
    mobilePackageVersion?: string | null;
}

/** Shape of `<origin>/version.json` served by the mobile-preview image. */
interface IMobilePreviewVersionInfo {
    version?: string | null;
    mobileRendererVersion?: string | null;
    bundledPlugins?: IMobilePreviewBundledPlugin[];
}

interface IMobilePreviewAvailability {
    available: boolean;
    /** Resolved origin to embed (when available) or to show in the unavailable copy. */
    origin: string;
    /** How the origin was chosen — drives the "live-reload dev" badge. */
    mode: TPreviewOriginMode | null;
    info: IMobilePreviewVersionInfo | null;
}

/**
 * Probe a single candidate's `<origin>/version.json`. A 200 yields availability
 * + (best-effort) the parsed info. For an `optimistic` candidate (a cross-origin
 * dev server) a non-200 / CORS / connection failure is still treated as
 * available — we cannot reliably probe it, so we embed it and let the iframe
 * surface any real error. A non-optimistic candidate (the same-origin installed
 * image) requires the 200.
 */
async function probePreviewCandidate(
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

export interface IMobilePreviewPanelProps {
    /** Keyword of the page being edited (routed to on boot). */
    keyword: string;
    /** Page id, bound into the minted code's scope. */
    pageId?: number | null;
    /** Available content languages (id + locale + label). */
    languages: ILanguage[];
    /** Initially-selected language id. */
    defaultLanguageId?: number | null;
}

/** Frame pixel sizes per device, portrait orientation (swapped for landscape). */
const FRAME_SIZES: Record<TPreviewDevice, { width: number; height: number }> = {
    phone: { width: 390, height: 844 },
    tablet: { width: 834, height: 1112 },
};

/** Target on-screen width; the frame is scaled down to fit the inspector. */
const DISPLAY_WIDTH = 320;

function frameDimensions(device: TPreviewDevice, orientation: TPreviewOrientation) {
    const base = FRAME_SIZES[device];
    const width = orientation === 'landscape' ? base.height : base.width;
    const height = orientation === 'landscape' ? base.width : base.height;
    const scale = Math.min(1, DISPLAY_WIDTH / width);
    return { width, height, scale };
}

function toErrorMessage(error: unknown): string {
    if (error instanceof Error && error.message) return error.message;
    return 'Failed to start the mobile preview. Please retry.';
}

export function MobilePreviewPanel({
    keyword,
    pageId,
    languages,
    defaultLanguageId,
}: IMobilePreviewPanelProps) {
    // Auto-resolution inputs: an explicit env origin always wins; otherwise we
    // probe the installed image and (in dev) the Expo dev server in order.
    const explicitOrigin = process.env.NEXT_PUBLIC_MOBILE_PREVIEW_ORIGIN ?? null;
    const isDev = process.env.NODE_ENV !== 'production';
    const candidates = useMemo(
        () => previewOriginCandidates({ explicitOrigin, isDev }),
        [explicitOrigin, isDev],
    );

    const [device, setDevice] = useState<TPreviewDevice>('phone');
    const [orientation, setOrientation] = useState<TPreviewOrientation>('portrait');
    const [draft, setDraft] = useState(true);
    const [languageId, setLanguageId] = useState<number | null>(defaultLanguageId ?? null);
    const [reloadToken, setReloadToken] = useState(0);

    const locale = useMemo(
        () => languages.find((lang) => lang.id === languageId)?.locale ?? null,
        [languages, languageId],
    );
    const languageOptions = useMemo(
        () => languages.map((lang) => ({ value: String(lang.id), label: lang.language })),
        [languages],
    );

    // --- availability probe (no manual setState; React Query owns the state) --
    // Walks the ordered candidates and resolves to the first available one,
    // so a same-origin installed image is preferred over the dev server, and an
    // explicit env origin short-circuits the chain.
    const availabilityQuery = useQuery<IMobilePreviewAvailability>({
        queryKey: ['mobile-preview-version', candidates.map((c) => `${c.mode}:${c.origin}`).join('|')],
        queryFn: async () => {
            for (const candidate of candidates) {
                const result = await probePreviewCandidate(candidate.origin, candidate.optimistic);
                if (result.available) {
                    return { available: true, origin: candidate.origin, mode: candidate.mode, info: result.info };
                }
            }
            // Nothing resolved — show the unavailable state against the first
            // (installed/explicit) candidate so the copy points at the expected path.
            const fallback = candidates[0]?.origin ?? DEFAULT_MOBILE_PREVIEW_ORIGIN;
            return { available: false, origin: fallback, mode: null, info: null };
        },
        staleTime: 30_000,
        retry: false,
    });

    const { refetch: refetchAvailability } = availabilityQuery;
    const availability: 'checking' | 'available' | 'unavailable' = availabilityQuery.isLoading
        ? 'checking'
        : availabilityQuery.data?.available
          ? 'available'
          : 'unavailable';
    const previewOrigin = availabilityQuery.data?.origin ?? candidates[0]?.origin ?? DEFAULT_MOBILE_PREVIEW_ORIGIN;
    const devOrigin = availabilityQuery.data?.mode === 'dev';
    const versionInfo = availabilityQuery.data?.info ?? null;

    // --- mint (a mutation; triggering `mutate` in an effect is not a setState) -
    const mintMutation = useMutation({
        mutationFn: () =>
            AdminMobilePreviewApi.createSession({
                keyword,
                page_id: pageId ?? undefined,
                language_id: languageId ?? undefined,
                draft,
            }),
    });
    const { mutate: mintCode, reset: resetMint } = mintMutation;
    const code = mintMutation.data?.code ?? null;
    const mintError = mintMutation.isError ? toErrorMessage(mintMutation.error) : null;

    useEffect(() => {
        if (availability !== 'available') return;
        mintCode();
    }, [availability, device, orientation, languageId, draft, reloadToken, mintCode]);

    const previewUrl = useMemo(() => {
        if (!code) return null;
        return buildMobilePreviewUrl({
            origin: previewOrigin,
            code,
            keyword,
            language: locale,
            device,
            orientation,
            draft,
        });
    }, [code, previewOrigin, keyword, locale, device, orientation, draft]);

    const handleReload = useCallback(() => setReloadToken((token) => token + 1), []);

    const handleRetryAvailability = useCallback(() => {
        resetMint();
        void refetchAvailability();
    }, [resetMint, refetchAvailability]);

    const handleOpenInNewTab = useCallback(async () => {
        try {
            const data = await AdminMobilePreviewApi.createSession({
                keyword,
                page_id: pageId ?? undefined,
                language_id: languageId ?? undefined,
                draft,
            });
            const url = buildMobilePreviewUrl({
                origin: previewOrigin,
                code: data.code,
                keyword,
                language: locale,
                device,
                orientation,
                draft,
            });
            window.open(url, '_blank', 'noopener,noreferrer');
        } catch {
            // The inline mint error (from the mutation) already covers failures;
            // opening in a new tab is a best-effort convenience.
        }
    }, [keyword, pageId, languageId, draft, previewOrigin, locale, device, orientation]);

    const { width, height, scale } = frameDimensions(device, orientation);
    const bundledCount = versionInfo?.bundledPlugins?.length ?? 0;

    if (availability === 'checking') {
        return (
            <Group gap="xs" py="md">
                <Loader size="sm" />
                <Text size="sm" c="dimmed">
                    Checking mobile preview availability…
                </Text>
            </Group>
        );
    }

    if (availability === 'unavailable') {
        return (
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
                                , or start the Expo dev server (<code>npx expo start --web</code> on{' '}
                                <code>http://localhost:8081</code>) for live-reload development
                            </>
                        ) : null}
                        . You can also pin a specific origin with{' '}
                        <code>NEXT_PUBLIC_MOBILE_PREVIEW_ORIGIN</code>.
                    </Text>
                    <Group>
                        <ActionIcon
                            variant="light"
                            onClick={handleRetryAvailability}
                            aria-label="Retry mobile preview"
                        >
                            <IconRefresh size="1rem" />
                        </ActionIcon>
                    </Group>
                </Stack>
            </Alert>
        );
    }

    return (
        <Stack gap="sm">
            <Group justify="space-between" align="flex-end" wrap="wrap">
                <Group gap="sm" align="flex-end" wrap="wrap">
                    <SegmentedControl
                        size="xs"
                        value={device}
                        onChange={(value) => setDevice(value as TPreviewDevice)}
                        data={[
                            { label: 'Phone', value: 'phone' },
                            { label: 'Tablet', value: 'tablet' },
                        ]}
                        aria-label="Preview device"
                    />
                    <SegmentedControl
                        size="xs"
                        value={orientation}
                        onChange={(value) => setOrientation(value as TPreviewOrientation)}
                        data={[
                            { label: 'Portrait', value: 'portrait' },
                            { label: 'Landscape', value: 'landscape' },
                        ]}
                        aria-label="Preview orientation"
                    />
                    {languageOptions.length > 1 && (
                        <Select
                            size="xs"
                            w={140}
                            value={languageId ? String(languageId) : null}
                            onChange={(value) => setLanguageId(value ? Number(value) : null)}
                            data={languageOptions}
                            aria-label="Preview language"
                            comboboxProps={{ withinPortal: true }}
                        />
                    )}
                    <Switch
                        size="xs"
                        checked={draft}
                        onChange={(event) => setDraft(event.currentTarget.checked)}
                        label="Draft"
                        aria-label="Preview draft content"
                    />
                </Group>
                <Group gap="xs">
                    <Tooltip label="Reload preview">
                        <ActionIcon
                            variant="light"
                            onClick={handleReload}
                            loading={mintMutation.isPending}
                            aria-label="Reload mobile preview"
                        >
                            <IconRefresh size="1rem" />
                        </ActionIcon>
                    </Tooltip>
                    <Tooltip label="Open preview in a new tab">
                        <ActionIcon
                            variant="light"
                            onClick={() => void handleOpenInNewTab()}
                            aria-label="Open mobile preview in new tab"
                        >
                            <IconExternalLink size="1rem" />
                        </ActionIcon>
                    </Tooltip>
                </Group>
            </Group>

            <Group gap="xs">
                {versionInfo?.version && (
                    <Badge size="sm" variant="light" color="grape">
                        preview v{versionInfo.version}
                    </Badge>
                )}
                {bundledCount > 0 && (
                    <Badge size="sm" variant="light" color="blue">
                        {bundledCount} bundled plugin{bundledCount === 1 ? '' : 's'}
                    </Badge>
                )}
                {devOrigin && (
                    <Badge size="sm" variant="light" color="teal">
                        live-reload dev
                    </Badge>
                )}
            </Group>

            {mintError && (
                <Alert icon={<IconAlertTriangle size="1rem" />} color="red" title="Preview error">
                    {mintError}
                </Alert>
            )}

            <Box
                style={{
                    width: width * scale,
                    height: height * scale,
                    overflow: 'hidden',
                    borderRadius: 12,
                    border: '1px solid var(--mantine-color-default-border)',
                    background: 'var(--mantine-color-body)',
                }}
            >
                {previewUrl ? (
                    <iframe
                        title="Mobile preview"
                        src={previewUrl}
                        sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                        style={{
                            width,
                            height,
                            border: 0,
                            transform: `scale(${scale})`,
                            transformOrigin: 'top left',
                        }}
                    />
                ) : (
                    <Group justify="center" align="center" h="100%">
                        <Loader size="sm" />
                    </Group>
                )}
            </Box>
        </Stack>
    );
}
