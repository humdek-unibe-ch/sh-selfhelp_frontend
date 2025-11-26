import { NavLink, ScrollArea, Stack, Text, Group } from '@mantine/core';
import { 
    IconDashboard, 
    IconUsers, 
    IconFileText, 
    IconSettings,
    IconDatabase,
    IconFolders,
    IconPlayerPlay
} from '@tabler/icons-react';
import { InternalLink } from '../../../shared';

const navigationItems = [
    {
        label: 'Dashboard',
        href: '/admin',
        icon: IconDashboard,
    },
    {
        label: 'Pages',
        icon: IconFileText,
        children: [
            { label: 'All Pages', href: '/admin/pages' },
        ]
    },
    {
        label: 'Users & Access',
        icon: IconUsers,
        children: [
            { label: 'Users', href: '/admin/users' },
            { label: 'Groups', href: '/admin/groups' },
            { label: 'Roles', href: '/admin/roles' },
        ]
    },
    {
        label: 'Content',
        icon: IconFolders,
        children: [
            { label: 'Assets', href: '/admin/assets' },
            { label: 'Unused Sections', href: '/admin/unused-sections' },
        ]
    },
    {
        label: 'Automation',
        icon: IconPlayerPlay,
        children: [
            { label: 'Actions', href: '/admin/actions' },
            { label: 'Scheduled Jobs', href: '/admin/scheduled-jobs' },
        ]
    },
    {
        label: 'Data Management',
        icon: IconDatabase,
        children: [
            { label: 'Data Browser', href: '/admin/data' },
        ]
    },
    {
        label: 'Configuration',
        icon: IconSettings,
        children: [
            { label: 'Cache Management', href: '/admin/cache' },
        ]
    },
];

/**
 * Server Component for Admin Navbar
 * Renders static navigation structure on the server
 */
export function AdminNavbarServer() {
    return (
        <ScrollArea h="calc(100vh - 60px)">
            <Stack gap="xs" p="md">
                {navigationItems.map((item) => {
                    if (item.children) {
                        return (
                            <div key={item.label}>
                                <Group gap="xs" mb="xs">
                                    <item.icon size="1rem" />
                                    <Text size="sm" fw={500} c="dimmed">
                                        {item.label}
                                    </Text>
                                </Group>
                                <Stack gap="xs" pl="lg">
                                    {item.children.map((child) => (
                                        <InternalLink key={child.href} href={child.href}>
                                            <NavLink
                                                label={child.label}
                                                variant="subtle"
                                            />
                                        </InternalLink>
                                    ))}
                                </Stack>
                            </div>
                        );
                    }

                    return (
                        <InternalLink key={item.href} href={item.href!}>
                            <NavLink
                                label={item.label}
                                leftSection={<item.icon size="1rem" />}
                                variant="subtle"
                            />
                        </InternalLink>
                    );
                })}
            </Stack>
        </ScrollArea>
    );
}
