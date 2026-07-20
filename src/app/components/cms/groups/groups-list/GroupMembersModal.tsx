/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
'use client';

import { MemberListModal } from '../../shared/member-list-modal';
import { useGroupMembers } from '../../../../../hooks/useGroups';

interface IGroupMembersModalProps {
  opened: boolean;
  onClose: () => void;
  /** The group whose members to show, or null when the modal is closed. */
  group: { id: number; name: string } | null;
}

/** "View members" for a group. Fetches lazily when a group is set, then hands
 *  the result to the shared member-list renderer. */
export function GroupMembersModal({ opened, onClose, group }: IGroupMembersModalProps) {
  const { data: members, isLoading, isError } = useGroupMembers(group?.id ?? null);

  return (
    <MemberListModal
      opened={opened}
      onClose={onClose}
      title={group ? `Members of ${group.name}` : 'Members'}
      members={members}
      isLoading={isLoading}
      isError={isError}
      containerNoun="group"
    />
  );
}
