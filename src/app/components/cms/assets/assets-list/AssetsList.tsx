/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
"use client";

import { useState, useMemo, type ReactNode } from 'react';
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
  Card,
  Badge,
  Checkbox,
  Button,
  Box,
  LoadingOverlay,
  UnstyledButton,
  Breadcrumbs,
  Anchor,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import {
  IconTrash,
  IconDownload,
  IconEye,
  IconSearch,
  IconX,
  IconPencil,
  IconUsersGroup,
  IconFileZip,
  IconFolder,
  IconHome,
} from '@tabler/icons-react';
import { useAssets, useDeleteAsset, useBulkAssetGroups, useBulkDeleteAssets, useAssetFolders } from '../../../../../hooks/useAssets';
import { useGroups } from '../../../../../hooks/useGroups';
import { DeleteAssetModal } from '../delete-asset-modal';
import { AssetFormModal } from '../asset-form-modal/AssetFormModal';
import { AssetThumbnail } from './AssetThumbnail';
import { BulkGroupMembershipModal } from '../../users/users-list/BulkGroupMembershipModal';
import { ModalWrapper } from '../../../shared/common/CustomModal/CustomModal';
import { FilterActions } from '../../../shared/common/FilterControls';
import type { IAsset, IAssetFolder } from '../../../../../api/admin/asset.api';
import { getAssetUrl } from '../../../../../utils/asset-url.utils';
import { AdminTableFooter, adminTableClasses as tableStyles } from '../../shared/admin-table';
import { PageHeader } from '../../../shared/common/PageHeader';
import { EmptyState } from '../../../shared/common/EmptyState';
import { useAuthUser } from '../../../../../hooks/useUserData';
import { PERMISSIONS } from '../../../../../types/auth/jwt-payload.types';
import { parseApiError } from '../../../../../utils/mutation-error-handler';
import { assetLabel, folderTrail, getAssetTypeInfo, isImageAsset } from '../assets.utils';

interface IAssetsListProps {
  folderId: number | null;
  onFolderChange: (folderId: number | null) => void;
  onAssetSelect?: (asset: IAsset) => void;
  onExportSelected?: (assetIds: number[]) => void;
  headerActions?: ReactNode;
  onEditFolder?: (folderId: number) => void;
}

const BULK_COPY = {
  add: {
    title: 'Share assets with groups',
    action: 'Add groups',
    detail: 'will be visible to members of the groups you pick. Groups already set are left unchanged.',
  },
  remove: {
    title: 'Remove groups from assets',
    action: 'Remove groups',
    detail: 'will no longer be visible to the groups you pick (unless another of their groups allows it).',
  },
};

const DEFAULT_FILTERS = { search: '', groupId: null as string | null, pageSize: 20 };

/** Who can see an asset: one badge per group; no groups = public. */
function AccessBadges({ asset }: { asset: IAsset }) {
  if (asset.groups.length === 0) {
    return <Badge variant="light" color="orange" size="sm">Public</Badge>;
  }

  return (
    <Group gap={4}>
      {asset.groups.map((group) => (
        <Badge key={group.id} variant="light" color="blue" size="sm">{group.name}</Badge>
      ))}
    </Group>
  );
}

/**
 * The assets table as a folder browser: it shows one folder at a time (its
 * subfolders, then its assets, paged), with breadcrumbs back up. A search or
 * group filter searches every folder instead and shows each result's folder.
 */
