/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { permissionAwareApiClient } from '../base.api';
import { API_CONFIG } from '../../config/api.config';
import type { IBaseApiResponse, TNavigationChildrenNavMode } from '../../shared';
import type {
    INavigationBundle,
    INavigationExportOptions,
    INavigationImportOptions,
    INavigationImportResult,
    INavigationImportValidationResult,
} from '../../types/requests/admin/navigation-export-import.types';

export interface IAdminNavigationMenuItemTranslation {
    language_id: number;
    /** Present on reads; not sent on writes. */
    locale?: string;
    label: string | null;
    description?: string | null;
    aria_label?: string | null;
}

export interface IAdminNavigationMenuItem {
    id: number;
    parent_item_id: number | null;
    item_type: string;
    page_id: number | null;
    external_url: string | null;
    icon: string | null;
    mobile_icon: string | null;
    label: string | null;
    translations?: IAdminNavigationMenuItemTranslation[];
    position: number;
    /** `'top'` puts a web-header root item on the top utility row of double presets. */
    layer: 'top' | null;
    is_active: boolean;
    /** Per-parent override of the children navigation presentation (web menus). */
    children_nav?: TNavigationChildrenNavMode | null;
    /** Per-parent override of the prev/next pager (`null` = inherit menu default). */
    show_pager?: boolean | null;
}

export interface IAdminNavigationMenuDefinition {
    key: string;
    platform: string;
    surface: string;
    preset: string | null;
    max_depth: number | null;
    item_limit: number | null;
    is_system: boolean;
    /** Menu-level default for child-page navigation (web menus). */
    children_nav?: TNavigationChildrenNavMode | null;
    /** Menu-level breadcrumb toggle (web menus). */
    show_breadcrumbs?: boolean;
    /** Menu-level prev/next pager toggle (web menus). */
    show_pager?: boolean;
    items: IAdminNavigationMenuItem[];
}

export interface IAdminNavigationOverview {
    menus: Record<string, IAdminNavigationMenuDefinition>;
    settings: Record<string, unknown>;
}

export interface IAdminMenuPreview {
    menu_key: string;
    resolved: { items?: unknown[] } | null;
    warnings: Array<{ code: string; message: string; menu_item_id?: number; page_id?: number; keyword?: string }>;
    suggestions: Array<{ code: string; message: string; menu_item_id?: number; page_id?: number; keyword?: string }>;
}

export interface ICreateNavigationMenuItemRequest {
    item_type?: 'page' | 'external_url' | 'group';
    page_id?: number | null;
    external_url?: string | null;
    icon?: string | null;
    mobile_icon?: string | null;
    label?: string | null;
    translations?: IAdminNavigationMenuItemTranslation[];
    position?: number;
    parent_item_id?: number | null;
    layer?: 'top' | null;
    child_page_ids?: number[];
    include_descendants?: boolean;
    is_active?: boolean;
    children_nav?: TNavigationChildrenNavMode | null;
    show_pager?: boolean | null;
}

export interface IUpdateNavigationMenuItemRequest extends ICreateNavigationMenuItemRequest {}

export class AdminNavigationApi {
    static async getOverview(): Promise<IAdminNavigationOverview> {
        const response = await permissionAwareApiClient.get<IBaseApiResponse<IAdminNavigationOverview>>(
            API_CONFIG.ENDPOINTS.ADMIN_NAVIGATION_GET,
        );
        return response.data.data;
    }

    static async getMenuPreview(menuKey: string, languageId: number): Promise<IAdminMenuPreview> {
        const response = await permissionAwareApiClient.get<IBaseApiResponse<IAdminMenuPreview>>(
            API_CONFIG.ENDPOINTS.ADMIN_NAVIGATION_MENU_PREVIEW,
            menuKey,
            languageId,
        );
        return response.data.data;
    }

    static async createMenuItem(
        menuKey: string,
        payload: ICreateNavigationMenuItemRequest,
    ): Promise<{ item: IAdminNavigationMenuItem; children: IAdminNavigationMenuItem[] }> {
        const response = await permissionAwareApiClient.post<IBaseApiResponse<{
            item: IAdminNavigationMenuItem;
            children: IAdminNavigationMenuItem[];
        }>>(
            API_CONFIG.ENDPOINTS.ADMIN_NAVIGATION_MENU_ITEM_CREATE,
            payload,
            menuKey,
        );
        return response.data.data;
    }

    static async updateMenuItem(itemId: number, payload: Partial<IUpdateNavigationMenuItemRequest>): Promise<IAdminNavigationMenuItem> {
        const response = await permissionAwareApiClient.put<IBaseApiResponse<IAdminNavigationMenuItem>>(
            API_CONFIG.ENDPOINTS.ADMIN_NAVIGATION_MENU_ITEM_UPDATE,
            payload,
            itemId,
        );
        return response.data.data;
    }

