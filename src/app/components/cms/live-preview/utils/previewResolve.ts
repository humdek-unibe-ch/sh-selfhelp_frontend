/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
/**
 * Live Preview path resolution against backend `GET /pages/resolve`.
 *
 * Failures are classified explicitly so the shell can keep the last successful
 * preview while showing an admin-safe error — never silently leave stale content
 * looking like a successful navigation to the requested path.
 *
 * @module components/cms/live-preview/utils/previewResolve
 */

import { isAxiosError } from 'axios';
import type { IPageContent } from '../../../../../shared';
import { normalizePreviewPath } from './previewPath';

export type TPreviewResolveFailureKind =
    | 'not_found'
    | 'unauthorized'
    | 'network'
    | 'malformed'
    | 'unknown';

export interface IPreviewResolveFailure {
    kind: TPreviewResolveFailureKind;
    /** Normalized path that failed. */
    path: string;
    status?: number;
    /** Short admin-safe message (no stack traces / internal URLs). */
    message: string;
}

export interface IPreviewResolveSuccess {
    keyword: string;
    path: string;
    routeParams: Record<string, string>;
}

export type TPreviewResolveOutcome =
    | { status: 'success'; value: IPreviewResolveSuccess }
    | { status: 'error'; failure: IPreviewResolveFailure }
    | { status: 'stale' };

const ADMIN_SAFE_MESSAGES: Record<TPreviewResolveFailureKind, string> = {
    not_found: 'No published page matches this path (404).',
    unauthorized: 'Preview is not authorized for this path (401/403).',
    network: 'Network error while resolving the path.',
    malformed: 'The resolve response was missing required page fields.',
    unknown: 'Path resolution failed.',
};

/**
 * Map a thrown resolve error to an explicit failure kind for Live Preview UI.
 */
export function classifyPreviewResolveError(error: unknown, path: string): IPreviewResolveFailure {
    const normalized = normalizePreviewPath(path);

    if (isAxiosError(error)) {
        const status = error.response?.status;
        if (status === 404) {
            return {
                kind: 'not_found',
                path: normalized,
                status,
                message: ADMIN_SAFE_MESSAGES.not_found,
            };
        }
        if (status === 401 || status === 403) {
            return {
                kind: 'unauthorized',
                path: normalized,
                status,
                message: ADMIN_SAFE_MESSAGES.unauthorized,
            };
        }
        if (!error.response) {
            return {
                kind: 'network',
                path: normalized,
                message: ADMIN_SAFE_MESSAGES.network,
            };
        }
        return {
            kind: 'unknown',
            path: normalized,
            status,
            message: ADMIN_SAFE_MESSAGES.unknown,
        };
    }

    if (error instanceof Error && /malformed|missing keyword|invalid page/i.test(error.message)) {
        return {
            kind: 'malformed',
            path: normalized,
            message: ADMIN_SAFE_MESSAGES.malformed,
        };
    }

    return {
        kind: 'unknown',
        path: normalized,
        message: ADMIN_SAFE_MESSAGES.unknown,
    };
}

export function formatPreviewResolveFailure(failure: IPreviewResolveFailure): string {
    return `Could not resolve ${failure.path}: ${failure.message}`;
}

/**
 * Soft mobile-frame sync may receive Expo router / modal-underlay paths that
 * are not public CMS URLs. Suppress only proven-benign 404s for those.
 * Always surface unauthorized, network, and malformed failures — and always
 * surface 404 when the path looks like a real multi-segment CMS URL (the
 * shell only sends those when route params are required).
 */
export function shouldReportMobileSyncFailure(failure: IPreviewResolveFailure): boolean {
    if (failure.kind !== 'not_found') {
        return true;
    }
    const segments = failure.path.replace(/^\/+/, '').split('/').filter(Boolean);
    // Single-segment or empty: often Expo underlay / keyword-only noise.
    return segments.length >= 2;
}

function assertResolvedPage(page: IPageContent, path: string): IPreviewResolveSuccess {
    if (!page || typeof page.keyword !== 'string' || page.keyword.trim() === '') {
        throw new Error('malformed resolve response: missing keyword');
    }
    return {
        keyword: page.keyword,
        path: normalizePreviewPath(path),
        routeParams: page.route_params ?? {},
    };
}

export type TPreviewResolvePageFn = (
    path: string,
    languageId?: number,
    preview?: boolean,
) => Promise<IPageContent>;

/**
 * Resolve a Live Preview path with generation-based race protection.
 * Older responses that finish after a newer request are discarded as `stale`.
 */
export async function resolvePreviewPathWithRace(options: {
    path: string;
    languageId?: number;
    preview?: boolean;
    requestId: number;
    isCurrent: (requestId: number) => boolean;
    resolvePageByPath: TPreviewResolvePageFn;
}): Promise<TPreviewResolveOutcome> {
    const path = normalizePreviewPath(options.path);
    try {
        const page = await options.resolvePageByPath(path, options.languageId, options.preview);
        if (!options.isCurrent(options.requestId)) {
            return { status: 'stale' };
        }
        try {
            return { status: 'success', value: assertResolvedPage(page, path) };
        } catch (inner) {
            if (!options.isCurrent(options.requestId)) {
                return { status: 'stale' };
            }
            return { status: 'error', failure: classifyPreviewResolveError(inner, path) };
        }
    } catch (error) {
        if (!options.isCurrent(options.requestId)) {
            return { status: 'stale' };
        }
        return { status: 'error', failure: classifyPreviewResolveError(error, path) };
    }
}
