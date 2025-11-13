"use client";

import { useMemo, useState } from 'react';
import { ScrollArea, Group, Code, Box, Text, Badge } from '@mantine/core';
import {
    IconDashboard,
    IconUsers,
    IconFiles,
    IconSettingsAutomation,
    IconPhoto,
    IconSettings,
    IconDatabase,
    IconPlayerPlay,
    IconFileText,
    IconPlus,
} from '@tabler/icons-react';
import { useAdminPages } from '../../../../../hooks/useAdminPages';
import { useAuth } from '../../../../../hooks/useAuth';
import { LinksGroup } from './components/LinksGroup';
import { UserButton } from './components/UserButton';
import { CreatePageModal } from '../../pages/create-page/CreatePage';
import { NavigationSearch } from './components/NavigationSearch';
import { SelfHelpLogo, PreviewModeToggle } from '../../../shared';
import classes from './AdminNavbar.module.css';

interface INavigationLink {
    label: string;
    link: string;
    links?: INavigationLink[];
    selectable?: boolean; // Flag to determine if parent item is clickable when it has children
    onClick?: () => void; // Optional click handler for custom actions
    id?: number | string;
}

// Helper function to transform pages into navigation structure (supports hierarchical structure)
function transformPagesToNavigation(pages: any[]): INavigationLink[] {
    return pages.map((page: any): INavigationLink => ({
        label: page.keyword, // Use keyword since title field no longer exists
        link: `/admin/pages/${page.keyword}`,
        links: page.children && page.children.length > 0
            ? transformPagesToNavigation(page.children)
            : undefined, // Handle children recursively
        selectable: true, // Page items are always selectable
        id: page.id_pages
    }));
}

