"use client";

import { ScrollArea, ActionIcon, Tooltip, Group, Box, TextInput, Stack, CloseButton, Collapse } from '@mantine/core';
import { IconAdjustmentsCog, IconFiles, IconMessageCircleQuestion, IconSettings, IconSettingsAutomation, IconPlus, IconSearch, IconX, IconChevronRight, IconChevronDown } from '@tabler/icons-react';
import { LinksGroup } from '../../common/navbar-links-group/NavbarLinksGroup';
import { CreatePageModal } from '../pages/create-page/CreatePage';
import classes from './AdminNavbar.module.css';
import { useState, useMemo, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { IAdminPage } from '../../../../types/responses/admin/admin.types';
import { debug } from '../../../../utils/debug-logger';
import { useAdminPages } from '../../../../hooks/useAdminPages';
import { useSelectedPage } from '../../../store/admin.store';

export function AdminNavbar() {
    const router = useRouter();
    const { pages, categorizedSystemPages, isLoading } = useAdminPages();
    const selectedPage = useSelectedPage();
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedItems, setExpandedItems] = useState(new Set<string>());
    const [isModalOpen, setIsModalOpen] = useState(false);
    const selectedPageKeyword = selectedPage?.keyword;
    const searchInputRef = useRef<HTMLInputElement>(null);

    // Toggle expand/collapse for items
    const toggleExpanded = useCallback((itemKey: string) => {
        setExpandedItems(prev => {
            const newSet = new Set(prev);
            if (newSet.has(itemKey)) {
                newSet.delete(itemKey);
            } else {
                newSet.add(itemKey);
            }
            return newSet;
        });
    }, []);

    // Handle search change with useCallback to prevent re-renders
    const handleSearchChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(event.currentTarget.value);
    }, []);

    // Handle clear search
    const handleClearSearch = useCallback(() => {
        setSearchTerm('');
        if (searchInputRef.current) {
            searchInputRef.current.focus();
        }
    }, []);

    // Handle key down events
    const handleKeyDown = useCallback((event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            // Keep focus on the input
            if (searchInputRef.current) {
                searchInputRef.current.focus();
            }
        }
    }, []);

    // Filter pages based on search term
    const filterPages = useCallback((pages: IAdminPage[], searchTerm: string): IAdminPage[] => {
        if (!searchTerm.trim()) return pages;
        
        const search = searchTerm.toLowerCase();
        
        const filterPage = (page: IAdminPage): IAdminPage | null => {
            const matchesSearch = 
                page.keyword.toLowerCase().includes(search) ||
                page.url.toLowerCase().includes(search);
            
            // Filter children recursively
            const filteredChildren = page.children 
                ? page.children.map(filterPage).filter(Boolean) as IAdminPage[]
                : [];
            
            // Include page if it matches or has matching children
            if (matchesSearch || filteredChildren.length > 0) {
                return {
                    ...page,
                    children: filteredChildren
                };
            }
            
            return null;
        };
        
        return pages.map(filterPage).filter(Boolean) as IAdminPage[];
    }, []);

    // Transform pages into LinkItem format recursively using existing structure
    const transformPagesToLinks = useCallback((pages: IAdminPage[]) => {
        const transformPage = (page: IAdminPage): any => ({
            label: page.keyword,
            link: `/admin/pages/${page.keyword}`,
            hasNavPosition: page.nav_position !== null,
            children: page.children ? page.children.map(transformPage) : []
        });

        const result = pages.map(transformPage);
        
        debug('Transformed pages for navigation', 'AdminNavbar', { 
            totalPages: pages.length,
            transformedPages: result.length
        });

        return result;
    }, []);

    // Memoize filtered and transformed pages
    const pageLinks = useMemo(() => {
        if (isLoading) return [];
        const filteredPages = filterPages(pages, searchTerm);
        return transformPagesToLinks(filteredPages);
    }, [pages, searchTerm, isLoading, filterPages, transformPagesToLinks]);

    // Render page item with collapse functionality
    const renderPageItem = useCallback((item: any, level: number = 0) => {
        const itemKey = `${item.label}-${level}`;
        const hasChildren = item.children && item.children.length > 0;
        const isExpanded = expandedItems.has(itemKey);
        const indentLevel = level * 20;

        return (
            <div key={itemKey}>
                <Group gap="sm" style={{ padding: '4px 12px', marginLeft: `${indentLevel}px` }}>
                    {hasChildren && (
                        <ActionIcon
                            size="xs"
                            variant="subtle"
                            onClick={() => toggleExpanded(itemKey)}
                            style={{ cursor: 'pointer' }}
                        >
                            {isExpanded ? (
                                <IconChevronDown size="0.7rem" />
                            ) : (
                                <IconChevronRight size="0.7rem" />
                            )}
                        </ActionIcon>
                    )}
                    {!hasChildren && <Box style={{ width: '20px' }} />}
                    {item.hasNavPosition && (
                        <ActionIcon variant="light" size="xs" color="blue">
                            <IconFiles size="0.6rem" />
                        </ActionIcon>
                    )}
                    <Box
                        component="a"
                        href={item.link}
                        onClick={(e) => {
                            e.preventDefault();
                            router.push(item.link);
                        }}
                        style={{
                            textDecoration: 'none',
                            color: 'inherit',
                            flex: 1,
                            cursor: 'pointer',
                            fontSize: level > 0 ? '0.9rem' : '1rem'
                        }}
                    >
                        {item.label}
                    </Box>
                </Group>
                {hasChildren && (
                    <Collapse in={isExpanded}>
                        <div>
                            {item.children.map((child: any) => renderPageItem(child, level + 1))}
                        </div>
                    </Collapse>
                )}
            </div>
        );
    }, [expandedItems, toggleExpanded, router]);

    // Custom Pages section with search
    const PagesSection = useMemo(() => (
        <Stack gap="xs" style={{ maxHeight: '700px', overflow: 'hidden' }}>
            <TextInput
                ref={searchInputRef}
                placeholder="Search pages..."
                value={searchTerm}
                onChange={handleSearchChange}
                onKeyDown={handleKeyDown}
                leftSection={<IconSearch size="0.9rem" />}
                rightSection={
                    searchTerm ? (
                        <ActionIcon
                            size="sm"
                            variant="subtle"
                            color="gray"
                            onClick={handleClearSearch}
                            style={{ cursor: 'pointer' }}
                        >
                            <IconX size="0.8rem" />
                        </ActionIcon>
                    ) : null
                }
                size="xs"
                style={{ 
                    padding: '0 12px',
                    marginBottom: '8px'
                }}
            />
            <ScrollArea style={{ maxHeight: '650px' }}>
                <div>
                    {pageLinks.length === 0 && searchTerm ? (
                        <Box style={{ padding: '12px', textAlign: 'center', color: 'var(--mantine-color-dimmed)' }}>
                            No pages found for &quot;{searchTerm}&quot;
                        </Box>
                    ) : (
                        pageLinks.map((item) => renderPageItem(item, 0))
                    )}
                </div>
            </ScrollArea>
        </Stack>
    ), [searchTerm, handleSearchChange, handleKeyDown, handleClearSearch, pageLinks, renderPageItem]);

    // Build dynamic system pages section
    const systemPagesChildren = useMemo(() => {
        if (isLoading) {
            return [{ label: 'Loading...', link: '#' }];
        }

        const systemPages = [];
        
        // Authentication pages
        if (categorizedSystemPages.authentication.length > 0) {
            systemPages.push({
                label: 'Authentication',
                children: categorizedSystemPages.authentication.map(page => ({
                    label: page.label,
                    link: page.link
                }))
            });
        }

        // Profile pages
        if (categorizedSystemPages.profile.length > 0) {
            systemPages.push({
                label: 'User Profile',
                children: categorizedSystemPages.profile.map(page => ({
                    label: page.label,
                    link: page.link
                }))
            });
        }

        // Error pages
        if (categorizedSystemPages.errors.length > 0) {
            systemPages.push({
                label: 'Error Pages',
                children: categorizedSystemPages.errors.map(page => ({
                    label: page.label,
                    link: page.link
                }))
            });
        }

        // Legal pages
        if (categorizedSystemPages.legal.length > 0) {
            systemPages.push({
                label: 'Legal Pages',
                children: categorizedSystemPages.legal.map(page => ({
                    label: page.label,
                    link: page.link
                }))
            });
        }

        // Other system pages
        if (categorizedSystemPages.other.length > 0) {
            systemPages.push(
                ...categorizedSystemPages.other.map(page => ({
                    label: page.label,
                    link: page.link
                }))
            );
        }

        return systemPages.length > 0 ? systemPages : [{ label: 'No system pages found', link: '#' }];
    }, [categorizedSystemPages, isLoading]);

    const staticNavItems = [
        {
            label: 'Configuration',
            icon: <IconSettingsAutomation size="1rem" stroke={1.5} />,
            children: [
                { label: 'Global Values', link: '/admin/pages/globals' },
                { label: 'Custom CSS', link: '/admin/pages/css' }
            ]
        },
        {
            label: 'System Pages',
            icon: <IconAdjustmentsCog size="1rem" stroke={1.5} />,
            children: systemPagesChildren
        },
        {
            label: 'Pages',
            icon: <IconFiles size="1rem" stroke={1.5} />,
            rightSection: (
                <Tooltip label="Create new page" position="right">
                    <Box
                        component="div"
                        style={{ display: 'inline-flex' }}
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsModalOpen(true);
                        }}
                    >
                        <ActionIcon
                            component="div"
                            variant="light"
                            size="sm"
                            color="blue"
                        >
                            <IconPlus size="1rem" stroke={1.5} />
                        </ActionIcon>
                    </Box>
                </Tooltip>
            ),
            children: PagesSection
        },
        {
            label: 'Settings',
            icon: <IconSettings size="1rem" stroke={1.5} />,
            link: "/admin/settings"
        },
        {
            label: 'Learning Assistance',
            icon: <IconMessageCircleQuestion size="1rem" stroke={1.5} />,
            link: "/admin/help"
        }
    ];

    return (
        <>
            <ScrollArea className={classes.navbar}>
                <div className={classes.navbarMain}>
                    {staticNavItems.map((item) => (
                        <LinksGroup {...item} key={item.label} />
                    ))}
                </div>
            </ScrollArea>
            <CreatePageModal 
                opened={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
                parentPage={selectedPage}
            />
        </>
    );
}
