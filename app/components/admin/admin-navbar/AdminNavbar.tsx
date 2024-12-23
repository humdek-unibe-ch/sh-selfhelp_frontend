"use client";

import { NavLink, ScrollArea } from '@mantine/core';
import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { useAppNavigation } from '@/hooks/useAppNavigation';
import { NavItem } from '@/types/navigation/navigation.types';
import { useNavigation } from "@refinedev/core";

export function AdminNavbar() {
    const pathname = usePathname();
    const [openItems, setOpenItems] = useState<string[]>([]);
    const { push } = useNavigation();
    const { navItems, isLoading } = useAppNavigation({ isAdmin: true });

    const handleClick = (link: string) => {
        push(link);
    };

    const toggleItem = (label: string) => {
        setOpenItems(prev =>
            prev.includes(label)
                ? prev.filter(item => item !== label)
                : [...prev, label]
        );
    };

    const renderNavItem = (item: NavItem) => {
        const isActive = pathname === item.link;
        const isOpen = openItems.includes(item.label);
        const hasNestedLinks = item.links && item.links.length > 0;
        const Icon = item.icon;

        return (
            <NavLink
                key={item.label}
                label={item.label}
                leftSection={Icon && <Icon size="1rem" stroke={1.5} />}
                childrenOffset={28}
                opened={isOpen}
                active={isActive}
                onClick={() => {
                    if (hasNestedLinks) {
                        toggleItem(item.label);
                    } else if (item.link) {
                        handleClick(item.link);
                    }
                }}
            >
                {hasNestedLinks && item.links?.map(renderNavItem)}
            </NavLink>
        );
    };

    if (isLoading) {
        return <div>Loading...</div>; // Consider using a proper loading skeleton
    }

    return (
        <ScrollArea className="bg-[var(--mantine-color-white)] dark:bg-[var(--mantine-color-dark-6)] h-[800px] w-[300px] p-[var(--mantine-spacing-md)] pb-0 flex flex-col border-r border-[var(--mantine-color-gray-3)] dark:border-[var(--mantine-color-dark-4)]">
            {navItems?.map(renderNavItem)}
        </ScrollArea>
    );
}
