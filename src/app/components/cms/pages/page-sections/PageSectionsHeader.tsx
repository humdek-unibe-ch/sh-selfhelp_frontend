'use client';

import { 
    Group, 
    ActionIcon, 
    TextInput, 
    Button, 
    Title, 
    Badge,
    Tooltip,
    Box
} from '@mantine/core';
import { 
    IconSearch, 
    IconChevronUp, 
    IconChevronDown, 
    IconX, 
    IconArrowLeft, 
    IconArrowRight,
    IconPlus
} from '@tabler/icons-react';
import { IPageSectionsState, IPageSectionsHandlers } from './PageSections';
import styles from './PageSections.module.css';

interface IPageSectionsHeaderProps {
    pageName?: string;
    state: IPageSectionsState;
    handlers: IPageSectionsHandlers;
}

export function PageSectionsHeader({
    pageName,
    state,
    handlers
}: IPageSectionsHeaderProps) {
    if (!pageName) {
        return null;
    }

    return (
        <Box p="md" style={{ borderBottom: '1px solid var(--mantine-color-gray-3)' }}>
            {/* Page Title and Section Count */}
            <Group gap="xs" align="center" wrap="nowrap" mb="md">
                <Title order={6} size="sm">
                    {pageName} - Sections
                </Title>
                <Badge size="xs" variant="light" color="blue">
                    {state.sectionsCount}
                </Badge>
                {state.isProcessing && (
                    <Badge size="xs" variant="light" color="orange">
                        Processing...
                    </Badge>
                )}
            </Group>

            {/* Page Controls */}
            <Group gap="xs" align="center" wrap="nowrap" justify="space-between">
                {/* Left side - Collapse/Expand Controls */}
                <Group gap={4}>
                    <Tooltip label="Expand All">
                        <ActionIcon 
                            size="sm" 
                            variant="subtle" 
                            color="blue"
                            onClick={handlers.onExpandAll}
                        >
                            <IconChevronDown size={12} />
                        </ActionIcon>
                    </Tooltip>
                    <Tooltip label="Collapse All">
                        <ActionIcon 
                            size="sm" 
                            variant="subtle" 
                            color="blue"
                            onClick={handlers.onCollapseAll}
                        >
                            <IconChevronUp size={12} />
                        </ActionIcon>
                    </Tooltip>
                </Group>

                {/* Center - Search */}
                <Group gap="xs" style={{ flex: 1, maxWidth: 300 }} wrap="nowrap">
                    <TextInput
                        placeholder="Search sections..."
                        value={state.searchQuery}
                        onChange={(e) => handlers.onSearchChange(e.currentTarget.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && state.searchResults.length > 0) {
                                e.preventDefault();
                                handlers.onSearchNext();
                            }
                            if (e.key === 'Escape') {
                                e.preventDefault();
                                handlers.onSearchClear();
                            }
                        }}
                        leftSection={<IconSearch size={14} />}
                        rightSection={
                            state.searchQuery && (
                                <ActionIcon 
                                    size="xs" 
                                    variant="subtle" 
                                    color="gray"
                                    onClick={handlers.onSearchClear}
                                >
                                    <IconX size={14} />
                                </ActionIcon>
                            )
                        }
                        size="sm"
                        style={{ flex: 1 }}
                    />
                    {state.searchResults.length > 0 && (
                        <>
                            <Badge size="xs" variant="light">
                                {state.currentSearchIndex + 1}/{state.searchResults.length}
                            </Badge>
                            <Group gap={2}>
                                <Tooltip label="Previous">
                                    <ActionIcon 
                                        size="sm" 
                                        variant="subtle" 
                                        onClick={handlers.onSearchPrevious}
                                        disabled={state.searchResults.length === 0}
                                    >
                                        <IconArrowLeft size={14} />
                                    </ActionIcon>
                                </Tooltip>
                                <Tooltip label="Next">
                                    <ActionIcon 
                                        size="sm" 
                                        variant="subtle" 
                                        onClick={handlers.onSearchNext}
                                        disabled={state.searchResults.length === 0}
                                    >
                                        <IconArrowRight size={14} />
                                    </ActionIcon>
                                </Tooltip>
                            </Group>
                        </>
                    )}
                </Group>

                {/* Right side - Add Section Button */}
                <Button 
                    leftSection={<IconPlus size={16} />} 
                    size="sm" 
                    variant="filled"
                    onClick={handlers.onAddSection}
                >
                    Add Section
                </Button>
            </Group>
        </Box>
    );
}
