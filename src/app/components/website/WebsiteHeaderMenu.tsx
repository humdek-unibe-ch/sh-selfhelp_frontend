'use client';

import { IconChevronDown } from '@tabler/icons-react';
import { Center, Group, Menu } from '@mantine/core';
import Link from 'next/link';
import { useAppNavigation } from '../../../hooks/useAppNavigation';

export function WebsiteHeaderMenu() {
    const { menuItems, isLoading } = useAppNavigation();

    // No loading state needed since we keep previous data
    const items = (menuItems ?? []).map((item) => {
        // If the item has children, render it as a dropdown menu
        if (item.children?.length) {
            const menuItems = item.children.map((child: any) => (
                <Menu.Item
                    key={child.id}
                    component={Link}
                    href={child.href??'#'}
                    className="text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                    {child.title}
                </Menu.Item>
            ));

            return (
                <Menu 
                    key={item.id} 
                    trigger="hover" 
                    transitionProps={{ exitDuration: 0 }} 
                    withinPortal
                >
                    <Menu.Target>
                        <div className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 rounded-sm hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer">
                            <span className="mr-1">{item.title}</span>
                            <IconChevronDown size={14} className="text-gray-500" stroke={1.5} />
                        </div>
                    </Menu.Target>
                    <Menu.Dropdown className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg">
                        {menuItems}
                    </Menu.Dropdown>
                </Menu>
            );
        }

        // If no children, render as a simple link
        return (
            <Link
                key={item.id}
                href={item.href??'#'}
                className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 rounded-sm hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
                {item.title}
            </Link>
        );
    });

    return (
        <Group gap={5} visibleFrom="sm" className="hidden sm:flex items-center">
            {items}
        </Group>
    );
}