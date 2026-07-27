/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
'use client';

import { Badge, Group, Loader, Stack, Table, Text } from '@mantine/core';
import { ModalWrapper } from '../../../shared/common/CustomModal/CustomModal';
import { EmptyState } from '../../../shared/common/EmptyState';
import { getUserStatusColor } from '../../../../../utils/status-color.utils';
import { adminTableClasses as tableStyles } from '../admin-table';
import type { IMemberUser } from '../../../../../types/responses/admin/admin.types';

interface IMemberListModalProps {
  opened: boolean;
  onClose: () => void;
  /** Modal title, e.g. "Members of Editors" or "Members of Admin". */
  title: string;
  members?: IMemberUser[];
  isLoading: boolean;
  isError: boolean;
  /** Noun for the empty state, e.g. "group" or "role". */
  containerNoun: string;
}

/** Read-only table of the users belonging to a group or holding a role. The
 *  owning screen supplies the fetched data; this is presentation only, shared
 *  by the group and role "View members" actions. */
export function MemberListModal({
  opened,
  onClose,
  title,
  members,
  isLoading,
  isError,
  containerNoun,
}: IMemberListModalProps) {
  return (
    <ModalWrapper
      opened={opened}
      onClose={onClose}
      title={title}
      size="xl"
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
          description="Something went wrong fetching the members. Please try again."
        />
      ) : !members || members.length === 0 ? (
        <EmptyState title="No members" description={`This ${containerNoun} has no users yet.`} />
      ) : (
        <Stack gap="xs">
          <Text size="sm" c="dimmed">
            {members.length} member{members.length === 1 ? '' : 's'}
          </Text>
          <div className={tableStyles.tableWrapper}>
            <div className={tableStyles.tableScrollContainer}>
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
          </div>
        </Stack>
      )}
    </ModalWrapper>
  );
}
