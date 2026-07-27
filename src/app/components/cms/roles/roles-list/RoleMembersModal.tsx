/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
'use client';

import { MemberListModal } from '../../shared/member-list-modal';
import { useRoleMembers } from '../../../../../hooks/useRoles';

interface IRoleMembersModalProps {
  opened: boolean;
  onClose: () => void;
  /** The role whose members to show, or null when the modal is closed. */
  role: { id: number; name: string } | null;
}

/** "View members" for a role. Fetches lazily when a role is set, then hands the
 *  result to the shared member-list renderer. */
export function RoleMembersModal({ opened, onClose, role }: IRoleMembersModalProps) {
  const { data: members, isLoading, isError } = useRoleMembers(role?.id ?? null);

  return (
    <MemberListModal
      opened={opened}
      onClose={onClose}
      title={role ? `Members of ${role.name}` : 'Members'}
      members={members}
      isLoading={isLoading}
      isError={isError}
      containerNoun="role"
    />
  );
}
