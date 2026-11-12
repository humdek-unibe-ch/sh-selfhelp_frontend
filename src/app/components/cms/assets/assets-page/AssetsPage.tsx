/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
"use client";

import { useState } from 'react';
import { Stack, Button } from '@mantine/core';
import { IconUpload, IconTransferIn } from '@tabler/icons-react';
import { AssetsList } from '../assets-list/AssetsList';
import { AssetFormModal } from '../asset-form-modal/AssetFormModal';
import { ExportImportAssetsModal } from '../export-import-assets-modal/ExportImportAssetsModal';
import { useAuthUser } from '../../../../../hooks/useUserData';
import { PERMISSIONS } from '../../../../../types/auth/jwt-payload.types';

export function AssetsPage() {
  const [uploadModalOpened, setUploadModalOpened] = useState(false);
  // The folder the upload form opens on: set by a folder's "Upload here", null from the header button.
  const [uploadFolderId, setUploadFolderId] = useState<number | null>(null);
  const [exportImportOpened, setExportImportOpened] = useState(false);
  const [exportAssetIds, setExportAssetIds] = useState<number[]>([]);

  const { permissionChecker } = useAuthUser();
  const canRead = permissionChecker?.hasPermission(PERMISSIONS.ADMIN_ASSET_READ) ?? false;
  // Upload + import both create assets; export only reads.
  const canCreate = permissionChecker?.hasPermission(PERMISSIONS.ADMIN_ASSET_CREATE) ?? false;

  const openExportImport = (assetIds: number[]) => {
    setExportAssetIds(assetIds);
    setExportImportOpened(true);
  };

  const openUpload = (folderId: number | null) => {
    setUploadFolderId(folderId);
    setUploadModalOpened(true);
  };

  return (
    <Stack gap="lg">
      <AssetsList
        onExportSelected={canRead ? openExportImport : undefined}
        onUploadToFolder={canCreate ? openUpload : undefined}
        headerActions={
          <>
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
              onClick={() => openUpload(null)}
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
        defaultFolderId={uploadFolderId}
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
