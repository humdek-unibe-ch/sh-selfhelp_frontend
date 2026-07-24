/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
"use client";

import { useState } from 'react';
import { Stack, Group, Button, Text, Title } from '@mantine/core';
import { IconUpload, IconPhoto, IconTransferIn } from '@tabler/icons-react';
import { AssetsList } from '../assets-list/AssetsList';
import { UploadAssetModal } from '../upload-asset-modal/UploadAssetModal';
import { ExportImportAssetsModal } from '../export-import-assets-modal/ExportImportAssetsModal';
import { useAuthUser } from '../../../../../hooks/useUserData';
import { PERMISSIONS } from '../../../../../types/auth/jwt-payload.types';

export function AssetsPage() {
  const [uploadModalOpened, setUploadModalOpened] = useState(false);
  const [exportImportOpened, setExportImportOpened] = useState(false);

  const { permissionChecker } = useAuthUser();
  const canRead = permissionChecker?.hasPermission(PERMISSIONS.ADMIN_ASSET_READ) ?? false;
  // Upload + import both create assets; export only reads.
  const canCreate = permissionChecker?.hasPermission(PERMISSIONS.ADMIN_ASSET_CREATE) ?? false;

  return (
    <Stack gap="lg">
      {/* Header */}
      <Group justify="space-between" align="center">
        <div>
          <Group gap="sm" align="center">
            <IconPhoto size={24} />
            <Title order={2}>Assets Management</Title>
          </Group>
          <Text size="sm" c="dimmed" mt={4}>
            Upload, manage, and organize your media files and documents
          </Text>
        </div>

        <Group gap="sm">
          {canRead && (
            <Button
              variant="default"
              leftSection={<IconTransferIn size={16} />}
              onClick={() => setExportImportOpened(true)}
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
        </Group>
      </Group>

      {/* Assets List */}
      <AssetsList />

      {/* Upload Modal */}
      <UploadAssetModal
        opened={uploadModalOpened}
        onClose={() => setUploadModalOpened(false)}
      />

      {/* Export / Import Modal — import tab gated on create permission. */}
      <ExportImportAssetsModal
        opened={exportImportOpened}
        onClose={() => setExportImportOpened(false)}
        canImport={canCreate}
      />
    </Stack>
  );
}
