/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
'use client';

import { MemberListModal } from '../../shared/member-list-modal';

interface IRoleMembersModalProps {
  opened: boolean;
  onClose: () => void;
  /** The role whose members to show, or null when the modal is closed. */
  role: { id: number; name: string } | null;
}

/** "View members" for a role: the Users list filtered to the role. */
export function RoleMembersModal({ opened, onClose, role }: IRoleMembersModalProps) {
  return (
    <MemberListModal
      key={role?.id ?? 0}
      opened={opened}
      onClose={onClose}
      title={role ? `Members of ${role.name}` : 'Members'}
      filter={role ? { id_roles: role.id } : null}
      containerNoun="role"
    />
  );
}
