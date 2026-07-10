/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
/**
 * Path helpers for the CMS Live Preview shell.
 *
 * Authoritative page + `route_params` resolution uses the backend
 * `GET /pages/resolve` contract via {@link PageApi.resolvePageByPath}.
 * This module only normalizes in-pane paths and decides when the mobile
 * frame must receive a path (parameterized) vs keyword-only sync.
 *
 * @module components/cms/live-preview/utils/previewPath
 */

import { normalizePagesResolvePath } from '@selfhelp/shared';

/** Strip hash/search and normalize for resolve (shared contract). */
export function normalizePreviewPath(rawPath: string): string {
    return normalizePagesResolvePath(rawPath);
}

/**
 * Soft-sync path for the mobile Live Preview frame.
 *
 * Only parameterized matches (non-empty `route_params`) need a public path so
 * mobile can hydrate `{{route.*}}`. Static nested URLs must sync by keyword
 * so the frame keeps its menu/modal navigation rules — sending every nested
 * path forced `navigateToResolvedPath` and desynced the panes.
 */
export function pathForMobilePreviewSync(
    path: string | null | undefined,
    routeParams: Record<string, string> | null | undefined,
): string | undefined {
    if (!path) return undefined;
    if (!routeParams || Object.keys(routeParams).length === 0) return undefined;
    return path;
}