export function AssetsList({ folderId, onFolderChange, onAssetSelect, onExportSelected, headerActions, onEditFolder }: IAssetsListProps) {
  const [page, setPage] = useState(1);
  const [draft, setDraft] = useState(DEFAULT_FILTERS);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const { pageSize } = filters;
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<IAsset | null>(null);
  const [editTarget, setEditTarget] = useState<IAsset | null>(null);
  const [bulkMode, setBulkMode] = useState<'add' | 'remove' | null>(null);

  const deleteAssetMutation = useDeleteAsset();
  const bulkGroupsMutation = useBulkAssetGroups();
  const bulkDeleteMutation = useBulkDeleteAssets();
  const { data: folders = [] } = useAssetFolders();

  const searching = filters.search !== '' || filters.groupId !== null;

  const openFolder = (id: number | null) => {
    onFolderChange(id);
    setPage(1);
    setSelectedIds([]);
  };
  const applyFilters = () => {
    setFilters(draft);
    setPage(1);
    setSelectedIds([]);
  };
  const resetFilters = () => {
    setDraft(DEFAULT_FILTERS);
    setFilters(DEFAULT_FILTERS);
    setPage(1);
    setSelectedIds([]);
  };
  const { permissionChecker } = useAuthUser();
  const canDelete = permissionChecker?.hasPermission(PERMISSIONS.ADMIN_ASSET_DELETE) ?? false;
  const canUpdate = permissionChecker?.hasPermission(PERMISSIONS.ADMIN_ASSET_UPDATE) ?? false;

  // A folder id that no longer exists (deleted meanwhile) falls back to the top level.
  const knownFolderId = folderId !== null && folders.some((folder) => folder.id === folderId) ? folderId : null;

  const queryParams = useMemo(() => ({
    page,
    pageSize,
    search: filters.search || undefined,
    group_id: filters.groupId ? Number(filters.groupId) : undefined,
    // 0 = assets in no folder; searching looks in every folder.
    folder_id: searching ? undefined : knownFolderId ?? 0,
  }), [page, pageSize, filters, searching, knownFolderId]);

  const { data: assetsData, isLoading, isFetching, error, refetch } = useAssets(queryParams);
  const { data: allAssetsData } = useAssets({ page: 1, pageSize: 1 });
  const { data: groupsData } = useGroups({ pageSize: 1000 });
  const assets = useMemo(() => assetsData?.assets ?? [], [assetsData]);

  const groupFilterOptions = (groupsData?.groups ?? []).map((group) => ({
    value: String(group.id),
    label: group.name,
  }));

  const subfolders = searching || page > 1
    ? []
    : folders.filter((folder) => folder.parent_id === knownFolderId).sort((a, b) => a.name.localeCompare(b.name));
  const trail = folderTrail(folders, knownFolderId);
  const folderPath = (id: number | null) => folderTrail(folders, id).map((folder) => folder.name).join(' / ');

  const pageIds = assets.map((asset) => asset.id);
  const sharedGroupIds = assets
    .filter((asset) => selectedIds.includes(asset.id))
    .map((asset) => asset.groups.map((group) => group.id))
    .reduce<number[] | null>((shared, ids) => (shared === null ? ids : shared.filter((id) => ids.includes(id))), null) ?? [];
  const allOnPageSelected = pageIds.length > 0 && pageIds.every((id) => selectedIds.includes(id));
  const someOnPageSelected = pageIds.some((id) => selectedIds.includes(id));

  const toggleSelected = (id: number) =>
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const toggleAllOnPage = () =>
    setSelectedIds((prev) =>
      allOnPageSelected ? prev.filter((id) => !pageIds.includes(id)) : Array.from(new Set([...prev, ...pageIds]))
    );

  const confirmDeleteAsset = async () => {
    if (!deleteTarget) return;

    try {
      await deleteAssetMutation.mutateAsync(deleteTarget.id);
      notifications.show({ title: 'Success', message: 'Asset deleted successfully', color: 'green' });
      setSelectedIds((prev) => prev.filter((id) => id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err) {
      const { errorTitle, errorMessage } = parseApiError(err);
      notifications.show({ title: errorTitle, message: errorMessage, color: 'red' });
    }
  };

  const confirmBulkGroups = async (groupIds: number[]) => {
    if (!bulkMode) return;

    try {
      const result = await bulkGroupsMutation.mutateAsync({ asset_ids: selectedIds, group_ids: groupIds, mode: bulkMode });
      notifications.show({
        title: 'Success',
        message: `${result.updated} asset${result.updated === 1 ? '' : 's'} updated`,
        color: 'green',
      });
      setBulkMode(null);
    } catch (err) {
      const { errorTitle, errorMessage } = parseApiError(err);
      notifications.show({ title: errorTitle, message: errorMessage, color: 'red' });
    }
  };

  const confirmBulkDelete = async () => {
    try {
      const result = await bulkDeleteMutation.mutateAsync(selectedIds);
      notifications.show({ title: 'Success', message: `${result.deleted} asset${result.deleted === 1 ? '' : 's'} deleted`, color: 'green' });
      setSelectedIds([]);
      setBulkDeleteOpen(false);
    } catch (err) {
      const { errorTitle, errorMessage } = parseApiError(err);
      notifications.show({ title: errorTitle, message: errorMessage, color: 'red' });
    }
  };

  const renderFolderRow = (folder: IAssetFolder) => {
    const childCount = folders.filter((child) => child.parent_id === folder.id).length;
    const contents = [
      childCount > 0 ? `${childCount} folder${childCount === 1 ? '' : 's'}` : null,
      `${folder.asset_count} asset${folder.asset_count === 1 ? '' : 's'}`,
    ].filter(Boolean).join(' · ');
    return (
      <Table.Tr
        key={`folder-${folder.id}`}
        onClick={() => openFolder(folder.id)}
        style={{ cursor: 'pointer' }}
      >
        <Table.Td className={tableStyles.tableCell} />
        <Table.Td className={tableStyles.tableCell}>
          <UnstyledButton
            onClick={(e) => {
              e.stopPropagation();
              openFolder(folder.id);
            }}
            aria-label={`Open folder ${folder.name}`}
          >
            <Group gap="sm" wrap="nowrap">
              <IconFolder size={22} color="var(--mantine-color-yellow-6)" aria-hidden />
              <div>
                <Text size="sm" fw={600}>{folder.name}</Text>
                <Text size="xs" c="dimmed">{contents}</Text>
              </div>
            </Group>
          </UnstyledButton>
        </Table.Td>
        <Table.Td className={tableStyles.tableCell}>
          <Text size="sm" c="dimmed">Folder</Text>
        </Table.Td>
        <Table.Td className={tableStyles.tableCell} />
        <Table.Td className={tableStyles.tableCell} onClick={(e) => e.stopPropagation()}>
          {canUpdate && onEditFolder && (
            <Group gap={2} wrap="nowrap" className={tableStyles.actionsCell}>
              <Tooltip label="Edit folder">
                <ActionIcon variant="subtle" color="gray" aria-label={`Edit folder ${folder.name}`} onClick={() => onEditFolder(folder.id)}>
                  <IconPencil size={16} />
                </ActionIcon>
              </Tooltip>
            </Group>
          )}
        </Table.Td>
      </Table.Tr>
    );
  };

  const renderAssetRow = (asset: IAsset) => {
    // `url` is the ACL-enforced delivery route and the only
    // fetchable source; `file_path` is a logical key only.
    const deliveryUrl = getAssetUrl(asset.url);
    const typeInfo = getAssetTypeInfo(asset);
    const label = assetLabel(asset);
    const path = searching ? folderPath(asset.folder_id) : '';
    return (
      <Table.Tr
        key={asset.id}
        className={onAssetSelect ? 'cursor-pointer' : 'cursor-default'}
        onClick={() => onAssetSelect?.(asset)}
      >
        <Table.Td className={tableStyles.tableCell} onClick={(e) => e.stopPropagation()}>
          <Checkbox
            aria-label={`Select ${label}`}
            checked={selectedIds.includes(asset.id)}
            onChange={() => toggleSelected(asset.id)}
          />
        </Table.Td>
        <Table.Td className={tableStyles.tableCell}>
          <Group gap="sm" wrap="nowrap">
            {isImageAsset(asset) && <AssetThumbnail src={deliveryUrl} alt={asset.alt || label} />}
            <div style={{ minWidth: 0 }}>
              <Text size="sm" fw={500} truncate>{label}</Text>
              {label !== asset.uuid && (
                <Text size="xs" c="dimmed" ff="monospace" truncate>{asset.uuid}</Text>
              )}
              {asset.alt && (
                <Text size="xs" c="dimmed" truncate>Alt: {asset.alt}</Text>
              )}
              {searching && (
                <Anchor
                  component="button"
                  type="button"
                  size="xs"
                  onClick={(e) => {
                    e.stopPropagation();
                    resetFilters();
                    onFolderChange(path ? asset.folder_id : null);
                  }}
                >
                  <Group gap={4} wrap="nowrap">
                    <IconFolder size={12} aria-hidden />
                    {path || 'No folder'}
                  </Group>
                </Anchor>
              )}
            </div>
          </Group>
        </Table.Td>
        <Table.Td className={tableStyles.tableCell}>
          <Group gap="xs" wrap="nowrap">
            <div style={{ color: `var(--mantine-color-${typeInfo.color}-6)`, display: 'flex' }} aria-hidden>
              {typeInfo.icon}
            </div>
            <Text size="sm" c="dimmed">{typeInfo.label}</Text>
          </Group>
        </Table.Td>
        <Table.Td className={tableStyles.tableCell}>
          <AccessBadges asset={asset} />
        </Table.Td>
        <Table.Td className={tableStyles.tableCell}>
          <Group gap={2} wrap="nowrap" className={tableStyles.actionsCell}>
            <Tooltip label="View">
              <ActionIcon
                variant="subtle"
                color="blue"
                component="a"
                href={deliveryUrl}
                target="_blank"
                aria-label={`View ${label}`}
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
                href={deliveryUrl}
                download
                aria-label={`Download ${label}`}
                onClick={(e) => e.stopPropagation()}
              >
                <IconDownload size={16} />
              </ActionIcon>
            </Tooltip>
            {canUpdate && (
              <Tooltip label="Edit">
                <ActionIcon
                  variant="subtle"
                  color="gray"
                  aria-label={`Edit ${label}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditTarget(asset);
                  }}
                >
                  <IconPencil size={16} />
                </ActionIcon>
              </Tooltip>
            )}
            {canDelete && (
              <Tooltip label="Delete">
                <ActionIcon
                  variant="subtle"
                  color="red"
                  aria-label={`Delete ${label}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeleteTarget(asset);
                  }}
                  loading={deleteAssetMutation.isPending && deleteTarget?.id === asset.id}
                >
                  <IconTrash size={16} />
                </ActionIcon>
              </Tooltip>
            )}
          </Group>
        </Table.Td>
      </Table.Tr>
    );
  };

  if (error) {
    return (
      <Paper p="md">
        <Text c="red">Error loading assets: {error.message}</Text>
      </Paper>
    );
  }

  const isEmpty = !isLoading && assets.length === 0 && subfolders.length === 0;

  return (
    <Card>
      <Stack gap="md">
        <PageHeader
          title="Assets Management"
          subtitle="Upload and manage media files. Assets without groups are public; add groups to restrict who can see them."
          badge={allAssetsData?.pagination.total ?? 0}
          badgeAriaLabel="assets"
        >
          {headerActions}
        </PageHeader>

        <Card withBorder p="md">
          <Group gap="md" align="flex-end" justify="space-between">
            <Group gap="md" align="flex-end" style={{ flex: 1 }}>
              <TextInput
                aria-label="Search assets"
                placeholder="Search all folders by name or alt text..."
                leftSection={<IconSearch size={16} />}
                rightSection={
                  draft.search ? (
                    <ActionIcon variant="subtle" color="gray" onClick={() => setDraft({ ...draft, search: '' })} size="sm" aria-label="Clear search">
                      <IconX size={14} />
                    </ActionIcon>
                  ) : null
                }
                value={draft.search}
                onChange={(e) => setDraft({ ...draft, search: e.currentTarget.value })}
                onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
                style={{ flex: 1, minWidth: 200 }}
              />
              <Select
                aria-label="Filter by group"
                placeholder="All groups"
                data={groupFilterOptions}
                value={draft.groupId}
                onChange={(value) => setDraft({ ...draft, groupId: value })}
                clearable
                searchable
                w={200}
              />
            </Group>
            <Group justify="flex-end" gap="md" align="flex-end">
              <Select
                label="Rows per page"
                data={['10', '20', '50', '100']}
                value={draft.pageSize.toString()}
                onChange={(value) => value && setDraft({ ...draft, pageSize: Number.parseInt(value, 10) })}
                withCheckIcon={false}
                allowDeselect={false}
                w={110}
              />
              <FilterActions
                onApply={applyFilters}
                onReset={resetFilters}
                onRefresh={() => void refetch()}
                isFetching={isFetching}
                isApplyDisabled={draft === filters}
              />
            </Group>
          </Group>
        </Card>

        {searching ? (
          <Text size="sm" c="dimmed">Results from all folders. Reset the filters to browse folders again.</Text>
        ) : (
          <nav aria-label="Folder path">
            <Breadcrumbs separatorMargin={6}>
              <Anchor component="button" type="button" size="sm" onClick={() => openFolder(null)} c={trail.length === 0 ? 'inherit' : undefined}>
                <Group gap={4} wrap="nowrap">
                  <IconHome size={14} aria-hidden />
                  All assets
                </Group>
              </Anchor>
              {trail.map((folder, index) =>
                index === trail.length - 1 ? (
                  <Text key={folder.id} size="sm" fw={600} aria-current="location">{folder.name}</Text>
                ) : (
                  <Anchor key={folder.id} component="button" type="button" size="sm" onClick={() => openFolder(folder.id)}>
                    {folder.name}
                  </Anchor>
                )
              )}
            </Breadcrumbs>
          </nav>
        )}

        {selectedIds.length > 0 && (
          <Paper withBorder p="sm" role="region" aria-label="Bulk actions">
            <Group justify="space-between">
              <Text size="sm" fw={500}>
                {selectedIds.length} asset{selectedIds.length === 1 ? '' : 's'} selected
              </Text>
              <Group gap="xs">
                {canUpdate && (
                  <>
                    <Button size="xs" variant="light" leftSection={<IconUsersGroup size={14} />} onClick={() => setBulkMode('add')}>
                      Add groups
                    </Button>
                    <Button size="xs" variant="light" color="gray" leftSection={<IconUsersGroup size={14} />} onClick={() => setBulkMode('remove')}>
                      Remove groups
                    </Button>
                  </>
                )}
                {canDelete && (
                  <Button size="xs" variant="light" color="red" leftSection={<IconTrash size={14} />} onClick={() => setBulkDeleteOpen(true)}>
                    Delete
                  </Button>
                )}
                {onExportSelected && (
                  <Button size="xs" variant="light" leftSection={<IconFileZip size={14} />} onClick={() => onExportSelected(selectedIds)}>
                    Export selected
                  </Button>
                )}
                <Button size="xs" variant="subtle" color="gray" onClick={() => setSelectedIds([])}>
                  Clear selection
                </Button>
              </Group>
            </Group>
          </Paper>
        )}

        <div className={tableStyles.tableWrapper}>
          <LoadingOverlay visible={isFetching} />
          <Box className={tableStyles.tableScrollContainer}>
              <Table highlightOnHover verticalSpacing="sm" horizontalSpacing="md">
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th w={40} className={tableStyles.tableHeader}>
                      <Checkbox
                        aria-label="Select all assets on this page"
                        checked={allOnPageSelected}
                        indeterminate={someOnPageSelected && !allOnPageSelected}
                        disabled={pageIds.length === 0}
                        onChange={toggleAllOnPage}
                      />
                    </Table.Th>
                    <Table.Th className={tableStyles.tableHeader}><span className={tableStyles.colHeader}>Asset</span></Table.Th>
                    <Table.Th w={110} className={tableStyles.tableHeader}><span className={tableStyles.colHeader}>Type</span></Table.Th>
                    <Table.Th className={tableStyles.tableHeader}><span className={tableStyles.colHeader}>Who can see it</span></Table.Th>
                    <Table.Th w={150} className={tableStyles.tableHeader}><span className={tableStyles.colHeader}>Actions</span></Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {subfolders.map(renderFolderRow)}
                  {assets.map(renderAssetRow)}
                </Table.Tbody>
              </Table>
          </Box>

          {isEmpty && (
            <EmptyState
              title={searching ? 'No assets found' : trail.length > 0 ? 'This folder is empty' : 'No assets yet'}
              description={searching ? 'Try adjusting your filters' : 'Upload an asset to get started'}
            />
          )}

          {assetsData?.pagination && (
            <AdminTableFooter
              totalCount={assetsData.pagination.total}
              itemLabel="assets"
              pagination={{
                page,
                pageSize,
                totalPages: assetsData.pagination.totalPages,
                onPageChange: setPage,
              }}
            />
          )}
        </div>
      </Stack>

      <DeleteAssetModal
        opened={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDeleteAsset}
        assetName={deleteTarget ? assetLabel(deleteTarget) : ''}
        isLoading={deleteAssetMutation.isPending}
      />

      <AssetFormModal opened={editTarget !== null} onClose={() => setEditTarget(null)} asset={editTarget} />

      <BulkGroupMembershipModal
        opened={bulkMode !== null}
        onClose={() => setBulkMode(null)}
        mode={bulkMode ?? 'add'}
        selectedCount={selectedIds.length}
        onConfirm={(groupIds) => void confirmBulkGroups(groupIds)}
        isLoading={bulkGroupsMutation.isPending}
        copy={BULK_COPY}
        itemLabel="asset"
        allowedGroupIds={bulkMode === 'remove' ? sharedGroupIds : undefined}
      />

      <ModalWrapper
        opened={bulkDeleteOpen}
        onClose={() => setBulkDeleteOpen(false)}
        title={`Delete ${selectedIds.length} asset${selectedIds.length === 1 ? '' : 's'}?`}
        size="sm"
        onDelete={() => void confirmBulkDelete()}
        deleteLabel="Delete"
        isLoading={bulkDeleteMutation.isPending}
      >
        <Text size="sm" c="red">
          The files are deleted permanently. Pages still using them will show a broken image.
        </Text>
      </ModalWrapper>

    </Card>
  );
}
