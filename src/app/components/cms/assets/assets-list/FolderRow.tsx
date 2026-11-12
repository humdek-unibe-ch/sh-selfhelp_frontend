/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
"use client";

import { useRef } from 'react';
import { Table, Text, ActionIcon, Group, Tooltip, Menu, Badge } from '@mantine/core';
import {
  IconArrowDown,
  IconChevronRight,
  IconDots,
  IconFolder,
  IconFolderOpen,
  IconFolderPlus,
  IconFolderShare,
  IconGripVertical,
  IconPencil,
  IconShieldLock,
  IconTrash,
  IconUpload,
} from '@tabler/icons-react';
import type { IAssetFolder } from '../../../../../api/admin/asset.api';
import { adminTableClasses as tableStyles } from '../../shared/admin-table';
import { folderSummary } from '../assets.utils';
import { TREE_INDENT } from './AssetRow';
import { FolderNameField } from './FolderNameField';
import { folderDragData, useAssetDraggable, useAssetDropTarget } from './assets-dnd';
import { dropRowClass, folderCue, isBeingDragged, useAssetTree } from './assets-tree.context';
import dndStyles from './assets-tree.module.css';

/** Why a folder cannot be deleted yet (the server refuses a folder that is not empty). */
const NOT_EMPTY_HINT = 'Move or delete its content first';

interface IFolderRowProps {
  folder: IAssetFolder;
  depth: number;
}

/**
 * One folder in the tree: a chevron to open and close it, its name (renamed in
 * place from the menu) and what it holds, and a menu with every folder action.
 * A click anywhere on the row opens or closes the folder.
 */
export function FolderRow({ folder, depth }: IFolderRowProps) {
  const tree = useAssetTree();
  const { permissions } = tree;
  const rowRef = useRef<HTMLTableRowElement | null>(null);
  const handleRef = useRef<HTMLDivElement | null>(null);

  const open = tree.expanded.has(folder.id);
  const renaming = tree.renamingId === folder.id;
  const hasSubfolders = tree.folders.some((other) => other.parent_id === folder.id);
  const hasContent = hasSubfolders || (folder.subtree_asset_count ?? folder.asset_count) > 0;

  // A folder being renamed is not draggable: dragging inside its text field must select text.
  useAssetDraggable(rowRef, handleRef, () => folderDragData(folder), tree.dragEnabled && !renaming);
  useAssetDropTarget(rowRef, folder.id, tree.folders, tree.dragEnabled);
  const cue = folderCue(tree, folder.id);

  const hasMenu = permissions.canUpdate || permissions.canCreate || permissions.canDelete;

  return (
    <Table.Tr
      ref={rowRef}
      onClick={() => tree.toggleExpanded(folder.id)}
      className={dropRowClass(cue, isBeingDragged(tree, 'folder', folder.id))}
      data-drop-target={cue === 'target' || undefined}
      style={{ cursor: 'pointer' }}
    >
      <Table.Td className={tableStyles.tableCell} />
      <Table.Td className={tableStyles.tableCell}>
        <Group gap="xs" wrap="nowrap" style={{ paddingLeft: depth * TREE_INDENT }}>
          <ActionIcon
            variant="subtle"
            color="gray"
            size="sm"
            aria-label={`Toggle folder ${folder.name}`}
            aria-expanded={open}
            onClick={(e) => {
              e.stopPropagation();
              tree.toggleExpanded(folder.id);
            }}
          >
            <IconChevronRight
              size={16}
              style={{ transform: open ? 'rotate(90deg)' : undefined, transition: 'transform 120ms ease' }}
            />
          </ActionIcon>
          {/* The whole name block is the grab area, not only the grip. */}
          <Group
            ref={handleRef}
            gap="xs"
            wrap="nowrap"
            className={tree.dragEnabled && !renaming ? dndStyles.grab : undefined}
            style={{ minWidth: 0, flex: 1 }}
          >
          {tree.dragEnabled ? (
            <span aria-hidden style={{ display: 'flex', color: 'var(--mantine-color-dimmed)' }}>
              <IconGripVertical size={16} />
            </span>
          ) : null}
          {open
            ? <IconFolderOpen size={22} color="var(--mantine-color-yellow-6)" aria-hidden />
            : <IconFolder size={22} color="var(--mantine-color-yellow-6)" aria-hidden />}
          <div style={{ minWidth: 0 }}>
            {renaming ? (
              <FolderNameField
                label={`Name of folder ${folder.name}`}
                initialValue={folder.name}
                onSubmit={(name) => tree.onRename(folder, name)}
                onCancel={tree.onCancelRename}
              />
            ) : (
              <Text size="sm" fw={600}>{folder.name}</Text>
            )}
            <Text size="xs" c="dimmed">{folderSummary(tree.folders, folder)}</Text>
          </div>
          </Group>
          {cue === 'target' && (
            <Badge className={dndStyles.dropHint} size="lg" leftSection={<IconArrowDown size={14} />}>
              Drop to move here
            </Badge>
          )}
        </Group>
      </Table.Td>
      <Table.Td className={tableStyles.tableCell}>
        <Text size="sm" c="dimmed">Folder</Text>
      </Table.Td>
      <Table.Td className={tableStyles.tableCell} />
      <Table.Td className={tableStyles.tableCell} onClick={(e) => e.stopPropagation()}>
        {hasMenu && (
          <Group gap={2} wrap="nowrap" className={tableStyles.actionsCell}>
            <Menu position="bottom-end" withinPortal>
              <Menu.Target>
                <ActionIcon variant="subtle" color="gray" aria-label={`Actions for folder ${folder.name}`}>
                  <IconDots size={16} />
                </ActionIcon>
              </Menu.Target>
              <Menu.Dropdown>
                {permissions.canUpdate && (
                  <Menu.Item leftSection={<IconPencil size={14} />} onClick={() => tree.onStartRename(folder)}>
                    Rename
                  </Menu.Item>
                )}
                {permissions.canCreate && (
                  <Menu.Item leftSection={<IconFolderPlus size={14} />} onClick={() => tree.onNewSubfolder(folder)}>
                    New subfolder
                  </Menu.Item>
                )}
                {permissions.canCreate && (
                  <Menu.Item leftSection={<IconUpload size={14} />} onClick={() => tree.onUploadHere(folder)}>
                    Upload here
                  </Menu.Item>
                )}
                {permissions.canUpdate && (
                  <Menu.Item leftSection={<IconFolderShare size={14} />} onClick={() => tree.onMoveFolder(folder)}>
                    Move to...
                  </Menu.Item>
                )}
                {permissions.canUpdate && (
                  <Menu.Item leftSection={<IconShieldLock size={14} />} onClick={() => tree.onSetAccess(folder)}>
                    Set access...
                  </Menu.Item>
                )}
                {permissions.canDelete && (
                  <>
                    <Menu.Divider />
                    <Tooltip label={NOT_EMPTY_HINT} position="left" disabled={!hasContent}>
                      <div>
                        <Menu.Item
                          color="red"
                          leftSection={<IconTrash size={14} />}
                          disabled={hasContent}
                          onClick={() => tree.onDeleteFolder(folder)}
                        >
                          Delete
                        </Menu.Item>
                      </div>
                    </Tooltip>
                  </>
                )}
              </Menu.Dropdown>
            </Menu>
          </Group>
        )}
      </Table.Td>
    </Table.Tr>
  );
}
