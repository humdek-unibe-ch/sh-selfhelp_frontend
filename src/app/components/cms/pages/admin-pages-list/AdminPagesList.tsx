/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
    TextInput, 
    ScrollArea, 
    Text, 
    UnstyledButton, 
    Group, 
    Box,
    Collapse,
    ThemeIcon,
    Loader,
    Alert,
    Stack,
    Button
} from '@mantine/core';
import { 
    IconSearch, 
    IconFile, 
    IconChevronRight, 
    IconAlertCircle,
    IconFileText,
    IconWorld,
    IconLayoutDashboard,
    IconTransfer,
    IconWand
} from '@tabler/icons-react';
import { PageExportImportModal } from './PageExportImportModal';
import { CmsAppWizardModal } from './CmsAppWizardModal';
import { useAdminPages } from '../../../../../hooks/useAdminPages';
import { type IAdminPage } from '../../../../../types/responses/admin/admin.types';
import {
    useSelectedKeyword,
    useSetSelectedKeyword,
    useExpandedPageIds,
    useTogglePageExpanded,
    useExpandPagePath
} from '../../../../store/admin.store';
import classes from './AdminPagesList.module.css';

interface AdminPagesListProps {
    onPageSelect?: (page: IAdminPage) => void;
}

interface PageTreeItem extends IAdminPage {
    children: PageTreeItem[];
    level: number;
}

