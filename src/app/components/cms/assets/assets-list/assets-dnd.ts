/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { useEffect, useRef, useState, type RefObject } from 'react';
import { autoScrollWindowForElements } from '@atlaskit/pragmatic-drag-and-drop-auto-scroll/element';
import { combine } from '@atlaskit/pragmatic-drag-and-drop/combine';
import {
  draggable,
  dropTargetForElements,
  monitorForElements,
} from '@atlaskit/pragmatic-drag-and-drop/element/adapter';
import { pointerOutsideOfPreview } from '@atlaskit/pragmatic-drag-and-drop/element/pointer-outside-of-preview';
import { setCustomNativeDragPreview } from '@atlaskit/pragmatic-drag-and-drop/element/set-custom-native-drag-preview';
import type { IAssetFolder } from '../../../../../api/admin/asset.api';
import { folderDescendantIds, folderPathLabel } from '../assets.utils';
import styles from './assets-tree.module.css';

/**
 * Drag and drop for the assets tree, built on the same pragmatic-drag-and-drop
 * parts as the navigation builder. Dragging is a shortcut only: every move can
 * also be done from a menu ("Move to...") or the bulk bar, so nothing here is
 * the only way to do something.
 *
 * While a drag is on, the page scrolls by itself near the top and bottom edge
 * (and with the mouse wheel, which a native drag swallows), every folder that
 * may take the drag is outlined, the one under the pointer is highlighted
 * together with what it holds, and a status line says what a drop would do.
 */

const DRAG_ASSETS = 'asset-selection';
const DRAG_FOLDER = 'asset-folder';
const DROP_FOLDER = 'asset-folder-drop';

/** What a drag carries. `label` names it in the drag preview and the status line. */
export type TAssetDrag =
  | { type: typeof DRAG_ASSETS; assetIds: number[]; folderIds: (number | null)[]; label: string }
  | { type: typeof DRAG_FOLDER; folderId: number; parentId: number | null; label: string };

/** Where a drop lands: a folder, or `null` for the top level ("All assets"). */
export interface IAssetDrop {
  drag: TAssetDrag;
  targetFolderId: number | null;
}

/**
 * The drag in progress: what is dragged and where a drop would land right now.
 * `targetFolderId`: `undefined` = over nothing that accepts the drag, `null` = the top level.
 */
export interface IAssetDragState {
  drag: TAssetDrag | null;
  targetFolderId: number | null | undefined;
}

export const NO_DRAG: IAssetDragState = { drag: null, targetFolderId: undefined };

/** Data of a draggable asset row: the selection if the row is in it, else just the row. */
export function assetDragData(assetIds: number[], folderIds: (number | null)[], label: string): TAssetDrag {
  return { type: DRAG_ASSETS, assetIds, folderIds, label };
}

/** Data of a draggable folder row. */
export function folderDragData(folder: IAssetFolder): TAssetDrag {
  return { type: DRAG_FOLDER, folderId: folder.id, parentId: folder.parent_id, label: folder.name };
}

function isAssetDrag(data: Record<string | symbol, unknown>): data is TAssetDrag {
  return data.type === DRAG_ASSETS || data.type === DRAG_FOLDER;
}

/**
 * Whether a drag may land on a folder (null = top level). Assets may go
 * anywhere they are not already; a folder never into itself, its own
 * subtree or the folder it is already in.
 */
export function canDropOn(drag: TAssetDrag, targetFolderId: number | null, folders: IAssetFolder[]): boolean {
  if (drag.type === DRAG_ASSETS) {
    return drag.folderIds.some((folderId) => folderId !== targetFolderId);
  }
  if (targetFolderId === drag.folderId || targetFolderId === drag.parentId) return false;
  return targetFolderId === null || !folderDescendantIds(folders, drag.folderId).has(targetFolderId);
}

/** The sentence of the status line: what a drop would do right now. */
export function describeDrop(state: IAssetDragState, folders: IAssetFolder[]): string {
  const { drag, targetFolderId } = state;
  if (!drag) return '';
  if (targetFolderId === null) return `Move ${drag.label} to the top level`;
  if (typeof targetFolderId === 'number') {
    const path = folderPathLabel(folders, targetFolderId);
    return `Move ${drag.label} into ${path || 'this folder'}`;
  }
  return `Moving ${drag.label}: drop it on a folder, or on All assets for the top level`;
}

/** The little pill that follows the pointer: the name of what is dragged. */
function renderDragPreview(container: HTMLElement, label: string): void {
  const preview = document.createElement('div');
  preview.className = styles.dragPreview;
  preview.textContent = label;
  container.appendChild(preview);
}

