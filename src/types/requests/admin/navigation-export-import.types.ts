/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/

import type { TNavigationMenuKey } from '@selfhelp/shared';

export type { TNavigationMenuKey };

/** Strict `selfhelp/navigation-bundle` v2.0 contract (shared with mobile). */
export type {
    INavigationBundle,
    INavigationBundleItem as INavigationBundleMenuItem,
    INavigationBundleMenu,
} from '@selfhelp/shared';

export type TNavigationExportMode = 'full_snapshot' | 'branch';
export type TNavigationMissingPagesMode = 'strict' | 'skip_missing' | 'create_stubs';
export type TNavigationMenuPolicy = 'replace' | 'merge' | 'append';

/** Frontend-facing export options (mapped to snake_case in the API client). */
export interface INavigationExportOptions {
    exportMode?: TNavigationExportMode;
    includePages?: boolean;
    includeSettings?: boolean;
    selectedPageIds?: number[];
    pageKeywords?: string[];
    menuKeys?: TNavigationMenuKey[];
    keywordPrefix?: string;
}

export interface INavigationMenuPolicies {
    web_header?: TNavigationMenuPolicy;
    web_footer?: TNavigationMenuPolicy;
    mobile_drawer?: TNavigationMenuPolicy;
    mobile_bottom_tabs?: TNavigationMenuPolicy;
}

/** Frontend-facing import options (mapped to snake_case in the API client). */
export interface INavigationImportOptions {
    keywordPrefix?: string;
    routePrefix?: string;
    missingPagesMode?: TNavigationMissingPagesMode;
    menuPolicies?: INavigationMenuPolicies;
    importSettings?: boolean;
    /** Group ids granted access to embedded pages (admin always has full access). */
    accessGroups?: number[];
    /** Skip embedded-page routes that collide with existing routes instead of aborting. */
    skipConflictingRoutes?: boolean;
    /** When false, embedded-page routes are created inactive (default true). */
    activateRoutes?: boolean;
}

export interface INavigationImportIssue {
    level: 'error' | 'warning';
    code: string;
    message: string;
    menu_key: string | null;
    page_keyword?: string | null;
}

export interface INavigationImportValidationResult {
    valid: boolean;
    issues: INavigationImportIssue[];
}

export interface INavigationImportedPage {
    keyword: string;
    page_id: number;
}

export interface INavigationImportResult {
    imported_menus: string[];
    created_items: number;
    skipped_items: number;
    imported_pages: INavigationImportedPage[];
}

export interface INavigationImportPreviewSummary {
    menusAffected: string[];
    itemsInBundle: number;
    pagesIncluded: number;
    missingPages: INavigationImportIssue[];
    conflicts: INavigationImportIssue[];
    warnings: INavigationImportIssue[];
    errors: INavigationImportIssue[];
}
