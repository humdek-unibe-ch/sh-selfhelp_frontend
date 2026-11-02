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
  Badge,
  Box,
  Card,
  Group,
  LoadingOverlay,
  Menu,
  TextInput,
  Table,
  TableTbody,
  TableTd,
  TableTh,
  TableThead,
  TableTr,
  Text,
  Title,
  Tooltip,
} from '@mantine/core';
import { ModalWrapper } from '../../../shared/common/CustomModal/CustomModal';
import { EmptyState } from '../../../shared/common/EmptyState';
import { SortHeader, adminTableClasses as tableStyles } from '../../shared/admin-table';
import { IconEdit, IconTrash, IconDatabaseOff, IconSearch, IconRefresh, IconDownload, IconFileTypeCsv, IconJson } from '@tabler/icons-react';
import { useDataRows, useDeleteRecord, useDeleteTable, useExportTable, useTableColumns } from '../../../../../hooks/useData';
import { useDataTableOptionLabelMaps } from '../../../../../hooks/useDataTableOptionLabelMaps';
import { usePublicLanguages } from '../../../../../hooks/useLanguages';
import type { TDataExportFormat } from '../../../../../types/responses/admin/data.types';
import { DataTableEditorModal } from '../modals/DataTableEditorModal';
import { ConfirmDeleteTableModal } from '../modals/ConfirmDeleteTableModal';
import {
  getDataCellDisplayValue,
  getDataCellStoredCode,
  isRuntimeOptionLabelKey,
} from './data-table-display.utils';
import { alignOptionLabelMapsToFieldKeys } from './data-table-option-labels.utils';

interface ISingleDataTableProps {
  formId: number;
  tableName: string;
  displayName: string;
  locked?: boolean; // table label admin-locked (provenance `manual`, issue #56)
  selectedUserId: number; // -1 means all users
  showDeleted: boolean;
  selectedLanguageId: number;
}

