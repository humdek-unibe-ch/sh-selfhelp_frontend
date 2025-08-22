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
import { IconSearch, IconX, IconFile, IconSettings, IconUsers, IconDatabase, IconPhoto, IconPlayerPlay, IconFileText } from '@tabler/icons-react';
import { useRouter } from 'next/navigation';
import { useNavigationStore } from '../../../../../store/navigation.store';

interface ISearchableItem {
    id: string;
    label: string;
    description?: string;
    href: string;
    icon: React.ReactNode;
    category: string;
    keywords: string[];
}

interface INavigationSearchProps {
    adminPagesData: any;
    onItemSelect?: () => void;
}

export function NavigationSearch({ adminPagesData, onItemSelect }: INavigationSearchProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const router = useRouter();
    const { setActiveItem } = useNavigationStore();

    // Build searchable items from all admin functions and pages
    const searchableItems = useMemo<ISearchableItem[]>(() => {
        const items: ISearchableItem[] = [];

        // Static admin functions
        const staticFunctions = [
            { id: 'dashboard', label: 'Dashboard', href: '/admin', icon: <IconSettings size={16} />, category: 'Admin', keywords: ['dashboard', 'overview', 'home'] },
            { id: 'users', label: 'Users', href: '/admin/users', icon: <IconUsers size={16} />, category: 'User Management', keywords: ['users', 'accounts', 'people'] },
            { id: 'groups', label: 'Groups', href: '/admin/groups', icon: <IconUsers size={16} />, category: 'User Management', keywords: ['groups', 'teams', 'permissions'] },
            { id: 'roles', label: 'Roles', href: '/admin/roles', icon: <IconUsers size={16} />, category: 'User Management', keywords: ['roles', 'permissions', 'access'] },
            { id: 'assets', label: 'Assets', href: '/admin/assets', icon: <IconPhoto size={16} />, category: 'Content', keywords: ['assets', 'files', 'media', 'images'] },
            { id: 'unused-sections', label: 'Unused Sections', href: '/admin/unused-sections', icon: <IconDatabase size={16} />, category: 'Content', keywords: ['unused', 'sections', 'cleanup'] },
            { id: 'actions', label: 'Actions', href: '/admin/actions', icon: <IconPlayerPlay size={16} />, category: 'Automation', keywords: ['actions', 'automation', 'triggers'] },
            { id: 'scheduled-jobs', label: 'Scheduled Jobs', href: '/admin/scheduled-jobs', icon: <IconPlayerPlay size={16} />, category: 'Automation', keywords: ['jobs', 'scheduled', 'cron', 'tasks'] },
            { id: 'data', label: 'Data Browser', href: '/admin/data', icon: <IconDatabase size={16} />, category: 'Data Management', keywords: ['data', 'database', 'tables', 'browse'] },
            { id: 'preferences', label: 'CMS Preferences', href: '/admin/preferences', icon: <IconSettings size={16} />, category: 'Configuration', keywords: ['preferences', 'settings', 'config'] },
            { id: 'cache', label: 'Cache Management', href: '/admin/cache', icon: <IconDatabase size={16} />, category: 'Configuration', keywords: ['cache', 'performance', 'memory'] },
        ];

        items.push(...staticFunctions);

        // Add dynamic pages from adminPagesData
        if (adminPagesData) {
            // Configuration pages
            adminPagesData.configurationPageLinks?.forEach((page: any) => {
                items.push({
                    id: `config-${page.keyword}`,
                    label: page.label,
                    href: `/admin/pages/${page.keyword}`,
                    icon: <IconSettings size={16} />,
                    category: 'Configuration Pages',
                    keywords: [page.label.toLowerCase(), page.keyword, 'configuration', 'config']
                });
            });

            // System pages
            const addSystemPages = (pages: any[], categoryName: string) => {
                pages.forEach((page: any) => {
                    items.push({
                        id: `system-${page.keyword}`,
                        label: page.label,
                        href: `/admin/pages/${page.keyword}`,
                        icon: <IconFile size={16} />,
                        category: `System - ${categoryName}`,
                        keywords: [page.label.toLowerCase(), page.keyword, 'system', categoryName.toLowerCase()]
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

            // Regular pages
            const addRegularPages = (pages: any[], categoryName: string) => {
                pages.forEach((page: any) => {
                    items.push({
                        id: `page-${page.keyword}`,
                        label: page.label,
                        href: `/admin/pages/${page.keyword}`,
                        icon: <IconFileText size={16} />,
                        category: `Pages - ${categoryName}`,
                        keywords: [page.label.toLowerCase(), page.keyword, 'page', categoryName.toLowerCase()]
                    });
                });
            };

            if (adminPagesData.categorizedRegularPages) {
                addRegularPages(adminPagesData.categorizedRegularPages.menu, 'Menu');
                addRegularPages(adminPagesData.categorizedRegularPages.footer, 'Footer');
                addRegularPages(adminPagesData.categorizedRegularPages.other, 'Other');
            }
        }

        return items;
    }, [adminPagesData]);

    // Filter items based on search query
    const filteredItems = useMemo(() => {
        if (!searchQuery.trim()) return [];

        const query = searchQuery.toLowerCase().trim();
        return searchableItems.filter(item => 
            item.label.toLowerCase().includes(query) ||
            item.category.toLowerCase().includes(query) ||
            item.keywords.some(keyword => keyword.includes(query))
        ).slice(0, 10); // Limit to 10 results for performance
    }, [searchableItems, searchQuery]);

    const handleItemClick = (item: ISearchableItem) => {
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
                        <ScrollArea.Autosize maxHeight={200}>
                            <Stack gap={1}>
                                <Text size="xs" c="dimmed" fw={500} tt="uppercase" px="xs" mb={2}>
                                    Search Results ({filteredItems.length})
                                </Text>
                                {filteredItems.map((item) => (
                                    <UnstyledButton
                                        key={item.id}
                                        onClick={() => handleItemClick(item)}
                                        px="xs"
                                        py={4}
                                        style={{
                                            borderRadius: 'var(--mantine-radius-xs)',
                                            border: '1px solid var(--mantine-color-gray-3)',
                                            transition: 'all 0.15s ease'
                                        }}
                                        styles={{
                                            root: {
                                                '&:hover': {
                                                    backgroundColor: 'var(--mantine-color-gray-0)',
                                                    borderColor: 'var(--mantine-color-blue-4)'
                                                }
                                            }
                                        }}
                                    >
                                        <Group gap="xs" wrap="nowrap">
                                            {item.icon}
                                            <Box style={{ flex: 1, minWidth: 0 }}>
                                                <Text size="xs" fw={500} truncate>
                                                    <Highlight highlight={searchQuery}>
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
                                No results found for "{searchQuery}"
                            </Text>
                        </Box>
                    )}
                </Box>
            )}
        </Box>
    );
}
