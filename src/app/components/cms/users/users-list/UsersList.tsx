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
  IconLock,
  IconLockOpen,
  IconMail,
  IconUserCheck,
  IconDots,
  IconPlus,
  IconX,
} from '@tabler/icons-react';
import { useUsers } from '../../../../../hooks/useUsers';
import type { IUserBasic, IUsersListParams } from '../../../../../types/responses/admin/users.types';
import { getUserStatusColor } from '../../../../../utils/status-color.utils';
import classes from './UsersList.module.css';
import { PageHeader } from '../../../shared/common/PageHeader';
import { EmptyState } from '../../../shared/common/EmptyState';
import { FilterActions } from '../../../shared/common/FilterControls';
import { AdminTableFooter, SortHeader, adminTableClasses as tableStyles } from '../../shared/admin-table';

interface IUsersListProps {
  onCreateUser?: () => void;
  onEditUser?: (userId: number) => void;
  onDeleteUser?: (userId: number, email: string) => void;
  onToggleBlock?: (userId: number, blocked: boolean) => void;
  onSendActivationMail?: (userId: number) => void;
  onImpersonateUser?: (userId: number) => void;
  permissions?: {
    canCreate?: boolean;
    canUpdate?: boolean;
    canDelete?: boolean;
    canBlock?: boolean;
    canUnblock?: boolean;
    canImpersonate?: boolean;
  };
}

