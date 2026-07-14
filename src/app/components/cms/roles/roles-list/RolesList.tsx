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
  IconUsers,
  IconX,
  IconFileText,
  IconDatabase,
  IconUserCheck,
} from '@tabler/icons-react';
import { useRoles } from '../../../../../hooks/useRoles';
import type { IRoleDetails, IRolesListParams } from '../../../../../types/responses/admin/roles.types';
import { PageHeader } from '../../../shared/common/PageHeader';
import { FilterActions } from '../../../shared/common/FilterControls';
import { EmptyState } from '../../../shared/common/EmptyState';
import { SortHeader, adminTableClasses as tableStyles } from '../../shared/admin-table';
import classes from './RolesList.module.css';

interface IRolesListProps {
  onCreateRole?: () => void;
  onEditRole?: (roleId: number) => void;
  onDeleteRole?: (roleId: number, roleName: string) => void;
  onManagePagePermissions?: (roleId: number, roleName: string) => void;
  onManageDataTablePermissions?: (roleId: number, roleName: string) => void;
  onManageGroupPermissions?: (roleId: number, roleName: string) => void;
}

export function RolesList({
  onCreateRole,
  onEditRole,
  onDeleteRole,
  onManagePagePermissions,
  onManageDataTablePermissions,
  onManageGroupPermissions,
}: IRolesListProps) {
  // Check if role is admin (untouchable)
  const isAdminRole = (roleName: string) => {
    return roleName.toLowerCase() === "admin";
  };
  // Filter form state (what user is editing)
  const [filterParams, setFilterParams] = useState<IRolesListParams>({
    page: 1,
    pageSize: 20,
    search: "",
    sort: "name",
    sortDirection: "asc",
  });

  // Applied params (what is sent to the API)
  const [params, setParams] = useState<IRolesListParams>(filterParams);

  // Fetch roles data
  const { data: rolesData, refetch, isFetching, error } = useRoles(params);

  // Table sorting state
  const [sorting, setSorting] = useState<SortingState>([
    { id: params.sort || "name", desc: params.sortDirection === "desc" },
  ]);

  // Handle sorting change
  const handleSortingChange = useCallback<OnChangeFn<SortingState>>(
    (updaterOrValue) => {
      const newSorting =
        typeof updaterOrValue === "function"
          ? updaterOrValue(sorting)
          : updaterOrValue;

      setSorting(newSorting);

      if (newSorting.length > 0) {
        const sortField = newSorting[0];
        setParams((prev) => ({
          ...prev,
          sort: sortField.id as IRolesListParams["sort"],
          sortDirection: sortField.desc ? "desc" : "asc",
          page: 1,
        }));
      }
    },
    [sorting],
  );

  // Handle search
  const handleSearch = useCallback((search: string) => {
    setFilterParams((prev) => ({
      ...prev,
      search,
      page: 1,
    }));
  }, []);

  // Handle search clear
  const handleClearSearch = useCallback(() => {
    setFilterParams((prev) => ({
      ...prev,
      search: "",
      page: 1,
    }));
  }, []);

  // Handle page size change
  const handlePageSizeChange = useCallback((pageSize: string | null) => {
    if (pageSize) {
      setFilterParams((prev) => ({
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
    const defaultParams: IRolesListParams = {
      page: 1,
      pageSize: 20,
      search: "",
      sort: "name",
      sortDirection: "asc",
    };
    setFilterParams(defaultParams);
    setParams(defaultParams);
  }, []);

  // Handle page change
  const handlePageChange = useCallback((page: number) => {
    setParams((prev) => ({ ...prev, page }));
  }, []);

  // Define table columns
  const columns = useMemo<ColumnDef<IRoleDetails>[]>(
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
        cell: ({ row }) => {
          const adminRole = isAdminRole(row.original.name);

          return (
            <div className={classes.nameText}>
              <Group gap="xs" align="center" wrap="nowrap">
                <Text size="sm" fw={600} className={classes.roleName}>
                  {row.original.name}
                </Text>
                {adminRole && (
                  <Badge size="xs" color="red" variant="light" radius="sm">
                    Admin
                  </Badge>
                )}
              </Group>
              {row.original.description && (
                <Text size="xs" c="dimmed" className={classes.roleDescription}>
                  {row.original.description}
                </Text>
              )}
            </div>
          );
        },
        enableSorting: true,
      },
      {
        accessorKey: "permissions_count",
        header: ({ column }) => <SortHeader label="Permissions" column={column} />,
        cell: ({ row }) => (
          <Badge size="sm" variant="light" color="blue" radius="sm">
            {row.original.permissions_count}
          </Badge>
        ),
        enableSorting: true,
      },
      {
        accessorKey: "users_count",
        header: ({ column }) => <SortHeader label="Users" column={column} />,
        cell: ({ row }) => (
          <Badge size="sm" variant="light" color="blue" radius="sm">
            {row.original.users_count}
          </Badge>
        ),
        enableSorting: true,
      },
      {
        id: "actions",
        header: () => <span className={tableStyles.colHeader}>Actions</span>,
        cell: ({ row }) => {
          const adminRole = isAdminRole(row.original.name);

          return (
            <Group gap={2} wrap="nowrap" className={tableStyles.actionsCell}>
              <Tooltip
                withArrow
                label={
                  adminRole ? "Admin role cannot be modified" : "Edit role"
                }
              >
                <ActionIcon
                  variant="subtle"
                  color="gray"
                  size="sm"
                  aria-label="Edit role"
                  disabled={adminRole}
                  onClick={() => !adminRole && onEditRole?.(row.original.id)}
                >
                  <IconEdit size={16} />
                </ActionIcon>
              </Tooltip>

              {/* Permission Management Buttons */}
              <Tooltip
                label={
                  adminRole
                    ? "Admin role permissions cannot be modified"
                    : "Manage Page Permissions"
                }
              >
                <ActionIcon
                  variant="subtle"
                  size="sm"
                  color="blue"
                  disabled={adminRole}
                  onClick={() =>
                    !adminRole &&
                    onManagePagePermissions?.(
                      row.original.id,
                      row.original.name,
                    )
                  }
                >
                  <IconFileText size={16} />
                </ActionIcon>
              </Tooltip>

              <Tooltip
                label={
                  adminRole
                    ? "Admin role permissions cannot be modified"
                    : "Manage Data Table Permissions"
                }
              >
                <ActionIcon
                  variant="subtle"
                  size="sm"
                  color="green"
                  disabled={adminRole}
                  onClick={() =>
                    !adminRole &&
                    onManageDataTablePermissions?.(
                      row.original.id,
                      row.original.name,
                    )
                  }
                >
                  <IconDatabase size={16} />
                </ActionIcon>
              </Tooltip>

              <Tooltip
                label={
                  adminRole
                    ? "Admin role permissions cannot be modified"
                    : "Manage Group Permissions"
                }
              >
                <ActionIcon
                  variant="subtle"
                  size="sm"
                  color="purple"
                  disabled={adminRole}
                  onClick={() =>
                    !adminRole &&
                    onManageGroupPermissions?.(
                      row.original.id,
                      row.original.name,
                    )
                  }
                >
                  <IconUserCheck size={16} />
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
                      /* Handle view users */
                    }}
                  >
                    View Users
                  </Menu.Item>
                  <Menu.Divider />
                  <Menu.Item
                    leftSection={<IconTrash size={14} />}
                    color="red"
                    disabled={adminRole}
                    onClick={() =>
                      !adminRole &&
                      onDeleteRole?.(row.original.id, row.original.name)
                    }
                  >
                    {adminRole ? "Admin role cannot be deleted" : "Delete Role"}
                  </Menu.Item>
                </Menu.Dropdown>
              </Menu>
            </Group>
          );
        },
      },
    ],
    [
      onEditRole,
      onDeleteRole,
      onManagePagePermissions,
      onManageDataTablePermissions,
      onManageGroupPermissions,
    ],
  );

  // Initialize table
  // eslint-disable-next-line react-hooks/incompatible-library -- TanStack Table's useReactTable returns non-memoizable functions by design; React Compiler intentionally skips memoizing here
  const table = useReactTable({
    data: rolesData?.roles || [],
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
          Failed to load roles. Please try again.
        </Text>
      </Card>
    );
  }

  return (
    <Card>
      <Stack gap="md">
        {/* Page Header */}
        <PageHeader
          title="Roles Management"
          subtitle="Manage user roles and their permissions"
          badge={rolesData?.pagination.totalCount ?? 0}
        >
          <Button leftSection={<IconPlus size={16} />} onClick={onCreateRole}>
            Create Role
          </Button>
        </PageHeader>

        {/* Filters Card — search + page size on the same row as the actions. */}
        <Card withBorder p="md">
          <Group gap="md" align="flex-end" justify="space-between">
            <Group gap="md" style={{ flex: 1 }}>
              <TextInput
                placeholder="Search roles..."
                leftSection={<IconSearch size={16} />}
                rightSection={
                  filterParams.search ? (
                    <ActionIcon
                      variant="subtle"
                      color="gray"
                      size="sm"
                      onClick={handleClearSearch}
                    >
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
                              header.getContext(),
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
                          cell.getContext(),
                        )}
                      </TableTd>
                    ))}
                  </TableTr>
                ))}
              </TableTbody>
            </Table>
          </Box>

            {/* Empty State */}
          {!isFetching && (!rolesData?.roles || rolesData.roles.length === 0) && (
            <EmptyState
              title="No roles found"
              description={
                params.search
                  ? "Try adjusting your search criteria"
                  : "Get started by creating your first role"
              }
            />
          )}
        </div>

        {/* Pagination — always visible when data is loaded. */}
        {rolesData?.pagination && (
          <Group justify="space-between">
            <Text size="sm" c="dimmed">
              {rolesData.pagination.totalCount === 0
                ? "No roles"
                : `Showing ${
                    (rolesData.pagination.page - 1) * rolesData.pagination.pageSize + 1
                  } to ${Math.min(
                    rolesData.pagination.page * rolesData.pagination.pageSize,
                    rolesData.pagination.totalCount,
                  )} of ${rolesData.pagination.totalCount} roles`}
            </Text>

            <Pagination
              value={rolesData.pagination.page}
              onChange={handlePageChange}
              total={Math.max(rolesData.pagination.totalPages, 1)}
              size="sm"
            />
          </Group>
        )}
      </Stack>
    </Card>
  );
} 