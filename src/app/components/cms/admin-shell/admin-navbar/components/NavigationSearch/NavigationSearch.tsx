'use client';

import { useState, useMemo } from 'react';
import {
    TextInput,
    Stack,
    Text,
    Group,
    ActionIcon,
    Box,
    ScrollArea,
    Highlight,
    Badge,
    UnstyledButton
} from '@mantine/core';
import { IconSearch, IconX, IconFile, IconSettings, IconUsers, IconDatabase, IconPhoto, IconPlayerPlay, IconFileText, IconLanguage } from '@tabler/icons-react';
import { useRouter } from 'next/navigation';
import styles from './NavigationSearch.module.css';
import { useNavigationStore } from '../../../../../../store/navigation.store';
import { useAuth } from '../../../../../../../hooks/useAuth';

interface ISearchableItem {
    id: string;
    label: string;
    description?: string;
    href: string;
    icon: React.ReactNode;
    category: string;
    keywords: string[];
}

interface IAdminPageData {
    configurationPageLinks?: Array<{
        keyword: string;
        label: string;
    }>;
    categorizedSystemPages?: {
        authentication: Array<{ keyword: string; label: string; title?: string; }>;
        profile: Array<{ keyword: string; label: string; title?: string; }>;
        errors: Array<{ keyword: string; label: string; title?: string; }>;
        legal: Array<{ keyword: string; label: string; title?: string; }>;
        other: Array<{ keyword: string; label: string; title?: string; }>;
    };
    categorizedRegularPages?: {
        menu: Array<{ keyword: string; label: string; title?: string; children?: Array<{ keyword: string; label: string; title?: string; children?: unknown[]; }>; }>;
        footer: Array<{ keyword: string; label: string; title?: string; children?: Array<{ keyword: string; label: string; title?: string; children?: Array<{ keyword: string; label: string; title?: string; children?: unknown[]; }>; }>; }>;
        other: Array<{ keyword: string; label: string; title?: string; children?: Array<{ keyword: string; label: string; title?: string; children?: Array<{ keyword: string; label: string; title?: string; children?: unknown[]; }>; }>; }>;
    };
    allPages?: Array<{
        keyword: string;
        title?: string;
        nav_position?: number | null;
        footer_position?: number | null;
        is_system: boolean;
        children?: Array<{
            keyword: string;
            title?: string;
            children?: unknown[];
        }>;
    }>;
}

interface INavigationSearchProps {
    adminPagesData: IAdminPageData;
    onItemSelect: () => void;
}

