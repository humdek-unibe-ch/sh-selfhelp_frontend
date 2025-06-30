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
  IconLock,
  IconLockOpen,
  IconMail,
  IconUserCheck,
  IconDots,
  IconPlus,
  IconSortAscending,
  IconSortDescending,
  IconX,
} from '@tabler/icons-react';
import { useUsers } from '../../../../../hooks/useUsers';
import type { IUserBasic, IUsersListParams } from '../../../../../types/responses/admin/users.types';
import classes from './UsersList.module.css';

interface IUsersListProps {
  onCreateUser?: () => void;
  onEditUser?: (userId: number) => void;
  onDeleteUser?: (userId: number, email: string) => void;
  onToggleBlock?: (userId: number, blocked: boolean) => void;
  onSendActivationMail?: (userId: number) => void;
  onImpersonateUser?: (userId: number) => void;
}

export function UsersList({
  onCreateUser,
  onEditUser,
  onDeleteUser,
  onToggleBlock,
  onSendActivationMail,
  onImpersonateUser,
}: IUsersListProps) {
  // State for table parameters
  const [params, setParams] = useState<IUsersListParams>({
    page: 1,
    pageSize: 20,
    search: '',
    sort: 'email',
    sortDirection: 'asc',
  });

  // Fetch users data
  const { data: usersData, isLoading, error } = useUsers(params);

  // Table sorting state
  const [sorting, setSorting] = useState<SortingState>([
    { id: params.sort || 'email', desc: params.sortDirection === 'desc' }
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
        sort: sortField.id as IUsersListParams['sort'],
        sortDirection: sortField.desc ? 'desc' : 'asc',
        page: 1, // Reset to first page when sorting
      }));
    }
  }, [sorting]);

  // Handle search
  const handleSearch = useCallback((search: string) => {
    setParams(prev => ({
      ...prev,
      search,
      page: 1, // Reset to first page when searching
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
        page: 1, // Reset to first page when changing page size
      }));
    }
  }, []);

  // Define table columns
  const columns = useMemo<ColumnDef<IUserBasic>[]>(
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
        accessorKey: 'email',
        header: ({ column }) => (
          <Group gap="xs">
            <Text fw={500}>Email</Text>
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
          <div className={classes.emailCell}>
            <Text size="sm" fw={500}>
              {row.original.email}
            </Text>
            {row.original.name && (
              <Text size="xs" c="dimmed">
                {row.original.name}
              </Text>
            )}
          </div>
        ),
        enableSorting: true,
      },
      {
        accessorKey: 'user_name',
        header: 'Username',
        cell: ({ row }) => (
          <Text size="sm">
            {row.original.user_name || '-'}
          </Text>
        ),
        enableSorting: true,
      },
      {
        accessorKey: 'code',
        header: 'User Code',
        cell: ({ row }) => (
          <Text size="xs" ff="monospace" c="dimmed">
            {row.original.code || '-'}
          </Text>
        ),
      },

      {
        accessorKey: 'user_type',
        header: ({ column }) => (
          <Group gap="xs">
            <Text fw={500}>Type</Text>
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
          <Badge
            variant="light"
            color={row.original.user_type_code === 'admin' ? 'red' : 'blue'}
            size="sm"
          >
            {row.original.user_type}
          </Badge>
        ),
        enableSorting: true,
      },
      {
        accessorKey: 'status',
        header: ({ column }) => (
          <Group gap="xs">
            <Text fw={500}>Status</Text>
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
          <Badge
            variant="light"
            color={row.original.blocked ? 'red' : 'green'}
            size="sm"
          >
            {row.original.blocked ? 'Blocked' : row.original.status}
          </Badge>
        ),
        enableSorting: true,
      },
      {
        accessorKey: 'groups',
        header: 'Groups',
        cell: ({ row }) => (
          <Text size="xs" c="dimmed" lineClamp={2}>
            {row.original.groups || 'No groups'}
          </Text>
        ),
      },
      {
        accessorKey: 'last_login',
        header: ({ column }) => (
          <Group gap="xs">
            <Text fw={500}>Last Login</Text>
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
          <Text size="xs" c="dimmed">
            {row.original.last_login || 'Never'}
          </Text>
        ),
        enableSorting: true,
      },
      {
        accessorKey: 'user_activity',
        header: 'Activity',
        cell: ({ row }) => (
          <Text size="xs" c="dimmed">
            {row.original.user_activity}
          </Text>
        ),
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => (
          <Group gap="xs">
            <Tooltip label="Edit User">
              <ActionIcon
                variant="subtle"
                size="sm"
                onClick={() => onEditUser?.(row.original.id)}
              >
                <IconEdit size={16} />
              </ActionIcon>
            </Tooltip>
            
            <Tooltip label={row.original.blocked ? 'Unblock User' : 'Block User'}>
              <ActionIcon
                variant="subtle"
                size="sm"
                color={row.original.blocked ? 'green' : 'red'}
                onClick={() => onToggleBlock?.(row.original.id, !row.original.blocked)}
              >
                {row.original.blocked ? <IconLockOpen size={16} /> : <IconLock size={16} />}
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
                  leftSection={<IconMail size={14} />}
                  onClick={() => onSendActivationMail?.(row.original.id)}
                >
                  Send Activation Mail
                </Menu.Item>
                <Menu.Item
                  leftSection={<IconUserCheck size={14} />}
                  onClick={() => onImpersonateUser?.(row.original.id)}
                >
                  Impersonate User
                </Menu.Item>
                <Menu.Divider />
                <Menu.Item
                  leftSection={<IconTrash size={14} />}
                  color="red"
                  onClick={() => onDeleteUser?.(row.original.id, row.original.email)}
                >
                  Delete User
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
          </Group>
        ),
      },
    ],
    [onEditUser, onDeleteUser, onToggleBlock, onSendActivationMail, onImpersonateUser]
  );

  // Initialize table
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
    <Card className={classes.container}>
      <Stack gap="md">
        {/* Header */}
        <Group justify="space-between">
          <div>
            <Text size="lg" fw={600}>
              Users Management
            </Text>
            <Text size="sm" c="dimmed">
              Manage system users, their roles, and permissions
            </Text>
          </div>
          <Button
            leftSection={<IconPlus size={16} />}
            onClick={onCreateUser}
          >
            Create User
          </Button>
        </Group>

        {/* Filters */}
        <Group gap="md">
          <TextInput
            placeholder="Search users..."
            leftSection={<IconSearch size={16} />}
            rightSection={
              params.search ? (
                <ActionIcon
                  variant="subtle"
                  color="gray"
                  onClick={() => handleSearch('')}
                  size="sm"
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
        <div className={classes.tableContainer}>
          <LoadingOverlay visible={isLoading} />
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
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableTd>
                  ))}
                </TableTr>
              ))}
            </TableTbody>
          </Table>

          {/* Empty state */}
          {!isLoading && (!usersData?.users || usersData.users.length === 0) && (
            <Center py="xl">
              <Text c="dimmed">No users found</Text>
            </Center>
          )}
        </div>

        {/* Pagination */}
        {usersData?.pagination && (
          <Group justify="space-between">
            <Text size="sm" c="dimmed">
              Showing {((usersData.pagination.page - 1) * usersData.pagination.pageSize) + 1} to{' '}
              {Math.min(
                usersData.pagination.page * usersData.pagination.pageSize,
                usersData.pagination.totalCount
              )}{' '}
              of {usersData.pagination.totalCount} users
            </Text>
            <Pagination
              value={usersData.pagination.page}
              onChange={handlePageChange}
              total={usersData.pagination.totalPages}
              size="sm"
            />
          </Group>
        )}
      </Stack>
    </Card>
  );
} 