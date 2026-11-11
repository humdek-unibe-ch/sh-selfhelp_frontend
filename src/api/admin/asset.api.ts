/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { permissionAwareApiClient } from '../base.api';
import { API_CONFIG } from '../../config/api.config';
import type { IBaseApiResponse } from '../../types/responses/common/response-envelope.types';

interface IAssetGroupRef {
  id: number;
  name: string;
}

export interface IAssetFolder {
  id: number;
  name: string;
  parent_id: number | null;
  asset_count: number;
}

/**
 * An asset. `uuid` is also the stored file name; fetch the bytes only via
 * `url` (through `getAssetUrl`). No `groups` = public;
 * `roles` may manage it in the CMS.
 */
export interface IAsset {
  id: number;
  uuid: string;
  name: string | null;
  url: string;
  asset_type?: string;
  mime_type: string | null;
  size: number | null;
  alt: string | null;
  folder_id: number | null;
  roles: IAssetGroupRef[];
  groups: IAssetGroupRef[];
  created_at: string;
  updated_at: string;
}

export interface IAssetsListResponse {
  assets: IAsset[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export interface IAssetsListParams {
  page?: number;
  pageSize?: number;
  search?: string;
  group_id?: number;
  /** 0 = only assets in no folder. */
  folder_id?: number;
}

/**
 * Fields shared by create and edit; undefined = default (create) / unchanged
 * (edit). `group_ids: []` = public. `role_ids` undefined on create = the
 * uploader's roles. `folder_id: null` = top level.
 */
interface IAssetFields {
  name?: string;
  alt?: string;
  group_ids?: number[];
  role_ids?: number[];
  folder_id?: number | null;
}

export interface ICreateAssetRequest extends IAssetFields {
  file: File;
}

export interface ICreateMultipleAssetsRequest extends IAssetFields {
  files: File[];
}

export interface IUpdateAssetRequest extends IAssetFields {
  file?: File;
}

export interface IBulkAssetGroupsRequest {
  asset_ids: number[];
  group_ids: number[];
  mode: 'add' | 'remove';
}

interface IMultipleAssetsUploadResponse {
  successful_uploads: number;
  failed_uploads: number;
  total_files: number;
  uploaded: IAsset[];
  errors: {
    file: string;
    error: string;
  }[];
}

export interface IExportAssetsRequest {
  asset_ids?: number[];
}

export interface IImportAssetsResponse {
  imported: number;
  skipped: number;
  errors: { file: string; error: string }[];
}

const MULTIPART = { headers: { 'Content-Type': 'multipart/form-data' } };

/**
 * Append the shared create/edit fields. Id lists are sent comma-separated
 * because multipart cannot express an empty list: an empty string means
 * "none", an absent field means "default" / "unchanged".
 */
function appendAssetFields(formData: FormData, fields: IAssetFields): void {
  if (fields.name !== undefined) formData.append('name', fields.name);
  if (fields.alt !== undefined) formData.append('alt', fields.alt);
  if (fields.group_ids !== undefined) formData.append('group_ids', fields.group_ids.join(','));
  if (fields.role_ids !== undefined) formData.append('role_ids', fields.role_ids.join(','));
  if (fields.folder_id !== undefined) formData.append('folder_id', fields.folder_id ? String(fields.folder_id) : '');
}

export const AdminAssetApi = {
  /**
   * Get a paginated list of the assets the caller can read
   */
  async getAssets(params: IAssetsListParams = {}): Promise<IAssetsListResponse> {
    const query: Record<string, string> = {};
    if (params.page) query.page = params.page.toString();
    if (params.pageSize) query.pageSize = params.pageSize.toString();
    if (params.search) query.search = params.search;
    if (params.group_id) query.group_id = params.group_id.toString();
    if (params.folder_id !== undefined) query.folder_id = params.folder_id.toString();

    const response = await permissionAwareApiClient.get<IBaseApiResponse<IAssetsListResponse>>(
      API_CONFIG.ENDPOINTS.ADMIN_ASSETS_GET_ALL,
      { params: query }
    );
    return response.data.data;
  },

  /**
   * Get single asset details by ID
   */
  async getAssetById(assetId: number): Promise<IAsset> {
    const response = await permissionAwareApiClient.get<IBaseApiResponse<IAsset>>(API_CONFIG.ENDPOINTS.ADMIN_ASSETS_GET_ONE, assetId);
    return response.data.data;
  },

  /**
   * Upload a new asset (single file). Stored under a fresh uuid — never
   * overwrites an existing file with the same name.
   */
  async createAsset(assetData: ICreateAssetRequest): Promise<IAsset> {
    const formData = new FormData();
    formData.append('file', assetData.file);
    appendAssetFields(formData, assetData);

    const response = await permissionAwareApiClient.post<IBaseApiResponse<IAsset>>(
      API_CONFIG.ENDPOINTS.ADMIN_ASSETS_CREATE,
      formData,
      MULTIPART
    );
    return response.data.data;
  },

  /**
   * Upload several assets in one request
   */
  async createMultipleAssets(assetData: ICreateMultipleAssetsRequest): Promise<IMultipleAssetsUploadResponse> {
    const formData = new FormData();
    assetData.files.forEach((file) => {
      formData.append('files[]', file);
    });
    appendAssetFields(formData, assetData);

    const response = await permissionAwareApiClient.post<IBaseApiResponse<IMultipleAssetsUploadResponse>>(
      API_CONFIG.ENDPOINTS.ADMIN_ASSETS_CREATE,
      formData,
      MULTIPART
    );
    return response.data.data;
  },

  /**
   * Edit an asset; only the fields sent change. A `file` replaces the bytes
   * under the same uuid, so every page using the asset shows the new file.
   */
  async updateAsset(assetId: number, assetData: IUpdateAssetRequest): Promise<IAsset> {
    const formData = new FormData();
    if (assetData.file) formData.append('file', assetData.file);
    appendAssetFields(formData, assetData);

    const response = await permissionAwareApiClient.post<IBaseApiResponse<IAsset>>(
      API_CONFIG.ENDPOINTS.ADMIN_ASSETS_UPDATE,
      formData,
      assetId,
      MULTIPART
    );
    return response.data.data;
  },

  /**
   * Add or remove groups on several assets at once
   */
  async bulkUpdateGroups(request: IBulkAssetGroupsRequest): Promise<{ updated: number }> {
    const response = await permissionAwareApiClient.post<IBaseApiResponse<{ updated: number }>>(
      API_CONFIG.ENDPOINTS.ADMIN_ASSETS_BULK_GROUPS,
      request
    );
    return response.data.data;
  },

  /**
   * Move several assets into one folder (null = the top level)
   */
  async bulkMoveToFolder(assetIds: number[], folderId: number | null): Promise<{ moved: number }> {
    const response = await permissionAwareApiClient.post<IBaseApiResponse<{ moved: number }>>(
      API_CONFIG.ENDPOINTS.ADMIN_ASSETS_BULK_FOLDER,
      { asset_ids: assetIds, folder_id: folderId }
    );
    return response.data.data;
  },

  /**
   * Delete several assets at once
   */
  async bulkDeleteAssets(assetIds: number[]): Promise<{ deleted: number }> {
    const response = await permissionAwareApiClient.post<IBaseApiResponse<{ deleted: number }>>(
      API_CONFIG.ENDPOINTS.ADMIN_ASSETS_BULK_DELETE,
      { asset_ids: assetIds }
    );
    return response.data.data;
  },

  async getFolders(): Promise<IAssetFolder[]> {
    const response = await permissionAwareApiClient.get<IBaseApiResponse<IAssetFolder[]>>(API_CONFIG.ENDPOINTS.ADMIN_ASSET_FOLDERS_GET_ALL);
    return response.data.data;
  },

  /** Create (no `folderId`) or rename/move a folder; returns all folders. */
  async saveFolder(folder: { name: string; parent_id: number | null }, folderId?: number): Promise<IAssetFolder[]> {
    const response = folderId
      ? await permissionAwareApiClient.put<IBaseApiResponse<IAssetFolder[]>>(API_CONFIG.ENDPOINTS.ADMIN_ASSET_FOLDERS_UPDATE, folder, folderId)
      : await permissionAwareApiClient.post<IBaseApiResponse<IAssetFolder[]>>(API_CONFIG.ENDPOINTS.ADMIN_ASSET_FOLDERS_CREATE, folder);
    return response.data.data;
  },

  /** Delete a folder and its subfolders; their assets move to the top level. */
  async deleteFolder(folderId: number): Promise<IAssetFolder[]> {
    const response = await permissionAwareApiClient.delete<IBaseApiResponse<IAssetFolder[]>>(API_CONFIG.ENDPOINTS.ADMIN_ASSET_FOLDERS_DELETE, folderId);
    return response.data.data;
  },

  /**
   * Delete asset
   */
  async deleteAsset(assetId: number): Promise<{ success: boolean }> {
    const response = await permissionAwareApiClient.delete(API_CONFIG.ENDPOINTS.ADMIN_ASSETS_DELETE, assetId);
    return { success: response.status === 204 || response.status === 200 };
  },

  /**
   * Export assets as a downloadable zip bundle (files + manifest.json).
   * Omitting/empty `asset_ids` exports every asset the caller can read.
   * Returns the raw zip blob for the caller to trigger a browser download.
   */
  async exportAssets(request: IExportAssetsRequest = {}): Promise<Blob> {
    const body = request.asset_ids && request.asset_ids.length > 0 ? { asset_ids: request.asset_ids } : {};
    const response = await permissionAwareApiClient.post<Blob>(
      API_CONFIG.ENDPOINTS.ADMIN_ASSETS_EXPORT,
      body,
      { responseType: 'blob' }
    );
    return response.data;
  },

  /**
   * Import an asset zip bundle previously produced by `exportAssets`. Never
   * overwrites: entries whose uuid already exists are skipped. Per-file
   * failures come back in `errors[]`; the request still succeeds.
   */
  async importAssets(file: File): Promise<IImportAssetsResponse> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await permissionAwareApiClient.post<IBaseApiResponse<IImportAssetsResponse>>(
      API_CONFIG.ENDPOINTS.ADMIN_ASSETS_IMPORT,
      formData,
      MULTIPART
    );
    return response.data.data;
  },
};
