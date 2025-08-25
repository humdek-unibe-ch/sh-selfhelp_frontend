"use client";

import { useMemo, useState } from 'react';
import { ScrollArea, Group, Code, Box } from '@mantine/core';
import { 
    IconDashboard,
    IconUsers, 
    IconFiles, 
    IconSettingsAutomation, 
    IconPhoto, 
    IconSettings, 
    IconClock, 
    IconDatabase,
    IconPlayerPlay,
    IconFileText,
    IconPlus
} from '@tabler/icons-react';
import { useAdminPages } from '../../../../../hooks/useAdminPages';
import { LinksGroup } from './components/LinksGroup';
import { UserButton } from './components/UserButton';
import { CreatePageModal } from '../../pages/create-page/CreatePage';
import { NavigationSearch } from './components/NavigationSearch';
import { SelfHelpLogo } from '../../../shared';
import classes from './AdminNavbar.module.css';

interface INavigationLink {
    label: string;
    link: string;
    links?: INavigationLink[];
    selectable?: boolean; // Flag to determine if parent item is clickable when it has children
    onClick?: () => void; // Optional click handler for custom actions
}

// Helper function to transform pages into navigation structure
function transformPagesToNavigation(pages: any[]): INavigationLink[] {
    return pages.map((page: any): INavigationLink => ({
        label: page.title || page.keyword,
        link: `/admin/pages/${page.keyword}`,
        links: page.children ? transformPagesToNavigation(page.children) : undefined,
        selectable: true // Page parent items are always selectable
    }));
}

