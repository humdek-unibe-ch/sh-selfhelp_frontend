/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
"use client";

import { useRef, useState } from 'react';
import { Alert, Grid, Group, Stack, Text } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { Dropzone, type FileWithPath } from '@mantine/dropzone';
import { IconCloudUpload, IconReplace, IconX } from '@tabler/icons-react';
import { ModalWrapper } from '../../../shared/common/CustomModal/CustomModal';
import { useAssetFolders, useCreateAsset, useSaveAssetFolder, useUpdateAsset } from '../../../../../hooks/useAssets';
import { AdminAssetApi, type IAsset } from '../../../../../api/admin/asset.api';
import { parseApiError } from '../../../../../utils/mutation-error-handler';
import {
  assetLabel,
  fileBaseName,
  findChildFolder,
  folderPathLabel,
  formatFileSize,
  getAssetTypeInfo,
  isImageAsset,
  parseFolderPath,
  resolveFolderPath,
  sameIds,
} from '../assets.utils';
import {
  PublicWarning,
  WhoCanManageField,
  WhoCanSeeField,
  useAccessLists,
} from '../asset-access-fields/AssetAccessFields';
import { FolderPathCombobox } from './FolderPathCombobox';
import { UploadFileTable, type IUploadRow, type TRowStatus } from './UploadFileTable';

interface IAssetFormModalProps {
  opened: boolean;
  onClose: () => void;
  /** Called after an edit was saved (not on cancel), before the modal closes. */
  onEdited?: (asset: IAsset) => void;
  asset?: IAsset | null;
  defaultFolderId?: number | null;
}

/** A file waiting to be uploaded, with the name and alt text its asset will get. */
interface IFileRow {
  key: string;
  file: File;
  name: string;
  alt: string;
  status: TRowStatus;
  message?: string;
}

/** Same name, size and modified time = the same file picked twice. */
const fileKey = (file: File) => `${file.name}|${file.size}|${file.lastModified}`;

const extensionOf = (fileName: string) => (fileName.includes('.') ? fileName.split('.').pop()?.toLowerCase() ?? '' : '');

const looksLikeImage = (file: File) =>
  isImageAsset({ mime_type: file.type || null, name: file.name, extension: extensionOf(file.name) });

/** Height of the file table (header and six rows fit, 303px at the default size); a longer list scrolls inside it. */
const TABLE_MAX_HEIGHT = 320;

const isConflict = (error: unknown) => (error as { response?: { status?: number } } | null)?.response?.status === 409;

/**
 * Upload files or edit one asset. Upload is one table: every file has its own
 * Name and Alt text and goes up in its own request, so one bad file does not
 * stop the others; failed rows stay for a retry. The folder is picked as a path
 * and may be new: missing levels are made when the upload starts. No groups =
 * public; no roles picked on upload = the uploader's roles; the admin role
 * always manages and is not offered. Edit changes one asset and can replace its
 * file under the same uuid.
 *
 * On edit the groups and roles are sent ONLY when the admin changed them: the
 * backend replaces the whole set when the field is present, so re-sending an
 * unchanged set would rewrite who manages the asset on every rename. The current
 * groups and roles always show by name, even when the list of all of them cannot
 * be read, and in that case that picker is read-only.
 */
