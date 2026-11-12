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

/** Picker label: the name plus the extension of its MIME type, e.g. `team-photo.png`. */
export function assetFileLabel(asset: Pick<IAsset, 'name' | 'uuid' | 'mime_type'>): string {
  const subtype = asset.mime_type?.split('/')[1]?.split('+')[0] ?? '';
  const extension = subtype === 'jpeg' ? 'jpg' : subtype;
  return /^[a-z0-9]+$/.test(extension) ? `${assetLabel(asset)}.${extension}` : assetLabel(asset);
}

const IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'ico', 'avif', 'tif', 'tiff'];

function getFileExtension(fileName: string): string {
  const parts = fileName.split('.');
  return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
}

/** Whether the asset previews as an image: by MIME type, else by the name's extension. */
export function isImageAsset(asset: Pick<IAsset, 'mime_type' | 'name'>): boolean {
  if (asset.mime_type && asset.mime_type !== 'application/octet-stream') {
    return asset.mime_type.startsWith('image/');
  }
  return IMAGE_EXTENSIONS.includes(getFileExtension(asset.name ?? ''));
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

type TCategory = 'image' | 'video' | 'audio' | 'pdf' | 'document' | 'spreadsheet' | 'font' | 'archive' | 'css' | 'code' | 'text' | 'other';

function categoryOf(asset: Pick<IAsset, 'asset_type' | 'mime_type' | 'name'>): TCategory {
  const extension = getFileExtension(asset.name ?? '');
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

/** Icon, colour and type label (`WEBP`, `PDF`, else the category) for an asset row. */
export function getAssetTypeInfo(asset: Pick<IAsset, 'asset_type' | 'mime_type' | 'name'>): { label: string; icon: ReactNode; color: string } {
  const info = CATEGORY_INFO[categoryOf(asset)];
  const subtype = asset.mime_type?.split('/')[1]?.split('+')[0] ?? '';
  const concrete = getFileExtension(asset.name ?? '') || (/^[a-z0-9]+$/.test(subtype) ? subtype : '');
  return { ...info, label: concrete ? concrete.toUpperCase() : info.label };
}
