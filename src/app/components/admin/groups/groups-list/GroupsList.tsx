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
} from '@tabler/icons-react';
import { useGroups } from '../../../../../hooks/useGroups';
import type { IGroupBasic, IGroupsListParams } from '../../../../../types/responses/admin/groups.types';

interface IGroupsListProps {
  onCreateGroup?: () => void;
  onEditGroup?: (groupId: number) => void;
  onDeleteGroup?: (groupId: number, groupName: string) => void;
  onManageAcls?: (groupId: number) => void;
}

export function GroupsList({
  onCreateGroup,
  onEditGroup,
  onDeleteGroup,
  onManageAcls,
}: IGroupsListProps) {
  // State for table parameters
  const [params, setParams] = useState<IGroupsListParams>({
    page: 1,
    pageSize: 20,
    search: '',
    sort: 'name',
    sortDirection: 'asc',
  });

  // Fetch groups data
  const { data: groupsData, isLoading, error } = useGroups(params);

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
    setParams(prev => ({
      ...prev,
      search,
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
  const columns = useMemo<ColumnDef<IGroupBasic>[]>(
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
        accessorKey: 'members_count',
        header: ({ column }) => (
          <Group gap="xs">
            <Text fw={500}>Members</Text>
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
          <Badge variant="light" color="blue" size="sm">
            {row.original.members_count} members
          </Badge>
        ),
        enableSorting: true,
      },
      {
        accessorKey: 'requires_2fa',
        header: '2FA Required',
        cell: ({ row }) => (
          <Badge
            variant="light"
            color={row.original.requires_2fa ? 'orange' : 'gray'}
            size="sm"
          >
            {row.original.requires_2fa ? 'Required' : 'Optional'}
          </Badge>
        ),
      },
      {
        accessorKey: 'created_at',
        header: ({ column }) => (
          <Group gap="xs">
            <Text fw={500}>Created</Text>
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
            {new Date(row.original.created_at).toLocaleDateString()}
          </Text>
        ),
        enableSorting: true,
      },
      {
        id: 'actions',
        header: 'Actions',
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
                onClick={() => onManageAcls?.(row.original.id)}
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
                  onClick={() => {/* Handle view members */}}
                >
                  View Members
                </Menu.Item>
                <Menu.Divider />
                <Menu.Item
                  leftSection={<IconTrash size={14} />}
                  color="red"
                  onClick={() => onDeleteGroup?.(row.original.id, row.original.name)}
                >
                  Delete Group
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
          </Group>
        ),
      },
    ],
    [onEditGroup, onDeleteGroup, onManageAcls]
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
        <Group justify="space-between">
          <div>
            <Text size="lg" fw={600}>
              Groups Management
            </Text>
            <Text size="sm" c="dimmed">
              Manage user groups and their permissions
            </Text>
          </div>
          <Button
            leftSection={<IconPlus size={16} />}
            onClick={onCreateGroup}
          >
            Create Group
          </Button>
        </Group>

        {/* Filters */}
        <Group gap="md">
          <TextInput
            placeholder="Search groups..."
            leftSection={<IconSearch size={16} />}
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
          {!isLoading && (!groupsData?.groups || groupsData.groups.length === 0) && (
            <Center py="xl">
              <Text c="dimmed">No groups found</Text>
            </Center>
          )}
        </div>

        {/* Pagination */}
        {groupsData?.pagination && (
          <Group justify="space-between">
            <Text size="sm" c="dimmed">
              Showing {((groupsData.pagination.page - 1) * groupsData.pagination.pageSize) + 1} to{' '}
              {Math.min(
                groupsData.pagination.page * groupsData.pagination.pageSize,
                groupsData.pagination.totalCount
              )}{' '}
              of {groupsData.pagination.totalCount} groups
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