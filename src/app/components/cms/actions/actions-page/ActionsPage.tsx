/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
"use client";

import { useCallback, useMemo, useState } from 'react';
import { Button, Group, Stack, TextInput, ActionIcon, Card, Table, Pagination, Paper, Select, LoadingOverlay, Tooltip, Box, Text } from '@mantine/core';
import { IconPlus, IconX, IconEdit, IconTrash } from '@tabler/icons-react';
import { useActions, useDeleteAction } from '../../../../../hooks/useActions';
import type { IActionsListParams, IActionDetails } from '../../../../../types/responses/admin/actions.types';
import { DeleteActionModal } from '../delete-action-modal/DeleteActionModal';
import { ActionFormModal } from '../action-form-modal/ActionFormModal';
import { useDataTables } from '../../../../../hooks/useData';
import { useLookupsByType } from '../../../../../hooks/useLookups';
import { FilterActions } from '../../../shared/common/FilterControls';
import { EmptyState } from '../../../shared/common/EmptyState';
import { PageHeader } from '../../../shared/common/PageHeader';
import { adminTableClasses as tableStyles } from '../../shared/admin-table';

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
        <Table.Td className={tableStyles.tableCell}>{action.id}</Table.Td>
        <Table.Td className={tableStyles.tableCell}>{action.name}</Table.Td>
        <Table.Td className={tableStyles.tableCell}>{action.action_trigger_type?.lookup_value || action.action_trigger_type?.lookup_code || String(action.id_actionTriggerTypes ?? '')}</Table.Td>
        <Table.Td className={tableStyles.tableCell}>{action.data_table?.displayName || action.data_table?.name || ''}</Table.Td>
        <Table.Td className={tableStyles.tableCell}>
          <Group gap={2} wrap="nowrap" justify="flex-end" className={tableStyles.actionsCell}>
            <Tooltip label="Edit action" withArrow>
              <ActionIcon variant="subtle" color="gray" size="sm" aria-label="Edit action" onClick={() => setEditAction(action)}><IconEdit size={16} /></ActionIcon>
            </Tooltip>
            <Tooltip label="Delete action" withArrow>
              <ActionIcon variant="subtle" color="red" size="sm" aria-label="Delete action" onClick={() => setDeleteTarget(action)}><IconTrash size={16} /></ActionIcon>
            </Tooltip>
          </Group>
        </Table.Td>
      </Table.Tr>
    ));
  }, [data]);

  return (
    <Paper p="md" radius="md">
      <Stack gap="md">
           {/* Standardized Header */}
        <PageHeader
          title="Actions"
          subtitle="Manage and monitor actions"
          badge={data?.pagination?.totalCount ?? 0}
        >
          <Button
            leftSection={<IconPlus size={16} />}
            onClick={() => setCreateOpen(true)}
          >
            New Action
          </Button>
        </PageHeader>

        {/* Filters Card — search + selects on the same row as the actions. */}
        <Card withBorder p="md">
          <Group gap="md" align="flex-end" justify="space-between">
            <Group gap="md" style={{ flex: 1 }}>
              <TextInput
                value={filterParams.search || ""}
                onChange={(e) => handleSearch(e.currentTarget.value)}
                placeholder="Search actions"
                style={{ flex: 1 }}
                rightSection={
                  filterParams.search ? (
                    <ActionIcon
                      variant="subtle"
                      color="gray"
                      size="sm"
                      onClick={clearSearch}
                    >
                      <IconX size={14} />
                    </ActionIcon>
                  ) : null
                }
              />

              <Select
                placeholder="Trigger"
                data={triggerOptions}
                value={filterParams.triggerTypeId ? String(filterParams.triggerTypeId) : null}
                onChange={(value) =>
                  setFilterParams((prev) => ({
                    ...prev,
                    triggerTypeId: value || undefined,
                    page: 1,
                  }))
                }
                clearable
                w={180}
              />

              <Select
                placeholder="Data table"
                data={dataTableOptions}
                value={filterParams.dataTableId ? String(filterParams.dataTableId) : null}
                onChange={(value) =>
                  setFilterParams((prev) => ({
                    ...prev,
                    dataTableId: value || undefined,
                    page: 1,
                  }))
                }
                clearable
                w={180}
              />
            </Group>

            <Group justify="flex-end">
              <FilterActions
                onApply={handleApplyFilters}
                onReset={handleResetFilters}
                onRefresh={() => refetch()}
                isFetching={isFetching}
                isApplyDisabled={filterParams === params}
              />
            </Group>
          </Group>
        </Card>

        {/* Actions table */}
        <div className={tableStyles.tableWrapper}>
          <LoadingOverlay
            visible={isFetching}
            overlayProps={{ blur: 0, backgroundOpacity: 0.35 }}
            loaderProps={{ size: "md" }}
          />

          <Box className={tableStyles.tableScrollContainer}>
            <Table highlightOnHover verticalSpacing="sm" horizontalSpacing="md">
              <Table.Thead>
                <Table.Tr>
                  <Table.Th className={tableStyles.tableHeader}><span className={tableStyles.colHeader}>ID</span></Table.Th>
                  <Table.Th className={tableStyles.tableHeader}><span className={tableStyles.colHeader}>Name</span></Table.Th>
                  <Table.Th className={tableStyles.tableHeader}><span className={tableStyles.colHeader}>Trigger</span></Table.Th>
                  <Table.Th className={tableStyles.tableHeader}><span className={tableStyles.colHeader}>Data table</span></Table.Th>
                  <Table.Th className={tableStyles.tableHeader} style={{ width: 120 }}><span className={tableStyles.colHeader}>Actions</span></Table.Th>
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
          </Box>
        </div>

        {/* Pagination — always visible when data is loaded. */}
        {data?.pagination && (
          <Group justify="space-between">
            <Text size="sm" c="dimmed">
              {data.pagination.totalCount === 0
                ? "No actions"
                : `Showing ${
                    ((params.page ?? 1) - 1) * (params.pageSize ?? 20) + 1
                  } to ${Math.min(
                    (params.page ?? 1) * (params.pageSize ?? 20),
                    data.pagination.totalCount,
                  )} of ${data.pagination.totalCount} actions`}
            </Text>
            <Pagination
              value={params.page || 1}
              total={Math.max(data.pagination.totalPages, 1)}
              onChange={(page) => setParams((prev) => ({ ...prev, page }))}
              size="sm"
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