export function AdminNavbar() {
    const { 
        pages,
        configurationPageLinks, 
        categorizedSystemPages, 
        categorizedRegularPages, 
        isLoading 
    } = useAdminPages();
    
    const [isCreatePageModalOpen, setIsCreatePageModalOpen] = useState(false);

    // Transform pages data for search component with full hierarchical structure
    const adminPagesData = useMemo(() => ({
        configurationPageLinks,
        categorizedSystemPages,
        categorizedRegularPages,
        // Add raw pages data for hierarchical search (cast to match expected format)
        allPages: pages?.map(page => ({
            keyword: page.keyword,
            title: page.title || undefined,
            nav_position: page.nav_position || undefined,
            footer_position: page.footer_position || undefined,
            is_system: Boolean(page.is_system),
            children: page.children?.map(child => ({
                keyword: child.keyword,
                title: child.title || undefined,
                children: child.children || []
            }))
        })) || []
    }), [configurationPageLinks, categorizedSystemPages, categorizedRegularPages, pages]);

    // Build navigation data structure
    const navigationData = useMemo(() => {
        if (isLoading) return [];

        // Get menu pages (pages that appear in website navigation)
        const menuPages = pages?.filter(page => 
            page.nav_position !== null && 
            page.nav_position !== undefined &&
            !Boolean(page.is_system)
        ).sort((a, b) => (a.nav_position || 0) - (b.nav_position || 0)) || [];

        // Get content pages (pages that don't appear in website navigation, excluding configuration pages)
        const configurationKeywords = new Set(configurationPageLinks?.map(p => p.keyword) || []);
        const contentPages = pages?.filter(page => 
            (page.nav_position === null || page.nav_position === undefined) &&
            (page.footer_position === null || page.footer_position === undefined) &&
            !Boolean(page.is_system) &&
            !configurationKeywords.has(page.keyword) // Exclude configuration pages
        ) || [];

        // Get footer pages
        const footerPages = pages?.filter(page =>
            page.footer_position !== null &&
            page.footer_position !== undefined &&
            !Boolean(page.is_system)
        ).sort((a, b) => (a.footer_position || 0) - (b.footer_position || 0)) || [];

        return [
            { 
                label: 'Dashboard', 
                icon: <IconDashboard size={16} />,
                link: '/admin'
            },
            {
                label: 'User Management',
                icon: <IconUsers size={16} />,
                links: [
                    { label: 'Users', link: '/admin/users' },
                    { label: 'Groups', link: '/admin/groups' },
                    { label: 'Roles', link: '/admin/roles' },
                ],
            },
            {
                label: 'Content',
                icon: <IconPhoto size={16} />,
                links: [
                    { label: 'Assets', link: '/admin/assets' },
                    { label: 'Unused Sections', link: '/admin/unused-sections' },
                ],
            },
            
            // PAGE CATEGORIES - All page categories together in requested order:
            // 1. Create Page functionality
            {
                label: 'Create Page',
                icon: <IconPlus size={16} />,
                link: '#',
                onClick: () => setIsCreatePageModalOpen(true)
            },
            // 2. Menu Pages section (pages that appear in website navigation)
            ...(menuPages.length > 0 ? [{
                label: 'Menu Pages',
                icon: <IconFiles size={16} />,
                initiallyOpened: true,
                links: transformPagesToNavigation(menuPages)
            }] : []),
            // 3. Footer Pages section (separate category for footer pages)
            ...(footerPages.length > 0 ? [{
                label: 'Footer Pages',
                icon: <IconFiles size={16} />,
                links: footerPages.map(page => ({
                    label: page.title || page.keyword,
                    link: `/admin/pages/${page.keyword}`
                }))
            }] : []),
            // 4. Content Pages section (pages that don't appear in website navigation)
            ...(contentPages.length > 0 ? [{
                label: 'Content Pages',
                icon: <IconFileText size={16} />,
                links: contentPages.map(page => ({
                    label: page.title || page.keyword,
                    link: `/admin/pages/${page.keyword}`
                }))
            }] : []),
            // 5. System pages
            {
                label: 'System Pages',
                icon: <IconSettingsAutomation size={16} />,
                links: [
                    // Authentication pages
                    ...(categorizedSystemPages?.authentication || []).map(page => ({
                        label: page.label,
                        link: `/admin/pages/${page.keyword}`
                    })),
                    // Profile pages
                    ...(categorizedSystemPages?.profile || []).map(page => ({
                        label: page.label,
                        link: `/admin/pages/${page.keyword}`
                    })),
                    // Error pages
                    ...(categorizedSystemPages?.errors || []).map(page => ({
                        label: page.label,
                        link: `/admin/pages/${page.keyword}`
                    })),
                    // Legal pages
                    ...(categorizedSystemPages?.legal || []).map(page => ({
                        label: page.label,
                        link: `/admin/pages/${page.keyword}`
                    })),
                    // Other system pages
                    ...(categorizedSystemPages?.other || []).map(page => ({
                        label: page.label,
                        link: `/admin/pages/${page.keyword}`
                    })),
                ],
            },
            
            // Configuration pages (separate from page categories)
            ...(configurationPageLinks && configurationPageLinks.length > 0 
                ? [{
                    label: 'Configuration',
                    icon: <IconSettings size={16} />,
                    links: configurationPageLinks.map(page => ({
                        label: page.label,
                        link: `/admin/pages/${page.keyword}`
                    }))
                }] 
                : []
            ),
            {
                label: 'Automation',
                icon: <IconPlayerPlay size={16} />,
                links: [
                    { label: 'Actions', link: '/admin/actions' },
                    { label: 'Scheduled Jobs', link: '/admin/scheduled-jobs' },
                ],
            },
            {
                label: 'System Tools',
                icon: <IconDatabase size={16} />,
                links: [
                    { label: 'Data Browser', link: '/admin/data' },
                    { label: 'CMS Preferences', link: '/admin/preferences' },
                    { label: 'Cache Management', link: '/admin/cache' },
                ],
            },
        ];
    }, [pages, configurationPageLinks, categorizedSystemPages, categorizedRegularPages, isLoading]);

    const links = navigationData.map((item) => <LinksGroup {...item} key={item.label} />);

    return (
        <nav className={classes.navbar}>
            {/* Navigation Header */}
            <Box p="md" style={{ borderBottom: '1px solid var(--mantine-color-gray-3)' }}>
                <Group gap="md" align="center" mb="md">
                    <SelfHelpLogo size={30} />
                    <Code fw={700}>v3.1.2</Code>
                </Group>
                
                <NavigationSearch 
                    adminPagesData={adminPagesData}
                    onItemSelect={() => {}} // Navigation search handles routing internally
                />
            </Box>

            <ScrollArea className={classes.links} scrollbars="y">
                <div className={classes.linksInner}>{links}</div>
            </ScrollArea>

            <div className={classes.footer}>
                <UserButton />
            </div>
            
            <CreatePageModal
                opened={isCreatePageModalOpen}
                onClose={() => setIsCreatePageModalOpen(false)}
            />
        </nav>
    );
}
