'use client';

import { IconChevronDown } from '@tabler/icons-react';
import { Group, Menu, Skeleton, UnstyledButton, Text } from '@mantine/core';
import { InternalLink } from '../shared/InternalLink';
import { useAppNavigation } from '../../../hooks/useAppNavigation';
import { usePagePrefetch } from '../../../hooks/usePagePrefetch';
import { IPageItem } from '../../../types/responses/frontend/frontend.types';

interface IMenuItemProps {
    item: IPageItem;
}

// Helper function to get page title - use actual title from API or fallback to formatted keyword
const getPageTitle = (item: IPageItem): string => {
    // Use the actual title if available, otherwise format the keyword as fallback
    if (item.title && item.title.trim()) {
        return item.title;
    }
    // Fallback to formatted keyword
    return item.keyword.charAt(0).toUpperCase() + item.keyword.slice(1).replace(/_/g, ' ').replace(/-/g, ' ');
};

function MenuItem({ item }: IMenuItemProps) {
    const hasChildren = item.children && item.children.length > 0;
    const pageTitle = getPageTitle(item);
    const { createHoverPrefetch } = usePagePrefetch();

    if (hasChildren) {
        return (
            <Menu key={item.id_pages} trigger="hover" withinPortal>
                <Menu.Target>
                    <UnstyledButton>
                        <Group gap="xs">
                            <Text size="sm" fw={500}>{pageTitle}</Text>
                            <IconChevronDown size={16} stroke={1.5} />
                        </Group>
                    </UnstyledButton>
                </Menu.Target>
                <Menu.Dropdown>
                    {item.children?.map(child => (
                        <Menu.Item 
                            key={child.id_pages}
                            onMouseEnter={createHoverPrefetch(child.keyword)}
                        >
                            <InternalLink href={child.url}>
                                <Text size="sm">{getPageTitle(child)}</Text>
                            </InternalLink>
                        </Menu.Item>
                    ))}
                </Menu.Dropdown>
            </Menu>
        );
    }

    return (
        <InternalLink key={item.id_pages} href={item.url}>
            <UnstyledButton onMouseEnter={createHoverPrefetch(item.keyword)}>
                <Text size="sm" fw={500}>{pageTitle}</Text>
            </UnstyledButton>
        </InternalLink>
    );
}

function MenuSkeleton() {
    return (
        <Group gap="md" visibleFrom="sm">
            {Array.from({ length: 4 }).map((_, index) => (
                <Skeleton key={index} height={24} width={80} />
            ))}
        </Group>
    );
}

export function WebsiteHeaderMenu() {
    const { menuPages, isLoading } = useAppNavigation();

    if (isLoading) {
        return <MenuSkeleton />;
    }

    // Use only top-level items (parent === null) since children are already included
    const menuItems = menuPages
        .filter(page => page.parent === null)
        .map(item => (
            <MenuItem key={item.id_pages} item={item} />
        ));

    return (
        <Group gap="md" visibleFrom="sm">
            {menuItems}
        </Group>
    );
}