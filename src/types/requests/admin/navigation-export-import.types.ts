/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/

export type TNavigationMenuKey =
    | 'web_header'
    | 'web_footer'
    | 'mobile_drawer'
    | 'mobile_bottom_tabs';

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
}

export interface INavigationBundleMenuItem {
    ref: string;
    parent_ref?: string | null;
    item_type?: string;
    page_keyword?: string;
    [key: string]: unknown;
}

export interface INavigationBundleMenu {
    items?: INavigationBundleMenuItem[];
    [key: string]: unknown;
}

export interface INavigationBundle {
    format?: string;
    version?: string;
    export_mode?: string;
    import_hints?: {
        default_keyword_prefix?: string;
        default_route_prefix?: string;
    };
    menus: Record<string, INavigationBundleMenu>;
    settings?: Record<string, unknown>;
    pages?: unknown[];
    [key: string]: unknown;
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
