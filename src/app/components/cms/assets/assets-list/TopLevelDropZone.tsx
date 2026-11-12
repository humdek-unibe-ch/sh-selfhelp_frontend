/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
"use client";

import { useEffect, useRef, useState, type RefObject } from 'react';
import { createPortal } from 'react-dom';
import { Text } from '@mantine/core';
import { IconArrowBarToUp, IconHome } from '@tabler/icons-react';
import { canDropOn, describeDrop, useAssetDropTarget } from './assets-dnd';
import { useAssetTree } from './assets-tree.context';
import styles from './assets-tree.module.css';

/** Whether `element` is (at least partly) inside the viewport; true where IntersectionObserver is missing. */
function useIsInView(ref: RefObject<HTMLElement | null>): boolean {
  const [inView, setInView] = useState(true);

  useEffect(() => {
    const element = ref.current;
    if (!element || typeof IntersectionObserver === 'undefined') return undefined;
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting));
    observer.observe(element);
    return () => observer.disconnect();
  }, [ref]);

  return inView;
}

/**
 * A top-level target that floats at the side of the screen while a drag is on
 * and the "All assets" strip has scrolled out of view, so the top level is
 * never far away however long the list is. It sits in the middle of the
 * screen height, away from the edges where the page scrolls by itself.
 */
function TopLevelDock() {
  const tree = useAssetTree();
  const ref = useRef<HTMLDivElement | null>(null);
  const isOver = useAssetDropTarget(ref, null, tree.folders, tree.dragEnabled);

  return createPortal(
    <div ref={ref} className={`${styles.dock} ${isOver ? styles.dockTarget : ''}`} data-drop-target={isOver || undefined}>
      <IconArrowBarToUp size={28} aria-hidden />
      <Text size="sm" fw={700} c="inherit">Top level</Text>
      <Text size="xs" c="inherit" style={{ opacity: 0.85 }}>Drop here to take it out of its folder</Text>
    </div>,
    document.body,
  );
}

/**
 * The "All assets" strip above the tree: the drop target for the top level.
 * While a drag is on it grows into a clear drop area and turns solid blue
 * under the pointer. Moving to the top level from a menu works too ("Move
 * to..." and "Move to folder" offer "No folder").
 */
export function TopLevelDropZone() {
  const tree = useAssetTree();
  const ref = useRef<HTMLDivElement | null>(null);
  const isOver = useAssetDropTarget(ref, null, tree.folders, tree.dragEnabled);
  const stripInView = useIsInView(ref);

  const { drag } = tree.dragState;
  const droppable = drag !== null && canDropOn(drag, null, tree.folders);
  const classes = [styles.rootZone];
  if (droppable) classes.push(styles.rootZoneActive);
  if (droppable && isOver) classes.push(styles.rootZoneTarget);
  if (drag && !droppable) classes.push(styles.rootZoneBlocked);

  return (
    <>
      <div ref={ref} className={classes.join(' ')} data-drop-target={isOver || undefined}>
        <IconHome size={droppable ? 20 : 14} aria-hidden />
        <Text size={droppable ? 'md' : 'sm'} fw={droppable ? 700 : 500} c="inherit">All assets</Text>
        {tree.dragEnabled && (
          <Text size={droppable ? 'sm' : 'xs'} c={droppable ? 'inherit' : 'dimmed'}>
            {droppable ? 'Drop here to move to the top level' : drag ? 'Already at the top level' : 'Drop here to move to the top level'}
          </Text>
        )}
      </div>
      {droppable && !stripInView && <TopLevelDock />}
    </>
  );
}

/** The line at the bottom of the screen that says what a drop would do right now. */
export function DragStatusBar() {
  const tree = useAssetTree();
  const { drag, targetFolderId } = tree.dragState;
  if (!drag) return null;

  return createPortal(
    <div
      role="status"
      aria-live="polite"
      className={`${styles.status} ${targetFolderId !== undefined ? styles.statusReady : ''}`}
    >
      {describeDrop(tree.dragState, tree.folders)}
    </div>,
    document.body,
  );
}
