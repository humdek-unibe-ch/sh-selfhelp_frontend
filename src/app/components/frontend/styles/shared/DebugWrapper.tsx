import React, { useState, useEffect, useRef } from 'react';
import { Indicator, Popover, Text, ScrollArea, Badge, Group, Box, useMantineColorScheme, ActionIcon, TextInput, Stack } from '@mantine/core';
import { IconBug, IconSearch, IconX, IconChevronsDown, IconChevronsUp } from '@tabler/icons-react';
import { JsonEditor, githubLightTheme, githubDarkTheme } from 'json-edit-react';
import type { TStyle } from '../../../../../types/common/styles.types';
import styles from './DebugWrapper.module.css';

/**
 * Props interface for DebugWrapper component
 */
interface IDebugWrapperProps {
    children: React.ReactNode;
    style: TStyle;
}

/**
 * DebugWrapper component that wraps elements with debug indicators and JSON inspection
 * Uses Mantine's Indicator for clean corner positioning and minimal border styling
 * Opens on hover, stays open until clicked outside
 */
const DebugWrapper: React.FC<IDebugWrapperProps> = ({ children, style }) => {
    const { colorScheme } = useMantineColorScheme();
    const [opened, setOpened] = useState(false);
    const [searchText, setSearchText] = useState('');
    const [isExpanded, setIsExpanded] = useState(false);
    const jsonEditorRef = useRef<HTMLDivElement>(null);

    // Check if debug is enabled (debug field is truthy)
    const isDebugEnabled = style.debug && style.debug > 0;

    // Function to highlight search text in DOM elements
    const highlightSearchText = (element: HTMLElement, searchText: string) => {
        if (!searchText.trim()) return;

        // Remove existing highlights
        const existingHighlights = element.querySelectorAll('.searchHighlight');
        existingHighlights.forEach(highlight => {
            const parent = highlight.parentNode;
            if (parent) {
                parent.replaceChild(document.createTextNode(highlight.textContent || ''), highlight);
            }
        });

        // Function to recursively traverse and highlight text nodes
        const traverseAndHighlight = (node: Node) => {
            if (node.nodeType === Node.TEXT_NODE) {
                const text = node.textContent || '';
                const regex = new RegExp(`(${searchText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
                const matches = text.match(regex);

                if (matches) {
                    const parts = text.split(regex);
                    const fragment = document.createDocumentFragment();

                    parts.forEach((part, index) => {
                        if (part) {
                            if (index % 2 === 1) { // This is a match (odd indices after split)
                                const highlightSpan = document.createElement('span');
                                highlightSpan.className = styles.searchHighlight;
                                highlightSpan.textContent = part;
                                fragment.appendChild(highlightSpan);
                            } else {
                                fragment.appendChild(document.createTextNode(part));
                            }
                        }
                    });

                    node.parentNode?.replaceChild(fragment, node);
                }
            } else if (node.nodeType === Node.ELEMENT_NODE) {
                // Skip highlighting in certain elements
                const element = node as Element;
                if (element.tagName !== 'SCRIPT' && element.tagName !== 'STYLE' && !element.classList.contains('searchHighlight')) {
                    Array.from(node.childNodes).forEach(traverseAndHighlight);
                }
            }
        };

        traverseAndHighlight(element);
    };

    // Apply highlighting when search text changes
    useEffect(() => {
        if (jsonEditorRef.current && searchText.trim()) {
            // Use setTimeout to ensure JsonEditor has rendered
            const timer = setTimeout(() => {
                highlightSearchText(jsonEditorRef.current!, searchText);
            }, 200);
            return () => clearTimeout(timer);
        }
    }, [searchText, isExpanded]); // Also re-run when expand/collapse changes

    // If debug is not enabled, just return children
    if (!isDebugEnabled) {
        return <>{children}</>;
    }

    return (
        <Indicator
            size={16}
            offset={2}
            position="top-end"
            color='transparent'
            m="xs"
            label={
                <Popover
                    opened={opened}
                    onChange={setOpened}
                    withArrow
                    shadow="md"
                    closeOnClickOutside={true}
                    closeOnEscape={true}
                    width={500}
                >
                    <Popover.Target>
                        <ActionIcon
                            variant='filled'
                            size='xs'
                            color='orange'
                            onMouseEnter={() => setOpened(true)}
                            style={{ cursor: 'pointer' }}
                        >
                            <IconBug size={10} />
                        </ActionIcon>
                    </Popover.Target>

                    <Popover.Dropdown>
                        <Stack gap="md">
                            <Group justify="space-between">
                                <Text size="sm" fw={600} c="orange">
                                    Style Debug Info
                                </Text>
                                <Badge size="sm" variant="light" color="orange">
                                    ID: {style.id}
                                </Badge>
                            </Group>

                            <Group>
                                <Badge size="sm" color="orange">
                                    {style.style_name}
                                </Badge>
                                {style.section_name && (
                                    <Badge size="sm" variant="outline" color="orange">
                                        {style.section_name}
                                    </Badge>
                                )}
                            </Group>

                            <Group justify="space-between" align="center">
                                <TextInput
                                    placeholder="Search properties..."
                                    leftSection={<IconSearch size={16} />}
                                    rightSection={
                                        searchText ? (
                                            <ActionIcon
                                                variant="transparent"
                                                size="sm"
                                                color="orange"
                                                onClick={() => setSearchText('')}
                                                style={{ cursor: 'pointer' }}
                                            >
                                                <IconX size={14} />
                                            </ActionIcon>
                                        ) : null
                                    }
                                    classNames={{
                                        input: styles.searchInput,
                                    }}
                                    value={searchText}
                                    onChange={(event) => setSearchText(event.currentTarget.value)}
                                    size="sm"
                                    style={{ flex: 1 }}
                                />

                                <ActionIcon
                                    variant="light"
                                    size="sm"
                                    color="orange"
                                    onClick={() => setIsExpanded(!isExpanded)}
                                    title={isExpanded ? 'Collapse all' : 'Expand all'}
                                    style={{ cursor: 'pointer' }}
                                >
                                    {isExpanded ? <IconChevronsUp size={16} /> : <IconChevronsDown size={16} />}
                                </ActionIcon>
                            </Group>

                            <ScrollArea h={400} type="auto">
                                <Box
                                    ref={jsonEditorRef}
                                    p="xs"
                                    style={{ fontSize: '12px' }}
                                    className={styles.jsonEditor}
                                    data-search-text={searchText}
                                >
                                    <JsonEditor
                                        data={style}
                                        theme={colorScheme === 'dark' ? githubDarkTheme : githubLightTheme}
                                        collapse={isExpanded ? false : 1}
                                        enableClipboard={true}
                                        showErrorMessages={false}
                                        viewOnly={true}
                                        searchText={searchText}
                                        searchFilter="all"
                                        searchDebounceTime={150}
                                    />
                                </Box>
                            </ScrollArea>
                        </Stack>
                    </Popover.Dropdown>
                </Popover>
            }
        >
            <Box
                style={{
                    border: '1px solid var(--mantine-color-orange-4)',
                    // borderRadius: 'var(--mantine-radius-sm)',
                }}
            >
                {children}
            </Box>
        </Indicator>
    );
};

export default DebugWrapper;