export default function SingleDataTable({ formId, tableName, displayName, locked = false, selectedUserId, showDeleted, selectedLanguageId }: ISingleDataTableProps) {
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
  const exportTable = useExportTable();

  const handleExport = (format: TDataExportFormat) => {
    exportTable.mutate({
      tableName,
      displayName,
      params: {
        format,
        user_id: selectedUserId !== -1 ? selectedUserId : undefined,
        language_id: selectedLanguageId,
        exclude_deleted: !showDeleted,
      },
    });
  };

  const { data, isLoading, isFetching, refetch } = useDataRows({ table_name: tableName, user_id: selectedUserId !== -1 ? selectedUserId : undefined, exclude_deleted: !showDeleted, language_id: selectedLanguageId });
  const { data: columnsResp } = useTableColumns(tableName);
  const { languages } = usePublicLanguages();
  const { data: fetchedOptionLabelMaps = {} } = useDataTableOptionLabelMaps(tableName, selectedLanguageId, languages);
  const optionLabelMaps = useMemo(
    () => alignOptionLabelMapsToFieldKeys(
      { ...fetchedOptionLabelMaps, ...data?.optionLabelMaps },
      columnsResp?.columns ?? [],
    ),
    [fetchedOptionLabelMaps, data?.optionLabelMaps, columnsResp?.columns],
  );

  // Map immutable field_key -> human display label (issue #56). Rows are keyed
  // by field_key; headers show the curated display_name when present.
  const labelByKey = useMemo(() => {
    const map: Record<string, string> = {};
    for (const col of columnsResp?.columns ?? []) {
      if (col.fieldKey) {
        map[col.fieldKey] = col.displayName && col.displayName !== '' ? col.displayName : col.fieldKey;
      }
    }
    return map;
  }, [columnsResp?.columns]);

  const rows = useMemo(() => data?.rows || [], [data?.rows]);
  const columns = useMemo<ColumnDef<Record<string, unknown>>[]>(() => {
    // Prefer the table's declared columns so the header row renders even with
    // zero rows; fall back to keys present on the rows for legacy/extra fields.
    const declaredKeys = (columnsResp?.columns ?? [])
      .map((col) => col.fieldKey)
      .filter((key): key is string => !!key);
    const rowKeys = Array.from(new Set(rows.flatMap(r => Object.keys(r))));
    const allKeys = Array.from(new Set([...declaredKeys, ...rowKeys]))
      .filter((key) => !isRuntimeOptionLabelKey(key));
    if (allKeys.length === 0) return [];
    const baseCols = allKeys.map((key): ColumnDef<Record<string, unknown>> => ({
      // `id` + `accessorFn` (not `accessorKey`): a field_key may contain dots
      // and must be read as an opaque literal, never as a nested path.
      id: key,
      accessorFn: (row) => getDataCellDisplayValue(key, row, optionLabelMaps),
      header: ({ column }) => <SortHeader label={labelByKey[key] ?? key} column={column} />,
      cell: ({ row }) => {
        const display = getDataCellDisplayValue(key, row.original, optionLabelMaps);
        const storedCode = getDataCellStoredCode(key, row.original);
        if (display !== storedCode && storedCode !== '') {
          return (
            <Tooltip label={`Stored code: ${storedCode}`}>
              <Text size="sm">{display}</Text>
            </Tooltip>
          );
        }
        return <Text size="sm">{display}</Text>;
      },
      enableSorting: true,
    }));
    return [
      ...baseCols,
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => {
          const triggerTypeRaw = row.original.trigerType ?? row.original.triggerType ?? row.original.trigger_type ?? row.original.status;
          const isDeletedFlag = typeof row.original.deleted === 'boolean' ? row.original.deleted : undefined;
          const isDeleted = (typeof triggerTypeRaw === 'string' && triggerTypeRaw.toLowerCase() === 'deleted') || isDeletedFlag === true;
          const recordId = Number(row.original.record_id ?? 0);
          if (!recordId || isDeleted) return null;
          return (
            <Group gap={2} wrap="nowrap" justify="flex-end" className={tableStyles.actionsCell}>
              <Tooltip label="Delete row" withArrow>
                <ActionIcon variant="subtle" color="red" size="sm" aria-label="Delete row" onClick={() => setIsDeleteRowOpen({ id: recordId, label: `${displayName} #${recordId}` })}>
                  <IconTrash size={16} />
                </ActionIcon>
              </Tooltip>
            </Group>
          );
        },
      },
    ];
  }, [rows, displayName, labelByKey, optionLabelMaps, columnsResp?.columns]);

  // eslint-disable-next-line react-hooks/incompatible-library -- TanStack Table's useReactTable returns non-memoizable functions by design; React Compiler intentionally skips memoizing here
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
      {/* Only block the card on the first load. Background refetches keep the
          previous rows (React Query `keepPreviousData`) and surface progress
          through the spinning refresh icon, so a refresh no longer looks like a
          full component reload. */}
      <LoadingOverlay visible={isLoading} />
      <Group justify="space-between" mb="sm">
        <Group>
          <Title order={4}>{displayName}</Title>
          {locked && (
            <Tooltip label="Label manually locked — the form display name no longer overwrites it">
              <Badge color="orange" variant="light" size="sm">Locked</Badge>
            </Tooltip>
          )}
          <Text c="dimmed">({tableName}) • {rows.length} records</Text>
        </Group>
        <Group gap="xs">
          <Menu position="bottom-end" withinPortal>
            <Menu.Target>
              <Tooltip label="Export table">
                <ActionIcon variant="subtle" loading={exportTable.isPending} aria-label="Export table">
                  <IconDownload size={16} />
                </ActionIcon>
              </Tooltip>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Label>Export as</Menu.Label>
              <Menu.Item leftSection={<IconFileTypeCsv size={16} />} onClick={() => handleExport('csv')}>
                CSV
              </Menu.Item>
              <Menu.Item leftSection={<IconJson size={16} />} onClick={() => handleExport('json')}>
                JSON
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
          <Tooltip label="Refresh table data">
            <ActionIcon variant="subtle" onClick={() => refetch()} loading={isFetching}>
              <IconRefresh size={16} />
            </ActionIcon>
          </Tooltip>
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
        mb="sm"
      />

      <div className={tableStyles.tableWrapper}>
        <Box className={tableStyles.tableScrollContainer}>
          <Table highlightOnHover verticalSpacing="sm" horizontalSpacing="md">
            <TableThead>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableTr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableTh key={header.id} className={tableStyles.tableHeader}>
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
                    <TableTd key={cell.id} className={tableStyles.tableCell}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableTd>
                  ))}
                </TableTr>
              ))}
            </TableTbody>
          </Table>
        </Box>

        {/* Empty state — inside the shell, below the header row (matches the other admin lists). */}
        {!isLoading && rows.length === 0 && (
          <EmptyState
            title={globalFilter ? 'No matching records' : 'No records found'}
            description={globalFilter ? 'Try adjusting your search.' : 'This table has no records yet.'}
          />
        )}
      </div>

      <DataTableEditorModal open={isEditorOpen} onClose={() => setIsEditorOpen(false)} formId={formId} tableName={tableName} displayName={displayName} locked={locked} />

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
