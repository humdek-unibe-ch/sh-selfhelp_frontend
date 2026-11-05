/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
"use client";

import { useState } from 'react';
import {
  Stack,
  Select,
  TextInput,
  Textarea,
  MultiSelect,
  Group,
  Text,
  Paper,
  Badge,
  Button,
  Alert,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { Dropzone, type FileWithPath } from '@mantine/dropzone';
import { IconCloudUpload, IconFile, IconX, IconReplace, IconWorld } from '@tabler/icons-react';
import { ModalWrapper } from '../../../shared/common/CustomModal/CustomModal';
import { useAssetFolders, useCreateAsset, useCreateMultipleAssets, useUpdateAsset } from '../../../../../hooks/useAssets';
import { useGroups } from '../../../../../hooks/useGroups';
import { useRoles } from '../../../../../hooks/useRoles';
import type { IAsset } from '../../../../../api/admin/asset.api';
import { parseApiError } from '../../../../../utils/mutation-error-handler';
import { assetLabel, folderOptions, formatFileSize } from '../assets.utils';

interface IAssetFormModalProps {
  opened: boolean;
  onClose: () => void;
  asset?: IAsset | null;
  defaultFolderId?: number | null;
}

/**
 * Upload (one or more files) or edit one asset. No groups = public; no roles
 * picked on upload = the uploader's roles. Edit can replace the file under the
 * same uuid.
 */
export function AssetFormModal({ opened, onClose, asset, defaultFolderId = null }: IAssetFormModalProps) {
  const isEdit = !!asset;
  const createAsset = useCreateAsset();
  const createMultiple = useCreateMultipleAssets();
  const updateAsset = useUpdateAsset();
  const { data: groupsData } = useGroups({ pageSize: 1000 });
  const groups = groupsData?.groups ?? [];
  const { data: rolesData } = useRoles({ pageSize: 1000 });
  const { data: folders = [] } = useAssetFolders();

  const [files, setFiles] = useState<FileWithPath[]>([]);
  const [name, setName] = useState('');
  const [alt, setAlt] = useState('');
  const [groupIds, setGroupIds] = useState<string[]>([]);
  const [roleIds, setRoleIds] = useState<string[]>([]);
  const [folderId, setFolderId] = useState<string | null>(null);

  // Reset the form whenever the modal opens or switches asset (React's
  // documented alternative to a state-syncing effect).
  const resetKey = opened ? `open-${asset?.id ?? 'new'}` : 'closed';
  const [prevResetKey, setPrevResetKey] = useState<string | null>(null);
  if (prevResetKey !== resetKey) {
    setPrevResetKey(resetKey);
    setFiles([]);
    setName(asset?.name ?? '');
    setAlt(asset?.alt ?? '');
    setGroupIds((asset?.groups ?? []).map((group) => String(group.id)));
    setRoleIds((asset?.roles ?? []).map((role) => String(role.id)));
    const initialFolderId = asset ? asset.folder_id : defaultFolderId;
    setFolderId(initialFolderId ? String(initialFolderId) : null);
  }

  const groupOptions = groups.map((group) => ({
    value: String(group.id),
    label: group.name,
  }));

  const isPending = createAsset.isPending || createMultiple.isPending || updateAsset.isPending;
  const hasMultipleFiles = files.length > 1;

  const handleDrop = (dropped: FileWithPath[]) => {
    setFiles(isEdit ? dropped.slice(0, 1) : [...files, ...dropped]);
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const showError = (error: unknown) => {
    const { errorTitle, errorMessage } = parseApiError(error);
    notifications.show({ title: errorTitle, message: errorMessage, color: 'red' });
  };

  const selectedGroupIds = groupIds.map(Number);
  // On create, no roles picked = the uploader's roles (field omitted).
  const selectedRoleIds = isEdit || roleIds.length > 0 ? roleIds.map(Number) : undefined;
  const selectedFolderId = folderId ? Number(folderId) : null;

  const handleCreate = async () => {
    if (files.length === 0) return;
    try {
      if (files.length === 1) {
        await createAsset.mutateAsync({
          file: files[0],
          name: name.trim() || undefined,
          alt: alt.trim() || undefined,
          group_ids: selectedGroupIds,
          role_ids: selectedRoleIds,
          folder_id: selectedFolderId,
        });
        notifications.show({ title: 'Success', message: 'Asset uploaded', color: 'green' });
      } else {
        const result = await createMultiple.mutateAsync({
          files,
          alt: alt.trim() || undefined,
          group_ids: selectedGroupIds,
          role_ids: selectedRoleIds,
          folder_id: selectedFolderId,
        });
        notifications.show({
          title: result.failed_uploads === 0 ? 'Success' : 'Partial upload',
          message: `${result.successful_uploads} uploaded${result.failed_uploads ? `, ${result.failed_uploads} failed` : ''}`,
          color: result.failed_uploads === 0 ? 'green' : 'yellow',
        });
        result.errors.forEach((error) =>
          notifications.show({ title: `Failed: ${error.file}`, message: error.error, color: 'red', autoClose: false }),
        );
      }
      onClose();
    } catch (error) {
      showError(error);
    }
  };

  const handleUpdate = async () => {
    if (!asset) return;
    try {
      await updateAsset.mutateAsync({
        assetId: asset.id,
        data: {
          file: files[0],
          name: name.trim() || undefined,
          alt: alt.trim(),
          group_ids: selectedGroupIds,
          role_ids: selectedRoleIds,
          folder_id: selectedFolderId,
        },
      });
      notifications.show({
        title: 'Success',
        message: files.length > 0 ? 'Asset updated and file replaced' : 'Asset updated',
        color: 'green',
      });
      onClose();
    } catch (error) {
      showError(error);
    }
  };

  return (
    <ModalWrapper
      opened={opened}
      onClose={() => !isPending && onClose()}
      title={isEdit ? `Edit asset: ${assetLabel(asset)}` : 'Upload assets'}
      size="lg"
      onSave={isEdit ? undefined : () => void handleCreate()}
      onUpdate={isEdit ? () => void handleUpdate() : undefined}
      saveLabel={hasMultipleFiles ? `Upload ${files.length} assets` : 'Upload asset'}
      updateLabel="Save asset"
      isLoading={isPending}
      disabled={!isEdit && files.length === 0}
      closeOnClickOutside={!isPending}
      closeOnEscape={!isPending}
    >
      <Stack gap="md">
        <Dropzone
          onDrop={handleDrop}
          multiple={!isEdit}
          disabled={isPending}
          aria-label={isEdit ? 'Choose a replacement file' : 'Choose files to upload'}
        >
          <Group justify="center" gap="lg" mih={isEdit ? 70 : 110} style={{ pointerEvents: 'none' }}>
            <Dropzone.Reject>
              <IconX size={40} stroke={1.5} />
            </Dropzone.Reject>
            <Dropzone.Idle>
              {isEdit ? <IconReplace size={36} stroke={1.5} /> : <IconCloudUpload size={44} stroke={1.5} />}
            </Dropzone.Idle>
            <div>
              <Text size="md" inline>
                {isEdit ? 'Drop a file here to replace the current one (optional)' : 'Drag files here or click to select'}
              </Text>
              <Text size="sm" c="dimmed" inline mt={7} display="block">
                {isEdit
                  ? 'The asset keeps its address, so every page using it shows the new file.'
                  : 'Each upload is named by its own generated id, so files never overwrite each other.'}
              </Text>
            </div>
          </Group>
        </Dropzone>

        {files.length > 0 && (
          <Stack gap="xs">
            {files.map((file, index) => (
              <Paper key={`${file.name}-${index}`} withBorder p="sm">
                <Group justify="space-between" wrap="nowrap">
                  <Group gap="sm" wrap="nowrap" style={{ minWidth: 0 }}>
                    <IconFile size={16} aria-hidden />
                    <Text size="sm" truncate>{file.name}</Text>
                    <Badge size="xs" variant="light">{formatFileSize(file.size)}</Badge>
                  </Group>
                  <Button
                    variant="subtle"
                    color="red"
                    size="xs"
                    onClick={() => removeFile(index)}
                    disabled={isPending}
                    aria-label={`Remove ${file.name}`}
                  >
                    <IconX size={14} />
                  </Button>
                </Group>
              </Paper>
            ))}
          </Stack>
        )}

        {!hasMultipleFiles && (
          <TextInput
            label="Name"
            description={
              isEdit
                ? `Helps you find the asset. The file itself is named ${asset.uuid}.`
                : 'Helps you find the asset. Leave empty to use the file name; the stored file is named by its id.'
            }
            placeholder={files[0]?.name ?? asset?.name ?? ''}
            value={name}
            onChange={(event) => setName(event.currentTarget.value)}
            disabled={isPending}
            maxLength={255}
          />
        )}

        <Textarea
          label="Default alt text"
          description="Describes the image for screen readers. Used on every page where this image's section leaves its own Alt empty; a section's Alt overrides it on that page only."
          value={alt}
          onChange={(event) => setAlt(event.currentTarget.value)}
          disabled={isPending}
          maxLength={500}
          autosize
          minRows={2}
        />

        <Select
          label="Folder"
          description="Only for organising your assets; it does not change who can see them."
          placeholder="Top level"
          data={folderOptions(folders)}
          value={folderId}
          onChange={setFolderId}
          clearable
          searchable
          disabled={isPending}
        />

        <MultiSelect
          label="Who can see it"
          description="Only members of the selected groups can open the file on the website and app. Leave empty to make it public."
          placeholder={groupIds.length === 0 ? 'Everyone (public)' : undefined}
          data={groupOptions}
          value={groupIds}
          onChange={setGroupIds}
          searchable
          clearable
          disabled={isPending}
        />

        {groupIds.length === 0 && (
          <Alert variant="filled" color="orange" icon={<IconWorld size={20} />} title="THIS ASSET IS PUBLIC" role="status">
            Anyone can open it, including visitors who are not logged in. To restrict it, select the groups that may see it above.
          </Alert>
        )}

        <MultiSelect
          label="Who can manage it"
          description={
            isEdit
              ? 'Roles that can see, edit and delete this asset in the CMS.'
              : 'Roles that can see, edit and delete it in the CMS. Leave empty to give your own roles access.'
          }
          placeholder={roleIds.length === 0 && !isEdit ? 'Your roles' : undefined}
          data={(rolesData?.roles ?? []).map((role) => ({ value: String(role.id), label: role.name }))}
          value={roleIds}
          onChange={setRoleIds}
          searchable
          clearable
          disabled={isPending}
        />
      </Stack>
    </ModalWrapper>
  );
}
