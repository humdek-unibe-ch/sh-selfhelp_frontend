/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
"use client";

import { useState, useMemo, useCallback } from 'react';
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
  type OnChangeFn,
} from '@tanstack/react-table';
import {
  Table,
  TableTbody,
  TableTd,
  TableThead,
  TableTh,
  TableTr,

  Card,
  Group,
  TextInput,
  Select,
  Pagination,
  Badge,
  ActionIcon,
  Tooltip,
  LoadingOverlay,
  Text,
  Stack,
  Button,
  Menu,
  Box} from '@mantine/core';

import {
  IconSearch,
  IconEdit,
  IconTrash,
  IconDots,
  IconPlus,
  IconShield,
  IconUsers,
  IconX,
} from '@tabler/icons-react';
import { useGroups } from '../../../../../hooks/useGroups';
import type { IGroupDetails, IGroupsListParams } from '../../../../../types/responses/admin/groups.types';
import { PageHeader } from '../../../shared/common/PageHeader';
import { FilterActions } from '../../../shared/common/FilterControls';
import { EmptyState } from '../../../shared/common/EmptyState';
import { SortHeader, adminTableClasses as tableStyles } from '../../shared/admin-table';
import classes from './GroupsList.module.css';

interface IGroupsListProps {
  onCreateGroup?: () => void;
  onEditGroup?: (groupId: number) => void;
  onDeleteGroup?: (groupId: number, groupName: string) => void;
  onManageAcls?: (groupId: number, groupName: string) => void;
}

