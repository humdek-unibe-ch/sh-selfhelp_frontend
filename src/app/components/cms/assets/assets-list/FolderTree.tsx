/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
"use client";

import { useRef, useState, type ReactNode } from 'react';
import { Table, Text, Button, Loader, Group } from '@mantine/core';
import type { IAssetFolder } from '../../../../../api/admin/asset.api';
import { useAssets } from '../../../../../hooks/useAssets';
import { adminTableClasses as tableStyles } from '../../shared/admin-table';
import { childFolders } from '../assets.utils';
import { AssetRow, CHEVRON_WIDTH, TREE_INDENT } from './AssetRow';
import { FolderRow } from './FolderRow';
import { NewFolderRow } from './FolderNameField';
import { useAssetDropTarget } from './assets-dnd';
import { contentIsInside, dropRowClass, useAssetTree } from './assets-tree.context';

/** Assets requested per page of a folder; "Show more" asks for the next page. */
export const FOLDER_PAGE_SIZE = 50;

/** A full-width row with a message, indented like the assets of a folder at `depth`. */
function NoteRow({ depth, folderId, children }: { depth: number; folderId: number; children: ReactNode }) {
  const tree = useAssetTree();
  const rowRef = useRef<HTMLTableRowElement | null>(null);
  // A message row of an open folder takes a drop into that folder too, so an empty folder is a target.
  useAssetDropTarget(rowRef, folderId, tree.folders, tree.dragEnabled);

  return (
    <Table.Tr ref={rowRef} className={dropRowClass(contentIsInside(tree, folderId) ? 'content-inside' : null, false)}>
      <Table.Td className={tableStyles.tableCell} colSpan={5}>
        <div style={{ paddingLeft: depth * TREE_INDENT + CHEVRON_WIDTH }}>{children}</div>
      </Table.Td>
    </Table.Tr>
  );
}

interface IFolderAssetPageProps {
  folderId: number;
  page: number;
  /** Pages of this folder the user asked to see; a page past it shows a "Show more" row instead. */
  pagesShown: number;
  onShowMore: () => void;
  depth: number;
  /** Whether to say that the folder is empty when its first page has no assets. */
  mayBeEmpty: boolean;
}

/**
 * One page of a folder's assets. It loads when it first renders, i.e. when
 * the folder is first opened (or "Show more" is clicked); opening it again
 * reads the cache. The next page is rendered by this one, so the hooks of
 * every page stay in a component of their own.
 */
function FolderAssetPage({ folderId, page, pagesShown, onShowMore, depth, mayBeEmpty }: IFolderAssetPageProps) {
  const { data, isLoading, error } = useAssets({ page, pageSize: FOLDER_PAGE_SIZE, folder_id: folderId });

  if (error) {
    return <NoteRow depth={depth} folderId={folderId}><Text size="sm" c="red">Could not load this folder: {error.message}</Text></NoteRow>;
  }
  if (isLoading || !data) {
    return (
      <NoteRow depth={depth} folderId={folderId}>
        <Group gap="xs"><Loader size="xs" /><Text size="sm" c="dimmed">Loading assets...</Text></Group>
      </NoteRow>
    );
  }

  const { assets, pagination } = data;
  const remaining = pagination.total - ((page - 1) * FOLDER_PAGE_SIZE + assets.length);

  return (
    <>
      {assets.map((asset) => <AssetRow key={asset.id} asset={asset} depth={depth} />)}
      {page === 1 && assets.length === 0 && mayBeEmpty && (
        <NoteRow depth={depth} folderId={folderId}><Text size="sm" c="dimmed">This folder is empty</Text></NoteRow>
      )}
      {remaining > 0 && (pagination.totalPages > page && pagesShown > page ? (
        <FolderAssetPage
          folderId={folderId}
          page={page + 1}
          pagesShown={pagesShown}
          onShowMore={onShowMore}
          depth={depth}
          mayBeEmpty={false}
        />
      ) : (
        <NoteRow depth={depth} folderId={folderId}>
          <Button variant="subtle" size="xs" onClick={onShowMore}>
            Show more ({remaining} more)
          </Button>
        </NoteRow>
      ))}
    </>
  );
}

/** What is inside an open folder: its new-folder field, subfolders (each a tree of its own), then its assets. */
function FolderChildren({ folderId, depth }: { folderId: number; depth: number }) {
  const tree = useAssetTree();
  const [pagesShown, setPagesShown] = useState(1);
  const subfolders = childFolders(tree.folders, folderId);
  const naming = tree.creatingIn === folderId;

  return (
    <>
      {naming && <NewFolderRow parentId={folderId} depth={depth} />}
      {subfolders.map((subfolder) => <FolderNode key={subfolder.id} folder={subfolder} depth={depth} />)}
      <FolderAssetPage
        folderId={folderId}
        page={1}
        pagesShown={pagesShown}
        onShowMore={() => setPagesShown((shown) => shown + 1)}
        depth={depth}
        mayBeEmpty={subfolders.length === 0 && !naming}
      />
    </>
  );
}

/** A folder row, and below it (when it is open) everything inside the folder. */
export function FolderNode({ folder, depth }: { folder: IAssetFolder; depth: number }) {
  const tree = useAssetTree();

  return (
    <>
      <FolderRow folder={folder} depth={depth} />
      {tree.expanded.has(folder.id) && <FolderChildren folderId={folder.id} depth={depth + 1} />}
    </>
  );
}
