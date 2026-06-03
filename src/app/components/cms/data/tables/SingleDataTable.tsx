/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
"use client";

import { useEffect, useMemo, useState } from 'react';
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table';
import {
  ActionIcon,
  Box,
  Card,
  Group,
  LoadingOverlay,
  TextInput,
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
import { ModalWrapper } from '../../../shared/common/CustomModal/CustomModal';
import { IconEdit, IconTrash, IconDatabaseOff, IconSearch, IconSortAscending, IconSortDescending, IconArrowsUpDown } from '@tabler/icons-react';
import { useDataRows, useDeleteRecord, useDeleteTable } from '../../../../../hooks/useData';
import { DataTableEditorModal } from '../modals/DataTableEditorModal';
import { ConfirmDeleteTableModal } from '../modals/ConfirmDeleteTableModal';

interface ISingleDataTableProps {
  formId: number;
  tableName: string;
  displayName: string;
  selectedUserId: number; // -1 means all users
  showDeleted: boolean;
  selectedLanguageId: number;
}

export default function SingleDataTable({ formId, tableName, displayName, selectedUserId, showDeleted, selectedLanguageId }: ISingleDataTableProps) {
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isDeleteRowOpen, setIsDeleteRowOpen] = useState<null | { id: number; label: string }>(null);
  const [isDeleteTableOpen, setIsDeleteTableOpen] = useState(false);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState('');

  useEffect(() => {
    setSorting([]);
    setGlobalFilter('');
  }, [tableName, selectedUserId, showDeleted, selectedLanguageId]);
  const deleteRecord = useDeleteRecord();
  const deleteTable = useDeleteTable();

  const { data, isLoading, isFetching } = useDataRows({ table_name: tableName, user_id: selectedUserId !== -1 ? selectedUserId : undefined, exclude_deleted: !showDeleted, language_id: selectedLanguageId });

  const rows = data?.rows || [];
  const columns = useMemo<ColumnDef<Record<string, any>>[]>(() => {
    if (rows.length === 0) return [];
    const allKeys = Array.from(new Set(rows.flatMap(r => Object.keys(r))));
    const baseCols = allKeys.map((key) => ({
      accessorKey: key,
      header: ({ column }: any) => {
        const isSorted = column.getIsSorted();
        return (
          <Button
            variant="subtle"
            size="xs"
            px="xs"
            rightSection={
              isSorted === 'asc' ? <IconSortAscending size={14} /> :
              isSorted === 'desc' ? <IconSortDescending size={14} /> :
              <IconArrowsUpDown size={14} />
            }
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            style={{ fontWeight: 'normal', justifyContent: 'space-between' }}
          >
            {key}
          </Button>
        );
      },
      cell: ({ row }: { row: any }) => <Text size="sm">{row.original[key] ?? ''}</Text>,
      enableSorting: true,
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
              <Button size="xs" color="red" variant="light" leftSection={<IconTrash size={14} />} onClick={() => setIsDeleteRowOpen({ id: recordId, label: `${displayName} #${recordId}` })}>Delete</Button>
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
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    state: {
      sorting,
      globalFilter,
    },
  });

  return (
    <Card withBorder style={{ position: 'relative' }}>
      <LoadingOverlay visible={isLoading || isFetching} />
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
          <Tooltip label="Delete this entire table">
            <ActionIcon variant="subtle" color="red" onClick={() => setIsDeleteTableOpen(true)}>
              <IconDatabaseOff size={16} />
            </ActionIcon>
          </Tooltip>
        </Group>
      </Group>

      <TextInput
        placeholder="Search table data..."
        leftSection={<IconSearch size={16} />}
        value={globalFilter}
        onChange={(event) => setGlobalFilter(event.currentTarget.value)}
        w={300}
        size="sm"
      />

      <Box style={{ overflowX: 'auto', minHeight: 60 }}>
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

      {/* Confirm delete row modal */}
      <ModalWrapper
        opened={!!isDeleteRowOpen}
        onClose={() => setIsDeleteRowOpen(null)}
        title="Confirm delete row"
        onDelete={() => {
          if (!isDeleteRowOpen) return;
          deleteRecord.mutate({
            recordId: isDeleteRowOpen.id,
            tableName,
          }, {
            onSuccess: () => setIsDeleteRowOpen(null),
          });
        }}
        onCancel={() => setIsDeleteRowOpen(null)}
        deleteLabel="Delete row"
        deleteVariant="filled"
        isLoading={deleteRecord.isPending}
      >
        <Text>Are you sure you want to delete the selected row from <Text span fw={600}>{displayName}</Text>?</Text>
      </ModalWrapper>

      {/* Confirm delete entire table */}
      <ConfirmDeleteTableModal
        open={isDeleteTableOpen}
        onClose={() => setIsDeleteTableOpen(false)}
        displayName={displayName}
        loading={deleteTable.isPending}
        onConfirm={async () => {
          await deleteTable.mutateAsync({ tableName });
          setIsDeleteTableOpen(false);
        }}
      />
    </Card>
  );
}
