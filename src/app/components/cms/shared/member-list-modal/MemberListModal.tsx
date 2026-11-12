/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
'use client';

import { useState } from 'react';
import { ActionIcon, Box, Group, LoadingOverlay, Select, Stack, Table, Text, TextInput } from '@mantine/core';
import { IconSearch, IconX } from '@tabler/icons-react';
import { ModalWrapper } from '../../../shared/common/CustomModal/CustomModal';
import { EmptyState } from '../../../shared/common/EmptyState';
import { FilterActions } from '../../../shared/common/FilterControls';
import { AdminTableFooter, adminTableClasses as tableStyles } from '../admin-table';
import { UserStatusBadge, UserStatusFilterSelect } from '../user-status';
import { useUsers } from '../../../../../hooks/useUsers';
import type { IUsersListParams } from '../../../../../types/responses/admin/users.types';

interface IMemberListModalProps {
  opened: boolean;
  onClose: () => void;
  /** Modal title, e.g. "Members of Editors" or "Members of Admin". */
  title: string;
  /** Which members to list (`id_groups` or `id_roles`); null while closed. */
  filter: Pick<IUsersListParams, 'id_groups' | 'id_roles'> | null;
  /** Noun for the empty state, e.g. "group" or "role". */
  containerNoun: string;
}

const DEFAULT_FORM = { search: '', status: undefined, pageSize: 20 } satisfies IUsersListParams;

/** The users of a group or role, read from the Users list endpoint so it gets
 *  the same search, status filter and paging. Mount it with a `key` per
 *  group/role so the filters reset when another one is opened. */
export function MemberListModal({ opened, onClose, title, filter, containerNoun }: IMemberListModalProps) {
  const [form, setForm] = useState<IUsersListParams>(DEFAULT_FORM);
  const [applied, setApplied] = useState<IUsersListParams>(DEFAULT_FORM);
  const [page, setPage] = useState(1);

  const { data, isFetching, isError, refetch } = useUsers(
    { ...applied, ...filter, page, sort: 'email', sortDirection: 'asc' },
    { enabled: opened && filter !== null },
  );
  const members = data?.users ?? [];
  const isFiltered = Boolean(applied.search || applied.status);

  const apply = (next: IUsersListParams) => {
    setApplied(next);
    setPage(1);
  };

  return (
    <ModalWrapper opened={opened} onClose={onClose} title={title} size="xl" onCancel={onClose} cancelLabel="Close">
      <Stack gap="md">
        <TextInput
          aria-label="Search members"
          placeholder="Search by email, name, or code..."
          leftSection={<IconSearch size={16} />}
          rightSection={
            form.search ? (
              <ActionIcon variant="subtle" color="gray" size="sm" aria-label="Clear search" onClick={() => setForm((prev) => ({ ...prev, search: '' }))}>
                <IconX size={14} />
              </ActionIcon>
            ) : null
          }
          value={form.search}
          onChange={(e) => {
            const search = e.currentTarget.value;
            setForm((prev) => ({ ...prev, search }));
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') apply(form);
          }}
        />

        <Group gap="md" align="flex-end" justify="space-between" wrap="wrap">
          <Group gap="md" align="flex-end" wrap="wrap">
            <UserStatusFilterSelect value={form.status} onChange={(status) => setForm((prev) => ({ ...prev, status }))} />
            <Select
              label="Rows per page"
              value={form.pageSize?.toString()}
              onChange={(value) => value && setForm((prev) => ({ ...prev, pageSize: parseInt(value, 10) }))}
              data={['10', '20', '50', '100']}
              withCheckIcon={false}
              allowDeselect={false}
              w={110}
            />
          </Group>
          <FilterActions
            onApply={() => apply(form)}
            onReset={() => {
              setForm(DEFAULT_FORM);
              apply(DEFAULT_FORM);
            }}
            onRefresh={refetch}
            isFetching={isFetching}
            isApplyDisabled={form === applied}
          />
        </Group>

        {isError ? (
          <EmptyState title="Could not load members" description="Something went wrong fetching the members. Please try again." />
        ) : (
          <div className={tableStyles.tableWrapper}>
            <LoadingOverlay visible={isFetching} />
            <Box className={tableStyles.tableScrollContainer}>
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
                        <UserStatusBadge status={member.status} blocked={member.blocked} />
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </Box>

            {!isFetching && data && members.length === 0 && (
              <EmptyState
                title="No members"
                description={isFiltered ? 'Try adjusting your search or filters' : `This ${containerNoun} has no users yet.`}
              />
            )}

            {data && data.pagination.totalCount > 0 && (
              <AdminTableFooter
                totalCount={data.pagination.totalCount}
                itemLabel="members"
                pagination={{
                  page: data.pagination.page,
                  pageSize: data.pagination.pageSize,
                  totalPages: data.pagination.totalPages,
                  onPageChange: setPage,
                }}
              />
            )}
          </div>
        )}
      </Stack>
    </ModalWrapper>
  );
}
