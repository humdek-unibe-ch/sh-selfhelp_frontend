"use client";

import { ScrollArea, NavLink } from '@mantine/core';
import { usePathname } from 'next/navigation';
import { useNavigation } from "@refinedev/core";
import { IconAdjustmentsCog, IconFiles, IconMessageCircleQuestion, IconSettings, IconSettingsAutomation } from '@tabler/icons-react';
import { NavItemData } from '@/types/navigation/navigation.types';
import { useNavigationStore, useNavigationOpenItems } from '@/store/navigation.store';

const mockData: NavItemData[] = [
    {
        label: 'Configuration',
        icon: <IconSettingsAutomation size="1rem" stroke={1.5} />,
        children: [
            {
                label: 'Global Values',
                link: '/admin/pages/globals',
            },
            {
                label: 'Custom CSS',
                link: '/admin/pages/css',
            }
        ]
    },
    {
        label: 'System Pages',
        icon: <IconAdjustmentsCog size="1rem" stroke={1.5} />,
        children: [
            {
                label: 'Login',
                link: '/admin/pages/login',
            },
            {
                label: 'Register',
                link: '/admin/pages/register',
            },
            {
                label: 'Not found',
                link: '/admin/pages/notfound',
            }
        ]
    },
    {
        label: 'Pages',
        icon: <IconFiles size="1rem" stroke={1.5} />,
        children: [
            {
                label: 'PageRoot',
                // link: '/admin/pages/pageRoot',
                children: [
                    { label: 'Page 1', link: '/admin/pages/page1' },
                    { label: 'Page 2', link: '/admin/pages/page2' }
                ]
            },
            {
                label: 'Blog',
                // link: '/admin/pages/blog',
                children: [
                    { label: 'Posts', link: '/admin/pages/posts' },
                    { label: 'Categories', link: '/admin/pages/categories' }
                ]
            }
        ]
    },
    {
        label: 'Settings',
        icon: <IconSettings size="1rem" stroke={1.5} />,
        link: "/admin/settings"
    },
    {
        label: 'Learning Assistance',
        icon: <IconMessageCircleQuestion size="1rem" stroke={1.5} />,
        link: "/admin/help"
    }
];

export function AdminNavbar(): JSX.Element {
    const pathname = usePathname();
    const { push } = useNavigation();
    const openItems = useNavigationOpenItems();
    const { toggleItem, setActiveItem } = useNavigationStore();

    const handleClick = (link: string): void => {
        setActiveItem(link);
        push(link);
    };

    const renderNavLink = (item: NavItemData, itemPath: string = ''): JSX.Element => {
        const currentPath = itemPath ? `${itemPath}.${item.label}` : item.label;
        const isOpen = openItems.includes(currentPath);
        const hasChildren = item.children && item.children.length > 0;

        return (
            <NavLink
                key={currentPath}
                active={pathname === item.link}
                label={item.label}
                leftSection={item.icon}
                opened={isOpen}
                onClick={() => {
                    if (hasChildren) {
                        toggleItem(currentPath);
                    }
                    if (item.link) {
                        handleClick(item.link);
                    }
                }}
            >
                {hasChildren &&
                    item?.children?.map((child) => renderNavLink(child, currentPath))}
            </NavLink>
        );
    };

    return (
        <ScrollArea className="h-[calc(100vh-60px)] p-md">
            <div className="px-3">
                {mockData.map((item) => renderNavLink(item))}
            </div>
        </ScrollArea>
    );
}
