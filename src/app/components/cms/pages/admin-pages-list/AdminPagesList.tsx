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
    Stack
} from '@mantine/core';
import { 
    IconSearch, 
    IconFile, 
    IconChevronRight, 
    IconAlertCircle,
    IconFileText
} from '@tabler/icons-react';
import { useAdminPages } from '../../../../../hooks/useAdminPages';
import { IAdminPage } from '../../../../../types/responses/admin/admin.types';
import { 
    useSelectedPage, 
    useSetSelectedPage,
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
    
    // Use persistent tree state from store
    const selectedPage = useSelectedPage();
    const setSelectedPage = useSetSelectedPage();
    const expandedPageIds = useExpandedPageIds();
    const togglePageExpanded = useTogglePageExpanded();
    const expandPagePath = useExpandPagePath();

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
            
            if (page.parent === null) {
                // Root level page
                rootPages.push(pageItem);
            } else {
                // Child page
                const parentPage = pageMap.get(page.parent);
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

    const handlePageClick = (page: IAdminPage) => {
        
        // Set selected page in store
        setSelectedPage(page);
        
        // Call optional callback
        onPageSelect?.(page);
        
        // Navigate to the page URL smoothly (client-side navigation)
        const pageUrl = `/admin/pages/${page.keyword}`;
        router.push(pageUrl);
    };

    const renderPageItem = (page: PageTreeItem) => {
        const hasChildren = page.children.length > 0;
        const isOpen = expandedPageIds.has(page.id_pages);
        const isSelected = selectedPage?.keyword === page.keyword;

        return (
            <Box key={page.id_pages}>
                <UnstyledButton
                    className={classes.pageItem + ' w-full'}
                    data-selected={isSelected || undefined}
                    onClick={() => {
                        // Always handle page click for navigation
                        handlePageClick(page);
                        
                        // Toggle expansion if has children
                        if (hasChildren) {
                            togglePageExpanded(page.id_pages);
                        }
                    }}
                    
                    style={{
                        paddingLeft: `${(page.level * 20) + 12}px`
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
                                style={{
                                    transform: isOpen ? 'rotate(90deg)' : 'none',
                                    transition: 'transform 0.2s ease'
                                }}
                            />
                        )}
                    </Group>
                </UnstyledButton>

                {hasChildren && (
                    <Collapse in={isOpen}>
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

            <ScrollArea 
                style={{ height: 'calc(100vh - 200px)' }}
                scrollbarSize={6}
                scrollHideDelay={1000}
            >
                test
                <Stack gap={2} pb="md">
                    {filteredPages.length > 0 ? (
                        filteredPages.map(page => renderPageItem(page))
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