export function AdminPagesList({ onPageSelect }: AdminPagesListProps) {
    const router = useRouter();
    const { pages, isLoading, error } = useAdminPages();
    const [searchQuery, setSearchQuery] = useState('');
    const [exportImportOpen, setExportImportOpen] = useState(false);
    const [wizardOpen, setWizardOpen] = useState(false);
    
    // Only the selected *keyword* lives in the store; the matching page
    // object is derived from the React Query cache when needed so we don't
    // re-render the whole tree on unrelated page mutations.
    const selectedKeyword = useSelectedKeyword();
    const setSelectedKeyword = useSetSelectedKeyword();
    const expandedPageIds = useExpandedPageIds();
    const togglePageExpanded = useTogglePageExpanded();
    const expandPagePath = useExpandPagePath();

    const selectedPage = useMemo(() => {
        if (!selectedKeyword || !pages) return null;
        return pages.find((p) => p.keyword === selectedKeyword) ?? null;
    }, [selectedKeyword, pages]);

    // Transform flat pages array into nested tree structure
    const pageTree = useMemo(() => {
        if (!pages || pages.length === 0) return [];


        // Create a map for quick lookup
        const pageMap = new Map<number, PageTreeItem>();
        const rootPages: PageTreeItem[] = [];

        // First pass: create all page items
        pages.forEach(page => {
            pageMap.set(page.id_pages, {
                ...page,
                children: [],
                level: 0
            });
        });

        // Second pass: build the tree structure
        pages.forEach(page => {
            const pageItem = pageMap.get(page.id_pages)!;
            
            if (page.id_parent_page === null) {
                // Root level page
                rootPages.push(pageItem);
            } else {
                // Child page
                const parentPage = pageMap.get(page.id_parent_page);
                if (parentPage) {
                    pageItem.level = parentPage.level + 1;
                    parentPage.children.push(pageItem);
                }
            }
        });

        return rootPages;
    }, [pages]);

    // Auto-expand path to selected page when page changes
    useEffect(() => {
        if (selectedPage && pages.length > 0) {
            expandPagePath(selectedPage, pages);
        }
    }, [selectedPage, pages, expandPagePath]);

    // Filter pages based on search query
    const filteredPages = useMemo(() => {
        if (!searchQuery.trim()) return pageTree;

        const filterPages = (pages: PageTreeItem[]): PageTreeItem[] => {
            return pages.reduce((acc: PageTreeItem[], page) => {
                const matchesSearch = 
                    page.keyword.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    page.url.toLowerCase().includes(searchQuery.toLowerCase());

                const filteredChildren = filterPages(page.children);
                
                if (matchesSearch || filteredChildren.length > 0) {
                    acc.push({
                        ...page,
                        children: filteredChildren
                    });
                }

                return acc;
            }, []);
        };

        return filterPages(pageTree);
    }, [pageTree, searchQuery]);

    // CMS-in-CMS organization (issue #30): split top-level pages into the
    // public website group and the CMS application group. Subtrees stay intact
    // under their root. The CMS group only appears when such pages exist, so the
    // common public-only install keeps the flat look.
    const { publicPages, cmsPages } = useMemo(() => {
        const publicList: PageTreeItem[] = [];
        const cmsList: PageTreeItem[] = [];
        filteredPages.forEach((page) => {
            if (page.page_surface === 'cms') {
                cmsList.push(page);
            } else {
                publicList.push(page);
            }
        });
        return { publicPages: publicList, cmsPages: cmsList };
    }, [filteredPages]);

    const handlePageClick = (page: IAdminPage) => {
        setSelectedKeyword(page.keyword);
        onPageSelect?.(page);
        const pageUrl = `/admin/pages/${page.keyword}`;
        router.push(pageUrl);
    };

    const getPageLevelClass = (level: number): string => {
        switch (level) {
            case 0: return classes.pageLevel0;
            case 1: return classes.pageLevel1;
            case 2: return classes.pageLevel2;
            case 3: return classes.pageLevel3;
            case 4: return classes.pageLevel4;
            case 5: return classes.pageLevel5;
            default: return classes.pageLevel0;
        }
    };

    const renderPageItem = (page: PageTreeItem) => {
        const hasChildren = page.children.length > 0;
        const isOpen = expandedPageIds.has(page.id_pages);
        const isSelected = selectedKeyword === page.keyword;

        return (
            <Box key={page.id_pages}>
                <UnstyledButton
                    className={`${classes.pageItem} ${getPageLevelClass(page.level)} w-full`}
                    data-selected={isSelected || undefined}
                    onClick={() => {
                        // Always handle page click for navigation
                        handlePageClick(page);

                        // Toggle expansion if has children
                        if (hasChildren) {
                            togglePageExpanded(page.id_pages);
                        }
                    }}
                >
                    <Group justify="space-between" gap="xs" wrap="nowrap">
                        <Group gap="xs" wrap="nowrap" className="flex-1 min-w-0">
                            <ThemeIcon
                                variant="light"
                                size="sm"
                                color={hasChildren ? 'blue' : 'gray'}
                            >
                                {hasChildren ? <IconFile size="0.8rem" /> : <IconFileText size="0.8rem" />}
                            </ThemeIcon>
                            <Box className="flex-1 min-w-0">
                                <Text size="sm" fw={500} truncate>
                                    {page.keyword}
                                </Text>
                                <Text size="xs" c="dimmed" truncate>
                                    {page.url}
                                </Text>
                            </Box>
                        </Group>
                        {hasChildren && (
                            <IconChevronRight
                                size="1rem"
                                className={isOpen ? classes.chevronRotated : classes.chevronNormal}
                            />
                        )}
                    </Group>
                </UnstyledButton>

                {hasChildren && (
                    <Collapse expanded={isOpen}>
                        <Box>
                            {page.children.map(child => renderPageItem(child))}
                        </Box>
                    </Collapse>
                )}
            </Box>
        );
    };

    if (isLoading) {
        return (
            <Stack align="center" py="xl">
                <Loader size="sm" />
                <Text size="sm" c="dimmed">Loading pages...</Text>
            </Stack>
        );
    }

    if (error) {
        return (
            <Alert 
                icon={<IconAlertCircle size="1rem" />} 
                title="Error loading pages" 
                color="red"
                variant="light"
            >
                Failed to load admin pages. Please try again.
            </Alert>
        );
    }

    return (
        <Stack gap="sm">
            <TextInput
                placeholder="Search pages..."
                leftSection={<IconSearch size="1rem" />}
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.currentTarget.value)}
                size="sm"
            />
            <Group gap="xs" grow>
                <Button
                    variant="light"
                    size="xs"
                    leftSection={<IconWand size="0.9rem" />}
                    onClick={() => setWizardOpen(true)}
                >
                    New app
                </Button>
                <Button
                    variant="light"
                    size="xs"
                    leftSection={<IconTransfer size="0.9rem" />}
                    onClick={() => setExportImportOpen(true)}
                >
                    Export / Import
                </Button>
            </Group>

            <CmsAppWizardModal
                opened={wizardOpen}
                onClose={() => setWizardOpen(false)}
            />

            <PageExportImportModal
                opened={exportImportOpen}
                onClose={() => setExportImportOpen(false)}
                pages={pages ?? []}
            />

            <ScrollArea
                className={classes.scrollContainer}
                scrollbarSize={6}
                scrollHideDelay={1000}
            >
                <Stack gap={2} pb="md">
                    {filteredPages.length > 0 ? (
                        cmsPages.length > 0 ? (
                            <>
                                <Group gap={6} px="xs" pt={4} pb={2}>
                                    <IconWorld size="0.85rem" color="var(--mantine-color-blue-6)" />
                                    <Text size="xs" fw={700} c="dimmed" tt="uppercase">
                                        Public website
                                    </Text>
                                </Group>
                                {publicPages.length > 0 ? (
                                    publicPages.map(page => renderPageItem(page))
                                ) : (
                                    <Text size="xs" c="dimmed" px="xs" py={4}>
                                        No public pages.
                                    </Text>
                                )}
                                <Group gap={6} px="xs" pt="sm" pb={2}>
                                    <IconLayoutDashboard size="0.85rem" color="var(--mantine-color-grape-6)" />
                                    <Text size="xs" fw={700} c="dimmed" tt="uppercase">
                                        CMS application
                                    </Text>
                                </Group>
                                {cmsPages.map(page => renderPageItem(page))}
                            </>
                        ) : (
                            filteredPages.map(page => renderPageItem(page))
                        )
                    ) : (
                        <Text size="sm" c="dimmed" ta="center" py="xl">
                            {searchQuery ? 'No pages found matching your search.' : 'No pages available.'}
                        </Text>
                    )}
                </Stack>
            </ScrollArea>
        </Stack>
    );
} 