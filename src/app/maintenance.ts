/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
/**
 * Maintenance-mode helpers shared by the slug page (server) and the hardcoded
 * fallback (client).
 *
 * The backend's `MaintenanceModeListener` returns a clean `503` for normal
 * `/cms-api` traffic while the instance is in maintenance, but keeps the
 * `maintenance` page content reachable. The slug page uses {@link
 * isMaintenanceStatus} to tell that 503 apart from a real 404 and then renders
 * the seeded `maintenance` CMS page (with the operator's
 * `{{system.maintenance_message}}`), falling back to the hardcoded
 * `MaintenanceClient` when that page is missing/unreachable.
 */

/** Keyword of the seeded maintenance CMS page. */
export const MAINTENANCE_KEYWORD = 'maintenance';

/** HTTP status Symfony returns for blocked traffic during maintenance. */
export const MAINTENANCE_HTTP_STATUS = 503;

/**
 * Hardcoded copy for the fallback page, mirrored from the backend default
 * (`VariableResolverService::DEFAULT_MAINTENANCE_MESSAGE`) so the experience is
 * consistent whether or not the seeded CMS page is reachable.
 */
export const DEFAULT_MAINTENANCE_MESSAGE =
    'The platform is currently undergoing scheduled maintenance. Please check back again shortly.';

/** Whether an SSR fetch status means "instance is in maintenance". */
export function isMaintenanceStatus(status: number | null | undefined): boolean {
    return status === MAINTENANCE_HTTP_STATUS;
}

/**
 * Whether the seeded maintenance CMS page has renderable content. Prefers the
 * BE-computed `should_fallback` flag (set when a page is missing its required
 * functional section) and falls back to a zero-sections check for older BE
 * payloads. When this is false the caller renders the hardcoded fallback.
 */
export function hasRenderableMaintenancePage(page: unknown): page is { id: number } {
    if (!page || typeof page !== 'object') return false;
    const candidate = page as { id?: unknown; should_fallback?: unknown; sections?: unknown };
    if (typeof candidate.id !== 'number') return false;
    if (typeof candidate.should_fallback === 'boolean') return !candidate.should_fallback;
    return Array.isArray(candidate.sections) && candidate.sections.length > 0;
}
