/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
'use client';

import { useState } from 'react';
import { MultiSelect, Stack, Text } from '@mantine/core';
import { ModalWrapper } from '../../../shared/common/CustomModal/CustomModal';
import { useGroups } from '../../../../../hooks/useGroups';

interface IBulkGroupMembershipModalProps {
  opened: boolean;
  onClose: () => void;
  /** Which direction the picked groups apply in. */
  mode: 'add' | 'remove';
  selectedCount: number;
  onConfirm: (groupIds: number[]) => void;
  isLoading: boolean;
}

const COPY = {
  add: {
    title: 'Add users to group',
    action: 'Add to group',
    detail: 'will be added to the groups you pick. Users already in a group are left unchanged.',
  },
  remove: {
    title: 'Remove users from group',
    action: 'Remove from group',
    detail:
      'will be removed from the groups you pick. Users who are not in a group are left unchanged.',
  },
} as const;

/** Picks one or more groups to add the selected users to, or remove them from.
 *  One component for both: same picker, same payload, opposite verb. */
export function BulkGroupMembershipModal({
  opened,
  onClose,
  mode,
  selectedCount,
  onConfirm,
  isLoading,
}: IBulkGroupMembershipModalProps) {
  const [groupIds, setGroupIds] = useState<string[]>([]);
  const { data: groupsData, isLoading: isLoadingGroups } = useGroups({ pageSize: 100 });
  const copy = COPY[mode];

  // Reset the selection when the modal opens or the mode flips, not on close: a
  // successful submit closes the modal from the parent (setGroupMode(null))
  // without routing through onClose, so resetting there would let the previous
  // selection reappear on the next open. Resetting during render on the
  // open/mode transition (React's documented alternative to a state-syncing
  // effect) clears both paths without an extra render.
  const [resetKey, setResetKey] = useState(`${opened}-${mode}`);
  if (resetKey !== `${opened}-${mode}`) {
    setResetKey(`${opened}-${mode}`);
    setGroupIds([]);
  }

  return (
    <ModalWrapper
      opened={opened}
      onClose={onClose}
      title={copy.title}
      size="md"
      onSave={() => onConfirm(groupIds.map(Number))}
      saveLabel={copy.action}
      saveVariant={mode === 'remove' ? 'light' : 'filled'}
      isLoading={isLoading}
      disabled={groupIds.length === 0}
      disableScroll
    >
      <Stack gap="md">
        <Text size="sm" c="dimmed">
          {selectedCount} selected user{selectedCount === 1 ? '' : 's'} {copy.detail}
        </Text>

        <MultiSelect
          label="Groups"
          placeholder={groupIds.length === 0 ? 'Pick one or more groups' : undefined}
          data={(groupsData?.groups ?? []).map((group) => ({
            value: group.id.toString(),
            label: group.name,
          }))}
          value={groupIds}
          onChange={setGroupIds}
          disabled={isLoadingGroups}
          searchable
          clearable
          data-autofocus
        />
      </Stack>
    </ModalWrapper>
  );
}
