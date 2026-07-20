/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
'use client';

import { Alert, List, Stack, Text } from '@mantine/core';
import { IconAlertTriangle } from '@tabler/icons-react';
import { ModalWrapper } from '../../../shared/common/CustomModal/CustomModal';
import type { IUserBasic } from '../../../../../types/responses/admin/users.types';

interface IBulkDeleteUsersModalProps {
  opened: boolean;
  onClose: () => void;
  users: IUserBasic[];
  onConfirm: () => void;
  isLoading: boolean;
}

/** Names the users about to be deleted — a bare count is too easy to confirm
 *  by reflex on an irreversible action. */
export function BulkDeleteUsersModal({
  opened,
  onClose,
  users,
  onConfirm,
  isLoading,
}: IBulkDeleteUsersModalProps) {
  const previewLimit = 8;
  const preview = users.slice(0, previewLimit);
  const remaining = users.length - preview.length;

  return (
    <ModalWrapper
      opened={opened}
      onClose={onClose}
      title={`Delete ${users.length} user${users.length === 1 ? '' : 's'}`}
      size="md"
      onDelete={onConfirm}
      deleteLabel={`Delete ${users.length} user${users.length === 1 ? '' : 's'}`}
      isLoading={isLoading}
      disableScroll
    >
      <Stack gap="md">
        <Alert color="red" icon={<IconAlertTriangle size={16} />}>
          This permanently deletes the selected user{users.length === 1 ? '' : 's'} and their
          data. This cannot be undone.
        </Alert>

        <div>
          <Text size="sm" fw={600} mb={4}>
            Will be deleted:
          </Text>
          <List size="sm" spacing={2}>
            {preview.map((user) => (
              <List.Item key={user.id}>{user.email}</List.Item>
            ))}
          </List>
          {remaining > 0 && (
            <Text size="sm" c="dimmed" mt={4}>
              …and {remaining} more.
            </Text>
          )}
        </div>
      </Stack>
    </ModalWrapper>
  );
}
