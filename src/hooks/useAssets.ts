/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { useQuery, useMutation, useQueryClient, type QueryClient } from '@tanstack/react-query';
import {
  AdminAssetApi,
  type IAssetsListResponse,
  type IAssetsListParams,
  type IAsset,
  type IBulkAssetGroupsRequest,
  type ICreateAssetRequest,
  type IExportAssetsRequest,
  type IFolderAccessRequest,
  type IUpdateAssetRequest,
} from '../api/admin/asset.api';
import { REACT_QUERY_CONFIG } from '../config/react-query.config';

const ASSETS_KEY = REACT_QUERY_CONFIG.QUERY_KEYS.ASSETS_ALL;
const ASSET_FOLDERS_KEY = [...ASSETS_KEY, 'folders'] as const;

/**
 * An asset write changes the asset lists and details, and also the image and
 * video pickers of the section inspector: those option lists are part of the
 * section details, read per request, so a cached section would keep offering a
 * deleted or renamed file. Every section detail is refreshed because the writer
 * cannot know which sections use the changed asset (only the open one is
 * refetched at once).
 */
function refreshAssetsAndPickers(queryClient: QueryClient): void {
  void queryClient.invalidateQueries({ queryKey: ASSETS_KEY });
  void queryClient.invalidateQueries({ queryKey: REACT_QUERY_CONFIG.QUERY_KEYS.SECTION_DETAILS_ALL });
}

/**
 * Hook to fetch paginated assets
 *
 * `fresh: true` refetches on mount and window focus (staleTime 0) — used by
 * asset pickers (e.g. navigation logo) so uploads made in another tab or page
 * appear without a full browser refresh.
 */
export function useAssets(params: IAssetsListParams = {}, options: { fresh?: boolean } = {}) {
  return useQuery<IAssetsListResponse>({
    queryKey: [...ASSETS_KEY, params],
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
    queryKey: [...ASSETS_KEY, 'details', assetId],
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
    onSuccess: () => refreshAssetsAndPickers(queryClient),
  });
}

/**
 * Hook to edit an asset (and optionally replace its file under the same uuid).
 */
export function useUpdateAsset() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ assetId, data }: { assetId: number; data: IUpdateAssetRequest }) =>
      AdminAssetApi.updateAsset(assetId, data),
    onSuccess: () => refreshAssetsAndPickers(queryClient),
  });
}

/**
 * Hook to add or remove groups on several assets at once. Groups decide who may
 * view an asset, so the pickers (which list what the caller may use) change too.
 */
export function useBulkAssetGroups() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: IBulkAssetGroupsRequest) => AdminAssetApi.bulkUpdateGroups(request),
    onSuccess: () => refreshAssetsAndPickers(queryClient),
  });
}

/**
 * Hook to move several assets into one folder. Folders do not change what a
 * picker offers, so only the asset caches refresh.
 */
export function useBulkMoveAssets() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ assetIds, folderId }: { assetIds: number[]; folderId: number | null }) =>
      AdminAssetApi.bulkMoveToFolder(assetIds, folderId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ASSETS_KEY });
    },
  });
}

/**
 * Hook to delete several assets at once.
 */
export function useBulkDeleteAssets() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (assetIds: number[]) => AdminAssetApi.bulkDeleteAssets(assetIds),
    onSuccess: () => refreshAssetsAndPickers(queryClient),
  });
}

/**
 * Asset folders (flat; build the tree from `parent_id`). Saves and deletes
 * return the full list, which replaces the cache directly.
 */
export function useAssetFolders() {
  return useQuery({
    queryKey: ASSET_FOLDERS_KEY,
    queryFn: () => AdminAssetApi.getFolders(),
    staleTime: REACT_QUERY_CONFIG.CACHE_TIERS.DEFAULT.staleTime,
  });
}

export function useSaveAssetFolder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ folder, folderId }: { folder: { name: string; parent_id: number | null }; folderId?: number }) =>
      AdminAssetApi.saveFolder(folder, folderId),
    onSuccess: (folders) => queryClient.setQueryData(ASSET_FOLDERS_KEY, folders),
  });
}

export function useDeleteAssetFolder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (folderId: number) => AdminAssetApi.deleteFolder(folderId),
    // Assets of deleted folders move to the top level: refresh lists too.
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ASSETS_KEY });
    },
  });
}

/**
 * Hook to apply who sees / who manages to every asset of a folder and below.
 * Groups decide who may view, so the pickers change too: refresh both.
 */
export function useSetAssetFolderAccess() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ folderId, access }: { folderId: number; access: IFolderAccessRequest }) =>
      AdminAssetApi.setFolderAccess(folderId, access),
    onSuccess: () => refreshAssetsAndPickers(queryClient),
  });
}

/**
 * Hook to delete an asset
 */
export function useDeleteAsset() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (assetId: number) => AdminAssetApi.deleteAsset(assetId),
    onSuccess: () => refreshAssetsAndPickers(queryClient),
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
 * Hook to import an asset zip bundle. Refreshes the asset lists and the
 * section pickers on success.
 */
export function useImportAssets() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (file: File) => AdminAssetApi.importAssets(file),
    onSuccess: () => refreshAssetsAndPickers(queryClient),
  });
}
