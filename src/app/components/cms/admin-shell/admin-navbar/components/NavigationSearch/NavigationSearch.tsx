/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
'use client';

import { useState, useMemo, useRef } from 'react';
import {
    TextInput,
    Stack,
    Text,
    Group,
    ActionIcon,
    Box,
    ScrollArea,
    Highlight,
    UnstyledButton,
    VisuallyHidden
} from '@mantine/core';
import { useClickOutside } from '@mantine/hooks';
import { IconSearch, IconX, IconFile, IconSettings, IconUsers, IconDatabase, IconPhoto, IconPlayerPlay, IconFileText, IconLanguage, IconPuzzle, IconCalendar } from '@tabler/icons-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import styles from './NavigationSearch.module.css';
import { useNavigationStore } from '../../../../../../store/navigation.store';
import { useAuth } from '../../../../../../../hooks/useAuth';
import { usePluginMenuItems } from '../../../../../frontend/plugin-runtime';
import { pageHasMenuMembership } from '../../../../../../../utils/admin-navigation-membership';
import type { INavigationMembershipBadge } from '../../../../../../../types/responses/admin/admin.types';
import { getAdminScreen, type TAdminScreenId } from '../../../../../../../config/admin-screens';

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
        /** Titles per language so search matches any translation. */
        titles?: Array<{ language_id: number; title: string }>;
        navigationMembership?: INavigationMembershipBadge[];
        is_system: boolean;
        children?: Array<{
            keyword: string;
            title?: string;
            children?: unknown[];
        }>;
    }>;
}

/** Search-only presentation of a registry screen (label, path, gate come from the registry). */
interface ISearchScreenEntry {
    id: string;
    screenId: TAdminScreenId;
    icon: React.ReactNode;
    category: string;
    keywords: string[];
}

// System tools are listed first, then the other static screens (search order
// breaks score ties, so it is kept as it was).
const SEARCH_SYSTEM_SCREENS: ISearchScreenEntry[] = [
    { id: 'languages', screenId: 'languages', icon: <IconLanguage size={16} />, category: 'System Tools', keywords: ['languages', 'locale', 'translation', 'i18n'] },
    { id: 'data', screenId: 'data-browser', icon: <IconDatabase size={16} />, category: 'Data Management', keywords: ['data', 'database', 'tables', 'browse'] },
    { id: 'audit-logs', screenId: 'audit-logs', icon: <IconDatabase size={16} />, category: 'System Tools', keywords: ['audit', 'logs', 'security', 'access', 'monitoring', 'data access'] },
    { id: 'cache', screenId: 'cache', icon: <IconDatabase size={16} />, category: 'Configuration', keywords: ['cache', 'performance', 'memory'] },
];

const SEARCH_STATIC_SCREENS: ISearchScreenEntry[] = [
    { id: 'dashboard', screenId: 'dashboard', icon: <IconSettings size={16} />, category: 'Admin', keywords: ['dashboard', 'overview', 'home'] },
    { id: 'users', screenId: 'users', icon: <IconUsers size={16} />, category: 'User Management', keywords: ['users', 'accounts', 'people'] },
    { id: 'groups', screenId: 'groups', icon: <IconUsers size={16} />, category: 'User Management', keywords: ['groups', 'teams', 'permissions'] },
    { id: 'roles', screenId: 'roles', icon: <IconUsers size={16} />, category: 'User Management', keywords: ['roles', 'permissions', 'access'] },
    { id: 'assets', screenId: 'assets', icon: <IconPhoto size={16} />, category: 'Content', keywords: ['assets', 'files', 'media', 'images'] },
    { id: 'unused-sections', screenId: 'unused-sections', icon: <IconDatabase size={16} />, category: 'Content', keywords: ['unused', 'sections', 'cleanup'] },
    { id: 'actions', screenId: 'actions', icon: <IconPlayerPlay size={16} />, category: 'Automation', keywords: ['actions', 'automation', 'triggers'] },
    { id: 'scheduled-jobs', screenId: 'scheduled-jobs', icon: <IconPlayerPlay size={16} />, category: 'Automation', keywords: ['jobs', 'scheduled', 'cron', 'tasks'] },
    { id: 'scheduled-jobs-calendar', screenId: 'scheduled-jobs-calendar', icon: <IconCalendar size={16} />, category: 'Automation', keywords: ['calendar', 'jobs', 'scheduled', 'schedule'] },
];

