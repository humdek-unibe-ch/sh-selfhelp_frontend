/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
"use client";

import { Select, Text } from '@mantine/core';
import type { IAssetFolder } from '../../../../../api/admin/asset.api';
import { ModalWrapper } from '../../../shared/common/CustomModal/CustomModal';
import { folderOptions } from '../assets.utils';

/** Select value for "no folder" (Select values cannot be null). */
export const TOP_LEVEL = 'top';

interface IMoveToFolderModalProps {
  opened: boolean;
  onClose: () => void;
  title: string;
  /** The picked folder id, or {@link TOP_LEVEL}. */
  value: string;
  onChange: (value: string) => void;
  onMove: () => void;
  isLoading: boolean;
  folders: IAssetFolder[];
  /** Folders that are not offered (a folder cannot move into itself or its own subfolders). */
  excludeIds?: ReadonlySet<number>;
  /** An explanation under the picker. */
  hint?: string;
}

/** The folder picker behind "Move to..." for folders and "Move to folder" for selected assets. */
export function MoveToFolderModal({
  opened,
  onClose,
  title,
  value,
  onChange,
  onMove,
  isLoading,
  folders,
  excludeIds,
  hint,
}: IMoveToFolderModalProps) {
  const offered = excludeIds ? folders.filter((folder) => !excludeIds.has(folder.id)) : folders;

  return (
    <ModalWrapper
      opened={opened}
      onClose={onClose}
      title={title}
      size="sm"
      onSave={onMove}
      saveLabel="Move"
      isLoading={isLoading}
    >
      <Select
        label="Move to"
        // `folderOptions` labels with the path, so the folders are listed whole, then filtered.
        data={[
          { value: TOP_LEVEL, label: 'No folder (top level)' },
          ...folderOptions(folders).filter((option) => offered.some((folder) => String(folder.id) === option.value)),
        ]}
        value={value}
        onChange={(next) => next && onChange(next)}
        allowDeselect={false}
        searchable
      />
      {hint && <Text size="xs" c="dimmed" mt="xs">{hint}</Text>}
    </ModalWrapper>
  );
}
