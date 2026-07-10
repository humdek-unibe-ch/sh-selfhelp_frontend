/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
"use client";

import { useMemo, useState, useEffect } from 'react';
import { ScrollArea, Group, Box, Accordion, ActionIcon, Tooltip, Text } from '@mantine/core';
import {
    IconDashboard,
    IconSettingsAutomation,
    IconPhoto,
    IconSettings,
    IconDatabase,
    IconPlayerPlay,
    IconFileText,
    IconPlus,
    IconPuzzle,
    IconTransfer,
    IconRoute,
    IconLayoutNavbar,
    IconLayoutBottombar,
    IconMenu2,
    IconLayoutGrid,
    IconFiles,
    IconShieldLock,
    IconApps,
} from '@tabler/icons-react';
import { useRouter, usePathname } from 'next/navigation';
import { useAdminPages } from '../../../../../hooks/useAdminPages';
import { useCmsAppsQuery } from '../../../../../hooks/useCmsApps';
import { useAdminNavigationPreview } from '../../../../../hooks/useAdminNavigationPreview';
import { pageHasMenuMembership, buildMenuPreviewSectionLinks, type IAdminMenuPreviewLink } from '../../../../../utils/admin-navigation-membership';
import { useAuth } from '../../../../../hooks/useAuth';
import { usePluginMenuItems } from '../../../frontend/plugin-runtime/PluginsProvider';
import { LinksGroup, NavDirectLink } from './components/LinksGroup';
import { CreatePageModal } from '../../pages/create-page/CreatePage';
import { CreateCmsAppModal } from '../../cms-apps/CreateCmsAppModal';
import { PageExportImportModal } from '../../pages/admin-pages-list/PageExportImportModal';
import {
    cmsAppConfigPath,
    cmsAppContentPath,
    isCmsSurfaceAdminPage,
} from '../../cms-apps/cmsAppPages.utils';
import { SelfHelpLogo, PreviewModeToggle, AuthButton } from '../../../shared';
import classes from './AdminNavbar.module.css';
import { NavigationSearch } from './components';

/** True only after the first client commit — keeps SSR and hydration markup aligned. */
function useAdminNavMounted(): boolean {
    const [mounted, setMounted] = useState(false);
    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- defer persisted nav chrome until after hydration
        setMounted(true);
    }, []);
    return mounted;
}

/** One item inside an accordion group panel. */
type TNavbarItem = {
    label: string;
    icon?: React.ReactNode;
    link?: string;
    links?: IAdminMenuPreviewLink[];
    onClick?: () => void;
    initiallyOpened?: boolean;
    id: string;
};

/** One accordion group with optional quick actions rendered in the control row. */
type TNavbarGroup = {
    id: string;
    label: string;
    icon: React.ReactNode;
    items: TNavbarItem[];
    actions?: Array<{ id: string; label: string; icon: React.ReactNode; onClick: () => void }>;
};

const ACCORDION_STORAGE_KEY = 'admin-navbar-accordion-open';
const DEFAULT_OPEN_GROUPS = ['cms-apps', 'pages', 'menus'];

