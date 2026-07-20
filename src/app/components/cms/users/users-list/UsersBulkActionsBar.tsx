/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
'use client';

import { Button, Group, Text } from '@mantine/core';
import { IconSend, IconTrash, IconUsersMinus, IconUsersPlus } from '@tabler/icons-react';
import classes from './UsersBulkActionsBar.module.css';

interface IUsersBulkActionsBarProps {
  selectedCount: number;
  onAddToGroup: () => void;
  onRemoveFromGroup: () => void;
  onSendActivation: () => void;
  onDelete: () => void;
  isBusy: boolean;
  permissions: {
    canUpdate?: boolean;
    canDelete?: boolean;
  };
}

/** Action strip shown above the table once rows are selected. */
export function UsersBulkActionsBar({
  selectedCount,
  onAddToGroup,
  onRemoveFromGroup,
  onSendActivation,
  onDelete,
  isBusy,
  permissions,
}: IUsersBulkActionsBarProps) {
  return (
    <Group
      justify="space-between"
      wrap="wrap"
      gap="sm"
      className={classes.bar}
      role="region"
      aria-label="Bulk actions"
    >
      <Group gap="sm" wrap="wrap">
        <Text size="sm" fw={600}>
          {selectedCount} user{selectedCount === 1 ? '' : 's'} selected
        </Text>

        <Button
          size="xs"
          variant="default"
          leftSection={<IconUsersPlus size={14} />}
          onClick={onAddToGroup}
          disabled={isBusy || !permissions.canUpdate}
        >
          Add to group
        </Button>

        <Button
          size="xs"
          variant="default"
          leftSection={<IconUsersMinus size={14} />}
          onClick={onRemoveFromGroup}
          disabled={isBusy || !permissions.canUpdate}
        >
          Remove from group
        </Button>

        <Button
          size="xs"
          variant="default"
          leftSection={<IconSend size={14} />}
          onClick={onSendActivation}
          disabled={isBusy || !permissions.canUpdate}
        >
          Send activation
        </Button>
      </Group>

      <Button
        size="xs"
        variant="light"
        color="red"
        leftSection={<IconTrash size={14} />}
        onClick={onDelete}
        disabled={isBusy || !permissions.canDelete}
      >
        Delete
      </Button>
    </Group>
  );
}
