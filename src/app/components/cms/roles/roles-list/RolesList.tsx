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
  IconDots,
  IconPlus,
  IconUsers,
  IconX,
  IconFileText,
  IconDatabase,
  IconUserCheck,
  IconPuzzle,
} from '@tabler/icons-react';
import { useRoles } from '../../../../../hooks/useRoles';
import { useAuthUser } from '../../../../../hooks/useUserData';
import { usePluginResourceTypes } from '../../../../../hooks/usePluginResourceTypes';
import { PERMISSIONS } from '../../../../../types/auth/jwt-payload.types';
import type { IPluginResourceType, IRoleDetails, IRolesListParams } from '../../../../../types/responses/admin/roles.types';
import { PageHeader } from '../../../shared/common/PageHeader';
import { FilterActions } from '../../../shared/common/FilterControls';
import { EmptyState } from '../../../shared/common/EmptyState';
import { AdminTableFooter, SortHeader, adminTableClasses as tableStyles, ariaSort } from '../../shared/admin-table';
import { RoleMembersModal } from './RoleMembersModal';
import classes from './RolesList.module.css';

// Why a button is off. The first two are the server's own refusal texts, so a person
// reads here what they would be told if they forced the call.
const REASON_ROLE_NOT_HELD = 'You can only change or delete a role whose rights you all hold.';
const REASON_ROLE_HAS_USERS = 'Cannot delete role with assigned users';
const REASON_SUPERUSER_DELETE = 'Full-access role cannot be deleted';
const REASON_SUPERUSER_GRANTS = 'Full-access role permissions cannot be modified';
const REASON_NEEDS_UPDATE = 'Changing roles needs admin.role.update.';
const REASON_NEEDS_DELETE = 'Deleting roles needs admin.role.delete.';

interface IRolesListProps {
  onCreateRole?: () => void;
  onEditRole?: (roleId: number) => void;
  onDeleteRole?: (roleId: number, roleName: string) => void;
  onManagePagePermissions?: (roleId: number, roleName: string) => void;
  onManageDataTablePermissions?: (roleId: number, roleName: string) => void;
  onManageGroupPermissions?: (roleId: number, roleName: string) => void;
  /** Grants on the resources of a plugin's data-access resource type (e.g. surveys). */
  onManagePluginPermissions?: (roleId: number, roleName: string, resourceType: IPluginResourceType) => void;
}

