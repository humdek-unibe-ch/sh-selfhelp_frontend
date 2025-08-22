"use client";

import { useState, useMemo, useCallback } from 'react';
import { ScrollArea, Stack, Divider, Box, Text, Group, ActionIcon, Tooltip } from '@mantine/core';
import { 
    IconDashboard,
    IconUsers, 
    IconFiles, 
    IconSettingsAutomation, 
    IconPlus, 
    IconPhoto, 
    IconSettings, 
    IconClock, 
    IconDatabase,
    IconPlayerPlay,
    IconRefresh
} from '@tabler/icons-react';
import { useRouter } from 'next/navigation';
import { useAdminPages } from '../../../../../hooks/useAdminPages';
import { useQueryClient } from '@tanstack/react-query';
import { CreatePageModal } from '../../pages/create-page/CreatePage';
import { NavigationSearch, NavigationSection, NavigationItem, NavigationQuickActions, CategoryHeader, UserButton } from './components';
import { REACT_QUERY_CONFIG } from '../../../../../config/react-query.config';
import classes from './AdminNavbar.module.css';

export function AdminNavbar() {
    const router = useRouter();
    const queryClient = useQueryClient();
    const { 
        configurationPageLinks, 
        categorizedSystemPages, 
        categorizedRegularPages, 
        isLoading 
    } = useAdminPages();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);

    // Handle data refresh
    const handleRefreshData = useCallback(async () => {
        setIsRefreshing(true);
        try {
            await queryClient.invalidateQueries({ 
                queryKey: REACT_QUERY_CONFIG.QUERY_KEYS.ADMIN_PAGES 
            });
        } finally {
            setIsRefreshing(false);
        }
    }, [queryClient]);

    // Transform pages data for search component
    const adminPagesData = useMemo(() => ({
        configurationPageLinks,
        categorizedSystemPages,
        categorizedRegularPages
    }), [configurationPageLinks, categorizedSystemPages, categorizedRegularPages]);

    // Build navigation links for each section
    const userManagementLinks = [
                {
                    label: 'Users',
            href: '/admin/users', 
            icon: <IconUsers size={16} />,
            description: 'Manage user accounts and profiles'
                },
                {
                    label: 'Groups',
            href: '/admin/groups', 
            icon: <IconUsers size={16} />,
            description: 'Manage user groups and permissions'
                },
                {
                    label: 'Roles',
            href: '/admin/roles', 
            icon: <IconUsers size={16} />,
            description: 'Manage user roles and access control'
                }
    ];

    const contentManagementLinks = [
        {
            label: 'Assets',
            href: '/admin/assets', 
            icon: <IconPhoto size={16} />,
            description: 'Manage files, images and media'
        },
        { 
            label: 'Unused Sections', 
            href: '/admin/unused-sections', 
            icon: <IconDatabase size={16} />,
            description: 'Clean up unused content sections'
        }
    ];

    const automationLinks = [
        { 
            label: 'Actions', 
            href: '/admin/actions', 
            icon: <IconPlayerPlay size={16} />,
            description: 'Automated actions and triggers'
        },
        {
            label: 'Scheduled Jobs',
            href: '/admin/scheduled-jobs', 
            icon: <IconClock size={16} />,
            description: 'Manage scheduled tasks and cron jobs'
        }
    ];

    const systemLinks = [
        { 
            label: 'Data Browser', 
            href: '/admin/data', 
            icon: <IconDatabase size={16} />,
            description: 'Browse and manage database tables'
        },
                {
                    label: 'CMS Preferences',
            href: '/admin/preferences', 
            icon: <IconSettings size={16} />,
            description: 'Configure CMS settings'
        },
        { 
            label: 'Cache Management', 
            href: '/admin/cache', 
            icon: <IconDatabase size={16} />,
            description: 'Monitor and manage application cache'
        }
    ];

    // Transform configuration pages
    const configurationLinks = useMemo(() => {
        if (isLoading) return [];
        return configurationPageLinks.map(page => ({
            label: page.label,
            href: `/admin/pages/${page.keyword}`,
            icon: <IconSettings size={16} />,
            description: 'Configuration page'
        }));
    }, [configurationPageLinks, isLoading]);

    // Transform regular pages
    const menuPagesLinks = useMemo(() => {
        if (isLoading) return [];
        return categorizedRegularPages.menu.map(page => ({
            label: page.label,
            href: `/admin/pages/${page.keyword}`,
            icon: <IconFiles size={16} />,
            badge: { text: 'Menu', color: 'blue' },
            description: `Menu page (position: ${page.nav_position})`
        }));
    }, [categorizedRegularPages.menu, isLoading]);

    const footerPagesLinks = useMemo(() => {
        if (isLoading) return [];
        return categorizedRegularPages.footer.map(page => ({
            label: page.label,
            href: `/admin/pages/${page.keyword}`,
            icon: <IconFiles size={16} />,
            badge: { text: 'Footer', color: 'green' },
            description: `Footer page (position: ${page.footer_position})`
        }));
    }, [categorizedRegularPages.footer, isLoading]);

    const otherPagesLinks = useMemo(() => {
        if (isLoading) return [];
        return categorizedRegularPages.other.map(page => ({
            label: page.label,
            href: `/admin/pages/${page.keyword}`,
            icon: <IconFiles size={16} />,
            description: 'Content page'
        }));
    }, [categorizedRegularPages.other, isLoading]);

    // Transform system pages
    const authPagesLinks = useMemo(() => {
        if (isLoading) return [];
        return categorizedSystemPages.authentication.map(page => ({
            label: page.label,
            href: `/admin/pages/${page.keyword}`,
            icon: <IconUsers size={16} />,
            description: 'Authentication page'
        }));
    }, [categorizedSystemPages.authentication, isLoading]);

    const profilePagesLinks = useMemo(() => {
        if (isLoading) return [];
        return categorizedSystemPages.profile.map(page => ({
            label: page.label,
            href: `/admin/pages/${page.keyword}`,
            icon: <IconUsers size={16} />,
            description: 'User profile page'
        }));
    }, [categorizedSystemPages.profile, isLoading]);

    const errorPagesLinks = useMemo(() => {
        if (isLoading) return [];
        return categorizedSystemPages.errors.map(page => ({
            label: page.label,
            href: `/admin/pages/${page.keyword}`,
            icon: <IconFiles size={16} />,
            description: 'Error page'
        }));
    }, [categorizedSystemPages.errors, isLoading]);

    const legalPagesLinks = useMemo(() => {
        if (isLoading) return [];
        return categorizedSystemPages.legal.map(page => ({
            label: page.label,
            href: `/admin/pages/${page.keyword}`,
            icon: <IconFiles size={16} />,
            description: 'Legal page'
        }));
    }, [categorizedSystemPages.legal, isLoading]);

    const otherSystemPagesLinks = useMemo(() => {
        if (isLoading) return [];
        return categorizedSystemPages.other.map(page => ({
            label: page.label,
            href: `/admin/pages/${page.keyword}`,
            icon: <IconFiles size={16} />,
            description: 'System page'
        }));
    }, [categorizedSystemPages.other, isLoading]);

    return (
        <>
            <Box className={classes.navbar}>
                {/* User section at top */}
                <Box className={classes.userSection}>
                    <UserButton />
                </Box>

                {/* Search section */}
                <Box className={classes.searchSection}>
                    <Group justify="space-between" align="center" mb="xs" px="xs">
                        <Text size="xs" fw={600} c="dimmed" tt="uppercase">
                            Admin Panel
                        </Text>
                        <Tooltip label="Refresh navigation">
                            <ActionIcon
                                variant="subtle"
                                color="gray"
                                size="xs"
                                onClick={handleRefreshData}
                                loading={isRefreshing}
                            >
                                <IconRefresh size={12} />
                            </ActionIcon>
                        </Tooltip>
                    </Group>
                    
                    <Box px="xs">
                        <NavigationSearch 
                            adminPagesData={adminPagesData}
                            onItemSelect={() => {}} 
                        />
                    </Box>
                </Box>

                <Divider />

                {/* Main navigation content */}
                <ScrollArea style={{ flex: 1 }} p="xs" pt="xs">
                    <Stack gap="xs">
                        {/* Core Admin */}
                        <Box pb="xs" style={{ borderBottom: '1px solid var(--mantine-color-gray-2)' }}>
                            <NavigationSection
                                title="Dashboard"
                                icon={<IconDashboard size={18} />}
                                directLink="/admin"
                            />
                        </Box>

                        {/* User Management */}
                        <Box pb="xs" style={{ borderBottom: '1px solid var(--mantine-color-gray-2)' }}>
                            <NavigationSection
                                title="User Management"
                                icon={<IconUsers size={18} />}
                                links={userManagementLinks}
                                itemCount={userManagementLinks.length}
                            />
                        </Box>

                        {/* Content Management */}
                        <Box pb="xs" style={{ borderBottom: '1px solid var(--mantine-color-gray-2)' }}>
                            <NavigationSection
                                title="Content"
                                icon={<IconPhoto size={18} />}
                                links={contentManagementLinks}
                                itemCount={contentManagementLinks.length}
                            />
                        </Box>

                        {/* Pages */}
                        <Box pb="xs" style={{ borderBottom: '1px solid var(--mantine-color-gray-2)' }}>
                            <NavigationSection
                                title="Pages"
                                icon={<IconFiles size={18} />}
                                itemCount={
                                    (menuPagesLinks.length + footerPagesLinks.length + otherPagesLinks.length) || undefined
                                }
                                rightSection={
                                    <Tooltip label="Create new page">
                                        <div
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                setIsModalOpen(true);
                                            }}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                width: '20px',
                                                height: '20px',
                                                borderRadius: '4px',
                                                cursor: 'pointer',
                                                color: 'var(--mantine-color-green-6)',
                                                transition: 'all 0.15s ease'
                                            }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.backgroundColor = 'var(--mantine-color-green-0)';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.backgroundColor = 'transparent';
                                            }}
                                        >
                                            <IconPlus size={12} />
                                        </div>
                                    </Tooltip>
                                }
                            >
                                <Stack gap={2}>
                                    {menuPagesLinks.length > 0 && (
                                        <Box>
                                            <CategoryHeader 
                                                title="Menu Pages" 
                                                count={menuPagesLinks.length} 
                                            />
                                            <Stack gap={1}>
                                                {menuPagesLinks.map(link => (
                                                    <NavigationItem key={link.href} {...link} />
                                                ))}
                                            </Stack>
                                        </Box>
                                    )}
                                    
                                    {footerPagesLinks.length > 0 && (
                                        <Box>
                                            <CategoryHeader 
                                                title="Footer Pages" 
                                                count={footerPagesLinks.length} 
                                            />
                                            <Stack gap={1}>
                                                {footerPagesLinks.map(link => (
                                                    <NavigationItem key={link.href} {...link} />
                                                ))}
                                            </Stack>
                                        </Box>
                                    )}
                                    
                                    {otherPagesLinks.length > 0 && (
                                        <Box>
                                            <CategoryHeader 
                                                title="Other Pages" 
                                                count={otherPagesLinks.length} 
                                            />
                                            <Stack gap={1}>
                                                {otherPagesLinks.map(link => (
                                                    <NavigationItem key={link.href} {...link} />
                                                ))}
                                            </Stack>
                                        </Box>
                                    )}
                                </Stack>
                            </NavigationSection>
                        </Box>

                        {/* Configuration Pages */}
                        {configurationLinks.length > 0 && (
                            <Box pb="xs" style={{ borderBottom: '1px solid var(--mantine-color-gray-2)' }}>
                                <NavigationSection
                                    title="Configuration Pages"
                                    icon={<IconSettings size={18} />}
                                    links={configurationLinks}
                                    itemCount={configurationLinks.length}
                                />
                            </Box>
                        )}

                        {/* System Pages */}
                        <Box pb="xs" style={{ borderBottom: '1px solid var(--mantine-color-gray-2)' }}>
                            <NavigationSection
                                title="System Pages"
                                icon={<IconSettingsAutomation size={18} />}
                                itemCount={
                                    (authPagesLinks.length + profilePagesLinks.length + errorPagesLinks.length + 
                                     legalPagesLinks.length + otherSystemPagesLinks.length) || undefined
                                }
                            >
                                <Stack gap={2}>
                                    {authPagesLinks.length > 0 && (
                                        <Box>
                                            <CategoryHeader 
                                                title="Authentication" 
                                                count={authPagesLinks.length} 
                                            />
                                            <Stack gap={1}>
                                                {authPagesLinks.map(link => (
                                                    <NavigationItem key={link.href} {...link} />
                                                ))}
                                            </Stack>
                                        </Box>
                                    )}
                                    
                                    {profilePagesLinks.length > 0 && (
                                        <Box>
                                            <CategoryHeader 
                                                title="User Profile" 
                                                count={profilePagesLinks.length} 
                                            />
                                            <Stack gap={1}>
                                                {profilePagesLinks.map(link => (
                                                    <NavigationItem key={link.href} {...link} />
                                                ))}
                                            </Stack>
                                        </Box>
                                    )}
                                    
                                    {errorPagesLinks.length > 0 && (
                                        <Box>
                                            <CategoryHeader 
                                                title="Error Pages" 
                                                count={errorPagesLinks.length} 
                                            />
                                            <Stack gap={1}>
                                                {errorPagesLinks.map(link => (
                                                    <NavigationItem key={link.href} {...link} />
                                                ))}
                                            </Stack>
                                        </Box>
                                    )}
                                    
                                    {legalPagesLinks.length > 0 && (
                                        <Box>
                                            <CategoryHeader 
                                                title="Legal Pages" 
                                                count={legalPagesLinks.length} 
                                            />
                                            <Stack gap={1}>
                                                {legalPagesLinks.map(link => (
                                                    <NavigationItem key={link.href} {...link} />
                                                ))}
                                            </Stack>
                                        </Box>
                                    )}
                                    
                                    {otherSystemPagesLinks.length > 0 && (
                                        <Box>
                                            <CategoryHeader 
                                                title="Other System" 
                                                count={otherSystemPagesLinks.length} 
                                            />
                                            <Stack gap={1}>
                                                {otherSystemPagesLinks.map(link => (
                                                    <NavigationItem key={link.href} {...link} />
                                                ))}
                                            </Stack>
                                        </Box>
                                    )}
                                </Stack>
                            </NavigationSection>
                        </Box>

                        {/* Automation */}
                        <Box pb="xs" style={{ borderBottom: '1px solid var(--mantine-color-gray-2)' }}>
                            <NavigationSection
                                title="Automation"
                                icon={<IconPlayerPlay size={18} />}
                                links={automationLinks}
                                itemCount={automationLinks.length}
                            />
                        </Box>

                        {/* System Tools */}
                        <Box>
                            <NavigationSection
                                title="System Tools"
                                icon={<IconDatabase size={18} />}
                                links={systemLinks}
                                itemCount={systemLinks.length}
                            />
                        </Box>
                    </Stack>
            </ScrollArea>

                {/* Footer with quick actions */}
                <NavigationQuickActions
                    onCreatePage={() => setIsModalOpen(true)}
                    onRefreshData={handleRefreshData}
                    isRefreshing={isRefreshing}
                />
            </Box>

            <CreatePageModal
                opened={isModalOpen}
                onClose={() => setIsModalOpen(false)}
            />
        </>
    );
}
