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
  Checkbox,
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
  IconFileExport,
  IconFileImport,
  IconX,
} from '@tabler/icons-react';
import {
  useUsers,
  useUsersStats,
  useBulkAddUsersToGroup,
  useBulkRemoveUsersFromGroup,
  useBulkSendActivation,
  useBulkDeleteUsers,
  useExportUsersCsv,
  useImportUsersCsv,
} from '../../../../../hooks/useUsers';
import { useGroups } from '../../../../../hooks/useGroups';
import type {
  IUserBasic,
  IUsersListParams,
  TUserStatusFilter,
} from '../../../../../types/responses/admin/users.types';
import { getUserStatusColor } from '../../../../../utils/status-color.utils';
import classes from './UsersList.module.css';
import { PageHeader } from '../../../shared/common/PageHeader';
import { EmptyState } from '../../../shared/common/EmptyState';
import { FilterActions } from '../../../shared/common/FilterControls';
import { AdminTableFooter, SortHeader, adminTableClasses as tableStyles } from '../../shared/admin-table';
import { UsersStatsTiles } from './UsersStatsTiles';
import { UsersBulkActionsBar } from './UsersBulkActionsBar';
import { BulkGroupMembershipModal } from './BulkGroupMembershipModal';
import { BulkDeleteUsersModal } from './BulkDeleteUsersModal';
import { ImportUsersCsvModal } from './ImportUsersCsvModal';

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

  // Row selection for the bulk actions, keyed by user id.
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  // Bulk / CSV modals. `groupMode` doubles as the open flag for the group
  // membership modal: null closed, otherwise the direction it operates in.
  const [groupMode, setGroupMode] = useState<'add' | 'remove' | null>(null);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);

  // Fetch users data
  const { data: usersData, isFetching, error, refetch } = useUsers(params);
  const {
    data: statsData,
    isLoading: isLoadingStats,
    isError: isStatsError,
  } = useUsersStats();

  // Groups drive the Group filter dropdown.
  const { data: groupsData } = useGroups({ pageSize: 100 });

  const bulkAddToGroup = useBulkAddUsersToGroup();
  const bulkRemoveFromGroup = useBulkRemoveUsersFromGroup();
  const bulkSendActivation = useBulkSendActivation();
  const bulkDelete = useBulkDeleteUsers();
  const exportCsv = useExportUsersCsv();
  const importCsv = useImportUsersCsv();

  const isBulkBusy =
    bulkAddToGroup.isPending ||
    bulkRemoveFromGroup.isPending ||
    bulkSendActivation.isPending ||
    bulkDelete.isPending;

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

  // Handle page change. Selection is per-page, so leaving the page drops it —
  // acting on ids that are no longer on screen is not what the count implies.
  const handlePageChange = useCallback((page: number) => {
    setSelectedIds(new Set());
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
    setSelectedIds(new Set());
    setParams({ ...filterParams, page: 1 });
  }, [filterParams]);

  const handleSelectAll = useCallback((checked: boolean) => {
    setSelectedIds(checked ? new Set((usersData?.users ?? []).map((u) => u.id)) : new Set());
  }, [usersData]);

  const handleToggleRow = useCallback((userId: number, checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) {
        next.add(userId);
      } else {
        next.delete(userId);
      }
      return next;
    });
  }, []);

  const selectedUsers = useMemo(
    () => (usersData?.users ?? []).filter((u) => selectedIds.has(u.id)),
    [usersData, selectedIds],
  );

  const handleBulkGroupMembership = useCallback(
    (groupIds: number[]) => {
      const mutation = groupMode === 'remove' ? bulkRemoveFromGroup : bulkAddToGroup;
      mutation.mutate(
        { userIds: [...selectedIds], groupIds },
        {
          onSuccess: () => {
            setGroupMode(null);
            setSelectedIds(new Set());
          },
        },
      );
    },
    [groupMode, bulkAddToGroup, bulkRemoveFromGroup, selectedIds],
  );

  const handleBulkSendActivation = useCallback(() => {
    bulkSendActivation.mutate([...selectedIds], {
      onSuccess: () => setSelectedIds(new Set()),
    });
  }, [bulkSendActivation, selectedIds]);

  const handleBulkDelete = useCallback(() => {
    bulkDelete.mutate([...selectedIds], {
      onSuccess: () => {
        setBulkDeleteOpen(false);
        setSelectedIds(new Set());
      },
    });
  }, [bulkDelete, selectedIds]);

  const handleImportCsv = useCallback(
    (file: File) => {
      importCsv.mutate(file, { onSuccess: () => setImportOpen(false) });
    },
    [importCsv],
  );

  const rows = usersData?.users ?? [];
  const allSelected = rows.length > 0 && rows.every((u) => selectedIds.has(u.id));
  const someSelected = rows.some((u) => selectedIds.has(u.id));

  // Define table columns
  const columns = useMemo<ColumnDef<IUserBasic>[]>(
    () => [
      {
        id: "select",
        header: () => (
          <Checkbox
            aria-label="Select all users on this page"
            checked={allSelected}
            indeterminate={someSelected && !allSelected}
            onChange={(e) => handleSelectAll(e.currentTarget.checked)}
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            aria-label={`Select ${row.original.email}`}
            checked={selectedIds.has(row.original.id)}
            onChange={(e) => handleToggleRow(row.original.id, e.currentTarget.checked)}
          />
        ),
        enableSorting: false,
      },
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
      allSelected,
      someSelected,
      selectedIds,
      handleSelectAll,
      handleToggleRow,
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
              Add User
            </Button>
            <Button
              variant="default"
              leftSection={<IconFileImport size={16} />}
              onClick={() => setImportOpen(true)}
              disabled={!permissions.canCreate}
            >
              Import CSV
            </Button>
            <Button
              variant="default"
              leftSection={<IconFileExport size={16} />}
              onClick={() => exportCsv.mutate(params)}
              loading={exportCsv.isPending}
            >
              Export
            </Button>
          </Group>
        </PageHeader>

        <UsersStatsTiles
          stats={statsData}
          isLoading={isLoadingStats}
          isError={isStatsError}
          activeStatus={params.status ?? 'all'}
        />

        {/* Filters. Search gets its own full-width row so the long placeholder
            is never squeezed by the fixed-width selects beside it; the selects
            wrap onto as many rows as they need on narrow viewports. */}
        <Card withBorder p="md">
          <Stack gap="md">
            <TextInput
              aria-label="Search users"
              placeholder="Search users by email, name, or code..."
              leftSection={<IconSearch size={16} />}
              rightSection={
                filterParams.search ? (
                  <ActionIcon
                    variant="subtle"
                    color="gray"
                    size="sm"
                    aria-label="Clear search"
                    onClick={handleClearSearch}
                  >
                    <IconX size={14} />
                  </ActionIcon>
                ) : null
              }
              value={filterParams.search}
              onChange={(e) => handleSearch(e.currentTarget.value)}
            />

            <Group gap="md" align="flex-end" justify="space-between" wrap="wrap">
              <Group gap="md" align="flex-end" wrap="wrap">
                <Select
                  label="Status"
                  value={filterParams.status ?? 'all'}
                  onChange={(value) =>
                    setFilterParams((prev) => ({
                      ...prev,
                      status:
                        value && value !== 'all'
                          ? (value as Exclude<TUserStatusFilter, 'all'>)
                          : undefined,
                      page: 1,
                    }))
                  }
                  data={[
                    { value: 'all', label: 'All' },
                    { value: 'active', label: 'Active' },
                    { value: 'invited', label: 'Invited' },
                    { value: 'blocked', label: 'Blocked' },
                  ]}
                  withCheckIcon={false}
                  allowDeselect={false}
                  w={160}
                />

                <Select
                  label="Group"
                  placeholder="All"
                  value={filterParams.id_groups?.toString() ?? null}
                  onChange={(value) =>
                    setFilterParams((prev) => ({
                      ...prev,
                      id_groups: value ? Number(value) : undefined,
                      page: 1,
                    }))
                  }
                  data={(groupsData?.groups ?? []).map((group) => ({
                    value: group.id.toString(),
                    label: group.name,
                  }))}
                  searchable
                  clearable
                  w={160}
                />

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
              </Group>

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
        <div className={tableStyles.tableWrapper}>
          <LoadingOverlay visible={isFetching} />

          {selectedIds.size > 0 && (
            <UsersBulkActionsBar
              selectedCount={selectedIds.size}
              onAddToGroup={() => setGroupMode('add')}
              onRemoveFromGroup={() => setGroupMode('remove')}
              onSendActivation={handleBulkSendActivation}
              onDelete={() => setBulkDeleteOpen(true)}
              isBusy={isBulkBusy}
              permissions={permissions}
            />
          )}

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
                  params.search || params.status || params.id_groups
                    ? "Try adjusting your search or filters"
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

      <BulkGroupMembershipModal
        opened={groupMode !== null}
        onClose={() => setGroupMode(null)}
        mode={groupMode ?? 'add'}
        selectedCount={selectedIds.size}
        onConfirm={handleBulkGroupMembership}
        isLoading={bulkAddToGroup.isPending || bulkRemoveFromGroup.isPending}
      />

      <BulkDeleteUsersModal
        opened={bulkDeleteOpen}
        onClose={() => setBulkDeleteOpen(false)}
        users={selectedUsers}
        onConfirm={handleBulkDelete}
        isLoading={bulkDelete.isPending}
      />

      <ImportUsersCsvModal
        opened={importOpen}
        onClose={() => setImportOpen(false)}
        onConfirm={handleImportCsv}
        isLoading={importCsv.isPending}
      />
    </Card>
  );
}
