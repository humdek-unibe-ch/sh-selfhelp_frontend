/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
"use client";

import { useState } from 'react';
import { Table, TextInput, Group } from '@mantine/core';
import { IconFolderPlus } from '@tabler/icons-react';
import { parseApiError } from '../../../../../utils/mutation-error-handler';
import { adminTableClasses as tableStyles } from '../../shared/admin-table';
import { CHEVRON_WIDTH, TREE_INDENT } from './AssetRow';
import { useAssetTree } from './assets-tree.context';

interface IFolderNameFieldProps {
  /** Accessible name, e.g. `Name of folder Team` or `Name of the new folder`. */
  label: string;
  initialValue?: string;
  /** Saves the name; a rejection is shown under the field (409 = a sibling has that name). */
  onSubmit: (name: string) => Promise<void>;
  onCancel: () => void;
}

/**
 * A folder name typed in place: Enter saves, Escape cancels. The server's
 * message (a sibling already has the name, the tree would be too deep) appears
 * under the field and the field stays open so the name can be fixed.
 */
export function FolderNameField({ label, initialValue = '', onSubmit, onCancel }: IFolderNameFieldProps) {
  const [value, setValue] = useState(initialValue);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    const name = value.trim();
    if (name === '') {
      setError('Enter a folder name.');
      return;
    }
    if (initialValue !== '' && name === initialValue) {
      onCancel();
      return;
    }
    setSaving(true);
    try {
      await onSubmit(name);
    } catch (err) {
      setError(parseApiError(err).errorMessage);
      setSaving(false);
    }
  };

  return (
    <TextInput
      size="xs"
      aria-label={label}
      data-autofocus
      maxLength={100}
      autoFocus
      value={value}
      disabled={saving}
      error={error}
      onClick={(e) => e.stopPropagation()}
      onChange={(e) => {
        setValue(e.currentTarget.value);
        setError(null);
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          void submit();
        } else if (e.key === 'Escape') {
          e.preventDefault();
          onCancel();
        }
      }}
      onFocus={(e) => e.currentTarget.select()}
    />
  );
}

/** A table row for naming a new folder, at the top level or inside an open folder. */
export function NewFolderRow({ parentId, depth }: { parentId: number | null; depth: number }) {
  const tree = useAssetTree();

  return (
    <Table.Tr>
      <Table.Td className={tableStyles.tableCell} />
      <Table.Td className={tableStyles.tableCell} colSpan={4}>
        <Group gap="sm" wrap="nowrap" style={{ paddingLeft: depth * TREE_INDENT + CHEVRON_WIDTH }}>
          <IconFolderPlus size={22} color="var(--mantine-color-yellow-6)" aria-hidden />
          <div style={{ maxWidth: 360, width: '100%' }}>
            <FolderNameField
              label="Name of the new folder"
              onSubmit={(name) => tree.onCreateFolder(parentId, name)}
              onCancel={tree.onCancelCreate}
            />
          </div>
        </Group>
      </Table.Td>
    </Table.Tr>
  );
}
