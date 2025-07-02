"use client";

import { useState, useMemo } from 'react';
import {
  Table,
  Text,
  ActionIcon,
  Group,
  TextInput,
  Select,
  Stack,
  Paper,
  Badge,
  Image,
  Anchor,
  Tooltip,
} from '@mantine/core';
import { useDebouncedValue } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getSortedRowModel,
  type SortingState,
} from '@tanstack/react-table';
import { IconTrash, IconDownload, IconEye, IconSearch, IconChevronUp, IconChevronDown, IconX } from '@tabler/icons-react';
import { useAssets, useDeleteAsset } from '../../../../../hooks/useAssets';
import type { IAsset } from '../../../../../api/admin/asset.api';

interface IAssetsListProps {
  onAssetSelect?: (asset: IAsset) => void;
}

const columnHelper = createColumnHelper<IAsset>();

export function AssetsList({ onAssetSelect }: IAssetsListProps) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [search, setSearch] = useState('');
  const [sorting, setSorting] = useState<SortingState>([]);
  const [debouncedSearch] = useDebouncedValue(search, 300);

  const deleteAssetMutation = useDeleteAsset();

  // Prepare query parameters
  const queryParams = useMemo(() => ({
    page,
    pageSize,
    search: debouncedSearch || undefined,
    sort: sorting[0]?.id,
    sortDirection: (sorting[0]?.desc ? 'desc' : 'asc') as 'desc' | 'asc',
  }), [page, pageSize, debouncedSearch, sorting]);

  const { data: assetsData, isLoading, error } = useAssets(queryParams);

  const handleDeleteAsset = async (assetId: number, fileName: string) => {
    if (window.confirm(`Are you sure you want to delete "${fileName}"? This action cannot be undone.`)) {
      try {
        await deleteAssetMutation.mutateAsync(assetId);
        notifications.show({
          title: 'Success',
          message: 'Asset deleted successfully',
          color: 'green',
        });
      } catch (error: any) {
        notifications.show({
          title: 'Error',
          message: error.response?.data?.message || 'Failed to delete asset',
          color: 'red',
        });
      }
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const isImageFile = (mimeType: string | undefined): boolean => {
    return mimeType ? mimeType.startsWith('image/') : false;
  };

  const getFileTypeColor = (mimeType: string | undefined): string => {
    if (!mimeType) return 'gray';
    if (mimeType.startsWith('image/')) return 'green';
    if (mimeType.startsWith('video/')) return 'blue';
    if (mimeType.startsWith('audio/')) return 'orange';
    if (mimeType.includes('pdf')) return 'red';
    if (mimeType.includes('word') || mimeType.includes('document')) return 'blue';
    if (mimeType.includes('sheet') || mimeType.includes('excel')) return 'green';
    return 'gray';
  };

  const columns = useMemo(() => [
    columnHelper.accessor('id', {
      header: 'ID',
      size: 80,
      enableSorting: true,
    }),
    columnHelper.accessor('file_name', {
      header: 'File Name',
      cell: ({ row }) => {
        const asset = row.original;
        return (
          <Group gap="sm">
            {isImageFile(asset.mime_type) && (
              <Image
                src={asset.file_path}
                alt={asset.file_name}
                width={40}
                height={40}
                fit="cover"
                radius="sm"
              />
            )}
            <div>
              <Text size="sm" fw={500}>
                {asset.file_name}
              </Text>
              {asset.original_name && (
                <Text size="xs" c="dimmed">
                  {asset.original_name}
                </Text>
              )}
            </div>
          </Group>
        );
      },
      enableSorting: true,
    }),
    columnHelper.accessor('mime_type', {
      header: 'Type',
      cell: ({ getValue }) => {
        const mimeType = getValue();
        return (
          <Badge color={getFileTypeColor(mimeType)} variant="light" size="sm">
            {mimeType ? (mimeType.split('/')[1]?.toUpperCase() || 'Unknown') : 'Unknown'}
          </Badge>
        );
      },
      enableSorting: true,
    }),
    columnHelper.accessor('file_size', {
      header: 'Size',
      cell: ({ getValue }) => {
        const fileSize = getValue();
        return (
          <Text size="sm">
            {fileSize ? formatFileSize(fileSize) : 'Unknown'}
          </Text>
        );
      },
      enableSorting: true,
    }),
    columnHelper.accessor('folder', {
      header: 'Folder',
      cell: ({ getValue }) => {
        const folder = getValue();
        return folder ? (
          <Badge variant="outline" size="sm">
            {folder}
          </Badge>
        ) : (
          <Text size="sm" c="dimmed">Root</Text>
        );
      },
      enableSorting: true,
    }),
    columnHelper.accessor('created_at', {
      header: 'Created',
      cell: ({ getValue }) => {
        const createdAt = getValue();
        return (
          <Text size="sm">
            {createdAt ? new Date(createdAt).toLocaleDateString() : 'Unknown'}
          </Text>
        );
      },
      enableSorting: true,
    }),
    columnHelper.display({
      id: 'actions',
      header: 'Actions',
      size: 120,
      cell: ({ row }) => {
        const asset = row.original;
        return (
          <Group gap="xs">
            <Tooltip label="View/Download">
              <ActionIcon
                variant="subtle"
                color="blue"
                component="a"
                href={asset.file_path}
                target="_blank"
              >
                <IconEye size={16} />
              </ActionIcon>
            </Tooltip>
            <Tooltip label="Download">
              <ActionIcon
                variant="subtle"
                color="green"
                component="a"
                href={asset.file_path}
                download={asset.original_name || asset.file_name}
              >
                <IconDownload size={16} />
              </ActionIcon>
            </Tooltip>
            <Tooltip label="Delete">
              <ActionIcon
                variant="subtle"
                color="red"
                onClick={() => handleDeleteAsset(asset.id, asset.file_name)}
                loading={deleteAssetMutation.isPending}
              >
                <IconTrash size={16} />
              </ActionIcon>
            </Tooltip>
          </Group>
        );
      },
    }),
  ], [deleteAssetMutation.isPending]);

  const table = useReactTable({
    data: assetsData?.assets || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    manualSorting: true,
    enableSortingRemoval: false,
  });

  if (error) {
    return (
      <Paper p="md">
        <Text c="red">Error loading assets: {error.message}</Text>
      </Paper>
    );
  }

  return (
    <Stack gap="md">
      {/* Search and Filters */}
      <Group>
        <TextInput
          placeholder="Search assets..."
          leftSection={<IconSearch size={16} />}
          rightSection={
            search ? (
              <ActionIcon
                variant="subtle"
                color="gray"
                onClick={() => setSearch('')}
                size="sm"
              >
                <IconX size={14} />
              </ActionIcon>
            ) : null
          }
          value={search}
          onChange={(e) => setSearch(e.currentTarget.value)}
          style={{ flex: 1 }}
        />
        <Select
          placeholder="Page size"
          data={[
            { value: '10', label: '10 per page' },
            { value: '25', label: '25 per page' },
            { value: '50', label: '50 per page' },
            { value: '100', label: '100 per page' },
          ]}
          value={pageSize.toString()}
          onChange={(value) => {
            if (value) {
              setPageSize(parseInt(value, 10));
              setPage(1);
            }
          }}
          w={150}
        />
      </Group>

      {/* Assets Table */}
      <Paper withBorder>
        <Table striped highlightOnHover>
          <Table.Thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <Table.Tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <Table.Th
                    key={header.id}
                    style={{ 
                      width: header.getSize(),
                      cursor: header.column.getCanSort() ? 'pointer' : 'default'
                    }}
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    <Group gap="xs" justify="space-between">
                      <Text size="sm" fw={600}>
                        {flexRender(header.column.columnDef.header, header.getContext())}
                      </Text>
                      {header.column.getCanSort() && (
                        <div>
                          {header.column.getIsSorted() === 'asc' && <IconChevronUp size={14} />}
                          {header.column.getIsSorted() === 'desc' && <IconChevronDown size={14} />}
                        </div>
                      )}
                    </Group>
                  </Table.Th>
                ))}
              </Table.Tr>
            ))}
          </Table.Thead>
          <Table.Tbody>
            {isLoading ? (
              <Table.Tr>
                <Table.Td colSpan={columns.length}>
                  <Text ta="center" py="xl">Loading assets...</Text>
                </Table.Td>
              </Table.Tr>
            ) : table.getRowModel().rows.length === 0 ? (
              <Table.Tr>
                <Table.Td colSpan={columns.length}>
                  <Text ta="center" py="xl" c="dimmed">
                    No assets found
                  </Text>
                </Table.Td>
              </Table.Tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <Table.Tr 
                  key={row.id}
                  style={{ cursor: onAssetSelect ? 'pointer' : 'default' }}
                  onClick={() => onAssetSelect?.(row.original)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <Table.Td key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </Table.Td>
                  ))}
                </Table.Tr>
              ))
            )}
          </Table.Tbody>
        </Table>

        {/* Pagination Info */}
        {assetsData && assetsData.pagination && (
          <Group justify="space-between" p="md">
            <Text size="sm" c="dimmed">
              Showing {((page - 1) * pageSize) + 1} to {Math.min(page * pageSize, assetsData.pagination.total)} of {assetsData.pagination.total} assets
            </Text>
            <Group>
              <ActionIcon
                variant="outline"
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
              >
                <IconChevronUp size={16} style={{ transform: 'rotate(-90deg)' }} />
              </ActionIcon>
              <Text size="sm">
                Page {page} of {assetsData.pagination.totalPages}
              </Text>
              <ActionIcon
                variant="outline"
                disabled={page >= assetsData.pagination.totalPages}
                onClick={() => setPage(page + 1)}
              >
                <IconChevronDown size={16} style={{ transform: 'rotate(-90deg)' }} />
              </ActionIcon>
            </Group>
          </Group>
        )}
      </Paper>
    </Stack>
  );
}