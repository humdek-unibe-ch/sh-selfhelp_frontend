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
  Pagination,
  Text,
  Badge,
  Group,
  Center,
  Box,
  ActionIcon,
  Tooltip,
  Alert,
} from '@mantine/core';
import {
  IconSortAscending,
  IconSortDescending,
  IconEye,
  IconAlertCircle,
} from '@tabler/icons-react';
import type { IAuditLogDetails } from '../../../../../types/responses/admin/audit.types';

interface AuditLogsTableProps {
  data: IAuditLogDetails[];
  pagination?: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
  onPageChange: (page: number) => void;
  onViewDetails?: (auditLogId: number) => void;
  loading: boolean;
  error: any;
}

export function AuditLogsTable({
  data,
  pagination,
  onPageChange,
  onViewDetails,
  loading,
  error,
}: AuditLogsTableProps) {
  const [sorting, setSorting] = useState<SortingState>([
    { id: 'createdAt', desc: true } // Default sort by date descending
  ]);

  // Format CRUD permissions bit flags
  const formatCrudPermissions = (permissions: number | null): string => {
    if (permissions === null) return '-';
    const flags = [];
    if (permissions & 1) flags.push('C'); // Create
    if (permissions & 2) flags.push('R'); // Read
    if (permissions & 4) flags.push('U'); // Update
    if (permissions & 8) flags.push('D'); // Delete
    return flags.join('') || '-';
  };

  // Format timestamp
  const formatTimestamp = (timestamp: string): string => {
    return new Date(timestamp).toLocaleString();
  };

  // Get permission result badge color
  const getPermissionResultColor = (result: string): string => {
    switch (result) {
      case 'granted': return 'green';
      case 'denied': return 'red';
      case 'error': return 'orange';
      default: return 'gray';
    }
  };

  // Get action badge color
  const getActionColor = (action: string): string => {
    switch (action) {
      case 'create': return 'blue';
      case 'read': return 'green';
      case 'update': return 'orange';
      case 'delete': return 'red';
      default: return 'gray';
    }
  };

  const columns = useMemo<ColumnDef<IAuditLogDetails>[]>(
    () => [
      {
        accessorKey: 'createdAt',
        header: 'Timestamp',
        cell: ({ getValue }) => (
          <Text size="sm">{formatTimestamp(getValue() as string)}</Text>
        ),
        size: 160,
      },
      {
        accessorFn: (row) => row.user.username,
        header: 'User',
        cell: ({ row }) => (
          <div>
            <Text size="sm" fw={500}>{row.original.user.username}</Text>
            <Text size="xs" c="dimmed">{row.original.user.email}</Text>
          </div>
        ),
        size: 140,
      },
      {
        accessorFn: (row) => row.action.lookupValue,
        header: 'Action',
        cell: ({ row }) => (
          <Badge color={getActionColor(row.original.action.lookupCode)} variant="light">
            {row.original.action.lookupValue}
          </Badge>
        ),
        size: 80,
      },
      {
        accessorFn: (row) => row.resourceType.lookupValue,
        header: 'Resource Type',
        cell: ({ row }) => (
          <Badge variant="outline">
            {row.original.resourceType.lookupValue}
          </Badge>
        ),
        size: 120,
      },
      {
        accessorKey: 'resourceId',
        header: 'Resource ID',
        cell: ({ getValue }) => (
          <Text size="sm">{getValue() as number}</Text>
        ),
        size: 100,
      },
      {
        accessorFn: (row) => row.permissionResult.lookupValue,
        header: 'Result',
        cell: ({ row }) => (
          <Badge color={getPermissionResultColor(row.original.permissionResult.lookupCode)} variant="light">
            {row.original.permissionResult.lookupValue}
          </Badge>
        ),
        size: 90,
      },
      {
        accessorKey: 'crudPermission',
        header: 'Permissions',
        cell: ({ getValue }) => (
          <Text size="sm" tt="uppercase">
            {formatCrudPermissions(getValue() as number | null)}
          </Text>
        ),
        size: 100,
      },
      {
        accessorKey: 'httpMethod',
        header: 'Method',
        cell: ({ getValue }) => (
          <Badge variant="dot">{getValue() as string}</Badge>
        ),
        size: 80,
      },
      {
        accessorKey: 'ipAddress',
        header: 'IP Address',
        cell: ({ getValue }) => (
          <Text size="sm">{getValue() as string}</Text>
        ),
        size: 120,
      },
      {
        accessorKey: 'requestUri',
        header: 'Request URI',
        cell: ({ getValue }) => {
          const uri = getValue() as string;
          const truncated = uri.length > 40 ? `${uri.substring(0, 40)}...` : uri;
          return (
            <Tooltip label={uri}>
              <Text size="sm" style={{ cursor: 'pointer' }}>
                {truncated}
              </Text>
            </Tooltip>
          );
        },
        size: 200,
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => (
          <Group gap="xs">
            <Tooltip label="View Details">
              <ActionIcon
                variant="light"
                size="sm"
                onClick={() => onViewDetails?.(row.original.id)}
              >
                <IconEye size={16} />
              </ActionIcon>
            </Tooltip>
          </Group>
        ),
        size: 60,
        enableSorting: false,
      },
    ],
    []
  );

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    manualSorting: true, // We're not implementing server-side sorting yet
  });

  if (error) {
    return (
      <Alert variant="light" color="red" title="Error loading audit logs" icon={<IconAlertCircle />}>
        {error?.message || 'An error occurred while loading audit logs'}
      </Alert>
    );
  }

  if (!loading && data.length === 0) {
    return (
      <Center py="xl">
        <Text c="dimmed">No audit logs found</Text>
      </Center>
    );
  }

  return (
    <div className="space-y-4">
      <Box style={{ overflowX: 'auto' }}>
        <Table striped highlightOnHover withTableBorder>
          <TableThead>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableTr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableTh key={header.id} style={{ width: header.getSize() }}>
                    {header.isPlaceholder ? null : (
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          cursor: header.column.getCanSort() ? 'pointer' : 'default',
                        }}
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {{
                          asc: <IconSortAscending size={14} style={{ marginLeft: 4 }} />,
                          desc: <IconSortDescending size={14} style={{ marginLeft: 4 }} />,
                        }[header.column.getIsSorted() as string] ?? null}
                      </div>
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
      </Box>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <Group justify="center">
          <Pagination
            total={pagination.totalPages}
            value={pagination.page}
            onChange={onPageChange}
            size="sm"
          />
          <Text size="sm" c="dimmed">
            Page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
          </Text>
        </Group>
      )}
    </div>
  );
}
