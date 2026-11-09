/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
"use client";

import { useState } from 'react';
import { Stack, Button } from '@mantine/core';
import { IconUpload, IconTransferIn, IconFolders } from '@tabler/icons-react';
import { AssetsList } from '../assets-list/AssetsList';
import { AssetFormModal } from '../asset-form-modal/AssetFormModal';
import { ExportImportAssetsModal } from '../export-import-assets-modal/ExportImportAssetsModal';
import { AssetFolderModal } from '../asset-folder-modal/AssetFolderModal';
import { useAuthUser } from '../../../../../hooks/useUserData';
import { PERMISSIONS } from '../../../../../types/auth/jwt-payload.types';

export function AssetsPage() {
  const [uploadModalOpened, setUploadModalOpened] = useState(false);
  const [exportImportOpened, setExportImportOpened] = useState(false);
  // undefined = closed, null = open on a new folder, id = open on that folder.
  const [folderModalId, setFolderModalId] = useState<number | null | undefined>(undefined);
  const [exportAssetIds, setExportAssetIds] = useState<number[]>([]);
  const [folderId, setFolderId] = useState<number | null>(null);

  const { permissionChecker } = useAuthUser();
  const canRead = permissionChecker?.hasPermission(PERMISSIONS.ADMIN_ASSET_READ) ?? false;
  // Upload + import both create assets; export only reads.
  const canCreate = permissionChecker?.hasPermission(PERMISSIONS.ADMIN_ASSET_CREATE) ?? false;
  const canUpdate = permissionChecker?.hasPermission(PERMISSIONS.ADMIN_ASSET_UPDATE) ?? false;

  const openExportImport = (assetIds: number[]) => {
    setExportAssetIds(assetIds);
    setExportImportOpened(true);
  };

  return (
    <Stack gap="lg">
      <AssetsList
        folderId={folderId}
        onFolderChange={setFolderId}
        onExportSelected={canRead ? openExportImport : undefined}
        onEditFolder={setFolderModalId}
        headerActions={
          <>
          {canUpdate && (
            <Button variant="default" leftSection={<IconFolders size={16} />} onClick={() => setFolderModalId(null)}>
              Folders
            </Button>
          )}
          {canRead && (
            <Button
              variant="default"
              leftSection={<IconTransferIn size={16} />}
              onClick={() => openExportImport([])}
            >
              Export / Import
            </Button>
          )}
          {canCreate && (
            <Button
              leftSection={<IconUpload size={16} />}
              onClick={() => setUploadModalOpened(true)}
            >
              Upload Asset
            </Button>
          )}
          </>
        }
      />

      <AssetFormModal
        opened={uploadModalOpened}
        onClose={() => setUploadModalOpened(false)}
        defaultFolderId={folderId}
      />

      <AssetFolderModal
        opened={folderModalId !== undefined}
        initialFolderId={folderModalId}
        onClose={() => setFolderModalId(undefined)}
      />

      {/* Export / Import Modal — import tab gated on create permission. */}
      <ExportImportAssetsModal
        opened={exportImportOpened}
        onClose={() => setExportImportOpened(false)}
        assetIds={exportAssetIds}
        canImport={canCreate}
      />
    </Stack>
  );
}
