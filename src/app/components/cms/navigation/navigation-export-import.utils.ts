/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { NAVIGATION_BUNDLE_FORMAT, isNavigationBundleVersionSupported } from '@selfhelp/shared';
import type {
    INavigationBundle,
    INavigationImportIssue,
    INavigationImportOptions,
    INavigationImportPreviewSummary,
    INavigationMenuPolicies,
} from '../../../../types/requests/admin/navigation-export-import.types';
import { MENU_TABS, type TMenuKey } from './navigation-builder.constants';

const CONFLICT_CODES = new Set([
    'invalid_menu_policy',
    'menu_depth_exceeded',
    'orphan_parent_ref',
    'self_parent_ref',
    'invalid_parent_ref',
    'route_conflict',
    'duplicate_keyword',
]);

const MISSING_PAGE_CODES = new Set(['missing_page', 'missing_page_skipped', 'missing_page_keyword']);

export function countBundleMenuItems(bundle: INavigationBundle): number {
    let count = 0;
    for (const menu of Object.values(bundle.menus ?? {})) {
        count += menu.items?.length ?? 0;
    }
    return count;
}

export function summarizeNavigationImportPreview(
    bundle: INavigationBundle,
    issues: INavigationImportIssue[],
): INavigationImportPreviewSummary {
    const errors = issues.filter((issue) => issue.level === 'error');
    const warnings = issues.filter((issue) => issue.level === 'warning');
    const missingPages = issues.filter((issue) => MISSING_PAGE_CODES.has(issue.code));
    const conflicts = issues.filter((issue) => CONFLICT_CODES.has(issue.code));

    return {
        menusAffected: Object.keys(bundle.menus ?? {}),
        itemsInBundle: countBundleMenuItems(bundle),
        pagesIncluded: bundle.pages?.length ?? 0,
        missingPages,
        conflicts,
        warnings,
        errors,
    };
}

export function hasReplaceMenuPolicy(menuPolicies: INavigationMenuPolicies | undefined): boolean {
    if (!menuPolicies) {
        return false;
    }
    return Object.values(menuPolicies).some((policy) => policy === 'replace');
}

export const DEFAULT_IMPORT_OPTIONS: INavigationImportOptions = {
    missingPagesMode: 'strict',
    menuPolicies: {
        web_header: 'merge',
        web_footer: 'merge',
        mobile_drawer: 'merge',
        mobile_bottom_tabs: 'merge',
    },
};

// The demo bundle's pages are already namespaced (`demo-*` keywords), so the
// demo preset applies no extra keyword prefix — only the `/demo` route prefix.
export const DEMO_IMPORT_OPTIONS: INavigationImportOptions = {
    keywordPrefix: '',
    routePrefix: '/demo',
    missingPagesMode: 'strict',
    menuPolicies: {
        web_header: 'replace',
        web_footer: 'replace',
        mobile_drawer: 'replace',
        mobile_bottom_tabs: 'replace',
    },
};

export const MENU_POLICY_LABELS: Record<TMenuKey, string> = Object.fromEntries(
    MENU_TABS.map((tab) => [tab.key, tab.label]),
) as Record<TMenuKey, string>;

export function isNavigationBundle(value: unknown): value is INavigationBundle {
    if (!value || typeof value !== 'object') {
        return false;
    }
    const candidate = value as Partial<INavigationBundle>;
    return candidate.format === NAVIGATION_BUNDLE_FORMAT
        && isNavigationBundleVersionSupported(candidate.version)
        && typeof candidate.menus === 'object'
        && candidate.menus !== null;
}

export function navigationExportFilename(): string {
    const stamp = new Date().toISOString().slice(0, 10);
    return `navigation-bundle-${stamp}.json`;
}
