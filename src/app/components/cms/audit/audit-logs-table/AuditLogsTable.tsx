/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
"use client";

import { useMemo } from 'react';
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
} from '@tanstack/react-table';
import {
  Table,
  TableTbody,
  TableTd,
  TableThead,
  TableTh,
  TableTr,
  Text,
  Badge,
  Group,
  Box,
  ActionIcon,
  Tooltip,
  Alert,
} from '@mantine/core';
import {
  IconEye,
  IconAlertCircle,
} from '@tabler/icons-react';
import { EmptyState } from '../../../shared/common/EmptyState';
import { AdminTableFooter, adminTableClasses as tableStyles } from '../../shared/admin-table';
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
  error: Error | null;
}

export function AuditLogsTable({
  data,
  pagination,
  onPageChange,
  onViewDetails,
  loading,
  error,
}: AuditLogsTableProps) {
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
        header: 'Actions',
        cell: ({ row }) => (
          <Group gap={2} wrap="nowrap" justify="flex-end" className={tableStyles.actionsCell}>
            <Tooltip label="View details" withArrow>
              <ActionIcon
                variant="subtle"
                color="gray"
                size="sm"
                aria-label="View details"
                onClick={() => onViewDetails?.(row.original.id)}
              >
                <IconEye size={16} />
              </ActionIcon>
            </Tooltip>
          </Group>
        ),
        size: 60,
      },
    ],
    [onViewDetails]
  );

  // eslint-disable-next-line react-hooks/incompatible-library -- TanStack Table's useReactTable returns non-memoizable functions by design; React Compiler intentionally skips memoizing here
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    enableSorting: false, // Sorting is server-side driven by the parent; the table renders rows as received.
  });

  if (error) {
    return (
      <Alert variant="light" color="red" title="Error loading audit logs" icon={<IconAlertCircle />}>
        {error?.message || 'An error occurred while loading audit logs'}
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      <div className={tableStyles.tableWrapper}>
        <Box className={tableStyles.tableScrollContainer}>
          <Table highlightOnHover verticalSpacing="sm" horizontalSpacing="md">
            <TableThead>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableTr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableTh key={header.id} className={tableStyles.tableHeader} style={{ width: header.getSize() }}>
                      {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
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
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableTd>
                  ))}
                </TableTr>
              ))}
            </TableTbody>
          </Table>
        </Box>

        {/* Empty state — inside the shell, below the header row. */}
        {!loading && data.length === 0 && (
          <EmptyState
            title="No audit logs found"
            description="Try adjusting your filters."
          />
        )}

        {/* Footer — always visible when data is loaded. */}
        {pagination && (
          <AdminTableFooter
            totalCount={pagination.total}
            itemLabel="audit logs"
            pagination={{
              page: pagination.page,
              pageSize: pagination.pageSize,
              totalPages: pagination.totalPages,
              onPageChange,
            }}
          />
        )}
      </div>
    </div>
  );
}