interface INavigationSearchProps {
    adminPagesData: IAdminPageData;
    onItemSelect: () => void;
    autoFocus?: boolean;
}

export function NavigationSearch({ adminPagesData, onItemSelect, autoFocus = false }: INavigationSearchProps) {
    const [searchQuery, setSearchQuery] = useState('');
    // Dismissal is tracked separately from the query so clicking away or
    // pressing Escape closes the panel without wiping what was typed —
    // focusing or clicking the input opens it again.
    const [isPanelOpen, setIsPanelOpen] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const clickOutsideRef = useClickOutside(() => setIsPanelOpen(false));
    const router = useRouter();
    const { setActiveItem } = useNavigationStore();
    const { permissionChecker, hasPermission } = useAuth();
    // Plugin-contributed menu items live in the PluginRuntime snapshot.
    // Reading them here (instead of taking another prop) keeps the
    // component's call sites unchanged while still making every
    // installed-and-enabled plugin page reachable via Ctrl-F.
    const pluginMenuItems = usePluginMenuItems();

    // Build searchable items from all admin functions and pages
    const searchableItems = useMemo<ISearchableItem[]>(() => {
        const items: ISearchableItem[] = [];

        // Static admin screens come from the screen registry: label, path and
        // gate (its one read permission, F223/F241). Search adds only its own
        // icon, category and keywords.
        const toSearchItems = (entries: ISearchScreenEntry[]): ISearchableItem[] =>
            entries.flatMap((entry) => {
                const screen = getAdminScreen(entry.screenId);
                if (!hasPermission(screen.read_permission)) return [];
                return [{
                    id: entry.id,
                    label: screen.label,
                    href: screen.path,
                    icon: entry.icon,
                    category: entry.category,
                    keywords: entry.keywords,
                }];
            });
        const staticFunctions = toSearchItems(SEARCH_STATIC_SCREENS);
        const systemToolFunctions = toSearchItems(SEARCH_SYSTEM_SCREENS);
        // Plugin Management lives under System Tools — searchable by
        // every word an admin would reach for: plugins, addon, extension,
        // module, marketplace, install, update, uninstall, doctor, safe-mode,
        // surveyjs (so people who only know the use-case still find it).
        if (permissionChecker?.canManagePlugins()) {
            systemToolFunctions.push({
                id: 'plugin-management',
                label: 'Plugin Management',
                href: '/admin/plugins',
                icon: <IconPuzzle size={16} />,
                category: 'System Tools',
                keywords: [
                    'plugin', 'plugins', 'plugin management',
                    'addon', 'add-on', 'extension', 'extensions', 'module', 'modules', 'marketplace',
                    'install', 'install plugin', 'update plugin', 'uninstall',
                    'plugin doctor', 'doctor', 'safe mode', 'safe-mode',
                    'plugin sources', 'plugin operations',
                    'survey', 'surveyjs', 'survey-js',
                ],
            });
        }

        if (systemToolFunctions.length > 0) {
            items.push(...systemToolFunctions);
        }

        items.push(...staticFunctions);

        // Plugin-contributed menu items (e.g. "Surveys" from the
        // SurveyJS plugin). The PluginRuntime snapshot lists every
        // entry an installed-and-enabled plugin contributed via
        // `register().menuItems`; we gate each one on its declared
        // permission so users see the same set the sidebar shows.
        // Keywords mix the human label, the plugin id, and `plugin`
        // so searching either "surveys" or "surveyjs" hits the row.
        pluginMenuItems
            .filter((mi) => !mi.permission || hasPermission(mi.permission))
            .forEach((mi) => {
                const href = mi.href ?? `/admin/plugins-host/${mi.pluginId}/${mi.key}`;
                const labelLower = mi.label.toLowerCase();
                items.push({
                    id: `plugin-menu-${mi.pluginId}-${mi.key}`,
                    label: mi.label,
                    href,
                    icon: <IconPuzzle size={16} />,
                    category: `Plugin: ${mi.pluginId}`,
                    keywords: [
                        labelLower,
                        mi.key,
                        mi.pluginId,
                        'plugin',
                        'plugins',
                    ].filter(Boolean),
                });
            });

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
                extraTerms?: string[];
                children?: Array<{
                    keyword: string;
                    label: string;
                    title?: string;
                    extraTerms?: string[];
                    children?: unknown[];
                }>;
            }>, categoryName: string) => {
                const addPageAndChildren = (page: {
                    keyword: string;
                    label: string;
                    title?: string;
                    extraTerms?: string[];
                    children?: Array<{
                        keyword: string;
                        label: string;
                        title?: string;
                        extraTerms?: string[];
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
                        categoryName.toLowerCase(),
                        // Titles in every CMS language, so a page titled
                        // "Über uns" is found by its title, not just keyword.
                        ...(page.extraTerms ?? []),
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
                    extraTerms?: string[];
                    children?: Array<{
                        keyword: string;
                        label: string;
                        title?: string;
                        extraTerms?: string[];
                        children?: unknown[];
                    }>;
                }> => {
                    if (!pages) return [];
                    return pages.map(page => ({
                        keyword: page.keyword,
                        label: page.title || page.keyword, // Use title as label for display
                        title: page.title,
                        extraTerms: (page.titles ?? []).map(t => t.title.toLowerCase()),
                        children: page.children ? convertAllPagesToRegularFormat(page.children as typeof adminPagesData.allPages) : undefined
                    }));
                };

                // Get configuration keywords to exclude them from regular pages
                const configurationKeywords = new Set(adminPagesData.configurationPageLinks?.map(p => p.keyword) || []);

                // Filter menu pages from raw data (preserves hierarchy)
                const menuPages = convertAllPagesToRegularFormat(
                    adminPagesData.allPages.filter((page) =>
                        pageHasMenuMembership(page.navigationMembership, 'web_header') && !page.is_system &&
                        !configurationKeywords.has(page.keyword)
                    )
                );
                const footerPages = convertAllPagesToRegularFormat(
                    adminPagesData.allPages.filter((page) =>
                        pageHasMenuMembership(page.navigationMembership, 'web_footer') && !page.is_system &&
                        !configurationKeywords.has(page.keyword)
                    )
                );
                const otherPages = convertAllPagesToRegularFormat(
                    adminPagesData.allPages.filter((page) =>
                        !pageHasMenuMembership(page.navigationMembership, 'web_header') &&
                        !pageHasMenuMembership(page.navigationMembership, 'web_footer') &&
                        !page.is_system &&
                        !configurationKeywords.has(page.keyword)
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
    }, [adminPagesData, permissionChecker, pluginMenuItems, hasPermission]);

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

    const handleItemClick = (item: ISearchableItem, e: React.MouseEvent<HTMLAnchorElement>) => {
        // Results are links: new-tab / new-window clicks are the browser's.
        if (e.button !== 0 || e.ctrlKey || e.metaKey || e.shiftKey) {
            setSearchQuery('');
            setIsPanelOpen(false);
            onItemSelect?.();
            return;
        }

        e.preventDefault();
        setActiveItem(item.href);
        router.push(item.href);
        setSearchQuery('');
        setIsPanelOpen(false);
        onItemSelect?.();
    };

    const clearSearch = () => {
        setSearchQuery('');
        setIsPanelOpen(false);
        inputRef.current?.focus();
    };

    const isPanelVisible = Boolean(searchQuery) && isPanelOpen;
    const resultStatus = !searchQuery
        ? ''
        : filteredItems.length === 0
            ? 'No results'
            : `${filteredItems.length} ${filteredItems.length === 1 ? 'result' : 'results'}`;

    return (
        <Box className={styles.root} ref={clickOutsideRef}>
            {/* Always mounted so result-count changes are announced. */}
            <VisuallyHidden role="status" aria-live="polite">
                {resultStatus}
            </VisuallyHidden>
            <TextInput aria-label="Search functions and pages"
                ref={inputRef}
                autoFocus={autoFocus}
                placeholder="Search functions & pages"
                value={searchQuery}
                onChange={(event) => {
                    setSearchQuery(event.currentTarget.value);
                    setIsPanelOpen(true);
                }}
                onFocus={() => setIsPanelOpen(true)}
                // Escape leaves focus on the input, so a plain click (which
                // fires no new focus event) must reopen the results too.
                onClick={() => setIsPanelOpen(true)}
                onKeyDown={(event) => {
                    if (event.key === 'Escape' && isPanelVisible) {
                        // Stop the admin shell / any parent overlay from also
                        // reacting; Escape here means "close the results".
                        event.stopPropagation();
                        setIsPanelOpen(false);
                    }
                }}
                // Squares off the bottom corners while the panel is docked
                // underneath, so input + results read as one surface.
                data-panel-open={isPanelVisible || undefined}
                leftSection={<IconSearch size={16} stroke={1.6} />}
                rightSection={
                    searchQuery && (
                        <ActionIcon
                            variant="subtle"
                            color="gray"
                            size="sm"
                            onClick={clearSearch}
                            aria-label="Clear search"
                        >
                            <IconX size={14} />
                        </ActionIcon>
                    )
                }
                size="sm"
                radius="md"
                classNames={{ input: styles.input }}
                // Autofill / form-helper extensions (SharkID, 1Password,
                // Bitwarden, Dashlane, …) decorate <input> elements with
                // custom data-* attributes (e.g. `data-sharkid`) before
                // React hydrates, producing a hydration mismatch warning.
                // Suppressing the check on this single input keeps strict
                // hydration everywhere else.
                suppressHydrationWarning
            />

            {/* Results panel — an elevated surface docked flush to the bottom
                edge of the input, so the two read as one connected control
                instead of a detached floating card. */}
            {isPanelVisible && (
                <Box className={styles.panel}>
                    {filteredItems.length > 0 ? (
                        <>
                            <Box className={styles.panelHeader}>
                                <Text component="span" className={styles.panelHeaderLabel}>
                                    Results
                                </Text>
                                <Text component="span" className={styles.panelHeaderCount}>
                                    {filteredItems.length}
                                </Text>
                            </Box>

                            <ScrollArea.Autosize mah={280} type="hover">
                                <Stack gap={2} className={styles.panelList} component="nav" aria-label="Search results">
                                    {filteredItems.map((item) => (
                                        <UnstyledButton
                                            key={item.id}
                                            component={Link}
                                            href={item.href}
                                            onClick={(e: React.MouseEvent<HTMLAnchorElement>) => handleItemClick(item, e)}
                                            onAuxClick={(e: React.MouseEvent<HTMLAnchorElement>) => handleItemClick(item, e)}
                                            className={styles.searchItem}
                                        >
                                            <Group gap="sm" wrap="nowrap">
                                                <Box className={styles.searchItemIcon}>{item.icon}</Box>
                                                <Box className={styles.searchItemText}>
                                                    <Text size="sm" fw={500} truncate>
                                                        <Highlight highlight={searchQuery} component="span">
                                                            {item.label}
                                                        </Highlight>
                                                    </Text>
                                                    <Text size="xs" truncate className={styles.searchItemCategory}>
                                                        {item.category}
                                                    </Text>
                                                </Box>
                                            </Group>
                                        </UnstyledButton>
                                    ))}
                                </Stack>
                            </ScrollArea.Autosize>
                        </>
                    ) : (
                        <Box className={styles.emptyState}>
                            <IconSearch size={20} stroke={1.5} className={styles.emptyStateIcon} />
                            <Text size="sm" fw={500}>
                                No results
                            </Text>
                            <Text size="xs" c="dimmed" truncate>
                                Nothing matches &quot;{searchQuery}&quot;
                            </Text>
                        </Box>
                    )}
                </Box>
            )}
        </Box>
    );
}

// Helper functions
function _capitalizeFirst(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function _getCategoryIcon(category: string): React.ReactNode {
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
