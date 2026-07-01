/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { permissionAwareApiClient } from '../base.api';
import { API_CONFIG } from '../../config/api.config';
import type { IBaseApiResponse } from '../../shared';

export interface IAdminNavigationMenuItem {
    id: number;
    parent_item_id: number | null;
    item_type: string;
    page_id: number | null;
    external_url: string | null;
    icon_override: string | null;
    position: number;
    child_source: string | null;
    auto_include_depth: number | null;
    is_active: boolean;
    excluded_page_ids: number[];
}

export interface IAdminNavigationMenuDefinition {
    menu_key: string;
    platform: string;
    surface: string;
    preset?: string | null;
    max_depth?: number | null;
    item_limit?: number | null;
    config?: Record<string, unknown> | null;
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
    icon_override?: string | null;
    position?: number;
    parent_item_id?: number | null;
    child_source?: string;
    auto_include_depth?: number | null;
    is_active?: boolean;
    translations?: Array<{
        language_id: number;
        label?: string | null;
        description?: string | null;
        aria_label?: string | null;
    }>;
}

export interface IUpdateNavigationMenuItemRequest extends ICreateNavigationMenuItemRequest {
    translations?: Array<{
        language_id: number;
        label?: string | null;
        description?: string | null;
        aria_label?: string | null;
    }>;
}

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

    static async createMenuItem(menuKey: string, payload: ICreateNavigationMenuItemRequest): Promise<IAdminNavigationMenuItem> {
        const response = await permissionAwareApiClient.post<IBaseApiResponse<IAdminNavigationMenuItem>>(
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
        order: Array<{ item_id: number; position: number; parent_item_id?: number | null }>,
    ): Promise<void> {
        await permissionAwareApiClient.put(
            API_CONFIG.ENDPOINTS.ADMIN_NAVIGATION_MENU_REORDER,
            { items: order },
            menuKey,
        );
    }

    static async updateMenuDefinition(
        menuKey: string,
        payload: { preset?: string; max_depth?: number | null; item_limit?: number | null; config?: Record<string, unknown> | null },
    ): Promise<IAdminNavigationMenuDefinition> {
        const response = await permissionAwareApiClient.put<IBaseApiResponse<IAdminNavigationMenuDefinition>>(
            API_CONFIG.ENDPOINTS.ADMIN_NAVIGATION_MENU_UPDATE,
            payload,
            menuKey,
        );
        return response.data.data;
    }

    static async convertAutoChildren(itemId: number, languageId = 1): Promise<IAdminNavigationMenuItem[]> {
        const response = await permissionAwareApiClient.post<IBaseApiResponse<IAdminNavigationMenuItem[]>>(
            API_CONFIG.ENDPOINTS.ADMIN_NAVIGATION_ITEM_CONVERT_AUTO_CHILDREN,
            { language_id: languageId },
            itemId,
        );
        return response.data.data ?? [];
    }

    static async addMenuItemExclusion(itemId: number, pageId: number): Promise<void> {
        await permissionAwareApiClient.post(
            API_CONFIG.ENDPOINTS.ADMIN_NAVIGATION_ITEM_EXCLUSION_ADD,
            { page_id: pageId },
            itemId,
        );
    }

    static async removeMenuItemExclusion(itemId: number, pageId: number): Promise<void> {
        await permissionAwareApiClient.delete(
            API_CONFIG.ENDPOINTS.ADMIN_NAVIGATION_ITEM_EXCLUSION_REMOVE,
            itemId,
            pageId,
        );
    }

    static async updateSettings(payload: Record<string, unknown>): Promise<Record<string, unknown>> {
        const response = await permissionAwareApiClient.put<IBaseApiResponse<Record<string, unknown>>>(
            API_CONFIG.ENDPOINTS.ADMIN_NAVIGATION_SETTINGS_UPDATE,
            payload,
        );
        return response.data.data ?? {};
    }
}
