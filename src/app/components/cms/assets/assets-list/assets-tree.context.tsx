/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
"use client";

import { createContext, useContext, type MutableRefObject } from 'react';
import type { IAsset, IAssetFolder } from '../../../../../api/admin/asset.api';
import { canDropOn, type IAssetDragState } from './assets-dnd';
import styles from './assets-tree.module.css';

/** What the caller may do with assets and folders at all (the server still decides per asset). */
export interface IAssetTreePermissions {
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
}

/**
 * Everything the rows of the assets tree share. The tree is recursive (folders
 * inside folders), so rows read this instead of receiving a long list of props.
 */
export interface IAssetTreeContext {
  folders: IAssetFolder[];
  permissions: IAssetTreePermissions;

  expanded: ReadonlySet<number>;
  toggleExpanded: (folderId: number) => void;

  /** Selected assets by id. The objects are kept so a bulk action can check the rights of assets in any open folder. */
  selected: ReadonlyMap<number, IAsset>;
  /** The same map, current at any moment, for a drag that starts between renders. */
  selectedRef: MutableRefObject<ReadonlyMap<number, IAsset>>;
  toggleSelected: (asset: IAsset) => void;

  onAssetSelect?: (asset: IAsset) => void;
  onEditAsset: (asset: IAsset) => void;
  onDeleteAsset: (asset: IAsset) => void;
  deletingAssetId: number | null;

  /** The folder being renamed in place. */
  renamingId: number | null;
  onRename: (folder: IAssetFolder, name: string) => Promise<void>;
  onCancelRename: () => void;

  /** Where a new folder is being named: undefined = nowhere, null = top level, a number = inside that folder. */
  creatingIn: number | null | undefined;
  onCreateFolder: (parentId: number | null, name: string) => Promise<void>;
  onCancelCreate: () => void;

  onStartRename: (folder: IAssetFolder) => void;
  onNewSubfolder: (folder: IAssetFolder) => void;
  onUploadHere: (folder: IAssetFolder) => void;
  onMoveFolder: (folder: IAssetFolder) => void;
  onSetAccess: (folder: IAssetFolder) => void;
  onDeleteFolder: (folder: IAssetFolder) => void;

  /** Whether a drag may start, i.e. the caller may update assets. */
  dragEnabled: boolean;
  /** The drag in progress and where a drop would land right now. */
  dragState: IAssetDragState;
  /** The folder under the pointer and every folder inside it (empty when the pointer is over no folder). */
  dropInsideIds: ReadonlySet<number>;
}

const AssetTreeContext = createContext<IAssetTreeContext | null>(null);

export const AssetTreeProvider = AssetTreeContext.Provider;

export function useAssetTree(): IAssetTreeContext {
  const context = useContext(AssetTreeContext);
  if (!context) throw new Error('useAssetTree must be used inside an AssetTreeProvider');
  return context;
}

/**
 * How a drag in progress concerns a folder row:
 * `target` = the pointer is over it, `inside` = it lies inside the folder the pointer is over,
 * `available` = it could take the drag, `blocked` = it cannot, `null` = no drag.
 */
export type TFolderCue = 'target' | 'inside' | 'available' | 'blocked' | null;

export function folderCue(tree: IAssetTreeContext, folderId: number): TFolderCue {
  const { drag, targetFolderId } = tree.dragState;
  if (!drag) return null;
  if (targetFolderId === folderId) return 'target';
  if (tree.dropInsideIds.has(folderId)) return 'inside';
  return canDropOn(drag, folderId, tree.folders) ? 'available' : 'blocked';
}

/** Whether the content of `folderId` (null = assets at the top level) lies inside the folder the pointer is over. */
export function contentIsInside(tree: IAssetTreeContext, folderId: number | null): boolean {
  const { drag, targetFolderId } = tree.dragState;
  if (!drag || targetFolderId === undefined) return false;
  return folderId === null ? targetFolderId === null : tree.dropInsideIds.has(folderId);
}

/** Whether an asset or folder is part of the drag in progress. */
export function isBeingDragged(tree: IAssetTreeContext, kind: 'asset' | 'folder', id: number): boolean {
  const { drag } = tree.dragState;
  if (!drag) return false;
  return kind === 'asset'
    ? drag.type === 'asset-selection' && drag.assetIds.includes(id)
    : drag.type === 'asset-folder' && drag.folderId === id;
}

/** CSS classes of a row for a drag in progress. */
export function dropRowClass(cue: TFolderCue | 'content-inside', dragged: boolean): string {
  const classes = [styles.row];
  if (dragged) classes.push(styles.rowDragged);
  if (cue === 'target') classes.push(styles.rowTarget);
  else if (cue === 'inside' || cue === 'content-inside') classes.push(styles.rowInside);
  else if (cue === 'available') classes.push(styles.rowAvailable);
  else if (cue === 'blocked') classes.push(styles.rowBlocked);
  return classes.join(' ');
}