    static async deleteMenuItem(itemId: number): Promise<void> {
        await permissionAwareApiClient.delete(
            API_CONFIG.ENDPOINTS.ADMIN_NAVIGATION_MENU_ITEM_DELETE,
            itemId,
        );
    }

    static async reorderMenuItems(
        menuKey: string,
        order: Array<{ item_id: number; position: number; parent_item_id?: number | null; layer?: 'top' | null }>,
    ): Promise<void> {
        await permissionAwareApiClient.put(
            API_CONFIG.ENDPOINTS.ADMIN_NAVIGATION_MENU_REORDER,
            { items: order },
            menuKey,
        );
    }

    static async updateMenuDefinition(
        menuKey: string,
        payload: {
            preset?: string;
            max_depth?: number | null;
            item_limit?: number | null;
            children_nav?: TNavigationChildrenNavMode | null;
            show_breadcrumbs?: boolean;
            show_pager?: boolean;
        },
    ): Promise<IAdminNavigationMenuDefinition> {
        const response = await permissionAwareApiClient.put<IBaseApiResponse<IAdminNavigationMenuDefinition>>(
            API_CONFIG.ENDPOINTS.ADMIN_NAVIGATION_MENU_UPDATE,
            payload,
            menuKey,
        );
        return response.data.data;
    }

    static async updateSettings(payload: Record<string, unknown>): Promise<Record<string, unknown>> {
        const response = await permissionAwareApiClient.put<IBaseApiResponse<Record<string, unknown>>>(
            API_CONFIG.ENDPOINTS.ADMIN_NAVIGATION_SETTINGS_UPDATE,
            payload,
        );
        return response.data.data ?? {};
    }

    static async exportNavigation(options: INavigationExportOptions = {}): Promise<INavigationBundle> {
        const response = await permissionAwareApiClient.post<IBaseApiResponse<INavigationBundle>>(
            API_CONFIG.ENDPOINTS.ADMIN_NAVIGATION_EXPORT,
            { options: buildNavigationExportRequestOptions(options) },
        );
        return response.data.data;
    }

    static async validateNavigationImport(
        bundle: INavigationBundle,
        options: INavigationImportOptions = {},
    ): Promise<INavigationImportValidationResult> {
        const response = await permissionAwareApiClient.post<IBaseApiResponse<INavigationImportValidationResult>>(
            API_CONFIG.ENDPOINTS.ADMIN_NAVIGATION_IMPORT_VALIDATE,
            { bundle, options: buildNavigationImportRequestOptions(options) },
        );
        return response.data.data;
    }

    static async importNavigation(
        bundle: INavigationBundle,
        options: INavigationImportOptions = {},
        dryRun = false,
    ): Promise<INavigationImportResult | INavigationImportValidationResult> {
        const response = await permissionAwareApiClient.post<
            IBaseApiResponse<INavigationImportResult | INavigationImportValidationResult>
        >(
            API_CONFIG.ENDPOINTS.ADMIN_NAVIGATION_IMPORT,
            { bundle, options: buildNavigationImportRequestOptions(options) },
            dryRun ? { params: { dry_run: 1 } } : undefined,
        );
        return response.data.data;
    }
}

function buildNavigationExportRequestOptions(options: INavigationExportOptions): Record<string, unknown> {
    const payload: Record<string, unknown> = {
        mode: options.exportMode ?? 'full_snapshot',
        include_pages: options.includePages ?? false,
        include_settings: options.includeSettings ?? false,
    };

    if (options.selectedPageIds && options.selectedPageIds.length > 0) {
        payload.page_ids = options.selectedPageIds;
    }
    if (options.pageKeywords && options.pageKeywords.length > 0) {
        payload.page_keywords = options.pageKeywords;
    }
    if (options.menuKeys && options.menuKeys.length > 0) {
        payload.menu_keys = options.menuKeys;
    }
    if (options.keywordPrefix !== undefined) {
        payload.default_keyword_prefix = options.keywordPrefix;
    }

    return payload;
}

function buildNavigationImportRequestOptions(options: INavigationImportOptions): Record<string, unknown> {
    const payload: Record<string, unknown> = {
        missing_pages_mode: options.missingPagesMode ?? 'strict',
    };

    if (options.keywordPrefix !== undefined) {
        payload.keyword_prefix = options.keywordPrefix;
    }
    if (options.routePrefix !== undefined) {
        payload.route_prefix = options.routePrefix;
    }
    if (options.menuPolicies) {
        payload.menu_policies = options.menuPolicies;
    }
    if (options.importSettings !== undefined) {
        payload.import_settings = options.importSettings;
    }
    if (options.accessGroups && options.accessGroups.length > 0) {
        payload.access_groups = options.accessGroups;
    }
    if (options.skipConflictingRoutes !== undefined) {
        payload.skip_conflicting_routes = options.skipConflictingRoutes;
    }
    if (options.activateRoutes !== undefined) {
        payload.activate_routes = options.activateRoutes;
    }

    return payload;
}
