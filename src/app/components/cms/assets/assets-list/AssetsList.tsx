/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
"use client";

import { useState, useMemo, useRef, useEffect, type ReactNode } from 'react';
import {
  Table,
  Text,
  ActionIcon,
  Group,
  TextInput,
  Select,
  Stack,
  Paper,
  Card,
  Checkbox,
  Button,
  Box,
  LoadingOverlay,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import {
  IconTrash,
  IconSearch,
  IconX,
  IconUsersGroup,
  IconFileZip,
  IconFolderPlus,
  IconFolderShare,
} from '@tabler/icons-react';
import {
  useAssets,
  useDeleteAsset,
  useBulkAssetGroups,
  useBulkDeleteAssets,
  useBulkMoveAssets,
  useAssetFolders,
  useSaveAssetFolder,
  useDeleteAssetFolder,
} from '../../../../../hooks/useAssets';
import { useAllGroups } from '../../../../../hooks/useGroups';
import { DeleteAssetModal } from '../delete-asset-modal';
import { AssetFormModal } from '../asset-form-modal/AssetFormModal';
import { AssetFolderAccessModal } from '../asset-folder-access-modal/AssetFolderAccessModal';
import { BulkGroupMembershipModal } from '../../users/users-list/BulkGroupMembershipModal';
import { ModalWrapper } from '../../../shared/common/CustomModal/CustomModal';
import { FilterActions } from '../../../shared/common/FilterControls';
import type { IAsset, IAssetFolder } from '../../../../../api/admin/asset.api';
import { AdminTableFooter, adminTableClasses as tableStyles } from '../../shared/admin-table';
import { PageHeader } from '../../../shared/common/PageHeader';
import { EmptyState } from '../../../shared/common/EmptyState';
import { useAuthUser } from '../../../../../hooks/useUserData';
import { PERMISSIONS } from '../../../../../types/auth/jwt-payload.types';
import { parseApiError } from '../../../../../utils/mutation-error-handler';
import { assetLabel, childFolders, folderDescendantIds, folderPathLabel, folderTrail } from '../assets.utils';
import { AssetRow } from './AssetRow';
import { FolderNode } from './FolderTree';
import { NewFolderRow } from './FolderNameField';
import { MoveToFolderModal, TOP_LEVEL } from './MoveToFolderModal';
import { DragStatusBar, TopLevelDropZone } from './TopLevelDropZone';
import { useAssetDropMonitor, type IAssetDrop } from './assets-dnd';
import { AssetTreeProvider, type IAssetTreeContext } from './assets-tree.context';

interface IAssetsListProps {
  onAssetSelect?: (asset: IAsset) => void;
  onExportSelected?: (assetIds: number[]) => void;
  headerActions?: ReactNode;
  /** Opens the upload form on a folder ("Upload here" in a folder's menu). */
  onUploadToFolder?: (folderId: number) => void;
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

const plural = (count: number, word: string) => `${count} ${word}${count === 1 ? '' : 's'}`;

/**
 * The assets table as a folder tree. Folders open and close in place, several
 * at once; a folder's assets load the first time it is opened. A search or
 * group filter replaces the tree with flat results from every folder, each
 * with a link that shows its folder in the tree again.
 */
export function AssetsList({ onAssetSelect, onExportSelected, headerActions, onUploadToFolder }: IAssetsListProps) {
  const [page, setPage] = useState(1);
  const [draft, setDraft] = useState(DEFAULT_FILTERS);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const { pageSize } = filters;
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [selected, setSelected] = useState<ReadonlyMap<number, IAsset>>(new Map());
  const selectedRef = useRef<ReadonlyMap<number, IAsset>>(selected);
  useEffect(() => {
    selectedRef.current = selected;
  });
  const [expanded, setExpanded] = useState<ReadonlySet<number>>(new Set());
  const [deleteTarget, setDeleteTarget] = useState<IAsset | null>(null);
  const [editTarget, setEditTarget] = useState<IAsset | null>(null);
  const [bulkMode, setBulkMode] = useState<'add' | 'remove' | null>(null);
  // null = move dialog closed.
  const [moveAssetsTarget, setMoveAssetsTarget] = useState<string | null>(null);
  const [moveFolderTarget, setMoveFolderTarget] = useState<{ folder: IAssetFolder; value: string } | null>(null);
  const [accessFolder, setAccessFolder] = useState<IAssetFolder | null>(null);
  const [deleteFolderTarget, setDeleteFolderTarget] = useState<IAssetFolder | null>(null);
  const [deleteFolderError, setDeleteFolderError] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<number | null>(null);
  // undefined = no new folder is being named; null = at the top level; id = inside that folder.
  const [creatingIn, setCreatingIn] = useState<number | null | undefined>(undefined);

  const deleteAssetMutation = useDeleteAsset();
  const bulkGroupsMutation = useBulkAssetGroups();
  const bulkDeleteMutation = useBulkDeleteAssets();
  const bulkMoveMutation = useBulkMoveAssets();
  const saveFolderMutation = useSaveAssetFolder();
  const deleteFolderMutation = useDeleteAssetFolder();
  const { data: folders = [] } = useAssetFolders();

  const searching = filters.search !== '' || filters.groupId !== null;

  const clearSelection = () => setSelected(new Map());
  const applyFilters = () => {
    setFilters(draft);
    setPage(1);
    clearSelection();
  };
  const resetFilters = () => {
    setDraft(DEFAULT_FILTERS);
    setFilters(DEFAULT_FILTERS);
    setPage(1);
    clearSelection();
  };
  const { permissionChecker } = useAuthUser();
  const permissions = {
    canCreate: permissionChecker?.hasPermission(PERMISSIONS.ADMIN_ASSET_CREATE) ?? false,
    canUpdate: permissionChecker?.hasPermission(PERMISSIONS.ADMIN_ASSET_UPDATE) ?? false,
    canDelete: permissionChecker?.hasPermission(PERMISSIONS.ADMIN_ASSET_DELETE) ?? false,
  };

  const queryParams = useMemo(() => ({
    page,
    pageSize,
    search: filters.search || undefined,
    group_id: filters.groupId ? Number(filters.groupId) : undefined,
    // 0 = assets in no folder; searching looks in every folder. Folders open on
    // their own (each loads its first page when it opens).
    folder_id: searching ? undefined : 0,
  }), [page, pageSize, filters, searching]);

  const { data: assetsData, isLoading, isFetching, error, refetch } = useAssets(queryParams);
  const { data: allAssetsData } = useAssets({ page: 1, pageSize: 1 });
  const { data: groupsData } = useAllGroups();
  const assets = useMemo(() => assetsData?.assets ?? [], [assetsData]);

  const groupFilterOptions = (groupsData?.groups ?? []).map((group) => ({
    value: String(group.id),
    label: group.name,
  }));

  const rootFolders = searching || page > 1 ? [] : childFolders(folders, null);

  const notifyError = (err: unknown) => {
    const { errorTitle, errorMessage } = parseApiError(err);
    notifications.show({ title: errorTitle, message: errorMessage, color: 'red' });
  };

  // ---- selection -------------------------------------------------------
  const selectedAssets = Array.from(selected.values());
  const selectedIds = Array.from(selected.keys());
  // The global permission says the caller may update/delete assets at all; the
  // server says per asset whether THIS caller may (`can_update` / `can_delete`),
  // so a bulk action is only offered when it holds for every asset selected.
  // `selected` holds the assets of every open folder, not only of this page.
  const canBulkUpdate = permissions.canUpdate && selectedAssets.every((asset) => asset.can_update);
  const canBulkDelete = permissions.canDelete && selectedAssets.every((asset) => asset.can_delete);
  const sharedGroupIds = selectedAssets
    .map((asset) => asset.groups.map((group) => group.id))
    .reduce<number[] | null>((shared, ids) => (shared === null ? ids : shared.filter((id) => ids.includes(id))), null) ?? [];
  const pageIds = assets.map((asset) => asset.id);
  const allOnPageSelected = pageIds.length > 0 && pageIds.every((id) => selected.has(id));
  const someOnPageSelected = pageIds.some((id) => selected.has(id));

  const toggleSelected = (asset: IAsset) =>
    setSelected((prev) => {
      const next = new Map(prev);
      if (next.has(asset.id)) next.delete(asset.id);
      else next.set(asset.id, asset);
      return next;
    });

  const toggleAllOnPage = () =>
    setSelected((prev) => {
      const next = new Map(prev);
      for (const asset of assets) {
        if (allOnPageSelected) next.delete(asset.id);
        else next.set(asset.id, asset);
      }
      return next;
    });

  const dropFromSelection = (ids: number[]) =>
    setSelected((prev) => {
      const next = new Map(prev);
      ids.forEach((id) => next.delete(id));
      return next;
    });

  // ---- tree ------------------------------------------------------------
  const expand = (ids: number[]) => setExpanded((prev) => new Set([...prev, ...ids]));
  const toggleExpanded = (folderId: number) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(folderId)) next.delete(folderId);
      else next.add(folderId);
      return next;
    });

  /** Leaves the search and opens every folder on the way to `folderId`. */
  const showInTree = (folderId: number | null) => {
    resetFilters();
    expand(folderTrail(folders, folderId).map((folder) => folder.id));
  };

  const createFolder = async (parentId: number | null, name: string) => {
    await saveFolderMutation.mutateAsync({ folder: { name, parent_id: parentId } });
    if (parentId !== null) expand([parentId]);
    setCreatingIn(undefined);
    notifications.show({ title: 'Success', message: 'Folder created', color: 'green' });
  };

  const renameFolder = async (folder: IAssetFolder, name: string) => {
    await saveFolderMutation.mutateAsync({ folder: { name, parent_id: folder.parent_id }, folderId: folder.id });
    setRenamingId(null);
  };

  /** Moves a folder under another one (null = top level). Errors are shown as a notification. */
  const moveFolder = async (folder: IAssetFolder, targetId: number | null) => {
    try {
      await saveFolderMutation.mutateAsync({ folder: { name: folder.name, parent_id: targetId }, folderId: folder.id });
      if (targetId !== null) expand([targetId]);
      notifications.show({ title: 'Success', message: `Moved ${folder.name}`, color: 'green' });
      return true;
    } catch (err) {
      notifyError(err);
      return false;
    }
  };

  /** Moves assets into a folder (null = top level). Errors are shown as a notification. */
  const moveAssets = async (assetIds: number[], targetId: number | null) => {
    try {
      const result = await bulkMoveMutation.mutateAsync({ assetIds, folderId: targetId });
      notifications.show({ title: 'Success', message: `${plural(result.moved, 'asset')} moved`, color: 'green' });
      dropFromSelection(assetIds);
      if (targetId !== null) expand([targetId]);
      return true;
    } catch (err) {
      notifyError(err);
      return false;
    }
  };

  const dragState = useAssetDropMonitor((drop: IAssetDrop) => {
    if (drop.drag.type === 'asset-selection') {
      void moveAssets(drop.drag.assetIds, drop.targetFolderId);
      return;
    }
    const { folderId } = drop.drag;
    const folder = folders.find((candidate) => candidate.id === folderId);
    if (folder) void moveFolder(folder, drop.targetFolderId);
  }, permissions.canUpdate);
  const dragging = dragState.drag !== null;
  // The folder under the pointer and everything inside it: the area a drop would land in.
  const dropInsideIds = useMemo<ReadonlySet<number>>(() => {
    const target = dragState.targetFolderId;
    return typeof target === 'number' ? new Set([target, ...folderDescendantIds(folders, target)]) : new Set<number>();
  }, [dragState.targetFolderId, folders]);

  // ---- single asset and folder actions ------------------------------------
  const confirmDeleteAsset = async () => {
    if (!deleteTarget) return;

    try {
      await deleteAssetMutation.mutateAsync(deleteTarget.id);
      notifications.show({ title: 'Success', message: 'Asset deleted successfully', color: 'green' });
      dropFromSelection([deleteTarget.id]);
      setDeleteTarget(null);
    } catch (err) {
      notifyError(err);
    }
  };

  const confirmDeleteFolder = async () => {
    if (!deleteFolderTarget) return;

    try {
      await deleteFolderMutation.mutateAsync(deleteFolderTarget.id);
      notifications.show({ title: 'Success', message: 'Folder deleted', color: 'green' });
      setDeleteFolderTarget(null);
    } catch (err) {
      // 409: the folder is not empty (something was added meanwhile, or the caller cannot see all of it).
      setDeleteFolderError(parseApiError(err).errorMessage);
    }
  };

  const confirmBulkGroups = async (groupIds: number[]) => {
    if (!bulkMode) return;

    try {
      const result = await bulkGroupsMutation.mutateAsync({ asset_ids: selectedIds, group_ids: groupIds, mode: bulkMode });
      notifications.show({ title: 'Success', message: `${plural(result.updated, 'asset')} updated`, color: 'green' });
      setBulkMode(null);
      // The selection holds the assets as they were when ticked; their groups just changed.
      clearSelection();
    } catch (err) {
      notifyError(err);
    }
  };

  const confirmBulkMove = async () => {
    if (moveAssetsTarget === null) return;
    if (await moveAssets(selectedIds, moveAssetsTarget === TOP_LEVEL ? null : Number(moveAssetsTarget))) {
      setMoveAssetsTarget(null);
    }
  };

  const confirmFolderMove = async () => {
    if (!moveFolderTarget) return;
    const targetId = moveFolderTarget.value === TOP_LEVEL ? null : Number(moveFolderTarget.value);
    if (await moveFolder(moveFolderTarget.folder, targetId)) setMoveFolderTarget(null);
  };

  const confirmBulkDelete = async () => {
    try {
      const result = await bulkDeleteMutation.mutateAsync(selectedIds);
      notifications.show({ title: 'Success', message: `${plural(result.deleted, 'asset')} deleted`, color: 'green' });
      clearSelection();
      setBulkDeleteOpen(false);
    } catch (err) {
      notifyError(err);
    }
  };

  const tree: IAssetTreeContext = {
    folders,
    permissions,
    expanded,
    toggleExpanded,
    selected,
    selectedRef,
    toggleSelected,
    onAssetSelect,
    onEditAsset: setEditTarget,
    onDeleteAsset: setDeleteTarget,
    deletingAssetId: deleteAssetMutation.isPending ? deleteTarget?.id ?? null : null,
    renamingId,
    onRename: renameFolder,
    onCancelRename: () => setRenamingId(null),
    creatingIn,
    onCreateFolder: createFolder,
    onCancelCreate: () => setCreatingIn(undefined),
    onStartRename: (folder) => {
      setCreatingIn(undefined);
      setRenamingId(folder.id);
    },
    onNewSubfolder: (folder) => {
      setRenamingId(null);
      expand([folder.id]);
      setCreatingIn(folder.id);
    },
    onUploadHere: (folder) => onUploadToFolder?.(folder.id),
    onMoveFolder: (folder) => setMoveFolderTarget({ folder, value: folder.parent_id === null ? TOP_LEVEL : String(folder.parent_id) }),
    onSetAccess: setAccessFolder,
    onDeleteFolder: (folder) => {
      setDeleteFolderError(null);
      setDeleteFolderTarget(folder);
    },
    dragEnabled: permissions.canUpdate,
    dragState,
    dropInsideIds,
  };

  if (error) {
    return (
      <Paper p="md">
        <Text c="red">Error loading assets: {error.message}</Text>
      </Paper>
    );
  }

  const isEmpty = !isLoading && assets.length === 0 && rootFolders.length === 0 && creatingIn !== null;
  const folderLinkFor = (asset: IAsset) => ({
    label: folderPathLabel(folders, asset.folder_id) || 'No folder',
    onShow: () => showInTree(asset.folder_id),
  });

  return (
    <Card>
      <AssetTreeProvider value={tree}>
      <Stack gap="md">
        <PageHeader
          title="Assets Management"
          subtitle="Upload and manage media files. Assets without groups are public; add groups to restrict who can see them."
          badge={allAssetsData?.pagination.total ?? 0}
          badgeAriaLabel="assets"
        >
          {permissions.canCreate && (
            <Button
              variant="default"
              leftSection={<IconFolderPlus size={16} />}
              onClick={() => {
                setRenamingId(null);
                setCreatingIn(null);
              }}
            >
              New folder
            </Button>
          )}
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
          <TopLevelDropZone />
        )}

        {selected.size > 0 && (
          <Paper withBorder p="sm" role="region" aria-label="Bulk actions">
            <Group justify="space-between">
              <Text size="sm" fw={500}>
                {plural(selected.size, 'asset')} selected
              </Text>
              <Group gap="xs">
                {canBulkUpdate && (
                  <>
                    <Button size="xs" variant="light" leftSection={<IconUsersGroup size={14} />} onClick={() => setBulkMode('add')}>
                      Add groups
                    </Button>
                    <Button size="xs" variant="light" color="gray" leftSection={<IconUsersGroup size={14} />} onClick={() => setBulkMode('remove')}>
                      Remove groups
                    </Button>
                    <Button
                      size="xs"
                      variant="light"
                      leftSection={<IconFolderShare size={14} />}
                      onClick={() => {
                        const firstFolder = selectedAssets[0]?.folder_id ?? null;
                        setMoveAssetsTarget(firstFolder === null ? TOP_LEVEL : String(firstFolder));
                      }}
                    >
                      Move to folder
                    </Button>
                  </>
                )}
                {canBulkDelete && (
                  <Button size="xs" variant="light" color="red" leftSection={<IconTrash size={14} />} onClick={() => setBulkDeleteOpen(true)}>
                    Delete
                  </Button>
                )}
                {onExportSelected && (
                  <Button size="xs" variant="light" leftSection={<IconFileZip size={14} />} onClick={() => onExportSelected(selectedIds)}>
                    Export selected
                  </Button>
                )}
                <Button size="xs" variant="subtle" color="gray" onClick={clearSelection}>
                  Clear selection
                </Button>
              </Group>
            </Group>
          </Paper>
        )}

        <DragStatusBar />

        <div className={tableStyles.tableWrapper} data-dragging={dragging || undefined}>
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
                  {searching ? (
                    assets.map((asset) => <AssetRow key={asset.id} asset={asset} depth={null} folderLink={folderLinkFor(asset)} />)
                  ) : (
                    <>
                      {creatingIn === null && page === 1 && <NewFolderRow parentId={null} depth={0} />}
                      {rootFolders.map((folder) => <FolderNode key={folder.id} folder={folder} depth={0} />)}
                      {assets.map((asset) => <AssetRow key={asset.id} asset={asset} depth={0} />)}
                    </>
                  )}
                </Table.Tbody>
              </Table>
          </Box>

          {isEmpty && (
            <EmptyState
              title={searching ? 'No assets found' : 'No assets yet'}
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
      </AssetTreeProvider>

      <DeleteAssetModal
        opened={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDeleteAsset}
        assetName={deleteTarget ? assetLabel(deleteTarget) : ''}
        isLoading={deleteAssetMutation.isPending}
      />

      <AssetFormModal
        opened={editTarget !== null}
        onClose={() => setEditTarget(null)}
        onEdited={(edited) => dropFromSelection([edited.id])}
        asset={editTarget}
      />

      <BulkGroupMembershipModal
        opened={bulkMode !== null}
        onClose={() => setBulkMode(null)}
        mode={bulkMode ?? 'add'}
        selectedCount={selected.size}
        onConfirm={(groupIds) => void confirmBulkGroups(groupIds)}
        isLoading={bulkGroupsMutation.isPending}
        copy={BULK_COPY}
        itemLabel="asset"
        allowedGroupIds={bulkMode === 'remove' ? sharedGroupIds : undefined}
      />

      <MoveToFolderModal
        opened={moveAssetsTarget !== null}
        onClose={() => setMoveAssetsTarget(null)}
        title={`Move ${plural(selected.size, 'asset')}`}
        value={moveAssetsTarget ?? TOP_LEVEL}
        onChange={setMoveAssetsTarget}
        onMove={() => void confirmBulkMove()}
        isLoading={bulkMoveMutation.isPending}
        folders={folders}
      />

      <MoveToFolderModal
        opened={moveFolderTarget !== null}
        onClose={() => setMoveFolderTarget(null)}
        title={moveFolderTarget ? `Move folder ${moveFolderTarget.folder.name}` : 'Move folder'}
        value={moveFolderTarget?.value ?? TOP_LEVEL}
        onChange={(value) => setMoveFolderTarget((prev) => (prev ? { ...prev, value } : prev))}
        onMove={() => void confirmFolderMove()}
        isLoading={saveFolderMutation.isPending}
        folders={folders}
        excludeIds={moveFolderTarget
          ? new Set([moveFolderTarget.folder.id, ...folderDescendantIds(folders, moveFolderTarget.folder.id)])
          : undefined}
        hint="A folder cannot go into itself or one of its own subfolders."
      />

      {accessFolder && (
        <AssetFolderAccessModal opened onClose={() => setAccessFolder(null)} onApplied={clearSelection} folder={accessFolder} />
      )}

      <ModalWrapper
        opened={deleteFolderTarget !== null}
        onClose={() => setDeleteFolderTarget(null)}
        title={deleteFolderTarget ? `Delete folder ${deleteFolderTarget.name}?` : 'Delete folder?'}
        size="sm"
        onDelete={() => void confirmDeleteFolder()}
        deleteLabel="Delete folder"
        isLoading={deleteFolderMutation.isPending}
      >
        <Text size="sm">Only an empty folder can be deleted. The folder is removed; no asset is touched.</Text>
        {deleteFolderError && <Text size="sm" c="red" mt="sm" role="alert">{deleteFolderError}</Text>}
      </ModalWrapper>

      <ModalWrapper
        opened={bulkDeleteOpen}
        onClose={() => setBulkDeleteOpen(false)}
        title={`Delete ${plural(selected.size, 'asset')}?`}
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
