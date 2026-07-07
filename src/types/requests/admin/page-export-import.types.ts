/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
/**
 * Types for the page export/import flow (issue #30, Phase 5).
 *
 * A "page bundle" is the portable JSON produced by `POST /admin/pages/export`
 * and consumed by `POST /admin/pages/import[/validate]`. The per-page shape is
 * intentionally treated as opaque (`unknown`) on the client: it round-trips
 * verbatim through validate/import and the backend owns its structure.
 *
 * @module types/requests/admin/page-export-import.types
 */

import type { INavigationBundle } from './navigation-export-import.types';

/** A portable export bundle of one or more pages. */
export interface IPageBundle {
    format: string;
    version: string;
    exported_at: string;
    core_version: string;
    /** Opaque per-page payloads; the backend owns the structure. */
    pages: unknown[];
}

/** Import behaviour toggles (mirrors backend `import_pages.json#options`). */
export interface IPageImportOptions {
    /** Prefix prepended to every imported page keyword (and parent references). */
    keywordPrefix?: string;
    /** Prefix prepended to every imported route path_pattern. */
    routePrefix?: string;
    /** Skip routes that collide with existing active routes instead of aborting. */
    skipConflictingRoutes?: boolean;
    /** When false, imported routes are created inactive (default true). */
    activateRoutes?: boolean;
    /**
     * Optional group ids granted access to every imported page so real users can
     * see them. Admin always gets full access regardless. These groups get
     * read-only access on public pages and full CRUD on cms-app pages.
     */
    accessGroups?: number[];
}

export type TPageImportIssueLevel = 'error' | 'warning';

/** A single validation finding for an import bundle. */
export interface IPageImportIssue {
    level: TPageImportIssueLevel;
    code: string;
    message: string;
    page_keyword: string | null;
}

/** Dry-run validation report for an import bundle. */
export interface IPageImportValidationReport {
    valid: boolean;
    issues: IPageImportIssue[];
}

/** Result of a successful import. */
export interface IPageImportResult {
    created: Array<{ keyword: string; page_id: number }>;
}

/**
 * A shipped, ready-made example bundle returned by `GET /admin/pages/examples`.
 * The `bundle` field is either a full {@link IPageBundle} or a
 * `selfhelp/navigation-bundle` (navigation examples embed their pages); the
 * modal routes each format to the matching validate/import endpoint.
 */
export interface IPageExampleBundle {
    id: string;
    title: string;
    description: string;
    /** Gallery badges carried by the bundle (e.g. "cms-in-cms", "list + detail"). */
    tags: string[];
    page_count: number;
    bundle: IPageBundle | INavigationBundle;
}
