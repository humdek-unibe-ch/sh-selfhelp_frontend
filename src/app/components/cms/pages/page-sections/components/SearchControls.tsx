'use client';

import { memo } from 'react';
import { Group, TextInput, ActionIcon, Badge, Tooltip } from '@mantine/core';
import { 
    IconSearch, 
    IconX, 
    IconArrowLeft, 
    IconArrowRight
} from '@tabler/icons-react';

interface ISearchControlsProps {
    searchQuery: string;
    searchResults: number[];
    currentSearchIndex: number;
    onSearchChange: (query: string) => void;
    onSearchNext: () => void;
    onSearchPrevious: () => void;
    onSearchClear: () => void;
}

export const SearchControls = memo<ISearchControlsProps>(
    function SearchControls({
        searchQuery,
        searchResults,
        currentSearchIndex,
        onSearchChange,
        onSearchNext,
        onSearchPrevious,
        onSearchClear
    }) {
        return (
            <Group gap="xs" style={{ flex: 1, maxWidth: 300 }} wrap="nowrap">
                <TextInput
                    placeholder="Search sections..."
                    value={searchQuery}
                    onChange={(e) => onSearchChange(e.currentTarget.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && searchResults.length > 0) {
                            e.preventDefault();
                            onSearchNext();
                        }
                        if (e.key === 'Escape') {
                            e.preventDefault();
                            onSearchClear();
                        }
                    }}
                    leftSection={<IconSearch size={14} />}
                    rightSection={
                        searchQuery && (
                            <ActionIcon 
                                size="xs" 
                                variant="subtle" 
                                color="gray"
                                onClick={onSearchClear}
                            >
                                <IconX size={14} />
                            </ActionIcon>
                        )
                    }
                    size="sm"
                    style={{ flex: 1 }}
                />
                {searchResults.length > 0 && (
                    <>
                        <Badge size="xs" variant="light">
                            {currentSearchIndex + 1}/{searchResults.length}
                        </Badge>
                        <Group gap={2}>
                            <Tooltip label="Previous">
                                <ActionIcon 
                                    size="sm" 
                                    variant="subtle" 
                                    onClick={onSearchPrevious}
                                    disabled={searchResults.length === 0}
                                >
                                    <IconArrowLeft size={14} />
                                </ActionIcon>
                            </Tooltip>
                            <Tooltip label="Next">
                                <ActionIcon 
                                    size="sm" 
                                    variant="subtle" 
                                    onClick={onSearchNext}
                                    disabled={searchResults.length === 0}
                                >
                                    <IconArrowRight size={14} />
                                </ActionIcon>
                            </Tooltip>
                        </Group>
                    </>
                )}
            </Group>
        );
    },
    // Custom comparison for search-specific props
    (prevProps, nextProps) => {
        return (
            prevProps.searchQuery === nextProps.searchQuery &&
            prevProps.currentSearchIndex === nextProps.currentSearchIndex &&
            prevProps.searchResults.length === nextProps.searchResults.length &&
            // Compare search results array contents
            prevProps.searchResults.every((id, index) => id === nextProps.searchResults[index])
        );
    }
);
