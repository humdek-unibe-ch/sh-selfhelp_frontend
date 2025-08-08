"use client";

import { useMemo, useState, useCallback } from 'react';
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
} from '@tanstack/react-table';
import {
  ActionIcon,
  Box,
  Card,
  Group,
  LoadingOverlay,
  Modal,
  
  Table,
  TableTbody,
  TableTd,
  TableTh,
  TableThead,
  TableTr,
  Text,
  Title,
  Button,
  Tooltip,
} from '@mantine/core';
import { IconEdit } from '@tabler/icons-react';
import { useDataRows, useDeleteRecord, DATA_QUERY_KEYS } from '../../../../../hooks/useData';
import { DataTableEditorModal } from '../modals/DataTableEditorModal';

interface ISingleDataTableProps {
  formId: number;
  tableName: string;
  displayName: string;
  selectedUserId: number; // -1 means all users
  showDeleted: boolean;
}

export default function SingleDataTable({ formId, tableName, displayName, selectedUserId, showDeleted }: ISingleDataTableProps) {
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const deleteRecord = useDeleteRecord();

  const { data, isLoading } = useDataRows({ table_name: tableName, user_id: selectedUserId !== -1 ? selectedUserId : undefined, exclude_deleted: !showDeleted });

  const rows = data?.rows || [];
  const columns = useMemo<ColumnDef<Record<string, any>>[]>(() => {
    if (rows.length === 0) return [];
    const sample = rows[0];
    // Construct columns dynamically; keep record_id prominent when present
    const baseCols = Object.keys(sample).map((key) => ({
      accessorKey: key,
      header: key,
      cell: ({ row }) => <Text size="sm">{String(row.original[key])}</Text>,
    }));
    return [
      ...baseCols,
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }: any) => {
          const triggerTypeRaw = row.original.trigerType ?? row.original.triggerType ?? row.original.trigger_type ?? row.original.status;
          const isDeletedFlag = typeof row.original.deleted === 'boolean' ? row.original.deleted : undefined;
          const isDeleted = (typeof triggerTypeRaw === 'string' && triggerTypeRaw.toLowerCase() === 'deleted') || isDeletedFlag === true;
          const recordId = Number(row.original.record_id ?? 0);
          if (!recordId || isDeleted) return null;
          return (
            <Group gap="xs">
              <Button
                size="xs"
                color="red"
                variant="light"
                onClick={() =>
                  deleteRecord.mutate({
                    recordId,
                    refetchKeys: [DATA_QUERY_KEYS.rows(tableName, selectedUserId, !showDeleted)],
                  })
                }
              >
                Delete
              </Button>
            </Group>
          );
        },
      } as ColumnDef<Record<string, any>>,
    ];
  }, [rows]);

  const table = useReactTable({
    data: rows,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <Card withBorder>
      <Group justify="space-between" mb="sm">
        <Group>
          <Title order={4}>{displayName}</Title>
          <Text c="dimmed">({tableName}) • {rows.length} records</Text>
        </Group>
        <Group gap="xs">
          <Tooltip label="Edit table">
            <ActionIcon variant="subtle" onClick={() => setIsEditorOpen(true)}>
              <IconEdit size={16} />
            </ActionIcon>
          </Tooltip>
        </Group>
      </Group>

      <Box style={{ position: 'relative', overflowX: 'auto' }}>
        <LoadingOverlay visible={isLoading} />
        <Table striped highlightOnHover>
          <TableThead>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableTr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableTh key={header.id}>
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
                  <TableTd key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableTd>
                ))}
              </TableTr>
            ))}
          </TableTbody>
        </Table>
      </Box>

      <DataTableEditorModal open={isEditorOpen} onClose={() => setIsEditorOpen(false)} formId={formId} tableName={tableName} displayName={displayName} />
    </Card>
  );
}
