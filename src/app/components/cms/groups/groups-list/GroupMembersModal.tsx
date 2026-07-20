/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
'use client';

import { Badge, Group, Loader, Stack, Table, Text } from '@mantine/core';
import { ModalWrapper } from '../../../shared/common/CustomModal/CustomModal';
import { EmptyState } from '../../../shared/common/EmptyState';
import { useGroupMembers } from '../../../../../hooks/useGroups';
import { getUserStatusColor } from '../../../../../utils/status-color.utils';
import { adminTableClasses as tableStyles } from '../../shared/admin-table';

interface IGroupMembersModalProps {
  opened: boolean;
  onClose: () => void;
  /** The group whose members to show, or null when the modal is closed. */
  group: { id: number; name: string } | null;
}

/** Read-only list of the users in a group, opened from the group row's
 *  "View members" action. Fetches lazily when a group is set. */
export function GroupMembersModal({ opened, onClose, group }: IGroupMembersModalProps) {
  const { data: members, isLoading, isError } = useGroupMembers(group?.id ?? null);

  return (
    <ModalWrapper
      opened={opened}
      onClose={onClose}
      title={group ? `Members of ${group.name}` : 'Members'}
      size="lg"
      onCancel={onClose}
      cancelLabel="Close"
    >
      {isLoading ? (
        <Group justify="center" py="xl">
          <Loader size="sm" />
        </Group>
      ) : isError ? (
        <EmptyState
          title="Could not load members"
          description="Something went wrong fetching this group's members. Please try again."
        />
      ) : !members || members.length === 0 ? (
        <EmptyState
          title="No members"
          description="This group has no users yet."
        />
      ) : (
        <Stack gap="xs">
          <Text size="sm" c="dimmed">
            {members.length} member{members.length === 1 ? '' : 's'}
          </Text>
          <div className={tableStyles.tableWrapper}>
            <Table highlightOnHover verticalSpacing="sm" horizontalSpacing="md">
              <Table.Thead>
                <Table.Tr>
                  <Table.Th className={tableStyles.tableHeader}>User</Table.Th>
                  <Table.Th className={tableStyles.tableHeader}>Username</Table.Th>
                  <Table.Th className={tableStyles.tableHeader}>Status</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {members.map((member) => (
                  <Table.Tr key={member.id}>
                    <Table.Td className={tableStyles.tableCell}>
                      <Text size="sm" fw={600}>
                        {member.name || '—'}
                      </Text>
                      <Text size="xs" c="dimmed">
                        {member.email || '—'}
                      </Text>
                    </Table.Td>
                    <Table.Td className={tableStyles.tableCell}>
                      <Text size="sm">{member.user_name || '—'}</Text>
                    </Table.Td>
                    <Table.Td className={tableStyles.tableCell}>
                      <Badge
                        variant="light"
                        color={member.blocked ? 'red' : getUserStatusColor(member.status)}
                        size="sm"
                      >
                        {member.blocked ? 'Blocked' : member.status}
                      </Badge>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </div>
        </Stack>
      )}
    </ModalWrapper>
  );
}
