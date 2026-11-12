/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import type { ReactNode } from 'react';
import {
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
import type { IAsset, IAssetFolder } from '../../../../api/admin/asset.api';

/**
 * The admin role. It is implicit: it manages every asset, is never offered in a
 * "who can manage it" picker and is never stored on an asset. The role has no
 * flag in the roles list, so it is found by name (concepts finding F10).
 */
export const ADMIN_ROLE_NAME = 'admin';

/** Whether a role is the admin role (found by name, see {@link ADMIN_ROLE_NAME}). */
export function isAdminRole(role: { name: string }): boolean {
  return role.name === ADMIN_ROLE_NAME;
}

/** The ids of a folder's subfolders at any depth (not the folder itself). */
export function folderDescendantIds(folders: IAssetFolder[], folderId: number): Set<number> {
  const children = new Map<number, number[]>();
  for (const folder of folders) {
    if (folder.parent_id !== null) children.set(folder.parent_id, [...(children.get(folder.parent_id) ?? []), folder.id]);
  }
  const found = new Set<number>();
  const queue = [...(children.get(folderId) ?? [])];
  for (let id = queue.shift(); id !== undefined; id = queue.shift()) {
    if (found.has(id)) continue;
    found.add(id);
    queue.push(...(children.get(id) ?? []));
  }
  return found;
}

/** A folder's path as shown to people: `Parent / Child`; empty for the top level or an unknown id. */
export function folderPathLabel(folders: IAssetFolder[], folderId: number | null): string {
  return folderTrail(folders, folderId).map((folder) => folder.name).join(' / ');
}

/** A typed folder path (`Courses / Week 1`, `Courses/Week 1`) as its names; empty parts are dropped. */
export function parseFolderPath(text: string): string[] {
  return text.split('/').map((part) => part.trim()).filter((part) => part !== '');
}

/** A folder path as people read it: `Courses / Week 1`. */
export function formatFolderPath(names: string[]): string {
  return names.join(' / ');
}

/** The child of `parentId` named `name`, compared without regard to letter case (as the server does). */
export function findChildFolder(folders: IAssetFolder[], parentId: number | null, name: string): IAssetFolder | undefined {
  const wanted = name.toLowerCase();
  return folders.find((folder) => folder.parent_id === parentId && folder.name.toLowerCase() === wanted);
}

/**
 * How much of a path exists: the deepest existing folder (null = the top level,
 * also for an empty path) and the names still to create below it, top down.
 */
export function resolveFolderPath(folders: IAssetFolder[], names: string[]): { existingId: number | null; missing: string[] } {
  let existingId: number | null = null;
  for (let index = 0; index < names.length; index += 1) {
    const found = findChildFolder(folders, existingId, names[index]);
    if (!found) return { existingId, missing: names.slice(index) };
    existingId = found.id;
  }
  return { existingId, missing: [] };
}

/** Folders directly under a parent (null = top level), sorted by name. */
export function childFolders(folders: IAssetFolder[], parentId: number | null): IAssetFolder[] {
  return folders.filter((folder) => folder.parent_id === parentId).sort((a, b) => a.name.localeCompare(b.name));
}

/** What a folder holds, for its row: `2 folders · 5 assets` (parts that are zero are left out). */
export function folderSummary(folders: IAssetFolder[], folder: IAssetFolder): string {
  const subfolders = folders.filter((other) => other.parent_id === folder.id).length;
  const assets = folder.subtree_asset_count ?? folder.asset_count;
  const parts = [];
  if (subfolders > 0) parts.push(`${subfolders} ${subfolders === 1 ? 'folder' : 'folders'}`);
  parts.push(`${assets} ${assets === 1 ? 'asset' : 'assets'}`);
  return parts.join(' · ');
}

/** A folder and its ancestors, top level first; empty for an unknown id. */
export function folderTrail(folders: IAssetFolder[], folderId: number | null): IAssetFolder[] {
  const byId = new Map(folders.map((folder) => [folder.id, folder]));
  const trail: IAssetFolder[] = [];
  for (let folder = folderId !== null ? byId.get(folderId) : undefined; folder; folder = folder.parent_id !== null ? byId.get(folder.parent_id) : undefined) {
    trail.unshift(folder);
  }
  return trail;
}

/** Select options for folders, labelled with their path (`Parent / Child`), sorted by it. */
export function folderOptions(folders: IAssetFolder[]): { value: string; label: string }[] {
  return folders
    .map((folder) => ({
      value: String(folder.id),
      label: folderTrail(folders, folder.id).map((f) => f.name).join(' / '),
    }))
    .sort((a, b) => a.label.localeCompare(b.label));
}

/**
 * Picker options: everything the list offers plus the values already selected
 * on the asset, so a selected group or role shows its NAME even when the list
 * is unavailable (no permission to read it) or lacks it. Mantine's MultiSelect
 * rejects duplicate option values, so a value is listed once.
 */
export function withCurrentOptions(
  listed: { value: string; label: string }[],
  current: { id: number; name: string }[],
): { value: string; label: string }[] {
  const known = new Set(listed.map((option) => option.value));
  const missing = current
    .filter((item) => !known.has(String(item.id)))
    .map((item) => ({ value: String(item.id), label: item.name }));
  return [...listed, ...missing];
}

/** Whether two id lists hold the same ids, whatever their order. */
export function sameIds(a: string[], b: string[]): boolean {
  return a.length === b.length && a.every((id) => b.includes(id));
}

/** What admins see an asset as: its name (no extension), else its uuid. */
export function assetLabel(asset: Pick<IAsset, 'name' | 'uuid'>): string {
  return asset.name || asset.uuid;
}

/**
 * Picker label: the name plus the stored extension, e.g. `team-photo.png`. An
 * asset uploaded before the extension was stored falls back to its MIME type.
 */
export function assetFileLabel(asset: Pick<IAsset, 'name' | 'uuid' | 'mime_type' | 'extension'>): string {
  if (asset.extension && /^[a-z0-9]+$/.test(asset.extension)) return `${assetLabel(asset)}.${asset.extension}`;
  const subtype = asset.mime_type?.split('/')[1]?.split('+')[0] ?? '';
  const extension = subtype === 'jpeg' ? 'jpg' : subtype;
  return /^[a-z0-9]+$/.test(extension) ? `${assetLabel(asset)}.${extension}` : assetLabel(asset);
}

/** A file name without its last extension (`report.final.pdf` -> `report.final`). */
export function fileBaseName(fileName: string): string {
  const dot = fileName.lastIndexOf('.');
  return dot > 0 ? fileName.slice(0, dot) : fileName;
}

const IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'ico', 'avif', 'tif', 'tiff'];

