/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
"use client";

import { useState } from 'react';
import { Combobox, InputBase, ScrollArea, Text, useCombobox } from '@mantine/core';
import type { IAssetFolder } from '../../../../../api/admin/asset.api';
import { folderOptions, formatFolderPath, parseFolderPath, resolveFolderPath } from '../assets.utils';

interface IFolderPathComboboxProps {
  folders: IAssetFolder[];
  /** The chosen folder as a path (`Courses / Week 1`); empty = the top level. It may name folders that do not exist yet. */
  value: string;
  onChange: (path: string) => void;
  disabled?: boolean;
}

/** How many folder paths the list shows at once; typing narrows it. */
const MAX_OPTIONS = 50;

const TOP_LEVEL_VALUE = '__top__';
const CREATE_VALUE = '__create__';

/**
 * Picks the folder an upload goes to: a searchable list of full folder paths
 * that also takes a path that does not exist yet (`Create "Courses / Week 2"`).
 * Choosing Create only remembers the path; the folders are made when the upload
 * starts, so closing the form leaves nothing behind.
 */
export function FolderPathCombobox({ folders, value, onChange, disabled }: IFolderPathComboboxProps) {
  const combobox = useCombobox();
  // The text being typed; null while not typing, when the field shows the chosen path.
  const [typed, setTyped] = useState<string | null>(null);

  const paths = folderOptions(folders).map((option) => option.label);
  const query = formatFolderPath(parseFolderPath(typed ?? ''));
  const matches = paths.filter((path) => path.toLowerCase().includes(query.toLowerCase())).slice(0, MAX_OPTIONS);
  const exists = paths.some((path) => path.toLowerCase() === query.toLowerCase());
  const canCreate = query !== '' && !exists;
  const { missing } = resolveFolderPath(folders, parseFolderPath(value));

  const choose = (path: string) => {
    onChange(path);
    setTyped(null);
    combobox.closeDropdown();
  };

  return (
    <div>
      <Combobox
        store={combobox}
        onOptionSubmit={(option) => {
          if (option === TOP_LEVEL_VALUE) choose('');
          else if (option === CREATE_VALUE) choose(query);
          else choose(option);
        }}
      >
        <Combobox.Target>
          <InputBase
            label="Folder"
            description="Only for organising your assets; it does not change who can see them. Type a new path to create it."
            placeholder="Top level"
            role="combobox"
            aria-autocomplete="list"
            value={typed ?? value}
            disabled={disabled}
            onChange={(event) => {
              setTyped(event.currentTarget.value);
              combobox.openDropdown();
              combobox.updateSelectedOptionIndex();
            }}
            onClick={() => combobox.openDropdown()}
            onFocus={() => combobox.openDropdown()}
            onBlur={() => {
              combobox.closeDropdown();
              setTyped(null);
            }}
            rightSection={<Combobox.Chevron />}
            rightSectionPointerEvents="none"
          />
        </Combobox.Target>

        <Combobox.Dropdown>
          <Combobox.Options>
            <ScrollArea.Autosize mah={220} type="scroll">
              {query === '' && <Combobox.Option value={TOP_LEVEL_VALUE}>Top level (no folder)</Combobox.Option>}
              {matches.map((path) => (
                <Combobox.Option key={path} value={path}>{path}</Combobox.Option>
              ))}
              {canCreate && <Combobox.Option value={CREATE_VALUE}>{`Create "${query}"`}</Combobox.Option>}
              {query !== '' && matches.length === 0 && !canCreate && <Combobox.Empty>No folder found</Combobox.Empty>}
            </ScrollArea.Autosize>
          </Combobox.Options>
        </Combobox.Dropdown>
      </Combobox>
      {missing.length > 0 && (
        <Text size="xs" c="dimmed" mt={4}>
          Created when you upload: {missing.join(' / ')}
        </Text>
      )}
    </div>
  );
}
