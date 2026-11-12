/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
"use client";

import { useState } from 'react';
import { Alert, SimpleGrid, Stack, Switch, Text } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { ModalWrapper } from '../../../shared/common/CustomModal/CustomModal';
import { useAssetFolders, useSetAssetFolderAccess } from '../../../../../hooks/useAssets';
import type { IAssetFolder, IFolderAccessRequest } from '../../../../../api/admin/asset.api';
import { parseApiError } from '../../../../../utils/mutation-error-handler';
import { folderPathLabel } from '../assets.utils';
import { PublicWarning, WhoCanManageField, WhoCanSeeField, useAccessLists } from '../asset-access-fields/AssetAccessFields';

/** Said in the dialog: a folder stores no access, the change is applied once. */
export const FOLDER_ACCESS_NOTE =
  'This changes the files that are in the folder now. Files added later keep the access chosen when they are uploaded.';

interface IAssetFolderAccessModalProps {
  opened: boolean;
  onClose: () => void;
  /** Called after the access was applied (not on cancel), before the modal closes. */
  onApplied?: () => void;
  folder: IAssetFolder;
}

/**
 * Sets who can see and who can manage every asset in a folder and its
 * subfolders, once. Each of the two settings is only sent when its switch is
 * on, so changing who can see does not touch who can manage. The server applies
 * the change to all assets or to none; when it refuses (403: an asset in the
 * folder is not yours to manage) its message is shown here.
 */
export function AssetFolderAccessModal({ opened, onClose, onApplied, folder }: IAssetFolderAccessModalProps) {
  const setAccess = useSetAssetFolderAccess();
  const { data: folders = [] } = useAssetFolders();
  const lists = useAccessLists(opened);
  const [changeSee, setChangeSee] = useState(false);
  const [changeManage, setChangeManage] = useState(false);
  const [groupIds, setGroupIds] = useState<string[]>([]);
  const [roleIds, setRoleIds] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const count = folder.subtree_asset_count ?? folder.asset_count;
  // Only an admin may leave the managing roles empty (then only admins manage).
  const rolesEmptied = changeManage && roleIds.length === 0 && !lists.callerIsAdmin;
  const canSave = (changeSee || changeManage) && !rolesEmptied;

  const save = async () => {
    const access: IFolderAccessRequest = {};
    if (changeSee) access.group_ids = groupIds.map(Number);
    if (changeManage) access.role_ids = roleIds.map(Number);
    setError(null);
    try {
      const result = await setAccess.mutateAsync({ folderId: folder.id, access });
      notifications.show({
        title: 'Success',
        message: `Access changed on ${result.updated} asset${result.updated === 1 ? '' : 's'}`,
        color: 'green',
      });
      onApplied?.();
      onClose();
    } catch (err) {
      setError(parseApiError(err).errorMessage);
    }
  };

  return (
    <ModalWrapper
      opened={opened}
      onClose={() => !setAccess.isPending && onClose()}
      title={`Set access: ${folderPathLabel(folders, folder.id) || folder.name}`}
      size="xl"
      disableScroll
      onSave={() => void save()}
      saveLabel="Apply to assets"
      isLoading={setAccess.isPending}
      disabled={!canSave}
      closeOnClickOutside={!setAccess.isPending}
      closeOnEscape={!setAccess.isPending}
    >
      <Stack gap="md">
        <Text size="sm">
          {count === 0
            ? 'There are no assets in this folder or its subfolders yet.'
            : `${count} asset${count === 1 ? '' : 's'} in this folder and its subfolders will change.`}
        </Text>

        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="lg">
          <Stack gap="xs">
            <Switch label="Change who can see" checked={changeSee} onChange={(e) => setChangeSee(e.currentTarget.checked)} />
            {changeSee && (
              <WhoCanSeeField
                lists={lists}
                value={groupIds}
                onChange={setGroupIds}
                disabled={setAccess.isPending}
                failureNote="You are not allowed to list the groups, so who can see these assets cannot be chosen here."
              />
            )}
          </Stack>
          <Stack gap="xs">
            <Switch label="Change who can manage" checked={changeManage} onChange={(e) => setChangeManage(e.currentTarget.checked)} />
            {changeManage && (
              <WhoCanManageField
                lists={lists}
                value={roleIds}
                onChange={setRoleIds}
                disabled={setAccess.isPending}
                emptyError={rolesEmptied}
                failureNote="You are not allowed to list the roles, so who can manage these assets cannot be chosen here."
              />
            )}
          </Stack>
        </SimpleGrid>

        {changeSee && groupIds.length === 0 && <PublicWarning title="THESE ASSETS WILL BE PUBLIC" />}

        <Text size="sm" c="dimmed">{FOLDER_ACCESS_NOTE}</Text>

        {error && <Alert color="red" role="alert">{error}</Alert>}
      </Stack>
    </ModalWrapper>
  );
}