export function AdminNavbar() {
    const {
        pages,
        configurationPageLinks,
        categorizedSystemPages,
        categorizedRegularPages,
        hierarchicalPages,
        isLoading
    } = useAdminPages();

    const { permissionChecker } = useAuth();

    const [isCreatePageModalOpen, setIsCreatePageModalOpen] = useState(false);

    // Transform pages data for search component (flat structure now)
    const adminPagesData = useMemo(() => ({
        configurationPageLinks,
        categorizedSystemPages,
        categorizedRegularPages,
        // Add raw pages data for search (cast to match expected format)
        allPages: pages?.map(page => ({
            keyword: page.keyword,
            title: page.keyword, // Use keyword since title field no longer exists
            nav_position: page.nav_position || undefined,
            footer_position: page.footer_position || undefined,
            is_system: Boolean(page.is_system), 
            children: [] // No children in new flat structure
        })) || []
    }), [configurationPageLinks, categorizedSystemPages, categorizedRegularPages, pages]);



    // Build navigation data structure
    const navigationData = useMemo(() => {
        if (isLoading || !permissionChecker) return [];

        // Get menu pages (pages that appear in website navigation) from hierarchical data
        const menuPages = hierarchicalPages?.filter(page =>
            page.nav_position !== null &&
            page.nav_position !== undefined &&
            !Boolean(page.is_system)
        ).sort((a, b) => (a.nav_position || 0) - (b.nav_position || 0)) || [];


        // Get content pages (pages that don't appear in website navigation, excluding configuration pages and system pages)
        const configurationKeywords = new Set(configurationPageLinks?.map(p => p.keyword) || []);
        const contentPages = pages?.filter(page =>
            (page.nav_position === null || page.nav_position === undefined) &&
            (page.footer_position === null || page.footer_position === undefined) &&
            !Boolean(page.is_system) && // Exclude system pages
            !configurationKeywords.has(page.keyword) // Exclude configuration pages
        ) || [];


        // Get footer pages
        const footerPages = pages?.filter(page =>
            page.footer_position !== null &&
            page.footer_position !== undefined &&
            !Boolean(page.is_system)
        ).sort((a, b) => (a.footer_position || 0) - (b.footer_position || 0)) || [];

        const menuItems = [];

        // Dashboard - always visible for admin users
        menuItems.push({
            label: 'Dashboard',
            icon: <IconDashboard size={16} />,
            link: '/admin',
            id: 'dashboard'
        });

        // User Management - check if user can manage users
        if (permissionChecker.canManageUsers()) {
            const userManagementLinks = [];
            if (permissionChecker.canReadUsers()) userManagementLinks.push({ label: 'Users', link: '/admin/users' });
            if (permissionChecker.canReadGroups()) userManagementLinks.push({ label: 'Groups', link: '/admin/groups' });
            if (permissionChecker.canReadRoles()) userManagementLinks.push({ label: 'Roles', link: '/admin/roles' });

            if (userManagementLinks.length > 0) {
                menuItems.push({
                    label: 'User Management',
                    icon: <IconUsers size={16} />,
                    links: userManagementLinks,
                    id: 'user-management'
                });
            }
        }

        // Content - check if user can manage assets
        if (permissionChecker.canManageAssets()) {
            const contentLinks = [];
            if (permissionChecker.canReadAssets()) contentLinks.push({ label: 'Assets', link: '/admin/assets' });
            if (permissionChecker.canDeleteSections()) contentLinks.push({ label: 'Unused Sections', link: '/admin/unused-sections' });

            if (contentLinks.length > 0) {
                menuItems.push({
                    label: 'Content',
                    icon: <IconPhoto size={16} />,
                    links: contentLinks,
                    id: 'content'
                });
            }
        }

        // PAGE CATEGORIES - All page categories together in requested order:
        // 1. Create Page functionality - check if user can create pages
        if (permissionChecker.canCreatePages()) {
            menuItems.push({
                label: 'Create Page',
                icon: <IconPlus size={16} />,
                link: '#',
                onClick: () => setIsCreatePageModalOpen(true),
                id: 'create-page'
            });
        }

        // 2. Menu Pages section (pages that appear in website navigation) - check if user can read pages
        if (permissionChecker.canReadPages() && menuPages.length > 0) {
            menuItems.push({
                label: 'Menu Pages',
                icon: <IconFiles size={16} />,
                initiallyOpened: true,
                links: transformPagesToNavigation(menuPages),
                id: 'menu-pages'
            });
        }

        // 3. Footer Pages section (separate category for footer pages) - check if user can read pages
        if (permissionChecker.canReadPages() && footerPages.length > 0) {
            menuItems.push({
                label: 'Footer Pages',
                icon: <IconFiles size={16} />,
                links: footerPages.map(page => ({
                    label: page.keyword, // Use keyword since title field no longer exists
                    link: `/admin/pages/${page.keyword}`,
                    id: page.id_pages
                })),
                id: 'footer-pages'
            });
        }

        // 4. Content Pages section (pages that don't appear in website navigation) - check if user can read pages
        if (permissionChecker.canReadPages() && contentPages.length > 0) {
            menuItems.push({
                label: 'Content Pages',
                icon: <IconFileText size={16} />,
                links: contentPages.map(page => ({
                    label: page.keyword, // Use keyword since title field no longer exists
                    link: `/admin/pages/${page.keyword}`,
                    id: page.id_pages
                })),
                id: 'content-pages'
            });
        }

        // 5. System pages - check if user can read pages
        if (permissionChecker.canReadPages()) {
            const systemPageLinks = [
                // Authentication pages
                ...(categorizedSystemPages?.authentication || []).map(page => ({
                    label: page.label,
                    link: `/admin/pages/${page.keyword}`,
                    id: page.id
                })),
                // Profile pages
                ...(categorizedSystemPages?.profile || []).map(page => ({
                    label: page.label,
                    link: `/admin/pages/${page.keyword}`,
                    id: page.id
                })),
                // Error pages
                ...(categorizedSystemPages?.errors || []).map(page => ({
                    label: page.label,
                    link: `/admin/pages/${page.keyword}`,
                    id: page.id
                })),
                // Legal pages
                ...(categorizedSystemPages?.legal || []).map(page => ({
                    label: page.label,
                    link: `/admin/pages/${page.keyword}`,
                    id: page.id
                })),
                // Other system pages
                ...(categorizedSystemPages?.other || []).map(page => ({
                    label: page.label,
                    link: `/admin/pages/${page.keyword}`,
                    id: page.id
                })),
            ];

            if (systemPageLinks.length > 0) {
                menuItems.push({
                    label: 'System Pages',
                    icon: <IconSettingsAutomation size={16} />,
                    links: systemPageLinks,
                    id: 'system-pages'
                });
            }
        }

        // Configuration pages (separate from page categories) - check if user can read pages
        if (permissionChecker.canReadPages() && configurationPageLinks && configurationPageLinks.length > 0) {
            menuItems.push({
                label: 'Configuration',
                icon: <IconSettings size={16} />,
                links: configurationPageLinks.map(page => ({
                    label: page.label,
                    link: `/admin/pages/${page.keyword}`,
                    id: page.id
                })),
                id: 'configuration'
            });
        }

        // Automation - check if user can manage actions or scheduled jobs
        if (permissionChecker.canManageActions() || permissionChecker.canManageScheduledJobs()) {
            const automationLinks = [];
            if (permissionChecker.canReadActions()) automationLinks.push({ label: 'Actions', link: '/admin/actions' });
            if (permissionChecker.canReadScheduledJobs()) automationLinks.push({ label: 'Scheduled Jobs', link: '/admin/scheduled-jobs' });

            if (automationLinks.length > 0) {
                menuItems.push({
                    label: 'Automation',
                    icon: <IconPlayerPlay size={16} />,
                    links: automationLinks,
                    id: 'automation'
                });
            }
        }

        // System Tools - check various permissions
        const systemToolLinks = [];
        if (permissionChecker.canManageLanguages()) systemToolLinks.push({ label: 'Languages', link: '/admin/languages' });
        if (permissionChecker.canAccessDataBrowser()) systemToolLinks.push({ label: 'Data Browser', link: '/admin/data' });
        if (permissionChecker.canViewAuditLogs()) systemToolLinks.push({ label: 'Audit Logs', link: '/admin/data-access' });
        if (permissionChecker.canReadCmsPreferences()) systemToolLinks.push({ label: 'CMS Preferences', link: '/admin/preferences' });
        if (permissionChecker.canReadCache()) systemToolLinks.push({ label: 'Cache Management', link: '/admin/cache' });

        if (systemToolLinks.length > 0) {
            menuItems.push({
                label: 'System Tools',
                icon: <IconDatabase size={16} />,
                links: systemToolLinks,
                id: 'system-tools'
            });
        }

        return menuItems;
    }, [pages, configurationPageLinks, categorizedSystemPages, categorizedRegularPages, isLoading, permissionChecker]);

    const links = navigationData.map((item) => <LinksGroup {...item} key={item.id || item.label} />);

    return (
        <nav className={classes.navbar}>
            {/* Navigation Header */}
            <Box p="md" className="border-b border-gray-3">
                <Group gap="md" align="center" mb="md">
                    <SelfHelpLogo size={30} />
                    <Code fw={700}>v3.1.2</Code>
                </Group>

                <Box mb="md">
                    <PreviewModeToggle showLabel={false} />
                </Box>

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