/** Accordion open state persisted across sessions (read after mount only). */
function usePersistedAccordion(): readonly [string[], (value: string[]) => void] {
    const navMounted = useAdminNavMounted();
    const [value, setValue] = useState<string[]>(DEFAULT_OPEN_GROUPS);

    useEffect(() => {
        if (!navMounted) return;
        try {
            const stored = localStorage.getItem(ACCORDION_STORAGE_KEY);
            if (stored !== null) {
                const parsed = JSON.parse(stored) as unknown;
                if (Array.isArray(parsed) && parsed.every((v) => typeof v === 'string')) {
                    // eslint-disable-next-line react-hooks/set-state-in-effect -- restore persisted accordion after hydration
                    setValue(parsed);
                }
            }
        } catch {
            // Corrupt value — keep defaults.
        }
    }, [navMounted]);

    const update = (next: string[]) => {
        setValue(next);
        try {
            localStorage.setItem(ACCORDION_STORAGE_KEY, JSON.stringify(next));
        } catch {
            // Quota / private mode — best-effort.
        }
    };

    return [value, update] as const;
}

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
    const router = useRouter();
    const pathname = usePathname();
    const { data: headerPreviewLinks = [] } = useAdminNavigationPreview('web_header');
    const { data: footerPreviewLinks = [] } = useAdminNavigationPreview('web_footer');
    const { data: mobileDrawerPreviewLinks = [] } = useAdminNavigationPreview('mobile_drawer');
    const { data: mobileTabsPreviewLinks = [] } = useAdminNavigationPreview('mobile_bottom_tabs');

    const { data: cmsApps = [] } = useCmsAppsQuery(permissionChecker?.canReadCmsApps() ?? false);

    const [isCreatePageModalOpen, setIsCreatePageModalOpen] = useState(false);
    const [isCreateCmsAppOpen, setIsCreateCmsAppOpen] = useState(false);
    const [isExportImportOpen, setIsExportImportOpen] = useState(false);
    const [isCmsAppsImportOpen, setIsCmsAppsImportOpen] = useState(false);
    const [cmsAppsImportTab, setCmsAppsImportTab] = useState<'export' | 'import' | 'examples'>('examples');
    const [openGroups, setOpenGroups] = usePersistedAccordion();
    const navMounted = useAdminNavMounted();

    // Search index: pages searchable by keyword AND by their titles in every
    // language (the menu shows titles, so search must match them too).
    const adminPagesData = useMemo(() => ({
        configurationPageLinks,
        categorizedSystemPages,
        categorizedRegularPages,
        allPages: pages?.map(page => ({
            keyword: page.keyword,
            title: page.title ?? page.keyword,
            titles: page.titles ?? [],
            navigationMembership: page.navigationMembership ?? [],
            is_system: Boolean(page.is_system),
            children: [],
        })) || []
    }), [configurationPageLinks, categorizedSystemPages, categorizedRegularPages, pages]);

    // Build the accordion groups: PAGES (content/system/config page lists with
    // create/wizard/import quick actions), MENUS (one sub-group per navigation
    // menu, mirroring the menu builder), USERS & ACCESS, CONTENT, AUTOMATION and
    // SYSTEM. Every id is namespaced so page ids can repeat across groups
    // without React key collisions.
    const navbarGroups = useMemo<TNavbarGroup[]>(() => {
        if (isLoading || !permissionChecker) return [];

        const configurationKeywords = new Set(configurationPageLinks?.map(p => p.keyword) || []);
        // Content Pages: public frontend pages only. Admin CMS-surface pages
        // (cms_list / form / cms_detail) live under CMS Apps; public_list /
        // public_detail stay here for structure editing.
        const contentPages = pages?.filter(page =>
            !isCmsSurfaceAdminPage(page) &&
            !pageHasMenuMembership(page.navigationMembership, 'web_header') &&
            !pageHasMenuMembership(page.navigationMembership, 'web_footer') &&
            !pageHasMenuMembership(page.navigationMembership, 'mobile_drawer') &&
            !pageHasMenuMembership(page.navigationMembership, 'mobile_bottom_tabs') &&
            !Boolean(page.is_system) &&
            !configurationKeywords.has(page.keyword)
        ) || [];

        const groups: TNavbarGroup[] = [];

        // --- CMS Apps: content lists (editors) + App configs (structure) ------
        if (permissionChecker.canReadCmsApps()) {
            const cmsAppActions: TNavbarGroup['actions'] = [];
            if (permissionChecker.canCreateCmsApps()) {
                cmsAppActions.push({
                    id: 'create-cms-app',
                    label: 'Create CMS app',
                    icon: <IconPlus size={15} />,
                    onClick: () => setIsCreateCmsAppOpen(true),
                });
            }
            if (permissionChecker.canCreatePages()) {
                cmsAppActions.push({
                    id: 'cms-apps-import-template',
                    label: 'Import template',
                    icon: <IconTransfer size={15} />,
                    onClick: () => {
                        setCmsAppsImportTab('examples');
                        setIsCmsAppsImportOpen(true);
                    },
                });
            }
            groups.push({
                id: 'cms-apps',
                label: 'CMS Apps',
                icon: <IconApps size={17} />,
                actions: cmsAppActions,
                items: [
                    {
                        label: 'All apps',
                        link: '/admin/cms-apps',
                        id: 'cms-apps:index',
                        icon: <IconApps size={16} />,
                    },
                    ...cmsApps
                        .filter((app) => Boolean(app.cms_list_keyword || app.id_cms_list_page))
                        .map((app) => ({
                            label: app.name,
                            link: cmsAppContentPath(app.slug),
                            id: `cms-app-content:${app.id}`,
                        })),
                ],
            });
            groups.push({
                id: 'cms-app-configs',
                label: 'App configs',
                icon: <IconSettings size={17} />,
                items: [
                    {
                        label: 'All apps',
                        link: '/admin/cms-apps',
                        id: 'cms-app-configs:index',
                        icon: <IconApps size={16} />,
                    },
                    ...cmsApps.map((app) => ({
                        label: app.name,
                        link: cmsAppConfigPath(app.slug),
                        id: `cms-app-config:${app.id}`,
                    })),
                ],
            });
        }

        // --- Pages -----------------------------------------------------------
        const pageItems: TNavbarItem[] = [];
        const pageActions: TNavbarGroup['actions'] = [];
        if (permissionChecker.canCreatePages()) {
            pageActions.push({
                id: 'create-page',
                label: 'Create page',
                icon: <IconPlus size={15} />,
                onClick: () => setIsCreatePageModalOpen(true),
            });
        }
        // Page bundle export / import; backend enforces per-action permissions.
        if (permissionChecker.canReadPages()) {
            pageActions.push({
                id: 'pages-export-import',
                label: 'Import / export pages',
                icon: <IconTransfer size={15} />,
                onClick: () => setIsExportImportOpen(true),
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

        if (pageItems.length > 0 || pageActions.length > 0) {
            groups.push({
                id: 'pages',
                label: 'Pages',
                icon: <IconFiles size={17} />,
                items: pageItems,
                actions: pageActions,
            });
        }

        // --- Menus: one sub-group per navigation menu (mirrors the builder) ---
        if (permissionChecker.canReadNavigation()) {
            groups.push({
                id: 'menus',
                label: 'Menus',
                icon: <IconRoute size={17} />,
                actions: [{
                    id: 'open-menu-builder',
                    label: 'Open menu builder',
                    icon: <IconRoute size={15} />,
                    onClick: () => router.push('/admin/navigation'),
                }],
                items: [{
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
                }],
            });
        }

        // --- Users & access ----------------------------------------------------
        if (permissionChecker.canManageUsers()) {
            const userItems: TNavbarItem[] = [];
            if (permissionChecker.canReadUsers()) userItems.push({ label: 'Users', link: '/admin/users', id: 'nav:users' });
            if (permissionChecker.canReadGroups()) userItems.push({ label: 'Groups', link: '/admin/groups', id: 'nav:groups' });
            if (permissionChecker.canReadRoles()) userItems.push({ label: 'Roles', link: '/admin/roles', id: 'nav:roles' });
            if (permissionChecker.canReadRegistrationCodes()) userItems.push({ label: 'Registration Codes', link: '/admin/registration-codes', id: 'nav:registration-codes' });
            if (userItems.length > 0) {
                groups.push({ id: 'users', label: 'Users & Access', icon: <IconShieldLock size={17} />, items: userItems });
            }
        }

        // --- Content library ----------------------------------------------------
        if (permissionChecker.canManageAssets()) {
            const contentItems: TNavbarItem[] = [];
            if (permissionChecker.canReadAssets()) contentItems.push({ label: 'Assets', link: '/admin/assets', id: 'nav:assets' });
            if (permissionChecker.canDeleteSections()) contentItems.push({ label: 'Unused Sections', link: '/admin/unused-sections', id: 'nav:unused-sections' });
            if (contentItems.length > 0) {
                groups.push({ id: 'content', label: 'Content', icon: <IconPhoto size={17} />, items: contentItems });
            }
        }

        // --- Automation -----------------------------------------------------------
        if (permissionChecker.canManageActions() || permissionChecker.canManageScheduledJobs()) {
            const automationItems: TNavbarItem[] = [];
            if (permissionChecker.canReadActions()) automationItems.push({ label: 'Actions', link: '/admin/actions', id: 'nav:actions' });
            if (permissionChecker.canReadScheduledJobs()) {
                automationItems.push({ label: 'Scheduled Jobs', link: '/admin/scheduled-jobs', id: 'nav:scheduled-jobs' });
                automationItems.push({ label: 'Jobs Calendar', link: '/admin/scheduled-jobs/calendar', id: 'nav:scheduled-jobs-calendar' });
            }
            if (automationItems.length > 0) {
                groups.push({ id: 'automation', label: 'Automation', icon: <IconPlayerPlay size={17} />, items: automationItems });
            }
        }

        // --- System -----------------------------------------------------------
        const systemItems: TNavbarItem[] = [];
        if (permissionChecker.canManageLanguages()) systemItems.push({ label: 'Languages', link: '/admin/languages', id: 'nav:languages' });
        if (permissionChecker.canAccessDataBrowser()) systemItems.push({ label: 'Data Browser', link: '/admin/data', id: 'nav:data-browser' });
        if (permissionChecker.canViewAuditLogs()) systemItems.push({ label: 'Audit Logs', link: '/admin/data-access', id: 'nav:audit-logs' });
        if (permissionChecker.canReadCache()) systemItems.push({ label: 'Cache Management', link: '/admin/cache', id: 'nav:cache' });
        if (permissionChecker.canReadSystem()) systemItems.push({ label: 'System Maintenance', link: '/admin/system', id: 'nav:system' });
        if (permissionChecker.canManagePlugins()) {
            systemItems.push({ label: 'Plugin Management', link: '/admin/plugins', id: 'nav:plugin-management' });
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

        if (systemItems.length > 0) {
            groups.push({ id: 'system', label: 'System', icon: <IconDatabase size={17} />, items: systemItems });
        }

        return groups;
    }, [pages, configurationPageLinks, categorizedSystemPages, isLoading, permissionChecker, pluginMenuItems, hasPermission, headerPreviewLinks, footerPreviewLinks, mobileDrawerPreviewLinks, mobileTabsPreviewLinks, router, cmsApps]);

    const accordionItems = navbarGroups.map((group) => (
        <Accordion.Item key={group.id} value={group.id} className={classes.accordionItem}>
            <Box className={classes.accordionControlRow}>
                <Accordion.Control
                    icon={<Box className={classes.accordionIcon}>{group.icon}</Box>}
                    className={classes.accordionControl}
                >
                    {group.label}
                </Accordion.Control>
                {group.actions && group.actions.length > 0 ? (
                    <Group gap={2} wrap="nowrap" className={classes.accordionActions}>
                        {group.actions.map((action) => (
                            <Tooltip key={action.id} label={action.label} position="bottom" withArrow>
                                <ActionIcon
                                    variant="subtle"
                                    color="gray"
                                    size="sm"
                                    aria-label={action.label}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        action.onClick();
                                    }}
                                >
                                    {action.icon}
                                </ActionIcon>
                            </Tooltip>
                        ))}
                    </Group>
                ) : null}
            </Box>
            <Accordion.Panel className={classes.accordionPanel}>
                {group.items.map((item) => <LinksGroup {...item} key={item.id} />)}
            </Accordion.Panel>
        </Accordion.Item>
    ));

    return (
        <nav className={classes.navbar}>
            {/* Compact header: brand + preview toggle on one row, search below */}
            <Box className={classes.header}>
                <Group justify="space-between" align="center" wrap="nowrap" mb="sm">
                    <SelfHelpLogo variant="compact" />
                    <PreviewModeToggle showLabel={false} />
                </Group>

                <NavigationSearch
                    adminPagesData={adminPagesData}
                    onItemSelect={() => {}} // Navigation search handles routing internally
                />
            </Box>

            <ScrollArea className={classes.links} scrollbars="y" type="hover">
                <div className={classes.linksInner}>
                    <NavDirectLink
                        label="Dashboard"
                        icon={<IconDashboard size={17} />}
                        link="/admin"
                        active={pathname === '/admin'}
                    />
                    {navMounted ? (
                        <Accordion
                            multiple
                            value={openGroups}
                            onChange={setOpenGroups}
                            classNames={{
                                root: classes.accordionRoot,
                                item: classes.accordionItem,
                                control: classes.accordionControl,
                                label: classes.accordionLabel,
                                chevron: classes.accordionChevron,
                                content: classes.accordionContent,
                            }}
                        >
                            {accordionItems}
                        </Accordion>
                    ) : (
                        <Box className={classes.accordionRoot} py="sm" px="xs" aria-busy="true">
                            <Text size="xs" c="dimmed">Loading navigation…</Text>
                        </Box>
                    )}
                </div>
            </ScrollArea>

            <div className={classes.footer}>
                <AuthButton variant="navbar" />
            </div>

            <CreatePageModal
                opened={isCreatePageModalOpen}
                onClose={() => setIsCreatePageModalOpen(false)}
            />

            <CreateCmsAppModal
                opened={isCreateCmsAppOpen}
                onClose={() => setIsCreateCmsAppOpen(false)}
            />

            <PageExportImportModal
                opened={isExportImportOpen}
                onClose={() => setIsExportImportOpen(false)}
                pages={pages ?? []}
            />

            <PageExportImportModal
                opened={isCmsAppsImportOpen}
                onClose={() => setIsCmsAppsImportOpen(false)}
                pages={pages ?? []}
                initialTab={cmsAppsImportTab}
            />
        </nav>
    );
}
