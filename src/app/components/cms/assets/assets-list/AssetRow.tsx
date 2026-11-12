/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
"use client";

import { useRef } from 'react';
import { Table, Text, ActionIcon, Group, Tooltip, Badge, Checkbox, Anchor } from '@mantine/core';
import { IconTrash, IconDownload, IconEye, IconPencil, IconFolder, IconGripVertical } from '@tabler/icons-react';
import type { IAsset } from '../../../../../api/admin/asset.api';
import { getAssetUrl } from '../../../../../utils/asset-url.utils';
import { adminTableClasses as tableStyles } from '../../shared/admin-table';
import { assetLabel, getAssetTypeInfo, isImageAsset } from '../assets.utils';
import { AssetThumbnail } from './AssetThumbnail';
import { assetDragData, useAssetDraggable, useAssetDropTarget } from './assets-dnd';
import { contentIsInside, dropRowClass, isBeingDragged, useAssetTree } from './assets-tree.context';
import dndStyles from './assets-tree.module.css';

/** Horizontal step of one folder level, and the width of a folder's chevron. */
export const TREE_INDENT = 24;
export const CHEVRON_WIDTH = 28;

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

interface IAssetRowProps {
  asset: IAsset;
  /** How many folders deep the row is (0 = top level); null in flat search results. */
  depth: number | null;
  /** In search results: the folder the asset lives in, as a link that shows it in the tree. */
  folderLink?: { label: string; onShow: () => void };
}

/** One asset in the tree or in the search results. */
export function AssetRow({ asset, depth, folderLink }: IAssetRowProps) {
  const tree = useAssetTree();
  const { permissions } = tree;
  const rowRef = useRef<HTMLTableRowElement | null>(null);
  const handleRef = useRef<HTMLDivElement | null>(null);

  const canDrag = tree.dragEnabled && asset.can_update;
  useAssetDraggable(rowRef, handleRef, () => {
    // Dragging a selected row drags the whole selection; any other row drags itself.
    const selection = tree.selectedRef.current;
    const dragged = selection.has(asset.id) ? Array.from(selection.values()) : [asset];
    if (!dragged.every((item) => item.can_update)) return null;
    const label = dragged.length === 1 ? assetLabel(dragged[0]) : `${dragged.length} assets`;
    return assetDragData(dragged.map((item) => item.id), dragged.map((item) => item.folder_id), label);
  }, canDrag);

  // Dropping on an asset drops into the folder it lives in (the top level for a top-level asset),
  // so the whole open folder is a target, not only its row. Flat search results have no folders.
  useAssetDropTarget(rowRef, asset.folder_id, tree.folders, tree.dragEnabled && depth !== null);
  const inside = contentIsInside(tree, asset.folder_id) && depth !== null;

  // `url` is the access-checked delivery route, the only fetchable source.
  const deliveryUrl = getAssetUrl(asset.url);
  const typeInfo = getAssetTypeInfo(asset);
  const label = assetLabel(asset);

  return (
    <Table.Tr
      ref={rowRef}
      className={`${tree.onAssetSelect ? 'cursor-pointer' : 'cursor-default'} ${dropRowClass(inside ? 'content-inside' : null, isBeingDragged(tree, 'asset', asset.id))}`}
      onClick={() => tree.onAssetSelect?.(asset)}
    >
      <Table.Td className={tableStyles.tableCell} onClick={(e) => e.stopPropagation()}>
        <Checkbox
          aria-label={`Select ${label}`}
          checked={tree.selected.has(asset.id)}
          onChange={() => tree.toggleSelected(asset)}
        />
      </Table.Td>
      <Table.Td className={tableStyles.tableCell}>
        <Group gap="sm" wrap="nowrap" style={{ paddingLeft: depth === null ? 0 : depth * TREE_INDENT + CHEVRON_WIDTH }}>
          {/* The whole name block is the grab area, not only the grip. */}
          <Group ref={handleRef} gap="sm" wrap="nowrap" className={canDrag ? dndStyles.grab : undefined} style={{ minWidth: 0, flex: 1 }}>
          {canDrag ? (
            <span aria-hidden style={{ display: 'flex', color: 'var(--mantine-color-dimmed)' }}>
              <IconGripVertical size={16} />
            </span>
          ) : null}
          {isImageAsset(asset) && <AssetThumbnail src={deliveryUrl} alt={asset.alt || label} canView={asset.can_view} />}
          <div style={{ minWidth: 0 }}>
            <Text size="sm" fw={500} truncate>{label}</Text>
            {label !== asset.uuid && (
              <Text size="xs" c="dimmed" ff="monospace" truncate>{asset.uuid}</Text>
            )}
            {asset.alt && (
              <Text size="xs" c="dimmed" truncate>Alt: {asset.alt}</Text>
            )}
            {folderLink && (
              <Anchor
                component="button"
                type="button"
                size="xs"
                onClick={(e) => {
                  e.stopPropagation();
                  folderLink.onShow();
                }}
              >
                <Group gap={4} wrap="nowrap">
                  <IconFolder size={12} aria-hidden />
                  {folderLink.label}
                </Group>
              </Anchor>
            )}
          </div>
          </Group>
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
          {/* A manager who is in none of the asset's groups may not open the file:
              the delivery URL would answer 403, so the links are not offered. */}
          {asset.can_view && (
            <>
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
              {/* `download` without a value: the server names the file (`<name>-<id>.<ext>`),
                  the tooltip shows that name. */}
              <Tooltip label={asset.file_name ?? 'Download'}>
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
            </>
          )}
          {permissions.canUpdate && asset.can_update && (
            <Tooltip label="Edit">
              <ActionIcon
                variant="subtle"
                color="gray"
                aria-label={`Edit ${label}`}
                onClick={(e) => {
                  e.stopPropagation();
                  tree.onEditAsset(asset);
                }}
              >
                <IconPencil size={16} />
              </ActionIcon>
            </Tooltip>
          )}
          {permissions.canDelete && asset.can_delete && (
            <Tooltip label="Delete">
              <ActionIcon
                variant="subtle"
                color="red"
                aria-label={`Delete ${label}`}
                onClick={(e) => {
                  e.stopPropagation();
                  tree.onDeleteAsset(asset);
                }}
                loading={tree.deletingAssetId === asset.id}
              >
                <IconTrash size={16} />
              </ActionIcon>
            </Tooltip>
          )}
        </Group>
      </Table.Td>
    </Table.Tr>
  );
}
