/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
'use client';

import { MemberListModal } from '../../shared/member-list-modal';

interface IGroupMembersModalProps {
  opened: boolean;
  onClose: () => void;
  /** The group whose members to show, or null when the modal is closed. */
  group: { id: number; name: string } | null;
}

/** "View members" for a group: the Users list filtered to the group. */
export function GroupMembersModal({ opened, onClose, group }: IGroupMembersModalProps) {
  return (
    <MemberListModal
      key={group?.id ?? 0}
      opened={opened}
      onClose={onClose}
      title={group ? `Members of ${group.name}` : 'Members'}
      filter={group ? { id_groups: group.id } : null}
      containerNoun="group"
    />
  );
}
