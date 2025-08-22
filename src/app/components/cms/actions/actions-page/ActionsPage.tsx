"use client";

import { useCallback, useMemo, useState } from 'react';
import { Button, Group, Stack, Text, TextInput, ActionIcon, Card, Table, Pagination, Loader } from '@mantine/core';
import { IconPlus, IconX, IconEdit, IconTrash } from '@tabler/icons-react';
import { useActions, useDeleteAction } from '../../../../../hooks/useActions';
import type { IActionsListParams, IActionDetails } from '../../../../../types/responses/admin/actions.types';
import { DeleteActionModal } from '../delete-action-modal/DeleteActionModal';
import { ActionFormModal } from '../action-form-modal/ActionFormModal';

export function ActionsPage() {
  const [params, setParams] = useState<IActionsListParams>({ page: 1, pageSize: 20, search: '', sort: 'name', sortDirection: 'asc' });
  const { data, isLoading } = useActions(params);
  const deleteMutation = useDeleteAction();

  const [createOpen, setCreateOpen] = useState(false);
  const [editAction, setEditAction] = useState<IActionDetails | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<IActionDetails | null>(null);

  const handleSearch = useCallback((value: string) => {
    setParams(prev => ({ ...prev, search: value, page: 1 }));
  }, []);

  const clearSearch = useCallback(() => handleSearch(''), [handleSearch]);

  const rows = useMemo(() => {
    if (!data) return null;
    return data.actions.map((action) => (
      <Table.Tr key={action.id}>
        <Table.Td>{action.id}</Table.Td>
        <Table.Td>{action.name}</Table.Td>
        <Table.Td>{action.action_trigger_type?.lookup_value || action.action_trigger_type?.lookup_code || String(action.id_actionTriggerTypes ?? '')}</Table.Td>
        <Table.Td>{action.data_table?.displayName || action.data_table?.name || ''}</Table.Td>
        <Table.Td>
          <Group gap="xs" justify="right">
            <ActionIcon variant="subtle" color="blue" onClick={() => setEditAction(action)}><IconEdit size={16} /></ActionIcon>
            <ActionIcon variant="subtle" color="red" onClick={() => setDeleteTarget(action)}><IconTrash size={16} /></ActionIcon>
          </Group>
        </Table.Td>
      </Table.Tr>
    ));
  }, [data]);

  return (
    <Stack>
      <Group justify="space-between">
        <Text size="lg" fw={600}>Actions</Text>
        <Button leftSection={<IconPlus size={16} />} onClick={() => setCreateOpen(true)}>New Action</Button>
      </Group>

      <Group>
        <TextInput
          value={params.search || ''}
          onChange={(e) => handleSearch(e.currentTarget.value)}
          placeholder="Search actions"
          rightSection={params.search ? (
            <ActionIcon variant="subtle" color="gray" size="sm" onClick={clearSearch}><IconX size={14} /></ActionIcon>
          ) : undefined}
        />
      </Group>

      <Card withBorder>
        {isLoading ? (
          <Loader />
        ) : (
          <Table striped highlightOnHover withTableBorder>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>ID</Table.Th>
                <Table.Th>Name</Table.Th>
                <Table.Th>Trigger</Table.Th>
                <Table.Th>Data table</Table.Th>
                <Table.Th style={{ width: 120 }}></Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {rows}
            </Table.Tbody>
          </Table>
        )}
      </Card>

      {data?.pagination && (
        <Pagination
          value={params.page || 1}
          total={data.pagination.totalPages}
          onChange={(page) => setParams(prev => ({ ...prev, page }))}
        />
      )}

      <ActionFormModal opened={createOpen} onClose={() => setCreateOpen(false)} mode="create" />
      {editAction && (
        <ActionFormModal opened={!!editAction} onClose={() => setEditAction(null)} mode="edit" actionId={editAction.id} />
      )}
      {deleteTarget && (
        <DeleteActionModal
          opened={!!deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onConfirm={() => deleteMutation.mutate(deleteTarget.id, { onSettled: () => setDeleteTarget(null) })}
          actionName={deleteTarget.name}
          isLoading={deleteMutation.isPending}
        />
      )}
    </Stack>
  );
}