function getFileExtension(fileName: string): string {
  const parts = fileName.split('.');
  return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
}

/** The extension of an asset: the stored one, else the one in its name (older assets, imports). */
function extensionOf(asset: Pick<IAsset, 'name' | 'extension'>): string {
  return (asset.extension ?? '').toLowerCase() || getFileExtension(asset.name ?? '');
}

/** Whether the asset previews as an image: by MIME type, else by its extension. */
export function isImageAsset(asset: Pick<IAsset, 'mime_type' | 'name' | 'extension'>): boolean {
  if (asset.mime_type && asset.mime_type !== 'application/octet-stream') {
    return asset.mime_type.startsWith('image/');
  }
  return IMAGE_EXTENSIONS.includes(extensionOf(asset));
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

type TCategory = 'image' | 'video' | 'audio' | 'pdf' | 'document' | 'spreadsheet' | 'font' | 'archive' | 'css' | 'code' | 'text' | 'other';

function categoryOf(asset: Pick<IAsset, 'asset_type' | 'mime_type' | 'name' | 'extension'>): TCategory {
  const extension = extensionOf(asset);
  const mime = asset.mime_type ?? '';

  // `asset_type` is a storage category (`css` / `asset` / `static`); only
  // `css` carries information the file itself does not.
  if (asset.asset_type?.toLowerCase() === 'css' || extension === 'css') return 'css';
  if (mime.startsWith('image/') || (!mime && IMAGE_EXTENSIONS.includes(extension))) return 'image';
  if (mime.startsWith('video/') || ['mp4', 'webm', 'avi', 'mov', 'wmv', 'flv', 'mkv', 'm4v', 'ogv'].includes(extension)) return 'video';
  if (mime.startsWith('audio/') || ['mp3', 'wav', 'ogg', 'aac', 'flac', 'm4a', 'oga', 'opus', 'weba'].includes(extension)) return 'audio';
  if (mime === 'application/pdf' || extension === 'pdf') return 'pdf';
  if (['doc', 'docx', 'odt', 'rtf'].includes(extension)) return 'document';
  if (['xls', 'xlsx', 'ods', 'csv'].includes(extension)) return 'spreadsheet';
  if (['woff', 'woff2', 'ttf', 'otf', 'eot'].includes(extension)) return 'font';
  if (['zip', 'gz', 'tar', 'rar', '7z'].includes(extension)) return 'archive';
  if (['js', 'jsx', 'ts', 'tsx', 'json', 'xml', 'html', 'htm', 'php', 'py', 'java', 'cpp', 'c', 'h', 'scss', 'sass', 'less', 'yml', 'yaml'].includes(extension)) return 'code';
  if (mime.startsWith('text/') || ['txt', 'md', 'log'].includes(extension)) return 'text';
  return 'other';
}

const CATEGORY_INFO: Record<TCategory, { label: string; icon: ReactNode; color: string }> = {
  image: { label: 'Image', icon: <IconPhoto size={18} />, color: 'green' },
  video: { label: 'Video', icon: <IconVideo size={18} />, color: 'blue' },
  audio: { label: 'Audio', icon: <IconMusic size={18} />, color: 'orange' },
  pdf: { label: 'PDF', icon: <IconFileText size={18} />, color: 'red' },
  document: { label: 'Document', icon: <IconFileText size={18} />, color: 'blue' },
  spreadsheet: { label: 'Spreadsheet', icon: <IconTable size={18} />, color: 'green' },
  font: { label: 'Font', icon: <IconTypography size={18} />, color: 'grape' },
  archive: { label: 'Archive', icon: <IconFileZip size={18} />, color: 'yellow' },
  css: { label: 'CSS', icon: <IconCode size={18} />, color: 'purple' },
  code: { label: 'Code', icon: <IconCode size={18} />, color: 'yellow' },
  text: { label: 'Text', icon: <IconFileText size={18} />, color: 'gray' },
  other: { label: 'Other', icon: <IconFile size={18} />, color: 'gray' },
};

/**
 * Icon, colour and type label (`WEBP`, `CSV`, else the category) for an asset
 * row. The stored extension decides, so a CSV is a CSV whatever MIME type the
 * server detected.
 */
export function getAssetTypeInfo(asset: Pick<IAsset, 'asset_type' | 'mime_type' | 'name' | 'extension'>): { label: string; icon: ReactNode; color: string } {
  const info = CATEGORY_INFO[categoryOf(asset)];
  const subtype = asset.mime_type?.split('/')[1]?.split('+')[0] ?? '';
  const concrete = extensionOf(asset) || (/^[a-z0-9]+$/.test(subtype) ? subtype : '');
  return { ...info, label: concrete ? concrete.toUpperCase() : info.label };
}
