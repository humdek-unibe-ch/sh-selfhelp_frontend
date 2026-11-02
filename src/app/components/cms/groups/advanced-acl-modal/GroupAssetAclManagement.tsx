/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
"use client";

import { useMemo } from 'react';
import {
  Stack,
  Text,
  Group,
  Paper,
  Badge,
  Alert,
  Checkbox,
  SegmentedControl,
  ScrollArea,
} from '@mantine/core';
import { IconInfoCircle, IconFolder } from '@tabler/icons-react';
import { useAssets } from '../../../../../hooks/useAssets';
import type { TAssetFolderAccessLevel } from '../../../../../types/responses/admin/groups.types';

export interface IGroupAssetAclSelection {
  folder: string;
  access_level: TAssetFolderAccessLevel;
}

interface IGroupAssetAclManagementProps {
  /** Folders this group currently has access to (edited copy owned by parent). */
  selectedFolders: IGroupAssetAclSelection[];
  onChange: (folders: IGroupAssetAclSelection[]) => void;
  readonly?: boolean;
  maxHeight?: number;
}

export function GroupAssetAclManagement({
  selectedFolders,
  onChange,
  readonly = false,
  maxHeight = 320,
}: IGroupAssetAclManagementProps) {
  // Folders are derived from the asset list — there is no list-all-folders
  // endpoint; the group ACL is stored per folder name.
  const { data: assetsData, isLoading } = useAssets({ pageSize: 1000 });

  const folders = useMemo(() => {
    const names = new Set<string>();
    (assetsData?.assets ?? []).forEach((a) => {
      if (a.folder) names.add(a.folder);
    });
    // Include any granted folder that no longer has assets, so a stale grant is
    // still visible and editable rather than silently dropped.
    selectedFolders.forEach((s) => names.add(s.folder));
    return Array.from(names).sort();
  }, [assetsData, selectedFolders]);

  const levelByFolder = useMemo(() => {
    const map = new Map<string, TAssetFolderAccessLevel>();
    selectedFolders.forEach((s) => map.set(s.folder, s.access_level));
    return map;
  }, [selectedFolders]);

  const handleToggle = (folder: string, checked: boolean) => {
    if (readonly) return;
    if (checked) {
      onChange([...selectedFolders, { folder, access_level: 'read' }]);
    } else {
      onChange(selectedFolders.filter((s) => s.folder !== folder));
    }
  };

  const handleLevelChange = (folder: string, level: TAssetFolderAccessLevel) => {
    if (readonly) return;
    onChange(selectedFolders.map((s) => (s.folder === folder ? { ...s, access_level: level } : s)));
  };

  return (
    <Stack gap="sm">
      <Alert icon={<IconInfoCircle size="1rem" />} color="blue" variant="light">
        <Text size="sm">
          Grant this group access to asset folders. <strong>Read </strong> lets members view and
          download the folder&apos;s assets; <strong>Manage </strong> also allows creating, importing
          and deleting. These grants apply to the group&apos;s members &mdash; users with the admin
          role always keep full access to every folder, so restricting a folder here never locks out
          an admin. A folder with no group grants is <strong>restricted to admins</strong>; grant a
          group here to give its members access.
        </Text>
      </Alert>

      {isLoading ? (
        <Text size="sm" c="dimmed">Loading folders...</Text>
      ) : folders.length === 0 ? (
        <Paper withBorder p="sm">
          <Text size="sm" c="dimmed">No asset folders exist yet.</Text>
        </Paper>
      ) : (
        <ScrollArea.Autosize mah={maxHeight}>
          <Stack gap="xs">
            {folders.map((folder) => {
              const granted = levelByFolder.has(folder);
              const level = levelByFolder.get(folder) ?? 'read';
              return (
                <Paper key={folder} withBorder p="sm">
                  <Group justify="space-between" wrap="nowrap">
                    <Checkbox
                      checked={granted}
                      disabled={readonly}
                      onChange={(e) => handleToggle(folder, e.currentTarget.checked)}
                      label={
                        <Group gap="xs">
                          <IconFolder size="1rem" />
                          <Text size="sm">{folder}</Text>
                        </Group>
                      }
                    />
                    {granted && (
                      <SegmentedControl
                        size="xs"
                        value={level}
                        onChange={(v) => handleLevelChange(folder, v as TAssetFolderAccessLevel)}
                        disabled={readonly}
                        data={[
                          { label: 'Read', value: 'read' },
                          { label: 'Manage', value: 'manage' },
                        ]}
                      />
                    )}
                  </Group>
                </Paper>
              );
            })}
          </Stack>
        </ScrollArea.Autosize>
      )}

      {selectedFolders.length > 0 && (
        <Paper p="sm" withBorder>
          <Text size="sm" fw={500} mb="xs">
            Folders granted ({selectedFolders.length})
          </Text>
          <Group gap="xs">
            {selectedFolders.slice(0, 6).map((s) => (
              <Badge key={s.folder} variant="filled" size="sm" color={s.access_level === 'manage' ? 'grape' : 'blue'}>
                {s.folder} · {s.access_level}
              </Badge>
            ))}
            {selectedFolders.length > 6 && (
              <Badge variant="outline" size="sm">
                +{selectedFolders.length - 6} more
              </Badge>
            )}
          </Group>
        </Paper>
      )}
    </Stack>
  );
}