export function RolesList({
  onCreateRole,
  onEditRole,
  onDeleteRole,
  onManagePagePermissions,
  onManageDataTablePermissions,
  onManageGroupPermissions,
  onManagePluginPermissions,
}: IRolesListProps) {
  /** Full-access role from the API flag (name may be renamed). */
  const isSuperuserRole = (role: IRoleDetails) => role.is_superuser === true;
  const { data: pluginResourceTypes = [] } = usePluginResourceTypes(onManagePluginPermissions !== undefined);
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

  // The role whose users are being viewed, or null when the modal is closed.
  const [membersOf, setMembersOf] = useState<{ id: number; name: string } | null>(null);
  // The members dialog reads the Users list.
  const { permissionChecker } = useAuthUser();
  const canViewMembers = permissionChecker?.hasPermission(PERMISSIONS.ADMIN_USER_READ) ?? false;
  // Only used to word the reason a button is off: whether a role may be changed or
  // deleted comes from the role itself (`can_update`, `can_delete`).
  const mayUpdateRoles = permissionChecker?.hasPermission(PERMISSIONS.ADMIN_ROLE_UPDATE) ?? false;
  const mayDeleteRoles = permissionChecker?.hasPermission(PERMISSIONS.ADMIN_ROLE_DELETE) ?? false;
  // "Create Role" is a write control: shown only to holders of its route right (rule 4.14).
  const mayCreateRoles = permissionChecker?.hasPermission(PERMISSIONS.ADMIN_ROLE_CREATE) ?? false;

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
          const superuser = isSuperuserRole(row.original);

          return (
            <div className={classes.nameText}>
              <Group gap="xs" align="center" wrap="nowrap">
                <Text size="sm" fw={600} className={classes.roleName}>
                  {row.original.name}
                </Text>
                {superuser && (
                  <Badge size="xs" color="red" variant="light" radius="sm">
                    Full access
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
          const role = row.original;
          const superuser = isSuperuserRole(role);

          // What the signed-in person may do with this role is sent with the role
          // (`can_update`, `can_delete`): the server knows whether they hold every right
          // the role carries. A missing flag counts as "no", so a button never guesses.
          const updateBlocked = role.can_update !== true;
          const deleteBlocked = role.can_delete !== true;
          const editReason = updateBlocked
            ? (mayUpdateRoles ? REASON_ROLE_NOT_HELD : REASON_NEEDS_UPDATE)
            : null;
          // The page, data table and group grants of a role are a change of the role.
          const grantsReason = superuser ? REASON_SUPERUSER_GRANTS : editReason;
          const deleteReason = !deleteBlocked
            ? null
            : superuser
              ? REASON_SUPERUSER_DELETE
              : role.users_count > 0
                ? REASON_ROLE_HAS_USERS
                : !mayDeleteRoles
                  ? REASON_NEEDS_DELETE
                  : REASON_ROLE_NOT_HELD;

          return (
            <Group gap={2} wrap="nowrap" className={tableStyles.actionsCell}>
              <Tooltip
                withArrow
                label={editReason ?? (superuser ? "Rename or edit description" : "Edit role")}
              >
                <ActionIcon
                  variant="subtle"
                  color="gray"
                  size="sm"
                  aria-label="Edit role"
                  disabled={editReason !== null}
                  onClick={() => editReason === null && onEditRole?.(role.id)}
                >
                  <IconEdit size={16} />
                </ActionIcon>
              </Tooltip>

              {/* Permission Management Buttons */}
              <Tooltip label={grantsReason ?? "Manage Page Permissions"}>
                <ActionIcon aria-label={grantsReason ?? "Manage Page Permissions"}
                  variant="subtle"
                  size="sm"
                  color="blue"
                  disabled={grantsReason !== null}
                  onClick={() =>
                    grantsReason === null &&
                    onManagePagePermissions?.(role.id, role.name)
                  }
                >
                  <IconFileText size={16} />
                </ActionIcon>
              </Tooltip>

              <Tooltip label={grantsReason ?? "Manage Data Table Permissions"}>
                <ActionIcon aria-label={grantsReason ?? "Manage Data Table Permissions"}
                  variant="subtle"
                  size="sm"
                  color="green"
                  disabled={grantsReason !== null}
                  onClick={() =>
                    grantsReason === null &&
                    onManageDataTablePermissions?.(role.id, role.name)
                  }
                >
                  <IconDatabase size={16} />
                </ActionIcon>
              </Tooltip>

              <Tooltip label={grantsReason ?? "Manage Group Permissions"}>
                <ActionIcon aria-label={grantsReason ?? "Manage Group Permissions"}
                  variant="subtle"
                  size="sm"
                  color="purple"
                  disabled={grantsReason !== null}
                  onClick={() =>
                    grantsReason === null &&
                    onManageGroupPermissions?.(role.id, role.name)
                  }
                >
                  <IconUserCheck size={16} />
                </ActionIcon>
              </Tooltip>

              <Menu shadow="md" width={260} position="bottom-end" withArrow>
                <Menu.Target>
                  <ActionIcon variant="subtle" color="gray" size="sm" aria-label="More actions">
                    <IconDots size={16} />
                  </ActionIcon>
                </Menu.Target>

                <Menu.Dropdown>
                  <Menu.Item
                    leftSection={<IconUsers size={14} />}
                    disabled={!canViewMembers}
                    onClick={() =>
                      setMembersOf({ id: role.id, name: role.name })
                    }
                  >
                    View members
                  </Menu.Item>
                  {pluginResourceTypes.map(resourceType => (
                    <Menu.Item
                      key={resourceType.code}
                      leftSection={<IconPuzzle size={14} />}
                      disabled={grantsReason !== null}
                      onClick={() =>
                        grantsReason === null &&
                        onManagePluginPermissions?.(role.id, role.name, resourceType)
                      }
                    >
                      {resourceType.label} permissions
                    </Menu.Item>
                  ))}
                  <Menu.Divider />
                  <Menu.Item
                    leftSection={<IconTrash size={14} />}
                    color="red"
                    disabled={deleteReason !== null}
                    onClick={() =>
                      deleteReason === null &&
                      onDeleteRole?.(role.id, role.name)
                    }
                  >
                    {deleteReason ?? "Delete Role"}
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
      onManagePluginPermissions,
      pluginResourceTypes,
      canViewMembers,
      mayUpdateRoles,
      mayDeleteRoles,
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
          badgeAriaLabel="roles"
        >
          {mayCreateRoles && (
            <Button leftSection={<IconPlus size={16} />} onClick={onCreateRole}>
              Create Role
            </Button>
          )}
        </PageHeader>

        {/* Filters Card — search + page size on the same row as the actions. */}
        <Card withBorder p="md">
          <Group gap="md" align="flex-end" justify="space-between">
            <Group gap="md" style={{ flex: 1 }}>
              <TextInput aria-label="Search roles"
                placeholder="Search roles..."
                leftSection={<IconSearch size={16} />}
                rightSection={
                  filterParams.search ? (
                    <ActionIcon aria-label="Clear search"
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
                value={filterParams.pageSize?.toString() || "20"}
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
                      <TableTh key={header.id} aria-sort={ariaSort(header.column)} className={tableStyles.tableHeader}>
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

          {/* Footer — always visible when data is loaded. */}
          {rolesData?.pagination && (
            <AdminTableFooter
              totalCount={rolesData.pagination.totalCount}
              itemLabel="roles"
              pagination={{
                page: rolesData.pagination.page,
                pageSize: rolesData.pagination.pageSize,
                totalPages: rolesData.pagination.totalPages,
                onPageChange: handlePageChange,
              }}
            />
          )}
        </div>
      </Stack>

      <RoleMembersModal
        opened={membersOf !== null}
        onClose={() => setMembersOf(null)}
        role={membersOf}
      />
    </Card>
  );
}
