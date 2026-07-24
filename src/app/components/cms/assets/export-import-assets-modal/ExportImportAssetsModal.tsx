/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
"use client";

import { useState } from 'react';
import {
  Stack,
  Tabs,
  Text,
  Switch,
  Group,
  Paper,
  Badge,
  Alert,
  Button,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { Dropzone } from '@mantine/dropzone';
import {
  IconDownload,
  IconUpload,
  IconFileZip,
  IconAlertCircle,
  IconX,
  IconCloudUpload,
} from '@tabler/icons-react';
import { ModalWrapper } from '../../../shared/common/CustomModal/CustomModal';
import { useExportAssets, useImportAssets } from '../../../../../hooks/useAssets';
import { parseApiError } from '../../../../../utils/mutation-error-handler';

interface IExportImportAssetsModalProps {
  opened: boolean;
  onClose: () => void;
  /** When set, export is scoped to this folder; otherwise all visible assets. */
  folder?: string | null;
  /** Whether the user may import (needs `admin.asset.create`). Hides the Import tab when false. */
  canImport?: boolean;
}

/** Trigger a browser download for a blob under the given filename. */
function downloadBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function ExportImportAssetsModal({ opened, onClose, folder, canImport = true }: IExportImportAssetsModalProps) {
  const [tab, setTab] = useState<string | null>('export');
  const [importFile, setImportFile] = useState<File | null>(null);
  const [overwrite, setOverwrite] = useState(false);

  const exportMutation = useExportAssets();
  const importMutation = useImportAssets();

  const scoped = typeof folder === 'string' && folder.length > 0;

  const handleClose = () => {
    if (exportMutation.isPending || importMutation.isPending) return;
    setImportFile(null);
    setOverwrite(false);
    setTab('export');
    onClose();
  };

  const handleExport = async () => {
    try {
      const blob = await exportMutation.mutateAsync(scoped ? { folders: [folder as string] } : {});
      const stamp = new Date().toISOString().slice(0, 10);
      downloadBlob(blob, `assets-${scoped ? `${folder}-` : ''}${stamp}.zip`);
      notifications.show({ title: 'Success', message: 'Assets exported', color: 'green' });
      handleClose();
    } catch (error) {
      const { errorTitle, errorMessage } = parseApiError(error);
      notifications.show({ title: errorTitle, message: errorMessage, color: 'red' });
    }
  };

  const handleImport = async () => {
    if (!importFile) return;
    try {
      const result = await importMutation.mutateAsync({ file: importFile, overwrite });
      const failed = result.errors?.length ?? 0;
      if (failed === 0) {
        notifications.show({
          title: 'Success',
          message: `Imported ${result.imported} asset${result.imported === 1 ? '' : 's'}${result.skipped ? `, ${result.skipped} skipped` : ''}`,
          color: 'green',
        });
      } else {
        notifications.show({
          title: 'Partial import',
          message: `${result.imported} imported, ${result.skipped} skipped, ${failed} failed`,
          color: 'yellow',
        });
        result.errors.forEach((e) =>
          notifications.show({ title: `Failed: ${e.file}`, message: e.error, color: 'red', autoClose: false }),
        );
      }
      handleClose();
    } catch (error) {
      const { errorTitle, errorMessage } = parseApiError(error);
      notifications.show({ title: errorTitle, message: errorMessage, color: 'red' });
    }
  };

  const isExport = tab === 'export';
  const isPending = exportMutation.isPending || importMutation.isPending;

  return (
    <ModalWrapper
      opened={opened}
      onClose={handleClose}
      title="Export / Import Assets"
      size="lg"
      onCancel={handleClose}
      isLoading={isPending}
      customActions={
        isExport || !canImport ? (
          <Button leftSection={<IconDownload size={16} />} onClick={() => void handleExport()} loading={exportMutation.isPending}>
            Export {scoped ? `"${folder}"` : 'all'}
          </Button>
        ) : (
          <Button
            leftSection={<IconUpload size={16} />}
            onClick={() => void handleImport()}
            loading={importMutation.isPending}
            disabled={!importFile}
          >
            Import
          </Button>
        )
      }
    >
      <Tabs value={tab} onChange={setTab}>
        <Tabs.List mb="md">
          <Tabs.Tab value="export" leftSection={<IconDownload size={14} />}>
            Export
          </Tabs.Tab>
          {canImport && (
            <Tabs.Tab value="import" leftSection={<IconUpload size={14} />}>
              Import
            </Tabs.Tab>
          )}
        </Tabs.List>

        <Tabs.Panel value="export">
          <Stack gap="sm">
            <Alert icon={<IconAlertCircle size={16} />} color="blue" variant="light">
              <Text size="sm">
                {scoped
                  ? `Exports every asset in the "${folder}" folder as a zip bundle (files + manifest.json).`
                  : 'Exports every asset you can see as a zip bundle (files + manifest.json). The bundle can be imported into another SelfHelp instance.'}
              </Text>
            </Alert>
            <Paper withBorder p="md">
              <Group gap="sm">
                <IconFileZip size={24} />
                <div>
                  <Text size="sm" fw={500}>{scoped ? `Folder: ${folder}` : 'All assets'}</Text>
                  <Text size="xs" c="dimmed">Downloads a single .zip archive</Text>
                </div>
              </Group>
            </Paper>
          </Stack>
        </Tabs.Panel>

        <Tabs.Panel value="import">
          <Stack gap="sm">
            <Dropzone
              onDrop={(files) => setImportFile(files[0] ?? null)}
              accept={['application/zip', 'application/x-zip-compressed']}
              multiple={false}
              disabled={importMutation.isPending}
            >
              <Group justify="center" gap="xl" mih={100} style={{ pointerEvents: 'none' }}>
                <Dropzone.Accept>
                  <IconCloudUpload size={40} stroke={1.5} />
                </Dropzone.Accept>
                <Dropzone.Reject>
                  <IconX size={40} stroke={1.5} />
                </Dropzone.Reject>
                <Dropzone.Idle>
                  <IconFileZip size={40} stroke={1.5} />
                </Dropzone.Idle>
                <div>
                  <Text size="md" inline>Drop an asset .zip bundle here or click to select</Text>
                  <Text size="sm" c="dimmed" inline mt={7}>Only bundles produced by Export are supported</Text>
                </div>
              </Group>
            </Dropzone>

            {importFile && (
              <Paper withBorder p="sm">
                <Group justify="space-between">
                  <Group gap="sm">
                    <IconFileZip size={16} />
                    <Text size="sm">{importFile.name}</Text>
                    <Badge size="xs" variant="light">
                      {(importFile.size / 1024).toFixed(0)} KB
                    </Badge>
                  </Group>
                  <Button variant="subtle" color="red" size="xs" onClick={() => setImportFile(null)} disabled={importMutation.isPending}>
                    <IconX size={14} />
                  </Button>
                </Group>
              </Paper>
            )}

            <Switch
              label="Overwrite existing files"
              description="Replace assets that already exist with the same name"
              checked={overwrite}
              onChange={(e) => setOverwrite(e.currentTarget.checked)}
              disabled={importMutation.isPending}
            />
          </Stack>
        </Tabs.Panel>
      </Tabs>
    </ModalWrapper>
  );
}
