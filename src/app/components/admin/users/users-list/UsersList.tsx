"use client";

import { useState, useMemo } from 'react';
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
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
} from '@mantine/core';
import {
  IconSearch,
  IconEdit,
  IconTrash,
  IconLock,
  IconLockOpen,
  IconMail,
  IconUserCheck,
  IconUserX,
  IconDots,
  IconPlus,
} from '@tabler/icons-react';
import { useUsers } from '../../../../../hooks/useUsers';
import type { IUserBasic, IUsersListParams } from '../../../../../types/responses/admin/users.types';
import classes from './UsersList.module.css';

interface IUsersListProps {
  onCreateUser?: () => void;
  onEditUser?: (userId: number) => void;
  onDeleteUser?: (userId: number) => void;
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

  // Define table columns
  const columns = useMemo<ColumnDef<IUserBasic>[]>(
    () => [
      {
        accessorKey: 'email',
        header: 'Email',
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
      },
      {
        accessorKey: 'user_type',
        header: 'Type',
        cell: ({ row }) => (
          <Badge
            variant="light"
            color={row.original.user_type_code === 'admin' ? 'red' : 'blue'}
            size="sm"
          >
            {row.original.user_type}
          </Badge>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => (
          <Badge
            variant="light"
            color={row.original.blocked ? 'red' : 'green'}
            size="sm"
          >
            {row.original.blocked ? 'Blocked' : row.original.status}
          </Badge>
        ),
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
        header: 'Last Login',
        cell: ({ row }) => (
          <Text size="xs" c="dimmed">
            {row.original.last_login || 'Never'}
          </Text>
        ),
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
                  onClick={() => onDeleteUser?.(row.original.id)}
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
  });

  // Handle search
  const handleSearch = (search: string) => {
    setParams(prev => ({ ...prev, search, page: 1 }));
  };

  // Handle sorting
  const handleSort = (sort: string) => {
    const newSortDirection = params.sort === sort && params.sortDirection === 'asc' ? 'desc' : 'asc';
    setParams(prev => ({ ...prev, sort: sort as any, sortDirection: newSortDirection }));
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    setParams(prev => ({ ...prev, page }));
  };

  // Handle page size change
  const handlePageSizeChange = (pageSize: string | null) => {
    if (pageSize) {
      setParams(prev => ({ ...prev, pageSize: parseInt(pageSize), page: 1 }));
    }
  };

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
            value={params.search}
            onChange={(e) => handleSearch(e.currentTarget.value)}
            style={{ flex: 1 }}
          />
          <Select
            placeholder="Sort by"
            value={params.sort}
            onChange={(value) => value && handleSort(value)}
            data={[
              { value: 'email', label: 'Email' },
              { value: 'name', label: 'Name' },
              { value: 'last_login', label: 'Last Login' },
              { value: 'user_type', label: 'User Type' },
              { value: 'blocked', label: 'Status' },
            ]}
            w={150}
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
            <div className={classes.emptyState}>
              <Text size="sm" c="dimmed" ta="center">
                No users found
              </Text>
            </div>
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