export function UsersList({
  onCreateUser,
  onEditUser,
  onDeleteUser,
  onToggleBlock,
  onSendActivationMail,
  onImpersonateUser,
  permissions = {},
}: IUsersListProps) {
  // Filter form state (what user is editing)
  const [filterParams, setFilterParams] = useState<IUsersListParams>({
    page: 1,
    pageSize: 20,
    search: "",
    sort: "email",
    sortDirection: "asc",
  });

  // Applied params (what is sent to the API)
  const [params, setParams] = useState<IUsersListParams>(filterParams);

  // Fetch users data
  const { data: usersData, isFetching, error, refetch } = useUsers(params);

  // Table sorting state
  const [sorting, setSorting] = useState<SortingState>([
    { id: filterParams.sort || "email", desc: filterParams.sortDirection === "desc" },
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
          sort: sortField.id as IUsersListParams["sort"],
          sortDirection: sortField.desc ? "desc" : "asc",
          page: 1, // Reset to first page when sorting
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
      page: 1, // Reset to first page when searching
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

  // Handle page change
  const handlePageChange = useCallback((page: number) => {
    setParams((prev) => ({ ...prev, page }));
  }, []);

  // Handle page size change
  const handlePageSizeChange = useCallback((pageSize: string | null) => {
    if (pageSize) {
      setFilterParams((prev) => ({
        ...prev,
        pageSize: parseInt(pageSize, 10),
        page: 1, // Reset to first page when changing page size
      }));
    }
  }, []);

  // Reset filters
  const handleResetFilters = useCallback(() => {
    const defaultParams: IUsersListParams = {
      page: 1,
      pageSize: 20,
      search: "",
      sort: "email",
      sortDirection: "asc",
    };
    setFilterParams(defaultParams);
    setParams(defaultParams);
  }, []);

  // Apply filters
  const handleApplyFilters = useCallback(() => {
    setParams({ ...filterParams, page: 1 });
  }, [filterParams]);

  // Define table columns
  const columns = useMemo<ColumnDef<IUserBasic>[]>(
    () => [
      {
        accessorKey: "id",
        header: ({ column }) => <SortHeader label="ID" column={column} />,
        cell: ({ row }) => (
          <Text size="sm" c="dimmed">
            {row.original.id}
          </Text>
        ),
        enableSorting: true,
      },
      {
        accessorKey: "email",
        header: ({ column }) => <SortHeader label="User" column={column} />,
        cell: ({ row }) => {
          const u = row.original;
          return (
            <div className={classes.userText}>
              <Text size="sm" fw={600} className={classes.userName}>
                {u.name || u.user_name || u.email}
              </Text>
              <Text size="xs" c="dimmed" className={classes.userEmail}>
                {u.email}
              </Text>
            </div>
          );
        },
        enableSorting: true,
      },
      {
        accessorKey: "user_name",
        header: () => <span className={tableStyles.colHeader}>Username</span>,
        cell: ({ row }) => (
          <Text size="sm">{row.original.user_name || "—"}</Text>
        ),
      },
      {
        accessorKey: "code",
        header: () => <span className={tableStyles.colHeader}>User Code</span>,
        cell: ({ row }) =>
          row.original.code ? (
            <span className={tableStyles.monoCell}>{row.original.code}</span>
          ) : (
            <Text size="xs" c="dimmed">—</Text>
          ),
      },
      {
        accessorKey: "user_type",
        header: ({ column }) => <SortHeader label="Type" column={column} />,
        cell: ({ row }) => (
          <Badge
            variant="light"
            color={row.original.user_type_code === "admin" ? "red" : "blue"}
            size="sm"
            radius="sm"
            styles={{ label: { textTransform: "capitalize" } }}
          >
            {row.original.user_type}
          </Badge>
        ),
        enableSorting: true,
      },
      {
        accessorKey: "status",
        header: ({ column }) => <SortHeader label="Status" column={column} />,
        cell: ({ row }) => {
          const status = row.original.blocked ? "blocked" : row.original.status;
          return (
            <Badge
              variant="light"
              color={getUserStatusColor(status)}
              size="sm"
              radius="sm"
              styles={{ label: { textTransform: "capitalize" } }}
            >
              {row.original.blocked ? "Blocked" : row.original.status}
            </Badge>
          );
        },
        enableSorting: true,
      },
      {
        accessorKey: "groups",
        header: () => <span className={tableStyles.colHeader}>Groups</span>,
        cell: ({ row }) => {
          const groups = row.original.groups?.split(/[,;]/).map((g) => g.trim()).filter(Boolean) ?? [];
          if (groups.length === 0) return <Text size="xs" c="dimmed">—</Text>;
          return (
            <Group gap={4} wrap="wrap">
              {groups.map((g) => (
                <Badge key={g} variant="light" color="gray" size="sm" radius="sm">
                  {g}
                </Badge>
              ))}
            </Group>
          );
        },
      },
      {
        accessorKey: "roles",
        header: () => <span className={tableStyles.colHeader}>Roles</span>,
        cell: ({ row }) => {
          const roles = row.original.roles?.split(/[,;]/).map((r) => r.trim()).filter(Boolean) ?? [];
          if (roles.length === 0) return <Text size="xs" c="dimmed">—</Text>;
          return (
            <Group gap={4} wrap="wrap">
              {roles.map((r) => (
                <Badge key={r} variant="light" color="blue" size="sm" radius="sm">
                  {r}
                </Badge>
              ))}
            </Group>
          );
        },
      },
      {
        accessorKey: "last_login",
        header: ({ column }) => <SortHeader label="Last Login" column={column} />,
        cell: ({ row }) => (
          <Text size="xs" c="dimmed">
            {row.original.last_login || "Never"}
          </Text>
        ),
        enableSorting: true,
      },
      {
        accessorKey: "user_activity",
        header: () => <span className={tableStyles.colHeader}>Activity</span>,
        cell: ({ row }) => (
          <Text size="xs" c="dimmed">
            {row.original.user_activity}
          </Text>
        ),
      },
      {
        id: "actions",
        header: () => <span className={tableStyles.colHeader}>Actions</span>,
        cell: ({ row }) => (
          <Group gap={2} wrap="nowrap" className={tableStyles.actionsCell}>
            <Tooltip label="Edit user" withArrow>
              <ActionIcon
                variant="subtle"
                color="gray"
                size="sm"
                aria-label="Edit user"
                onClick={() => onEditUser?.(row.original.id)}
                disabled={!permissions.canUpdate}
              >
                <IconEdit size={16} />
              </ActionIcon>
            </Tooltip>

            <Tooltip label={row.original.blocked ? "Unblock user" : "Block user"} withArrow>
              <ActionIcon
                variant="subtle"
                size="sm"
                color={row.original.blocked ? "green" : "red"}
                aria-label={row.original.blocked ? "Unblock user" : "Block user"}
                onClick={() =>
                  onToggleBlock?.(row.original.id, !row.original.blocked)
                }
                disabled={
                  row.original.blocked
                    ? !permissions.canUnblock
                    : !permissions.canBlock
                }
              >
                {row.original.blocked ? (
                  <IconLockOpen size={16} />
                ) : (
                  <IconLock size={16} />
                )}
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
                  leftSection={<IconMail size={14} />}
                  onClick={() => onSendActivationMail?.(row.original.id)}
                  disabled={!permissions.canUpdate}
                >
                  Send activation mail
                </Menu.Item>
                <Menu.Item
                  leftSection={<IconUserCheck size={14} />}
                  onClick={() => onImpersonateUser?.(row.original.id)}
                  disabled={!permissions.canImpersonate}
                >
                  Impersonate user
                </Menu.Item>
                <Menu.Divider />
                <Menu.Item
                  leftSection={<IconTrash size={14} />}
                  color="red"
                  onClick={() =>
                    onDeleteUser?.(row.original.id, row.original.email)
                  }
                  disabled={!permissions.canDelete}
                >
                  Delete user
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
          </Group>
        ),
      },
    ],
    [
      onEditUser,
      onDeleteUser,
      onToggleBlock,
      onSendActivationMail,
      onImpersonateUser,
      permissions.canBlock,
      permissions.canDelete,
      permissions.canImpersonate,
      permissions.canUnblock,
      permissions.canUpdate,
    ],
  );

  // Initialize table
  // eslint-disable-next-line react-hooks/incompatible-library -- TanStack Table's useReactTable returns non-memoizable functions by design; React Compiler intentionally skips memoizing here
  const table = useReactTable({
    data: usersData?.users || [],
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
          Failed to load users. Please try again.
        </Text>
      </Card>
    );
  }

  return (
    <Card>
      <Stack gap="md">
        {/* Standardized Header */}
        <PageHeader
          title="Users Management"
          subtitle="Manage user accounts, permissions, and settings"
          badge={usersData?.pagination.totalCount ?? 0}
          badgeAriaLabel="users"
        >
          <Group gap="xs">
            <Button
              leftSection={<IconPlus size={16} />}
              onClick={onCreateUser}
              disabled={!permissions.canCreate}
            >
              Create User
            </Button>
          </Group>
        </PageHeader>

        {/* Filters Card with FilterActions */}
        <Card withBorder p="md">
          <Group gap="md" align="flex-end" justify="space-between">
            <Group gap="md" style={{ flex: 1 }}>
              <TextInput
                placeholder="Search users by email, name, or code..."
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
            </Group>

             <Group justify="flex-end" gap="md" align="flex-end">
              <Select
                label="Rows per page"
                value={filterParams.pageSize?.toString()}
                onChange={handlePageSizeChange}
                data={[
                  { value: "10", label: "10" },
                  { value: "20", label: "20" },
                  { value: "50", label: "50" },
                  { value: "100", label: "100" },
                ]}
                withCheckIcon={false}
                allowDeselect={false}
                w={110}
              />

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

          {/* Reusable Empty State */}
          {!isFetching &&
            (!usersData?.users || usersData.users.length === 0) && (
              <EmptyState
                title="No users found"
                description={
                  params.search
                    ? "Try adjusting your search criteria"
                    : "Get started by creating your first user"
                }
              />
            )}

          {/* Footer — always visible when data is loaded. */}
          {usersData?.pagination && (
            <AdminTableFooter
              totalCount={usersData.pagination.totalCount}
              itemLabel="users"
              pagination={{
                page: usersData.pagination.page,
                pageSize: usersData.pagination.pageSize,
                totalPages: usersData.pagination.totalPages,
                onPageChange: handlePageChange,
              }}
            />
          )}
        </div>
      </Stack>
    </Card>
  );
} 