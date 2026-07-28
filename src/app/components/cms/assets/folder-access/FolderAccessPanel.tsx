/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
"use client";

import { useState } from 'react';
import { Card, Group, Stack, Switch, Text, Title, Badge, Alert, Loader } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconWorld, IconAlertTriangle } from '@tabler/icons-react';
import { ModalWrapper } from '../../../shared/common/CustomModal/CustomModal';
import { useAssetFolders, useSetFolderOpenAccess } from '../../../../../hooks/useAssets';
import { useAuthUser } from '../../../../../hooks/useUserData';
import { PERMISSIONS } from '../../../../../types/auth/jwt-payload.types';
import { parseApiError } from '../../../../../utils/mutation-error-handler';

const HELP_TEXT =
  'Anyone with the link can view files in this folder, including people who are not logged in. Uploading and deleting still follow group permissions.';

/**
 * Per-folder public-visibility control.
 *
 * FOLDER-scoped, and deliberately distinct from the GROUP-scoped folder-ACL
 * editor on the Groups page — they are different axes and both are needed.
 *
 * Gated on `admin.group.acl` (NOT an asset permission): flagging a folder
 * world-readable is an access-control decision, so it matches both backend
 * enforcement and the permission that reveals the group-ACL editor. A user with
 * asset-edit rights but without it sees the state READ-ONLY, not hidden.
 */
export function FolderAccessPanel() {
  const { permissionChecker } = useAuthUser();
  const canManageAccess = permissionChecker?.hasPermission(PERMISSIONS.ADMIN_GROUP_ACL) ?? false;

  const { data, isLoading } = useAssetFolders();
  const setOpenAccess = useSetFolderOpenAccess();

  // Enabling exposes content to logged-out visitors, so it is confirmed;
  // disabling only removes access and needs no confirmation.
  const [pendingFolder, setPendingFolder] = useState<string | null>(null);

  const folders = data?.folders ?? [];

  // Hide the whole panel from users who cannot change access: a card of
  // permanently-disabled switches is noise, and the state itself is still
  // visible as the "Public" badge on each folder in the tree below.
  if (!canManageAccess) return null;

  const apply = (folder: string, isOpenAccess: boolean) => {
    setOpenAccess.mutate(
      { folder, isOpenAccess },
      {
        onSuccess: (result) => {
          setPendingFolder(null);
          notifications.show({
            title: result.is_open_access ? 'Folder is now public' : 'Folder is no longer public',
            message: result.is_open_access
              ? `Anyone can now view files in "${result.folder}".`
              : `Files in "${result.folder}" now follow group permissions only.`,
            color: result.is_open_access ? 'orange' : 'green',
          });
        },
        onError: (error) => {
          setPendingFolder(null);
          notifications.show({
            title: 'Could not update folder access',
            message: parseApiError(error).errorMessage,
            color: 'red',
          });
        },
      }
    );
  };

  const handleToggle = (folder: string, next: boolean) => {
    if (next) {
      setPendingFolder(folder);
      return;
    }
    apply(folder, false);
  };

  return (
    <>
      <Card withBorder>
        <Stack gap="sm">
          <div>
            <Group gap="sm" align="center">
              <IconWorld size={20} />
              <Title order={4}>Folder access</Title>
            </Group>
            <Text size="sm" c="dimmed" mt={4}>
              Control which folders are publicly viewable. {HELP_TEXT}
            </Text>
          </div>

          {isLoading && <Loader size="sm" />}

          {!isLoading && folders.length === 0 && (
            <Text size="sm" c="dimmed">
              No folders yet. Folders are created when you upload into them.
            </Text>
          )}

          {folders.map((entry) => (
            <Group key={entry.folder} justify="space-between" wrap="nowrap">
              <Group gap="sm" wrap="nowrap">
                <Badge variant="light" color="gray" size="sm" radius="sm">
                  {entry.folder}
                </Badge>
                {entry.is_open_access && (
                  <Badge variant="light" color="orange" size="sm" radius="sm">
                    Public
                  </Badge>
                )}
              </Group>
              <Switch
                checked={entry.is_open_access}
                disabled={setOpenAccess.isPending}
                onChange={(event) => handleToggle(entry.folder, event.currentTarget.checked)}
                label="Public — anyone can view"
                aria-label={`Public — anyone can view files in ${entry.folder}`}
              />
            </Group>
          ))}
        </Stack>
      </Card>

      <ModalWrapper
        opened={pendingFolder !== null}
        onClose={() => setPendingFolder(null)}
        title="Make this folder public?"
        size="md"
        isLoading={setOpenAccess.isPending}
        saveLabel="Make public"
        onSave={() => pendingFolder && apply(pendingFolder, true)}
      >
        <Alert color="orange" icon={<IconAlertTriangle size={16} />}>
          <Text size="sm">
            <strong>{pendingFolder}</strong> will be readable by anyone with the link, including
            people who are not logged in.
          </Text>
          <Text size="sm" mt="xs">
            This grants view access only — uploading and deleting still follow group permissions.
          </Text>
        </Alert>
      </ModalWrapper>
    </>
  );
}
