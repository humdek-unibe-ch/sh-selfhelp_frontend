/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
"use client";

import { useMemo, useState } from 'react';
import { ScrollArea, Group, Box, Text } from '@mantine/core';
import {
    IconDashboard,
    IconUsers,
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
    IconLayoutNavbar,
    IconLayoutBottombar,
    IconMenu2,
    IconLayoutGrid,
} from '@tabler/icons-react';
import { useAdminPages } from '../../../../../hooks/useAdminPages';
import { useAdminNavigationPreview } from '../../../../../hooks/useAdminNavigationPreview';
import { pageHasMenuMembership, buildMenuPreviewSectionLinks, type IAdminMenuPreviewLink } from '../../../../../utils/admin-navigation-membership';
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



    // Build navigation data as labelled sections: WORKSPACE (day-to-day
    // tools), PAGES (create + import + content/system/config page lists),
    // MENUS (one group per navigation menu, mirroring the menu builder), and
    // SYSTEM (automation, plugins, system tools). Every id is namespaced so
    // page ids can repeat across sections without React key collisions.
    const navigationSections = useMemo(() => {
        if (isLoading || !permissionChecker) return [];

        // Content-only pages (not in any public menu) from admin membership badges
        const configurationKeywords = new Set(configurationPageLinks?.map(p => p.keyword) || []);
        const contentPages = pages?.filter(page =>
            !pageHasMenuMembership(page.navigationMembership, 'web_header') &&
            !pageHasMenuMembership(page.navigationMembership, 'web_footer') &&
            !pageHasMenuMembership(page.navigationMembership, 'mobile_drawer') &&
            !pageHasMenuMembership(page.navigationMembership, 'mobile_bottom_tabs') &&
            !Boolean(page.is_system) &&
            !configurationKeywords.has(page.keyword)
        ) || [];

        type TNavbarItem = {
            label: string;
            icon?: React.ReactNode;
            link?: string;
            links?: IAdminMenuPreviewLink[];
            onClick?: () => void;
            initiallyOpened?: boolean;
            id: string;
        };
        const sections: Array<{ label: string | null; id: string; items: TNavbarItem[] }> = [];

        // --- Workspace ---------------------------------------------------
        const workspace: TNavbarItem[] = [{
            label: 'Dashboard',
            icon: <IconDashboard size={16} />,
            link: '/admin',
            id: 'dashboard',
        }];

        if (permissionChecker.canManageUsers()) {
            const userManagementLinks = [];
            if (permissionChecker.canReadUsers()) userManagementLinks.push({ label: 'Users', link: '/admin/users', id: 'nav:users' });
            if (permissionChecker.canReadGroups()) userManagementLinks.push({ label: 'Groups', link: '/admin/groups', id: 'nav:groups' });
            if (permissionChecker.canReadRoles()) userManagementLinks.push({ label: 'Roles', link: '/admin/roles', id: 'nav:roles' });
            if (permissionChecker.canReadRegistrationCodes()) userManagementLinks.push({ label: 'Registration Codes', link: '/admin/registration-codes', id: 'nav:registration-codes' });
            if (userManagementLinks.length > 0) {
                workspace.push({ label: 'User Management', icon: <IconUsers size={16} />, links: userManagementLinks, id: 'user-management' });
            }
        }

        if (permissionChecker.canManageAssets()) {
            const contentLinks = [];
            if (permissionChecker.canReadAssets()) contentLinks.push({ label: 'Assets', link: '/admin/assets', id: 'nav:assets' });
            if (permissionChecker.canDeleteSections()) contentLinks.push({ label: 'Unused Sections', link: '/admin/unused-sections', id: 'nav:unused-sections' });
            if (contentLinks.length > 0) {
                workspace.push({ label: 'Content', icon: <IconPhoto size={16} />, links: contentLinks, id: 'content' });
            }
        }

        sections.push({ label: null, id: 'workspace', items: workspace });

        // --- Pages ---------------------------------------------------------
        const pageItems: TNavbarItem[] = [];
        if (permissionChecker.canCreatePages()) {
            pageItems.push({
                label: 'Create Page',
                icon: <IconPlus size={16} />,
                link: '#',
                onClick: () => setIsCreatePageModalOpen(true),
                id: 'create-page',
            });
            // CMS app wizard — scaffolds list + detail pages, routes, sections
            // and ACLs in one safe transaction (see CmsAppWizardModal).
            pageItems.push({
                label: 'New CMS App',
                icon: <IconWand size={16} />,
                link: '#',
                onClick: () => setIsCmsAppWizardOpen(true),
                id: 'new-cms-app',
            });
        }
        // Page bundle export / import; backend enforces per-action permissions.
        if (permissionChecker.canReadPages()) {
            pageItems.push({
                label: 'Import / Export',
                icon: <IconTransfer size={16} />,
                link: '#',
                onClick: () => setIsExportImportOpen(true),
                id: 'pages-export-import',
            });
        }

        if (permissionChecker.canReadPages() && contentPages.length > 0) {
            // Nest child pages under their parent (when the parent is also a
            // content-only page) so related pages group together; pages whose
            // parent lives elsewhere (menus/system) stay at the root level.
            const contentIds = new Set(contentPages.map(page => page.id_pages));
            const buildContentLinks = (parentId: number | null): IAdminMenuPreviewLink[] =>
                contentPages
                    .filter(page => (parentId === null
                        ? page.id_parent_page === null || !contentIds.has(page.id_parent_page)
                        : page.id_parent_page === parentId))
                    .sort((a, b) => a.keyword.localeCompare(b.keyword))
                    .map(page => {
                        const children = buildContentLinks(page.id_pages);
                        return {
                            label: page.keyword,
                            link: `/admin/pages/${page.keyword}`,
                            id: `content:${page.id_pages}`,
                            selectable: true,
                            ...(children.length > 0 ? { links: children } : {}),
                        };
                    });
            pageItems.push({
                label: 'Content Pages',
                icon: <IconFileText size={16} />,
                links: buildContentLinks(null),
                id: 'content-pages',
            });
        }

        if (permissionChecker.canReadPages()) {
            // Deduped by keyword: a system page listed in two categories must
            // appear (and key) only once.
            const seenSystemKeywords = new Set<string>();
            const systemPageLinks = [
                ...(categorizedSystemPages?.authentication || []),
                ...(categorizedSystemPages?.profile || []),
                ...(categorizedSystemPages?.errors || []),
                ...(categorizedSystemPages?.legal || []),
                ...(categorizedSystemPages?.other || []),
            ].filter(page => {
                if (seenSystemKeywords.has(page.keyword)) return false;
                seenSystemKeywords.add(page.keyword);
                return true;
            }).map(page => ({
                label: page.label,
                link: `/admin/pages/${page.keyword}`,
                id: `system:${page.keyword}`,
            }));

            if (systemPageLinks.length > 0) {
                pageItems.push({
                    label: 'System Pages',
                    icon: <IconSettingsAutomation size={16} />,
                    links: systemPageLinks,
                    id: 'system-pages',
                });
            }
        }

        if (permissionChecker.canReadPages() && configurationPageLinks && configurationPageLinks.length > 0) {
            pageItems.push({
                label: 'Configuration',
                icon: <IconSettings size={16} />,
                links: configurationPageLinks.map(page => ({
                    label: page.label,
                    link: `/admin/pages/${page.keyword}`,
                    id: `config:${page.keyword}`,
                })),
                id: 'configuration',
            });
        }

        sections.push({ label: 'Pages', id: 'pages', items: pageItems });

        // --- Menus: one group per navigation menu (mirrors the builder) ----
        if (permissionChecker.canReadNavigation()) {
            const menuItems: TNavbarItem[] = [{
                label: 'Menu Builder',
                icon: <IconRoute size={16} />,
                link: '/admin/navigation',
                id: 'navigation-builder',
            }, {
                label: 'Web header',
                icon: <IconLayoutNavbar size={16} />,
                initiallyOpened: true,
                links: buildMenuPreviewSectionLinks(headerPreviewLinks, 'web_header'),
                id: 'menu-pages',
            }, {
                label: 'Web footer',
                icon: <IconLayoutBottombar size={16} />,
                links: buildMenuPreviewSectionLinks(footerPreviewLinks, 'web_footer'),
                id: 'footer-pages',
            }, {
                label: 'Mobile drawer',
                icon: <IconMenu2 size={16} />,
                links: buildMenuPreviewSectionLinks(mobileDrawerPreviewLinks, 'mobile_drawer'),
                id: 'mobile-drawer-pages',
            }, {
                label: 'Mobile bottom tabs',
                icon: <IconLayoutGrid size={16} />,
                links: buildMenuPreviewSectionLinks(mobileTabsPreviewLinks, 'mobile_bottom_tabs'),
                id: 'mobile-tabs-pages',
            }];

            sections.push({ label: 'Menus', id: 'menus', items: menuItems });
        }

        // --- System ---------------------------------------------------------
        const systemItems: TNavbarItem[] = [];
        if (permissionChecker.canManageActions() || permissionChecker.canManageScheduledJobs()) {
            const automationLinks = [];
            if (permissionChecker.canReadActions()) automationLinks.push({ label: 'Actions', link: '/admin/actions', id: 'nav:actions' });
            if (permissionChecker.canReadScheduledJobs()) {
                automationLinks.push({ label: 'Scheduled Jobs', link: '/admin/scheduled-jobs', id: 'nav:scheduled-jobs' });
                automationLinks.push({ label: 'Scheduled Jobs Calendar', link: '/admin/scheduled-jobs/calendar', id: 'nav:scheduled-jobs-calendar' });
            }
            if (automationLinks.length > 0) {
                systemItems.push({ label: 'Automation', icon: <IconPlayerPlay size={16} />, links: automationLinks, id: 'automation' });
            }
        }

        // Plugin-contributed menu items, each gated on its declared permission
        // so a viewer role does not see admin-only plugin links.
        const pluginMenuLinks = pluginMenuItems
            .filter((item) => !item.permission || hasPermission(item.permission))
            .sort((a, b) => (a.position?.order ?? 0) - (b.position?.order ?? 0))
            .map((item) => ({
                label: item.label,
                link: item.href ?? `/admin/plugins-host/${item.pluginId}/${item.key}`,
                id: `plugin:${item.pluginId}:${item.key}`,
            }));
        if (pluginMenuLinks.length > 0) {
            systemItems.push({ label: 'Plugins', icon: <IconPuzzle size={16} />, links: pluginMenuLinks, id: 'plugins' });
        }

        const systemToolLinks = [];
        if (permissionChecker.canManageLanguages()) systemToolLinks.push({ label: 'Languages', link: '/admin/languages', id: 'nav:languages' });
        if (permissionChecker.canAccessDataBrowser()) systemToolLinks.push({ label: 'Data Browser', link: '/admin/data', id: 'nav:data-browser' });
        if (permissionChecker.canViewAuditLogs()) systemToolLinks.push({ label: 'Audit Logs', link: '/admin/data-access', id: 'nav:audit-logs' });
        if (permissionChecker.canReadCache()) systemToolLinks.push({ label: 'Cache Management', link: '/admin/cache', id: 'nav:cache' });
        if (permissionChecker.canReadSystem()) systemToolLinks.push({ label: 'System Maintenance', link: '/admin/system', id: 'nav:system' });
        if (permissionChecker.canManagePlugins()) {
            systemToolLinks.push({ label: 'Plugin Management', link: '/admin/plugins', id: 'nav:plugin-management' });
        }
        if (systemToolLinks.length > 0) {
            systemItems.push({ label: 'System Tools', icon: <IconDatabase size={16} />, links: systemToolLinks, id: 'system-tools' });
        }

        if (systemItems.length > 0) {
            sections.push({ label: 'System', id: 'system', items: systemItems });
        }

        return sections;
    }, [pages, configurationPageLinks, categorizedSystemPages, isLoading, permissionChecker, pluginMenuItems, hasPermission, headerPreviewLinks, footerPreviewLinks, mobileDrawerPreviewLinks, mobileTabsPreviewLinks]);

    const links = navigationSections.map((section) => (
        <Box key={section.id} className={classes.section}>
            {section.label ? (
                <Text className={classes.sectionLabel} component="div">
                    {section.label}
                </Text>
            ) : null}
            {section.items.map((item) => <LinksGroup {...item} key={item.id} />)}
        </Box>
    ));

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
