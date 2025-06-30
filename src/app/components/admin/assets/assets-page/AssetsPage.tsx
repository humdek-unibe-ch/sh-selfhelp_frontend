"use client";

import { useState } from 'react';
import { Stack, Group, Button, Text, Title } from '@mantine/core';
import { IconUpload, IconPhoto } from '@tabler/icons-react';
import { AssetsList } from '../assets-list/AssetsList';
import { UploadAssetModal } from '../upload-asset-modal/UploadAssetModal';

export function AssetsPage() {
  const [uploadModalOpened, setUploadModalOpened] = useState(false);

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
        
        <Button
          leftSection={<IconUpload size={16} />}
          onClick={() => setUploadModalOpened(true)}
        >
          Upload Asset
        </Button>
      </Group>

      {/* Assets List */}
      <AssetsList />

      {/* Upload Modal */}
      <UploadAssetModal
        opened={uploadModalOpened}
        onClose={() => setUploadModalOpened(false)}
      />
    </Stack>
  );
} 