export function GroupsList({
  onCreateGroup,
  onEditGroup,
  onDeleteGroup,
  onManageAcls,
}: IGroupsListProps) {
 // Filter form state (what user is editing)
  const [filterParams, setFilterParams] = useState<IGroupsListParams>({
    page: 1,
    pageSize: 20,
    search: '',
    sort: 'name',
    sortDirection: 'asc',
  });

  // Applied params (what is sent to the API)
  const [params, setParams] = useState<IGroupsListParams>(filterParams);

  // Fetch groups data
  const { data: groupsData, isFetching, refetch, error } = useGroups(params);

  // Table sorting state
  const [sorting, setSorting] = useState<SortingState>([
    { id: params.sort || 'name', desc: params.sortDirection === 'desc' }
  ]);

  // Handle sorting change
  const handleSortingChange = useCallback<OnChangeFn<SortingState>>((updaterOrValue) => {
    const newSorting = typeof updaterOrValue === 'function' 
      ? updaterOrValue(sorting) 
      : updaterOrValue;
    
    setSorting(newSorting);
    
    if (newSorting.length > 0) {
      const sortField = newSorting[0];
      setParams(prev => ({
        ...prev,
        sort: sortField.id as IGroupsListParams['sort'],
        sortDirection: sortField.desc ? 'desc' : 'asc',
        page: 1,
      }));
    }
  }, [sorting]);

  // Handle search
  const handleSearch = useCallback((search: string) => {
    setFilterParams(prev => ({
      ...prev,
      search,
      page: 1,
    }));
  }, []);

  // Handle search clear
  const handleClearSearch = useCallback(() => {
    setParams(prev => ({
      ...prev,
      search: '',
      page: 1,
    }));
  }, []);

  // Handle page change
  const handlePageChange = useCallback((page: number) => {
    setParams(prev => ({ ...prev, page }));
  }, []);

  // Handle page size change
  const handlePageSizeChange = useCallback((pageSize: string | null) => {
    if (pageSize) {
      setFilterParams(prev => ({
        ...prev,
        pageSize: parseInt(pageSize, 10),
        page: 1,
      }));
    }
  }, []);

    const handleApplyFilters = useCallback(() => {
    setParams({ ...filterParams, page: 1 });
  }, [filterParams]);

  const handleResetFilters = useCallback(() => {
    const defaultParams: IGroupsListParams = {
      page: 1,
      pageSize: 20,
      search: '',
      sort: 'name',
      sortDirection: 'asc',
    };
    setFilterParams(defaultParams);
    setParams(defaultParams);
  }, []);

  // Define table columns
  const columns = useMemo<ColumnDef<IGroupDetails>[]>(
    () => [
      {
        accessorKey: "id",
        header: () => <span className={tableStyles.colHeader}>ID</span>,
        cell: ({ row }) => (
          <Text size="sm" c="dimmed">
            {row.original.id}
          </Text>
        ),
      },
      {
        accessorKey: "name",
        header: ({ column }) => <SortHeader label="Name" column={column} />,
        cell: ({ row }) => (
          <div className={classes.nameText}>
            <Text size="sm" fw={600} className={classes.groupName}>
              {row.original.name}
            </Text>
            {row.original.description && (
              <Text size="xs" c="dimmed" className={classes.groupDescription}>
                {row.original.description}
              </Text>
            )}
          </div>
        ),
        enableSorting: true,
      },
      {
        accessorKey: "users_count",
        header: () => <span className={tableStyles.colHeader}>Users</span>,
        cell: ({ row }) => (
          <Badge size="sm" variant="light" color="blue" radius="sm">
            {row.original.users_count}
          </Badge>
        ),
      },
      {
        accessorKey: "requires2fa",
        header: () => <span className={tableStyles.colHeader}>2FA Required</span>,
        cell: ({ row }) => (
          <Badge
            variant="light"
            color={row.original.requires_2fa ? "orange" : "gray"}
            size="sm"
            radius="sm"
          >
            {row.original.requires_2fa ? "Enabled" : "Disabled"}
          </Badge>
        ),
      },
      {
        id: "actions",
        header: () => <span className={tableStyles.colHeader}>Actions</span>,
        cell: ({ row }) => (
          <Group gap={2} wrap="nowrap" className={tableStyles.actionsCell}>
            <Tooltip label="Edit group" withArrow>
              <ActionIcon
                variant="subtle"
                color="gray"
                size="sm"
                aria-label="Edit group"
                onClick={() => onEditGroup?.(row.original.id)}
              >
                <IconEdit size={16} />
              </ActionIcon>
            </Tooltip>

            <Tooltip label="Manage ACLs" withArrow>
              <ActionIcon
                variant="subtle"
                size="sm"
                color="blue"
                aria-label="Manage ACLs"
                onClick={() =>
                  onManageAcls?.(row.original.id, row.original.name)
                }
              >
                <IconShield size={16} />
              </ActionIcon>
            </Tooltip>

            <Menu shadow="md" width={200} position="bottom-end" withArrow>
              <Menu.Target>
                <ActionIcon variant="subtle" color="gray" size="sm" aria-label="More actions">
                  <IconDots size={16} />
                </ActionIcon>
              </Menu.Target>

              <Menu.Dropdown>
                <Menu.Item
                  leftSection={<IconUsers size={14} />}
                  onClick={() => {
                    /* Handle view members */
                  }}
                >
                  View members
                </Menu.Item>
                <Menu.Divider />
                <Menu.Item
                  leftSection={<IconTrash size={14} />}
                  color="red"
                  onClick={() =>
                    onDeleteGroup?.(row.original.id, row.original.name)
                  }
                >
                  Delete group
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
          </Group>
        ),
      },
    ],
    [onEditGroup, onDeleteGroup, onManageAcls],
  );

  // Initialize table
  // eslint-disable-next-line react-hooks/incompatible-library -- TanStack Table's useReactTable returns non-memoizable functions by design; React Compiler intentionally skips memoizing here
  const table = useReactTable({
    data: groupsData?.groups || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualSorting: true,
    manualPagination: true,
    state: {
      sorting,
    },
    onSortingChange: handleSortingChange,
    enableSortingRemoval: false,
  });

  if (error) {
    return (
      <Card>
        <Text c="red" ta="center">
          Failed to load groups. Please try again.
        </Text>
      </Card>
    );
  }

  return (
    <Card>
      <Stack gap="md">
        {/* Header */}
        <PageHeader
          title="Groups Management"
          subtitle="Manage user groups and their permissions"
          badge={groupsData?.pagination.totalCount ?? 0}
        >
          <Button
            leftSection={<IconPlus size={16} />}
            onClick={onCreateGroup}
          >
            Create Group
          </Button>
        </PageHeader>

        {/* Filters Card — search + page size on the same row as the actions. */}
        <Card withBorder p="md">
          <Group gap="md" align="flex-end" justify="space-between">
            <Group gap="md" style={{ flex: 1 }}>
              <TextInput
                placeholder="Search groups..."
                leftSection={<IconSearch size={16} />}
                rightSection={
                  filterParams.search ? (
                    <ActionIcon variant="subtle" color="gray" size="sm" onClick={handleClearSearch}>
                      <IconX size={14} />
                    </ActionIcon>
                  ) : null
                }
                value={filterParams.search}
                onChange={(e) => handleSearch(e.currentTarget.value)}
                style={{ flex: 1 }}
              />

              <Select
                placeholder="Per page"
                value={filterParams.pageSize?.toString() || "20"}
                onChange={handlePageSizeChange}
                data={[
                  { value: "10", label: "10" },
                  { value: "20", label: "20" },
                  { value: "50", label: "50" },
                  { value: "100", label: "100" },
                ]}
                w={100}
              />
            </Group>

            <Group justify="flex-end">
              <FilterActions
                onApply={handleApplyFilters}
                onReset={handleResetFilters}
                onRefresh={refetch}
                isFetching={isFetching}
                isApplyDisabled={filterParams === params}
              />
            </Group>
          </Group>
        </Card>

        {/* Table */}
        <div className={tableStyles.tableWrapper}>
          <LoadingOverlay visible={isFetching} />

          <Box className={tableStyles.tableScrollContainer}>
            <Table highlightOnHover verticalSpacing="sm" horizontalSpacing="md">
              <TableThead>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableTr key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <TableTh key={header.id} className={tableStyles.tableHeader}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </TableTh>
                    ))}
                  </TableTr>
                ))}
              </TableThead>
              <TableTbody>
                {table.getRowModel().rows.map((row) => (
                  <TableTr key={row.id}>
                    {row.getVisibleCells().map((cell) => (
                      <TableTd key={cell.id} className={tableStyles.tableCell}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableTd>
                    ))}
                  </TableTr>
                ))}
              </TableTbody>
            </Table>
          </Box>

          {/* Empty State */}
          {!isFetching && (!groupsData?.groups || groupsData.groups.length === 0) && (
            <EmptyState
              title="No groups found"
              description={
                params.search
                  ? "Try adjusting your search criteria"
                  : "Get started by creating your first group"
              }
            />
          )}
        </div>

        {/* Pagination — always visible when data is loaded. */}
        {groupsData?.pagination && (
          <Group justify="space-between">
            <Text size="sm" c="dimmed">
              {groupsData.pagination.totalCount === 0
                ? "No groups"
                : `Showing ${
                    (groupsData.pagination.page - 1) * groupsData.pagination.pageSize + 1
                  } to ${Math.min(
                    groupsData.pagination.page * groupsData.pagination.pageSize,
                    groupsData.pagination.totalCount,
                  )} of ${groupsData.pagination.totalCount} groups`}
            </Text>

            <Pagination
              value={groupsData.pagination.page}
              onChange={handlePageChange}
              total={Math.max(groupsData.pagination.totalPages, 1)}
              size="sm"
            />
          </Group>
        )}
      </Stack>
    </Card>
  );
} 