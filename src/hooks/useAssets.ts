/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  AdminAssetApi,
  type IAssetsListResponse,
  type IAssetsListParams,
  type IAsset,
  type ICreateAssetRequest,
  type ICreateMultipleAssetsRequest,
  type IExportAssetsRequest
} from '../api/admin/asset.api';
import { REACT_QUERY_CONFIG } from '../config/react-query.config';

/**
 * Hook to fetch paginated assets
 *
 * `fresh: true` refetches on mount and window focus (staleTime 0) — used by
 * asset pickers (e.g. navigation logo) so uploads made in another tab or page
 * appear without a full browser refresh.
 */
export function useAssets(params: IAssetsListParams = {}, options: { fresh?: boolean } = {}) {
  return useQuery<IAssetsListResponse>({
    queryKey: ['assets', params],
    queryFn: () => AdminAssetApi.getAssets(params),
    staleTime: options.fresh ? 0 : REACT_QUERY_CONFIG.CACHE_TIERS.DEFAULT.staleTime,
    refetchOnMount: options.fresh ? 'always' : true,
    refetchOnWindowFocus: options.fresh ? true : false,
  });
}

/**
 * Hook to fetch asset details by ID
 */
export function useAssetDetails(assetId: number) {
  return useQuery<IAsset>({
    queryKey: ['assets', 'details', assetId],
    queryFn: () => AdminAssetApi.getAssetById(assetId),
    enabled: assetId > 0,
    staleTime: REACT_QUERY_CONFIG.CACHE_TIERS.DEFAULT.staleTime,
    refetchOnWindowFocus: false,
  });
}

/**
 * Hook to create/upload a new asset (single file)
 */
export function useCreateAsset() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (assetData: ICreateAssetRequest) => AdminAssetApi.createAsset(assetData),
    onSuccess: () => {
      // Invalidate and refetch assets list
      void queryClient.invalidateQueries({ queryKey: ['assets'] });
    },
  });
}

/**
 * Hook to create/upload multiple assets (multiple files)
 */
export function useCreateMultipleAssets() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (assetData: ICreateMultipleAssetsRequest) => AdminAssetApi.createMultipleAssets(assetData),
    onSuccess: () => {
      // Invalidate and refetch assets list
      void queryClient.invalidateQueries({ queryKey: ['assets'] });
    },
  });
}

/**
 * Hook to delete an asset
 */
export function useDeleteAsset() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (assetId: number) => AdminAssetApi.deleteAsset(assetId),
    onSuccess: () => {
      // Invalidate and refetch assets list
      void queryClient.invalidateQueries({ queryKey: ['assets'] });
    },
  });
}

/**
 * Hook to export assets as a zip bundle. Returns the blob for the caller to
 * trigger a browser download; does not touch the assets cache.
 */
export function useExportAssets() {
  return useMutation({
    mutationFn: (request: IExportAssetsRequest = {}) => AdminAssetApi.exportAssets(request),
  });
}

/**
 * Hook to import an asset zip bundle. Invalidates the assets list on success.
 */
export function useImportAssets() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ file, overwrite }: { file: File; overwrite?: boolean }) =>
      AdminAssetApi.importAssets(file, overwrite),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['assets'] });
    },
  });
}

 