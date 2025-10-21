import React, { useState, useEffect, useRef } from 'react';
import { Indicator, Popover, Text, ScrollArea, Badge, Group, Box, useMantineColorScheme, ActionIcon, TextInput, Stack, Alert } from '@mantine/core';
import { IconBug, IconSearch, IconX, IconChevronsDown, IconChevronsUp, IconAlertTriangle } from '@tabler/icons-react';
import { JsonEditor, githubLightTheme, githubDarkTheme } from 'json-edit-react';
import type { TStyle } from '../../../../../../types/common/styles.types';
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

    // Check if condition failed (condition_debug.result is false)
    const conditionFailed = style.condition_debug && style.condition_debug.result === false;

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

    // Render placeholder when condition failed
    const renderContent = () => {
        if (conditionFailed) {
            return (
                <Box p="md" className={styles.conditionFailedContainer}>
                    <Alert
                        variant="light"
                        color="orange"
                        title="Condition Failed"
                        icon={<IconAlertTriangle />}
                        style={{ width: '100%' }}
                    >
                        <Text size="sm">
                            This element is hidden because its condition evaluated to false.
                            Debug information is still available.
                        </Text>
                    </Alert>
                </Box>
            );
        }

        return (
            <Box className={styles.debugWrapperBorder}>
                {children}
            </Box>
        );
    };

    return (
        <Box maw={'calc(100% - var(--mantine-spacing-xs) / 2)'}>
            <Indicator
                size={16}
                offset={2}
                position="top-end"
                color='transparent'
                m={'xs'}
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
                            color="orange"
                            onMouseEnter={() => setOpened(true)}
                            className={styles.cursorPointer}
                        >
                            <IconBug size={10} />
                        </ActionIcon>
                    </Popover.Target>

                    <Popover.Dropdown>
                        <Stack gap="md">
                            <Group justify="space-between">
                                <Box>
                                    <Text size="sm" fw={600} c={conditionFailed ? 'red' : 'orange'} component="span">
                                        Style Debug Info
                                    </Text>
                                    {conditionFailed && (
                                        <Badge size="xs" color="orange" ml="xs">
                                            Condition Failed
                                        </Badge>
                                    )}
                                </Box>
                                <Badge size="sm" variant="light" color={conditionFailed ? 'red' : 'orange'}>
                                    ID: {style.id}
                                </Badge>
                            </Group>

                            <Group>
                                <Badge size="sm" color={conditionFailed ? 'red' : 'orange'}>
                                    {style.style_name}
                                </Badge>
                                {style.section_name && (
                                    <Badge size="sm" variant="outline" color={conditionFailed ? 'red' : 'orange'}>
                                        {style.section_name}
                                    </Badge>
                                )}
                                {style.condition_debug && (
                                    <Badge
                                        size="sm"
                                        color={style.condition_debug.result ? 'green' : 'red'}
                                        variant="light"
                                    >
                                        Condition: {style.condition_debug.result ? 'PASS' : 'FAIL'}
                                    </Badge>
                                )}
                            </Group>

                            {/* Condition Debug Section */}
                            {style.condition_debug && (
                                <Box>
                                    <Text size="sm" fw={500} mb="xs">
                                        Condition Analysis
                                    </Text>
                                    <Stack gap="xs">
                                        <Group gap="xs">
                                            <Text size="xs" c="dimmed">Result:</Text>
                                            <Badge
                                                size="xs"
                                                color={style.condition_debug.result ? 'green' : 'red'}
                                            >
                                                {style.condition_debug.result ? 'TRUE' : 'FALSE'}
                                            </Badge>
                                        </Group>

                                        {style.condition_debug.error && style.condition_debug.error.length > 0 && (
                                            <Box>
                                                <Text size="xs" c="dimmed" mb="xs">Errors:</Text>
                                                {style.condition_debug.error.map((error: string, index: number) => (
                                                    <Text key={index} size="xs" c="orange" className={styles.codeBlock}>
                                                        {error}
                                                    </Text>
                                                ))}
                                            </Box>
                                        )}

                                        {style.condition_debug.variables && Object.keys(style.condition_debug.variables).length > 0 && (
                                            <Box>
                                                <Text size="xs" c="dimmed" mb="xs">Variables:</Text>
                                                <Group gap="xs" wrap="wrap">
                                                    {Object.entries(style.condition_debug.variables).map(([key, value]) => (
                                                        <Badge key={key} size="xs" variant="outline" color="blue">
                                                            {key}: {Array.isArray(value) ? `[${value.join(', ')}]` : JSON.stringify(value)}
                                                        </Badge>
                                                    ))}
                                                </Group>
                                            </Box>
                                        )}

                                        {style.condition_debug.condition && (
                                            <Box>
                                                <Text size="xs" c="dimmed" mb="xs">Condition:</Text>
                                                <Text
                                                    size="xs"
                                                    className={styles.codeBlock}
                                                >
                                                    {style.condition_debug.condition}
                                                </Text>
                                            </Box>
                                        )}
                                    </Stack>
                                </Box>
                            )}

                            <Group justify="space-between" align="center">
                                <TextInput
                                    placeholder="Search properties..."
                                    leftSection={<IconSearch size={16} />}
                                    rightSection={
                                        searchText ? (
                                            <ActionIcon
                                                variant="transparent"
                                                size="sm"
                                                color={conditionFailed ? 'red' : 'orange'}
                                                onClick={() => setSearchText('')}
                                                className={styles.cursorPointer}
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
                                    className={styles.flex1}
                                />

                                <ActionIcon
                                    variant="light"
                                    size="sm"
                                    color={conditionFailed ? 'red' : 'orange'}
                                    onClick={() => setIsExpanded(!isExpanded)}
                                    title={isExpanded ? 'Collapse all' : 'Expand all'}
                                    className={styles.cursorPointer}
                                >
                                    {isExpanded ? <IconChevronsUp size={16} /> : <IconChevronsDown size={16} />}
                                </ActionIcon>
                            </Group>

                            <ScrollArea h={400} type="auto">
                                <Box
                                    ref={jsonEditorRef}
                                    p="xs"
                                    className={`${styles.jsonEditor} ${styles.smallFont}`}
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
                {renderContent()}
            </Indicator>
        </Box>
    );
};

export default DebugWrapper;
