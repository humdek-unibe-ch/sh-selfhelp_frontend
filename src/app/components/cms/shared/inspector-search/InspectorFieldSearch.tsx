/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
'use client';

import {
    ActionIcon,
    Box,
    Group,
    Text,
    TextInput,
    Button,
} from '@mantine/core';
import { IconSearch, IconX } from '@tabler/icons-react';
import type { RefObject } from 'react';

export interface IInspectorFieldSearchProps {
    query: string;
    onQueryChange: (value: string) => void;
    onClear: () => void;
    onInputKeyDown: (event: React.KeyboardEvent<HTMLInputElement>) => void;
    inputRef: RefObject<HTMLInputElement | null>;
    /** Number of matching fields while a query is active; omit when idle. */
    matchCount?: number;
    /** Total searchable fields; used only for the count label. */
    totalCount?: number;
    emptyQuery?: string;
}

/**
 * Sticky search bar shared by the page and section inspectors.
 */
export function InspectorFieldSearch({
    query,
    onQueryChange,
    onClear,
    onInputKeyDown,
    inputRef,
    matchCount,
    totalCount,
    emptyQuery,
}: IInspectorFieldSearchProps) {
    const trimmed = query.trim();
    const isActive = trimmed.length > 0;
    const hasNoMatches = isActive && (matchCount ?? 0) === 0;

    return (
        <Box
            style={{
                position: 'sticky',
                top: 0,
                zIndex: 2,
                background: 'var(--mantine-color-body)',
                paddingBottom: 4,
            }}
        >
            <TextInput
                ref={inputRef}
                aria-label="Search fields"
                placeholder="Search fields…"
                value={query}
                onChange={(event) => onQueryChange(event.currentTarget.value)}
                onKeyDown={onInputKeyDown}
                leftSection={<IconSearch size={14} />}
                rightSection={
                    query ? (
                        <ActionIcon
                            size="sm"
                            variant="subtle"
                            color="gray"
                            onClick={onClear}
                            aria-label="Clear search"
                        >
                            <IconX size={12} />
                        </ActionIcon>
                    ) : undefined
                }
                size="sm"
            />
            {isActive ? (
                <Group justify="space-between" mt={6} gap="xs" wrap="nowrap">
                    <Text
                        size="xs"
                        c="dimmed"
                        aria-live="polite"
                    >
                        {hasNoMatches
                            ? `No field matches '${emptyQuery ?? trimmed}'`
                            : `${matchCount ?? 0} field${(matchCount ?? 0) === 1 ? '' : 's'}${
                                  typeof totalCount === 'number' ? ` of ${totalCount}` : ''
                              }`}
                    </Text>
                    {hasNoMatches ? (
                        <Button size="compact-xs" variant="subtle" onClick={onClear}>
                            Clear
                        </Button>
                    ) : null}
                </Group>
            ) : null}
        </Box>
    );
}
