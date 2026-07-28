/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
"use client";

import { useState, useMemo, useCallback } from 'react';
import {
  Table,
  Text,
  ActionIcon,
  Group,
  TextInput,
  Select,
  Stack,
  Paper,
  Tooltip,
  Collapse,
  Card,
  Badge,
  Title,
  UnstyledButton,
} from '@mantine/core';
import { useDebouncedValue } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { type SortingState } from '@tanstack/react-table';
import { 
  IconTrash, 
  IconDownload, 
  IconEye, 
  IconSearch, 
  IconChevronUp, 
  IconChevronDown, 
  IconX,
  IconChevronRight,
  IconFolder,
  IconFolderOpen,
  IconPhoto,
  IconFile,
  IconVideo,
  IconMusic,
  IconFileText,
  IconTable,
  IconCode,
  IconTypography,
  IconFileZip,
} from '@tabler/icons-react';
import { useAssets, useDeleteAsset, useAssetFolders } from '../../../../../hooks/useAssets';
import { DeleteAssetModal } from '../delete-asset-modal';
import { AssetThumbnail } from './AssetThumbnail';
import type { IAsset } from '../../../../../api/admin/asset.api';
import { getAssetUrl } from '../../../../../utils/asset-url.utils';
import { adminTableClasses as tableStyles } from '../../shared/admin-table';
import { useAuthUser } from '../../../../../hooks/useUserData';
import { PERMISSIONS } from '../../../../../types/auth/jwt-payload.types';
import { parseApiError } from '../../../../../utils/mutation-error-handler';

interface IAssetsListProps {
  onAssetSelect?: (asset: IAsset) => void;
}

/** Assets under one folder. `folder: null` (root uploads) groups under ROOT_KEY. */
interface IAssetGroup {
  /** Group identity + expand/collapse key. */
  key: string;
  label: string;
  /** The real folder name, or null for root-level assets. */
  folder: string | null;
  assets: IAsset[];
}

/** Sentinel for assets with no folder, so the key stays a usable string. */
const ROOT_KEY = '__root__';

/**
 * Extensions we render an inline preview for. Shared by the type label and the
 * thumbnail check so the two cannot disagree about what "an image" is.
 */
const IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'ico', 'avif', 'tif', 'tiff'];

interface IDeleteModalState {
  opened: boolean;
  asset: IAsset | null;
}

