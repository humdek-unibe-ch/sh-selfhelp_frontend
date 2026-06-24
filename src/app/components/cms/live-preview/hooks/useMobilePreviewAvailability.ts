/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
/**
 * `useMobilePreviewAvailability` — resolve whether a mobile preview is running
 * and where.
 *
 * Probes the ordered preview-origin candidates (explicit env → installed image →
 * dev Expo server) via `<origin>/version.json` and exposes the resolved origin,
 * whether it is a live-reload dev server, the version info, and a `refetch`. The
 * React Query state IS the source of truth (no duplicated `useState`), mirroring
 * the inspector panel's probe.
 *
 * @module components/cms/live-preview/hooks/useMobilePreviewAvailability
 */

import { useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
    DEFAULT_MOBILE_PREVIEW_ORIGIN,
    previewOriginCandidates,
} from '../../pages/mobile-preview/mobilePreviewUrl';

export interface IMobilePreviewVersionInfo {
    version?: string | null;
    mobileRendererVersion?: string | null;
}

interface ILivePreviewAvailability {
    available: boolean;
    origin: string;
    dev: boolean;
    info: IMobilePreviewVersionInfo | null;
}

export type TMobilePreviewAvailability = 'checking' | 'available' | 'unavailable';

export interface IUseMobilePreviewAvailabilityResult {
    availability: TMobilePreviewAvailability;
    previewOrigin: string;
    devOrigin: boolean;
    versionInfo: IMobilePreviewVersionInfo | null;
    refetch: () => void;
}

/**
 * Probe a candidate origin's `<origin>/version.json`. An `optimistic` candidate
 * (a cross-origin dev server that may not serve it) is treated as available even
 * on a non-200; a same-origin installed image requires the 200. Mirrors the
 * inspector panel's probe.
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

export function useMobilePreviewAvailability(opts: {
    explicitOrigin: string | null;
    isDev: boolean;
}): IUseMobilePreviewAvailabilityResult {
    const { explicitOrigin, isDev } = opts;
    const candidates = useMemo(
        () => previewOriginCandidates({ explicitOrigin, isDev }),
        [explicitOrigin, isDev],
    );

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

    const availability: TMobilePreviewAvailability = availabilityQuery.isLoading
        ? 'checking'
        : availabilityQuery.data?.available
          ? 'available'
          : 'unavailable';
    const previewOrigin =
        availabilityQuery.data?.origin ?? candidates[0]?.origin ?? DEFAULT_MOBILE_PREVIEW_ORIGIN;
    const devOrigin = availabilityQuery.data?.dev ?? false;
    const versionInfo = availabilityQuery.data?.info ?? null;

    const { refetch } = availabilityQuery;
    const refetchAvailability = useCallback(() => {
        void refetch();
    }, [refetch]);

    return { availability, previewOrigin, devOrigin, versionInfo, refetch: refetchAvailability };
}
