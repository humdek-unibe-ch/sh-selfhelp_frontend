/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
/**
 * Admin API for first-class CMS apps (ID-stable mutations).
 *
 * @module api/admin/cms-app.api
 */

import { API_CONFIG } from '../../config/api.config';
import { permissionAwareApiClient } from '../base.api';
import { type IBaseApiResponse } from '../../types/responses/common/response-envelope.types';
import {
    type IAssignCmsAppPageRequest,
    type IChangeCmsAppPageRoleRequest,
    type ICreateCmsAppShellRequest,
    type ICmsAppDetail,
    type ICmsAppSummary,
    type IScaffoldCmsAppRequest,
    type IScaffoldCmsAppResult,
    type IUpdateCmsAppRequest,
} from '../../types/requests/admin/cms-app.types';

export const AdminCmsAppApi = {
    async list(): Promise<ICmsAppSummary[]> {
        const response = await permissionAwareApiClient.get<IBaseApiResponse<ICmsAppSummary[]>>(
            API_CONFIG.ENDPOINTS.ADMIN_CMS_APPS_LIST
        );
        return response.data.data;
    },

    async create(payload: ICreateCmsAppShellRequest): Promise<ICmsAppDetail> {
        const response = await permissionAwareApiClient.post<IBaseApiResponse<ICmsAppDetail>>(
            API_CONFIG.ENDPOINTS.ADMIN_CMS_APPS_CREATE,
            payload
        );
        return response.data.data;
    },

    async getById(id: number): Promise<ICmsAppDetail> {
        const response = await permissionAwareApiClient.get<IBaseApiResponse<ICmsAppDetail>>(
            API_CONFIG.ENDPOINTS.ADMIN_CMS_APPS_GET,
            id
        );
        return response.data.data;
    },

    async getBySlug(slug: string): Promise<ICmsAppDetail> {
        const response = await permissionAwareApiClient.get<IBaseApiResponse<ICmsAppDetail>>(
            API_CONFIG.ENDPOINTS.ADMIN_CMS_APPS_BY_SLUG,
            slug
        );
        return response.data.data;
    },

    async update(id: number, payload: IUpdateCmsAppRequest): Promise<ICmsAppDetail> {
        const response = await permissionAwareApiClient.patch<IBaseApiResponse<ICmsAppDetail>>(
            API_CONFIG.ENDPOINTS.ADMIN_CMS_APPS_UPDATE,
            payload,
            id
        );
        return response.data.data;
    },

    async remove(id: number): Promise<void> {
        await permissionAwareApiClient.delete(API_CONFIG.ENDPOINTS.ADMIN_CMS_APPS_DELETE, id);
    },

    async assignPage(id: number, payload: IAssignCmsAppPageRequest): Promise<ICmsAppDetail> {
        const response = await permissionAwareApiClient.post<IBaseApiResponse<ICmsAppDetail>>(
            API_CONFIG.ENDPOINTS.ADMIN_CMS_APPS_ASSIGN_PAGE,
            payload,
            id
        );
        return response.data.data;
    },

    async changePageRole(
        id: number,
        pageId: number,
        payload: IChangeCmsAppPageRoleRequest
    ): Promise<ICmsAppDetail> {
        const response = await permissionAwareApiClient.patch<IBaseApiResponse<ICmsAppDetail>>(
            API_CONFIG.ENDPOINTS.ADMIN_CMS_APPS_CHANGE_PAGE_ROLE,
            payload,
            id,
            pageId
        );
        return response.data.data;
    },

    async unassignPage(id: number, pageId: number): Promise<ICmsAppDetail> {
        const response = await permissionAwareApiClient.delete<IBaseApiResponse<ICmsAppDetail>>(
            API_CONFIG.ENDPOINTS.ADMIN_CMS_APPS_UNASSIGN_PAGE,
            id,
            pageId
        );
        return response.data.data;
    },

    async scaffold(id: number, payload: IScaffoldCmsAppRequest): Promise<IScaffoldCmsAppResult> {
        const response = await permissionAwareApiClient.post<IBaseApiResponse<IScaffoldCmsAppResult>>(
            API_CONFIG.ENDPOINTS.ADMIN_CMS_APPS_SCAFFOLD,
            payload,
            id
        );
        return response.data.data;
    },
};