export function AssetFormModal({ opened, onClose, onEdited, asset, defaultFolderId = null }: IAssetFormModalProps) {
  const isEdit = !!asset;
  const createAsset = useCreateAsset();
  const updateAsset = useUpdateAsset();
  const saveFolder = useSaveAssetFolder();
  // The modal is always mounted (the page opens it for create and edit), so the
  // lists are read when it opens, not on every visit of the assets page.
  const lists = useAccessLists(opened, { groups: asset?.groups, roles: asset?.roles });
  const { data: folders = [] } = useAssetFolders();
  const wide = useMediaQuery('(min-width: 62em)');

  const [rows, setRows] = useState<IFileRow[]>([]);
  // Edit: the row is the asset; a dropped file replaces its bytes.
  const [replacement, setReplacement] = useState<File | null>(null);
  const [editName, setEditName] = useState('');
  const [editAlt, setEditAlt] = useState('');
  const [groupIds, setGroupIds] = useState<string[]>([]);
  const [roleIds, setRoleIds] = useState<string[]>([]);
  // null = not touched: the folder the form opened on.
  const [folderPath, setFolderPath] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const uploadingRef = useRef(false);

  // Reset the form whenever the modal opens or switches asset (React's
  // documented alternative to a state-syncing effect).
  const resetKey = opened ? `open-${asset?.id ?? 'new'}` : 'closed';
  const [prevResetKey, setPrevResetKey] = useState<string | null>(null);
  if (prevResetKey !== resetKey) {
    setPrevResetKey(resetKey);
    setRows([]);
    setReplacement(null);
    setEditName(asset?.name ?? '');
    setEditAlt(asset?.alt ?? '');
    setGroupIds((asset?.groups ?? []).map((group) => String(group.id)));
    setRoleIds((asset?.roles ?? []).map((role) => String(role.id)));
    setFolderPath(null);
    setFormError(null);
    setBusy(false);
  }

  const initialFolderId = asset ? asset.folder_id : defaultFolderId;
  const chosenPath = folderPath ?? folderPathLabel(folders, initialFolderId);

  const groupsChanged = isEdit && !sameIds(groupIds, (asset?.groups ?? []).map((group) => String(group.id)));
  const rolesChanged = isEdit && !sameIds(roleIds, (asset?.roles ?? []).map((role) => String(role.id)));
  // An emptied set is refused rather than guessed: only an admin may leave an
  // asset with no managing role (then only admins manage it).
  const rolesEmptied = rolesChanged && roleIds.length === 0 && !lists.callerIsAdmin;

  const isPending = busy || updateAsset.isPending;
  const pendingRows = rows.filter((row) => row.status !== 'done');

  const showError = (error: unknown) => {
    const { errorTitle, errorMessage } = parseApiError(error);
    notifications.show({ title: errorTitle, message: errorMessage, color: 'red' });
  };

  const handleDrop = (dropped: FileWithPath[]) => {
    if (isEdit) {
      setReplacement(dropped[0] ?? null);
      return;
    }
    const known = new Set(rows.map((row) => row.key));
    const added: IFileRow[] = [];
    const skipped: string[] = [];
    for (const file of dropped) {
      const key = fileKey(file);
      if (known.has(key)) {
        skipped.push(file.name);
        continue;
      }
      known.add(key);
      added.push({ key, file, name: fileBaseName(file.name), alt: '', status: 'idle' });
    }
    if (added.length > 0) setRows((prev) => [...prev, ...added]);
    if (skipped.length > 0) {
      notifications.show({
        title: 'Already in the list',
        message: `Not added twice: ${skipped.join(', ')}`,
        color: 'yellow',
      });
    }
  };

  const patchRow = (key: string, patch: Partial<IFileRow>) =>
    setRows((prev) => prev.map((row) => (row.key === key ? { ...row, ...patch } : row)));

  /**
   * The id of the folder the path names, making the levels that do not exist
   * yet, top down. A 409 means someone made it meanwhile: use theirs.
   */
  const ensureFolder = async (path: string): Promise<number | null> => {
    const resolved = resolveFolderPath(folders, parseFolderPath(path));
    let parentId = resolved.existingId;
    for (const name of resolved.missing) {
      try {
        const all = await saveFolder.mutateAsync({ folder: { name, parent_id: parentId } });
        const made = findChildFolder(all, parentId, name);
        if (!made) throw new Error(`Folder ${name} was not created.`);
        parentId = made.id;
      } catch (error) {
        if (!isConflict(error)) throw error;
        const existing = findChildFolder(await AdminAssetApi.getFolders(), parentId, name);
        if (!existing) throw error;
        parentId = existing.id;
      }
    }
    return parentId;
  };

  const announceDuplicates = (rowName: string, duplicates: NonNullable<IAsset['duplicates']>) => {
    const first = duplicates[0];
    const where = folderPathLabel(folders, first.folder_id) || 'the top level';
    const more = duplicates.length > 1 ? ` (and ${duplicates.length - 1} more)` : '';
    notifications.show({
      title: 'Identical file',
      message: `${rowName} is identical to ${first.name ?? `asset #${first.id}`} in ${where}${more}.`,
      color: 'yellow',
      autoClose: false,
    });
  };

  const handleCreate = async () => {
    if (pendingRows.length === 0 || uploadingRef.current) return;
    uploadingRef.current = true;
    setBusy(true);
    setFormError(null);

    let folderId: number | null;
    try {
      folderId = await ensureFolder(chosenPath);
    } catch (error) {
      setFormError(parseApiError(error).errorMessage);
      uploadingRef.current = false;
      setBusy(false);
      return;
    }

    const batch = pendingRows;
    setRows((prev) => prev.map((row) => (batch.some((item) => item.key === row.key) ? { ...row, status: 'waiting', message: undefined } : row)));
    // On create, no roles picked = the uploader's roles (field omitted).
    const createRoleIds = roleIds.length > 0 ? roleIds.map(Number) : undefined;
    let failed = 0;
    for (const row of batch) {
      patchRow(row.key, { status: 'uploading' });
      try {
        const created = await createAsset.mutateAsync({
          file: row.file,
          name: row.name.trim() || undefined,
          alt: looksLikeImage(row.file) ? row.alt.trim() || undefined : undefined,
          group_ids: groupIds.map(Number),
          role_ids: createRoleIds,
          folder_id: folderId,
        });
        patchRow(row.key, { status: 'done' });
        if (created.duplicates && created.duplicates.length > 0) {
          announceDuplicates(created.name ?? row.name ?? row.file.name, created.duplicates);
        }
      } catch (error) {
        failed += 1;
        patchRow(row.key, { status: 'failed', message: parseApiError(error).errorMessage });
      }
    }

    uploadingRef.current = false;
    setBusy(false);
    // Failed rows stay for a retry; the form closes when everything went up.
    if (failed === 0) {
      notifications.show({
        title: 'Success',
        message: batch.length === 1 ? 'Asset uploaded' : `${batch.length} assets uploaded`,
        color: 'green',
      });
      onClose();
    }
  };

  const handleUpdate = async () => {
    if (!asset || rolesEmptied) return;
    setFormError(null);
    try {
      const folderId = await ensureFolder(chosenPath);
      await updateAsset.mutateAsync({
        assetId: asset.id,
        data: {
          file: replacement ?? undefined,
          name: editName.trim() || undefined,
          alt: editAlt.trim(),
          // Absent = unchanged (see the component note).
          group_ids: groupsChanged ? groupIds.map(Number) : undefined,
          role_ids: rolesChanged ? roleIds.map(Number) : undefined,
          folder_id: folderId,
        },
      });
      notifications.show({
        title: 'Success',
        message: replacement ? 'Asset updated and file replaced' : 'Asset updated',
        color: 'green',
      });
      onEdited?.(asset);
      onClose();
    } catch (error) {
      showError(error);
    }
  };

  const typeIcon = (info: ReturnType<typeof getAssetTypeInfo>) => (
    <div style={{ color: `var(--mantine-color-${info.color}-6)`, display: 'flex' }} aria-hidden>{info.icon}</div>
  );

  const tableRows: IUploadRow[] = asset
    ? [{
        key: `asset-${asset.id}`,
        // The type of the file that will be there after saving.
        icon: typeIcon(getAssetTypeInfo(replacement
          ? { asset_type: undefined, mime_type: replacement.type, name: replacement.name, extension: extensionOf(replacement.name) }
          : asset)),
        fileName: assetLabel(asset),
        name: editName,
        alt: editAlt,
        isImage: replacement ? looksLikeImage(replacement) : isImageAsset(asset),
        sizeLabel: formatFileSize(replacement ? replacement.size : asset.size ?? 0),
        note: replacement ? `Replaced by ${replacement.name}` : undefined,
        status: 'idle',
        canRemove: replacement !== null,
      }]
    : rows.map((row) => {
        const info = getAssetTypeInfo({ asset_type: undefined, mime_type: row.file.type, name: row.file.name, extension: extensionOf(row.file.name) });
        return {
          key: row.key,
          icon: typeIcon(info),
          fileName: row.file.name,
          name: row.name,
          alt: row.alt,
          isImage: looksLikeImage(row.file),
          sizeLabel: formatFileSize(row.file.size),
          status: row.status,
          message: row.message,
          canRemove: true,
        };
      });

  const onName = (key: string, value: string) => (isEdit ? setEditName(value) : patchRow(key, { name: value }));
  const onAlt = (key: string, value: string) => (isEdit ? setEditAlt(value) : patchRow(key, { alt: value }));
  const onRemove = (key: string) => (isEdit ? setReplacement(null) : setRows((prev) => prev.filter((row) => row.key !== key)));

  return (
    <ModalWrapper
      opened={opened}
      onClose={() => !isPending && onClose()}
      title={isEdit ? `Edit asset: ${assetLabel(asset)}` : 'Upload assets'}
      size={1100}
      // The form fits the screen, so the modal itself does not scroll; only the file table does.
      disableScroll={wide === true}
      onSave={isEdit ? undefined : () => void handleCreate()}
      onUpdate={isEdit ? () => void handleUpdate() : undefined}
      saveLabel={pendingRows.length > 1 ? `Upload ${pendingRows.length} assets` : 'Upload asset'}
      updateLabel="Save asset"
      isLoading={isPending}
      disabled={isEdit ? rolesEmptied : pendingRows.length === 0}
      closeOnClickOutside={!isPending}
      closeOnEscape={!isPending}
    >
      <Grid gap="lg" align="flex-start">
        <Grid.Col span={{ base: 12, md: 7 }}>
          <Stack gap="sm">
            <Dropzone
              onDrop={handleDrop}
              multiple={!isEdit}
              disabled={isPending}
              aria-label={isEdit ? 'Choose a replacement file' : 'Choose files to upload'}
            >
              <Group justify="center" gap="md" mih={56} wrap="nowrap" style={{ pointerEvents: 'none' }}>
                <Dropzone.Reject>
                  <IconX size={30} stroke={1.5} />
                </Dropzone.Reject>
                <Dropzone.Idle>
                  {isEdit ? <IconReplace size={30} stroke={1.5} /> : <IconCloudUpload size={32} stroke={1.5} />}
                </Dropzone.Idle>
                <div>
                  <Text size="sm" inline>
                    {isEdit ? 'Drop a file here to replace the current one (optional)' : 'Drag files here or click to select'}
                  </Text>
                  <Text size="xs" c="dimmed" inline mt={6} display="block">
                    {isEdit
                      ? 'The asset keeps its address, so every page using it shows the new file.'
                      : 'Each file becomes its own asset; name them in the table.'}
                  </Text>
                </div>
              </Group>
            </Dropzone>

            {tableRows.length > 0 && (
              <UploadFileTable
                rows={tableRows}
                showStatus={!isEdit}
                disabled={isPending}
                onName={onName}
                onAlt={onAlt}
                onRemove={onRemove}
                maxHeight={TABLE_MAX_HEIGHT}
              />
            )}
          </Stack>
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 5 }}>
          <Stack gap="sm">
            <FolderPathCombobox
              folders={folders}
              value={chosenPath}
              onChange={setFolderPath}
              disabled={isPending}
            />

            <WhoCanSeeField lists={lists} value={groupIds} onChange={setGroupIds} disabled={isPending} />
            {groupIds.length === 0 && <PublicWarning />}

            <WhoCanManageField
              lists={lists}
              value={roleIds}
              onChange={setRoleIds}
              disabled={isPending}
              description={isEdit
                ? 'Roles that can see, edit and delete this asset in the CMS.'
                : 'Roles that can see, edit and delete it in the CMS. Leave empty to give your own roles access.'}
              placeholder={roleIds.length === 0 && !isEdit && !lists.callerIsAdmin ? 'Your roles' : undefined}
              emptyError={rolesEmptied}
            />

            {formError && <Alert color="red" role="alert">{formError}</Alert>}
          </Stack>
        </Grid.Col>
      </Grid>
    </ModalWrapper>
  );
}
