/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
"use client";

import { useMemo, useState } from 'react';
import { ScrollArea, Group, Box } from '@mantine/core';
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
    IconPuzzle,
    IconWand,
    IconTransfer,
    IconRoute,
} from '@tabler/icons-react';
import { useAdminPages } from '../../../../../hooks/useAdminPages';
import { useAdminNavigationPreview } from '../../../../../hooks/useAdminNavigationPreview';
import { pageHasMenuMembership, buildMenuPreviewSectionLinks } from '../../../../../utils/admin-navigation-membership';
import { useAuth } from '../../../../../hooks/useAuth';
import { usePluginMenuItems } from '../../../frontend/plugin-runtime/PluginsProvider';
import { LinksGroup } from './components/LinksGroup';
import { CreatePageModal } from '../../pages/create-page/CreatePage';
import { CmsAppWizardModal } from '../../pages/admin-pages-list/CmsAppWizardModal';
import { PageExportImportModal } from '../../pages/admin-pages-list/PageExportImportModal';
import { SelfHelpLogo, PreviewModeToggle, AuthButton } from '../../../shared';
import classes from './AdminNavbar.module.css';
import { NavigationSearch } from './components';

export function AdminNavbar() {
    const {
        pages,
        configurationPageLinks,
        categorizedSystemPages,
        categorizedRegularPages,
        isLoading
    } = useAdminPages();

    const { permissionChecker, hasPermission } = useAuth();
    const pluginMenuItems = usePluginMenuItems();
    const { data: headerPreviewLinks = [] } = useAdminNavigationPreview('web_header');
    const { data: footerPreviewLinks = [] } = useAdminNavigationPreview('web_footer');
    const { data: mobileDrawerPreviewLinks = [] } = useAdminNavigationPreview('mobile_drawer');
    const { data: mobileTabsPreviewLinks = [] } = useAdminNavigationPreview('mobile_bottom_tabs');

    const [isCreatePageModalOpen, setIsCreatePageModalOpen] = useState(false);
    const [isCmsAppWizardOpen, setIsCmsAppWizardOpen] = useState(false);
    const [isExportImportOpen, setIsExportImportOpen] = useState(false);

    // Transform pages data for search component (flat structure now)
    const adminPagesData = useMemo(() => ({
        configurationPageLinks,
        categorizedSystemPages,
        categorizedRegularPages,
        // Add raw pages data for search (cast to match expected format)
        allPages: pages?.map(page => ({
            keyword: page.keyword,
            title: page.keyword,
            navigationMembership: page.navigationMembership ?? [],
            is_system: Boolean(page.is_system),
            children: [],
        })) || []
    }), [configurationPageLinks, categorizedSystemPages, categorizedRegularPages, pages]);



    // Build navigation data structure
    const navigationData = useMemo(() => {
        if (isLoading || !permissionChecker) return [];

        // Get content-only pages (not in any public menu) from admin membership badges
        const configurationKeywords = new Set(configurationPageLinks?.map(p => p.keyword) || []);
        const contentPages = pages?.filter(page =>
            !pageHasMenuMembership(page.navigationMembership, 'web_header') &&
            !pageHasMenuMembership(page.navigationMembership, 'web_footer') &&
            !pageHasMenuMembership(page.navigationMembership, 'mobile_drawer') &&
            !pageHasMenuMembership(page.navigationMembership, 'mobile_bottom_tabs') &&
            !Boolean(page.is_system) &&
            !configurationKeywords.has(page.keyword)
        ) || [];

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
            if (permissionChecker.canReadRegistrationCodes()) userManagementLinks.push({ label: 'Registration Codes', link: '/admin/registration-codes' });

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

        // CMS app wizard — scaffolds list + detail pages, routes, sections and
        // ACLs in one safe transaction (see CmsAppWizardModal / CmsAppWizardService).
        if (permissionChecker.canCreatePages()) {
            menuItems.push({
                label: 'New CMS App',
                icon: <IconWand size={16} />,
                link: '#',
                onClick: () => setIsCmsAppWizardOpen(true),
                id: 'new-cms-app'
            });
        }

        // Page bundle export / import (single page, multiple selected pages, or a
        // related-page bundle). Backend enforces per-action permissions.
        if (permissionChecker.canReadPages()) {
            menuItems.push({
                label: 'Import / Export',
                icon: <IconTransfer size={16} />,
                link: '#',
                onClick: () => setIsExportImportOpen(true),
                id: 'pages-export-import'
            });
        }

        // Navigation menu builder sections (resolved menu preview trees)
        if (permissionChecker.canReadNavigation()) {
            menuItems.push({
                label: 'Navigation',
                icon: <IconRoute size={16} />,
                link: '/admin/navigation',
                id: 'navigation-builder',
            });
        }

        // 2. Web header — resolved menu-builder preview only (empty → link to builder)
        if (permissionChecker.canReadNavigation()) {
            menuItems.push({
                label: 'Web header',
                icon: <IconFiles size={16} />,
                initiallyOpened: true,
                links: buildMenuPreviewSectionLinks(headerPreviewLinks, 'web_header'),
                id: 'menu-pages'
            });
        }

        // 3. Web footer — resolved menu-builder preview only
        if (permissionChecker.canReadNavigation()) {
            menuItems.push({
                label: 'Web footer',
                icon: <IconFiles size={16} />,
                links: buildMenuPreviewSectionLinks(footerPreviewLinks, 'web_footer'),
                id: 'footer-pages'
            });
        }

        if (permissionChecker.canReadNavigation()) {
            menuItems.push({
                label: 'Mobile drawer',
                icon: <IconFiles size={16} />,
                links: buildMenuPreviewSectionLinks(mobileDrawerPreviewLinks, 'mobile_drawer'),
                id: 'mobile-drawer-pages',
            });
        }

        if (permissionChecker.canReadNavigation()) {
            menuItems.push({
                label: 'Mobile bottom tabs',
                icon: <IconFiles size={16} />,
                links: buildMenuPreviewSectionLinks(mobileTabsPreviewLinks, 'mobile_bottom_tabs'),
                id: 'mobile-tabs-pages',
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
            if (permissionChecker.canReadScheduledJobs()) {
                automationLinks.push({ label: 'Scheduled Jobs', link: '/admin/scheduled-jobs' });
                automationLinks.push({ label: 'Scheduled Jobs Calendar', link: '/admin/scheduled-jobs/calendar'});
                };

            if (automationLinks.length > 0) {
                menuItems.push({
                    label: 'Automation',
                    icon: <IconPlayerPlay size={16} />,
                    links: automationLinks,
                    id: 'automation'
                });
            }
        }

        // Plugin-contributed menu items. Each entry comes from a plugin's
        // `register()` registration (`menuItems`) inside its ESM bundle.
        // We gate every entry on its declared `permission` so a viewer
        // role does not see admin-only plugin links. The plugin menu
        // appears just above "System Tools" — close to the related
        // "Plugin Management" link inside System Tools, but kept as a
        // top-level group so users do not have to expand a nested menu
        // to reach the plugin pages they use day-to-day.
        const pluginMenuLinks = pluginMenuItems
            .filter((item) => !item.permission || hasPermission(item.permission))
            .sort((a, b) => (a.position?.order ?? 0) - (b.position?.order ?? 0))
            .map((item) => ({
                label: item.label,
                link: item.href ?? `/admin/plugins-host/${item.pluginId}/${item.key}`,
                id: `${item.pluginId}:${item.key}`,
            }));

        if (pluginMenuLinks.length > 0) {
            menuItems.push({
                label: 'Plugins',
                icon: <IconPuzzle size={16} />,
                links: pluginMenuLinks,
                id: 'plugins',
            });
        }

        // System Tools - check various permissions
        const systemToolLinks = [];
        if (permissionChecker.canManageLanguages()) systemToolLinks.push({ label: 'Languages', link: '/admin/languages' });
        if (permissionChecker.canAccessDataBrowser()) systemToolLinks.push({ label: 'Data Browser', link: '/admin/data' });
        if (permissionChecker.canViewAuditLogs()) systemToolLinks.push({ label: 'Audit Logs', link: '/admin/data-access' });
        if (permissionChecker.canReadCache()) systemToolLinks.push({ label: 'Cache Management', link: '/admin/cache' });
        if (permissionChecker.canReadSystem()) systemToolLinks.push({ label: 'System Maintenance', link: '/admin/system' });
        // Plugin Management lives under System Tools (with its own
        // permission gate) so the sidebar stays compact. The dedicated
        // plugin detail page is reachable at /admin/plugins/<id>.
        if (permissionChecker.canManagePlugins()) {
            systemToolLinks.push({ label: 'Plugin Management', link: '/admin/plugins' });
        }

        if (systemToolLinks.length > 0) {
            menuItems.push({
                label: 'System Tools',
                icon: <IconDatabase size={16} />,
                links: systemToolLinks,
                id: 'system-tools'
            });
        }

        return menuItems;
    }, [pages, configurationPageLinks, categorizedSystemPages, isLoading, permissionChecker, pluginMenuItems, hasPermission, headerPreviewLinks, footerPreviewLinks, mobileDrawerPreviewLinks, mobileTabsPreviewLinks]);

    const links = navigationData.map((item) => <LinksGroup {...item} key={item.id || item.label} />);

    return (
        <nav className={classes.navbar}>
            {/* Navigation Header */}
            <Box p="md" className="border-b border-gray-3">
                <Group gap="md" align="center" mb="md">
                    <SelfHelpLogo size={30} />
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
                <AuthButton variant="navbar" />
            </div>
            
            <CreatePageModal
                opened={isCreatePageModalOpen}
                onClose={() => setIsCreatePageModalOpen(false)}
            />

            <CmsAppWizardModal
                opened={isCmsAppWizardOpen}
                onClose={() => setIsCmsAppWizardOpen(false)}
            />

            <PageExportImportModal
                opened={isExportImportOpen}
                onClose={() => setIsExportImportOpen(false)}
                pages={pages ?? []}
            />
        </nav>
    );
}
