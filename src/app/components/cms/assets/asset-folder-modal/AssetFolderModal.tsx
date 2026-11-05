/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
"use client";

import { useState } from 'react';
import { Select, Stack, TextInput } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { ModalWrapper } from '../../../shared/common/CustomModal/CustomModal';
import { useAssetFolders, useDeleteAssetFolder, useSaveAssetFolder } from '../../../../../hooks/useAssets';
import { parseApiError } from '../../../../../utils/mutation-error-handler';
import { folderOptions } from '../assets.utils';

interface IAssetFolderModalProps {
  opened: boolean;
  onClose: () => void;
  initialFolderId?: number | null;
}

/**
 * Manage asset folders (organisation only): pick a folder to rename, move or
 * delete it, or pick none to create a new one.
 */
export function AssetFolderModal({ opened, onClose, initialFolderId = null }: IAssetFolderModalProps) {
  const { data: folders = [] } = useAssetFolders();
  const saveFolder = useSaveAssetFolder();
  const deleteFolder = useDeleteAssetFolder();
  const [folderId, setFolderId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [parentId, setParentId] = useState<string | null>(null);
  const folder = folders.find((candidate) => String(candidate.id) === folderId) ?? null;

  const [wasOpened, setWasOpened] = useState(false);
  if (opened !== wasOpened) {
    setWasOpened(opened);
    setFolderId(opened && initialFolderId ? String(initialFolderId) : null);
  }
  const resetKey = opened ? `open-${folder?.id ?? 'new'}` : 'closed';
  const [prevResetKey, setPrevResetKey] = useState<string | null>(null);
  if (prevResetKey !== resetKey) {
    setPrevResetKey(resetKey);
    setName(folder?.name ?? '');
    setParentId(folder?.parent_id ? String(folder.parent_id) : null);
  }

  const run = async (action: () => Promise<unknown>) => {
    try {
      await action();
      onClose();
    } catch (error) {
      const { errorTitle, errorMessage } = parseApiError(error);
      notifications.show({ title: errorTitle, message: errorMessage, color: 'red' });
    }
  };

  // Stay open after saving so several folders can be set up in one go.
  const save = () =>
    void saveFolder
      .mutateAsync({ folder: { name: name.trim(), parent_id: parentId ? Number(parentId) : null }, folderId: folder?.id })
      .then(() => {
        notifications.show({ title: 'Success', message: folder ? 'Folder saved' : 'Folder created', color: 'green' });
        if (!folder) {
          setName('');
        }
      })
      .catch((error: unknown) => {
        const { errorTitle, errorMessage } = parseApiError(error);
        notifications.show({ title: errorTitle, message: errorMessage, color: 'red' });
      });

  return (
    <ModalWrapper
      opened={opened}
      onClose={onClose}
      title="Folders"
      size="sm"
      onSave={folder ? undefined : save}
      onUpdate={folder ? save : undefined}
      onDelete={folder ? () => void run(() => deleteFolder.mutateAsync(folder.id).then(() => setFolderId(null))) : undefined}
      deleteLabel="Delete folder"
      saveLabel="Create folder"
      updateLabel="Save folder"
      isLoading={saveFolder.isPending || deleteFolder.isPending}
      disabled={name.trim() === ''}
    >
      <Stack gap="md">
        <Select
          label="Folder"
          description="Pick a folder to rename, move or delete it, or leave empty to create a new one."
          placeholder="New folder"
          data={folderOptions(folders)}
          value={folderId}
          onChange={setFolderId}
          clearable
          searchable
        />
        <TextInput label="Name" value={name} onChange={(event) => setName(event.currentTarget.value)} maxLength={100} required data-autofocus />
        <Select
          label="Inside folder"
          placeholder="Top level"
          data={folderOptions(folders.filter((candidate) => candidate.id !== folder?.id))}
          value={parentId}
          onChange={setParentId}
          clearable
          searchable
        />
      </Stack>
    </ModalWrapper>
  );
}
