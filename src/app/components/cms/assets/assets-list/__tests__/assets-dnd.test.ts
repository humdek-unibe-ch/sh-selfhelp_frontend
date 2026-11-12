/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { describe, it, expect } from 'vitest';
import type { IAssetFolder } from '../../../../../../api/admin/asset.api';
import { assetDragData, canDropOn, describeDrop, folderDragData, NO_DRAG } from '../assets-dnd';

/**
 * What a drag may land on, and the sentence that tells the user what a drop
 * would do. Both are plain functions so the rules are checked without a browser.
 */
const folder = (id: number, name: string, parent_id: number | null): IAssetFolder => ({
  id,
  name,
  parent_id,
  asset_count: 0,
});

// docs (1) > guides (2) > drafts (3);  media (4) at the top level
const folders = [folder(1, 'docs', null), folder(2, 'guides', 1), folder(3, 'drafts', 2), folder(4, 'media', null)];

describe('canDropOn', () => {
  it('lets assets go to any folder but the one they are all in', () => {
    const drag = assetDragData([10], [2], 'a.png');
    expect(canDropOn(drag, 2, folders)).toBe(false);
    expect(canDropOn(drag, 1, folders)).toBe(true);
    expect(canDropOn(drag, null, folders)).toBe(true);
  });

  it('lets assets from different folders go anywhere, since some of them move', () => {
    const drag = assetDragData([10, 11], [2, 4], '2 assets');
    expect(canDropOn(drag, 2, folders)).toBe(true);
    expect(canDropOn(drag, 4, folders)).toBe(true);
  });

  it('keeps top-level assets from being dropped on the top level again', () => {
    expect(canDropOn(assetDragData([10], [null], 'a.png'), null, folders)).toBe(false);
  });

  it('never drops a folder into itself, its subfolders or the folder it is already in', () => {
    const drag = folderDragData(folders[1]);
    expect(canDropOn(drag, 2, folders)).toBe(false);
    expect(canDropOn(drag, 3, folders)).toBe(false);
    expect(canDropOn(drag, 1, folders)).toBe(false);
    expect(canDropOn(drag, 4, folders)).toBe(true);
    expect(canDropOn(drag, null, folders)).toBe(true);
  });

  it('keeps a top-level folder from being dropped on the top level again', () => {
    expect(canDropOn(folderDragData(folders[0]), null, folders)).toBe(false);
  });
});

describe('describeDrop', () => {
  const drag = assetDragData([10], [null], 'a.png');

  it('says nothing without a drag', () => {
    expect(describeDrop(NO_DRAG, folders)).toBe('');
  });

  it('tells where to drop while the pointer is over nothing that takes the drag', () => {
    expect(describeDrop({ drag, targetFolderId: undefined }, folders)).toMatch(/drop it on a folder/);
  });

  it('names the top level and the folder with its path', () => {
    expect(describeDrop({ drag, targetFolderId: null }, folders)).toBe('Move a.png to the top level');
    expect(describeDrop({ drag, targetFolderId: 3 }, folders)).toBe('Move a.png into docs / guides / drafts');
  });
});
