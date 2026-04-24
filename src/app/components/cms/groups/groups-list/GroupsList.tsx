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
} from '@mantine/core';
import {
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
  Box,
} from '@mantine/core';
import {
  IconSearch,
  IconEdit,
  IconTrash,
  IconDots,
  IconPlus,
  IconSortAscending,
  IconSortDescending,
  IconShield,
  IconUsers,
  IconX,
} from '@tabler/icons-react';
import { useGroups } from '../../../../../hooks/useGroups';
import type { IGroupDetails, IGroupsListParams } from '../../../../../types/responses/admin/groups.types';
import { PageHeader } from '../../../shared/common/PageHeader';
import { FilterActions } from '../../../shared/common/FilterControls';
import { EmptyState } from '../../../shared/common/EmptyState';

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
        header: ({ column }) => (
          <Group gap="xs">
            <Text fw={500}>ID</Text>
            <ActionIcon
              variant="transparent"
              size="xs"
              onClick={() =>
                column.toggleSorting(column.getIsSorted() === "asc")
              }
            >
              {column.getIsSorted() === "asc" ? (
                <IconSortAscending size={14} />
              ) : column.getIsSorted() === "desc" ? (
                <IconSortDescending size={14} />
              ) : (
                <IconSortAscending size={14} opacity={0.5} />
              )}
            </ActionIcon>
          </Group>
        ),
        cell: ({ row }) => (
          <Text size="sm" fw={500}>
            {row.original.id}
          </Text>
        ),
        enableSorting: true,
      },
      {
        accessorKey: "name",
        header: ({ column }) => (
          <Group gap="xs">
            <Text fw={500}>Name</Text>
            <ActionIcon
              variant="transparent"
              size="xs"
              onClick={() =>
                column.toggleSorting(column.getIsSorted() === "asc")
              }
            >
              {column.getIsSorted() === "asc" ? (
                <IconSortAscending size={14} />
              ) : column.getIsSorted() === "desc" ? (
                <IconSortDescending size={14} />
              ) : (
                <IconSortAscending size={14} opacity={0.5} />
              )}
            </ActionIcon>
          </Group>
        ),
        cell: ({ row }) => (
          <div>
            <Text size="sm" fw={500}>
              {row.original.name}
            </Text>
            {row.original.description && (
              <Text size="xs" c="dimmed">
                {row.original.description}
              </Text>
            )}
          </div>
        ),
        enableSorting: true,
      },
      {
        accessorKey: "users_count",
        header: ({ column }) => (
          <Group gap="xs">
            <Text fw={500}>Users</Text>
            <ActionIcon
              variant="transparent"
              size="xs"
              onClick={() =>
                column.toggleSorting(column.getIsSorted() === "asc")
              }
            >
              {column.getIsSorted() === "asc" ? (
                <IconSortAscending size={14} />
              ) : column.getIsSorted() === "desc" ? (
                <IconSortDescending size={14} />
              ) : (
                <IconSortAscending size={14} opacity={0.5} />
              )}
            </ActionIcon>
          </Group>
        ),
        cell: ({ row }) => (
          <Badge size="sm" variant="light" color="blue">
            {row.original.users_count}
          </Badge>
        ),
        enableSorting: true,
      },
      {
        accessorKey: "requires2fa",
        header: ({ column }) => (
          <Group gap="xs">
            <Text fw={500}>2FA Required</Text>
            <ActionIcon
              variant="transparent"
              size="xs"
              onClick={() =>
                column.toggleSorting(column.getIsSorted() === "asc")
              }
            >
              {column.getIsSorted() === "asc" ? (
                <IconSortAscending size={14} />
              ) : column.getIsSorted() === "desc" ? (
                <IconSortDescending size={14} />
              ) : (
                <IconSortAscending size={14} opacity={0.5} />
              )}
            </ActionIcon>
          </Group>
        ),
        cell: ({ row }) => (
          <Badge
            variant="light"
            color={row.original.requires_2fa ? "orange" : "gray"}
            size="sm"
          >
            {row.original.requires_2fa ? "Enabled" : "Disabled"}
          </Badge>
        ),
        enableSorting: true,
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => (
          <Group gap="xs">
            <Tooltip label="Edit Group">
              <ActionIcon
                variant="subtle"
                size="sm"
                onClick={() => onEditGroup?.(row.original.id)}
              >
                <IconEdit size={16} />
              </ActionIcon>
            </Tooltip>

            <Tooltip label="Manage ACLs">
              <ActionIcon
                variant="subtle"
                size="sm"
                color="blue"
                onClick={() =>
                  onManageAcls?.(row.original.id, row.original.name)
                }
              >
                <IconShield size={16} />
              </ActionIcon>
            </Tooltip>

            <Menu shadow="md" width={200}>
              <Menu.Target>
                <ActionIcon variant="subtle" size="sm">
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
                  View Members
                </Menu.Item>
                <Menu.Divider />
                <Menu.Item
                  leftSection={<IconTrash size={14} />}
                  color="red"
                  onClick={() =>
                    onDeleteGroup?.(row.original.id, row.original.name)
                  }
                >
                  Delete Group
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
        >
          <Button
            leftSection={<IconPlus size={16} />}
            onClick={onCreateGroup}
          >
            Create Group
          </Button>
        </PageHeader>

        {/* Filters Card */}
        <Card withBorder p="md">
          <Stack gap="md">
            <Group gap="md" align="flex-end">
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

            {/* Filter Actions - Right aligned under the form */}
            <Group justify="flex-end">
              <FilterActions
                onApply={handleApplyFilters}
                onReset={handleResetFilters}
                onRefresh={refetch}
                isFetching={isFetching}
                isApplyDisabled={filterParams === params}
              />
            </Group>
          </Stack>
        </Card>

        {/* Table */}
        <div style={{ position: 'relative' }}>
          <LoadingOverlay visible={isFetching} />
          
          <Box style={{ overflowX: 'auto' }}>
            <Table striped highlightOnHover>
              <TableThead>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableTr key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <TableTh key={header.id}>
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
                      <TableTd key={cell.id}>
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

        {/* Pagination */}
        {groupsData?.pagination && groupsData.pagination.totalPages > 1 && (
          <Group justify="space-between">
            <Text size="sm" c="dimmed">
              Showing {((groupsData.pagination.page - 1) * groupsData.pagination.pageSize) + 1} to{' '}
              {Math.min(groupsData.pagination.page * groupsData.pagination.pageSize, groupsData.pagination.totalCount)} of{' '}
              {groupsData.pagination.totalCount} groups
            </Text>
            
            <Pagination
              value={groupsData.pagination.page}
              onChange={handlePageChange}
              total={groupsData.pagination.totalPages}
              size="sm"
            />
          </Group>
        )}
      </Stack>
    </Card>
  );
} 