/**
 * Makes `rowRef` draggable by `handleRef`. `getData` runs when the drag starts,
 * so it sees the selection as it is then; return null to refuse the drag.
 */
export function useAssetDraggable(
  rowRef: RefObject<HTMLElement | null>,
  handleRef: RefObject<HTMLElement | null>,
  getData: () => TAssetDrag | null,
  enabled: boolean,
): void {
  const getDataRef = useRef(getData);
  useEffect(() => {
    getDataRef.current = getData;
  });

  useEffect(() => {
    const row = rowRef.current;
    const handle = handleRef.current;
    if (!enabled || !row || !handle) return undefined;

    return draggable({
      element: row,
      dragHandle: handle,
      canDrag: () => getDataRef.current() !== null,
      getInitialData: () => ({ ...(getDataRef.current() ?? {}) }),
      onGenerateDragPreview: ({ nativeSetDragImage, source }) => {
        const data = source.data;
        const label = isAssetDrag(data) ? data.label : '';
        setCustomNativeDragPreview({
          nativeSetDragImage,
          getOffset: pointerOutsideOfPreview({ x: '16px', y: '8px' }),
          render: ({ container }) => renderDragPreview(container, label),
        });
      },
    });
  }, [rowRef, handleRef, enabled]);
}

/**
 * Makes `ref` a drop target for a folder (null = top level). Returns whether
 * an acceptable drag is over it right now, to draw the drop highlight.
 */
export function useAssetDropTarget(
  ref: RefObject<HTMLElement | null>,
  folderId: number | null,
  folders: IAssetFolder[],
  enabled: boolean,
): boolean {
  const [isOver, setIsOver] = useState(false);
  const foldersRef = useRef(folders);
  useEffect(() => {
    foldersRef.current = folders;
  });

  useEffect(() => {
    const element = ref.current;
    if (!enabled || !element) return undefined;

    return dropTargetForElements({
      element,
      canDrop: ({ source }) => isAssetDrag(source.data) && canDropOn(source.data, folderId, foldersRef.current),
      getData: () => ({ type: DROP_FOLDER, folderId }),
      onDragEnter: () => setIsOver(true),
      onDragLeave: () => setIsOver(false),
      onDrop: () => setIsOver(false),
    });
  }, [ref, folderId, enabled]);

  return isOver;
}

/** The folder a drag is over: the innermost drop target under the pointer (undefined = none). */
function targetOf(dropTargets: { data: Record<string | symbol, unknown> }[]): number | null | undefined {
  const target = dropTargets.find((entry) => entry.data.type === DROP_FOLDER);
  if (!target) return undefined;
  return typeof target.data.folderId === 'number' ? target.data.folderId : null;
}

/**
 * Follows a drag: calls `onDrop` when it ends on a folder, and returns what is
 * dragged and where a drop would land, so rows can draw it. Also keeps the page
 * scrolling: near the top and bottom edge by itself, and with the mouse wheel
 * (the browser does not deliver the wheel during a native drag).
 */
export function useAssetDropMonitor(onDrop: (drop: IAssetDrop) => void, enabled: boolean): IAssetDragState {
  const [state, setState] = useState<IAssetDragState>(NO_DRAG);
  const onDropRef = useRef(onDrop);
  useEffect(() => {
    onDropRef.current = onDrop;
  });

  useEffect(() => {
    if (!enabled) return undefined;

    return combine(
      monitorForElements({
        canMonitor: ({ source }) => isAssetDrag(source.data),
        onDragStart: ({ source, location }) => {
          if (isAssetDrag(source.data)) setState({ drag: source.data, targetFolderId: targetOf(location.current.dropTargets) });
        },
        onDropTargetChange: ({ source, location }) => {
          if (isAssetDrag(source.data)) setState({ drag: source.data, targetFolderId: targetOf(location.current.dropTargets) });
        },
        onDrop: ({ source, location }) => {
          setState(NO_DRAG);
          const targetFolderId = targetOf(location.current.dropTargets);
          if (targetFolderId === undefined || !isAssetDrag(source.data)) return;
          onDropRef.current({ drag: source.data, targetFolderId });
        },
      }),
      autoScrollWindowForElements({
        canScroll: ({ source }) => isAssetDrag(source.data),
        getAllowedAxis: () => 'vertical',
        getConfiguration: () => ({ maxScrollSpeed: 'fast' }),
      }),
    );
  }, [enabled]);

  const dragging = state.drag !== null;
  useEffect(() => {
    if (!dragging) return undefined;
    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      window.scrollBy({ top: event.deltaY });
    };
    window.addEventListener('wheel', onWheel, { passive: false });
    return () => window.removeEventListener('wheel', onWheel);
  }, [dragging]);

  return state;
}
