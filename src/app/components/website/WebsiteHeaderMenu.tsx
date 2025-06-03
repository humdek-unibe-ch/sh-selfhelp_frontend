'use client';

import { IconChevronDown } from '@tabler/icons-react';
import { Group, Menu, Skeleton } from '@mantine/core';
import Link from 'next/link';
import { useAppNavigation } from '../../../hooks/useAppNavigation';
import { IPageItem } from '../../../types/responses/frontend/frontend.types';

interface IMenuItemProps {
    item: IPageItem;
    childPages: IPageItem[];
}

function MenuItem({ item, childPages }: IMenuItemProps) {
    const hasChildren = childPages.length > 0;

    if (hasChildren) {
        return (
            <Menu key={item.id_pages} trigger="hover" withinPortal>
                <Menu.Target>
                    <div className="group flex items-center px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200 cursor-pointer">
                        <span className="mr-2">{item.keyword}</span>
                        <IconChevronDown 
                            size={16} 
                            className="text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-200 transition-colors duration-200" 
                            stroke={1.5} 
                        />
                    </div>
                </Menu.Target>
                <Menu.Dropdown className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg min-w-[200px]">
                    {childPages.map(child => (
                        <Menu.Item 
                            key={child.id_pages} 
                            component={Link} 
                            href={child.url}
                            className="text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-200 px-3 py-2"
                        >
                            {child.keyword}
                        </Menu.Item>
                    ))}
                </Menu.Dropdown>
            </Menu>
        );
    }

    return (
        <Link 
            key={item.id_pages} 
            href={item.url} 
            className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200"
        >
            {item.keyword}
        </Link>
    );
}

function MenuSkeleton() {
    return (
        <Group gap={8} className="hidden sm:flex items-center">
            {Array.from({ length: 4 }).map((_, index) => (
                <Skeleton key={index} height={36} width={80} radius="lg" />
            ))}
        </Group>
    );
}

export function WebsiteHeaderMenu() {
    const { menuPages, isLoading } = useAppNavigation();

    if (isLoading) {
        return <MenuSkeleton />;
    }

    // Build menu structure with parent-child relationships
    const menuItems = menuPages
        .filter(page => page.parent === null) // Get top-level items
        .map(item => {
            const childPages = menuPages
                .filter(child => child.parent === item.id_pages)
                .sort((a, b) => (a.nav_position ?? 0) - (b.nav_position ?? 0));
            
            return (
                <MenuItem key={item.id_pages} item={item} childPages={childPages} />
            );
        });

    return (
        <Group gap={8} visibleFrom="sm" className="hidden sm:flex items-center">
            {menuItems}
        </Group>
    );
}