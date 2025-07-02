import { apiClient } from '../base.api';
import { API_CONFIG } from '../../config/api.config';
import type { IBaseApiResponse } from '../../types/responses/common/response-envelope.types';

export interface IAsset {
  id: number;
  file_name: string;
  original_name?: string;
  file_path: string;
  asset_type?: string;
  folder: string | null;    
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

export interface IMultipleAssetsUploadResponse {
  success_count: number;
  error_count: number;
  total_count: number;
  uploaded_assets: IAsset[];
  errors: {
    file_name: string;
    error: string;
  }[];
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

    const url = `${API_CONFIG.ENDPOINTS.ADMIN_ASSETS_GET_ALL}${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
    const response = await apiClient.get<IBaseApiResponse<IAssetsListResponse>>(url);
    return response.data.data;
  },

  /**
   * Get single asset details by ID
   */
  async getAssetById(assetId: number): Promise<IAsset> {
    const response = await apiClient.get<IBaseApiResponse<IAsset>>(API_CONFIG.ENDPOINTS.ADMIN_ASSETS_GET_ONE(assetId));
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

    const response = await apiClient.post<IBaseApiResponse<IAsset>>(
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

    const response = await apiClient.post<IBaseApiResponse<IMultipleAssetsUploadResponse>>(
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
    const response = await apiClient.delete(API_CONFIG.ENDPOINTS.ADMIN_ASSETS_DELETE(assetId));
    return { success: response.status === 204 || response.status === 200 };
  },
}; 