export function AssetsList({ onAssetSelect }: IAssetsListProps) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(100); // Increased for better grouping
  const [search, setSearch] = useState('');
  const [sorting, _setSorting] = useState<SortingState>([]);
  const [debouncedSearch] = useDebouncedValue(search, 300);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const [deleteModal, setDeleteModal] = useState<IDeleteModalState>({ opened: false, asset: null });

  const deleteAssetMutation = useDeleteAsset();
  const { permissionChecker } = useAuthUser();
  const canDelete = permissionChecker?.hasPermission(PERMISSIONS.ADMIN_ASSET_DELETE) ?? false;

  // Prepare query parameters
  const queryParams = useMemo(() => ({
    page,
    pageSize,
    search: debouncedSearch || undefined,
    sort: sorting[0]?.id,
    sortDirection: (sorting[0]?.desc ? 'desc' : 'asc') as 'desc' | 'asc',
  }), [page, pageSize, debouncedSearch, sorting]);

  const { data: assetsData, isLoading, error } = useAssets(queryParams);

  // Folder open-access flags, so the tree can badge public folders. Shares the
  // `['assets','folders']` cache with the FolderAccessPanel above, so toggling
  // the switch there updates these badges without a second request.
  const { data: foldersData } = useAssetFolders();
  const openAccessFolders = useMemo(
    () => new Set((foldersData?.folders ?? []).filter(f => f.is_open_access).map(f => f.folder)),
    [foldersData]
  );

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
    } catch (error) {
      const { errorTitle, errorMessage } = parseApiError(error);
      notifications.show({
        title: errorTitle,
        message: errorMessage,
        color: 'red',
      });
    }
  };

  // Get file extension from filename
  const getFileExtension = (fileName: string): string => {
    const parts = fileName.split('.');
    return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
  };

  // Determine asset type info from asset_type or file extension. Grouping is by
  // folder now, so this drives the PER-ROW type icon (the only place file type
  // is still surfaced) rather than a group header.
  const getAssetTypeInfo = useCallback((asset: IAsset) => {
    // Derive the category from the FILE EXTENSION, not `asset_type`.
    //
    // `asset_type` is a storage category with only three values — `css`,
    // `asset`, `static` (see ASSET_TYPES_* in lookups.constants). Trusting it
    // first meant virtually every upload arrived as `asset`, matched no case
    // below, and fell through to "Other". The extension is what actually
    // describes the file, so it decides; `asset_type` only contributes `css`,
    // the one value that carries information an extension cannot.
    let typeCategory: string;
    const extension = getFileExtension(asset.file_name);

    if (asset.asset_type?.toLowerCase() === 'css' || extension === 'css') {
      typeCategory = 'css';
    } else {
      // Map extensions to categories
      if (IMAGE_EXTENSIONS.includes(extension)) {
        typeCategory = 'image';
      } else if (['mp4', 'webm', 'avi', 'mov', 'wmv', 'flv', 'mkv', 'm4v', 'ogv'].includes(extension)) {
        typeCategory = 'video';
      } else if (['mp3', 'wav', 'ogg', 'aac', 'flac', 'm4a', 'oga', 'opus', 'weba'].includes(extension)) {
        typeCategory = 'audio';
      } else if (['pdf'].includes(extension)) {
        typeCategory = 'pdf';
      } else if (['doc', 'docx', 'odt', 'rtf'].includes(extension)) {
        typeCategory = 'document';
      } else if (['xls', 'xlsx', 'ods', 'csv'].includes(extension)) {
        typeCategory = 'spreadsheet';
      } else if (['woff', 'woff2', 'ttf', 'otf', 'eot'].includes(extension)) {
        typeCategory = 'font';
      } else if (['zip', 'gz', 'tar', 'rar', '7z'].includes(extension)) {
        typeCategory = 'archive';
      } else if (['js', 'jsx', 'ts', 'tsx', 'json', 'xml', 'html', 'htm', 'php', 'py', 'java', 'cpp', 'c', 'h', 'scss', 'sass', 'less', 'yml', 'yaml'].includes(extension)) {
        typeCategory = 'code';
      } else if (['txt', 'md', 'log'].includes(extension)) {
        typeCategory = 'text';
      } else {
        typeCategory = 'other';
      }
    }

    // Labels are SINGULAR: this describes one row's file, not a group.
    switch (typeCategory) {
      case 'image':
        return { label: 'Image', icon: <IconPhoto size={18} />, color: 'green' };
      case 'video':
        return { label: 'Video', icon: <IconVideo size={18} />, color: 'blue' };
      case 'audio':
        return { label: 'Audio', icon: <IconMusic size={18} />, color: 'orange' };
      case 'pdf':
        return { label: 'PDF', icon: <IconFileText size={18} />, color: 'red' };
      case 'document':
        return { label: 'Document', icon: <IconFileText size={18} />, color: 'blue' };
      case 'spreadsheet':
        return { label: 'Spreadsheet', icon: <IconTable size={18} />, color: 'green' };
      case 'font':
        return { label: 'Font', icon: <IconTypography size={18} />, color: 'grape' };
      case 'archive':
        return { label: 'Archive', icon: <IconFileZip size={18} />, color: 'yellow' };
      case 'css':
        return { label: 'CSS', icon: <IconCode size={18} />, color: 'purple' };
      case 'code':
        return { label: 'Code', icon: <IconCode size={18} />, color: 'yellow' };
      case 'text':
        return { label: 'Text', icon: <IconFileText size={18} />, color: 'gray' };
      default:
        return { label: 'Other', icon: <IconFile size={18} />, color: 'gray' };
    }
  }, []);

  // Check if file is an image based on extension
  const isImageFile = useCallback((fileName: string): boolean => {
    return IMAGE_EXTENSIONS.includes(getFileExtension(fileName));
  }, []);


  // Group assets by FOLDER — the folder is the unit that carries meaning now
  // (ACL grants and the open-access flag are both folder-scoped). File type
  // stays visible per row via its icon.
  const assetGroups = useMemo((): IAssetGroup[] => {
    if (!assetsData?.assets) return [];

    const groupMap = new Map<string, IAssetGroup>();

    assetsData.assets.forEach(asset => {
      const folder = asset.folder || null;
      const key = folder ?? ROOT_KEY;

      if (!groupMap.has(key)) {
        groupMap.set(key, {
          key,
          label: folder ?? 'Root',
          folder,
          assets: [],
        });
      }

      groupMap.get(key)!.assets.push(asset);
    });

    // Alphabetical by folder so the tree is stable and predictable as assets
    // are added/removed; root sorts first.
    return Array.from(groupMap.values()).sort((a, b) => {
      if (a.key === ROOT_KEY) return -1;
      if (b.key === ROOT_KEY) return 1;
      return a.label.localeCompare(b.label);
    });
  }, [assetsData]);

  const toggleGroup = (groupKey: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      // Groups render expanded by default, so an absent entry means EXPANDED.
      // Reading `!prev[key]` made the first click a no-op (`!undefined` is
      // true), which is why collapsing used to need two clicks.
      [groupKey]: !(prev[groupKey] ?? true),
    }));
  };

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
        <Card withBorder p="md">
          <Group gap="md" align="flex-end">
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
                  setPageSize(Number.parseInt(value, 10));
                  setPage(1);
                }
              }}
              w={150}
            />
          </Group>
        </Card>

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
          const isExpanded = expandedGroups[group.key] ?? true;
          const isOpenAccess = group.folder !== null && openAccessFolders.has(group.folder);

          return (
            <Card key={group.key} withBorder>
              <Card.Section p="md">
                {/* The whole header is one button so the folder can be
                    toggled by click AND by keyboard. */}
                <UnstyledButton
                  type="button"
                  aria-expanded={isExpanded}
                  onClick={() => toggleGroup(group.key)}
                  w="100%"
                >
                  <Group justify="space-between">
                    <Group gap="sm">
                      <div style={{ color: 'var(--mantine-color-blue-6)', display: 'flex' }}>
                        {isExpanded ? <IconFolderOpen size={20} /> : <IconFolder size={20} />}
                      </div>
                      <Title order={4}>{group.label}</Title>
                      <Badge variant="light" color="blue">
                        {group.assets.length} file{group.assets.length !== 1 ? 's' : ''}
                      </Badge>
                      {isOpenAccess && (
                        <Badge variant="light" color="orange" size="sm" radius="sm">
                          Public
                        </Badge>
                      )}
                    </Group>
                    <ActionIcon variant="subtle" color="gray" component="div" aria-hidden>
                      {isExpanded ? (
                        <IconChevronDown size={16} />
                      ) : (
                        <IconChevronRight size={16} />
                      )}
                    </ActionIcon>
                  </Group>
                </UnstyledButton>
              </Card.Section>

              <Collapse expanded={isExpanded}>
                <Card.Section className={tableStyles.tableScrollContainer}>
                  <Table highlightOnHover verticalSpacing="sm" horizontalSpacing="md">
                    <Table.Thead>
                      <Table.Tr>
                        <Table.Th w={80} className={tableStyles.tableHeader}><span className={tableStyles.colHeader}>ID</span></Table.Th>
                        <Table.Th className={tableStyles.tableHeader}><span className={tableStyles.colHeader}>File Name</span></Table.Th>
                        <Table.Th w={120} className={tableStyles.tableHeader}><span className={tableStyles.colHeader}>Type</span></Table.Th>
                        <Table.Th w={120} className={tableStyles.tableHeader}><span className={tableStyles.colHeader}>Actions</span></Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {group.assets.map((asset) => {
                        // `url` is the ACL-enforced delivery route and the only
                        // fetchable source; `file_path` is a logical key only.
                        const correctedPath = getAssetUrl(asset.url);
                        const typeInfo = getAssetTypeInfo(asset);
                        return (
                          <Table.Tr 
                            key={asset.id}
                            className={onAssetSelect ? 'cursor-pointer' : 'cursor-default'}
                            onClick={() => onAssetSelect?.(asset)}
                          >
                            <Table.Td className={tableStyles.tableCell}>
                              <Text size="sm" c="dimmed">{asset.id}</Text>
                            </Table.Td>
                            <Table.Td className={tableStyles.tableCell}>
                              <Group gap="sm">
                                {isImageFile(asset.file_name) && (
                                  <AssetThumbnail
                                    src={correctedPath}
                                    alt={asset.file_name}
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
                            <Table.Td className={tableStyles.tableCell}>
                              {/* Folder is the group header now, so this column
                                  surfaces file type instead of repeating it. */}
                              <Group gap="xs" wrap="nowrap">
                                <div style={{ color: `var(--mantine-color-${typeInfo.color}-6)`, display: 'flex' }}>
                                  {typeInfo.icon}
                                </div>
                                <Text size="sm" c="dimmed">{typeInfo.label}</Text>
                              </Group>
                            </Table.Td>
                            <Table.Td className={tableStyles.tableCell}>
                              <Group gap={2} wrap="nowrap" className={tableStyles.actionsCell}>
                                <Tooltip label="View">
                                  <ActionIcon
                                    variant="subtle"
                                    color="blue"
                                    component="a"
                                    href={correctedPath}
                                    target="_blank"
                                    aria-label={`View ${asset.file_name}`}
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
                                    aria-label={`Download ${asset.file_name}`}
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <IconDownload size={16} />
                                  </ActionIcon>
                                </Tooltip>
                                {canDelete && (
                                  <Tooltip label="Delete">
                                    <ActionIcon
                                      variant="subtle"
                                      color="red"
                                      aria-label={`Delete ${asset.file_name}`}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteAsset(asset);
                                      }}
                                      loading={deleteAssetMutation.isPending && deleteModal.asset?.id === asset.id}
                                    >
                                      <IconTrash size={16} />
                                    </ActionIcon>
                                  </Tooltip>
                                )}
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