export function NavigationSearch({ adminPagesData, onItemSelect }: INavigationSearchProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const router = useRouter();
    const { setActiveItem } = useNavigationStore();
    const { permissionChecker } = useAuth();

    // Build searchable items from all admin functions and pages
    const searchableItems = useMemo<ISearchableItem[]>(() => {
        const items: ISearchableItem[] = [];

        // Static admin functions - only include those the user has permission to access
        const staticFunctions = [];

        // Always include dashboard for admin users
        staticFunctions.push({ id: 'dashboard', label: 'Dashboard', href: '/admin', icon: <IconSettings size={16} />, category: 'Admin', keywords: ['dashboard', 'overview', 'home'] });

        // User Management functions - check permissions
        if (permissionChecker?.canManageUsers()) {
            if (permissionChecker.canReadUsers()) {
                staticFunctions.push({ id: 'users', label: 'Users', href: '/admin/users', icon: <IconUsers size={16} />, category: 'User Management', keywords: ['users', 'accounts', 'people'] });
            }
            if (permissionChecker.canReadGroups()) {
                staticFunctions.push({ id: 'groups', label: 'Groups', href: '/admin/groups', icon: <IconUsers size={16} />, category: 'User Management', keywords: ['groups', 'teams', 'permissions'] });
            }
            if (permissionChecker.canReadRoles()) {
                staticFunctions.push({ id: 'roles', label: 'Roles', href: '/admin/roles', icon: <IconUsers size={16} />, category: 'User Management', keywords: ['roles', 'permissions', 'access'] });
            }
        }

        // Content functions - check permissions
        if (permissionChecker?.canManageAssets()) {
            if (permissionChecker.canReadAssets()) {
                staticFunctions.push({ id: 'assets', label: 'Assets', href: '/admin/assets', icon: <IconPhoto size={16} />, category: 'Content', keywords: ['assets', 'files', 'media', 'images'] });
            }
            if (permissionChecker.canDeleteSections()) {
                staticFunctions.push({ id: 'unused-sections', label: 'Unused Sections', href: '/admin/unused-sections', icon: <IconDatabase size={16} />, category: 'Content', keywords: ['unused', 'sections', 'cleanup'] });
            }
        }

        // Automation functions - check permissions
        if (permissionChecker?.canManageActions() || permissionChecker?.canManageScheduledJobs()) {
            if (permissionChecker.canReadActions()) {
                staticFunctions.push({ id: 'actions', label: 'Actions', href: '/admin/actions', icon: <IconPlayerPlay size={16} />, category: 'Automation', keywords: ['actions', 'automation', 'triggers'] });
            }
            if (permissionChecker.canReadScheduledJobs()) {
                staticFunctions.push({ id: 'scheduled-jobs', label: 'Scheduled Jobs', href: '/admin/scheduled-jobs', icon: <IconPlayerPlay size={16} />, category: 'Automation', keywords: ['jobs', 'scheduled', 'cron', 'tasks'] });
            }
        }

        // System Tools functions - check permissions
        const systemToolFunctions = [];
        if (permissionChecker?.canManageLanguages()) {
            systemToolFunctions.push({ id: 'languages', label: 'Languages', href: '/admin/languages', icon: <IconLanguage size={16} />, category: 'System Tools', keywords: ['languages', 'locale', 'translation', 'i18n'] });
        }
        if (permissionChecker?.canAccessDataBrowser()) {
            systemToolFunctions.push({ id: 'data', label: 'Data Browser', href: '/admin/data', icon: <IconDatabase size={16} />, category: 'Data Management', keywords: ['data', 'database', 'tables', 'browse'] });
        }
        if (permissionChecker?.canViewAuditLogs()) {
            systemToolFunctions.push({ id: 'audit-logs', label: 'Audit Logs', href: '/admin/data-access', icon: <IconDatabase size={16} />, category: 'System Tools', keywords: ['audit', 'logs', 'security', 'access', 'monitoring', 'data access'] });
        }
        if (permissionChecker?.canReadCmsPreferences()) {
            systemToolFunctions.push({ id: 'preferences', label: 'CMS Preferences', href: '/admin/preferences', icon: <IconSettings size={16} />, category: 'Configuration', keywords: ['preferences', 'settings', 'config'] });
        }
        if (permissionChecker?.canReadCache()) {
            systemToolFunctions.push({ id: 'cache', label: 'Cache Management', href: '/admin/cache', icon: <IconDatabase size={16} />, category: 'Configuration', keywords: ['cache', 'performance', 'memory'] });
        }

        if (systemToolFunctions.length > 0) {
            items.push(...systemToolFunctions);
        }

        items.push(...staticFunctions);

        // Add dynamic pages from adminPagesData
        if (adminPagesData) {
            // Configuration pages
            adminPagesData.configurationPageLinks?.forEach((page) => {
                items.push({
                    id: `config-page-${page.keyword}`,
                    label: page.label,
                    href: `/admin/pages/${page.keyword}`,
                    icon: <IconSettings size={16} />,
                    category: 'Configuration Pages',
                    keywords: [page.label.toLowerCase(), page.keyword, 'configuration', 'config'].filter(Boolean)
                });
            });

            // System pages
            const addSystemPages = (pages: Array<{ keyword: string; label: string; title?: string; }>, categoryName: string) => {
                pages.forEach((page) => {
                    const displayName = page.title || page.label || page.keyword;
                    items.push({
                        id: `system-${categoryName.toLowerCase()}-${page.keyword}`,
                        label: displayName,
                        href: `/admin/pages/${page.keyword}`,
                        icon: <IconFile size={16} />,
                        category: `System - ${categoryName}`,
                        keywords: [displayName.toLowerCase(), page.keyword, page.label.toLowerCase(), categoryName.toLowerCase()].filter(Boolean)
                    });
                });
            };

            if (adminPagesData.categorizedSystemPages) {
                addSystemPages(adminPagesData.categorizedSystemPages.authentication, 'Authentication');
                addSystemPages(adminPagesData.categorizedSystemPages.profile, 'Profile');
                addSystemPages(adminPagesData.categorizedSystemPages.errors, 'Errors');
                addSystemPages(adminPagesData.categorizedSystemPages.legal, 'Legal');
                addSystemPages(adminPagesData.categorizedSystemPages.other, 'Other');
            }

            // Regular pages (with recursive children support)
            const addRegularPages = (pages: Array<{
                keyword: string;
                label: string;
                title?: string;
                children?: Array<{
                    keyword: string;
                    label: string;
                    title?: string;
                    children?: unknown[];
                }>;
            }>, categoryName: string) => {
                const addPageAndChildren = (page: {
                    keyword: string;
                    label: string;
                    title?: string;
                    children?: Array<{
                        keyword: string;
                        label: string;
                        title?: string;
                        children?: unknown[];
                    }>;
                }, level: number = 0) => {
                    const prefix = level > 0 ? '  '.repeat(level) : '';
                    const displayName = page.title || page.label || page.keyword;
                    // Create more specific keywords - avoid generic terms like 'submenu' and 'child'
                    const specificKeywords = [
                        displayName.toLowerCase(),
                        page.keyword,
                        page.label.toLowerCase(),
                        categoryName.toLowerCase()
                    ];

                    // Only add level-specific keywords for actual submenus (level > 0)
                    if (level > 0) {
                        specificKeywords.push('nested', 'sub');
                    }

                    items.push({
                        id: `page-${categoryName.toLowerCase()}-${page.keyword}-${level}`,
                        label: `${prefix}${displayName}`,
                        href: `/admin/pages/${page.keyword}`,
                        icon: <IconFileText size={16} />,
                        category: `Pages - ${categoryName}`,
                        keywords: specificKeywords.filter(Boolean)
                    });

                    // Recursively add children
                    if (page.children && page.children.length > 0) {
                        page.children.forEach((child) => {
                            if (child && typeof child === 'object' && 'keyword' in child && 'label' in child) {
                                addPageAndChildren(child as {
                                    keyword: string;
                                    label: string;
                                    title?: string;
                                    children?: Array<{
                                        keyword: string;
                                        label: string;
                                        title?: string;
                                        children?: unknown[];
                                    }>;
                                }, level + 1);
                            }
                        });
                    }
                };

                pages.forEach((page) => {
                    addPageAndChildren(page);
                });
            };

            // Use raw pages data if available (includes hierarchy), fallback to categorized
            if (adminPagesData.allPages && adminPagesData.allPages.length > 0) {
                // Convert allPages format to expected format (allPages has title, not label)
                const convertAllPagesToRegularFormat = (pages: typeof adminPagesData.allPages): Array<{
                    keyword: string;
                    label: string;
                    title?: string;
                    children?: Array<{
                        keyword: string;
                        label: string;
                        title?: string;
                        children?: unknown[];
                    }>;
                }> => {
                    if (!pages) return [];
                    return pages.map(page => ({
                        keyword: page.keyword,
                        label: page.title || page.keyword, // Use title as label for display
                        title: page.title,
                        children: page.children ? convertAllPagesToRegularFormat(page.children as typeof adminPagesData.allPages) : undefined
                    }));
                };

                // Filter menu pages from raw data (preserves hierarchy)
                const menuPages = convertAllPagesToRegularFormat(
                    adminPagesData.allPages.filter((page) =>
                        page.nav_position !== null && page.nav_position !== undefined && !page.is_system
                    )
                );
                const footerPages = convertAllPagesToRegularFormat(
                    adminPagesData.allPages.filter((page) =>
                        page.footer_position !== null && page.footer_position !== undefined && !page.is_system
                    )
                );
                const otherPages = convertAllPagesToRegularFormat(
                    adminPagesData.allPages.filter((page) =>
                        (page.nav_position === null || page.nav_position === undefined) &&
                        (page.footer_position === null || page.footer_position === undefined) &&
                        !page.is_system
                    )
                );

                if (menuPages.length > 0) addRegularPages(menuPages, 'Menu');
                if (footerPages.length > 0) addRegularPages(footerPages, 'Footer');
                if (otherPages.length > 0) addRegularPages(otherPages, 'Other');
            } else if (adminPagesData.categorizedRegularPages) {
                // Fallback to categorized data (flat structure)
                if (adminPagesData.categorizedRegularPages.menu) {
                    addRegularPages(adminPagesData.categorizedRegularPages.menu, 'Menu');
                }
                if (adminPagesData.categorizedRegularPages.footer) {
                    addRegularPages(adminPagesData.categorizedRegularPages.footer, 'Footer');
                }
                if (adminPagesData.categorizedRegularPages.other) {
                    addRegularPages(adminPagesData.categorizedRegularPages.other, 'Other');
                }
            }
        }

        return items;
    }, [adminPagesData, permissionChecker]);

    // Filter items based on search query with improved ranking
    const filteredItems = useMemo(() => {
        if (!searchQuery.trim()) return [];

        const query = searchQuery.toLowerCase().trim();

        // Score items based on match quality
        const scoredItems = searchableItems.map(item => {
            let score = 0;
            const label = item.label.toLowerCase();
            const category = item.category.toLowerCase();

            // Exact label match gets highest score
            if (label === query) score += 100;
            // Label starts with query gets high score
            else if (label.startsWith(query)) score += 50;
            // Label contains query gets medium score
            else if (label.includes(query)) score += 25;

            // Category match gets lower score
            if (category.includes(query)) score += 10;

            // Keyword matches get varying scores
            item.keywords.forEach(keyword => {
                if (keyword && typeof keyword === 'string') {
                    const keywordLower = keyword.toLowerCase();

                    // Special handling for generic terms - only match if they're specific
                    if (['sub', 'nested'].includes(keywordLower) && !query.startsWith(keywordLower)) {
                        return; // Skip generic level keywords unless specifically searched
                    }

                    if (keywordLower === query) score += 30;
                    else if (keywordLower.startsWith(query)) score += 15;
                    else if (keywordLower.includes(query)) score += 5;
                }
            });

            return { item, score };
        }).filter(({ score }) => score > 0);

        // Sort by score (highest first) and limit results
        return scoredItems
            .sort((a, b) => b.score - a.score)
            .slice(0, 10)
            .map(({ item }) => item);
    }, [searchableItems, searchQuery]);

    const handleItemClick = (item: ISearchableItem, e?: React.MouseEvent) => {
        // Support middle click and ctrl+click for new tab
        if (e && (e.button === 1 || e.ctrlKey || e.metaKey)) {
            window.open(item.href, '_blank');
            setSearchQuery('');
            onItemSelect?.();
            return;
        }

        setActiveItem(item.href);
        router.push(item.href);
        setSearchQuery('');
        onItemSelect?.();
    };

    const clearSearch = () => {
        setSearchQuery('');
    };

    return (
        <Box>
            <TextInput
                placeholder="Search functions and pages..."
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.currentTarget.value)}
                leftSection={<IconSearch size={14} />}
                rightSection={
                    searchQuery && (
                        <ActionIcon
                            variant="subtle"
                            color="gray"
                            size="xs"
                            onClick={clearSearch}
                        >
                            <IconX size={12} />
                        </ActionIcon>
                    )
                }
                size="xs"
                mb="xs"
            />

            {/* Search Results */}
            {searchQuery && (
                <Box mb="xs">
                    {filteredItems.length > 0 ? (
                        <ScrollArea.Autosize mah={200}>
                            <Stack gap={1}>
                                <Text size="xs" c="dimmed" fw={500} tt="uppercase" px="xs" mb={2}>
                                    Search Results ({filteredItems.length})
                                </Text>
                                {filteredItems.map((item) => (
                                    <UnstyledButton
                                        key={item.id}
                                        onClick={(e) => handleItemClick(item, e)}
                                        onMouseDown={(e: React.MouseEvent) => {
                                            // Handle middle click
                                            if (e.button === 1) {
                                                e.preventDefault();
                                                window.open(item.href, '_blank');
                                                setSearchQuery('');
                                                onItemSelect?.();
                                            }
                                        }}
                                        onContextMenu={(e: React.MouseEvent) => {
                                            // Allow right-click context menu for "open in new tab"
                                            e.stopPropagation();
                                        }}
                                        className={styles.searchItem}
                                        px="xs"
                                        py={4}
                                    >
                                        <Group gap="xs" wrap="nowrap">
                                            {item.icon}
                                            <Box className={styles.searchItemText}>
                                                <Text size="xs" fw={500} truncate>
                                                    <Highlight highlight={searchQuery} component="span">
                                                        {item.label}
                                                    </Highlight>
                                                </Text>
                                                <Badge size="xs" variant="light" color="gray" mt={1}>
                                                    {item.category}
                                                </Badge>
                                            </Box>
                                        </Group>
                                    </UnstyledButton>
                                ))}
                            </Stack>
                        </ScrollArea.Autosize>
                    ) : (
                        <Box p="xs" ta="center">
                            <Text size="xs" c="dimmed">
                                No results found for &quot;{searchQuery}&quot;
                            </Text>
                        </Box>
                    )}
                </Box>
            )}
        </Box>
    );
}

// Helper functions
function capitalizeFirst(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function getCategoryIcon(category: string): React.ReactNode {
    switch (category.toLowerCase()) {
        case 'authentication':
        case 'profile':
            return <IconUsers size={16} />;
        case 'menu':
        case 'footer':
            return <IconFileText size={16} />;
        case 'errors':
        case 'legal':
        case 'other':
            return <IconFile size={16} />;
        case 'configuration':
            return <IconSettings size={16} />;
        default:
            return <IconFile size={16} />;
    }
}
