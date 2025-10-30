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
  Center,
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
  IconFileText,
  IconDatabase,
  IconUserCheck,
} from '@tabler/icons-react';
import { useRoles } from '../../../../../hooks/useRoles';
import type { IRoleDetails, IRolesListParams } from '../../../../../types/responses/admin/roles.types';

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
    return roleName.toLowerCase() === 'admin';
  };
  // State for table parameters
  const [params, setParams] = useState<IRolesListParams>({
    page: 1,
    pageSize: 20,
    search: '',
    sort: 'name',
    sortDirection: 'asc',
  });

  // Fetch roles data
  const { data: rolesData, isLoading, error } = useRoles(params);

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
        sort: sortField.id as IRolesListParams['sort'],
        sortDirection: sortField.desc ? 'desc' : 'asc',
        page: 1,
      }));
    }
  }, [sorting]);

  // Handle search
  const handleSearch = useCallback((search: string) => {
    setParams(prev => ({
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
      setParams(prev => ({
        ...prev,
        pageSize: parseInt(pageSize, 10),
        page: 1,
      }));
    }
  }, []);

  // Define table columns
  const columns = useMemo<ColumnDef<IRoleDetails>[]>(
    () => [
      {
        accessorKey: 'id',
        header: ({ column }) => (
          <Group gap="xs">
            <Text fw={500}>ID</Text>
            <ActionIcon
              variant="transparent"
              size="xs"
              onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            >
              {column.getIsSorted() === 'asc' ? (
                <IconSortAscending size={14} />
              ) : column.getIsSorted() === 'desc' ? (
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
        accessorKey: 'name',
        header: ({ column }) => (
          <Group gap="xs">
            <Text fw={500}>Name</Text>
            <ActionIcon
              variant="transparent"
              size="xs"
              onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            >
              {column.getIsSorted() === 'asc' ? (
                <IconSortAscending size={14} />
              ) : column.getIsSorted() === 'desc' ? (
                <IconSortDescending size={14} />
              ) : (
                <IconSortAscending size={14} opacity={0.5} />
              )}
            </ActionIcon>
          </Group>
        ),
        cell: ({ row }) => {
          const adminRole = isAdminRole(row.original.name);

          return (
            <div>
              <Group gap="xs" align="center">
                <Text size="sm" fw={500}>
                  {row.original.name}
                </Text>
                {adminRole && (
                  <Badge size="xs" color="red" variant="light">Admin</Badge>
                )}
              </Group>
              {row.original.description && (
                <Text size="xs" c="dimmed">
                  {row.original.description}
                </Text>
              )}
            </div>
          );
        },
        enableSorting: true,
      },
      {
        accessorKey: 'permissions_count',
        header: ({ column }) => (
          <Group gap="xs">
            <Text fw={500}>Permissions</Text>
            <ActionIcon
              variant="transparent"
              size="xs"
              onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            >
              {column.getIsSorted() === 'asc' ? (
                <IconSortAscending size={14} />
              ) : column.getIsSorted() === 'desc' ? (
                <IconSortDescending size={14} />
              ) : (
                <IconSortAscending size={14} opacity={0.5} />
              )}
            </ActionIcon>
          </Group>
        ),
        cell: ({ row }) => (
          <Badge size="sm" variant="light" color="blue">
            {row.original.permissions_count}
          </Badge>
        ),
        enableSorting: true,
      },
      {
        accessorKey: 'users_count',
        header: ({ column }) => (
          <Group gap="xs">
            <Text fw={500}>Users</Text>
            <ActionIcon
              variant="transparent"
              size="xs"
              onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            >
              {column.getIsSorted() === 'asc' ? (
                <IconSortAscending size={14} />
              ) : column.getIsSorted() === 'desc' ? (
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
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => {
          const adminRole = isAdminRole(row.original.name);

          return (
            <Group gap="xs">
              <Tooltip label={adminRole ? "Admin role cannot be modified" : "Edit Role"}>
                <ActionIcon
                  variant="subtle"
                  size="sm"
                  disabled={adminRole}
                  onClick={() => !adminRole && onEditRole?.(row.original.id)}
                >
                  <IconEdit size={16} />
                </ActionIcon>
              </Tooltip>

              {/* Permission Management Buttons */}
              <Tooltip label={adminRole ? "Admin role permissions cannot be modified" : "Manage Page Permissions"}>
                <ActionIcon
                  variant="subtle"
                  size="sm"
                  color="blue"
                  disabled={adminRole}
                  onClick={() => !adminRole && onManagePagePermissions?.(row.original.id, row.original.name)}
                >
                  <IconFileText size={16} />
                </ActionIcon>
              </Tooltip>

              <Tooltip label={adminRole ? "Admin role permissions cannot be modified" : "Manage Data Table Permissions"}>
                <ActionIcon
                  variant="subtle"
                  size="sm"
                  color="green"
                  disabled={adminRole}
                  onClick={() => !adminRole && onManageDataTablePermissions?.(row.original.id, row.original.name)}
                >
                  <IconDatabase size={16} />
                </ActionIcon>
              </Tooltip>

              <Tooltip label={adminRole ? "Admin role permissions cannot be modified" : "Manage Group Permissions"}>
                <ActionIcon
                  variant="subtle"
                  size="sm"
                  color="purple"
                  disabled={adminRole}
                  onClick={() => !adminRole && onManageGroupPermissions?.(row.original.id, row.original.name)}
                >
                  <IconUserCheck size={16} />
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
                    onClick={() => {/* Handle view users */}}
                  >
                    View Users
                  </Menu.Item>
                  <Menu.Divider />
                  <Menu.Item
                    leftSection={<IconTrash size={14} />}
                    color="red"
                    disabled={adminRole}
                    onClick={() => !adminRole && onDeleteRole?.(row.original.id, row.original.name)}
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
    [onEditRole, onDeleteRole, onManagePagePermissions, onManageDataTablePermissions, onManageGroupPermissions]
  );

  // Initialize table
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
        {/* Header */}
        <Group justify="space-between">
          <div>
            <Text size="lg" fw={600}>
              Roles Management
            </Text>
            <Text size="sm" c="dimmed">
              Manage user roles and their permissions
            </Text>
          </div>
          <Button
            leftSection={<IconPlus size={16} />}
            onClick={onCreateRole}
          >
            Create Role
          </Button>
        </Group>

        {/* Filters */}
        <Group gap="md">
          <TextInput
            placeholder="Search roles..."
            leftSection={<IconSearch size={16} />}
            rightSection={
              params.search ? (
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
            value={params.search}
            onChange={(e) => handleSearch(e.currentTarget.value)}
            style={{ flex: 1 }}
          />
          <Select
            placeholder="Per page"
            value={params.pageSize?.toString()}
            onChange={handlePageSizeChange}
            data={[
              { value: '10', label: '10' },
              { value: '20', label: '20' },
              { value: '50', label: '50' },
              { value: '100', label: '100' },
            ]}
            w={100}
          />
        </Group>

        {/* Table */}
        <div style={{ position: 'relative' }}>
          <LoadingOverlay visible={isLoading} />
          
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

          {/* Empty state */}
          {!isLoading && (!rolesData?.roles || rolesData.roles.length === 0) && (
            <Center py="xl">
              <Stack align="center" gap="sm">
                <Text size="lg" c="dimmed">
                  No roles found
                </Text>
                <Text size="sm" c="dimmed">
                  {params.search 
                    ? 'Try adjusting your search criteria'
                    : 'Get started by creating your first role'
                  }
                </Text>
                {!params.search && (
                  <Button
                    leftSection={<IconPlus size={16} />}
                    onClick={onCreateRole}
                    variant="light"
                  >
                    Create Role
                  </Button>
                )}
              </Stack>
            </Center>
          )}
        </div>

        {/* Pagination */}
        {rolesData?.pagination && rolesData.pagination.totalPages > 1 && (
          <Group justify="space-between">
            <Text size="sm" c="dimmed">
              Showing {((rolesData.pagination.page - 1) * rolesData.pagination.pageSize) + 1} to{' '}
              {Math.min(rolesData.pagination.page * rolesData.pagination.pageSize, rolesData.pagination.totalCount)} of{' '}
              {rolesData.pagination.totalCount} roles
            </Text>
            
            <Pagination
              value={rolesData.pagination.page}
              onChange={handlePageChange}
              total={rolesData.pagination.totalPages}
              size="sm"
            />
          </Group>
        )}
      </Stack>
    </Card>
  );
} 