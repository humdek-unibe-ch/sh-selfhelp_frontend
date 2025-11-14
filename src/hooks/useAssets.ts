import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  AdminAssetApi, 
  type IAssetsListResponse, 
  type IAssetsListParams, 
  type IAsset, 
  type ICreateAssetRequest,
  type ICreateMultipleAssetsRequest
} from '../api/admin/asset.api';
import { REACT_QUERY_CONFIG } from '../config/react-query.config';

/**
 * Hook to fetch paginated assets
 */
export function useAssets(params: IAssetsListParams = {}) {
  return useQuery<IAssetsListResponse>({
    queryKey: ['assets', params],
    queryFn: () => AdminAssetApi.getAssets(params),
    staleTime: REACT_QUERY_CONFIG.CACHE.staleTime,
    refetchOnWindowFocus: false,
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
    staleTime: REACT_QUERY_CONFIG.CACHE.staleTime,
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
      queryClient.invalidateQueries({ queryKey: ['assets'] });
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
      queryClient.invalidateQueries({ queryKey: ['assets'] });
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
      queryClient.invalidateQueries({ queryKey: ['assets'] });
    },
  });
} 