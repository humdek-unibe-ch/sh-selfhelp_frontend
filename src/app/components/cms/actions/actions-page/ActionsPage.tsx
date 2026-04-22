"use client";

import { useCallback, useMemo, useState } from 'react';
import { Button, Group, Stack, Text, TextInput, ActionIcon, Card, Table, Pagination, Paper, Container, Badge, Select, LoadingOverlay } from '@mantine/core';
import { IconPlus, IconX, IconEdit, IconTrash } from '@tabler/icons-react';
import { useActions, useDeleteAction } from '../../../../../hooks/useActions';
import type { IActionsListParams, IActionDetails } from '../../../../../types/responses/admin/actions.types';
import { DeleteActionModal } from '../delete-action-modal/DeleteActionModal';
import { ActionFormModal } from '../action-form-modal/ActionFormModal';
import { useDataTables } from '../../../../../hooks/useData';
import { useLookupsByType } from '../../../../../hooks/useLookups';
import { FilterActions } from '../../../shared/common/FilterControls';
import { EmptyState } from '../../../shared/common/EmptyState';

export function ActionsPage() {
  const [filterParams, setFilterParams] = useState<IActionsListParams>({
  page: 1,
  pageSize: 20,
  search: '',
  sort: 'name',
  sortDirection: 'asc',
  triggerTypeId: undefined,
  dataTableId: undefined,
  });
  const [params, setParams] = useState<IActionsListParams>(filterParams);

  const { data, isFetching, refetch } = useActions(params);
  const deleteMutation = useDeleteAction();
  const triggerTypes = useLookupsByType('actionTriggerTypes');
  const { data: dataTablesData } = useDataTables();

  const [createOpen, setCreateOpen] = useState(false);
  const [editAction, setEditAction] = useState<IActionDetails | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<IActionDetails | null>(null);

  const handleSearch = useCallback((value: string) => {
    setFilterParams(prev => ({ ...prev, search: value, page: 1 }));
  }, []);

  const handleApplyFilters = useCallback(() => {
    setParams({ ...filterParams, page: 1 });
  }, [filterParams]);

  const handleResetFilters = useCallback(() => {
    const defaultParams: IActionsListParams = {
      page: 1,
      pageSize: 20,
      search: "",
      sort: "name",
      sortDirection: "asc",
      triggerTypeId: undefined,
      dataTableId: undefined,
    };
    setFilterParams(defaultParams);
    setParams(defaultParams);
   }, []);

  const triggerOptions = useMemo(() => {
  return triggerTypes.map((t) => ({
    value: String(t.id),
    label: t.lookupValue || t.lookupCode,
  }));
}, [triggerTypes]);

const dataTableOptions = useMemo(() => {
  return (
    dataTablesData?.dataTables?.map((dt) => ({
      value: String(dt.id),
      label: dt.displayName || dt.name,
    })) ?? []
  );
}, [dataTablesData]);

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
    <Paper p="md" radius="md">
      <Stack gap="md">
        {/* Header */}
        <Group justify="space-between" align="center">
          <Group justify="space-between">
            <Container pl={0}>
              <Group gap={8} align="center">
                <Text size="lg" fw={600}>
                  Actions
                </Text>
                {data && data.actions.length > 0 && (
                  <Badge ml={4} variant="light" color="gray" size="sm">
                    {data.actions.length}
                  </Badge>
                )}
              </Group>
              <Text size="sm" c="dimmed">
                Manage and monitor actions
              </Text>
            </Container>
          </Group>
          <Button
            leftSection={<IconPlus size={16} />}
            onClick={() => setCreateOpen(true)}
          >
            New Action
          </Button>
        </Group>

        {/* Search */}
        <Card withBorder>
          <Stack gap="md">
            {/* Filters row */}
            <Group gap="md" wrap="nowrap">
              <TextInput
                label="Search"
                value={filterParams.search || ""}
                onChange={(e) => handleSearch(e.currentTarget.value)}
                placeholder="Search actions"
                style={{ flex: 1 }}
                rightSection={
                  filterParams.search ? (
                    <ActionIcon
                      variant="subtle"
                      size="sm"
                      onClick={clearSearch}
                    >
                      <IconX size={14} />
                    </ActionIcon>
                  ) : null
                }
              />

              <Select
                label="Trigger"
                placeholder="Trigger"
                data={triggerOptions}
                value={filterParams.triggerTypeId || ""}
                onChange={(value) =>
                  setFilterParams((prev) => ({
                    ...prev,
                    triggerType: value || undefined,
                    page: 1,
                  }))
                }
                clearable
              />

              <Select
                label="Data table"
                placeholder="Data table"
                data={dataTableOptions}
                value={filterParams.dataTableId || ""}
                onChange={(value) =>
                  setFilterParams((prev) => ({
                    ...prev,
                    dataTable: value || undefined,
                    page: 1,
                  }))
                }
                clearable
              />
            </Group>

            {/* Actions row (same pattern as ScheduledJobsList) */}
            <FilterActions
              onApply={handleApplyFilters}
              onReset={handleResetFilters}
              onRefresh={() => refetch()}
              isFetching={isFetching}
              isApplyDisabled={filterParams === params}
            />
          </Stack>
        </Card>

        {/* Actions table */}
        <div style={{ position: "relative" }}>
          <LoadingOverlay
            visible={isFetching}
            overlayProps={{ blur: 0, backgroundOpacity: 0.35 }}
            loaderProps={{ size: "md" }}
          />

          <Card withBorder>
            <Table striped highlightOnHover style={{ fontSize: 14 }}>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>ID</Table.Th>
                  <Table.Th>Name</Table.Th>
                  <Table.Th>Trigger</Table.Th>
                  <Table.Th>Data table</Table.Th>
                  <Table.Th style={{ width: 120 }} />
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {data?.actions && data.actions.length > 0 ? (
                  rows
                ) : (
                  <Table.Tr>
                    <Table.Td
                      colSpan={5}
                      style={{ textAlign: "center", padding: "60px 20px" }}
                    >
                      <EmptyState
                        title={
                          isFetching ? "Loading actions..." : "No actions found"
                        }
                        description={
                          !isFetching
                            ? "Try adjusting your search or filter criteria"
                            : undefined
                        }
                      />
                    </Table.Td>
                  </Table.Tr>
                )}
              </Table.Tbody>
            </Table>
          </Card>
        </div>

        {/* Pagination */}
        {data?.pagination && (
          <Group justify="center" mt="md">
            <Pagination
              value={params.page || 1}
              total={data.pagination.totalPages}
              onChange={(page) => setParams((prev) => ({ ...prev, page }))}
            />
          </Group>
        )}

        {/* Modals */}
        <ActionFormModal
          opened={createOpen}
          onClose={() => setCreateOpen(false)}
          mode="create"
        />
        {editAction && (
          <ActionFormModal
            opened={!!editAction}
            onClose={() => setEditAction(null)}
            mode="edit"
            actionId={editAction.id}
          />
        )}
        {deleteTarget && (
          <DeleteActionModal
            opened={!!deleteTarget}
            onClose={() => setDeleteTarget(null)}
            onConfirm={() =>
              deleteMutation.mutate(deleteTarget.id, {
                onSettled: () => setDeleteTarget(null),
              })
            }
            actionName={deleteTarget.name}
            isLoading={deleteMutation.isPending}
          />
        )}
      </Stack>
    </Paper>
  );
}


