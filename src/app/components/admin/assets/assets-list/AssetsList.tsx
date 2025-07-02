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
  Image,
  Tooltip,
  Collapse,
  Card,
  Badge,
  Title,
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
import { 
  IconTrash, 
  IconDownload, 
  IconEye, 
  IconSearch, 
  IconChevronUp, 
  IconChevronDown, 
  IconX,
  IconChevronRight,
  IconPhoto,
  IconFile,
  IconVideo,
  IconMusic,
  IconFileText,
  IconTable,
  IconCode,
} from '@tabler/icons-react';
import { useAssets, useDeleteAsset } from '../../../../../hooks/useAssets';
import { DeleteAssetModal } from '../delete-asset-modal';
import type { IAsset } from '../../../../../api/admin/asset.api';

interface IAssetsListProps {
  onAssetSelect?: (asset: IAsset) => void;
}

interface IAssetGroup {
  type: string;
  label: string;
  icon: React.ReactNode;
  color: string;
  assets: IAsset[];
}

interface IDeleteModalState {
  opened: boolean;
  asset: IAsset | null;
}

const columnHelper = createColumnHelper<IAsset>();

export function AssetsList({ onAssetSelect }: IAssetsListProps) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(100); // Increased for better grouping
  const [search, setSearch] = useState('');
  const [sorting, setSorting] = useState<SortingState>([]);
  const [debouncedSearch] = useDebouncedValue(search, 300);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const [deleteModal, setDeleteModal] = useState<IDeleteModalState>({ opened: false, asset: null });

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

  const handleDeleteAsset = (asset: IAsset) => {
    setDeleteModal({ opened: true, asset });
  };

  const confirmDeleteAsset = async () => {
    if (!deleteModal.asset) return;

    try {
      await deleteAssetMutation.mutateAsync(deleteModal.asset.id);
      notifications.show({
        title: 'Success',
        message: 'Asset deleted successfully',
        color: 'green',
      });
      setDeleteModal({ opened: false, asset: null });
    } catch (error: any) {
      notifications.show({
        title: 'Error',
        message: error.response?.data?.message || 'Failed to delete asset',
        color: 'red',
      });
    }
  };

  // Get file extension from filename
  const getFileExtension = (fileName: string): string => {
    const parts = fileName.split('.');
    return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
  };

  // Determine asset type info from asset_type or file extension
  const getAssetTypeInfo = (asset: IAsset) => {
    // Use asset_type if available, otherwise determine from file extension
    let typeCategory = asset.asset_type?.toLowerCase();
    
    if (!typeCategory) {
      const extension = getFileExtension(asset.file_name);
      
      // Map extensions to categories
      if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'ico'].includes(extension)) {
        typeCategory = 'image';
      } else if (['mp4', 'webm', 'avi', 'mov', 'wmv', 'flv', 'mkv'].includes(extension)) {
        typeCategory = 'video';
      } else if (['mp3', 'wav', 'ogg', 'aac', 'flac', 'm4a'].includes(extension)) {
        typeCategory = 'audio';
      } else if (['pdf'].includes(extension)) {
        typeCategory = 'pdf';
      } else if (['doc', 'docx', 'odt', 'rtf'].includes(extension)) {
        typeCategory = 'document';
      } else if (['xls', 'xlsx', 'ods', 'csv'].includes(extension)) {
        typeCategory = 'spreadsheet';
      } else if (['css'].includes(extension)) {
        typeCategory = 'css';
      } else if (['js', 'jsx', 'ts', 'tsx', 'json', 'xml', 'html', 'htm', 'php', 'py', 'java', 'cpp', 'c', 'h'].includes(extension)) {
        typeCategory = 'code';
      } else if (['txt', 'md', 'log'].includes(extension)) {
        typeCategory = 'text';
      } else {
        typeCategory = 'other';
      }
    }

    // Return type info based on category
    switch (typeCategory) {
      case 'image':
        return { type: 'image', label: 'Images', icon: <IconPhoto size={20} />, color: 'green' };
      case 'video':
        return { type: 'video', label: 'Videos', icon: <IconVideo size={20} />, color: 'blue' };
      case 'audio':
        return { type: 'audio', label: 'Audio Files', icon: <IconMusic size={20} />, color: 'orange' };
      case 'pdf':
        return { type: 'pdf', label: 'PDF Documents', icon: <IconFileText size={20} />, color: 'red' };
      case 'document':
        return { type: 'document', label: 'Documents', icon: <IconFileText size={20} />, color: 'blue' };
      case 'spreadsheet':
        return { type: 'spreadsheet', label: 'Spreadsheets', icon: <IconTable size={20} />, color: 'green' };
      case 'css':
        return { type: 'css', label: 'CSS Files', icon: <IconCode size={20} />, color: 'purple' };
      case 'code':
        return { type: 'code', label: 'Code Files', icon: <IconCode size={20} />, color: 'yellow' };
      case 'text':
        return { type: 'text', label: 'Text Files', icon: <IconFileText size={20} />, color: 'gray' };
      default:
        return { type: 'other', label: 'Other Files', icon: <IconFile size={20} />, color: 'gray' };
    }
  };

  // Check if file is an image based on extension
  const isImageFile = (fileName: string): boolean => {
    const extension = getFileExtension(fileName);
    return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'ico'].includes(extension);
  };

  // Fix file path URL - remove /admin prefix if present
  const getCorrectFilePath = (filePath: string): string => {
    if (filePath.startsWith('/admin/uploads/')) {
      return filePath.replace('/admin/uploads/', '/uploads/');
    }
    if (filePath.startsWith('admin/uploads/')) {
      return filePath.replace('admin/uploads/', '/uploads/');
    }
    if (!filePath.startsWith('/uploads/') && !filePath.startsWith('http')) {
      return `/uploads/${filePath}`;
    }
    return filePath;
  };

  // Group assets by type
  const assetGroups = useMemo((): IAssetGroup[] => {
    if (!assetsData?.assets) return [];

    const groupMap = new Map<string, IAssetGroup>();

    assetsData.assets.forEach(asset => {
      const typeInfo = getAssetTypeInfo(asset);
      
      if (!groupMap.has(typeInfo.type)) {
        groupMap.set(typeInfo.type, {
          type: typeInfo.type,
          label: typeInfo.label,
          icon: typeInfo.icon,
          color: typeInfo.color,
          assets: [],
        });
      }
      
      groupMap.get(typeInfo.type)!.assets.push(asset);
    });

    // Sort groups by asset count (descending)
    return Array.from(groupMap.values()).sort((a, b) => b.assets.length - a.assets.length);
  }, [assetsData?.assets]);

  const toggleGroup = (groupType: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupType]: !prev[groupType],
    }));
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
        const correctedPath = getCorrectFilePath(asset.file_path);
        return (
          <Group gap="sm">
            {isImageFile(asset.file_name) && (
              <Image
                src={correctedPath}
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
              {asset.original_name && asset.original_name !== asset.file_name && (
                <Text size="xs" c="dimmed">
                  Original: {asset.original_name}
                </Text>
              )}
            </div>
          </Group>
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
    columnHelper.display({
      id: 'actions',
      header: 'Actions',
      size: 120,
      cell: ({ row }) => {
        const asset = row.original;
        const correctedPath = getCorrectFilePath(asset.file_path);
        return (
          <Group gap="xs">
            <Tooltip label="View/Download">
              <ActionIcon
                variant="subtle"
                color="blue"
                component="a"
                href={correctedPath}
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
                href={correctedPath}
                download={asset.original_name || asset.file_name}
              >
                <IconDownload size={16} />
              </ActionIcon>
            </Tooltip>
            <Tooltip label="Delete">
              <ActionIcon
                variant="subtle"
                color="red"
                onClick={() => handleDeleteAsset(asset)}
                loading={deleteAssetMutation.isPending && deleteModal.asset?.id === asset.id}
              >
                <IconTrash size={16} />
              </ActionIcon>
            </Tooltip>
          </Group>
        );
      },
    }),
  ], [deleteAssetMutation.isPending, deleteModal.asset?.id]);

  if (error) {
    return (
      <Paper p="md">
        <Text c="red">Error loading assets: {error.message}</Text>
      </Paper>
    );
  }

  return (
    <>
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
              { value: '50', label: '50 per page' },
              { value: '100', label: '100 per page' },
              { value: '200', label: '200 per page' },
              { value: '500', label: '500 per page' },
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

        {/* Loading State */}
        {isLoading && (
          <Paper p="xl">
            <Text ta="center">Loading assets...</Text>
          </Paper>
        )}

        {/* Asset Groups */}
        {!isLoading && assetGroups.length === 0 && (
          <Paper p="xl">
            <Text ta="center" c="dimmed">
              No assets found
            </Text>
          </Paper>
        )}

        {!isLoading && assetGroups.map((group) => {
          const isExpanded = expandedGroups[group.type] ?? true;
          
          return (
            <Card key={group.type} withBorder>
              <Card.Section
                p="md"
                style={{ cursor: 'pointer' }}
                onClick={() => toggleGroup(group.type)}
              >
                <Group justify="space-between">
                  <Group gap="sm">
                    <div style={{ color: `var(--mantine-color-${group.color}-6)` }}>
                      {group.icon}
                    </div>
                    <Title order={4}>{group.label}</Title>
                    <Badge variant="light" color={group.color}>
                      {group.assets.length} file{group.assets.length !== 1 ? 's' : ''}
                    </Badge>
                  </Group>
                  <ActionIcon variant="subtle" color="gray">
                    {isExpanded ? (
                      <IconChevronDown size={16} />
                    ) : (
                      <IconChevronRight size={16} />
                    )}
                  </ActionIcon>
                </Group>
              </Card.Section>

              <Collapse in={isExpanded}>
                <Card.Section>
                  <Table striped highlightOnHover>
                    <Table.Thead>
                      <Table.Tr>
                        <Table.Th w={80}>ID</Table.Th>
                        <Table.Th>File Name</Table.Th>
                        <Table.Th w={120}>Folder</Table.Th>
                        <Table.Th w={120}>Actions</Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {group.assets.map((asset) => {
                        const correctedPath = getCorrectFilePath(asset.file_path);
                        return (
                          <Table.Tr 
                            key={asset.id}
                            style={{ cursor: onAssetSelect ? 'pointer' : 'default' }}
                            onClick={() => onAssetSelect?.(asset)}
                          >
                            <Table.Td>
                              <Text size="sm">{asset.id}</Text>
                            </Table.Td>
                            <Table.Td>
                              <Group gap="sm">
                                {isImageFile(asset.file_name) && (
                                  <Image
                                    src={correctedPath}
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
                                  {asset.original_name && asset.original_name !== asset.file_name && (
                                    <Text size="xs" c="dimmed">
                                      Original: {asset.original_name}
                                    </Text>
                                  )}
                                </div>
                              </Group>
                            </Table.Td>
                            <Table.Td>
                              {asset.folder ? (
                                <Badge variant="outline" size="sm">
                                  {asset.folder}
                                </Badge>
                              ) : (
                                <Text size="sm" c="dimmed">Root</Text>
                              )}
                            </Table.Td>
                            <Table.Td>
                              <Group gap="xs">
                                <Tooltip label="View/Download">
                                  <ActionIcon
                                    variant="subtle"
                                    color="blue"
                                    component="a"
                                    href={correctedPath}
                                    target="_blank"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <IconEye size={16} />
                                  </ActionIcon>
                                </Tooltip>
                                <Tooltip label="Download">
                                  <ActionIcon
                                    variant="subtle"
                                    color="green"
                                    component="a"
                                    href={correctedPath}
                                    download={asset.original_name || asset.file_name}
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <IconDownload size={16} />
                                  </ActionIcon>
                                </Tooltip>
                                <Tooltip label="Delete">
                                  <ActionIcon
                                    variant="subtle"
                                    color="red"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteAsset(asset);
                                    }}
                                    loading={deleteAssetMutation.isPending && deleteModal.asset?.id === asset.id}
                                  >
                                    <IconTrash size={16} />
                                  </ActionIcon>
                                </Tooltip>
                              </Group>
                            </Table.Td>
                          </Table.Tr>
                        );
                      })}
                    </Table.Tbody>
                  </Table>
                </Card.Section>
              </Collapse>
            </Card>
          );
        })}

        {/* Pagination Info */}
        {assetsData && assetsData.pagination && (
          <Group justify="space-between">
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
      </Stack>

      {/* Delete Asset Modal */}
      <DeleteAssetModal
        opened={deleteModal.opened}
        onClose={() => setDeleteModal({ opened: false, asset: null })}
        onConfirm={confirmDeleteAsset}
        assetName={deleteModal.asset?.file_name || ''}
        isLoading={deleteAssetMutation.isPending}
      />
    </>
  );
}