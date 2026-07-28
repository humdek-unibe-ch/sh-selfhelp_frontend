/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { permissionAwareApiClient } from '../base.api';
import { API_CONFIG } from '../../config/api.config';
import type { IBaseApiResponse } from '../../types/responses/common/response-envelope.types';

export interface IAsset {
  id: number;
  file_name: string;
  original_name?: string;
  /**
   * Logical key only (`uploads/assets/<folder>/<name>`) — NOT fetchable since
   * core 0.1.41 moved files out of the document root. Use it for display,
   * identity and dedupe; use `url` to fetch bytes.
   */
  file_path: string;
  /**
   * The ACL-enforced delivery route (`/cms-api/v1/assets/<folder>/<name>`) and
   * the only way to fetch the bytes. Pass through `getAssetUrl`.
   */
  url: string;
  asset_type?: string;
  folder: string | null;
}

/** A folder and whether everyone (incl. anonymous callers) may read it. */
export interface IAssetFolder {
  folder: string;
  is_open_access: boolean;
}

export interface IAssetFoldersResponse {
  folders: IAssetFolder[];
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
  sort?: string;
  sortDirection?: 'asc' | 'desc';
  folder?: string;
}

export interface ICreateAssetRequest {
  file: File;
  folder?: string;
  file_name?: string;
  overwrite?: boolean;
}

export interface ICreateMultipleAssetsRequest {
  files: File[];
  folder?: string;
  file_names?: string[];
  overwrite?: boolean;
}

// Removed unused export - IMultipleAssetsUploadResponse is available internally
interface IMultipleAssetsUploadResponse {
  successful_uploads: number;
  failed_uploads: number;
  total_files: number;
  uploaded: IAsset[];
  errors: {
    file_name: string;
    error: string;
  }[];
}

/**
 * Body for exporting assets as a zip bundle. Omitting/empty `folders` exports
 * all readable folders. Response is a binary zip blob, not the JSON envelope.
 */
export interface IExportAssetsRequest {
  folders?: string[];
}

/** Result of importing an asset zip bundle (per-file errors don't fail the request). */
export interface IImportAssetsResponse {
  imported: number;
  skipped: number;
  errors: { file: string; error: string }[];
}

export const AdminAssetApi = {
  /**
   * Get paginated list of assets with search and sorting
   */
  async getAssets(params: IAssetsListParams = {}): Promise<IAssetsListResponse> {
    const searchParams = new URLSearchParams();
    
    if (params.page) searchParams.append('page', params.page.toString());
    if (params.pageSize) searchParams.append('pageSize', params.pageSize.toString());
    if (params.search) searchParams.append('search', params.search);
    if (params.sort) searchParams.append('sort', params.sort);
    if (params.sortDirection) searchParams.append('sortDirection', params.sortDirection);
    if (params.folder) searchParams.append('folder', params.folder);

    const response = await permissionAwareApiClient.get<IBaseApiResponse<IAssetsListResponse>>(
      API_CONFIG.ENDPOINTS.ADMIN_ASSETS_GET_ALL,
      { params: Object.fromEntries(searchParams) }
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
   * Create/upload a new asset (single file)
   */
  async createAsset(assetData: ICreateAssetRequest): Promise<IAsset> {
    const formData = new FormData();
    formData.append('file', assetData.file);
    
    if (assetData.folder) {
      formData.append('folder', assetData.folder);
    }
    if (assetData.file_name) {
      formData.append('file_name', assetData.file_name);
    }
    if (assetData.overwrite !== undefined) {
      formData.append('overwrite', assetData.overwrite.toString());
    }

    const response = await permissionAwareApiClient.post<IBaseApiResponse<IAsset>>(
      API_CONFIG.ENDPOINTS.ADMIN_ASSETS_CREATE, 
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data.data;
  },

  /**
   * Create/upload multiple assets (multiple files)
   */
  async createMultipleAssets(assetData: ICreateMultipleAssetsRequest): Promise<IMultipleAssetsUploadResponse> {
    const formData = new FormData();
    
    // Append all files
    assetData.files.forEach((file) => {
      formData.append('files[]', file);
    });
    
    if (assetData.folder) {
      formData.append('folder', assetData.folder);
    }
    
    // Append custom file names if provided
    if (assetData.file_names && assetData.file_names.length > 0) {
      assetData.file_names.forEach((fileName) => {
        formData.append('file_names[]', fileName);
      });
    }
    
    if (assetData.overwrite !== undefined) {
      formData.append('overwrite', assetData.overwrite.toString());
    }

    const response = await permissionAwareApiClient.post<IBaseApiResponse<IMultipleAssetsUploadResponse>>(
      API_CONFIG.ENDPOINTS.ADMIN_ASSETS_CREATE, 
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
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
   * List every asset folder with its open-access flag.
   */
  async getFolders(): Promise<IAssetFoldersResponse> {
    const response = await permissionAwareApiClient.get<IBaseApiResponse<IAssetFoldersResponse>>(
      API_CONFIG.ENDPOINTS.ADMIN_ASSETS_FOLDERS_GET
    );
    return response.data.data;
  },

  /**
   * Toggle a folder's open-access (public read) flag. Grants read only — it
   * never grants `manage`; uploading and deleting still follow group ACLs.
   * 404s if the folder does not exist (folders are created by the first upload).
   */
  async setFolderOpenAccess(folder: string, isOpenAccess: boolean): Promise<IAssetFolder> {
    const response = await permissionAwareApiClient.put<IBaseApiResponse<IAssetFolder>>(
      API_CONFIG.ENDPOINTS.ADMIN_ASSETS_FOLDER_OPEN_ACCESS_UPDATE,
      { is_open_access: isOpenAccess },
      folder
    );
    return response.data.data;
  },

  /**
   * Export assets as a downloadable zip bundle (binary files + manifest.json).
   * Omitting/empty `folders` exports every folder the caller can read.
   * Returns the raw zip blob for the caller to trigger a browser download.
   */
  async exportAssets(request: IExportAssetsRequest = {}): Promise<Blob> {
    const body = request.folders && request.folders.length > 0 ? { folders: request.folders } : {};
    const response = await permissionAwareApiClient.post<Blob>(
      API_CONFIG.ENDPOINTS.ADMIN_ASSETS_EXPORT,
      body,
      { responseType: 'blob' }
    );
    return response.data;
  },

  /**
   * Import an asset zip bundle previously produced by `exportAssets`.
   * Per-file failures come back in `errors[]`; the request still succeeds.
   */
  async importAssets(file: File, overwrite = false): Promise<IImportAssetsResponse> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('overwrite', overwrite.toString());

    const response = await permissionAwareApiClient.post<IBaseApiResponse<IImportAssetsResponse>>(
      API_CONFIG.ENDPOINTS.ADMIN_ASSETS_IMPORT,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data.data;
  },
}; 